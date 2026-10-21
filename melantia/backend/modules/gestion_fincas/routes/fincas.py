# backend/modules/gestion_fincas/routes/fincas.py
"""
Endpoints de fincas y lotes del Módulo 3.

Router delgado: sin SQL ni reglas — toda la coordinación vive en
services/. Todo requiere JWT; el usuario solo opera sobre sus propias
fincas (404 indistinguible para ajenas).

Sin DELETE físico: el borrado de registros productivos llegará como
soft-delete junto con los metadatos de sincronización (pendiente del
hito offline-first, ver registro 2026-10-21 del master FULL).
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status

from core.dependencies import get_current_user, get_db
from modules.gestion_fincas.schemas.fincas import (
    FincaCreate,
    FincaDetalleResponse,
    FincaResponse,
    FincaUpdate,
)
from modules.gestion_fincas.schemas.lotes import (
    LoteCreate,
    LoteResponse,
    LoteUpdate,
)
from modules.gestion_fincas.services import fincas as svc
from modules.gestion_fincas.services import lotes as lotes_svc

router = APIRouter(prefix="/fincas", tags=["Gestión de Fincas"])


@router.post(
    "", response_model=FincaResponse,
    status_code=status.HTTP_201_CREATED,
)
async def crear_finca(
    data: FincaCreate,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Crea una finca del usuario autenticado."""
    conn, _ = db
    return await svc.crear_finca(conn, usuario_id, data)


@router.get("", response_model=list[FincaResponse])
async def listar_fincas(
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Fincas del usuario autenticado, con conteos de lotes y hatos."""
    conn, _ = db
    return await svc.listar_mias(conn, usuario_id)


@router.get("/{finca_id}", response_model=FincaDetalleResponse)
async def obtener_finca(
    finca_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Detalle de una finca propia con sus lotes. 404 si es ajena."""
    conn, _ = db
    return await svc.obtener_finca(conn, finca_id, usuario_id)


@router.patch("/{finca_id}", response_model=FincaResponse)
async def actualizar_finca(
    finca_id: UUID,
    data: FincaUpdate,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Edita campos permitidos de una finca propia (nunca el dueño)."""
    conn, _ = db
    return await svc.actualizar_finca(conn, finca_id, usuario_id, data)


@router.post(
    "/{finca_id}/lotes", response_model=LoteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def crear_lote(
    finca_id: UUID,
    data: LoteCreate,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Crea un lote en una finca del usuario autenticado."""
    conn, _ = db
    return await lotes_svc.crear_lote(conn, finca_id, usuario_id, data)


@router.get("/{finca_id}/lotes", response_model=list[LoteResponse])
async def listar_lotes(
    finca_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Lotes de una finca propia."""
    conn, _ = db
    return await lotes_svc.listar_lotes(conn, finca_id, usuario_id)


@router.patch(
    "/{finca_id}/lotes/{lote_id}", response_model=LoteResponse
)
async def actualizar_lote(
    finca_id: UUID,
    lote_id: UUID,
    data: LoteUpdate,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Edita un lote que cuelga de una finca propia."""
    conn, _ = db
    return await lotes_svc.actualizar_lote(
        conn, finca_id, lote_id, usuario_id, data
    )
