# backend/shared/repositories/workspaces.py
"""
Adaptador de persistencia para workspaces del EP (EP-4B).

Rol arquitectónico:
- `workspaces` = oficina profesional permanente (propietario + estado).
- `workspace_miembros` = membresía con rol (propietario/socio/
  colaborador) y estado (invitado/activo/removido); UNIQUE(ws, usuario).
- Toda lectura filtra por membresía del usuario: un workspace ajeno es
  indistinguible de uno inexistente.

Todas las funciones son async y reciben una conexión psycopg3 abierta
(la provee `database.get_db_connection` / la dependencia `get_db`).

Esquema consultado: backend/database/schema/ecosistema_profesional.sql
"""
from typing import Any, Dict, List, Optional
from uuid import UUID

from psycopg.rows import dict_row


# ============================================================================
# WORKSPACES
# ============================================================================

async def crear_workspace(
    conn, propietario_id: UUID, nombre: str, descripcion: Optional[str]
) -> Dict[str, Any]:
    """Crea el workspace en estado 'activo'."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            INSERT INTO workspaces (nombre, propietario_id, descripcion)
            VALUES (%s, %s, %s)
            RETURNING id, nombre, propietario_id, descripcion, estado,
                      created_at, updated_at
            """,
            (nombre, str(propietario_id), descripcion),
        )
        return await cursor.fetchone()


async def listar_workspaces_usuario(
    conn, usuario_id: UUID
) -> List[Dict[str, Any]]:
    """Workspaces donde el usuario es miembro activo, con su rol."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT w.id, w.nombre, w.descripcion, w.estado,
                   w.propietario_id, wm.rol AS mi_rol,
                   w.created_at, w.updated_at
            FROM workspaces w
            JOIN workspace_miembros wm
              ON wm.workspace_id = w.id AND wm.estado = 'activo'
            WHERE wm.usuario_id = %s
            ORDER BY w.created_at DESC
            """,
            (str(usuario_id),),
        )
        return await cursor.fetchall()


async def obtener_workspace(
    conn, workspace_id: UUID
) -> Optional[Dict[str, Any]]:
    """Workspace por id (sin filtro de membresía — lo decide el service)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, nombre, propietario_id, descripcion, estado,
                   created_at, updated_at
            FROM workspaces
            WHERE id = %s
            """,
            (str(workspace_id),),
        )
        return await cursor.fetchone()


async def actualizar_workspace(
    conn, workspace_id: UUID, nombre: Optional[str],
    descripcion: Optional[str],
) -> Optional[Dict[str, Any]]:
    """Actualiza campos editables (estado se gestiona aparte)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE workspaces
            SET nombre = COALESCE(%s, nombre),
                descripcion = COALESCE(%s, descripcion),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, nombre, propietario_id, descripcion, estado,
                      created_at, updated_at
            """,
            (nombre, descripcion, str(workspace_id)),
        )
        return await cursor.fetchone()


# ============================================================================
# MIEMBROS
# ============================================================================

async def obtener_miembro(
    conn, workspace_id: UUID, usuario_id: UUID
) -> Optional[Dict[str, Any]]:
    """Membresía (usuario, workspace) si existe — cualquier estado."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, workspace_id, usuario_id, rol, estado, created_at
            FROM workspace_miembros
            WHERE workspace_id = %s AND usuario_id = %s
            """,
            (str(workspace_id), str(usuario_id)),
        )
        return await cursor.fetchone()


async def listar_miembros(
    conn, workspace_id: UUID
) -> List[Dict[str, Any]]:
    """Miembros del workspace con datos públicos del usuario."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT wm.id, wm.workspace_id, wm.usuario_id, wm.rol,
                   wm.estado, wm.created_at,
                   u.nombre AS usuario_nombre
            FROM workspace_miembros wm
            JOIN usuarios u ON u.id = wm.usuario_id
            WHERE wm.workspace_id = %s
            ORDER BY wm.created_at
            """,
            (str(workspace_id),),
        )
        return await cursor.fetchall()


async def agregar_miembro(
    conn, workspace_id: UUID, usuario_id: UUID, rol: str
) -> Dict[str, Any]:
    """
    Inserta membresía en estado 'invitado'. Lanza UniqueViolation si la
    pareja ya existe y ForeignKeyViolation si el usuario no existe.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            INSERT INTO workspace_miembros (workspace_id, usuario_id, rol)
            VALUES (%s, %s, %s)
            RETURNING id, workspace_id, usuario_id, rol, estado,
                      created_at
            """,
            (str(workspace_id), str(usuario_id), rol),
        )
        return await cursor.fetchone()


async def actualizar_miembro(
    conn, workspace_id: UUID, usuario_id: UUID,
    rol: Optional[str], estado: Optional[str],
) -> Optional[Dict[str, Any]]:
    """Actualiza rol/estado de una membresía existente."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE workspace_miembros
            SET rol = COALESCE(%s, rol),
                estado = COALESCE(%s, estado)
            WHERE workspace_id = %s AND usuario_id = %s
            RETURNING id, workspace_id, usuario_id, rol, estado,
                      created_at
            """,
            (rol, estado, str(workspace_id), str(usuario_id)),
        )
        return await cursor.fetchone()


async def contar_propietarios_activos(
    conn, workspace_id: UUID
) -> int:
    """Número de miembros con rol propietario en estado activo."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT COUNT(*) AS n
            FROM workspace_miembros
            WHERE workspace_id = %s AND rol = 'propietario'
              AND estado = 'activo'
            """,
            (str(workspace_id),),
        )
        fila = await cursor.fetchone()
        return fila["n"] if fila else 0


async def existe_usuario(conn, usuario_id: UUID) -> bool:
    """True si el usuario existe (validación previa a invitar)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            "SELECT 1 FROM usuarios WHERE id = %s", (str(usuario_id),)
        )
        return await cursor.fetchone() is not None
