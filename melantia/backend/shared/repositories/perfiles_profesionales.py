# backend/shared/repositories/perfiles_profesionales.py
"""
Adaptador de persistencia para la identidad profesional (EP-4A).

Rol arquitectónico:
- `perfiles_profesionales` es un catálogo cerrado administrado por la
  capa admin (ADM); aquí solo se lee.
- `usuarios_perfiles` registra qué perfiles profesionales tiene cada
  usuario (multi-perfil, sin límite — UNIQUE(usuario_id, perfil_id)).
- Regla EP: `perfil_id` es la FK real (UUID); `codigo` es solo el
  identificador semántico para consultas humanas y gates.
- Las asignaciones viven en `shared/` porque la capa admin y los gates
  de entitlements (B5) las consumirán también.

Todas las funciones son async y reciben una conexión psycopg3 abierta
(la provee `database.get_db_connection` / la dependencia `get_db`).

Esquema consultado: backend/database/schema/ecosistema_profesional.sql
"""
from typing import Any, Dict, List, Optional
from uuid import UUID

from psycopg.rows import dict_row


async def listar_catalogo_activo(conn) -> List[Dict[str, Any]]:
    """Perfiles profesionales activos del catálogo, por código."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, codigo, nombre, descripcion, created_at
            FROM perfiles_profesionales
            WHERE activo = TRUE
            ORDER BY codigo
            """
        )
        return await cursor.fetchall()


async def obtener_perfil(
    conn, perfil_id: UUID
) -> Optional[Dict[str, Any]]:
    """Un perfil del catálogo por su UUID (incluye inactivos)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, codigo, nombre, descripcion, activo, created_at
            FROM perfiles_profesionales
            WHERE id = %s
            """,
            (str(perfil_id),),
        )
        return await cursor.fetchone()


async def listar_perfiles_usuario(
    conn, usuario_id: UUID
) -> List[Dict[str, Any]]:
    """Perfiles asignados al usuario, con datos del catálogo."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT up.id AS asignacion_id, up.perfil_id,
                   p.codigo, p.nombre, p.descripcion,
                   up.verificado, up.principal, up.created_at
            FROM usuarios_perfiles up
            JOIN perfiles_profesionales p ON p.id = up.perfil_id
            WHERE up.usuario_id = %s
            ORDER BY up.created_at
            """,
            (str(usuario_id),),
        )
        return await cursor.fetchall()


async def asignar_perfil(
    conn, usuario_id: UUID, perfil_id: UUID
) -> Dict[str, Any]:
    """
    Crea la asignación usuario↔perfil. Lanza psycopg UniqueViolation
    si la pareja ya existe (UNIQUE(usuario_id, perfil_id)).
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            INSERT INTO usuarios_perfiles (usuario_id, perfil_id)
            VALUES (%s, %s)
            RETURNING id AS asignacion_id, usuario_id, perfil_id,
                      verificado, principal, created_at
            """,
            (str(usuario_id), str(perfil_id)),
        )
        return await cursor.fetchone()


async def desasignar_perfil(
    conn, usuario_id: UUID, perfil_id: UUID
) -> bool:
    """Elimina la asignación del usuario. True si existía."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            DELETE FROM usuarios_perfiles
            WHERE usuario_id = %s AND perfil_id = %s
            RETURNING id
            """,
            (str(usuario_id), str(perfil_id)),
        )
        return await cursor.fetchone() is not None


async def tiene_perfil(conn, usuario_id: UUID, codigo: str) -> bool:
    """
    True si el usuario tiene asignado el perfil con ese `codigo`.
    Helper para gates futuros (entitlements B5, elegibilidad de roles).
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT 1
            FROM usuarios_perfiles up
            JOIN perfiles_profesionales p ON p.id = up.perfil_id
            WHERE up.usuario_id = %s AND p.codigo = %s AND p.activo = TRUE
            """,
            (str(usuario_id), codigo),
        )
        return await cursor.fetchone() is not None
