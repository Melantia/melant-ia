# backend/modules/asistente_tecnico/services/recomendacion.py
"""
RecommendationService — interfaz ligera de recomendaciones técnicas.

Etapa actual: recomendaciones por reglas sobre el conocimiento local
(p. ej. fase lunar ideal del cultivo). Diseñada para que un modelo de
IA/ML pueda sustituir el motor de reglas sin cambiar la interfaz.
"""
from typing import Any, Dict, List

from modules.asistente_tecnico.services.conocimiento import (
    knowledge_service,
)


class RecommendationService:
    """Genera recomendaciones a partir del contexto del productor."""

    def recomendar_por_consulta(
        self, consulta: str, contexto: Dict[str, Any] | None = None
    ) -> Dict[str, Any]:
        """
        Responde una consulta técnica buscando en el conocimiento local
        y adjuntando el contexto productivo si se proporcionó.
        """
        return {
            "consulta": consulta,
            "resultados": knowledge_service.buscar(consulta),
            "contexto_usado": bool(contexto),
            "fuente": "conocimiento_local",
        }

    def recomendaciones_preventivas(
        self, cultivo: str
    ) -> List[Dict[str, Any]]:
        """Placeholder de reglas preventivas por cultivo."""
        return knowledge_service.buscar(
            f"{cultivo} plagas prevención", max_resultados=3
        )


recommendation_service = RecommendationService()
