# backend/shared/repositories/ep_proyectos.py
"""
Adaptador de persistencia para proyectos EP y sus concesiones (EP-4E-D).

- `ep_proyectos` = la unidad de trabajo contextual.
- `ep_proyecto_concesiones` = grants (migración m3 EP-4E); aquí solo
  escritura — la LECTURA para autorización vive en
  shared/repositories/ep_autorizacion.py (no duplicar).
- Ninguna función hace commit: la transacción es del llamador.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from psycopg.rows import dict_row


async def obtener_proyecto(
    conn, proyecto_id: UUID
) -> Optional[Dict[str, Any]]:
    """Proyecto por id — sin filtro de acceso (eso es del resolver)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, workspace_id, nombre, descripcion, estado,
                   creado_por, fecha_inicio, fecha_objetivo,
                   created_at, updated_at
            FROM ep_proyectos
            WHERE id = %s
            """,
            (str(proyecto_id),),
        )
        return await cursor.fetchone()


async def obtener_lote(
    conn, lote_id: UUID
) -> Optional[Dict[str, Any]]:
    """Lote por id — lectura contextual; el vínculo ya lo verificó el
    resolver antes de llamar aquí (E5)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, finca_id, nombre_lote, cultivo_principal,
                   variedad, area_metros_cuadrados, estado_salud_lote,
                   created_at
            FROM lotes
            WHERE id = %s
            """,
            (str(lote_id),),
        )
        return await cursor.fetchone()


# ============================================================================
# CONCESIONES (escritura — lectura en ep_autorizacion.py)
# ============================================================================

async def crear_concesion(
    conn,
    proyecto_id: UUID,
    participante_id: UUID,
    recurso_tipo: str,
    nivel: str,
    otorgado_por: Optional[UUID],
    recurso_id: Optional[UUID] = None,
    vigente_hasta: Optional[datetime] = None,
) -> Dict[str, Any]:
    """
    Inserta concesión 'activa'. Lanza UniqueViolation si ya existe una
    activa equivalente (índices parciales E9) — el service traduce a 409.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            INSERT INTO ep_proyecto_concesiones
                (proyecto_id, participante_id, recurso_tipo, recurso_id,
                 nivel, otorgado_por, vigente_hasta)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, proyecto_id, participante_id, recurso_tipo,
                      recurso_id, nivel, otorgado_por, vigente_hasta,
                      estado, created_at
            """,
            (
                str(proyecto_id), str(participante_id), recurso_tipo,
                str(recurso_id) if recurso_id else None, nivel,
                str(otorgado_por) if otorgado_por else None,
                vigente_hasta,
            ),
        )
        return await cursor.fetchone()


async def obtener_concesion(
    conn, proyecto_id: UUID, concesion_id: UUID
) -> Optional[Dict[str, Any]]:
    """Concesión por id dentro del proyecto (aislamiento por pareja)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, proyecto_id, participante_id, recurso_tipo,
                   recurso_id, nivel, otorgado_por, vigente_hasta,
                   estado, revocado_por, revocado_at, created_at
            FROM ep_proyecto_concesiones
            WHERE id = %s AND proyecto_id = %s
            """,
            (str(concesion_id), str(proyecto_id)),
        )
        return await cursor.fetchone()


async def revocar_concesion(
    conn, concesion_id: UUID, revocado_por: UUID
) -> Optional[Dict[str, Any]]:
    """
    Marca la concesión como 'revocada' con trazabilidad (E1/E9).
    Nunca borra la fila — queda como historial.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE ep_proyecto_concesiones
            SET estado = 'revocada',
                revocado_por = %s,
                revocado_at = CURRENT_TIMESTAMP
            WHERE id = %s AND estado = 'activa'
            RETURNING id, proyecto_id, participante_id, recurso_tipo,
                      recurso_id, nivel, estado, revocado_por,
                      revocado_at, created_at
            """,
            (str(revocado_por), str(concesion_id)),
        )
        return await cursor.fetchone()


async def revocar_concesiones_participante(
    conn, participante_id: UUID, revocado_por: Optional[UUID]
) -> List[Dict[str, Any]]:
    """
    E1 — revocación masiva atómica al remover un participante: todas
    sus concesiones 'activa' pasan a 'revocada' con trazabilidad.
    Devuelve las filas afectadas para auditar cada una. La misma
    transacción del llamador las hace todo-o-nada con el retiro.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE ep_proyecto_concesiones
            SET estado = 'revocada',
                revocado_por = %s,
                revocado_at = CURRENT_TIMESTAMP
            WHERE participante_id = %s AND estado = 'activa'
            RETURNING id, participante_id, recurso_tipo, recurso_id,
                      nivel, estado
            """,
            (str(revocado_por) if revocado_por else None,
             str(participante_id)),
        )
        return await cursor.fetchall()


# ============================================================================
# PARTICIPANTES — ciclo de vida (EP-4E-E)
# ============================================================================

async def actualizar_estado_participante(
    conn, proyecto_id: UUID, usuario_id: UUID, estado: str
) -> Optional[Dict[str, Any]]:
    """Cambia el estado de una participación (activo/removido/invitado)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE ep_proyecto_participantes
            SET estado = %s
            WHERE proyecto_id = %s AND usuario_id = %s
            RETURNING id, proyecto_id, usuario_id, rol, estado,
                      asignado_por, created_at
            """,
            (estado, str(proyecto_id), str(usuario_id)),
        )
        return await cursor.fetchone()
