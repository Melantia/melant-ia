# backend/tests/test_web_changelog_integration.py
"""Integración I-5: escritores Web → sync_cambios — PostgreSQL real.

Cadena completa: endpoints Web de gestion_fincas/levantamientos ->
services -> repo (dominio) + emitir_upsert (changelog) -> pull.

Verifica contra melantia_test (fail-closed; get_db SIEMPRE
sobrescrito a la BD de pruebas — nada llega a melantia_db):
- CREATE/UPDATE de finca y lote emiten UN evento 'upsert' con
  snapshot completo en la misma transacción.
- version se incrementa en cada UPDATE web.
- aplicar_levantamiento (UPDATE de lote desde otro módulo) emite.
- Pull entrega los eventos web en orden seq.
- Aislamiento por scope entre usuarios.
- Rollback integral: fallo tras la escritura -> ni entidad, ni
  changelog, ni seq quedan.
- Push (I-2) y escritores Web comparten la misma secuencia del
  scope sin saltos ni duplicados.
"""
import asyncio
import time
import uuid

import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg.rows import dict_row

from conftest import pg_error_conexion, test_db_url
from core.dependencies import get_current_user, get_db
from main import app
import modules.gestion_fincas.services.fincas as svc_fincas
from modules.sync.auth import SyncIdentity, get_sync_identity
from shared.repositories import sync as sync_repo

P = "6c4e0000-0000-0000-0000-0000000000"
U_A = f"{P}01"
U_B = f"{P}02"
D_A = f"{P}11"            # dispositivo activo de A (pull)
D_B = f"{P}12"            # dispositivo activo de B
SID_A = f"{P}31"
SID_B = f"{P}33"
SECTOR = "TEST-WEBSYNC"
SCOPE_A = f"usr:{U_A}"
SCOPE_B = f"usr:{U_B}"


def run(coro):
    return asyncio.run(coro)


async def _conn():
    try:
        return await psycopg.AsyncConnection.connect(
            test_db_url(), autocommit=False, row_factory=dict_row
        )
    except psycopg.OperationalError as e:
        pg_error_conexion(e)


async def _borrar_datos_prueba(conn):
    scopes = (SCOPE_A, SCOPE_B)
    async with conn.cursor() as cur:
        await cur.execute(
            "DELETE FROM sync_cambios WHERE scope IN (%s,%s)", scopes
        )
        await cur.execute(
            "DELETE FROM sync_cursors WHERE scope IN (%s,%s)", scopes
        )
        await cur.execute(
            "DELETE FROM sync_operaciones"
            " WHERE usuario_id IN (%s,%s)", (U_A, U_B)
        )
        await cur.execute(
            "DELETE FROM levantamientos"
            " WHERE usuario_id IN (%s,%s)", (U_A, U_B)
        )
        await cur.execute(
            "DELETE FROM lotes WHERE finca_id IN"
            " (SELECT id FROM fincas WHERE usuario_id IN (%s,%s))",
            (U_A, U_B),
        )
        await cur.execute(
            "DELETE FROM fincas WHERE usuario_id IN (%s,%s)", (U_A, U_B)
        )
        await cur.execute(
            "DELETE FROM sesiones WHERE usuario_id IN (%s,%s)",
            (U_A, U_B),
        )
        await cur.execute(
            "DELETE FROM dispositivos WHERE usuario_id IN (%s,%s)",
            (U_A, U_B),
        )
        await cur.execute(
            "DELETE FROM usuarios WHERE sector_comunidad=%s", (SECTOR,)
        )
    await conn.commit()


async def _semilla():
    conn = await _conn()
    await _borrar_datos_prueba(conn)
    async with conn.cursor() as cur:
        for uid, nombre in [(U_A, "WebSync A"), (U_B, "WebSync B")]:
            await cur.execute(
                "INSERT INTO usuarios (id, nombre, cedula_ruc,"
                " sector_comunidad) VALUES (%s,%s,%s,%s)",
                (uid, nombre, f"77{uid[-3:]}", SECTOR),
            )
        for did, uid in [(D_A, U_A), (D_B, U_B)]:
            await cur.execute(
                "INSERT INTO dispositivos (id, usuario_id, nombre,"
                " estado) VALUES (%s,%s,'dev-test','activo')",
                (did, uid),
            )
        for auth_sid, uid, did in [(SID_A, U_A, D_A), (SID_B, U_B, D_B)]:
            await cur.execute(
                """
                INSERT INTO sesiones (
                    id, usuario_id, dispositivo_id, auth_proveedor,
                    auth_session_id, familia_id, estado, expires_at
                ) VALUES (%s, %s, %s, 'supabase', %s, %s, 'activa',
                    CURRENT_TIMESTAMP + INTERVAL '30 days')
                """,
                (str(uuid.uuid4()), uid, did, auth_sid, auth_sid),
            )
    await conn.commit()
    await conn.close()


async def _limpieza():
    conn = await _conn()
    await _borrar_datos_prueba(conn)
    await conn.close()


async def _db_test():
    """get_db con conexión REAL a melantia_test — siempre activo."""
    conn = await _conn()
    try:
        yield conn, None
    finally:
        try:
            await conn.rollback()
        except Exception:
            pass
        await conn.close()


def _override(usuario=U_A):
    app.dependency_overrides[get_current_user] = lambda: usuario


def _override_sync(usuario=U_A, session_id=SID_A):
    """Identidad del módulo sync (push/pull) — la verificación de
    sesión↔dispositivo en BD sigue siendo real."""
    app.dependency_overrides[get_sync_identity] = (
        lambda: SyncIdentity(
            usuario_id=usuario, session_id=uuid.UUID(session_id)
        )
    )


@pytest.fixture(scope="module")
def api():
    run(_semilla())
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()
    run(_limpieza())


@pytest.fixture(autouse=True)
def _entorno_test():
    app.dependency_overrides[get_db] = _db_test
    conn = run(_conn())
    run(_borrar_datos_prueba_parcial(conn))
    run(conn.close())
    yield
    app.dependency_overrides.clear()


async def _borrar_datos_prueba_parcial(conn):
    """Limpieza entre tests sin tocar usuarios/dispositivos/sesiones."""
    async with conn.cursor() as cur:
        await cur.execute(
            "DELETE FROM sync_cambios WHERE scope IN (%s,%s)",
            (SCOPE_A, SCOPE_B),
        )
        await cur.execute(
            "DELETE FROM sync_cursors WHERE scope IN (%s,%s)",
            (SCOPE_A, SCOPE_B),
        )
        await cur.execute(
            "DELETE FROM sync_operaciones"
            " WHERE usuario_id IN (%s,%s)", (U_A, U_B)
        )
        await cur.execute(
            "DELETE FROM levantamientos"
            " WHERE usuario_id IN (%s,%s)", (U_A, U_B)
        )
        await cur.execute(
            "DELETE FROM lotes WHERE finca_id IN"
            " (SELECT id FROM fincas WHERE usuario_id IN (%s,%s))",
            (U_A, U_B),
        )
        await cur.execute(
            "DELETE FROM fincas WHERE usuario_id IN (%s,%s)", (U_A, U_B)
        )
    await conn.commit()


async def _cambios(conn, scope):
    cur = await conn.execute(
        "SELECT seq, entity_type, entity_id, op, data,"
        "       entity_version, actor_id"
        " FROM sync_cambios WHERE scope = %s ORDER BY seq",
        (scope,),
    )
    return await cur.fetchall()


async def _last_seq(conn, scope):
    cur = await conn.execute(
        "SELECT last_seq FROM sync_cursors WHERE scope = %s", (scope,)
    )
    fila = await cur.fetchone()
    return int(fila["last_seq"]) if fila else 0


async def _version_finca(conn, finca_id):
    cur = await conn.execute(
        "SELECT version FROM fincas WHERE id = %s", (str(finca_id),)
    )
    return int((await cur.fetchone())["version"])


async def _version_lote(conn, lote_id):
    cur = await conn.execute(
        "SELECT version FROM lotes WHERE id = %s", (str(lote_id),)
    )
    return int((await cur.fetchone())["version"])


FINCAS = "/api/v1/fincas"
PULL = "/api/v1/sync/pull"


def _crear_finca(api, nombre="Finca W"):
    _override(U_A)
    r = api.post(FINCAS, json={"nombre": nombre})
    assert r.status_code == 201
    return r.json()["id"]


def _sembrar_levantamiento(conn, lote_id, usuario=U_A, estado="cerrado"):
    """Levantamiento 'cerrado' con lote asignado — listo para
    aplicar vía endpoint."""
    lev_id = str(uuid.uuid4())

    async def _ins():
        async with conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO levantamientos (
                    id, usuario_id, lote_id, nombre, estado,
                    area_m2, perimetro_m
                ) VALUES (%s, %s, %s, 'Lev Test', %s, 9980.00, 402.50)
                """,
                (lev_id, usuario, str(lote_id), estado),
            )
        await conn.commit()

    run(_ins())
    return lev_id


# ============================================================================
# CREATE — un evento upsert con snapshot completo por escritura
# ============================================================================

def test_crear_finca_emite_upsert(api):
    fid = _crear_finca(api)
    conn = run(_conn())
    cambios = run(_cambios(conn, SCOPE_A))
    run(conn.close())
    assert len(cambios) == 1
    c = cambios[0]
    assert c["seq"] == 1
    assert c["entity_type"] == "finca"
    assert str(c["entity_id"]) == fid
    assert c["op"] == "upsert"
    assert c["entity_version"] == 1
    assert c["actor_id"] is not None
    assert c["data"]["nombre"] == "Finca W"
    assert c["data"]["usuario_id"] is not None


def test_crear_lote_emite_upsert(api):
    fid = _crear_finca(api)
    _override(U_A)
    r = api.post(
        f"{FINCAS}/{fid}/lotes", json={"nombre_lote": "Lote Norte"}
    )
    assert r.status_code == 201
    conn = run(_conn())
    cambios = run(_cambios(conn, SCOPE_A))
    run(conn.close())
    assert len(cambios) == 2                       # finca + lote
    lote_evt = cambios[1]
    assert lote_evt["seq"] == 2
    assert lote_evt["entity_type"] == "lote"
    assert lote_evt["data"]["nombre_lote"] == "Lote Norte"
    assert lote_evt["data"]["finca_id"] == fid


# ============================================================================
# UPDATE — version incrementada + evento con entity_version real
# ============================================================================

def test_actualizar_finca_incrementa_version_y_emite(api):
    fid = _crear_finca(api)
    _override(U_A)
    r = api.patch(FINCAS + f"/{fid}", json={"nombre": "Finca Renombrada"})
    assert r.status_code == 200
    conn = run(_conn())
    version = run(_version_finca(conn, fid))
    cambios = run(_cambios(conn, SCOPE_A))
    run(conn.close())
    assert version == 2
    assert len(cambios) == 2
    upd = cambios[1]
    assert upd["seq"] == 2
    assert upd["op"] == "upsert"
    assert upd["entity_version"] == 2
    assert upd["data"]["nombre"] == "Finca Renombrada"


def test_actualizar_lote_incrementa_version_y_emite(api):
    fid = _crear_finca(api)
    _override(U_A)
    lid = api.post(
        f"{FINCAS}/{fid}/lotes", json={"nombre_lote": "L1"}
    ).json()["id"]
    r = api.patch(
        f"{FINCAS}/{fid}/lotes/{lid}", json={"nombre_lote": "L1-R"}
    )
    assert r.status_code == 200
    conn = run(_conn())
    version = run(_version_lote(conn, lid))
    cambios = run(_cambios(conn, SCOPE_A))
    run(conn.close())
    assert version == 2
    evt = cambios[-1]
    assert evt["entity_type"] == "lote"
    assert evt["entity_version"] == 2
    assert evt["data"]["nombre_lote"] == "L1-R"


def test_dos_updates_consecutivos_dos_eventos(api):
    """Sin eventos duplicados: cada escritura = exactamente 1 fila."""
    fid = _crear_finca(api)
    _override(U_A)
    api.patch(FINCAS + f"/{fid}", json={"nombre": "N2"})
    api.patch(FINCAS + f"/{fid}", json={"nombre": "N3"})
    conn = run(_conn())
    cambios = run(_cambios(conn, SCOPE_A))
    version = run(_version_finca(conn, fid))
    run(conn.close())
    assert version == 3
    assert [c["seq"] for c in cambios] == [1, 2, 3]
    assert [c["entity_version"] for c in cambios] == [1, 2, 3]


# ============================================================================
# LEVANTAMIENTO — escritor de lotes fuera de M3
# ============================================================================

def test_aplicar_levantamiento_emite_lote(api):
    fid = _crear_finca(api)
    _override(U_A)
    lid = api.post(
        f"{FINCAS}/{fid}/lotes", json={"nombre_lote": "Lote Medido"}
    ).json()["id"]
    conn = run(_conn())
    lev_id = _sembrar_levantamiento(conn, lid)
    run(conn.close())

    r = api.post(
        f"/api/v1/asistente/levantamientos/{lev_id}/aplicar"
    )
    assert r.status_code in (200, 201), r.text

    conn = run(_conn())
    cambios = run(_cambios(conn, SCOPE_A))
    version = run(_version_lote(conn, lid))
    run(conn.close())
    assert version == 2                      # update del área
    evt = cambios[-1]
    assert evt["entity_type"] == "lote"
    assert evt["op"] == "upsert"
    assert float(evt["data"]["area_metros_cuadrados"]) == 9980.0


# ============================================================================
# PULL — los eventos web son consumibles por I-4
# ============================================================================

def test_pull_entrega_eventos_web(api):
    fid = _crear_finca(api)
    _override(U_A)
    api.patch(FINCAS + f"/{fid}", json={"nombre": "V2"})
    _override_sync(U_A)
    r = api.get(PULL, params={"device_id": D_A, "cursor": 0})
    assert r.status_code == 200
    body = r.json()
    assert [c["seq"] for c in body["changes"]] == [1, 2]
    assert body["changes"][0]["entity_type"] == "finca"
    assert body["changes"][1]["entity_version"] == 2
    assert body["next_cursor"] == 2
    assert body["has_more"] is False


def test_aislamiento_scope_usuarios(api):
    _crear_finca(api)                        # evento en scope A
    _override(U_B)
    _override_sync(U_B, SID_B)
    r = api.get(PULL, params={"device_id": D_B, "cursor": 0})
    assert r.status_code == 200
    assert r.json()["changes"] == []


# ============================================================================
# ROLLBACK INTEGRAL — fallo post-escritura no deja residuo
# ============================================================================

def test_rollback_integral_si_falla_changelog(api, monkeypatch):
    """Fallo en emitir_changelog tras el INSERT de finca: ni la
    entidad ni el seq ni el changelog pueden quedar confirmados."""
    original = svc_fincas._emitir_changelog

    async def _falla(conn, usuario_id, entity_type, entity_id):
        raise RuntimeError("fallo inyectado post-insert")

    monkeypatch.setattr(svc_fincas, "_emitir_changelog", _falla)
    _override(U_A)
    r = api.post(FINCAS, json={"nombre": "Finca Inyectada"})
    assert r.status_code == 500
    monkeypatch.setattr(svc_fincas, "_emitir_changelog", original)

    conn = run(_conn())
    cur = run(conn.execute(
        "SELECT count(*) AS n FROM fincas WHERE usuario_id = %s",
        (U_A,),
    ))
    n_fincas = run(cur.fetchone())["n"]
    cambios = run(_cambios(conn, SCOPE_A))
    last = run(_last_seq(conn, SCOPE_A))
    run(conn.close())
    assert n_fincas == 0                     # entidad revertida
    assert cambios == []                     # sin changelog
    assert last == 0                         # sin seq reservado


def test_error_validacion_no_emite(api):
    """Error de dominio (422 geo inexistente): nada se escribe."""
    _override(U_A)
    r = api.post(FINCAS, json={
        "nombre": "Geo Inválida", "provincia_id": 999999,
    })
    assert r.status_code == 422
    conn = run(_conn())
    cambios = run(_cambios(conn, SCOPE_A))
    run(conn.close())
    assert cambios == []


# ============================================================================
# INTERLEAVED — push y web comparten la secuencia del scope
# ============================================================================

def test_push_y_web_comparten_secuencia(api):
    """El push (I-2) y los writers web asignan seqs contiguos en la
    misma fila de sync_cursors — un solo stream por scope."""
    _override(U_A)
    _override_sync(U_A)
    # Push real: crea finca por sync (seq 1)
    eid = str(uuid.uuid4())
    pr = api.post("/api/v1/sync/push", json={
        "device_id": D_A,
        "operations": [{
            "client_operation_id": str(uuid.uuid4()),
            "entity_type": "finca",
            "entity_id": eid,
            "action": "create",
            "base_version": None,
            "payload": {"nombre": "Finca Push"},
            "client_created_at": "2026-11-04T12:00:00Z",
        }],
    })
    assert pr.json()["results"][0]["status"] == "applied"

    # Web: actualiza esa misma finca (seq 2, version 2)
    r = api.patch(
        FINCAS + f"/{eid}", json={"nombre": "Push Editada Web"}
    )
    assert r.status_code == 200

    conn = run(_conn())
    cambios = run(_cambios(conn, SCOPE_A))
    last = run(_last_seq(conn, SCOPE_A))
    run(conn.close())
    assert [c["seq"] for c in cambios] == [1, 2]
    assert [c["entity_version"] for c in cambios] == [1, 2]
    assert cambios[1]["data"]["nombre"] == "Push Editada Web"
    assert last == 2
