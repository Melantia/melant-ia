# backend/modules/asistente_tecnico/routes/levantamientos.py
"""
Endpoints de levantamientos GPS (ETAPA 2-B3).

Router delgado: sin SQL ni geometría — toda la coordinación vive en
services/levantamientos.py. Todos los endpoints requieren JWT y el
usuario solo accede a sus propios levantamientos.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status

from core.dependencies import get_current_user, get_db
from modules.asistente_tecnico.schemas.levantamientos import (
    LevantamientoCreate,
    LevantamientoDetalleResponse,
    LevantamientoResponse,
    PuntoGPSResponse,
    PuntosAgregar,
)
from modules.asistente_tecnico.services import levantamientos as svc

router = APIRouter(
    prefix="/levantamientos", tags=["Asistente: Levantamientos GPS"]
)


@router.post(
    "",
    response_model=LevantamientoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def crear_levantamiento(
    data: LevantamientoCreate,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Crea un levantamiento en 'borrador'."""
    conn, _ = db
    return await svc.crear_levantamiento(conn, usuario_id, data)


@router.get("", response_model=list[LevantamientoResponse])
async def listar_levantamientos(
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Levantamientos del usuario autenticado."""
    conn, _ = db
    return await svc.listar_levantamientos(conn, usuario_id)


@router.get(
    "/{levantamiento_id}", response_model=LevantamientoDetalleResponse
)
async def obtener_levantamiento(
    levantamiento_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Levantamiento completo con vértices ordenados."""
    conn, _ = db
    return await svc.obtener_levantamiento(conn, levantamiento_id, usuario_id)


@router.post(
    "/{levantamiento_id}/puntos",
    response_model=list[PuntoGPSResponse],
    status_code=status.HTTP_201_CREATED,
)
async def agregar_puntos(
    levantamiento_id: UUID,
    data: PuntosAgregar,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Anexa vértices GPS al levantamiento (solo en 'borrador')."""
    conn, _ = db
    return await svc.agregar_puntos(
        conn, levantamiento_id, usuario_id, data.puntos
    )


@router.post(
    "/{levantamiento_id}/calcular",
    response_model=LevantamientoDetalleResponse,
)
async def calcular_levantamiento(
    levantamiento_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Calcula área/perímetro con geodesia.area_poligono y cierra el levantamiento."""
    conn, _ = db
    return await svc.calcular_area(conn, levantamiento_id, usuario_id)


@router.post(
    "/{levantamiento_id}/aplicar",
    response_model=LevantamientoDetalleResponse,
)
async def aplicar_levantamiento(
    levantamiento_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Aplica el levantamiento 'cerrado' a su lote: escribe
    `lotes.area_metros_cuadrados` y pasa a 'aplicado'.
    Los vértices GPS y el cálculo se conservan intactos.
    """
    conn, _ = db
    return await svc.aplicar_levantamiento(conn, levantamiento_id, usuario_id)
