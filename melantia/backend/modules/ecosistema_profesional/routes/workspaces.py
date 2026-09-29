# backend/modules/ecosistema_profesional/routes/workspaces.py
"""
Endpoints de workspaces del EP (EP-4B).

Router delgado: sin SQL ni reglas — toda la coordinación vive en
services/workspaces.py. Todos los endpoints requieren JWT y el usuario
solo opera sobre workspaces donde es miembro.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status

from core.dependencies import get_current_user, get_db
from modules.ecosistema_profesional.schemas.workspaces import (
    ActualizarMiembroRequest,
    InvitarMiembroRequest,
    MiembroResponse,
    WorkspaceCreate,
    WorkspaceDetalleResponse,
    WorkspaceResponse,
    WorkspaceUpdate,
)
from modules.ecosistema_profesional.services import workspaces as svc

router = APIRouter(
    prefix="/workspaces", tags=["EP: Workspaces"]
)


@router.post(
    "", response_model=WorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def crear_workspace(
    data: WorkspaceCreate,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Crea un workspace; el creador queda como propietario activo."""
    conn, _ = db
    return await svc.crear_workspace(conn, usuario_id, data)


@router.get("", response_model=list[WorkspaceResponse])
async def listar_workspaces(
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Workspaces donde el usuario autenticado es miembro activo."""
    conn, _ = db
    return await svc.listar_mios(conn, usuario_id)


@router.get("/{workspace_id}", response_model=WorkspaceDetalleResponse)
async def obtener_workspace(
    workspace_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Detalle del workspace con su lista de miembros."""
    conn, _ = db
    return await svc.obtener_workspace(conn, workspace_id, usuario_id)


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def actualizar_workspace(
    workspace_id: UUID,
    data: WorkspaceUpdate,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Edita nombre/descripción — propietario o socio."""
    conn, _ = db
    return await svc.actualizar_workspace(
        conn, workspace_id, usuario_id, data
    )


@router.post(
    "/{workspace_id}/miembros",
    response_model=MiembroResponse,
    status_code=status.HTTP_201_CREATED,
)
async def invitar_miembro(
    workspace_id: UUID,
    data: InvitarMiembroRequest,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Invita a un usuario por su UUID (estado 'invitado')."""
    conn, _ = db
    return await svc.invitar_miembro(
        conn, workspace_id, usuario_id, data
    )


@router.post(
    "/{workspace_id}/aceptar", response_model=MiembroResponse
)
async def aceptar_invitacion(
    workspace_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """El invitado acepta su membresía (→ estado 'activo')."""
    conn, _ = db
    return await svc.aceptar_invitacion(conn, workspace_id, usuario_id)


@router.patch(
    "/{workspace_id}/miembros/{objetivo_id}",
    response_model=MiembroResponse,
)
async def actualizar_miembro(
    workspace_id: UUID,
    objetivo_id: UUID,
    data: ActualizarMiembroRequest,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Cambia rol/estado de un miembro — solo propietario."""
    conn, _ = db
    return await svc.actualizar_miembro(
        conn, workspace_id, usuario_id, objetivo_id,
        rol=data.rol, estado=data.estado,
    )


@router.delete(
    "/{workspace_id}/miembros/{objetivo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remover_miembro(
    workspace_id: UUID,
    objetivo_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Remueve un miembro (propietario) o salida propia → 'removido'."""
    conn, _ = db
    await svc.remover_miembro(conn, workspace_id, usuario_id, objetivo_id)
