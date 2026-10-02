# backend/modules/ecosistema_profesional/services/participantes.py
"""
Ciclo de vida de participantes de proyecto EP (EP-4E-E — E1).

Reglas aprobadas (§14.5, EP_MODELO_DATOS):
- Remover un participante: estado → 'removido' Y todas sus concesiones
  'activa' → 'revocada' en la MISMA transacción (revocado_por/at),
  con evento de auditoría por cada concesión + evento del retiro.
  La fila histórica nunca se borra.
- Reactivar: 'removido' → 'activo' recupera SOLO el nivel base del rol
  vigente; las concesiones revocadas NO reviven — re-otorgar crea
  fila nueva (E9).
- El propietario del proyecto no puede ser removido (§13.4.1).
- Gestión exige 'administrar' sobre 'participantes' (resolver).
- Sin commit aquí: la ruta confirma la transacción.
"""
import logging
from typing import Any, Dict
from uuid import UUID

from core.exceptions import (
    BusinessLogicError,
    OperationNotAllowedError,
    ResourceNotFoundError,
)
from shared.repositories import audit
from shared.repositories import ep_autorizacion as authz_repo
from shared.repositories import ep_proyectos as repo
from modules.ecosistema_profesional.services.proyectos import (
    _exige_admin_participantes,
)

logger = logging.getLogger("melantia.ep.participantes")


async def remover_participante(
    conn, usuario_id: str, proyecto_id: UUID, usuario_objetivo_id: UUID
) -> Dict[str, Any]:
    """
    ACTIVO → REMOVIDO con E1: revoca todas las concesiones activas del
    participante en la misma transacción y audita retiro + cada
    revocación. El propietario no puede ser removido (D-D3).
    """
    await _exige_admin_participantes(conn, usuario_id, proyecto_id)

    objetivo = await authz_repo.obtener_participante(
        conn, proyecto_id, usuario_objetivo_id
    )
    if not objetivo or objetivo["estado"] == "removido":
        raise ResourceNotFoundError("Participante", usuario_objetivo_id)
    if objetivo["rol"] == "propietario":
        raise OperationNotAllowedError(
            "remover_participante",
            "el propietario del proyecto no puede ser removido "
            "(transferencia de propiedad por flujo propio)",
        )

    # 1) retiro del participante
    actualizado = await repo.actualizar_estado_participante(
        conn, proyecto_id, usuario_objetivo_id, "removido"
    )
    # 2) E1: revocación masiva de sus concesiones activas
    revocadas = await repo.revocar_concesiones_participante(
        conn, objetivo["id"], revocado_por=usuario_id
    )
    # 3) auditoría: evento del retiro + uno por concesión revocada
    await audit.auditar_participante(
        conn, accion=audit.AccionEP.PARTICIPANTE_REMOVIDO,
        actor_id=usuario_id, proyecto_id=proyecto_id,
        participante_id=objetivo["id"], rol=objetivo["rol"],
        detalle_extra={
            "usuario_id": str(usuario_objetivo_id),
            "concesiones_revocadas": len(revocadas),
        },
    )
    for conc in revocadas:
        await audit.auditar_concesion(
            conn, otorgada=False, actor_id=usuario_id,
            proyecto_id=proyecto_id, concesion_id=conc["id"],
            participante_id=objetivo["id"],
            recurso_tipo=conc["recurso_tipo"],
            recurso_id=conc["recurso_id"], nivel=conc["nivel"],
            motivo="participante removido",
        )
    logger.info(
        "[PARTICIPANTE REMOVIDO] proyecto=%s usuario=%s "
        "concesiones_revocadas=%d",
        proyecto_id, usuario_objetivo_id, len(revocadas),
    )
    return {**actualizado, "concesiones_revocadas": len(revocadas)}


async def reactivar_participante(
    conn, usuario_id: str, proyecto_id: UUID, usuario_objetivo_id: UUID
) -> Dict[str, Any]:
    """
    REMOVIDO → ACTIVO (misma fila — D-D4). Recupera SOLO el nivel base
    del rol vigente; las concesiones quedan 'revocada' para siempre —
    nada que restaurar aquí (E1). Audita la reactivación.
    """
    await _exige_admin_participantes(conn, usuario_id, proyecto_id)

    objetivo = await authz_repo.obtener_participante(
        conn, proyecto_id, usuario_objetivo_id
    )
    if not objetivo or objetivo["estado"] != "removido":
        raise ResourceNotFoundError("Participante", usuario_objetivo_id)
    if objetivo["rol"] == "propietario":
        raise BusinessLogicError(
            "El propietario no pasa por reactivación (nunca removido)."
        )

    actualizado = await repo.actualizar_estado_participante(
        conn, proyecto_id, usuario_objetivo_id, "activo"
    )
    await audit.auditar_participante(
        conn, accion=audit.AccionEP.PARTICIPANTE_REACTIVADO,
        actor_id=usuario_id, proyecto_id=proyecto_id,
        participante_id=objetivo["id"], rol=objetivo["rol"],
        detalle_extra={
            "usuario_id": str(usuario_objetivo_id),
            "concesiones_restauradas": 0,   # E1: nunca reviven
        },
    )
    logger.info(
        "[PARTICIPANTE REACTIVADO] proyecto=%s usuario=%s — solo base",
        proyecto_id, usuario_objetivo_id,
    )
    return actualizado
