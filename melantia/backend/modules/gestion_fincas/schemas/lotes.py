# backend/modules/gestion_fincas/schemas/lotes.py
"""Schemas de lotes del Módulo 3.

Campos espejo del DDL `schema/gestion_fincas.sql` (tabla `lotes`):
id, finca_id, nombre_lote, cultivo_principal, variedad,
fecha_siembra (DATE), area_metros_cuadrados (NUMERIC >= 0),
estado_salud_lote, created_at, updated_at.
"""
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LoteCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nombre_lote: str = Field(..., min_length=1, max_length=100)
    cultivo_principal: Optional[str] = Field(None, max_length=100)
    variedad: Optional[str] = Field(None, max_length=100)
    fecha_siembra: Optional[date] = None
    area_metros_cuadrados: Optional[float] = Field(None, ge=0)
    estado_salud_lote: Optional[str] = Field(None, max_length=100)


class LoteUpdate(BaseModel):
    """Todos opcionales; al menos uno debe venir (se valida en service)."""
    model_config = ConfigDict(extra="forbid")

    nombre_lote: Optional[str] = Field(None, min_length=1, max_length=100)
    cultivo_principal: Optional[str] = Field(None, max_length=100)
    variedad: Optional[str] = Field(None, max_length=100)
    fecha_siembra: Optional[date] = None
    area_metros_cuadrados: Optional[float] = Field(None, ge=0)
    estado_salud_lote: Optional[str] = Field(None, max_length=100)


class LoteResponse(BaseModel):
    id: UUID
    finca_id: UUID
    nombre_lote: str
    cultivo_principal: Optional[str] = None
    variedad: Optional[str] = None
    fecha_siembra: Optional[date] = None
    area_metros_cuadrados: Optional[float] = None
    estado_salud_lote: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
