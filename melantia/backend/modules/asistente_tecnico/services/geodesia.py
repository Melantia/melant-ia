# backend/modules/asistente_tecnico/services/geodesia.py
"""
Items 13 y 14 — Geodesia: Levantamiento de Lote y GPS (Medición de Terrenos).

Funciones geodésicas puras migradas del proyecto legacy:
- Haversine (melant_ia/business/rastreo_trayecto_melantia.py)
- Área de polígono por proyección esférica + fórmula de Gauss
  (melant_ia/.../agricultura_digital/geometria.py)
- Conversión Lat/Lon → UTM con zona automática
  (melant_ia/.../agricultura_digital/gps_utils.js)

100% offline: cálculo local sobre coordenadas capturadas por el GPS
del dispositivo (Geolocation API en el frontend).
"""
import math
from typing import Dict, List, Sequence, Tuple

RADIO_TIERRA_M = 6_378_137  # Radio ecuatorial WGS84 en metros.

# Un punto geográfico: (latitud, longitud) en grados decimales.
Punto = Tuple[float, float]


# ============================================================================
# DISTANCIAS
# ============================================================================

def distancia_haversine_m(p1: Punto, p2: Punto) -> float:
    """
    Distancia en metros entre dos coordenadas (fórmula de Haversine).

    Precisión suficiente para mediciones de terreno a escala de finca.
    """
    lat1, lon1 = math.radians(p1[0]), math.radians(p1[1])
    lat2, lon2 = math.radians(p2[0]), math.radians(p2[1])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    return 2 * RADIO_TIERRA_M * math.asin(math.sqrt(a))


def perimetro_m(puntos: Sequence[Punto]) -> float:
    """Perímetro de un polígono GPS (suma de Haversine entre vértices)."""
    if len(puntos) < 2:
        return 0.0
    total = 0.0
    n = len(puntos)
    for i in range(n):
        total += distancia_haversine_m(puntos[i], puntos[(i + 1) % n])
    return total


# ============================================================================
# ÁREA DE POLÍGONO
# ============================================================================

def _proyectar_esferico(lat: float, lon: float, lat_ref: float) -> Tuple[float, float]:
    """Proyección equirectangular local centrada en la latitud media."""
    x = RADIO_TIERRA_M * math.radians(lon) * math.cos(math.radians(lat_ref))
    y = RADIO_TIERRA_M * math.radians(lat)
    return x, y


def area_poligono(puntos: Sequence[Punto]) -> Dict[str, float]:
    """
    Área de un polígono GPS mediante la fórmula del trapecio de Gauss
    sobre coordenadas proyectadas (aproximación esférica).

    Mejora sobre el legacy: proyecta respecto a la latitud media del
    polígono (más preciso para Ecuador cerca del ecuador).

    Retorna área en m² y hectáreas.
    """
    if len(puntos) < 3:
        return {"area_m2": 0.0, "area_ha": 0.0, "perimetro_m": perimetro_m(puntos)}

    lat_media = sum(p[0] for p in puntos) / len(puntos)
    planos = [_proyectar_esferico(p[0], p[1], lat_media) for p in puntos]

    area = 0.0
    n = len(planos)
    for i in range(n):
        j = (i + 1) % n
        area += planos[i][0] * planos[j][1]
        area -= planos[j][0] * planos[i][1]
    area_m2 = abs(area) / 2.0

    return {
        "area_m2": round(area_m2, 2),
        "area_ha": round(area_m2 / 10_000, 4),
        "perimetro_m": round(perimetro_m(puntos), 2),
    }


# ============================================================================
# CONVERSIÓN UTM (ZONA AUTOMÁTICA — WGS84)
# ============================================================================

# La cuadrícula UTM solo está definida entre 80°S y 84°N.
_UTM_LAT_MIN = -80.0
_UTM_LAT_MAX = 84.0


def zona_utm_para(lon: float) -> int:
    """Zona UTM (1–60) correspondiente a una longitud WGS84."""
    return min(60, max(1, math.floor((lon + 180) / 6) + 1))


def latlon_a_utm(lat: float, lon: float) -> Dict[str, float | str]:
    """
    Conversión Lat/Lon → UTM (WGS84) con zona y hemisferio automáticos.

    Migrado de gps_utils.js del proyecto legacy. La zona se deriva de la
    longitud (Ecuador continental usa 17S y 18S) y el hemisferio de la
    latitud, por lo que también es válido fuera de Ecuador.

    Raises:
        ValueError: si las coordenadas son inválidas o caen fuera de la
            cobertura UTM (80°S–84°N; las zonas polares requieren UPS).
    """
    if not -90.0 <= lat <= 90.0 or not -180.0 <= lon <= 180.0:
        raise ValueError("Coordenadas fuera del rango WGS84.")
    if lat < _UTM_LAT_MIN or lat > _UTM_LAT_MAX:
        raise ValueError(
            "Latitud fuera de la cobertura UTM (80°S–84°N)."
        )

    zona = zona_utm_para(lon)
    a = RADIO_TIERRA_M
    f = 1 / 298.257223563  # Achatamiento WGS84
    k0 = 0.9996
    e = math.sqrt(f * (2 - f))
    e2 = e * e

    lambda0 = math.radians(zona * 6 - 183)  # Meridiano central de la zona
    phi = math.radians(lat)
    lam = math.radians(lon)

    N = a / math.sqrt(1 - e2 * math.sin(phi) ** 2)
    T = math.tan(phi) ** 2
    C = (e2 / (1 - e2)) * math.cos(phi) ** 2
    A = (lam - lambda0) * math.cos(phi)

    M = a * (
        (1 - e2 / 4 - 3 * e2**2 / 64 - 5 * e2**3 / 256) * phi
        - (3 * e2 / 8 + 3 * e2**2 / 32 + 45 * e2**3 / 1024) * math.sin(2 * phi)
        + (15 * e2**2 / 256 + 45 * e2**3 / 1024) * math.sin(4 * phi)
        - (35 * e2**3 / 3072) * math.sin(6 * phi)
    )

    x = k0 * N * (
        A
        + (1 - T + C) * A**3 / 6
        + (5 - 18 * T + T * T + 72 * C - 58 * e2) * A**5 / 120
    ) + 500_000

    y = k0 * (
        M
        + N
        * math.tan(phi)
        * (
            A**2 / 2
            + (5 - T + 9 * C + 4 * C * C) * A**4 / 24
            + (61 - 58 * T + T * T + 600 * C - 330 * e2) * A**6 / 720
        )
    )

    # Hemisferio sur: falso norte de 10 000 000 m.
    hemisferio = "N"
    if lat < 0:
        y += 10_000_000
        hemisferio = "S"

    return {
        "este_m": round(x, 2),
        "norte_m": round(y, 2),
        "zona_utm": f"{zona}{hemisferio}",
    }
