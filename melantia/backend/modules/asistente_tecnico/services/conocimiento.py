# backend/modules/asistente_tecnico/services/conocimiento.py
"""
Cargador de la base de conocimiento local del Módulo 2.

Los archivos JSON de `knowledge/` son la semilla offline del módulo:
migrados del proyecto legacy (melant_ia/src/knowledge_seeds) y
extensibles a una base vectorial/RAG en fases futuras.
"""
import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List

from core.exceptions import KnowledgeUnavailableError

KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent / "knowledge"


@lru_cache(maxsize=None)
def cargar_conocimiento(nombre_archivo: str) -> Dict[str, Any] | list:
    """
    Carga un archivo JSON de la base de conocimiento local.

    El resultado se cachea en memoria (los JSON son estáticos y
    pequeños; el caché evita lecturas de disco por petición).

    Raises:
        KnowledgeUnavailableError: si el archivo no existe o está
            corrupto (error de despliegue, no del cliente).
    """
    ruta = KNOWLEDGE_DIR / nombre_archivo
    if not ruta.is_file():
        raise KnowledgeUnavailableError(nombre_archivo)

    try:
        with open(ruta, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError) as exc:
        raise KnowledgeUnavailableError(
            nombre_archivo, details={"causa": str(exc)}
        )


# ============================================================================
# KnowledgeService — interfaz ligera de acceso al conocimiento
# ============================================================================

class KnowledgeService:
    """
    Interfaz de búsqueda documental sobre la semilla JSON local.

    Etapa actual: búsqueda léxica (coincidencia de texto) sobre los
    JSON de knowledge/. Interfaz preparada para evolucionar a
    FTS/PostgreSQL o embeddings vectoriales sin cambiar a los
    consumidores (rutas, RecommendationService, futuro RAG).
    """

    def listar_documentos(self) -> List[str]:
        """Archivos de conocimiento disponibles en la semilla local."""
        return sorted(
            p.name for p in KNOWLEDGE_DIR.glob("*.json") if p.is_file()
        )

    def obtener_documento(self, nombre: str) -> Any:
        """Devuelve el contenido completo de un documento."""
        return cargar_conocimiento(nombre)

    def buscar(self, consulta: str, max_resultados: int = 5) -> List[Dict[str, Any]]:
        """
        Búsqueda léxica simple: recorre los JSON y devuelve los
        fragmentos (objetos) cuyo contenido contiene los términos
        de la consulta. Suficiente para la semilla pequeña actual.
        """
        terminos = consulta.lower().split()
        resultados: List[Dict[str, Any]] = []

        for nombre in self.listar_documentos():
            try:
                documento = cargar_conocimiento(nombre)
            except KnowledgeUnavailableError:
                continue

            texto = json.dumps(documento, ensure_ascii=False).lower()
            coincidencias = sum(1 for t in terminos if t in texto)
            if coincidencias > 0:
                resultados.append(
                    {
                        "documento": nombre,
                        "coincidencias": coincidencias,
                        "contenido": documento,
                    }
                )

        resultados.sort(key=lambda r: r["coincidencias"], reverse=True)
        return resultados[:max_resultados]


knowledge_service = KnowledgeService()
