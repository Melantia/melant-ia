# backend/tests/test_sync_canonical.py
"""Pruebas unitarias de la serialización canónica y los schemas sync.

Sin base de datos: canon, hash y validación de contrato son lógica
pura. El vector conocido contrasta `hash_operacion` con la
especificación de m8 (la misma fórmula que replica _hash_op).
"""
import hashlib
import json
import uuid
from datetime import date, datetime
from decimal import Decimal

import pytest
from pydantic import ValidationError

from modules.sync.schemas import SyncOperation, SyncPushRequest
from shared.sync_canonical import (
    hash_operacion,
    json_canon,
    json_serializable,
)

BASE = {
    "scope": "usr:u1",
    "entity_type": "finca",
    "entity_id": "e-1",
    "accion": "create",
    "base_version": None,
    "payload": {"nombre": "El Progreso"},
}


# ============================================================================
# CANON + HASH
# ============================================================================

def test_hash_determinista():
    assert hash_operacion(**BASE) == hash_operacion(**BASE)


def test_hash_vector_conocido():
    """Respuesta conocida: sha256 del JSON canónico literal — la misma
    fórmula que replican _hash_op (tests m8) y el cliente."""
    raw = (
        '{"accion":"create","base_version":null,'
        '"entity_id":"e-1","entity_type":"finca",'
        '"payload":{"nombre":"El Progreso"},"scope":"usr:u1"}'
    )
    esperado = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    assert hash_operacion(**BASE) == esperado


def test_mismo_contenido_mismo_hash():
    """Orden de claves del payload no cambia la huella."""
    h1 = hash_operacion(**BASE)
    h2 = hash_operacion(
        **{**BASE, "payload": {"nombre": "El Progreso"}}
    )
    h3 = hash_operacion(
        **{**BASE, "payload": {"nombre": "El Progreso", "extra": 1}}
    )
    assert h1 == h2
    assert h1 != h3


def test_hash_distingue_campos():
    """Cualquier cambio semántico produce otra huella."""
    h = hash_operacion(**BASE)
    assert h != hash_operacion(**{**BASE, "entity_type": "lote"})
    assert h != hash_operacion(**{**BASE, "entity_id": "e-2"})
    assert h != hash_operacion(**{**BASE, "accion": "update"})
    assert h != hash_operacion(**{**BASE, "base_version": 1})
    assert h != hash_operacion(**{**BASE, "scope": "usr:u2"})


def test_entity_id_uuid_equivale_a_str():
    """UUID y su str() canónico producen la misma huella."""
    uid = uuid.uuid4()
    assert hash_operacion(
        **{**BASE, "entity_id": uid}
    ) == hash_operacion(**{**BASE, "entity_id": str(uid)})


def test_entity_id_null():
    h = hash_operacion(**{**BASE, "entity_id": None})
    assert h != hash_operacion(**BASE)


def test_json_canon_orden_y_separadores():
    assert json_canon({"b": 1, "a": {"d": [2], "c": None}}) == (
        '{"a":{"c":null,"d":[2]},"b":1}'
    )


def test_json_serializable_tipos():
    """Snapshot JSONB: UUID/fechas/Decimal salen como JSON puro."""
    uid = uuid.uuid4()
    out = json_serializable({
        "id": uid,
        "fecha": date(2026, 10, 22),
        "ts": datetime(2026, 10, 22, 10, 0, 0),
        "area": Decimal("1.50"),
    })
    assert out == {
        "id": str(uid),
        "fecha": "2026-10-22",
        "ts": "2026-10-22T10:00:00",
        "area": 1.5,
    }


# ============================================================================
# SCHEMAS — sobre y operación
# ============================================================================

def _op_valida(**kw):
    base = {
        "client_operation_id": str(uuid.uuid4()),
        "entity_type": "finca",
        "entity_id": str(uuid.uuid4()),
        "action": "create",
        "payload": {"nombre": "X"},
    }
    base.update(kw)
    return base


def test_sobre_valido():
    req = SyncPushRequest.model_validate({
        "device_id": str(uuid.uuid4()),
        "operations": [_op_valida()],
    })
    assert len(req.operations) == 1
    assert req.operations[0].base_version is None


def test_sobre_rechaza_lote_vacio():
    with pytest.raises(ValidationError):
        SyncPushRequest.model_validate({
            "device_id": str(uuid.uuid4()),
            "operations": [],
        })


def test_sobre_rechaza_mas_de_50_ops():
    with pytest.raises(ValidationError):
        SyncPushRequest.model_validate({
            "device_id": str(uuid.uuid4()),
            "operations": [_op_valida() for _ in range(51)],
        })


def test_sobre_acepta_exactamente_50():
    req = SyncPushRequest.model_validate({
        "device_id": str(uuid.uuid4()),
        "operations": [_op_valida() for _ in range(50)],
    })
    assert len(req.operations) == 50


def test_sobre_rechaza_campos_extra():
    with pytest.raises(ValidationError):
        SyncPushRequest.model_validate({
            "device_id": str(uuid.uuid4()),
            "usuario_id": "inyección",       # jamás del body
            "operations": [_op_valida()],
        })


def test_op_rechaza_campos_extra():
    with pytest.raises(ValidationError):
        SyncOperation.model_validate(
            _op_valida(scope="usr:inyección")   # scope jamás del body
        )


def test_op_uuid_invalido_422():
    with pytest.raises(ValidationError):
        SyncOperation.model_validate(
            _op_valida(client_operation_id="no-uuid")
        )
    with pytest.raises(ValidationError):
        SyncOperation.model_validate(_op_valida(entity_id="no-uuid"))


def test_op_entity_type_arbitrario_pasa_al_servicio():
    """La allowlist es por op en el service: el schema acepta el str
    para que la op produzca su propio resultado 'error'."""
    op = SyncOperation.model_validate(
        _op_valida(entity_type="transaccion_financiera")
    )
    assert op.entity_type == "transaccion_financiera"


# ============================================================================
# base_version — create no tiene versión previa (B-2)
# ============================================================================

def test_op_create_base_version_omitido_ok():
    op = SyncOperation.model_validate(_op_valida())
    assert op.base_version is None


def test_op_create_base_version_null_ok():
    op = SyncOperation.model_validate(_op_valida(base_version=None))
    assert op.base_version is None


def test_op_create_base_version_no_nulo_rechaza():
    """create con base_version -> rechazo en el schema (422), antes
    de cualquier escritura — el campo no tiene semántica en create
    y variaría el hash de idempotencia."""
    with pytest.raises(ValidationError):
        SyncOperation.model_validate(_op_valida(base_version=3))


def test_op_no_create_permite_base_version():
    """update/delete sí declaran versión base (concurrencia
    optimista) — la restricción solo aplica a create."""
    op = SyncOperation.model_validate(
        _op_valida(action="update", base_version=2)
    )
    assert op.base_version == 2
