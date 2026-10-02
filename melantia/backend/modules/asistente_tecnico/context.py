# backend/modules/asistente_tecnico/context.py
"""
ContextService — interfaz ligera para armar el contexto del productor.

Consume el adaptador compartido `shared.repositories.fincas` (acceso
temporal a las entidades del Módulo 3) y los servicios offline del M2
para producir un contexto estructurado que alimentará al asistente,
a las recomendaciones y, más adelante, al LLM/RAG.

Interfaz estable preparada para evolución: cuando M3 exponga su API,
solo cambia la implementación de `shared.repositories.fincas`.
"""
from typing import Any, Dict, Optional

from shared.repositories import fincas as repo_fincas


class ContextService:
    """
    Construye el contexto agronómico de un usuario/lote/finca.

    Métodos async que reciben la conexión psycopg3 inyectada por la
    capa de rutas (no administra conexiones propias).
    """

    @staticmethod
    async def contexto_usuario(conn, usuario_id: str) -> Dict[str, Any]:
        """Panorama productivo del usuario: fincas, lotes y animales."""
        fincas = await repo_fincas.listar_fincas_usuario(conn, usuario_id)
        resultado = []
        for finca in fincas:
            finca_id = str(finca["id"])
            lotes = await repo_fincas.listar_lotes_finca(conn, finca_id)
            animales = await repo_fincas.contar_animales_finca(conn, finca_id)
            resultado.append(
                {
                    **finca,
                    "id": finca_id,
                    "lotes": [{**l, "id": str(l["id"])} for l in lotes],
                    "cabezas_ganado": animales,
                }
            )
        return {"usuario_id": usuario_id, "fincas": resultado}

    @staticmethod
    async def contexto_lote(conn, lote_id: str) -> Optional[Dict[str, Any]]:
        """Contexto de un lote concreto (cultivo, área, finca, dueño)."""
        lote = await repo_fincas.obtener_lote(conn, lote_id)
        if not lote:
            return None
        finca = await repo_fincas.obtener_finca(conn, str(lote["finca_id"]))
        return {
            "lote": {**lote, "id": str(lote["id"]), "finca_id": str(lote["finca_id"])},
            "finca": {**finca, "id": str(finca["id"])} if finca else None,
        }
