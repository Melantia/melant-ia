# backend/shared/repositories/auth_puente.py
"""
Repositorio de `usuarios_auth_puente` (D4.2 §5 — la única soldadura
entre autenticación Supabase y negocio MELANTIA).

Invariantes (ADR §12.2, F7a.1):
- id = auth.users.id — jamás generado localmente.
- Nunca auto-provisionar: un sub sin puente es 401, no alta.
- Todo el backend sigue recibiendo usuarios.id — auth.users.id no
  se propaga fuera de la capa auth.
- Sin commit: transacción del llamador (patrón audit.py).
"""
from typing import Any, Dict, Optional
from uuid import UUID

from psycopg.rows import dict_row


async def resolver_usuario_id(
    conn, auth_user_id: UUID
) -> Optional[Dict[str, Any]]:
    """
    Traducción central (D4.2 §5.2):

        JWT.sub (auth.users.id)
          → puente.id, estado='activo'
          → usuario_id (usuarios.id)

    Devuelve la fila {usuario_id, estado} si existe el vínculo;
    None si no hay puente. El chequeo de estado lo hace el caller
    (suspendido → 403, inexistente → 401 — mensajes distintos).
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT usuario_id, estado
            FROM usuarios_auth_puente
            WHERE id = %s
            """,
            (str(auth_user_id),),
        )
        return await cursor.fetchone()


async def buscar_puente_por_cedula(
    conn, cedula_canonica: str
) -> Optional[Dict[str, Any]]:
    """
    Lookup por identidad canónica (`NAT:…` / `JUR:…`) — el dedup de
    la saga de registro (§22.5): distingue cuenta completa de
    huérfano local. `cedula_ruc` es UNIQUE sobre el canónico.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, usuario_id, cedula_ruc, estado, vinculado_por
            FROM usuarios_auth_puente
            WHERE cedula_ruc = %s
            """,
            (cedula_canonica,),
        )
        return await cursor.fetchone()


async def crear_vinculo(
    conn,
    auth_user_id: UUID,
    usuario_id: UUID,
    cedula_ruc: str,
    rol_id: Optional[UUID] = None,
    vinculado_por: str = "registro",
) -> Dict[str, Any]:
    """
    Crea el vínculo auth.users ↔ usuarios (TX2 de la saga §7.2).

    `auth_user_id` viene de Supabase (PK sin default local).
    UniqueViolation de usuario_id/cedula_ruc se propaga al caller
    — es la señal de dedup (409) de la saga.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            INSERT INTO usuarios_auth_puente
                (id, usuario_id, cedula_ruc, rol_id, vinculado_por)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, usuario_id, estado, vinculado_en
            """,
            (
                str(auth_user_id),
                str(usuario_id),
                cedula_ruc,
                str(rol_id) if rol_id else None,
                vinculado_por,
            ),
        )
        return await cursor.fetchone()


async def registrar_acceso(conn, auth_user_id: UUID) -> None:
    """Marca ultimo_acceso_en tras un login exitoso (§8 paso 5)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE usuarios_auth_puente
            SET ultimo_acceso_en = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (str(auth_user_id),),
        )


async def cambiar_estado(
    conn,
    auth_user_id: UUID,
    estado: str,
) -> Optional[Dict[str, Any]]:
    """
    Suspende/revoca/reactiva el vínculo (nunca DELETE — el
    historial del vínculo se conserva; estado != 'activo' corta la
    traducción en resolver_usuario_id).
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE usuarios_auth_puente
            SET estado = %s
            WHERE id = %s
            RETURNING id, usuario_id, estado
            """,
            (estado, str(auth_user_id)),
        )
        return await cursor.fetchone()
