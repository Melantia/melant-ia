# backend/tests/test_sync_push_delete_api.py
"""Pruebas E2E de push DELETE con tombstones y B-3 — I-7.

PostgreSQL real (melantia_test — get_db siempre sobrescrito; nada
llega a melantia_db). Dos caminos de identidad como en I-2/I-4:
- REAL (auth): tokens ES256 + JWKS simulado → get_sync_identity.
- OVERRIDE (dominio): SyncIdentity inyectada; la verificación
  sesión↔dispositivo sigue siendo real.

Cubiertas: base_version obligatoria (422), rechazo en create (422),
update aplicado (version+1, changelog, seq, ledger), conflicto por
versión desactualizada (sin escritura, server_state, resultado
persistido y rejugable), TOCTOU concurrente (1 applied + 1
conflict), entidad ajena/inexistente (not_found indistinguible),
payload no permitido (allowlist por schema), lote con propiedad
vía finca, update tras update web, batch create+update, rollback
integral.
"""
import asyncio
import base64
import threading
import time
import uuid

import psycopg
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from jose import jwt as jose_jwt
from psycopg.rows import dict_row

from conftest import pg_error_conexion, test_db_url
from core.dependencies import get_current_user, get_db
from core.supabase_jwt import SupabaseJWTVerifier
import core.supabase_jwt as supabase_jwt_mod
from main import app
from modules.sync.auth import SyncIdentity, get_sync_identity
from shared.repositories import fincas as fincas_repo

P = "7d3f0000-0000-0000-0000-0000000000"
U_A = f"{P}01"
U_B = f"{P}02"
D_A = f"{P}11"
D_B = f"{P}12"
D_A2 = f"{P}15"          # 2.º dispositivo activo de A
SID_A = f"{P}31"
SID_B = f"{P}33"
SID_A2 = f"{P}32"
AUTH_U_A = f"{P}41"
AUTH_U_B = f"{P}42"
SECTOR = "TEST-SYNCUPD"
SCOPE_A = f"usr:{U_A}"
SCOPE_B = f"usr:{U_B}"

SUPABASE_URL_TEST = "https://supabase-de-prueba.melantia.invalid"
ISSUER = f"{SUPABASE_URL_TEST}/auth/v1"
KID = "kid-de-prueba-sync-update"


def run(coro):
    return asyncio.run(coro)


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _par_ec():
    priv = ec.generate_private_key(ec.SECP256R1())
    pem = priv.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    nums = priv.public_key().public_numbers()
    jwk = {
        "kty": "EC", "crv": "P-256", "alg": "ES256", "use": "sig",
        "kid": KID,
        "x": _b64url(nums.x.to_bytes(32, "big")),
        "y": _b64url(nums.y.to_bytes(32, "big")),
    }
    return pem, jwk


PEM, JWK = _par_ec()


def _token_supabase(sub, session_id, **extra):
    ahora = int(time.time())
    claims = {
        "iss": ISSUER, "aud": "authenticated", "sub": str(sub),
        "session_id": str(session_id), "role": "authenticated",
        "iat": ahora, "exp": ahora + 3600,
    }
    claims.update(extra)
    return jose_jwt.encode(
        claims, PEM, algorithm="ES256",
        headers={"kid": KID, "typ": "JWT"},
    )


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


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
            "DELETE FROM usuarios_auth_puente"
            " WHERE usuario_id IN (%s,%s)", (U_A, U_B)
        )
        await cur.execute(
            "DELETE FROM usuarios WHERE sector_comunidad=%s", (SECTOR,)
        )
    await conn.commit()


async def _semilla():
    conn = await _conn()
    await _borrar_datos_prueba(conn)
    async with conn.cursor() as cur:
        for uid, nombre in [(U_A, "Upd A"), (U_B, "Upd B")]:
            await cur.execute(
                "INSERT INTO usuarios (id, nombre, cedula_ruc,"
                " sector_comunidad) VALUES (%s,%s,%s,%s)",
                (uid, nombre, f"66{uid[-3:]}", SECTOR),
            )
        for auth_id, uid, ced in [
            (AUTH_U_A, U_A, "PU00000000000000UA"),
            (AUTH_U_B, U_B, "PU00000000000000UB"),
        ]:
            await cur.execute(
                "INSERT INTO usuarios_auth_puente"
                " (id, usuario_id, cedula_ruc, vinculado_por)"
                " VALUES (%s,%s,%s,'registro')",
                (auth_id, uid, ced),
            )
        for did, uid in [(D_A, U_A), (D_A2, U_A), (D_B, U_B)]:
            await cur.execute(
                "INSERT INTO dispositivos (id, usuario_id, nombre,"
                " estado) VALUES (%s,%s,'dev-test','activo')",
                (did, uid),
            )
        for sid_ext, uid, did in [
            (SID_A, U_A, D_A), (SID_A2, U_A, D_A2), (SID_B, U_B, D_B),
        ]:
            await cur.execute(
                """
                INSERT INTO sesiones (
                    id, usuario_id, dispositivo_id, auth_proveedor,
                    auth_session_id, familia_id, estado, expires_at
                ) VALUES (%s, %s, %s, 'supabase', %s, %s, 'activa',
                    CURRENT_TIMESTAMP + INTERVAL '30 days')
                """,
                (str(uuid.uuid4()), uid, did, sid_ext, sid_ext),
            )
    await conn.commit()
    await conn.close()


async def _limpieza():
    conn = await _conn()
    await _borrar_datos_prueba(conn)
    await conn.close()


async def _borrar_resultados_sync(conn):
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
            "UPDATE dispositivos SET ultimo_pull_seq = NULL"
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


async def _sembrar_finca(usuario=U_A, nombre="Finca S", version=1):
    """Finca propia con version controlada — objetivo del update."""
    fid = str(uuid.uuid4())
    conn = await _conn()
    async with conn.cursor() as cur:
        await cur.execute(
            "INSERT INTO fincas (id, usuario_id, nombre, version)"
            " VALUES (%s,%s,%s,%s)",
            (fid, usuario, nombre, version),
        )
    await conn.commit()
    await conn.close()
    return fid


async def _sembrar_lote(finca_id, nombre="Lote S", version=1):
    lid = str(uuid.uuid4())
    conn = await _conn()
    async with conn.cursor() as cur:
        await cur.execute(
            "INSERT INTO lotes (id, finca_id, nombre_lote, version)"
            " VALUES (%s,%s,%s,%s)",
            (lid, finca_id, nombre, version),
        )
    await conn.commit()
    await conn.close()
    return lid


async def _db_test():
    conn = await _conn()
    try:
        yield conn, None
    finally:
        try:
            await conn.rollback()
        except Exception:
            pass
        await conn.close()


def _override(usuario=U_A, session_id=SID_A):
    app.dependency_overrides[get_sync_identity] = (
        lambda: SyncIdentity(
            usuario_id=usuario, session_id=uuid.UUID(session_id)
        )
    )
    app.dependency_overrides[get_current_user] = lambda: usuario


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
    run(_borrar_resultados_sync(conn))
    run(conn.close())
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def auth_supabase(monkeypatch):
    verifier = SupabaseJWTVerifier(
        issuer=ISSUER, jwks_url=f"{ISSUER}/.well-known/jwks.json"
    )

    async def _jwks_falso():
        return {KID: JWK}

    verifier._download_jwks = _jwks_falso
    monkeypatch.setattr(supabase_jwt_mod, "_verifier", verifier)
    from core.config import settings
    monkeypatch.setattr(settings, "supabase_url", SUPABASE_URL_TEST)


PUSH = "/api/v1/sync/push"


def _op_update(entity_type, entity_id, base_version, payload):
    return {
        "client_operation_id": str(uuid.uuid4()),
        "entity_type": entity_type,
        "entity_id": entity_id,
        "action": "update",
        "base_version": base_version,
        "payload": payload,
        "client_created_at": "2026-11-04T12:00:00Z",
    }



def _op_delete(entity_type, entity_id, base_version):
    return {
        "client_operation_id": str(uuid.uuid4()),
        "entity_type": entity_type,
        "entity_id": entity_id,
        "action": "delete",
        "base_version": base_version,
        "payload": {},
        "client_created_at": "2026-11-05T12:00:00Z",
    }


def _push(api, ops, device_id=D_A, headers=None):
    return api.post(
        PUSH,
        json={"device_id": str(device_id), "operations": ops},
        headers=headers or {},
    )


def _pull(api, device_id=D_A, cursor=0):
    return api.get(
        "/api/v1/sync/pull",
        params={"device_id": str(device_id), "cursor": cursor},
    )


async def _version(conn, tabla, eid):
    cur = await conn.execute(
        f"SELECT version FROM {tabla} WHERE id = %s", (str(eid),)
    )
    fila = await cur.fetchone()
    return int(fila["version"]) if fila else None


async def _deleted_at(conn, tabla, eid):
    cur = await conn.execute(
        f"SELECT deleted_at FROM {tabla} WHERE id = %s", (str(eid),)
    )
    fila = await cur.fetchone()
    return fila["deleted_at"] if fila else "NOFILA"


async def _n_cambios(conn, scope):
    cur = await conn.execute(
        "SELECT count(*) AS n FROM sync_cambios WHERE scope=%s",
        (scope,),
    )
    return (await cur.fetchone())["n"]


async def _ultimo_cambio(conn, scope):
    cur = await conn.execute(
        "SELECT op, entity_type, entity_version, data->>'deleted_at'"
        " AS del_at FROM sync_cambios WHERE scope=%s"
        " ORDER BY seq DESC LIMIT 1",
        (scope,),
    )
    return await cur.fetchone()


async def _last_seq(conn, scope):
    cur = await conn.execute(
        "SELECT last_seq FROM sync_cursors WHERE scope=%s", (scope,)
    )
    fila = await cur.fetchone()
    return fila["last_seq"] if fila else 0


# ============================================================================
# A. Push Delete — casos básicos
# ============================================================================

def test_delete_finca_sin_lotes_aplicada(api):
    _override(U_A)
    fid = run(_sembrar_finca(version=1))
    r = _push(api, [_op_delete("finca", fid, 1)])
    res = r.json()["results"][0]
    assert res["status"] == "applied"
    assert res["entity_id"] == fid
    assert res["server_version"] == 2
    conn = run(_conn())
    assert run(_deleted_at(conn, "fincas", fid)) is not None
    assert run(_version(conn, "fincas", fid)) == 2
    evt = run(_ultimo_cambio(conn, SCOPE_A))
    assert evt["op"] == "delete"
    assert evt["entity_type"] == "finca"
    assert evt["entity_version"] == 2
    assert evt["del_at"] is not None
    run(conn.close())


def test_delete_lote_aplicada(api):
    _override(U_A)
    fid = run(_sembrar_finca())
    lid = run(_sembrar_lote(fid))
    r = _push(api, [_op_delete("lote", lid, 1)])
    res = r.json()["results"][0]
    assert res["status"] == "applied"
    assert res["server_version"] == 2
    conn = run(_conn())
    assert run(_deleted_at(conn, "lotes", lid)) is not None
    run(conn.close())


def test_delete_sin_base_version_422(api):
    _override(U_A)
    op = _op_delete("finca", str(uuid.uuid4()), 1)
    op["base_version"] = None
    r = _push(api, [op])
    assert r.status_code == 422


def test_delete_sin_auth_401(api):
    r = api.post(
        PUSH,
        json={"device_id": D_A,
              "operations": [_op_delete("finca", str(uuid.uuid4()), 1)]},
    )
    assert r.status_code in (401, 403)


def test_delete_finca_ajena_not_found(api):
    _override(U_A)
    fid_b = run(_sembrar_finca(usuario=U_B))
    r = _push(api, [_op_delete("finca", fid_b, 1)])
    res = r.json()["results"][0]
    assert res["status"] == "error"
    assert res["code"] == "not_found"
    conn = run(_conn())
    assert run(_deleted_at(conn, "fincas", fid_b)) is None
    run(conn.close())


def test_delete_inexistente_not_found(api):
    _override(U_A)
    r = _push(api, [_op_delete("finca", str(uuid.uuid4()), 1)])
    assert r.json()["results"][0]["code"] == "not_found"


def test_delete_version_incorrecta_conflicto(api):
    _override(U_A)
    fid = run(_sembrar_finca(version=3))
    cop = str(uuid.uuid4())
    op = _op_delete("finca", fid, 1)
    op["client_operation_id"] = cop
    r = _push(api, [op])
    res = r.json()["results"][0]
    assert res["status"] == "conflict"
    assert res["server_state"]["version"] == 3
    conn = run(_conn())
    assert run(_deleted_at(conn, "fincas", fid)) is None
    assert run(_version(conn, "fincas", fid)) == 3
    assert run(_n_cambios(conn, SCOPE_A)) == 0
    run(conn.close())


def test_delete_entidad_ya_tombstoned_not_found(api):
    """Segunda eliminación de la misma entidad (con clave distinta):
    el tombstone se comporta como inexistente — not_found, no se
    emite un segundo evento delete."""
    _override(U_A)
    fid = run(_sembrar_finca())
    r1 = _push(api, [_op_delete("finca", fid, 1)])
    assert r1.json()["results"][0]["status"] == "applied"
    r2 = _push(api, [_op_delete("finca", fid, 2)])
    res = r2.json()["results"][0]
    assert res["status"] == "error"
    assert res["code"] == "not_found"
    conn = run(_conn())
    assert run(_n_cambios(conn, SCOPE_A)) == 1
    assert run(_version(conn, "fincas", fid)) == 2
    run(conn.close())


# ============================================================================
# B. Idempotencia
# ============================================================================

def test_delete_reintentada_devuelve_duplicate(api):
    _override(U_A)
    fid = run(_sembrar_finca())
    op = _op_delete("finca", fid, 1)
    r1 = _push(api, [op])
    assert r1.json()["results"][0]["status"] == "applied"
    r2 = _push(api, [op])
    res = r2.json()["results"][0]
    assert res["status"] == "duplicate"
    assert res["server_version"] == 2
    conn = run(_conn())
    assert run(_version(conn, "fincas", fid)) == 2
    assert run(_n_cambios(conn, SCOPE_A)) == 1
    run(conn.close())


def test_delete_conflicto_rejugable(api):
    _override(U_A)
    fid = run(_sembrar_finca(version=2))
    op = _op_delete("finca", fid, 1)
    r1 = _push(api, [op])
    assert r1.json()["results"][0]["status"] == "conflict"
    r2 = _push(api, [op])
    res = r2.json()["results"][0]
    assert res["status"] == "conflict"
    assert res["server_state"]["version"] == 2


# ============================================================================
# C. Tombstones y transacciones
# ============================================================================

def test_delete_rollback_en_fallo_changelog(api, monkeypatch):
    """Fallo inyectado tras el soft-delete: ni tombstone ni
    deleted_at ni seq quedan — rollback integral."""
    _override(U_A)
    fid = run(_sembrar_finca(version=1))
    from shared.repositories import sync as sync_repo_mod
    original = sync_repo_mod.insertar_cambio

    async def _falla(*a, **kw):
        raise RuntimeError("fallo inyectado post-delete")

    monkeypatch.setattr(sync_repo_mod, "insertar_cambio", _falla)
    r = _push(api, [_op_delete("finca", fid, 1)])
    assert r.json()["results"][0]["status"] == "error"
    monkeypatch.setattr(sync_repo_mod, "insertar_cambio", original)
    conn = run(_conn())
    assert run(_deleted_at(conn, "fincas", fid)) is None
    assert run(_version(conn, "fincas", fid)) == 1
    assert run(_n_cambios(conn, SCOPE_A)) == 0
    assert run(_last_seq(conn, SCOPE_A)) == 0
    run(conn.close())


def test_delete_no_consume_seq_en_conflicto(api):
    _override(U_A)
    fid = run(_sembrar_finca(version=5))
    _push(api, [_op_delete("finca", fid, 1)])
    conn = run(_conn())
    assert run(_last_seq(conn, SCOPE_A)) == 0
    run(conn.close())


# ============================================================================
# D. Finca y lotes — Opción A: has_dependents
# ============================================================================



def test_delete_finca_con_lote_activo_has_dependents(api):
    _override(U_A)
    fid = run(_sembrar_finca())
    lid = run(_sembrar_lote(fid))
    r = _push(api, [_op_delete("finca", fid, 1)])
    res = r.json()["results"][0]
    assert res["status"] == "error"
    assert res["code"] == "has_dependents"
    conn = run(_conn())
    assert run(_deleted_at(conn, "fincas", fid)) is None
    assert run(_deleted_at(conn, "lotes", lid)) is None
    assert run(_n_cambios(conn, SCOPE_A)) == 0
    run(conn.close())


def test_delete_finca_tras_eliminar_lotes_aplicada(api):
    """Despues de eliminar el lote (tombstone), la finca si se
    puede eliminar - el lote tombstoned no cuenta como activo."""
    _override(U_A)
    fid = run(_sembrar_finca())
    lid = run(_sembrar_lote(fid))
    r1 = _push(api, [_op_delete("lote", lid, 1)])
    assert r1.json()["results"][0]["status"] == "applied"
    r2 = _push(api, [_op_delete("finca", fid, 1)])
    res = r2.json()["results"][0]
    assert res["status"] == "applied"
    assert res["server_version"] == 2
    conn = run(_conn())
    assert run(_deleted_at(conn, "fincas", fid)) is not None
    assert run(_n_cambios(conn, SCOPE_A)) == 2
    run(conn.close())


def test_delete_finca_y_lote_mismo_sobre(api):
    """Lote + finca en orden correcto dentro del mismo sobre:
    el lote se elimina primero, la finca despues."""
    _override(U_A)
    fid = run(_sembrar_finca())
    lid = run(_sembrar_lote(fid))
    r = _push(api, [
        _op_delete("lote", lid, 1),
        _op_delete("finca", fid, 1),
    ])
    estados = [x["status"] for x in r.json()["results"]]
    assert estados == ["applied", "applied"]


def test_delete_finca_antes_lote_mismo_sobre_falla(api):
    """Orden inverso (finca primero): la finca falla con
    has_dependents y el lote se aplica - resultados por op."""
    _override(U_A)
    fid = run(_sembrar_finca())
    lid = run(_sembrar_lote(fid))
    r = _push(api, [
        _op_delete("finca", fid, 1),
        _op_delete("lote", lid, 1),
    ])
    res = r.json()["results"]
    assert res[0]["status"] == "error"
    assert res[0]["code"] == "has_dependents"
    assert res[1]["status"] == "applied"
    conn = run(_conn())
    assert run(_deleted_at(conn, "fincas", fid)) is None
    run(conn.close())


# ============================================================================
# E. B-3 - sin resurreccion ni visibilidad de tombstones
# ============================================================================

def test_web_no_ve_finca_tombstoned(api):
    """GET/PATCH web sobre finca tombstoned -> 404 (B-3)."""
    _override(U_A)
    fid = run(_sembrar_finca())
    r = _push(api, [_op_delete("finca", fid, 1)])
    assert r.json()["results"][0]["status"] == "applied"
    assert api.get(f"/api/v1/fincas/{fid}").status_code == 404
    r2 = api.patch(f"/api/v1/fincas/{fid}", json={"nombre": "X"})
    assert r2.status_code == 404


def test_web_no_ve_lote_tombstoned(api):
    _override(U_A)
    fid = run(_sembrar_finca())
    lid = run(_sembrar_lote(fid))
    _push(api, [_op_delete("lote", lid, 1)])
    r = api.patch(
        f"/api/v1/fincas/{fid}/lotes/{lid}",
        json={"nombre_lote": "X"},
    )
    assert r.status_code == 404
    r2 = api.get(f"/api/v1/fincas/{fid}/lotes")
    assert all(l["id"] != lid for l in r2.json())


def test_update_sync_no_resucita_tombstoned(api):
    """Push update sobre entidad eliminada -> not_found (B-3),
    no resurreccion."""
    _override(U_A)
    fid = run(_sembrar_finca())
    _push(api, [_op_delete("finca", fid, 1)])
    op = {
        "client_operation_id": str(uuid.uuid4()),
        "entity_type": "finca", "entity_id": fid,
        "action": "update", "base_version": 2,
        "payload": {"nombre": "Zombie"},
        "client_created_at": "2026-11-05T12:00:00Z",
    }
    r = _push(api, [op])
    assert r.json()["results"][0]["code"] == "not_found"
    conn = run(_conn())
    assert run(_deleted_at(conn, "fincas", fid)) is not None
    run(conn.close())


def test_create_lote_en_finca_tombstoned_rechazado(api):
    """create de lote bajo finca tombstoned -> error (la finca
    padre se comporta como inexistente)."""
    _override(U_A)
    fid = run(_sembrar_finca())
    _push(api, [_op_delete("finca", fid, 1)])
    op = {
        "client_operation_id": str(uuid.uuid4()),
        "entity_type": "lote", "entity_id": str(uuid.uuid4()),
        "action": "create", "base_version": None,
        "payload": {"finca_id": fid, "nombre_lote": "Huerfano"},
        "client_created_at": "2026-11-05T12:00:00Z",
    }
    r = _push(api, [op])
    assert r.json()["results"][0]["status"] == "error"


# ============================================================================
# F. Pull transporta tombstones
# ============================================================================

def test_pull_entrega_evento_delete(api):
    _override(U_A)
    fid = run(_sembrar_finca())
    _push(api, [_op_delete("finca", fid, 1)])
    r = _pull(api)
    body = r.json()
    assert r.status_code == 200
    assert len(body["changes"]) == 1
    evt = body["changes"][0]
    assert evt["op"] == "delete"
    assert evt["entity_type"] == "finca"
    assert evt["entity_id"] == fid
    assert evt["entity_version"] == 2


def test_pull_orden_con_delete_intercalado(api):
    """create lote -> delete lote: pull entrega ambos en orden
    de secuencia con op correcto."""
    _override(U_A)
    fid = run(_sembrar_finca())
    op_create = {
        "client_operation_id": str(uuid.uuid4()),
        "entity_type": "lote", "entity_id": str(uuid.uuid4()),
        "action": "create", "base_version": None,
        "payload": {"finca_id": fid, "nombre_lote": "L1"},
        "client_created_at": "2026-11-05T12:00:00Z",
    }
    r1 = _push(api, [op_create])
    lid = r1.json()["results"][0]["entity_id"]
    _push(api, [_op_delete("lote", lid, 1)])
    r = _pull(api, cursor=0)
    changes = r.json()["changes"]
    ops = [(c["op"], c["entity_id"]) for c in changes]
    assert ops == [("upsert", lid), ("delete", lid)]


# ============================================================================
# G. Aislamiento y regresion
# ============================================================================

def test_delete_scope_aislado(api):
    """El tombstone de A no aparece en el pull de B."""
    _override(U_A)
    fid = run(_sembrar_finca())
    _push(api, [_op_delete("finca", fid, 1)])
    _override(U_B, session_id=SID_B)
    r = _pull(api, device_id=D_B)
    assert r.json()["changes"] == []


def test_delete_auth_real_aplicada(api, auth_supabase):
    fid = run(_sembrar_finca())
    r = _push(
        api,
        [_op_delete("finca", fid, 1)],
        headers=_headers(_token_supabase(AUTH_U_A, SID_A)),
    )
    assert r.json()["results"][0]["status"] == "applied"
