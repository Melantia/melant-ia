# backend/modules/gestion_fincas/routes/geografia.py
"""
Endpoints de solo lectura del catálogo geográfico DPA/INEC.

Sirven a los formularios de ubicación (fincas, registro de usuario,
levantamientos). Requieren JWT como el resto de la API; los datos son
de catálogo, sin aislamiento por usuario.
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query

from core.dependencies import get_current_user, get_db
from modules.gestion_fincas.schemas.geografia import (
    CantonResponse,
    ParroquiaResponse,
    ProvinciaResponse,
)
from modules.gestion_fincas.services import geografia as svc

router = APIRouter(prefix="/geografia", tags=["Catálogo Geográfico"])


@router.get("/provincias", response_model=list[ProvinciaResponse])
async def listar_provincias(
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Las 24 provincias del catálogo DPA/INEC."""
    conn, _ = db
    return await svc.listar_provincias(conn)


@router.get("/cantones", response_model=list[CantonResponse])
async def listar_cantones(
    provincia_id: Optional[int] = Query(None, ge=1),
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Cantones, opcionalmente filtrados por provincia."""
    conn, _ = db
    return await svc.listar_cantones(conn, provincia_id)


@router.get("/parroquias", response_model=list[ParroquiaResponse])
async def listar_parroquias(
    canton_id: Optional[int] = Query(None, ge=1),
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Parroquias, opcionalmente filtradas por cantón."""
    conn, _ = db
    return await svc.listar_parroquias(conn, canton_id)
