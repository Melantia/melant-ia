# backend/modules/ecosistema_profesional/routes/proyectos.py
"""
Endpoints contextuales de proyectos EP — primera integración (EP-4E-D).

Cobertura mínima demostrable: lectura del proyecto, lectura de un
recurso vinculado (lote) por contexto, y gestión de concesiones
(otorgar/revocar) con auditoría en la misma transacción.

Toda autorización pasa por resolver_permiso vía require_ep_access;
los servicios no commitean — la ruta confirma tras service + audit.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status

from core.dependencies import get_current_user, get_db
from modules.ecosistema_profesional.dependencies import require_ep_access
from modules.ecosistema_profesional.schemas.proyectos import (
    ConcesionCreate,
    ConcesionResponse,
    LoteContextualResponse,
    ParticipanteResponse,
    ProyectoResponse,
)
from modules.ecosistema_profesional.services import participantes as svc_part
from modules.ecosistema_profesional.services import proyectos as svc

router = APIRouter(prefix="/proyectos", tags=["EP: Proyectos"])


@router.get("/{proyecto_id}", response_model=ProyectoResponse)
async def obtener_proyecto(
    proyecto_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
    _: str = Depends(require_ep_access("proyecto", "consulta")),
):
    conn, _ = db
    return await svc.obtener_proyecto(conn, usuario_id, proyecto_id)


@router.get(
    "/{proyecto_id}/lotes/{lote_id}",
    response_model=LoteContextualResponse,
)
async def obtener_lote_contextual(
    proyecto_id: UUID,
    lote_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
    _: str = Depends(require_ep_access(
        "lote", "consulta", recurso_id_param="lote_id")),
):
    conn, _ = db
    return await svc.obtener_lote_contextual(
        conn, usuario_id, proyecto_id, lote_id
    )


@router.post(
    "/{proyecto_id}/concesiones",
    response_model=ConcesionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def otorgar_concesion(
    proyecto_id: UUID,
    data: ConcesionCreate,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
    _: str = Depends(require_ep_access("participantes", "administrar")),
):
    conn, _ = db
    concesion = await svc.otorgar_concesion(
        conn, usuario_id, proyecto_id,
        usuario_destino_id=data.usuario_id,
        recurso_tipo=data.recurso_tipo,
        nivel=data.nivel,
        recurso_id=data.recurso_id,
        vigente_hasta=data.vigente_hasta,
    )
    await conn.commit()   # transacción: concesión + audit juntas
    return concesion


@router.post(
    "/{proyecto_id}/concesiones/{concesion_id}/revocar",
    response_model=ConcesionResponse,
)
async def revocar_concesion(
    proyecto_id: UUID,
    concesion_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
    _: str = Depends(require_ep_access("participantes", "administrar")),
):
    conn, _ = db
    revocada = await svc.revocar_concesion(
        conn, usuario_id, proyecto_id, concesion_id
    )
    await conn.commit()
    return revocada


# ============================================================================
# PARTICIPANTES — ciclo de vida con E1 (EP-4E-E)
# ============================================================================

@router.post(
    "/{proyecto_id}/participantes/{usuario_objetivo_id}/remover",
    response_model=ParticipanteResponse,
)
async def remover_participante(
    proyecto_id: UUID,
    usuario_objetivo_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
    _: str = Depends(require_ep_access("participantes", "administrar")),
):
    """ACTIVO → REMOVIDO + revocación masiva de concesiones (E1)."""
    conn, _ = db
    participante = await svc_part.remover_participante(
        conn, usuario_id, proyecto_id, usuario_objetivo_id
    )
    await conn.commit()   # retiro + revocaciones + audit en una tx
    return participante


@router.post(
    "/{proyecto_id}/participantes/{usuario_objetivo_id}/reactivar",
    response_model=ParticipanteResponse,
)
async def reactivar_participante(
    proyecto_id: UUID,
    usuario_objetivo_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
    _: str = Depends(require_ep_access("participantes", "administrar")),
):
    """REMOVIDO → ACTIVO recuperando solo el nivel base del rol."""
    conn, _ = db
    participante = await svc_part.reactivar_participante(
        conn, usuario_id, proyecto_id, usuario_objetivo_id
    )
    await conn.commit()
    return participante
