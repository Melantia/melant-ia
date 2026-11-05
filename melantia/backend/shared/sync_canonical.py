# backend/shared/sync_canonical.py
"""
Serialización canónica y huella de solicitudes de sincronización.

Especificación (m8 header + docs/SYNC_OFFLINE_FIRST_DESIGN.md §4.4):

    payload_hash = sha256_hex( json_canon(op_canonica) )
    op_canonica = {
      "scope": <texto>, "entity_type": <texto>,
      "entity_id": <uuid|null>, "accion": "create|update|delete",
      "base_version": <int|null>, "payload": <json normalizado>
    }
    json_canon: claves ordenadas (sort_keys), separadores mínimos
    (",",":"), Unicode literal (ensure_ascii=False), UTF-8, null
    explícito para ausentes. Números tal cual los envía el cliente.

Dos solicitudes semánticamente idénticas → mismo hash; cualquier
cambio de significado → hash distinto. Este es el algoritmo de
PRODUCCIÓN: la réplica del test (_hash_op) verifica el mismo
contrato y las pruebas cruzadas lo contrastan.
"""
import hashlib
import json
from datetime import date, datetime, time
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID


def _jsonable(o: Any) -> Any:
    """
    default= para json.dumps: convierte tipos no-JSON a su forma
    canónica. UUID → str() minúsculas; date/datetime/time →
    isoformat; Decimal → float (espejo del JSON del cliente, que
    solo conoce números). Cualquier otro tipo es un error real del
    llamador: no se silencia.
    """
    if isinstance(o, UUID):
        return str(o)
    if isinstance(o, (datetime, date, time)):
        return o.isoformat()
    if isinstance(o, Decimal):
        return float(o)
    raise TypeError(f"Tipo no serializable en canon JSON: {type(o)}")


def json_canon(obj: Any) -> str:
    """JSON canónico: claves ordenadas, separadores mínimos, Unicode."""
    return json.dumps(
        obj,
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
        default=_jsonable,
    )


def json_serializable(obj: Any) -> Any:
    """
    Convierte una estructura con UUID/fechas/Decimal a una estructura
    JSON pura (idempotente: si ya es JSON pura, no cambia). Sirve para
    snapshots JSONB (sync_cambios.data, sync_operaciones.resultado).
    """
    return json.loads(json_canon(obj))


def hash_operacion(
    scope: str,
    entity_type: str,
    entity_id: Any,
    accion: str,
    base_version: Optional[int],
    payload: Any,
) -> str:
    """
    SHA-256 hex de la solicitud canónica — espejo exacto de
    _hash_op en tests/test_m8_m9_sync_infraestructura.py.

    `client_created_at` NO forma parte de la huella: es metadato de
    transporte, no contenido de la operación — un reintento que solo
    cambia ese campo sigue siendo la misma operación.
    """
    canonica = {
        "accion": accion,
        "base_version": base_version,
        "entity_id": str(entity_id) if entity_id is not None else None,
        "entity_type": entity_type,
        "payload": payload,
        "scope": scope,
    }
    return hashlib.sha256(json_canon(canonica).encode("utf-8")).hexdigest()
