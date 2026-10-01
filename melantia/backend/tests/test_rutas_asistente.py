# backend/tests/test_rutas_asistente.py
"""
Pruebas de integración de rutas del Módulo 2 y autenticación.

Usan TestClient SIN lifespan (sin base de datos): los endpoints de
lógica pura no tocan la BD; los endpoints autenticados se verifican
por su comportamiento de rechazo (401) antes de llegar a la BD.
"""
import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app, raise_server_exceptions=False)

BASE = "/api/v1/asistente"


# ============================================================================
# REGISTRO DE RUTAS
# ============================================================================

def test_rutas_del_modulo_registradas():
    # OpenAPI es la fuente autoritativa de rutas públicas: insensible a
    # la representación interna de routers (_IncludedRouter cambia
    # entre versiones de FastAPI).
    spec = client.get("/openapi.json")
    assert spec.status_code == 200
    paths = set(spec.json()["paths"])
    esperadas = {
        f"{BASE}/calculadora/densidad",
        f"{BASE}/calculadora/dosis-frasco",
        f"{BASE}/calculadora/ugm",
        f"{BASE}/calculadora/gdp",
        f"{BASE}/calculadora/carbono",
        f"{BASE}/calculadora/riego",
        f"{BASE}/calculadora/fertilidad",
        f"{BASE}/calculadora/cultivos",
        f"{BASE}/lunar",
        f"{BASE}/lunar/mes",
        f"{BASE}/cronograma",
        f"{BASE}/cronograma/cultivos",
        f"{BASE}/geodesia/distancia",
        f"{BASE}/geodesia/poligono",
        f"{BASE}/geodesia/utm",
        f"{BASE}/contexto/fincas",
        "/api/auth/login",
        "/api/auth/registro",
        "/api/auth/me",
    }
    assert esperadas <= paths


# ============================================================================
# CALCULADORA (pura, sin auth ni BD)
# ============================================================================

def test_calculadora_cultivos():
    r = client.get(f"{BASE}/calculadora/cultivos")
    assert r.status_code == 200
    ids = {c["id"] for c in r.json()}
    assert {"cacao", "cafe", "palma", "maiz", "platano"} <= ids


def test_densidad_endpoint():
    r = client.post(
        f"{BASE}/calculadora/densidad",
        json={
            "area_ha": 1.0,
            "distancia_filas_m": 3.0,
            "distancia_plantas_m": 3.0,
        },
    )
    assert r.status_code == 200
    assert r.json()["plantas_estimadas"] == 1111


def test_dosis_frasco_endpoint():
    r = client.post(f"{BASE}/calculadora/dosis-frasco", json={"dosis_bomba_ml": 80})
    assert r.status_code == 200
    assert r.json()["dosis_frasco_ml"] == 2.0


def test_ugm_endpoint():
    r = client.post(f"{BASE}/calculadora/ugm", json={"vacas": 10, "toros": 2, "terneros": 4})
    assert r.status_code == 200
    assert r.json()["ugm"] == 14.4


def test_validacion_rechaza_datos_invalidos():
    r = client.post(
        f"{BASE}/calculadora/densidad",
        json={"area_ha": -1, "distancia_filas_m": 3, "distancia_plantas_m": 3},
    )
    assert r.status_code == 422


# ============================================================================
# CALENDARIO LUNAR Y CRONOGRAMA
# ============================================================================

def test_lunar_fecha_referencia():
    r = client.get(f"{BASE}/lunar", params={"fecha": "2000-01-07"})
    assert r.status_code == 200
    assert r.json()["fase"] == "Luna Nueva"


def test_lunar_mes():
    r = client.get(f"{BASE}/lunar/mes", params={"anio": 2026, "mes": 2})
    assert r.status_code == 200
    assert len(r.json()) == 28


def test_cronograma_cultivos():
    r = client.get(f"{BASE}/cronograma/cultivos")
    assert r.status_code == 200
    nombres = {c["cultivo"] for c in r.json()}
    assert {"Zanahoria", "Lechuga", "Tomate", "Maíz", "Papa"} <= nombres


def test_cronograma_maiz():
    r = client.post(
        f"{BASE}/cronograma",
        json={"cultivo": "maiz", "fecha_siembra": "2026-02-01"},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["cultivo"] == "Maíz"
    assert len(data["eventos"]) == 4


def test_cronograma_cultivo_inexistente_404():
    r = client.post(
        f"{BASE}/cronograma",
        json={"cultivo": "inexistente", "fecha_siembra": "2026-02-01"},
    )
    assert r.status_code == 404


# ============================================================================
# GEODESIA
# ============================================================================

def test_distancia_endpoint():
    r = client.post(
        f"{BASE}/geodesia/distancia",
        json={
            "origen": {"lat": -0.1807, "lon": -78.4678},
            "destino": {"lat": -2.1894, "lon": -79.8891},
        },
    )
    assert r.status_code == 200
    assert 250 < r.json()["distancia_km"] < 285


def test_poligono_endpoint():
    r = client.post(
        f"{BASE}/geodesia/poligono",
        json={
            "puntos": [
                {"lat": 0.0, "lon": 0.0},
                {"lat": 0.0, "lon": 0.0009},
                {"lat": 0.0009, "lon": 0.0009},
                {"lat": 0.0009, "lon": 0.0},
            ]
        },
    )
    assert r.status_code == 200
    assert 0.9 < r.json()["area_ha"] < 1.1


def test_poligono_requiere_3_puntos():
    r = client.post(
        f"{BASE}/geodesia/poligono",
        json={"puntos": [{"lat": 0, "lon": 0}, {"lat": 0, "lon": 1}]},
    )
    assert r.status_code == 422


# ============================================================================
# AUTENTICACIÓN (sin BD: se verifica el rechazo correcto)
# ============================================================================

def test_contexto_fincas_requiere_token():
    # AuthenticationError debe traducirse a 401, no a un 500.
    r = client.get(f"{BASE}/contexto/fincas")
    assert r.status_code == 401
    assert r.json()["error"] == "AUTHENTICATION_ERROR"


def test_contexto_fincas_token_invalido():
    r = client.get(
        f"{BASE}/contexto/fincas",
        headers={"Authorization": "Bearer token.falso.invalido"},
    )
    assert r.status_code == 401


def test_login_sin_base_de_datos_error_estructurado():
    # La dependencia get_db se resuelve antes de validar el body:
    # sin BD activa el endpoint devuelve el error de conexión
    # estructurado (DATABASE_ERROR, 500), no un 500 de excepción
    # no controlada. Esto verifica el handler de MelantiaException.
    r = client.post(
        "/api/auth/login",
        json={"cedula_ruc": "1234567890", "password": "x"},
    )
    assert r.status_code == 500
    assert r.json()["error"] == "DATABASE_ERROR"


def test_auth_me_requiere_token():
    r = client.get("/api/auth/me")
    assert r.status_code == 401
