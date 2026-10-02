# backend/modules/asistente_tecnico/schemas/calendario.py
"""Schemas para Calendario Lunar (item 3) y Cronograma de Siembra (item 4)."""
from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field


class FaseLunarResponse(BaseModel):
    fecha: str
    fase: str
    icono: str
    indice_fase: int
    edad_lunar_dias: float
    recomendacion: str
    descripcion: Optional[str] = None


class CronogramaRequest(BaseModel):
    cultivo: str = Field(..., min_length=1)
    fecha_siembra: date


class EventoCronograma(BaseModel):
    tarea: str
    fecha_inicio: str
    fecha_fin: str
    instruccion: str


class CronogramaResponse(BaseModel):
    cultivo: str
    categoria: Optional[str] = None
    siembra_directa: Optional[bool] = None
    ciclo_total_dias: Optional[int] = None
    fecha_siembra: str
    fase_lunar_ideal: Optional[str] = None
    recomendacion_lunar: str
    eventos: List[EventoCronograma]


class CultivoCronogramaInfo(BaseModel):
    cultivo: str
    categoria: Optional[str] = None
    ciclo_total_dias: Optional[int] = None
    siembra_directa: Optional[bool] = None
    fase_lunar_ideal_siembra: Optional[str] = None
