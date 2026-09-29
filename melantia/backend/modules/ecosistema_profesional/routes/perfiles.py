# backend/modules/ecosistema_profesional/routes/perfiles.py
"""
Endpoints de identidad profesional (EP-4A).

Router delgado: sin SQL ni reglas — toda la coordinación vive en
services/perfiles.py. Todos los endpoints requieren JWT y el usuario
solo gestiona sus propios perfiles profesionales.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status

from core.dependencies import get_current_user, get_db
from modules.ecosistema_profesional.schemas.perfiles import (
    AsignarPerfilRequest,
    PerfilAsignadoResponse,
    PerfilProfesionalResponse,
)
from modules.ecosistema_profesional.services import perfiles as svc

router = APIRouter(
    prefix="/perfiles", tags=["EP: Perfiles Profesionales"]
)


@router.get("", response_model=list[PerfilProfesionalResponse])
async def listar_catalogo(
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Catálogo de perfiles profesionales activos."""
    conn, _ = db
    return await svc.listar_catalogo(conn)


@router.get("/mios", response_model=list[PerfilAsignadoResponse])
async def listar_mis_perfiles(
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Perfiles profesionales asignados al usuario autenticado."""
    conn, _ = db
    return await svc.listar_mios(conn, usuario_id)


@router.post(
    "/mios",
    response_model=PerfilAsignadoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def asignar_perfil(
    data: AsignarPerfilRequest,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Asigna un perfil del catálogo al usuario (por perfil_id UUID)."""
    conn, _ = db
    return await svc.asignar_perfil(conn, usuario_id, data)


@router.delete("/mios/{perfil_id}", status_code=status.HTTP_204_NO_CONTENT)
async def desasignar_perfil(
    perfil_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Quita un perfil del usuario autenticado."""
    conn, _ = db
    await svc.desasignar_perfil(conn, usuario_id, perfil_id)
