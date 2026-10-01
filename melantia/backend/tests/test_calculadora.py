# backend/tests/test_calculadora.py
"""Pruebas unitarias de la Calculadora Agrícola (item 2)."""
import math

from modules.asistente_tecnico.services import calculadora as calc


def test_densidad_basica():
    # 1 ha = 10 000 m²; marco 3x3 → 1 111 plantas aprox.
    assert calc.calcular_densidad(1.0, 3.0, 3.0) == int(10_000 / 9)


def test_densidad_ajustada_por_calidad_semillera():
    densidad = calc.calcular_densidad(1.0, 3.0, 3.0, germinacion=0.9, pureza=0.9)
    esperada = int(10_000 / 9 * 0.81)
    assert densidad == esperada


def test_densidad_cero():
    assert calc.calcular_densidad(0, 3, 3) == 0
    assert calc.calcular_densidad(1, 0, 3) == 0


def test_dosis_mezcla():
    r = calc.calcular_dosis_mezcla(
        dosis_por_ha=2.0, area_ha=3.0, volumen_tanque_l=200
    )
    assert r["dosis_total"] == 6.0
    # Tasa por defecto 200 L/ha → 600 L de caldo → 3 cargas de 200 L.
    assert r["agua_necesaria_l"] == 600.0
    assert r["cargas_tanque"] == 3
    assert r["tasa_aplicacion_l_ha"] == 200.0


def test_dosis_mezcla_tasa_personalizada():
    r = calc.calcular_dosis_mezcla(
        dosis_por_ha=1.0, area_ha=2.0, volumen_tanque_l=100,
        tasa_aplicacion_l_ha=150.0,
    )
    assert r["dosis_total"] == 2.0
    assert r["agua_necesaria_l"] == 300.0
    assert r["cargas_tanque"] == 3


def test_dosis_frasco_usa_factor_del_conocimiento():
    r = calc.calcular_dosis_frasco(80.0)
    # factor 40 según knowledge/calculadora_proporciones.json
    assert r["dosis_frasco_ml"] == 2.0
    assert r["volumen_frasco_ml"] == 500


def test_ugm():
    assert calc.calcular_ugm(vacas=10, toros=2, terneros=4) == 10 + 2.4 + 2.0


def test_gdp():
    assert calc.calcular_gdp(250, 310, 60) == 1.0
    assert calc.calcular_gdp(100, 100, 0) == 0.0


def test_smalian():
    # Cilindro perfecto: dap igual en ambos extremos.
    v = calc.cubicar_smalian(dap1_cm=40, dap2_cm=40, longitud_m=10)
    esperado = math.pi * (0.2 ** 2) * 10
    assert abs(v - esperado) < 1e-9


def test_carbono():
    co2 = calc.estimar_carbono(volumen_madera_m3=10, factor_bef=1.3, fraccion_carbono=0.5)
    assert abs(co2 - 10 * 1.3 * 0.5 * 3.67) < 1e-9


def test_riego():
    assert calc.recomendar_riego(20)["nivel"] == "ALERTA"
    assert calc.recomendar_riego(40)["nivel"] == "PRECAUCION"
    assert calc.recomendar_riego(80)["nivel"] == "OK"


def test_fertilidad_niveles():
    r = calc.evaluar_fertilidad(fosforo_mg_kg=4.0, ph_suelo=5.2)
    assert r["fosforo_mg_kg"]["nivel"] == "BAJO"
    assert r["ph_suelo"]["nivel"] == "ACIDO"
    assert "alerta" in r["ph_suelo"]


def test_cultivo_tabla_conocimiento():
    cacao = calc.obtener_cultivo("cacao")
    assert cacao is not None
    assert cacao["nombre"] == "Cacao"
    assert calc.obtener_cultivo("NO_EXISTE") is None
