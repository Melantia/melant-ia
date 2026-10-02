# backend/modules/asistente_tecnico/schemas/geodesia.py
"""Schemas para Geodesia: Levantamiento de Lote (13) y GPS (14)."""
from typing import List

from pydantic import BaseModel, Field


class PuntoGeo(BaseModel):
    """Coordenada geográfica WGS84 en grados decimales."""
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class DistanciaRequest(BaseModel):
    origen: PuntoGeo
    destino: PuntoGeo


class DistanciaResponse(BaseModel):
    distancia_m: float
    distancia_km: float


class PoligonoRequest(BaseModel):
    puntos: List[PuntoGeo] = Field(..., min_length=3)


class PoligonoResponse(BaseModel):
    area_m2: float
    area_ha: float
    perimetro_m: float


class UTMRequest(BaseModel):
    punto: PuntoGeo


class UTMResponse(BaseModel):
    este_m: float
    norte_m: float
    zona_utm: str
