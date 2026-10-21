# backend/modules/gestion_fincas/schemas/geografia.py
"""Schemas del catálogo geográfico DPA/INEC (solo lectura)."""
from pydantic import BaseModel


class ProvinciaResponse(BaseModel):
    id: int
    nombre: str
    codigo_inec: str


class CantonResponse(BaseModel):
    id: int
    provincia_id: int
    nombre: str
    codigo_inec: str


class ParroquiaResponse(BaseModel):
    id: int
    canton_id: int
    nombre: str
    codigo_inec: str
