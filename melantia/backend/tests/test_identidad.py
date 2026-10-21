# backend/tests/test_identidad.py
"""
Pruebas del pipeline de identidad fiscal (D4.2 §22.3) y de la
derivación de email sintético (§6).

Los vectores usan dígitos verificadores calculados con los
algoritmos SRI — ningún test contiene ni imprime el pepper real;
la derivación se prueba con un pepper sintético vía monkeypatch.
"""
import pytest

from core.config import settings
from modules.auth import identidad
from modules.auth.identidad import (
    IdentidadError,
    derivar_email_sintetico,
    huella_identidad,
    normalizar_identidad_fiscal,
)


def _motivo(raw):
    with pytest.raises(IdentidadError) as e:
        normalizar_identidad_fiscal(raw)
    return e.value.motivo


# ============================================================================
# CÉDULA — persona natural (módulo-10)
# ============================================================================

def test_cedula_valida_canonica_nat():
    assert normalizar_identidad_fiscal("1710034065") == "NAT:1710034065"


def test_cedula_con_separadores_y_espacios_normaliza():
    assert normalizar_identidad_fiscal(" 17-1003 4065 ") == "NAT:1710034065"


def test_cedula_verificador_incorrecto_rechaza():
    assert _motivo("1710034066") == "verificador_invalido"


def test_cedula_provincia_fuera_de_rango():
    assert _motivo("9910034065") == "provincia_invalida"


def test_cedula_tercer_digito_mayor_a_5():
    assert _motivo("1770034065") == "tercer_digito_invalido"


def test_longitud_invalida():
    assert _motivo("123") == "longitud_invalida"
    assert _motivo("17100340650") == "longitud_invalida"


def test_no_numerico():
    assert _motivo("ABCDEFGHIJ") == "formato_invalido"
    assert _motivo("") == "formato_invalido"


# ============================================================================
# RUC PERSONA NATURAL — colapsa a cédula (§22.1, §22.3)
# ============================================================================

def test_ruc_natural_001_colapsa_a_cedula():
    # un humano = una identidad: su RUC y su cédula convergen
    assert normalizar_identidad_fiscal("1710034065001") == "NAT:1710034065"
    assert (
        normalizar_identidad_fiscal("1710034065001")
        == normalizar_identidad_fiscal("1710034065")
    )


def test_ruc_natural_sufijo_distinto_de_001_rechaza():
    # el diseño solo define el colapso de cédula+"001"; otros
    # establecimientos no están especificados → rechazo conservador
    assert _motivo("1710034065002") == "ruc_natural_sufijo_no_001"


def test_ruc_natural_verificador_malo():
    assert _motivo("1710034066001") == "verificador_invalido"


# ============================================================================
# RUC SOCIEDAD — identidad jurídica independiente (JUR)
# ============================================================================

def test_ruc_privada_valida_canonica_jur():
    assert normalizar_identidad_fiscal("1790011674001") == "JUR:1790011674001"


def test_ruc_publica_valida_canonica_jur():
    assert normalizar_identidad_fiscal("1760001550001") == "JUR:1760001550001"


def test_ruc_jur_no_colapsa_a_cedula():
    # la sociedad es identidad independiente — jamás NAT
    canonico = normalizar_identidad_fiscal("1790011674001")
    assert canonico.startswith("JUR:")


def test_ruc_privada_verificador_malo():
    assert _motivo("1790011675001") == "verificador_invalido"


def test_ruc_publica_verificador_malo():
    assert _motivo("1760001540001") == "verificador_invalido"


def test_ruc_tercer_digito_7_u_8_invalido():
    assert _motivo("1770011674001") == "tercer_digito_invalido"


def test_ruc_establecimiento_000_invalido():
    assert _motivo("1790011674000") == "establecimiento_invalido"


# ============================================================================
# EMAIL SINTÉTICO — HMAC determinista (§6), pepper fail-closed
# ============================================================================

def test_email_sintetico_determinista_y_formato(monkeypatch):
    monkeypatch.setattr(settings, "pepper_identidad", "pepper-test")
    a = derivar_email_sintetico("NAT:1710034065")
    b = derivar_email_sintetico("NAT:1710034065")
    assert a == b                                   # determinista
    local, dominio = a.split("@")
    assert len(local) == 24                         # 96 bits hex
    assert dominio == "id.melantia.app"


def test_email_sintetico_distinto_por_canonico(monkeypatch):
    monkeypatch.setattr(settings, "pepper_identidad", "pepper-test")
    assert derivar_email_sintetico("NAT:1710034065") != (
        derivar_email_sintetico("JUR:1790011674001")
    )


def test_email_sintetico_distinto_por_pepper(monkeypatch):
    monkeypatch.setattr(settings, "pepper_identidad", "p1")
    e1 = derivar_email_sintetico("NAT:1710034065")
    monkeypatch.setattr(settings, "pepper_identidad", "p2")
    e2 = derivar_email_sintetico("NAT:1710034065")
    assert e1 != e2                                 # keyed — no enumerable


def test_email_sintetico_falla_cerrado_sin_pepper(monkeypatch):
    monkeypatch.setattr(settings, "pepper_identidad", None)
    with pytest.raises(IdentidadError) as e:
        derivar_email_sintetico("NAT:1710034065")
    assert e.value.motivo == "pepper_no_configurado"


def test_email_sintetico_no_revela_cedula(monkeypatch):
    monkeypatch.setattr(settings, "pepper_identidad", "pepper-test")
    email = derivar_email_sintetico("NAT:1710034065")
    assert "1710034065" not in email


def test_huella_identidad_es_prefijo_no_reversible(monkeypatch):
    monkeypatch.setattr(settings, "pepper_identidad", "pepper-test")
    h = huella_identidad("NAT:1710034065")
    assert len(h) == 12
    assert "1710034065" not in h
