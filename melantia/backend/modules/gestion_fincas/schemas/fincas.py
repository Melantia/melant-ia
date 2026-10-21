# backend/modules/gestion_fincas/schemas/fincas.py
"""Schemas de fincas del Módulo 3.

Campos espejo del DDL `schema/gestion_fincas.sql` (tabla `fincas`):
id, usuario_id, nombre, provincia_id, canton_id, parroquia_id,
coordenadas_gps (TEXT), ciiu_id, tipo_pyme, created_at, updated_at.

La ubicación admite enviar solo `parroquia_id`: el service deriva
cantón y provincia de la jerarquía DPA/INEC y valida la coherencia
cuando el cliente envía más de un nivel.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from modules.gestion_fincas.schemas.lotes import LoteResponse


class FincaCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nombre: str = Field(..., min_length=1, max_length=150)
    provincia_id: Optional[int] = None
    canton_id: Optional[int] = None
    parroquia_id: Optional[int] = None
    coordenadas_gps: Optional[str] = Field(None, max_length=200)
    ciiu_id: Optional[int] = None
    tipo_pyme: Optional[str] = Field(None, max_length=100)


class FincaUpdate(BaseModel):
    """Todos opcionales; al menos uno debe venir (se valida en service).

    `usuario_id` NO es editable: no existe en este schema y
    extra="forbid" rechaza el intento con 422.
    """
    model_config = ConfigDict(extra="forbid")

    nombre: Optional[str] = Field(None, min_length=1, max_length=150)
    provincia_id: Optional[int] = None
    canton_id: Optional[int] = None
    parroquia_id: Optional[int] = None
    coordenadas_gps: Optional[str] = Field(None, max_length=200)
    ciiu_id: Optional[int] = None
    tipo_pyme: Optional[str] = Field(None, max_length=100)


class FincaResponse(BaseModel):
    id: UUID
    nombre: str
    tipo_pyme: Optional[str] = None
    provincia_id: Optional[int] = None
    canton_id: Optional[int] = None
    parroquia_id: Optional[int] = None
    provincia: Optional[str] = None
    canton: Optional[str] = None
    parroquia: Optional[str] = None
    coordenadas_gps: Optional[str] = None
    ciiu_id: Optional[int] = None
    num_lotes: Optional[int] = None
    num_hatos: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class FincaDetalleResponse(FincaResponse):
    lotes: List[LoteResponse] = []
