# backend/modules/asistente_tecnico/routes/geodesia.py
"""
Endpoints de los Items 13 y 14 — Levantamiento de Lote y GPS.

Cálculo geodésico puro sobre coordenadas capturadas por el
dispositivo (Geolocation API). Offline-first: el resultado puede
computarse en cliente con la misma semilla y sincronizarse después.
"""
from fastapi import APIRouter

from core.exceptions import ValidationError
from modules.asistente_tecnico.schemas.geodesia import (
    DistanciaRequest,
    DistanciaResponse,
    PoligonoRequest,
    PoligonoResponse,
    UTMRequest,
    UTMResponse,
)
from modules.asistente_tecnico.services import geodesia

router = APIRouter(prefix="/geodesia", tags=["Asistente: Geodesia y GPS"])


def _puntos(request_puntos) -> list[tuple[float, float]]:
    return [(p.lat, p.lon) for p in request_puntos]


@router.post("/distancia", response_model=DistanciaResponse)
def distancia(data: DistanciaRequest):
    """Distancia Haversine entre dos coordenadas GPS."""
    m = geodesia.distancia_haversine_m(
        (data.origen.lat, data.origen.lon),
        (data.destino.lat, data.destino.lon),
    )
    return {"distancia_m": round(m, 2), "distancia_km": round(m / 1000, 4)}


@router.post("/poligono", response_model=PoligonoResponse)
def poligono(data: PoligonoRequest):
    """Área y perímetro de un polígono de vértices GPS (linderos de lote)."""
    return geodesia.area_poligono(_puntos(data.puntos))


@router.post("/utm", response_model=UTMResponse)
def utm(data: UTMRequest):
    """Conversión Lat/Lon → UTM con zona y hemisferio automáticos."""
    try:
        return geodesia.latlon_a_utm(data.punto.lat, data.punto.lon)
    except ValueError as exc:
        raise ValidationError(str(exc))
