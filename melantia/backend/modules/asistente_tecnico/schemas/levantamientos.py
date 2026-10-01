# backend/modules/asistente_tecnico/schemas/levantamientos.py
"""Schemas para levantamientos GPS (ETAPA 2-B2).

`PuntoGeo` (lat/lon validados) se reutiliza de schemas/geodesia.py;
`PuntoGPSCaptura` lo extiende con los datos propios de cada captura
de campo: orden de recorrido, precisión del dispositivo y timestamp.
"""
from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from modules.asistente_tecnico.schemas.geodesia import PuntoGeo

# Estados controlados del ciclo de vida del levantamiento.
EstadoLevantamiento = Literal["borrador", "cerrado", "aplicado"]


class PuntoGPSCaptura(PuntoGeo):
    """Vértice capturado en campo (hereda validación lat/lon de PuntoGeo)."""
    orden: int = Field(..., ge=1)
    precision_gps_metros: Optional[float] = Field(None, ge=0)
    fecha_hora: Optional[datetime] = None


class LevantamientoCreate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=150)
    observaciones: Optional[str] = Field(None, max_length=2000)
    lote_id: Optional[UUID] = None
    # Clave de idempotencia generada por el cliente (offline-first):
    # identifica la OPERACIÓN de creación, no al usuario ni al
    # dispositivo — reintentar con la misma clave devuelve el
    # levantamiento ya creado en lugar de duplicarlo. Requiere la
    # columna levantamientos.client_operation_id (migración M2).
    client_operation_id: Optional[UUID] = None


class PuntosAgregar(BaseModel):
    """Lote de puntos a anexar — una medición individual también es válida."""
    puntos: List[PuntoGPSCaptura] = Field(..., min_length=1)


class PoligonoCaptura(BaseModel):
    """Operación de polígono: exige al menos 3 vértices ordenados."""
    puntos: List[PuntoGPSCaptura] = Field(..., min_length=3)


class ResultadoLevantamiento(BaseModel):
    """Resultado geométrico a persistir tras el cálculo del servicio."""
    area_m2: float = Field(..., ge=0)
    perimetro_m: float = Field(..., ge=0)
    estado: EstadoLevantamiento = "cerrado"


class PuntoGPSResponse(BaseModel):
    id: UUID
    levantamiento_id: UUID
    orden: int
    latitud: float
    longitud: float
    precision_gps_metros: Optional[float] = None
    fecha_hora: datetime


class LevantamientoResponse(BaseModel):
    id: UUID
    usuario_id: UUID
    lote_id: Optional[UUID] = None
    nombre: Optional[str] = None
    observaciones: Optional[str] = None
    estado: EstadoLevantamiento
    area_m2: Optional[float] = None
    perimetro_m: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class LevantamientoDetalleResponse(LevantamientoResponse):
    puntos: List[PuntoGPSResponse] = []
