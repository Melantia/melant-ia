# backend/tests/test_gestion_fincas_api.py
"""Pruebas E2E del Módulo 3 (Gestión de Fincas) — PostgreSQL real.

Cadena completa: get_current_user (override) -> endpoint -> service ->
shared/repositories -> melantia_test. Mismo patrón que
test_ep_proyectos_api: usuarios con UUIDs prefijados, overrides de
get_db/get_current_user y limpieza por fixture.

Cubre: CRUD fincas, CRUD lotes, aislamiento por propietario (404
indistinguible), validación geo DPA/INEC y registro de rutas.
Se saltan si PostgreSQL no está disponible.
"""
import asyncio
import uuid

import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg.rows import dict_row

from conftest import pg_error_conexion, test_db_url
from core.dependencies import get_current_user, get_db
from main import app

P = "f1ca5000-0000-0000-0000-000000000"  # prefijo (11 dígitos + 3 hex)
U_A = f"{P}001"          # propietario
U_B = f"{P}002"          # otro usuario (finca ajena)
SECTOR = "TEST-FINCAS"

GEO = {}


def run(coro):
    return asyncio.run(coro)


async def _conn():
    # Solo la BD de pruebas: test_db_url valida aislamiento y hace
    # skip sin la variable; jamás toca la BD de la aplicación.
    try:
        return await psycopg.AsyncConnection.connect(
            test_db_url(), autocommit=False, row_factory=dict_row
        )
    except psycopg.OperationalError as e:
        pg_error_conexion(e)


async def _borrar_datos_prueba(conn):
    """Borra todo rastro de los usuarios de prueba (idempotente —
    sirve tanto de pre-limpieza como de teardown)."""
    async with conn.cursor() as cur:
        await cur.execute(
            "DELETE FROM lotes WHERE finca_id IN"
            " (SELECT id FROM fincas WHERE usuario_id IN (%s,%s))",
            (U_A, U_B),
        )
        await cur.execute(
            "DELETE FROM fincas WHERE usuario_id IN (%s,%s)", (U_A, U_B)
        )
        await cur.execute(
            "DELETE FROM usuarios WHERE sector_comunidad=%s", (SECTOR,)
        )
    await conn.commit()


async def _semilla():
    """Dos usuarios + ids del catálogo geo real (Azuay/Cuenca) +
    una finca ajena para probar aislamiento."""
    conn = await _conn()
    await _borrar_datos_prueba(conn)
    async with conn.cursor() as cur:
        for uid, nombre in [(U_A, "Fincas A"), (U_B, "Fincas B")]:
            await cur.execute(
                "INSERT INTO usuarios (id, nombre, cedula_ruc,"
                " sector_comunidad) VALUES (%s,%s,%s,%s)",
                (uid, nombre, f"77{uid[-3:]}", SECTOR),
            )
        await cur.execute(
            "SELECT codigo_inec, id FROM provincias"
            " WHERE codigo_inec IN ('01','17')"
        )
        for fila in await cur.fetchall():
            GEO[f"prov_{fila['codigo_inec']}"] = fila["id"]
        await cur.execute(
            "SELECT codigo_inec, id, provincia_id FROM cantones"
            " WHERE codigo_inec IN ('0101','1701')"
        )
        for fila in await cur.fetchall():
            GEO[f"cant_{fila['codigo_inec']}"] = fila["id"]
        await cur.execute(
            "SELECT codigo_inec, id, canton_id FROM parroquias"
            " WHERE codigo_inec='010150'"
        )
        fila = await cur.fetchone()
        GEO["parr_010150"] = fila["id"]
        # Finca ajena (de U_B) — nunca debe ser visible para U_A
        await cur.execute(
            "INSERT INTO fincas (id, usuario_id, nombre, provincia_id)"
            " VALUES (%s,%s,%s,%s)",
            (str(uuid.uuid4()), U_B, "Finca Ajena", GEO["prov_01"]),
        )
    await conn.commit()
    await conn.close()


async def _limpieza():
    conn = await _conn()
    await _borrar_datos_prueba(conn)
    await conn.close()


def _override(usuario):
    """get_db con conexión REAL + usuario fijado (sin JWT real)."""
    async def _db():
        conn = await _conn()
        try:
            yield conn, None
        finally:
            try:
                await conn.rollback()
            except Exception:
                pass
            await conn.close()
    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = lambda: usuario


@pytest.fixture(scope="module")
def api():
    run(_semilla())
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()
    run(_limpieza())


@pytest.fixture(autouse=True)
def _limpiar_overrides():
    yield
    app.dependency_overrides.clear()


BASE = "/api/v1/fincas"
GEO_BASE = "/api/v1/geografia"


# ============================================================================
# AUTENTICACIÓN
# ============================================================================

def test_sin_autenticacion_401(api):
    """Sin override de usuario ni token -> 401 del get_current_user real."""
    assert api.get(BASE).status_code == 401
    assert api.post(BASE, json={"nombre": "X"}).status_code == 401


# ============================================================================
# FINCAS — CREAR
# ============================================================================

def test_crear_finca_minima(api):
    _override(U_A)
    r = api.post(BASE, json={"nombre": "Finca El Progreso"})
    assert r.status_code == 201
    cuerpo = r.json()
    assert cuerpo["nombre"] == "Finca El Progreso"
    assert cuerpo["num_lotes"] == 0
    uuid.UUID(cuerpo["id"])  # id es UUID válido


def test_crear_finca_deriva_geo_desde_parroquia(api):
    """Enviando solo parroquia_id el backend deriva cantón y provincia."""
    _override(U_A)
    r = api.post(
        BASE,
        json={
            "nombre": "Finca Geo",
            "parroquia_id": GEO["parr_010150"],
            "tipo_pyme": "PYME Agrícola",
        },
    )
    assert r.status_code == 201
    cuerpo = r.json()
    assert cuerpo["parroquia_id"] == GEO["parr_010150"]
    assert cuerpo["canton_id"] == GEO["cant_0101"]
    assert cuerpo["provincia_id"] == GEO["prov_01"]
    assert cuerpo["provincia"] == "Azuay"


def test_geo_incoherente_422(api):
    """Cantón de Pichincha declarado bajo Azuay -> 422."""
    _override(U_A)
    r = api.post(
        BASE,
        json={
            "nombre": "Geo Mala",
            "provincia_id": GEO["prov_01"],
            "canton_id": GEO["cant_1701"],
        },
    )
    assert r.status_code == 422


def test_geo_inexistente_422(api):
    _override(U_A)
    r = api.post(BASE, json={"nombre": "X", "provincia_id": 99999})
    assert r.status_code == 422


def test_crear_sin_nombre_422(api):
    _override(U_A)
    assert api.post(BASE, json={}).status_code == 422
    assert api.post(BASE, json={"nombre": ""}).status_code == 422


# ============================================================================
# FINCAS — LISTAR Y DETALLE
# ============================================================================

def test_listar_solo_fincas_propias(api):
    _override(U_A)
    api.post(BASE, json={"nombre": "Mía Visible"})
    r = api.get(BASE)
    assert r.status_code == 200
    nombres = [f["nombre"] for f in r.json()]
    assert "Mía Visible" in nombres
    assert "Finca Ajena" not in nombres


def test_detalle_propia_con_lotes(api):
    _override(U_A)
    finca = api.post(BASE, json={"nombre": "Con Detalle"}).json()
    r = api.get(f"{BASE}/{finca['id']}")
    assert r.status_code == 200
    assert r.json()["nombre"] == "Con Detalle"
    assert r.json()["lotes"] == []


def test_detalle_ajena_404_indistinguible(api):
    _override(U_B)
    finca_b = api.post(BASE, json={"nombre": "De B"}).json()
    _override(U_A)
    assert api.get(f"{BASE}/{finca_b['id']}").status_code == 404


def test_detalle_inexistente_404(api):
    _override(U_A)
    assert api.get(f"{BASE}/{uuid.uuid4()}").status_code == 404


# ============================================================================
# FINCAS — ACTUALIZAR
# ============================================================================

def test_actualizar_finca_propia_persiste(api):
    _override(U_A)
    finca = api.post(BASE, json={"nombre": "Antes"}).json()
    r = api.patch(BASE + "/" + finca["id"], json={
        "nombre": "Después",
        "parroquia_id": GEO["parr_010150"],
    })
    assert r.status_code == 200
    assert r.json()["nombre"] == "Después"
    assert r.json()["canton_id"] == GEO["cant_0101"]
    # persiste de verdad:
    assert api.get(f"{BASE}/{finca['id']}").json()["nombre"] == "Después"


def test_actualizar_ajena_404(api):
    _override(U_B)
    finca_b = api.post(BASE, json={"nombre": "De B2"}).json()
    _override(U_A)
    r = api.patch(f"{BASE}/{finca_b['id']}", json={"nombre": "Robada"})
    assert r.status_code == 404


def test_no_cambia_propietario(api):
    """usuario_id no es campo editable: extra=forbid -> 422."""
    _override(U_A)
    finca = api.post(BASE, json={"nombre": "Mía"}).json()
    r = api.patch(f"{BASE}/{finca['id']}", json={"usuario_id": U_B})
    assert r.status_code == 422


def test_patch_vacio_422(api):
    _override(U_A)
    finca = api.post(BASE, json={"nombre": "Llena"}).json()
    assert api.patch(f"{BASE}/{finca['id']}", json={}).status_code == 422


# ============================================================================
# LOTES
# ============================================================================

def test_crear_y_listar_lote(api):
    _override(U_A)
    finca = api.post(BASE, json={"nombre": "Con Lotes"}).json()
    r = api.post(f"{BASE}/{finca['id']}/lotes", json={
        "nombre_lote": "Lote Norte",
        "cultivo_principal": "Cacao",
        "area_metros_cuadrados": 1500.5,
    })
    assert r.status_code == 201
    assert r.json()["finca_id"] == finca["id"]

    r2 = api.get(f"{BASE}/{finca['id']}/lotes")
    assert r2.status_code == 200
    assert [l["nombre_lote"] for l in r2.json()] == ["Lote Norte"]


def test_lote_area_negativa_422(api):
    _override(U_A)
    finca = api.post(BASE, json={"nombre": "F"}).json()
    r = api.post(f"{BASE}/{finca['id']}/lotes", json={
        "nombre_lote": "Mal",
        "area_metros_cuadrados": -1,
    })
    assert r.status_code == 422


def test_lotes_en_finca_ajena_404(api):
    _override(U_B)
    finca_b = api.post(BASE, json={"nombre": "De B3"}).json()
    _override(U_A)
    base_lotes = f"{BASE}/{finca_b['id']}/lotes"
    assert api.get(base_lotes).status_code == 404
    assert api.post(
        base_lotes, json={"nombre_lote": "Intruso"}
    ).status_code == 404


def test_lote_de_otra_finca_404(api):
    """Un lote existe pero cuelga de otra finca -> 404 indistinguible."""
    _override(U_A)
    f1 = api.post(BASE, json={"nombre": "F1"}).json()
    f2 = api.post(BASE, json={"nombre": "F2"}).json()
    lote = api.post(
        f"{BASE}/{f1['id']}/lotes", json={"nombre_lote": "L1"}
    ).json()
    r = api.patch(
        f"{BASE}/{f2['id']}/lotes/{lote['id']}",
        json={"nombre_lote": "Trasladado"},
    )
    assert r.status_code == 404


def test_actualizar_lote(api):
    _override(U_A)
    finca = api.post(BASE, json={"nombre": "F3"}).json()
    lote = api.post(
        f"{BASE}/{finca['id']}/lotes", json={"nombre_lote": "L0"}
    ).json()
    r = api.patch(
        f"{BASE}/{finca['id']}/lotes/{lote['id']}",
        json={"estado_salud_lote": "Monitoreo", "variedad": "CCN-51"},
    )
    assert r.status_code == 200
    assert r.json()["estado_salud_lote"] == "Monitoreo"
    assert r.json()["variedad"] == "CCN-51"


# ============================================================================
# GEOGRAFÍA (catálogo para formularios)
# ============================================================================

def test_geografia_provincias(api):
    _override(U_A)
    r = api.get(f"{GEO_BASE}/provincias")
    assert r.status_code == 200
    provincias = r.json()
    assert len(provincias) == 24
    assert any(p["codigo_inec"] == "01" for p in provincias)


def test_geografia_cantones_filtrados(api):
    _override(U_A)
    r = api.get(
        f"{GEO_BASE}/cantones", params={"provincia_id": GEO["prov_01"]}
    )
    assert r.status_code == 200
    assert all(c["provincia_id"] == GEO["prov_01"] for c in r.json())
    assert any(c["codigo_inec"] == "0101" for c in r.json())


# ============================================================================
# PERSISTENCIA Y REGISTRO DE RUTAS
# ============================================================================

def test_persistencia_real_en_bd(api):
    """La fila existe en melantia_test con el usuario_id del JWT."""
    _override(U_A)
    finca = api.post(BASE, json={"nombre": "Persistida"}).json()

    async def _verificar():
        conn = await _conn()
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT usuario_id, nombre FROM fincas WHERE id=%s",
                (finca["id"],),
            )
            fila = await cur.fetchone()
        await conn.close()
        return fila

    fila = run(_verificar())
    assert fila["nombre"] == "Persistida"
    assert str(fila["usuario_id"]) == U_A


def test_rutas_registradas_en_openapi(api):
    paths = app.openapi()["paths"]
    assert BASE in paths
    assert f"{BASE}/{{finca_id}}" in paths
    assert f"{BASE}/{{finca_id}}/lotes" in paths
    assert f"{GEO_BASE}/provincias" in paths
