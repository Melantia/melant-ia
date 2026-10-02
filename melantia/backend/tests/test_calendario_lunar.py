# backend/tests/test_calendario_lunar.py
"""Pruebas unitarias del algoritmo de fase lunar (item 3)."""
from datetime import date, datetime

from modules.asistente_tecnico.services.calendario_lunar import (
    calcular_fase_lunar,
    calendario_mensual,
)


def test_luna_nueva_en_la_referencia():
    # El epoch del algoritmo es 6-ene-2000 18:14 UTC. El 7 de enero
    # (00:00) la edad lunar es ~0.24 días → Luna Nueva.
    r = calcular_fase_lunar(date(2000, 1, 7))
    assert r["fase"] == "Luna Nueva"
    assert 0 <= r["edad_lunar_dias"] < 1


def test_medianoche_antes_del_epoch_es_menguante():
    # Las 00:00 del 6-ene-2000 preceden a la luna nueva (18:14 UTC):
    # astronómicamente sigue siendo fin de ciclo (edad ~28.8).
    r = calcular_fase_lunar(date(2000, 1, 6))
    assert r["fase"] == "Cuarto Menguante"


def test_luna_llena_conocida():
    # Luna llena real: 21-ene-2000 ~04:40 UTC. A las 18:00 UTC
    # la edad es ~15.0 días → Luna Llena.
    r = calcular_fase_lunar(datetime(2000, 1, 21, 18, 0))
    assert r["fase"] == "Luna Llena"


def test_cuarto_menguante_conocido():
    # ~22.5 días tras la luna nueva de referencia → cuarto menguante.
    r = calcular_fase_lunar(date(2000, 1, 29))
    assert r["fase"] == "Cuarto Menguante"


def test_fechas_validas_en_rangos():
    r = calcular_fase_lunar(date(2026, 3, 15))
    assert r["fase"] in {f["nombre"] for f in [
        {"nombre": n} for n in
        ("Luna Nueva", "Cuarto Creciente", "Luna Llena", "Cuarto Menguante")
    ]}
    assert 0 <= r["edad_lunar_dias"] < 29.6
    assert r["recomendacion"]


def test_ciclo_sinodico_completo():
    # Misma fase a ~29.53 días de distancia.
    f1 = calcular_fase_lunar(date(2026, 1, 10))
    f2 = calcular_fase_lunar(date(2026, 2, 9))
    assert abs(f1["edad_lunar_dias"] - f2["edad_lunar_dias"]) < 1.0


def test_calendario_mensual_devuelve_todos_los_dias():
    dias = calendario_mensual(2026, 2)
    assert len(dias) == 28
    assert dias[0]["fecha"] == "2026-02-01"
    assert all("fase" in d for d in dias)
