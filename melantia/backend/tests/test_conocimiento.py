# backend/tests/test_conocimiento.py
"""Pruebas del KnowledgeService ligero (interfaz RAG-futura)."""
import pytest

from core.exceptions import KnowledgeUnavailableError
from modules.asistente_tecnico.services.conocimiento import (
    cargar_conocimiento,
    knowledge_service,
)


def test_listar_documentos():
    docs = knowledge_service.listar_documentos()
    assert "cultivos_ecuador.json" in docs
    assert "calendario_lunar.json" in docs


def test_buscar_devuelve_resultados_ordenados():
    r = knowledge_service.buscar("cacao fertilizacion")
    assert len(r) > 0
    assert all("documento" in x and "coincidencias" in x for x in r)
    # Ordenados por relevancia léxica descendente.
    scores = [x["coincidencias"] for x in r]
    assert scores == sorted(scores, reverse=True)


def test_buscar_sin_coincidencias():
    assert knowledge_service.buscar("xyzzyplugh") == []


def test_documento_inexistente():
    # Error estructurado (C5): fallo de despliegue, no del cliente.
    with pytest.raises(KnowledgeUnavailableError):
        cargar_conocimiento("no_existe.json")
