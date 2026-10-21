# backend/modules/asistente_tecnico/services/llm.py
"""
LLMProvider — interfaz ligera para modelos de lenguaje.

Sin implementación pesada en esta etapa (no hay RAG ni llamadas a
APIs externas). El protocolo permite cambiar de proveedor (local
vosk/tflite ↔ remoto OpenAI) sin tocar a los consumidores.
"""
from typing import Any, Dict, List, Optional, Protocol


class LLMProvider(Protocol):
    """Contrato mínimo de un proveedor de lenguaje para el asistente."""

    async def generar(
        self,
        mensaje: str,
        contexto: Optional[Dict[str, Any]] = None,
        historial: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        """Genera una respuesta textual al mensaje del usuario."""
        ...


class OfflineLLMProvider:
    """
    Proveedor local por defecto: no invoca servicios externos.

    Responde con la plantilla base del asistente hasta que se integre
    un modelo real (TFLite/voz ya existen en `models/` para su
    evaluación técnica).
    """

    async def generar(
        self,
        mensaje: str,
        contexto: Optional[Dict[str, Any]] = None,
        historial: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        return (
            "Respuesta offline del asistente. El modelo de lenguaje "
            "aún no está integrado; el conocimiento local de MELANTIA "
            "sigue disponible a través de los servicios del módulo."
        )


llm_provider: LLMProvider = OfflineLLMProvider()
