# backend/tests/test_sync_push_api.py
"""Pruebas E2E del push de sincronización — PostgreSQL real.

Cadena completa: POST /api/v1/sync/push -> services/push ->
shared/repositories/{sync,fincas} -> melantia_test.

Dos caminos de identidad:
- Camino REAL (tests de autenticación): tokens ES256 firmados con
  clave de prueba + JWKS simulado — la request recorre
  get_sync_identity -> verifier -> puente -> sesión en BD. Nada de
  overrides de identidad ni credenciales reales.
- Camino OVERRIDE (tests de dominio/idempotencia): solo se inyecta
  SyncIdentity (usuario_id + session_id); la comprobación
  sesión↔dispositivo sigue ejecutándose real contra la BD.
- get_db se sobrescribe SIEMPRE a melantia_test — ningún test toca
  melantia_db.

Cubre: vínculo token->sesión->dispositivo (H-1), sesión revocada /
vencida-activa / legacy, create finca/lote con UUID de cliente,
lote bajo finca del mismo lote, idempotencia (duplicate /
key_reuse, también intra-lote), aislamiento, rollback integral por
op (incl. seq), error de infraestructura vs not_found, allowlist,
base_version en create y concurrencia de la misma clave.
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
from core.config import settings
from core.dependencies import get_current_user, get_db
from core.exceptions import DatabaseConnectionError
from core.supabase_jwt import SupabaseJWTVerifier
import core.supabase_jwt as supabase_jwt_mod
from main import app
from modules.sync.auth import SyncIdentity, get_sync_identity
from shared.repositories import fincas as fincas_repo
from shared.repositories import sync as sync_repo

P = "5a9c0000-0000-0000-0000-0000000000"
U_A = f"{P}01"            # propietario
U_B = f"{P}02"            # otro usuario
D_A = f"{P}11"            # dispositivo activo de A (sesión S_A)
D_B = f"{P}12"            # dispositivo activo de B (sesión S_B)
D_REV = f"{P}13"          # dispositivo revocado de A
D_NS = f"{P}14"           # dispositivo de A SIN sesión
D_A2 = f"{P}15"           # 2.º dispositivo activo de A (sesión S_A2)
FINCA_AJENA = f"{P}21"    # finca de U_B para aislamiento
SID_A = f"{P}31"          # auth_session_id de la sesión en D_A
SID_A2 = f"{P}32"         # auth_session_id de la sesión en D_A2
SID_B = f"{P}33"          # auth_session_id de la sesión en D_B
SID_REV = f"{P}34"        # sesión revocada (en D_A)
SID_EXP = f"{P}35"        # sesión 'activa' pero expires_at pasado (D_A)
AUTH_U_A = f"{P}41"       # auth.users.id (sub) del puente de A
AUTH_U_B = f"{P}42"       # auth.users.id (sub) del puente de B
SECTOR = "TEST-SYNC"

# Emisor Supabase de prueba — jamás se contacta (JWKS simulado); se
# inyecta en settings para que el discriminador iss elija la rama
# Supabase dentro de la autenticación real.
SUPABASE_URL_TEST = "https://supabase-de-prueba.melantia.invalid"
ISSUER = f"{SUPABASE_URL_TEST}/auth/v1"
KID = "kid-de-prueba-sync"


def run(coro):
    return asyncio.run(coro)


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _par_ec():
    """Par P-256 efímero de prueba: PEM para firmar + JWK público."""
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
    """AT Supabase de prueba firmado ES256 — verificación real."""
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


def _token_legacy():
    """HS256 sin iss — forma de token legacy (sin session_id)."""
    return jose_jwt.encode(
        {"sub": U_A, "exp": int(time.time()) + 300},
        "clave-de-prueba-sin-valor-real",
        algorithm="HS256",
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
    """Limpieza idempotente de todo rastro de las pruebas sync."""
    scopes = (f"usr:{U_A}", f"usr:{U_B}")
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
    """Usuarios + puente + dispositivos + sesiones (con
    auth_session_id) + geo + finca ajena."""
    conn = await _conn()
    await _borrar_datos_prueba(conn)
    async with conn.cursor() as cur:
        for uid, nombre in [(U_A, "Sync A"), (U_B, "Sync B")]:
            await cur.execute(
                "INSERT INTO usuarios (id, nombre, cedula_ruc,"
                " sector_comunidad) VALUES (%s,%s,%s,%s)",
                (uid, nombre, f"88{uid[-3:]}", SECTOR),
            )
        # Puente auth.users.id (sub del JWT) -> usuarios.id
        for auth_id, uid, ced in [
            (AUTH_U_A, U_A, "PU000000000000000A"),
            (AUTH_U_B, U_B, "PU000000000000000B"),
        ]:
            await cur.execute(
                "INSERT INTO usuarios_auth_puente"
                " (id, usuario_id, cedula_ruc, vinculado_por)"
                " VALUES (%s,%s,%s,'registro')",
                (auth_id, uid, ced),
            )
        for did, uid, estado in [
            (D_A, U_A, "activo"),
            (D_A2, U_A, "activo"),
            (D_B, U_B, "activo"),
            (D_REV, U_A, "revocado"),
            (D_NS, U_A, "activo"),      # sin sesión a propósito
        ]:
            await cur.execute(
                "INSERT INTO dispositivos (id, usuario_id, nombre,"
                " estado) VALUES (%s,%s,%s,%s)",
                (did, uid, "dev-test", estado),
            )
        # Sesiones con auth_session_id (ancla token↔sesión de
        # Supabase). Offsets en INTERVAL respecto a now().
        #   SID_REV: revocada; SID_EXP: 'activa' pero vencida.
        sesiones = [
            (SID_A, U_A, D_A, "activa", "-1 days", "29 days", False),
            (SID_A2, U_A, D_A2, "activa", "-1 days", "29 days", False),
            (SID_B, U_B, D_B, "activa", "-1 days", "29 days", False),
            (SID_REV, U_A, D_A, "revocada", "-2 days", "28 days", True),
            (SID_EXP, U_A, D_A, "activa", "-32 days", "-2 days", False),
        ]
        for sid_ext, uid, did, estado, c_off, e_off, rev in sesiones:
            await cur.execute(
                """
                INSERT INTO sesiones (
                    id, usuario_id, dispositivo_id, auth_proveedor,
                    auth_session_id, familia_id, estado, created_at,
                    expires_at, revocado_at
                ) VALUES (
                    %s, %s, %s, 'supabase', %s, %s, %s,
                    CURRENT_TIMESTAMP + (%s)::interval,
                    CURRENT_TIMESTAMP + (%s)::interval,
                    CASE WHEN %s THEN CURRENT_TIMESTAMP END
                )
                """,
                (
                    str(uuid.uuid4()), uid, did, sid_ext, sid_ext,
                    estado, c_off, e_off, rev,
                ),
            )
        await cur.execute(
            "SELECT codigo_inec, id FROM provincias"
            " WHERE codigo_inec='01'"
        )
        GEO["prov_01"] = (await cur.fetchone())["id"]
        await cur.execute(
            "SELECT id FROM parroquias WHERE codigo_inec='010150'"
        )
        GEO["parr_010150"] = (await cur.fetchone())["id"]
        await cur.execute(
            "INSERT INTO fincas (id, usuario_id, nombre, provincia_id)"
            " VALUES (%s,%s,%s,%s)",
            (FINCA_AJENA, U_B, "Finca Ajena B", GEO["prov_01"]),
        )
    await conn.commit()
    await conn.close()


GEO = {}


async def _limpieza():
    conn = await _conn()
    await _borrar_datos_prueba(conn)
    await conn.close()


async def _borrar_resultados_sync(conn):
    """Limpieza entre tests: resultados de push sin tocar el seed
    (usuarios, puente, dispositivos, sesiones y la finca ajena
    sobreviven)."""
    async with conn.cursor() as cur:
        await cur.execute(
            "DELETE FROM sync_cambios WHERE scope IN (%s,%s)",
            (f"usr:{U_A}", f"usr:{U_B}"),
        )
        await cur.execute(
            "DELETE FROM sync_cursors WHERE scope IN (%s,%s)",
            (f"usr:{U_A}", f"usr:{U_B}"),
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
            "DELETE FROM fincas WHERE usuario_id IN (%s,%s)"
            " AND id <> %s",
            (U_A, U_B, FINCA_AJENA),
        )
    await conn.commit()


async def _db_test():
    """get_db con conexión REAL a melantia_test — siempre activo:
    ningún test puede tocar melantia_db."""
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
    """Identidad de dominio (NO para tests de autenticación): solo
    fabrica SyncIdentity — la verificación sesión↔dispositivo del
    service sigue siendo real. get_current_user queda para el test
    de regresión del CRUD web."""
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
    """Cada test: get_db -> melantia_test, overrides limpios al
    salir y sin resultados sync previos (conteos exactos)."""
    app.dependency_overrides[get_db] = _db_test
    conn = run(_conn())
    run(_borrar_resultados_sync(conn))
    run(conn.close())
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def auth_supabase(monkeypatch):
    """Rama Supabase real del endpoint: verificador con JWKS de
    prueba inyectado (sin red) e issuer de prueba en settings —
    la cadena token->puente->sesión se ejecuta de verdad."""
    verifier = SupabaseJWTVerifier(
        issuer=ISSUER, jwks_url=f"{ISSUER}/.well-known/jwks.json"
    )

    async def _jwks_falso():
        return {KID: JWK}

    verifier._download_jwks = _jwks_falso
    monkeypatch.setattr(supabase_jwt_mod, "_verifier", verifier)
    monkeypatch.setattr(settings, "supabase_url", SUPABASE_URL_TEST)


PUSH = "/api/v1/sync/push"


def _op(etype="finca", payload=None, action="create", entity_id=None,
        client_operation_id=None, base_version=None):
    return {
        "client_operation_id": client_operation_id or str(uuid.uuid4()),
        "entity_type": etype,
        "entity_id": entity_id or str(uuid.uuid4()),
        "action": action,
        "base_version": base_version,
        "payload": payload if payload is not None else {"nombre": "Finca S"},
        "client_created_at": "2026-10-22T12:00:00Z",
    }


def _push(api, device_id, ops, headers=None):
    return api.post(
        PUSH,
        json={"device_id": str(device_id), "operations": ops},
        headers=headers or {},
    )


async def _finca(conn, fid):
    cur = await conn.execute(
        "SELECT * FROM fincas WHERE id=%s", (fid,)
    )
    return await cur.fetchone()


async def _lote(conn, lid):
    cur = await conn.execute(
        "SELECT * FROM lotes WHERE id=%s", (lid,)
    )
    return await cur.fetchone()


async def _conteos(conn, usuario_id, scope):
    cur = await conn.execute(
        "SELECT count(*) AS n FROM sync_operaciones WHERE usuario_id=%s",
        (usuario_id,),
    )
    ops = (await cur.fetchone())["n"]
    cur = await conn.execute(
        "SELECT count(*) AS n FROM sync_cambios WHERE scope=%s", (scope,)
    )
    return ops, (await cur.fetchone())["n"]


# ============================================================================
# AUTENTICACIÓN REAL — token -> sesión -> dispositivo (H-1)
# Tokens firmados de prueba + JWKS simulado: la validación es real.
# ============================================================================

def test_push_sin_auth_401(api):
    r = api.post(PUSH, json={
        "device_id": str(uuid.uuid4()), "operations": [_op()],
    })
    assert r.status_code == 401


def test_push_token_invalido_401(api):
    r = api.post(
        PUSH,
        json={"device_id": str(uuid.uuid4()), "operations": [_op()]},
        headers={"Authorization": "Bearer no-es-un-jwt"},
    )
    assert r.status_code == 401


def test_push_sesion_correcta_dispositivo_correcto(
    api, auth_supabase
):
    """Token de la sesión S_A + su dispositivo D_A -> applied y la
    procedencia registrada es D_A (dispositivo de la sesión)."""
    eid = str(uuid.uuid4())
    r = _push(api, D_A, [
        _op(entity_id=eid, payload={"nombre": "Finca AuthReal"})
    ], headers=_headers(_token_supabase(AUTH_U_A, SID_A)))
    assert r.status_code == 200
    res = r.json()["results"][0]
    assert res["status"] == "applied"
    conn = run(_conn())
    finca = run(_finca(conn, eid))
    assert str(finca["dispositivo_origen_id"]) == D_A
    run(conn.close())


def test_push_token_sesion_a_con_dispositivo_de_sesion_b(
    api, auth_supabase
):
    """Token de S_A (dispositivo D_A) + device_id=D_A2 del MISMO
    usuario: D_A2 tiene su propia sesión activa pero NO es la del
    token -> rechazo 404 indistinguible (H-1)."""
    r = _push(api, D_A2, [_op()],
              headers=_headers(_token_supabase(AUTH_U_A, SID_A)))
    assert r.status_code == 404


def test_push_token_sesion_a_con_dispositivo_ajeno(
    api, auth_supabase
):
    r = _push(api, D_B, [_op()],
              headers=_headers(_token_supabase(AUTH_U_A, SID_A)))
    assert r.status_code == 404


def test_push_sesion_exacta_revocada_401(api, auth_supabase):
    """La sesión S_REV está 'revocada' -> rechazo aunque el token
    firma bien y el usuario tiene otra sesión activa en D_A."""
    r = _push(api, D_A, [_op()],
              headers=_headers(_token_supabase(AUTH_U_A, SID_REV)))
    assert r.status_code == 401


def test_push_sesion_exacta_vencida_activa_401(api, auth_supabase):
    """estado='activa' pero expires_at pasado (aún no barrida) ->
    rechazo: expires_at se exige de verdad (M-1)."""
    r = _push(api, D_A, [_op()],
              headers=_headers(_token_supabase(AUTH_U_A, SID_EXP)))
    assert r.status_code == 401


def test_push_legacy_sin_vinculo_401(api):
    """Token HS256 sin session_id verificable -> rechazo controlado;
    ninguna sesión activa del usuario lo sustituye (H-1)."""
    r = api.post(
        PUSH,
        json={"device_id": D_A, "operations": [_op()]},
        headers=_headers(_token_legacy()),
    )
    assert r.status_code == 401


def test_push_sub_sin_puente_401(api, auth_supabase):
    """JWT válido pero sub sin puente -> 401 (sin auto-provisión)."""
    r = _push(api, D_A, [_op()],
              headers=_headers(_token_supabase(uuid.uuid4(), SID_A)))
    assert r.status_code == 401


# ============================================================================
# SOBRE — sesión y dispositivo vía identidad de dominio (override:
# solo SyncIdentity; la verificación en BD sigue siendo real)
# ============================================================================

def test_push_sesion_revocada_401_override(api):
    """La comprobación del service también corta sesiones
    revocadas — defensa en profundidad tras el resolver."""
    _override(U_A, SID_REV)
    r = _push(api, D_A, [_op()])
    assert r.status_code == 401


def test_push_sesion_vencida_401_override(api):
    _override(U_A, SID_EXP)
    r = _push(api, D_A, [_op()])
    assert r.status_code == 401


def test_push_dispositivo_inexistente_404(api):
    _override(U_A)
    r = _push(api, uuid.uuid4(), [_op()])
    assert r.status_code == 404


def test_push_dispositivo_ajeno_404(api):
    """D_B existe pero es de U_B — indistinguible de inexistente."""
    _override(U_A)
    r = _push(api, D_B, [_op()])
    assert r.status_code == 404


def test_push_dispositivo_revocado_404(api):
    _override(U_A)
    r = _push(api, D_REV, [_op()])
    assert r.status_code == 404


def test_push_dispositivo_de_otra_sesion_404(api):
    """D_NS es propio y activo pero no es el dispositivo de la
    sesión autenticada -> 404 (la otra sesión no sustituye)."""
    _override(U_A)
    r = _push(api, D_NS, [_op()])
    assert r.status_code == 404


def test_push_dispositivo_segunda_sesion_mismo_usuario_404(api):
    """Identidad de S_A + device de S_A2 (ambos de U_A) -> 404."""
    _override(U_A, SID_A)
    r = _push(api, D_A2, [_op()])
    assert r.status_code == 404


# ============================================================================
# CREATE — finca y lote con UUID de cliente
# ============================================================================

def test_push_crea_finca(api):
    _override(U_A)
    eid, cid = str(uuid.uuid4()), str(uuid.uuid4())
    r = _push(api, D_A, [
        _op(entity_id=eid, client_operation_id=cid,
            payload={"nombre": "Finca Push", "parroquia_id": GEO["parr_010150"]})
    ])
    assert r.status_code == 200
    res = r.json()["results"][0]
    assert res["status"] == "applied"
    assert res["entity_id"] == eid
    assert res["server_version"] == 1
    assert r.json()["pull_cursor_hint"] == 1

    conn = run(_conn())
    finca = run(_finca(conn, eid))
    assert finca is not None
    assert str(finca["usuario_id"]) == U_A
    assert finca["version"] == 1
    assert str(finca["dispositivo_origen_id"]) == D_A
    assert finca["deleted_at"] is None
    ops, cambios = run(_conteos(conn, U_A, f"usr:{U_A}"))
    assert (ops, cambios) == (1, 1)
    cur = run(conn.execute(
        "SELECT entity_type, entity_id, op, entity_version, data"
        " FROM sync_cambios WHERE scope=%s", (f"usr:{U_A}",)
    ))
    fila = run(cur.fetchone())
    assert fila["entity_type"] == "finca"
    assert str(fila["entity_id"]) == eid
    assert fila["op"] == "upsert"
    assert fila["entity_version"] == 1
    assert fila["data"]["nombre"] == "Finca Push"
    assert fila["data"]["usuario_id"] == U_A
    cur = run(conn.execute(
        "SELECT estado, resultado, entity_id FROM sync_operaciones"
        " WHERE usuario_id=%s AND client_operation_id=%s", (U_A, cid)
    ))
    ledger = run(cur.fetchone())
    assert ledger["estado"] == "applied"
    assert str(ledger["entity_id"]) == eid
    assert ledger["resultado"]["server_version"] == 1
    run(conn.close())


def test_push_lote_con_padre_en_mismo_lote(api):
    """Finca y lote hijo en el mismo request, en orden: la finca
    confirma antes de procesar el lote."""
    _override(U_A)
    fid, lid = str(uuid.uuid4()), str(uuid.uuid4())
    r = _push(api, D_A, [
        _op(entity_id=fid, payload={"nombre": "Finca Padre"}),
        _op(etype="lote", entity_id=lid,
            payload={"finca_id": fid, "nombre_lote": "Lote Norte"}),
    ])
    assert r.status_code == 200
    res = r.json()["results"]
    assert [x["status"] for x in res] == ["applied", "applied"]
    assert res[1]["entity_id"] == lid
    conn = run(_conn())
    lote = run(_lote(conn, lid))
    assert str(lote["finca_id"]) == fid
    ops, cambios = run(_conteos(conn, U_A, f"usr:{U_A}"))
    assert (ops, cambios) == (2, 2)
    run(conn.close())


# ============================================================================
# IDEMPOTENCIA
# ============================================================================

def test_push_reintento_duplicate(api):
    _override(U_A)
    eid, cid = str(uuid.uuid4()), str(uuid.uuid4())
    ops = [_op(entity_id=eid, client_operation_id=cid,
               payload={"nombre": "Finca Reintento"})]
    r1 = _push(api, D_A, ops)
    r2 = _push(api, D_A, ops)
    assert r1.json()["results"][0]["status"] == "applied"
    res2 = r2.json()["results"][0]
    assert res2["status"] == "duplicate"
    assert res2["entity_id"] == eid
    assert res2["server_version"] == 1
    conn = run(_conn())
    cur = run(conn.execute(
        "SELECT count(*) AS n FROM fincas WHERE usuario_id=%s", (U_A,)
    ))
    assert (run(cur.fetchone()))["n"] == 1
    ops_n, _ = run(_conteos(conn, U_A, f"usr:{U_A}"))
    assert ops_n == 1
    run(conn.close())


def test_push_clave_reutilizada_contenido_distinto(api):
    _override(U_A)
    eid, cid = str(uuid.uuid4()), str(uuid.uuid4())
    _push(api, D_A, [_op(entity_id=eid, client_operation_id=cid,
                         payload={"nombre": "Original"})])
    r = _push(api, D_A, [
        _op(entity_id=str(uuid.uuid4()), client_operation_id=cid,
            payload={"nombre": "Otra Cosa"})
    ])
    res = r.json()["results"][0]
    assert res["status"] == "error"
    assert res["code"] == "idempotency_key_reuse"
    conn = run(_conn())
    finca = run(_finca(conn, eid))
    assert finca["nombre"] == "Original"      # no se tocó
    run(conn.close())


def test_push_duplicado_dentro_del_mismo_lote(api):
    """Misma client_operation_id dos veces EN UN SOLO sobre: la 1.ª
    aplica, la 2.ª choca con la UNIQUE ya confirmada -> duplicate.
    Una sola finca, un solo changelog."""
    _override(U_A)
    eid, cid = str(uuid.uuid4()), str(uuid.uuid4())
    ops = [
        _op(entity_id=eid, client_operation_id=cid,
            payload={"nombre": "Finca Dup-Lote"}),
        _op(entity_id=eid, client_operation_id=cid,
            payload={"nombre": "Finca Dup-Lote"}),
    ]
    r = _push(api, D_A, ops)
    res = r.json()["results"]
    assert [x["status"] for x in res] == ["applied", "duplicate"]
    conn = run(_conn())
    cur = run(conn.execute(
        "SELECT count(*) AS n FROM fincas WHERE usuario_id=%s", (U_A,)
    ))
    assert (run(cur.fetchone()))["n"] == 1
    ops_n, cambios = run(_conteos(conn, U_A, f"usr:{U_A}"))
    assert (ops_n, cambios) == (1, 1)
    run(conn.close())


def test_push_clave_reusada_dentro_del_mismo_lote(api):
    """Misma clave, dos contenidos distintos en un sobre: la 1.ª
    aplica; la 2.ª -> idempotency_key_reuse sin escribir nada."""
    _override(U_A)
    eid1, eid2, cid = (str(uuid.uuid4()) for _ in range(3))
    r = _push(api, D_A, [
        _op(entity_id=eid1, client_operation_id=cid,
            payload={"nombre": "Primera"}),
        _op(entity_id=eid2, client_operation_id=cid,
            payload={"nombre": "Distinta"}),
    ])
    res = r.json()["results"]
    assert res[0]["status"] == "applied"
    assert res[1]["status"] == "error"
    assert res[1]["code"] == "idempotency_key_reuse"
    conn = run(_conn())
    assert run(_finca(conn, eid2)) is None
    ops_n, cambios = run(_conteos(conn, U_A, f"usr:{U_A}"))
    assert (ops_n, cambios) == (1, 1)
    run(conn.close())


# ============================================================================
# AISLAMIENTO Y VALIDACIÓN POR OP
# ============================================================================

def test_push_lote_padre_ajeno(api):
    """lote cuya finca_id pertenece a U_B -> not_found (404 de
    dominio indistinguible — M-2 conserva el comportamiento)."""
    _override(U_A)
    lid = str(uuid.uuid4())
    r = _push(api, D_A, [
        _op(etype="lote", entity_id=lid,
            payload={"finca_id": FINCA_AJENA, "nombre_lote": "Robado"}),
    ])
    res = r.json()["results"][0]
    assert res["status"] == "error"
    assert res["code"] == "not_found"
    conn = run(_conn())
    assert run(_lote(conn, lid)) is None
    ops, cambios = run(_conteos(conn, U_A, f"usr:{U_A}"))
    assert (ops, cambios) == (0, 0)
    run(conn.close())


def test_push_entity_type_fuera_allowlist(api):
    _override(U_A)
    r = _push(api, D_A, [
        _op(etype="transaccion_financiera",
            payload={"nombre": "No permitido"}),
        _op(etype="finca", entity_id=str(uuid.uuid4()),
            action="merge", payload={"nombre": "X"}),
    ])
    res = r.json()["results"]
    assert res[0]["status"] == "error"
    assert res[0]["code"] == "unsupported_entity_type"
    assert res[1]["status"] == "error"
    assert res[1]["code"] == "unsupported_action"


def test_push_entity_id_ajeno_indistinguible(api):
    """create con el id de una finca de U_B -> not_found, sin revelarla."""
    _override(U_A)
    r = _push(api, D_A, [
        _op(entity_id=FINCA_AJENA, payload={"nombre": "Intruso"}),
    ])
    res = r.json()["results"][0]
    assert res["status"] == "error"
    assert res["code"] == "not_found"


def test_push_entity_id_propio_existente(api):
    """create con un id propio ya ocupado -> entity_exists."""
    _override(U_A)
    eid = str(uuid.uuid4())
    _push(api, D_A, [_op(entity_id=eid, payload={"nombre": "Primera"})])
    r = _push(api, D_A, [
        _op(entity_id=eid, payload={"nombre": "Segunda"}),
    ])
    res = r.json()["results"][0]
    assert res["status"] == "error"
    assert res["code"] == "entity_exists"
    conn = run(_conn())
    assert run(_finca(conn, eid))["nombre"] == "Primera"
    run(conn.close())


def test_push_payload_invalido(api):
    _override(U_A)
    eid = str(uuid.uuid4())
    r = _push(api, D_A, [
        _op(entity_id=eid, payload={"sin_nombre": True}),
    ])
    res = r.json()["results"][0]
    assert res["status"] == "error"
    assert res["code"] == "validation"
    conn = run(_conn())
    assert run(_finca(conn, eid)) is None
    run(conn.close())


def test_push_create_con_base_version_422(api):
    """create no tiene versión previa: base_version no nulo se
    rechaza en el schema — 422 del sobre, antes de cualquier
    escritura (B-2)."""
    _override(U_A)
    r = _push(api, D_A, [_op(base_version=3)])
    assert r.status_code == 422
    conn = run(_conn())
    ops, cambios = run(_conteos(conn, U_A, f"usr:{U_A}"))
    assert (ops, cambios) == (0, 0)
    run(conn.close())


# ============================================================================
# FRONTERA TRANSACCIONAL
# ============================================================================

def test_push_rollback_completo_en_fallo_interno(
    api, monkeypatch
):
    """Fallo después del INSERT de entidad (changelog): la tx revierte
    entidad + ledger + changelog + seq — no queda nada parcial."""
    async def _boom(*a, **kw):
        raise RuntimeError("fallo forzado en changelog")
    monkeypatch.setattr(sync_repo, "insertar_cambio", _boom)

    _override(U_A)
    eid = str(uuid.uuid4())
    r = _push(api, D_A, [_op(entity_id=eid, payload={"nombre": "Boom"})])
    res = r.json()["results"][0]
    assert res["status"] == "error"
    assert res["code"] == "internal"
    conn = run(_conn())
    assert run(_finca(conn, eid)) is None           # entidad revertida
    ops, cambios = run(_conteos(conn, U_A, f"usr:{U_A}"))
    assert (ops, cambios) == (0, 0)                 # ledger/cambios fuera
    cur = run(conn.execute(
        "SELECT last_seq FROM sync_cursors WHERE scope=%s",
        (f"usr:{U_A}",),
    ))
    assert run(cur.fetchone()) is None              # seq sin avance
    run(conn.close())


def test_push_error_op_no_revierte_op_confirmada(api):
    """op1 confirma; op2 falla validación: op1 queda comprometida."""
    _override(U_A)
    fid, lid = str(uuid.uuid4()), str(uuid.uuid4())
    r = _push(api, D_A, [
        _op(entity_id=fid, payload={"nombre": "Finca Ok"}),
        _op(etype="lote", entity_id=lid,
            payload={"finca_id": fid}),               # sin nombre_lote
    ])
    res = r.json()["results"]
    assert res[0]["status"] == "applied"
    assert res[1]["status"] == "error"
    assert res[1]["code"] == "validation"
    conn = run(_conn())
    assert run(_finca(conn, fid)) is not None       # op1 comprometida
    assert run(_lote(conn, lid)) is None
    ops, cambios = run(_conteos(conn, U_A, f"usr:{U_A}"))
    assert (ops, cambios) == (1, 1)
    run(conn.close())


def test_push_error_infraestructura_no_es_not_found(api, monkeypatch):
    """Un error de infraestructura (DatabaseConnectionError) NO se
    disfraza de not_found: rollback + 'internal' (M-2)."""
    async def _boom(*a, **kw):
        raise DatabaseConnectionError("conexión perdida (simulada)")
    monkeypatch.setattr(fincas_repo, "insertar_finca", _boom)

    _override(U_A)
    eid = str(uuid.uuid4())
    r = _push(api, D_A, [_op(entity_id=eid, payload={"nombre": "X"})])
    res = r.json()["results"][0]
    assert res["status"] == "error"
    assert res["code"] == "internal"
    conn = run(_conn())
    assert run(_finca(conn, eid)) is None
    run(conn.close())


# ============================================================================
# CONCURRENCIA — misma clave, una sola ejecución de dominio
# ============================================================================

def test_push_concurrencia_misma_clave(api, monkeypatch):
    """Dos requests simultáneos con la misma client_operation_id:
    uno aplica, el otro recibe duplicate — una sola finca.

    Determinismo: la primera request que llega a insertar_finca
    retiene su tx abierta ~0.4 s (evento), forzando a la segunda a
    bloquearse en el INSERT especulativo del ledger hasta el commit.
    """
    original = fincas_repo.insertar_finca
    listo = threading.Event()

    async def _lenta(*args, **kw):
        fila = await original(*args, **kw)
        if not listo.is_set():
            listo.set()
            import asyncio as _a
            await _a.sleep(0.4)
        return fila

    monkeypatch.setattr(fincas_repo, "insertar_finca", _lenta)

    _override(U_A)
    eid, cid = str(uuid.uuid4()), str(uuid.uuid4())
    cuerpo = {
        "device_id": D_A,
        "operations": [
            _op(entity_id=eid, client_operation_id=cid,
                payload={"nombre": "Finca Carrera"})
        ],
    }
    salidas = []

    def _hilo1():
        salidas.append(api.post(PUSH, json=cuerpo).json()["results"][0])

    def _hilo2():
        listo.wait(timeout=5)
        salidas.append(api.post(PUSH, json=cuerpo).json()["results"][0])

    t1 = threading.Thread(target=_hilo1)
    t2 = threading.Thread(target=_hilo2)
    t1.start()
    t2.start()
    t1.join(10)
    t2.join(10)

    estados = sorted(x["status"] for x in salidas)
    assert estados == ["applied", "duplicate"]

    conn = run(_conn())
    cur = run(conn.execute(
        "SELECT count(*) AS n FROM fincas WHERE usuario_id=%s", (U_A,)
    ))
    assert (run(cur.fetchone()))["n"] == 1
    ops, cambios = run(_conteos(conn, U_A, f"usr:{U_A}"))
    assert (ops, cambios) == (1, 1)
    run(conn.close())


# ============================================================================
# REGRESIÓN DEL CRUD WEB (convive con sync en la misma tabla)
# ============================================================================

def test_crud_web_sigue_funcionando(api):
    _override(U_A)
    r = api.post("/api/v1/fincas", json={"nombre": "Finca Web"})
    assert r.status_code == 201
    assert r.json()["nombre"] == "Finca Web"
