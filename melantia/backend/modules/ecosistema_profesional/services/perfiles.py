# backend/modules/ecosistema_profesional/services/perfiles.py
"""
Servicio de identidad profesional (EP-4A).

Coordina: router -> este servicio -> shared/repositories/perfiles.

Reglas de negocio:
- El catálogo `perfiles_profesionales` es cerrado: solo se asignan
  perfiles existentes y activos (su gestión CRUD pertenece a la capa
  administrativa ADM, no al usuario).
- La asignación se hace por `perfil_id` (UUID real); `codigo` nunca
  sustituye la FK.
- Un usuario puede tener varios perfiles; repetir la misma pareja
  responde 409 (UNIQUE(usuario_id, perfil_id)).
- `verificado`/`principal` no se modifican aquí: la verificación de
  credenciales profesionales es una función administrativa futura.
- Sin escrituras a `audit_eventos`: los writers llegan con ADM-2.
"""
import logging
from typing import Any, Dict, List
from uuid import UUID

from psycopg.errors import UniqueViolation

from core.exceptions import (
    DuplicateResourceError,
    ResourceNotFoundError,
)
from modules.ecosistema_profesional.schemas.perfiles import (
    AsignarPerfilRequest,
)
from shared.repositories import perfiles_profesionales as repo

logger = logging.getLogger("melantia.ep.perfiles")


async def listar_catalogo(conn) -> List[Dict[str, Any]]:
    """Catálogo de perfiles activos disponibles para asignarse."""
    return await repo.listar_catalogo_activo(conn)


async def listar_mios(conn, usuario_id: str) -> List[Dict[str, Any]]:
    """Perfiles profesionales del usuario autenticado."""
    return await repo.listar_perfiles_usuario(conn, usuario_id)


async def asignar_perfil(
    conn, usuario_id: str, data: AsignarPerfilRequest
) -> Dict[str, Any]:
    """
    Asigna un perfil activo del catálogo al usuario autenticado.
    Perfil inexistente o inactivo → 404. Duplicado → 409.
    """
    perfil = await repo.obtener_perfil(conn, data.perfil_id)
    if not perfil or not perfil["activo"]:
        raise ResourceNotFoundError("Perfil profesional", data.perfil_id)

    try:
        asignacion = await repo.asignar_perfil(
            conn, usuario_id, data.perfil_id
        )
    except UniqueViolation:
        await conn.rollback()
        raise DuplicateResourceError(
            "Asignación de perfil", str(data.perfil_id)
        )

    await conn.commit()
    logger.info(
        "[PERFIL ASIGNADO] usuario=%s perfil=%s (%s)",
        usuario_id, data.perfil_id, perfil["codigo"],
    )
    return {
        **asignacion,
        "codigo": perfil["codigo"],
        "nombre": perfil["nombre"],
        "descripcion": perfil["descripcion"],
    }


async def desasignar_perfil(
    conn, usuario_id: str, perfil_id: UUID
) -> None:
    """Quita un perfil del usuario. Si no lo tenía asignado → 404."""
    eliminado = await repo.desasignar_perfil(conn, usuario_id, perfil_id)
    if not eliminado:
        raise ResourceNotFoundError("Asignación de perfil", perfil_id)
    await conn.commit()
