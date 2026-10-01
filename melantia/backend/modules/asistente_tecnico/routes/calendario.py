# backend/modules/asistente_tecnico/routes/calendario.py
"""
Endpoints de los Items 3 y 4 — Calendario Lunar y Cronograma de Siembra.
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException, Query, status

from modules.asistente_tecnico.schemas.calendario import (
    CronogramaRequest,
    CronogramaResponse,
    CultivoCronogramaInfo,
    FaseLunarResponse,
)
from modules.asistente_tecnico.services import calendario_lunar, cronograma

router = APIRouter(tags=["Asistente: Calendario y Cronograma"])


@router.get("/lunar", response_model=FaseLunarResponse)
def fase_lunar(fecha: Optional[date] = Query(default=None)):
    """Fase lunar y recomendación agronómica de una fecha (hoy por defecto)."""
    fecha = fecha or date.today()
    return {"fecha": fecha.isoformat(), **calendario_lunar.calcular_fase_lunar(fecha)}


@router.get("/lunar/mes", response_model=list[FaseLunarResponse])
def fases_mes(
    anio: int = Query(..., ge=1900, le=2100),
    mes: int = Query(..., ge=1, le=12),
):
    """Fase lunar de cada día del mes (vista calendario)."""
    return calendario_lunar.calendario_mensual(anio, mes)


@router.get("/cronograma/cultivos", response_model=list[CultivoCronogramaInfo])
def cultivos_cronograma():
    """Cultivos con cronograma de labores disponible."""
    return cronograma.listar_cultivos()


@router.post("/cronograma", response_model=CronogramaResponse)
def generar_cronograma(data: CronogramaRequest):
    """
    Genera el calendario de labores del cultivo desde la fecha de siembra,
    con la fase lunar ideal y su justificación agronómica.
    """
    try:
        return cronograma.generar_cronograma(data.cultivo, data.fecha_siembra)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        )
