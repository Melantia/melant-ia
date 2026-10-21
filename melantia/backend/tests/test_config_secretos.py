# backend/tests/test_config_secretos.py
"""Pruebas de provisión de secretos F7a.② — vault key + pepper.

Verifican presencia, formato y comportamiento fail-closed usando
valores SINTÉTICOS inyectados por entorno — ningún test contiene,
lee ni imprime un secreto real.
"""
import os

import pytest

from core.config import Settings, settings


# ============================================================================
# PROVISIÓN LOCAL — el .env real debe tener ambas variables
# (falla si el secreto desaparece del entorno de desarrollo)
# ============================================================================

def test_vault_key_provisionada_y_no_vacia():
    assert settings.session_vault_key is not None
    assert len(settings.session_vault_key) >= 43   # ≥32 bytes en urlsafe


def test_pepper_identidad_provisionado_y_no_vacio():
    assert settings.pepper_identidad is not None
    assert len(settings.pepper_identidad) >= 43


def test_secretos_son_independientes():
    assert settings.session_vault_key != settings.pepper_identidad
    # y distintos de cualquier clave Supabase
    assert settings.session_vault_key != settings.supabase_secret_key
    assert settings.pepper_identidad != settings.supabase_secret_key


# ============================================================================
# CARGA POR ENTORNO — valores sintéticos, nunca reales
# ============================================================================

def test_settings_carga_secretos_desde_env(monkeypatch):
    monkeypatch.setenv("MELANTIA_SESSION_VAULT_KEY", "sintetico-vault")
    monkeypatch.setenv("PEPPER_IDENTIDAD", "sintetico-pepper")
    s = Settings()
    assert s.session_vault_key == "sintetico-vault"
    assert s.pepper_identidad == "sintetico-pepper"


# ============================================================================
# FAIL-CLOSED — ausencia de secreto = None (el consumidor rechaza,
# nunca degrada a texto plano ni inventa un valor por defecto)
# ============================================================================

def test_ausencia_de_secretos_es_none_fail_closed(monkeypatch):
    monkeypatch.delenv("MELANTIA_SESSION_VAULT_KEY", raising=False)
    monkeypatch.delenv("PEPPER_IDENTIDAD", raising=False)
    s = Settings(_env_file=None)                   # sin .env
    assert s.session_vault_key is None
    assert s.pepper_identidad is None


def test_sin_default_inseguro():
    # los campos no deben traer valor por defecto (un default de
    # fábrica sería un secreto compartido — prohibido)
    assert Settings.model_fields["session_vault_key"].default is None
    assert Settings.model_fields["pepper_identidad"].default is None
