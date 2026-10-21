# backend/tests/test_main_endpoints_seguridad.py
"""Pruebas de seguridad de los endpoints CORE de main.py (FIX-01/FIX-02).

TestClient sin lifespan: `get_current_user` se sustituye por
dependency_overrides y `main.get_db_connection` por una conexión
falsa — ningún test toca la base de datos real ni servicios externos.
"""
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient
from psycopg.errors import UniqueViolation

import main as main_module
from core.dependencies import get_current_user
from main import app

client = TestClient(app, raise_server_exceptions=False)

USER_A = str(uuid.uuid4())
USER_B = str(uuid.uuid4())
LOTE = str(uuid.uuid4())
REG = str(uuid.uuid4())
NOW = datetime.now(timezone.utc)

CLASIFICAR = "/api/ia/clasificar-evidencia"
PERFIL = "/api/finanzas/perfil-bancario"


# ============================================================================
# CONEXIÓN FALSA — resultados enlatados por orden de consulta
# ============================================================================

class _FakeCursor:
    def __init__(self, conn):
        self._conn = conn
        self._result = []

    async def fetchone(self):
        if isinstance(self._result, dict):
            return self._result
        return self._result[0] if self._result else None

    async def fetchall(self):
        return list(self._result) if isinstance(self._result, list) else []


class _FakeConn:
    """Cola de resultados por execute(); `fail_at` dispara una
    excepción en la consulta N (0-based) para simular fallos."""

    def __init__(self, results=None, fail_at=None, fail_exc=None):
        self.results = list(results or [])
        self.queries = []
        self.commits = 0
        self.fail_at = fail_at
        self.fail_exc = fail_exc or Exception("fallo simulado")

    async def execute(self, sql, params=None):
        idx = len(self.queries)
        self.queries.append((sql, params))
        if idx == self.fail_at:
            raise self.fail_exc
        cur = _FakeCursor(self)
        cur._result = (
            self.results.pop(0) if self.results else []
        )
        return cur

    async def commit(self):
        self.commits += 1

    async def rollback(self):
        pass


def _fake_db(conn):
    @asynccontextmanager
    async def _ctx():
        yield conn, None
    return _ctx


@pytest.fixture
def seguridad(monkeypatch):
    """Aplica conexión falsa y usuario autenticado; limpia al salir."""
    def _aplicar(conn=None, usuario=USER_A):
        if conn is not None:
            monkeypatch.setattr(
                main_module, "get_db_connection",
                lambda: _fake_db(conn)(),
            )
        if usuario is not None:
            app.dependency_overrides[get_current_user] = (
                lambda: usuario
            )
    yield _aplicar
    app.dependency_overrides.clear()
    monkeypatch.undo()


def _payload_clasificacion(**extra):
    base = {
        "tipo_registro": "plaga",
        "especie_afectada": "Maíz",
        "diagnostico_usuario": "Posible cogollero",
        "foto_url": "storage/evidencias/foto.jpg",
        "hash_transaccion": "abc123hash",
    }
    base.update(extra)
    return base


# ============================================================================
# FIX-01 — /api/ia/clasificar-evidencia
# ============================================================================

def test_clasificar_anonimo_401():
    assert client.post(
        CLASIFICAR, json=_payload_clasificacion()
    ).status_code == 401


def test_clasificar_autenticado_201(seguridad):
    # Orden de consultas: dedup SELECT → INSERT RETURNING →
    # SELECT suscripción (existe) → UPDATE balance.
    conn = _FakeConn(results=[[], {"id": REG}, {"usuario_id": USER_A}])
    seguridad(conn)
    r = client.post(CLASIFICAR, json=_payload_clasificacion())
    assert r.status_code == 201
    assert r.json()["registro_id"] == REG
    # El INSERT se hizo con la identidad del token, no del body.
    sql, params = conn.queries[1]
    assert "INSERT INTO registros_campo" in sql
    assert params[0] == USER_A
    # ≥1: el BackgroundTasks de recalcular_score_productivo también
    # commitea sobre la misma conexión falsa dentro del TestClient.
    assert conn.commits >= 1


def test_clasificar_suplantacion_ignorada(seguridad):
    # El body intenta acreditar a USER_B: el campo ya no existe en el
    # schema → se ignora y el incentivo va al usuario del token.
    conn = _FakeConn(results=[[], {"id": REG}, {"usuario_id": USER_A}])
    seguridad(conn, usuario=USER_A)
    r = client.post(
        CLASIFICAR,
        json=_payload_clasificacion(usuario_id=USER_B),
    )
    assert r.status_code == 201
    sql, params = conn.queries[1]
    assert params[0] == USER_A
    assert USER_B not in params


def test_clasificar_lote_ajeno_404(seguridad):
    # La SELECT de titularidad no devuelve fila → 404 indistinguible.
    conn = _FakeConn(results=[[]])
    seguridad(conn)
    r = client.post(
        CLASIFICAR,
        json=_payload_clasificacion(lote_id=LOTE),
    )
    assert r.status_code == 404
    # Solo se ejecutó la consulta de titularidad: nada insertado.
    assert conn.commits == 0
    assert not any("INSERT" in sql.upper() for sql, _ in conn.queries)


def test_clasificar_hash_repetido_409_sin_abono(seguridad):
    # Dedup fast-path: ya existe registro → 409 y nada se inserta.
    conn = _FakeConn(results=[[{"id": REG}]])
    seguridad(conn)
    r = client.post(CLASIFICAR, json=_payload_clasificacion())
    assert r.status_code == 409
    assert not any("INSERT" in sql.upper() for sql, _ in conn.queries)
    assert conn.commits == 0


def test_clasificar_unique_violation_409(seguridad):
    # Con m6 aplicada: un INSERT duplicado concurrente que choque con
    # el índice UNIQUE parcial aterriza aquí → 409, no 500 ni doble
    # abono. La concurrencia real del índice está verificada a nivel
    # PostgreSQL (ver m6_registros_campo_dedup_hash.sql, §verificación).
    conn = _FakeConn(
        results=[[]],
        fail_at=1,
        fail_exc=UniqueViolation("dup"),
    )
    seguridad(conn)
    r = client.post(CLASIFICAR, json=_payload_clasificacion())
    assert r.status_code == 409
    assert conn.commits == 0


def test_clasificar_hash_null_sin_dedup(seguridad):
    # hash_transaccion NULL queda fuera del índice parcial de m6 y del
    # SELECT de dedup: la primera consulta ejecutada es el INSERT y
    # cada registro sin hash inserta normalmente.
    conn = _FakeConn(results=[{"id": REG}, {"usuario_id": USER_A}])
    seguridad(conn)
    payload = _payload_clasificacion()
    del payload["hash_transaccion"]
    r = client.post(CLASIFICAR, json=payload)
    assert r.status_code == 201
    assert "INSERT INTO registros_campo" in conn.queries[0][0]
    assert not any(
        "hash_transaccion =" in sql for sql, _ in conn.queries
    )


def test_clasificar_doble_peticion_secuencial_un_solo_abono(seguridad):
    # Dos peticiones seguidas con el mismo hash: la primera inserta y
    # abona; la segunda choca con el fast-path (SELECT devuelve fila)
    # → 409 sin INSERT ni UPDATE de balance adicional.
    conn1 = _FakeConn(results=[[], {"id": REG}, {"usuario_id": USER_A}])
    seguridad(conn1)
    assert client.post(
        CLASIFICAR, json=_payload_clasificacion()
    ).status_code == 201

    conn2 = _FakeConn(results=[[{"id": REG}]])
    seguridad(conn2)
    r = client.post(CLASIFICAR, json=_payload_clasificacion())
    assert r.status_code == 409
    assert not any(
        "INSERT" in sql.upper() or "UPDATE" in sql.upper()
        for sql, _ in conn2.queries
    )


def test_clasificar_fallo_persistencia_500_sin_abono(seguridad):
    conn = _FakeConn(results=[[]], fail_at=1)
    seguridad(conn)
    r = client.post(CLASIFICAR, json=_payload_clasificacion())
    assert r.status_code == 500
    assert "fallo simulado" not in r.text
    assert conn.commits == 0


# ============================================================================
# FIX-02 — /api/finanzas/perfil-bancario/{usuario_id}
# ============================================================================

PERFIL_ROW = {
    "nombre": "Productor A",
    "cedula_ruc": "0000000000",
    "sector_comunidad": "Sector A",
    "provincia": "Manabí",
    "canton": "El Carmen",
    "parroquia": "4 de Diciembre",
    "score_interno": 315,
    "area_total_cultivos_m2": 0,
    "cabezas_ganado_total": 0,
}


def test_perfil_anonimo_401():
    assert client.get(f"{PERFIL}/{USER_A}").status_code == 401


def test_perfil_propio_200(seguridad):
    conn = _FakeConn(results=[PERFIL_ROW])
    seguridad(conn)
    r = client.get(f"{PERFIL}/{USER_A}")
    assert r.status_code == 200
    assert r.json()["datos_identidad"]["nombre_completo"] == "Productor A"


def test_perfil_ajeno_404_sin_consulta(seguridad):
    conn = _FakeConn(results=[PERFIL_ROW])
    seguridad(conn, usuario=USER_A)
    r = client.get(f"{PERFIL}/{USER_B}")
    assert r.status_code == 404
    # La verificación de titularidad ocurre antes de tocar la BD.
    assert conn.queries == []


def test_perfil_id_malformado_404(seguridad):
    conn = _FakeConn(results=[PERFIL_ROW])
    seguridad(conn)
    r = client.get(f"{PERFIL}/no-es-uuid")
    assert r.status_code == 404
    assert conn.queries == []


def test_perfil_error_interno_sin_fuga(seguridad):
    conn = _FakeConn(fail_at=0)
    seguridad(conn)
    r = client.get(f"{PERFIL}/{USER_A}")
    assert r.status_code == 500
    assert "cedula" not in r.text.lower()
    assert "fallo simulado" not in r.text
