# backend/shared/repositories/sesiones.py
"""
Repositorio de `sesiones` y `dispositivos` (F7a Fase ①).

Rol arquitectónico (decisión 21_DECISION_F7A1 §3-§6, §9):
- MELANTIA es la verdad de seguridad de la sesión: un JWT válido es
  condición necesaria, nunca suficiente — la autorización exige
  además sesiones.estado='activa'.
- La sesión NO depende de Supabase: funciona con
  auth_proveedor='local' ya hoy; la Fase ② poblará
  auth_session_id (claim de GoTrue) y refresh_token_enc.
- familia := auth_session_id cuando exista; en local la sesión es
  su propia familia (familia_id = id).
- Sesión absoluta 30 días: expires_at se fija en el INSERT con
  CURRENT_TIMESTAMP + INTERVAL '30 days' — no hay ventana
  deslizante ni parámetro que permita alargarla.

Atomicidad:
- Ninguna función hace commit(): quedan dentro de la transacción
  de la operación llamadora (mismo conn, patrón audit.py).
- Revocar es UPDATE sobre estados vivos, nunca DELETE: el
  historial de seguridad se conserva siempre.

Sin tokens en texto plano:
- refresh_token_enc solo recibe bytes ya cifrados por la capa de
  aplicación; este repositorio nunca acepta ni devuelve un RT
  legible.
"""
import uuid
from typing import Any, Dict, Optional
from uuid import UUID

from psycopg.rows import dict_row

SESION_TTL = "CURRENT_TIMESTAMP + INTERVAL '30 days'"


# ============================================================================
# DISPOSITIVOS
# ============================================================================

async def registrar_dispositivo(
    conn,
    usuario_id: UUID,
    nombre: Optional[str] = None,
    fingerprint_hash: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Registra un dispositivo conocido para el usuario.

    `fingerprint_hash` es un identificador derivado calculado por la
    app (Fase ②/③), no PII; NULL mientras no exista. La unicidad
    parcial (usuario_id, fingerprint_hash) la garantiza el DDL.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            INSERT INTO dispositivos (usuario_id, nombre, fingerprint_hash)
            VALUES (%s, %s, %s)
            RETURNING id, usuario_id, nombre, fingerprint_hash, estado,
                      registrado_at
            """,
            (str(usuario_id), nombre, fingerprint_hash),
        )
        return await cursor.fetchone()


async def revocar_dispositivo(
    conn,
    dispositivo_id: UUID,
    revocado_por: Optional[UUID] = None,
    motivo: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Marca un dispositivo como revocado conservando su historial.

    Solo afecta dispositivos 'activo'; devuelve None si ya estaba
    revocado (operación idempotente, sin excepción).
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE dispositivos
            SET estado = 'revocado',
                revocado_at = CURRENT_TIMESTAMP,
                revocado_por = %s,
                motivo_revocacion = %s
            WHERE id = %s AND estado = 'activo'
            RETURNING id, estado, revocado_at
            """,
            (
                str(revocado_por) if revocado_por else None,
                motivo,
                str(dispositivo_id),
            ),
        )
        return await cursor.fetchone()


async def obtener_dispositivo(
    conn, dispositivo_id: UUID
) -> Optional[Dict[str, Any]]:
    """
    Devuelve el dispositivo por id o None. Lo usa el login para
    reutilizar un dispositivo ya conocido del usuario (el caller
    verifica usuario_id y estado — un dispositivo ajeno o revocado
    se trata como nuevo, jamás se reasigna).
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, usuario_id, nombre, fingerprint_hash, estado,
                   registrado_at, revocado_at
            FROM dispositivos
            WHERE id = %s
            """,
            (str(dispositivo_id),),
        )
        return await cursor.fetchone()


# ============================================================================
# SESIONES
# ============================================================================

async def crear_sesion(
    conn,
    usuario_id: UUID,
    dispositivo_id: UUID,
    auth_proveedor: str = "local",
    auth_session_id: Optional[UUID] = None,
    refresh_token_enc: Optional[bytes] = None,
) -> Dict[str, Any]:
    """
    Crea una sesión MELANTIA.

    El id se genera en la aplicación para poder fijar familia_id en
    el mismo INSERT: con Supabase, familia_id = auth_session_id;
    en local, familia_id = id (la sesión es su propia familia).

    expires_at = created_at + 30 días fijos (F7a.1 §8) — se calcula
    en SQL para que nadie pueda inyectar una ventana deslizante.

    `refresh_token_enc` debe llegar YA cifrado (Fase ②); este repo
    jamás recibe el RT en texto plano.
    """
    sesion_id = uuid.uuid4()
    familia_id = auth_session_id if auth_session_id else sesion_id
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            INSERT INTO sesiones (
                id, usuario_id, dispositivo_id, auth_proveedor,
                auth_session_id, familia_id, refresh_token_enc,
                expires_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s,
                    CURRENT_TIMESTAMP + INTERVAL '30 days')
            RETURNING id, usuario_id, dispositivo_id, auth_proveedor,
                      auth_session_id, familia_id, estado,
                      rotaciones_observadas, created_at, expires_at
            """,
            (
                str(sesion_id),
                str(usuario_id),
                str(dispositivo_id),
                auth_proveedor,
                str(auth_session_id) if auth_session_id else None,
                str(familia_id),
                refresh_token_enc,
            ),
        )
        return await cursor.fetchone()


async def obtener_sesion(conn, sesion_id: UUID) -> Optional[Dict[str, Any]]:
    """Devuelve la sesión por id o None."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, usuario_id, dispositivo_id, auth_proveedor,
                   auth_session_id, familia_id, estado,
                   rotaciones_observadas, ultimo_refresh_at, ultimo_ip,
                   created_at, expires_at, last_seen_at,
                   revocado_at, revocado_por, motivo_revocacion
            FROM sesiones
            WHERE id = %s
            """,
            (str(sesion_id),),
        )
        return await cursor.fetchone()


async def obtener_sesion_por_auth_session_id(
    conn, auth_session_id: UUID
) -> Optional[Dict[str, Any]]:
    """
    Resuelve la sesión MELANTIA a partir del claim session_id del
    JWT de Supabase (Fase ②). Es el lookup del invariante
    JWT-válido + sesión-activa.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, usuario_id, dispositivo_id, auth_proveedor,
                   auth_session_id, familia_id, estado,
                   rotaciones_observadas, ultimo_refresh_at, ultimo_ip,
                   created_at, expires_at, last_seen_at,
                   revocado_at, revocado_por, motivo_revocacion
            FROM sesiones
            WHERE auth_session_id = %s
            """,
            (str(auth_session_id),),
        )
        return await cursor.fetchone()


async def registrar_rotacion(conn, sesion_id: UUID) -> Optional[Dict[str, Any]]:
    """
    Registra un refresh observado sobre una sesión viva
    (F7a.1 §4): rotaciones_observadas += 1, ultimo_refresh_at = now.

    Solo opera sobre 'activa'/'sospechosa': un refresh contra
    sesión revocada/expirada devuelve None → el caller rechaza.
    La detección de colisión (ROTATION_MIN_GAP) es decisión del
    servicio, no de este repositorio.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE sesiones
            SET rotaciones_observadas = rotaciones_observadas + 1,
                ultimo_refresh_at = CURRENT_TIMESTAMP
            WHERE id = %s AND estado IN ('activa', 'sospechosa')
            RETURNING id, rotaciones_observadas, ultimo_refresh_at
            """,
            (str(sesion_id),),
        )
        return await cursor.fetchone()


async def registrar_uso(
    conn,
    sesion_id: UUID,
    ip: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Actualiza last_seen_at (y ultimo_ip si se informa) — señal de
    detección (§4), nunca mecanismo de bloqueo por sí sola.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE sesiones
            SET last_seen_at = CURRENT_TIMESTAMP,
                ultimo_ip = COALESCE(%s::inet, ultimo_ip)
            WHERE id = %s
            RETURNING id, last_seen_at, ultimo_ip
            """,
            (ip, str(sesion_id)),
        )
        return await cursor.fetchone()


async def revocar_sesion(
    conn,
    sesion_id: UUID,
    revocado_por: Optional[UUID] = None,
    motivo: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Revoca una sesión conservando el historial (F7a.1 §5).

    Solo actúa sobre estados vivos ('activa','sospechosa'): si ya
    estaba revocada/expirada devuelve None. revocado_por=None +
    actor_tipo='sistema' en audit_eventos cubre la revocación
    automática.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE sesiones
            SET estado = 'revocada',
                revocado_at = CURRENT_TIMESTAMP,
                revocado_por = %s,
                motivo_revocacion = %s
            WHERE id = %s AND estado IN ('activa', 'sospechosa')
            RETURNING id, estado, revocado_at, revocado_por,
                      motivo_revocacion
            """,
            (
                str(revocado_por) if revocado_por else None,
                motivo,
                str(sesion_id),
            ),
        )
        return await cursor.fetchone()


async def marcar_sospechosa(
    conn,
    sesion_id: UUID,
    motivo: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Marca una sesión activa como 'sospechosa' (colisión de refresh,
    dispositivo nuevo, ubicación inusual — F7a.1 §4). El caller
    decide el efecto (re-auth forzado); aquí solo cambia el estado.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE sesiones
            SET estado = 'sospechosa',
                motivo_revocacion = %s
            WHERE id = %s AND estado = 'activa'
            RETURNING id, estado, motivo_revocacion
            """,
            (motivo, str(sesion_id)),
        )
        return await cursor.fetchone()


async def expirar_sesiones_vencidas(conn) -> list:
    """
    Barrido del tope absoluto: pasa a 'expirada' toda sesión viva
    cuyo expires_at ya venció (30 d, §8). Devuelve los id
    expirados. Lo invoca el servicio/worker — no hay trigger: la
    marca de expiración también es parte del historial.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE sesiones
            SET estado = 'expirada'
            WHERE estado IN ('activa', 'sospechosa')
              AND expires_at <= CURRENT_TIMESTAMP
            RETURNING id
            """,
        )
        return await cursor.fetchall()
