# backend/tests/test_geodesia.py
"""Pruebas unitarias de Geodesia (items 13-14)."""
import pytest

from modules.asistente_tecnico.services import geodesia


def test_haversine_distancia_conocida():
    # Quito (-0.1807, -78.4678) a Guayaquil (-2.1894, -79.8891) ≈ 265 km.
    d = geodesia.distancia_haversine_m((-0.1807, -78.4678), (-2.1894, -79.8891))
    assert 250_000 < d < 285_000


def test_haversine_cero():
    assert geodesia.distancia_haversine_m((0, 0), (0, 0)) == 0.0


def test_poligono_cuadrado_100m():
    # Cuadrado ~100 m de lado cerca del ecuador (~0.0009°).
    puntos = [
        (0.0, 0.0),
        (0.0, 0.0009),
        (0.0009, 0.0009),
        (0.0009, 0.0),
    ]
    r = geodesia.area_poligono(puntos)
    # ~0.998 ha ≈ 9 980 m² (tolerancia por proyección esférica).
    assert 9_500 < r["area_m2"] < 10_500
    assert 0.9 < r["area_ha"] < 1.1
    # Perímetro ~400 m.
    assert 390 < r["perimetro_m"] < 410


def test_poligono_degenerado():
    assert geodesia.area_poligono([(0, 0), (0, 1)])["area_m2"] == 0.0


def test_utm_ecuador_zona_17s():
    # Guayaquil debe caer en zona 17S con falso norte aplicado.
    r = geodesia.latlon_a_utm(-2.1894, -79.8891)
    assert r["zona_utm"] == "17S"
    # Northing en hemisferio sur: > 9 700 000 (cerca de 2°S).
    assert r["norte_m"] > 9_000_000
    # Easting razonable dentro de la zona (100k-900k).
    assert 100_000 < r["este_m"] < 900_000


def test_utm_zona_automatica_galapagos():
    # Occidente de Galápagos (~-90.5°) cae en zona 15, no en la 17
    # hardcodeada del legacy (corrección A1, auditoría M2).
    r = geodesia.latlon_a_utm(-0.5, -90.5)
    assert r["zona_utm"] == "15S"


def test_utm_hemisferio_norte():
    # Bogotá (~4.7°N, -74.1°O) → zona 18N, sin falso norte.
    r = geodesia.latlon_a_utm(4.7, -74.1)
    assert r["zona_utm"] == "18N"
    assert r["norte_m"] < 10_000_000


def test_utm_fuera_de_cobertura():
    # UTM solo cubre 80°S–84°N; los polos requieren UPS.
    with pytest.raises(ValueError):
        geodesia.latlon_a_utm(85.0, 0.0)
    with pytest.raises(ValueError):
        geodesia.latlon_a_utm(-81.0, 0.0)
    with pytest.raises(ValueError):
        geodesia.latlon_a_utm(0.0, 200.0)


def test_perimetro():
    # Triángulo equilátero de ~1 km de lado.
    pts = [(0, 0), (0, 0.009), (0.0078, 0.0045)]
    p = geodesia.perimetro_m(pts)
    assert 2_500 < p < 3_500
