# backend/tests/test_workspaces_api.py
"""Pruebas de endpoints de workspaces del EP (EP-4B).

TestClient sin lifespan: `get_db` y `get_current_user` sustituidos por
overrides — ningún test toca la base de datos real. La conexión falsa
encola resultados por orden de consulta del repository.
"""
import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from psycopg.errors import UniqueViolation

from core.dependencies import get_current_user, get_db
from main import app

client = TestClient(app, raise_server_exceptions=False)

BASE = "/api/v1/ep/workspaces"

USER_A = str(uuid.uuid4())   # propietario
USER_B = str(uuid.uuid4())   # ajeno / invitado
WS = str(uuid.uuid4())
NOW = datetime.now(timezone.utc)

WS_ROW = {
    "id": WS, "nombre": "Oficina Andrade", "descripcion": None,
    "estado": "activo", "propietario_id": USER_A,
    "created_at": NOW, "updated_at": NOW,
}

PROP_ROW = {   # membresía de USER_A como propietario activo
    "id": str(uuid.uuid4()), "workspace_id": WS, "usuario_id": USER_A,
    "rol": "propietario", "estado": "activo", "created_at": NOW,
}

SOCIO_ROW = {**PROP_ROW, "rol": "socio"}
COLAB_ROW = {**PROP_ROW, "rol": "colaborador"}
INVITADO_B = {
    "id": str(uuid.uuid4()), "workspace_id": WS, "usuario_id": USER_B,
    "rol": "colaborador", "estado": "invitado", "created_at": NOW,
}


class _FakeCursor:
    def __init__(self, conn):
        self._conn = conn
        self._result = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def execute(self, sql, params=None):
        self._conn.queries.append((sql, params))
        item = self._conn.results.pop(0) if self._conn.results else []
        if isinstance(item, Exception):
            raise item
        self._result = item

    async def fetchone(self):
        if isinstance(self._result, dict):
            return self._result
        return self._result[0] if self._result else None

    async def fetchall(self):
        return list(self._result) if isinstance(self._result, list) else []


class _FakeConn:
    def __init__(self, results=None):
        self.results = list(results or [])
        self.queries = []
        self.commits = 0
        self.rollbacks = 0

    def cursor(self, row_factory=None):
        return _FakeCursor(self)

    async def commit(self):
        self.commits += 1

    async def rollback(self):
        self.rollbacks += 1


@pytest.fixture
def conn_factory():
    def _aplicar(conn, usuario=USER_A):
        async def _db():
            return (conn, None)
        app.dependency_overrides[get_db] = _db
        app.dependency_overrides[get_current_user] = lambda: usuario
    yield _aplicar
    app.dependency_overrides.clear()


# ============================================================================
# AUTENTICACIÓN
# ============================================================================

def test_jwt_obligatorio():
    assert client.post(BASE, json={}).status_code == 401
    assert client.get(BASE).status_code == 401
    assert client.get(f"{BASE}/{WS}").status_code == 401
    assert client.post(f"{BASE}/{WS}/miembros", json={}).status_code == 401
    assert client.post(f"{BASE}/{WS}/aceptar").status_code == 401
    assert client.delete(f"{BASE}/{WS}/miembros/{USER_B}").status_code == 401


# ============================================================================
# CREAR / LISTAR / DETALLE
# ============================================================================

def test_crear_workspace_auto_propietario(conn_factory):
    conn = _FakeConn(results=[WS_ROW, PROP_ROW])
    conn_factory(conn)
    r = client.post(BASE, json={"nombre": "Oficina Andrade"})
    assert r.status_code == 201
    assert r.json()["mi_rol"] == "propietario"
    # 2 queries: INSERT workspace + INSERT miembro
    assert len(conn.queries) == 2
    assert "INSERT INTO workspace_miembros" in conn.queries[1][0]
    assert conn.commits == 1


def test_listar_solo_donde_miembro(conn_factory):
    conn = _FakeConn(results=[[{**WS_ROW, "mi_rol": "propietario"}]])
    conn_factory(conn)
    r = client.get(BASE)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_detalle_miembro_ok(conn_factory):
    conn = _FakeConn(results=[PROP_ROW, WS_ROW, [PROP_ROW, INVITADO_B]])
    conn_factory(conn)
    r = client.get(f"{BASE}/{WS}")
    assert r.status_code == 200
    assert len(r.json()["miembros"]) == 2


def test_detalle_ajeno_404(conn_factory):
    conn = _FakeConn(results=[[]])  # no es miembro
    conn_factory(conn, usuario=USER_B)
    assert client.get(f"{BASE}/{WS}").status_code == 404


# ============================================================================
# EDICIÓN DE WORKSPACE
# ============================================================================

def test_editar_como_socio_ok(conn_factory):
    conn = _FakeConn(results=[SOCIO_ROW, WS_ROW])
    conn_factory(conn)
    r = client.patch(f"{BASE}/{WS}", json={"nombre": "Nuevo nombre"})
    assert r.status_code == 200
    assert conn.commits == 1


def test_editar_como_colaborador_403(conn_factory):
    conn = _FakeConn(results=[COLAB_ROW])
    conn_factory(conn)
    r = client.patch(f"{BASE}/{WS}", json={"nombre": "X"})
    assert r.status_code == 403


# ============================================================================
# INVITAR / ACEPTAR
# ============================================================================

def test_invitar_miembro_ok(conn_factory):
    conn = _FakeConn(results=[PROP_ROW, {"?column?": 1}, INVITADO_B])
    conn_factory(conn)
    r = client.post(
        f"{BASE}/{WS}/miembros",
        json={"usuario_id": USER_B, "rol": "colaborador"},
    )
    assert r.status_code == 201
    assert r.json()["estado"] == "invitado"
    assert conn.commits == 1


def test_invitar_usuario_inexistente_404(conn_factory):
    conn = _FakeConn(results=[PROP_ROW, []])  # existe_usuario → nada
    conn_factory(conn)
    r = client.post(f"{BASE}/{WS}/miembros", json={"usuario_id": USER_B})
    assert r.status_code == 404


def test_invitar_sin_permiso_403(conn_factory):
    conn = _FakeConn(results=[COLAB_ROW])
    conn_factory(conn)
    r = client.post(f"{BASE}/{WS}/miembros", json={"usuario_id": USER_B})
    assert r.status_code == 403


def test_invitar_duplicado_409(conn_factory):
    conn = _FakeConn(results=[PROP_ROW, {"?column?": 1},
                            UniqueViolation("dup")])
    conn_factory(conn)
    r = client.post(f"{BASE}/{WS}/miembros", json={"usuario_id": USER_B})
    assert r.status_code == 409
    assert conn.rollbacks == 1


def test_socio_no_invita_propietario_403(conn_factory):
    conn = _FakeConn(results=[SOCIO_ROW])
    conn_factory(conn)
    r = client.post(
        f"{BASE}/{WS}/miembros",
        json={"usuario_id": USER_B, "rol": "propietario"},
    )
    assert r.status_code == 403


def test_aceptar_invitacion(conn_factory):
    activo = {**INVITADO_B, "estado": "activo"}
    conn = _FakeConn(results=[INVITADO_B, activo])
    conn_factory(conn, usuario=USER_B)
    r = client.post(f"{BASE}/{WS}/aceptar")
    assert r.status_code == 200
    assert r.json()["estado"] == "activo"


def test_aceptar_sin_invitacion_404(conn_factory):
    conn = _FakeConn(results=[[]])
    conn_factory(conn, usuario=USER_B)
    assert client.post(f"{BASE}/{WS}/aceptar").status_code == 404


# ============================================================================
# GESTIÓN DE MIEMBROS
# ============================================================================

def test_remover_miembro_como_propietario(conn_factory):
    obj = {**INVITADO_B, "estado": "activo"}
    conn = _FakeConn(results=[PROP_ROW, WS_ROW, obj,
                              {**obj, "estado": "removido"}])
    conn_factory(conn)
    r = client.delete(f"{BASE}/{WS}/miembros/{USER_B}")
    assert r.status_code == 204
    sql, params = conn.queries[-1]
    assert "estado" in sql and params[1] == "removido"


def test_remover_propietario_fundador_400(conn_factory):
    conn = _FakeConn(results=[PROP_ROW, WS_ROW])
    conn_factory(conn)
    r = client.delete(f"{BASE}/{WS}/miembros/{USER_A}")
    assert r.status_code == 400


def test_salida_propia_sin_ser_propietario(conn_factory):
    gestor_b = {**INVITADO_B, "estado": "activo"}
    conn = _FakeConn(results=[gestor_b, WS_ROW, gestor_b,
                              {**gestor_b, "estado": "removido"}])
    conn_factory(conn, usuario=USER_B)
    r = client.delete(f"{BASE}/{WS}/miembros/{USER_B}")
    assert r.status_code == 204


def test_remover_ajeno_sin_permiso_404(conn_factory):
    conn = _FakeConn(results=[[]])  # USER_B ni siquiera es miembro
    conn_factory(conn, usuario=USER_B)
    r = client.delete(f"{BASE}/{WS}/miembros/{str(uuid.uuid4())}")
    assert r.status_code == 404


def test_degradar_fundador_400(conn_factory):
    conn = _FakeConn(results=[PROP_ROW, WS_ROW, PROP_ROW])
    conn_factory(conn)
    r = client.patch(
        f"{BASE}/{WS}/miembros/{USER_A}", json={"rol": "colaborador"}
    )
    assert r.status_code == 400


def test_cambiar_rol_sin_ser_propietario_403(conn_factory):
    conn = _FakeConn(results=[COLAB_ROW])
    conn_factory(conn)
    r = client.patch(
        f"{BASE}/{WS}/miembros/{USER_B}", json={"rol": "socio"}
    )
    assert r.status_code == 403
