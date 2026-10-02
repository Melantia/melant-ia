# backend/tests/test_cronograma.py
"""
Pruebas unitarias del Cronograma de Siembra (item 4).

Casos construidos contra los datos REALES de
knowledge/calendario_siembras.json (verificado con json.load):
  Zanahoria, Lechuga, Tomate, Maíz, Papa.

Nota: 'Maíz' lleva tilde en la semilla; los tests verifican la
búsqueda tolerante a tildes del servicio (_normalizar).
"""
from datetime import date

import pytest

from modules.asistente_tecnico.services import cronograma


def test_cultivos_disponibles():
    cultivos = cronograma.listar_cultivos()
    nombres = {c["cultivo"] for c in cultivos}
    # Datos reales de la semilla migrada del proyecto legacy.
    assert {"Zanahoria", "Lechuga", "Tomate", "Maíz", "Papa"} <= nombres


def test_generar_cronograma_maiz():
    # Maíz: ciclo 120 días, siembra directa, 4 hitos, Cuarto Creciente.
    r = cronograma.generar_cronograma("Maíz", date(2026, 2, 1))
    assert r["cultivo"] == "Maíz"
    assert r["fecha_siembra"] == "2026-02-01"
    assert r["ciclo_total_dias"] == 120
    assert r["siembra_directa"] is True
    assert r["fase_lunar_ideal"] == "Cuarto Creciente"
    assert r["recomendacion_lunar"]
    assert len(r["eventos"]) == 4
    # Los eventos están ordenados por día de inicio.
    inicios = [e["fecha_inicio"] for e in r["eventos"]]
    assert inicios == sorted(inicios)


def test_generar_cronograma_tomate_con_almacigo():
    # Tomate: siembra_directa=False (almácigo previo), 4 hitos.
    r = cronograma.generar_cronograma("tomate", date(2026, 1, 15))
    assert r["cultivo"] == "Tomate"
    assert r["siembra_directa"] is False
    assert r["ciclo_total_dias"] == 120


def test_evento_fechas_desde_siembra():
    # Zanahoria: primer hito 'Raleo (Aclareo)' en días 15-20.
    r = cronograma.generar_cronograma("zanahoria", date(2026, 2, 1))
    raleo = r["eventos"][0]
    assert raleo["tarea"] == "Raleo (Aclareo)"
    assert raleo["fecha_inicio"] == "2026-02-16"  # 01-feb + 15 días
    assert raleo["fecha_fin"] == "2026-02-21"     # 01-feb + 20 días


def test_cultivo_desconocido_error_claro():
    with pytest.raises(ValueError, match="no encontrado"):
        cronograma.generar_cronograma("quinoa_marciana", date(2026, 1, 1))


def test_busqueda_case_insensitive():
    r = cronograma.generar_cronograma("LECHUGA", date(2026, 3, 1))
    assert r["cultivo"] == "Lechuga"


def test_busqueda_tolerante_a_tildes():
    # 'maiz' sin tilde debe resolver 'Maíz' de la semilla.
    r = cronograma.generar_cronograma("maiz", date(2026, 3, 1))
    assert r["cultivo"] == "Maíz"
