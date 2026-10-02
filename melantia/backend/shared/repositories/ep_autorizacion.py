# backend/shared/repositories/ep_autorizacion.py
"""
Adaptador de persistencia para la autorización contextual EP (EP-4E-A).

Rol arquitectónico:
- `ep_proyecto_participantes` = membresía con rol y estado
  (invitado/activo/removido); el resolver solo lee.
- `ep_proyecto_concesiones` = grants contextuales activos/revocados
  (EP-4E, migración m3). El service decide semántica; aquí solo se
  filtra lo que físicamente puede resolver: estado='activa',
  vigente_hasta no cumplido, recurso_id NULL (tipo) o igual a la
  instancia pedida.
- Vínculos `ep_proyecto_<tipo>` = existencia de la instancia dentro del
  contexto del proyecto (sin vínculo vivo, ni base ni grant resuelven
  sobre esa instancia — §14.4, D-D7).

Esquema consultado: backend/database/schema/ecosistema_profesional.sql
"""
from typing import Any, Dict, List, Optional
from uuid import UUID

from psycopg.rows import dict_row

# Tipos con tabla de vínculo física → (tabla, columna del recurso).
# Los nombres salen de este mapa interno (nunca del cliente), por lo que
# interpolarlos en el SQL no abre inyección.
VINCULOS: Dict[str, tuple] = {
    "finca": ("ep_proyecto_fincas", "finca_id"),
    "lote": ("ep_proyecto_lotes", "lote_id"),
    "levantamiento": ("ep_proyecto_levantamientos", "levantamiento_id"),
    "registro": ("ep_proyecto_registros", "registro_id"),
}


async def obtener_participante(
    conn, proyecto_id: UUID, usuario_id: UUID
) -> Optional[Dict[str, Any]]:
    """Participación (usuario, proyecto) si existe — cualquier estado."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, proyecto_id, usuario_id, rol, estado, created_at
            FROM ep_proyecto_participantes
            WHERE proyecto_id = %s AND usuario_id = %s
            """,
            (str(proyecto_id), str(usuario_id)),
        )
        return await cursor.fetchone()


async def concesiones_aplicables(
    conn, participante_id: UUID, recurso_tipo: str,
    recurso_id: Optional[UUID],
) -> List[Dict[str, Any]]:
    """
    Concesiones que físicamente pueden elevar el nivel: estado 'activa',
    vigente (vigente_hasta NULL o futura) y cuyo recurso_id es NULL
    (aplica a todo el tipo) o coincide con la instancia consultada.
    Las 'revocada' jamás llegan al resolver (E1).
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, recurso_tipo, recurso_id, nivel, vigente_hasta
            FROM ep_proyecto_concesiones
            WHERE participante_id = %s
              AND recurso_tipo = %s
              AND estado = 'activa'
              AND (vigente_hasta IS NULL
                   OR vigente_hasta > CURRENT_TIMESTAMP)
              AND (recurso_id IS NULL OR recurso_id = %s)
            """,
            (str(participante_id), recurso_tipo,
             str(recurso_id) if recurso_id else None),
        )
        return await cursor.fetchall()


async def existe_vinculo(
    conn, proyecto_id: UUID, recurso_tipo: str, recurso_id: UUID
) -> bool:
    """
    True si la instancia está vinculada al proyecto por su tabla
    `ep_proyecto_<tipo>`. Solo aplica a tipos con vínculo físico
    (VINCULOS); para otros tipos el service no invoca esta función.
    """
    tabla, columna = VINCULOS[recurso_tipo]
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            f"SELECT 1 FROM {tabla} "
            f"WHERE proyecto_id = %s AND {columna} = %s",
            (str(proyecto_id), str(recurso_id)),
        )
        return await cursor.fetchone() is not None


async def propietario_workspace_ancla(
    conn, proyecto_id: UUID
) -> Optional[UUID]:
    """
    propietario_id del workspace ancla del proyecto (herencia única
    Workspace → Proyecto: lectura completa, D-C3/§14.4). None si el
    proyecto es personal (workspace_id NULL) o no existe.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT w.propietario_id
            FROM ep_proyectos p
            JOIN workspaces w ON w.id = p.workspace_id
            WHERE p.id = %s
            """,
            (str(proyecto_id),),
        )
        fila = await cursor.fetchone()
        return fila["propietario_id"] if fila else None


async def obtener_actividad_proyecto(
    conn, proyecto_id: UUID, actividad_id: UUID
) -> Optional[Dict[str, Any]]:
    """
    Actividad si pertenece al proyecto (contexto suave D9) — devuelve
    responsable_id para la resolución "asignada" (E6). None si la
    actividad no existe o no pertenece a este proyecto.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, responsable_id
            FROM actividades
            WHERE id = %s AND contexto_tipo = 'proyecto'
              AND contexto_id = %s
            """,
            (str(actividad_id), str(proyecto_id)),
        )
        return await cursor.fetchone()
