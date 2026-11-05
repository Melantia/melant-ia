# backend/tests/test_levantamientos_api.py
"""Pruebas de endpoints de levantamientos GPS (ETAPA 2-B3).

TestClient sin lifespan: `get_db` y `get_current_user` se sustituyen por
overrides — ningún test toca la base de datos real. La conexión falsa
devuelve resultados enlatados en el orden en que el repository ejecuta
sus consultas.
"""
import uuid
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from core.dependencies import get_current_user, get_db
from main import app

client = TestClient(app, raise_server_exceptions=False)

BASE = "/api/v1/asistente/levantamientos"

USER_A = str(uuid.uuid4())
USER_B = str(uuid.uuid4())
LEV = str(uuid.uuid4())
LOTE = str(uuid.uuid4())
NOW = datetime.now(timezone.utc)


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
        self._result = (
            self._conn.results.pop(0) if self._conn.results else []
        )

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

    def cursor(self, row_factory=None):
        return _FakeCursor(self)

    async def commit(self):
        self.commits += 1


LEV_ROW = {
    "id": LEV, "usuario_id": USER_A, "lote_id": None,
    "nombre": "Lev A", "observaciones": None, "estado": "borrador",
    "area_m2": None, "perimetro_m": None,
    "created_at": NOW, "updated_at": NOW,
}

PUNTOS_4 = [
    {
        "id": str(uuid.uuid4()), "levantamiento_id": LEV, "orden": i,
        "latitud": la, "longitud": lo, "precision_gps_metros": 4.0,
        "fecha_hora": NOW,
    }
    for i, (la, lo) in enumerate(
        [(0.0, 0.0), (0.0, 0.0009), (0.0009, 0.0009), (0.0009, 0.0)],
        start=1,
    )
]


@pytest.fixture
def conn_factory():
    """Devuelve una factoría de overrides con la conexión falsa dada."""
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
    assert client.post(BASE, json={}).status_code == 401
    assert client.get(f"{BASE}/{LEV}").status_code == 401
    assert client.post(f"{BASE}/{LEV}/puntos", json={"puntos": []}).status_code == 401
    assert client.post(f"{BASE}/{LEV}/calcular").status_code == 401


# ============================================================================
# CREAR / LISTAR / OBTENER
# ============================================================================

def test_crear_levantamiento(conn_factory):
    conn = _FakeConn(results=[LEV_ROW])
    conn_factory(conn)
    r = client.post(BASE, json={"nombre": "Lev A"})
    assert r.status_code == 201
    assert r.json()["estado"] == "borrador"
    assert conn.commits == 1


def test_crear_con_lote_ajeno_403(conn_factory):
    conn = _FakeConn(results=[{"id": LOTE, "usuario_id": USER_B}])
    conn_factory(conn)
    r = client.post(BASE, json={"nombre": "X", "lote_id": LOTE})
    assert r.status_code == 403


def test_listar_solo_propios(conn_factory):
    conn = _FakeConn(results=[[LEV_ROW]])
    conn_factory(conn)
    r = client.get(BASE)
    assert r.status_code == 200
    assert len(r.json()) == 1
    sql, params = conn.queries[0]
    assert params == (USER_A,)


def test_obtener_con_puntos(conn_factory):
    conn = _FakeConn(results=[LEV_ROW, PUNTOS_4])
    conn_factory(conn)
    r = client.get(f"{BASE}/{LEV}")
    assert r.status_code == 200
    puntos = r.json()["puntos"]
    assert [p["orden"] for p in puntos] == [1, 2, 3, 4]


def test_levantamiento_inexistente_404(conn_factory):
    conn = _FakeConn(results=[[]])
    conn_factory(conn)
    assert client.get(f"{BASE}/{LEV}").status_code == 404


def test_levantamiento_ajeno_404(conn_factory):
    # El repository filtra por usuario_id: ajeno == inexistente (no se
    # revela su existencia).
    conn = _FakeConn(results=[[]])
    conn_factory(conn, usuario=USER_B)
    assert client.get(f"{BASE}/{LEV}").status_code == 404


def test_uuid_invalido_422(conn_factory):
    conn_factory(_FakeConn())
    assert client.get(f"{BASE}/no-es-uuid").status_code == 422


# ============================================================================
# PUNTOS
# ============================================================================

def test_agregar_puntos_borrador(conn_factory):
    # Orden de consultas del servicio: levantamiento, puntos existentes,
    # y un INSERT por vértice nuevo.
    conn = _FakeConn(results=[LEV_ROW, [], PUNTOS_4[0], PUNTOS_4[1]])
    conn_factory(conn)
    r = client.post(f"{BASE}/{LEV}/puntos", json={"puntos": [
        {"lat": 0.0, "lon": 0.0, "orden": 1, "precision_gps_metros": 4.0},
        {"lat": 0.0, "lon": 0.0009, "orden": 2, "precision_gps_metros": 4.0},
    ]})
    assert r.status_code == 201
    assert len(r.json()) == 2
    assert conn.commits == 1


def test_agregar_puntos_estado_cerrado_bloqueado(conn_factory):
    conn = _FakeConn(results=[{**LEV_ROW, "estado": "cerrado"}])
    conn_factory(conn)
    r = client.post(f"{BASE}/{LEV}/puntos", json={
        "puntos": [{"lat": 0, "lon": 0, "orden": 1}]})
    assert r.status_code == 400


def test_agregar_puntos_levantamiento_ajeno_404(conn_factory):
    conn = _FakeConn(results=[[]])
    conn_factory(conn, usuario=USER_B)
    r = client.post(f"{BASE}/{LEV}/puntos", json={
        "puntos": [{"lat": 0, "lon": 0, "orden": 1}]})
    assert r.status_code == 404


def test_puntos_payload_invalido_422(conn_factory):
    conn_factory(_FakeConn(results=[LEV_ROW]))
    r = client.post(f"{BASE}/{LEV}/puntos", json={
        "puntos": [{"lat": 91, "lon": 0, "orden": 1}]})
    assert r.status_code == 422


# ============================================================================
# IDEMPOTENCIA (offline-first — decisión B1, auditoría M2)
# ============================================================================

def test_crear_idempotente_devuelve_existente(conn_factory):
    # Reintento tras desconexión: la clave ya existe → devuelve el
    # levantamiento original sin INSERT adicional.
    conn = _FakeConn(results=[LEV_ROW])  # SELECT por client_operation_id → existe
    conn_factory(conn)
    r = client.post(BASE, json={
        "nombre": "Lev A", "client_operation_id": str(uuid.uuid4()),
    })
    assert r.status_code == 201
    assert r.json()["id"] == LEV
    assert all("INSERT" not in sql.upper() for sql, _ in conn.queries)


def test_crear_client_operation_id_nuevo_inserta(conn_factory):
    conn = _FakeConn(results=[[], LEV_ROW])  # no existe → INSERT
    conn_factory(conn)
    r = client.post(BASE, json={
        "nombre": "Lev A", "client_operation_id": str(uuid.uuid4()),
    })
    assert r.status_code == 201
    assert any("client_operation_id" in sql for sql, _ in conn.queries)


def test_agregar_puntos_reintento_reproduce_existentes(conn_factory):
    # orden 1-2 ya persistidos con las mismas coordenadas → se omiten,
    # se devuelven y no hay INSERT (reintento seguro).
    conn = _FakeConn(results=[LEV_ROW, PUNTOS_4[:2]])
    conn_factory(conn)
    r = client.post(f"{BASE}/{LEV}/puntos", json={"puntos": [
        {"lat": 0.0, "lon": 0.0, "orden": 1},
        {"lat": 0.0, "lon": 0.0009, "orden": 2},
    ]})
    assert r.status_code == 201
    assert [p["orden"] for p in r.json()] == [1, 2]
    assert all("INSERT" not in sql.upper() for sql, _ in conn.queries)


def test_agregar_puntos_orden_conflictivo_409(conn_factory):
    # orden 1 ya existe pero con coordenadas diferentes → 409 real.
    conn = _FakeConn(results=[LEV_ROW, [PUNTOS_4[0]]])
    conn_factory(conn)
    r = client.post(f"{BASE}/{LEV}/puntos", json={
        "puntos": [{"lat": 9.9, "lon": 9.9, "orden": 1}]})
    assert r.status_code == 409


def test_agregar_puntos_orden_duplicado_en_payload_422(conn_factory):
    conn = _FakeConn(results=[LEV_ROW, []])
    conn_factory(conn)
    r = client.post(f"{BASE}/{LEV}/puntos", json={"puntos": [
        {"lat": 0.0, "lon": 0.0, "orden": 1},
        {"lat": 0.1, "lon": 0.1, "orden": 1},
    ]})
    assert r.status_code == 422


# ============================================================================
# CALCULAR
# ============================================================================

def test_calcular_area_y_perimetro(conn_factory):
    actualizado = {
        **LEV_ROW, "estado": "cerrado",
        "area_m2": 9980.0, "perimetro_m": 399.8,
    }
    conn = _FakeConn(results=[LEV_ROW, PUNTOS_4, actualizado])
    conn_factory(conn)
    r = client.post(f"{BASE}/{LEV}/calcular")
    assert r.status_code == 200
    body = r.json()
    assert body["estado"] == "cerrado"
    assert body["area_m2"] == 9980.0
    # El servicio llamó a guardar_resultado con el cálculo de geodesia
    sql, params = conn.queries[2]
    assert "UPDATE levantamientos" in sql
    assert 9_500 < params[0] < 10_500   # área real calculada (~9 980 m²)
    assert 390 < params[1] < 410        # perímetro ~400 m


def test_calcular_menos_de_3_puntos_400(conn_factory):
    conn = _FakeConn(results=[LEV_ROW, PUNTOS_4[:2]])
    conn_factory(conn)
    assert client.post(f"{BASE}/{LEV}/calcular").status_code == 400


def test_calcular_aplicado_bloqueado(conn_factory):
    conn = _FakeConn(results=[{**LEV_ROW, "estado": "aplicado"}, PUNTOS_4])
    conn_factory(conn)
    assert client.post(f"{BASE}/{LEV}/calcular").status_code == 400


def test_calcular_inexistente_404(conn_factory):
    conn = _FakeConn(results=[[]])
    conn_factory(conn)
    assert client.post(f"{BASE}/{LEV}/calcular").status_code == 404


# ============================================================================
# APLICAR (2-B4)
# ============================================================================

LEV_CERRADO = {
    **LEV_ROW, "estado": "cerrado", "lote_id": LOTE,
    "area_m2": 9980.0, "perimetro_m": 399.8,
}
LOTE_ROW = {
    "id": LOTE, "finca_id": str(uuid.uuid4()),
    "nombre_lote": "L1", "area_metros_cuadrados": 9980.0,
}


def test_aplicar_actualiza_lote_y_estado(conn_factory):
    aplicado = {**LEV_CERRADO, "estado": "aplicado"}
    # I-5: tras guardar_resultado, _emitir_changelog ejecuta 3
    # consultas más (fila_lote → sync_next_seq → insertar_cambio)
    # dentro de la misma transacción, antes del commit.
    lote_full = {**LOTE_ROW, "version": 2}
    sync_seq = {"sync_next_seq": 1}
    cambio_ret = {"scope": f"usr:{USER_A}", "seq": 1,
                  "created_at": NOW}
    conn = _FakeConn(results=[
        LEV_CERRADO, LOTE_ROW, aplicado,
        lote_full, sync_seq, cambio_ret, PUNTOS_4,
    ])
    conn_factory(conn)
    r = client.post(f"{BASE}/{LEV}/aplicar")
    assert r.status_code == 200
    body = r.json()
    assert body["estado"] == "aplicado"
    # Los vértices se conservan (regla fundamental de 2-B4).
    assert len(body["puntos"]) == 4
    # El UPDATE del lote filtra por propiedad del usuario.
    sql, params = conn.queries[1]
    assert "UPDATE lotes" in sql
    assert "usuario_id = %s" in sql
    assert params == (9980.0, LOTE, USER_A)
    assert conn.commits == 1


def test_aplicar_borrador_400(conn_factory):
    conn = _FakeConn(results=[LEV_ROW])  # estado 'borrador'
    conn_factory(conn)
    assert client.post(f"{BASE}/{LEV}/aplicar").status_code == 400


def test_aplicar_aplicado_400(conn_factory):
    conn = _FakeConn(results=[{**LEV_CERRADO, "estado": "aplicado"}])
    conn_factory(conn)
    assert client.post(f"{BASE}/{LEV}/aplicar").status_code == 400


def test_aplicar_sin_lote_400(conn_factory):
    conn = _FakeConn(results=[{**LEV_CERRADO, "lote_id": None}])
    conn_factory(conn)
    assert client.post(f"{BASE}/{LEV}/aplicar").status_code == 400


def test_aplicar_inexistente_404(conn_factory):
    conn = _FakeConn(results=[[]])
    conn_factory(conn)
    assert client.post(f"{BASE}/{LEV}/aplicar").status_code == 404


def test_aplicar_ajeno_404(conn_factory):
    conn = _FakeConn(results=[[]])
    conn_factory(conn, usuario=USER_B)
    assert client.post(f"{BASE}/{LEV}/aplicar").status_code == 404


def test_aplicar_sin_token_401():
    assert client.post(f"{BASE}/{LEV}/aplicar").status_code == 401
