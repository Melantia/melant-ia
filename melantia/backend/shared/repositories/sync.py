# backend/shared/repositories/sync.py
"""
Repositorio de la infraestructura de sincronización (m8/m9).

Tablas: sync_operaciones (ledger de idempotencia), sync_cambios
(changelog por scope), sync_cursors (contador transaccional),
dispositivos/sesiones (validación del sobre push).

Atomicidad (misma regla que audit.py / sesiones.py):
- Ninguna función hace commit() ni rollback(): quedan dentro de la
  transacción del servicio orquestador (mismo conn). Dominio +
  changelog + ledger confirman o revierten juntos.

Serialización: los JSONB se escriben ya serializados con el mismo
canon del payload_hash (shared/sync_canonical) — UUID→str,
fechas→isoformat, Decimal→float — así el snapshot del changelog es
JSON puro reproducible.
"""
import json
from typing import Any, Dict, Optional
from uuid import UUID

from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from shared.sync_canonical import _jsonable

_scope_cache = "usr:{}"


def scope_de_usuario(usuario_id: str) -> str:
    """Scope server-side: siempre derivado del token, nunca del body."""
    return _scope_cache.format(usuario_id)


def _jsonb(obj: Any) -> Jsonb:
    """Envuelve un dict/list para JSONB con serialización canónica."""
    return Jsonb(obj, dumps=lambda o: json.dumps(
        o, ensure_ascii=False, default=_jsonable))


# ============================================================================
# DISPOSITIVOS Y SESIÓN — validación del sobre push
# ============================================================================

async def dispositivo_activo_de_usuario(
    conn, dispositivo_id: UUID, usuario_id: str
) -> Optional[Dict[str, Any]]:
    """
    El dispositivo existe, es del usuario y está activo. Un id ajeno
    o inexistente devuelve None — el service responde 404
    indistinguible.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, usuario_id, nombre, estado
            FROM dispositivos
            WHERE id = %s AND usuario_id = %s AND estado = 'activo'
            """,
            (str(dispositivo_id), usuario_id),
        )
        return await cursor.fetchone()


async def sesion_autenticada_activa(
    conn, auth_session_id: UUID, usuario_id: str
) -> Optional[Dict[str, Any]]:
    """
    La sesión EXACTA del token presentado — no 'alguna activa' del
    usuario (corrección H-1).

    `auth_session_id` es el claim session_id del JWT ya verificado:
    identifica LA sesión creada para ese token. Además se exige
    usuario propietario, estado='activa' y expires_at>now — una
    'activa' vencida aún no barrida no pasa (M-1 del alcance sync).

    Devuelve la fila para que el service verifique
    dispositivo_id == device_id del sobre.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, usuario_id, dispositivo_id, auth_proveedor,
                   auth_session_id, estado, expires_at
            FROM sesiones
            WHERE auth_session_id = %s
              AND usuario_id = %s
              AND estado = 'activa'
              AND expires_at > CURRENT_TIMESTAMP
            """,
            (str(auth_session_id), usuario_id),
        )
        return await cursor.fetchone()


async def registrar_uso_dispositivo(conn, dispositivo_id: UUID) -> None:
    """last_seen_at del dispositivo (§9.1: el push lo actualiza)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            "UPDATE dispositivos SET last_seen_at = CURRENT_TIMESTAMP"
            " WHERE id = %s",
            (str(dispositivo_id),),
        )


# ============================================================================
# LEDGER — sync_operaciones (idempotencia)
# ============================================================================

async def insertar_operacion(
    conn,
    usuario_id: str,
    dispositivo_id: UUID,
    client_operation_id: UUID,
    payload_hash: str,
    entity_type: str,
    entity_id: Optional[UUID],
    accion: str,
) -> Dict[str, Any]:
    """
    Inserción especulativa de la reserva idempotente — PRIMER paso
    de la transacción de la operación. La UNIQUE
    (usuario_id, client_operation_id) es la garantía de exclusión:
    una segunda tx concurrente con la misma clave bloquea aquí hasta
    que la primera confirme o revierta (m8, semántica C).

    estado='applied' provisional + resultado NULL: la fila es
    invisible para otras transacciones hasta el commit; si la
    operación revierte, no queda rastro (semántica D). El resultado
    definitivo se fija con actualizar_resultado() antes del commit.

    No captura UniqueViolation: la propaga al service, que hace
    rollback y relee el ledger confirmado.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            INSERT INTO sync_operaciones (
                usuario_id, dispositivo_id, client_operation_id,
                payload_hash, entity_type, entity_id, accion, estado
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'applied')
            RETURNING id
            """,
            (
                usuario_id,
                str(dispositivo_id),
                str(client_operation_id),
                payload_hash,
                entity_type,
                str(entity_id) if entity_id is not None else None,
                accion,
            ),
        )
        return await cursor.fetchone()


async def obtener_operacion(
    conn, usuario_id: str, client_operation_id: UUID
) -> Optional[Dict[str, Any]]:
    """
    Lectura del ledger para el reintento: tras un UniqueViolation
    (la transacción abortada se revierte antes) devuelve la fila
    confirmada con su resultado para devolverlo como 'duplicate' o
    rechazar la reutilización de clave.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, payload_hash, estado, resultado, entity_id
            FROM sync_operaciones
            WHERE usuario_id = %s AND client_operation_id = %s
            """,
            (usuario_id, str(client_operation_id)),
        )
        return await cursor.fetchone()


async def actualizar_resultado_operacion(
    conn,
    operacion_id: UUID,
    resultado: Dict[str, Any],
    estado: str = "applied",
) -> None:
    """
    Fija el resultado definitivo del ledger — último paso antes del
    commit: la fila solo se hace visible con la operación completa,
    nunca como éxito parcial.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE sync_operaciones
            SET resultado = %s, estado = %s
            WHERE id = %s
            """,
            (_jsonb(resultado), estado, str(operacion_id)),
        )


# ============================================================================
# CURSOR Y CHANGELOG
# ============================================================================

async def siguiente_seq(conn, scope: str) -> int:
    """
    sync_next_seq(scope) — única vía de asignación de seq. Row lock
    de la fila del scope retenido hasta commit/rollback (m8 §4.6).
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute("SELECT sync_next_seq(%s)", (scope,))
        fila = await cursor.fetchone()
        return int(fila["sync_next_seq"])


async def insertar_cambio(
    conn,
    scope: str,
    seq: int,
    entity_type: str,
    entity_id: UUID,
    op: str,
    data: Optional[Dict[str, Any]],
    entity_version: Optional[int],
    actor_id: str,
) -> Dict[str, Any]:
    """
    Fila del changelog incremental. `data` es el snapshot del estado
    confirmado (upsert) o None (delete — no alcanzado en este
    incremento). Mismo conn que el dominio: atomicidad obligatoria.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            INSERT INTO sync_cambios (
                scope, seq, entity_type, entity_id, op, data,
                entity_version, actor_id
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING scope, seq, created_at
            """,
            (
                scope,
                seq,
                entity_type,
                str(entity_id),
                op,
                _jsonb(data) if data is not None else None,
                entity_version,
                actor_id,
            ),
        )
        return await cursor.fetchone()


async def ultimo_seq(conn, scope: str) -> Optional[int]:
    """
    last_seq actual del scope (post-commit de las ops del lote —
    pull_cursor_hint de la respuesta). None si el scope no tiene
    cambios todavía.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            "SELECT last_seq FROM sync_cursors WHERE scope = %s",
            (scope,),
        )
        fila = await cursor.fetchone()
        return int(fila["last_seq"]) if fila else None


async def cambios_desde_cursor(
    conn, scope: str, cursor: int, limit_plus_one: int
) -> list:
    """
    Página incremental del changelog: todos los eventos del scope
    con seq > cursor, en orden ascendente. El caller pide limit+1
    para decidir has_more sin consulta extra. El stream se sirve
    COMPLETO — ningún filtro por entity_type puede ocultar seqs.
    """
    async with conn.cursor(row_factory=dict_row) as cur:
        await cur.execute(
            """
            SELECT seq, entity_type, entity_id, op, data,
                   entity_version
            FROM sync_cambios
            WHERE scope = %s AND seq > %s
            ORDER BY seq ASC
            LIMIT %s
            """,
            (scope, cursor, limit_plus_one),
        )
        return await cur.fetchall()


async def confirmar_pull_seq(
    conn, dispositivo_id: UUID, cursor: int, last_seq: int
) -> None:
    """
    ACK implícito del cursor enviado por el dispositivo
    (Alternativa B de la auditoría I-4): el cursor declara la
    última secuencia que el cliente ya persistió en su tx local.

    Monótono por dispositivo (GREATEST): una petición antigua o
    repetida jamás hace retroceder el valor. Con tope en last_seq
    (máximo confirmado del scope): el ACK nunca supera lo que el
    servidor confirmó — LEAST defensivo aunque el service ya
    rechaza cursores futuros.

    ultimo_pull_seq es metadato de seguimiento: NO es suelo seguro
    de purga (un dispositivo restaurado puede reenviar un cursor
    menor mientras el valor conserva el máximo anterior).
    """
    async with conn.cursor(row_factory=dict_row) as cur:
        await cur.execute(
            """
            UPDATE dispositivos
            SET ultimo_pull_seq = GREATEST(
                COALESCE(ultimo_pull_seq, 0), LEAST(%s, %s))
            WHERE id = %s
            """,
            (cursor, last_seq, str(dispositivo_id)),
        )


# ============================================================================
# SNAPSHOTS — estado confirmado de la entidad para el changelog
# ============================================================================

async def fila_finca(conn, finca_id: UUID) -> Optional[Dict[str, Any]]:
    """Fila completa de fincas (todos los campos, incl. metadatos m9)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            "SELECT * FROM fincas WHERE id = %s", (str(finca_id),)
        )
        return await cursor.fetchone()


async def fila_lote(conn, lote_id: UUID) -> Optional[Dict[str, Any]]:
    """Fila completa de lotes (todos los campos, incl. metadatos m9)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            "SELECT * FROM lotes WHERE id = %s", (str(lote_id),)
        )
        return await cursor.fetchone()


async def propietario_finca(conn, finca_id: UUID) -> Optional[str]:
    """
    usuario_id de una finca por id, o None si no existe — para
    distinguir 'ya existe mía' de 'ajena' tras un choque de PK sin
    revelar existencia de datos ajenos.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            "SELECT usuario_id FROM fincas WHERE id = %s",
            (str(finca_id),),
        )
        fila = await cursor.fetchone()
        return str(fila["usuario_id"]) if fila else None


async def propietario_lote(conn, lote_id: UUID) -> Optional[str]:
    """usuario_id dueño de un lote vía su finca, o None."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT f.usuario_id
            FROM lotes l JOIN fincas f ON f.id = l.finca_id
            WHERE l.id = %s
            """,
            (str(lote_id),),
        )
        fila = await cursor.fetchone()
        return str(fila["usuario_id"]) if fila else None
