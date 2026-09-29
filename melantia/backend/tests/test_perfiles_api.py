# backend/tests/test_perfiles_api.py
"""Pruebas de endpoints de identidad profesional (EP-4A).

TestClient sin lifespan: `get_db` y `get_current_user` se sustituyen por
overrides — ningún test toca la base de datos real.
"""
import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from psycopg.errors import UniqueViolation

from core.dependencies import get_current_user, get_db
from main import app

client = TestClient(app, raise_server_exceptions=False)

BASE = "/api/v1/ep/perfiles"

USER_A = str(uuid.uuid4())
USER_B = str(uuid.uuid4())
PID = str(uuid.uuid4())
NOW = datetime.now(timezone.utc)

PERFIL_ROW = {
    "id": PID, "codigo": "agronomo", "nombre": "Agrónomo/a",
    "descripcion": "desc", "activo": True, "created_at": NOW,
}

MIO_ROW = {
    "asignacion_id": str(uuid.uuid4()), "perfil_id": PID,
    "codigo": "agronomo", "nombre": "Agrónomo/a", "descripcion": "desc",
    "verificado": False, "principal": False, "created_at": NOW,
}

ASIGNACION_ROW = {
    "asignacion_id": str(uuid.uuid4()), "usuario_id": USER_A,
    "perfil_id": PID, "verificado": False, "principal": False,
    "created_at": NOW,
}


# ============================================================================
# CONEXIÓN FALSA — resultados enlatados por orden de consulta
# ============================================================================

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
    assert client.get(BASE).status_code == 401
    assert client.get(f"{BASE}/mios").status_code == 401
    assert client.post(f"{BASE}/mios", json={}).status_code == 401
    assert client.delete(f"{BASE}/mios/{PID}").status_code == 401


# ============================================================================
# CATÁLOGO
# ============================================================================

def test_listar_catalogo(conn_factory):
    conn = _FakeConn(results=[[PERFIL_ROW]])
    conn_factory(conn)
    r = client.get(BASE)
    assert r.status_code == 200
    assert r.json()[0]["codigo"] == "agronomo"


# ============================================================================
# MIS PERFILES
# ============================================================================

def test_listar_mios_filtra_por_usuario(conn_factory):
    conn = _FakeConn(results=[[MIO_ROW]])
    conn_factory(conn)
    r = client.get(f"{BASE}/mios")
    assert r.status_code == 200
    assert len(r.json()) == 1
    sql, params = conn.queries[0]
    assert params == (USER_A,)


# ============================================================================
# ASIGNAR
# ============================================================================

def test_asignar_perfil_ok(conn_factory):
    conn = _FakeConn(results=[PERFIL_ROW, ASIGNACION_ROW])
    conn_factory(conn)
    r = client.post(f"{BASE}/mios", json={"perfil_id": PID})
    assert r.status_code == 201
    body = r.json()
    assert body["perfil_id"] == PID
    assert body["codigo"] == "agronomo"
    assert conn.commits == 1


def test_asignar_perfil_inexistente_404(conn_factory):
    conn = _FakeConn(results=[[]])  # obtener_perfil → nada
    conn_factory(conn)
    r = client.post(f"{BASE}/mios", json={"perfil_id": PID})
    assert r.status_code == 404


def test_asignar_perfil_inactivo_404(conn_factory):
    conn = _FakeConn(results=[{**PERFIL_ROW, "activo": False}])
    conn_factory(conn)
    r = client.post(f"{BASE}/mios", json={"perfil_id": PID})
    assert r.status_code == 404


def test_asignar_perfil_duplicado_409(conn_factory):
    conn = _FakeConn(
        results=[PERFIL_ROW, UniqueViolation("duplicate key")],
    )
    conn_factory(conn)
    r = client.post(f"{BASE}/mios", json={"perfil_id": PID})
    assert r.status_code == 409
    assert conn.rollbacks == 1


def test_asignar_codigo_no_uuid_422(conn_factory):
    conn_factory(_FakeConn())
    r = client.post(f"{BASE}/mios", json={"perfil_id": "agronomo"})
    assert r.status_code == 422


# ============================================================================
# DESASIGNAR
# ============================================================================

def test_desasignar_perfil_ok(conn_factory):
    conn = _FakeConn(results=[{"id": str(uuid.uuid4())}])
    conn_factory(conn)
    r = client.delete(f"{BASE}/mios/{PID}")
    assert r.status_code == 204
    sql, params = conn.queries[0]
    assert "usuario_id = %s AND perfil_id = %s" in sql
    assert params == (USER_A, PID)
    assert conn.commits == 1


def test_desasignar_perfil_no_asignado_404(conn_factory):
    conn = _FakeConn(results=[[]])
    conn_factory(conn)
    assert client.delete(f"{BASE}/mios/{PID}").status_code == 404


def test_desasignar_uuid_invalido_422(conn_factory):
    conn_factory(_FakeConn())
    assert client.delete(f"{BASE}/mios/no-uuid").status_code == 422
