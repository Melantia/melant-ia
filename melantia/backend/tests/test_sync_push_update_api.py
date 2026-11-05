# backend/tests/test_sync_push_update_api.py
"""Pruebas E2E de push UPDATE con concurrencia optimista — I-6.

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


def _op_create(entity_type="finca", payload=None):
    return {
        "client_operation_id": str(uuid.uuid4()),
        "entity_type": entity_type,
        "entity_id": str(uuid.uuid4()),
        "action": "create",
        "base_version": None,
        "payload": payload or {"nombre": "Nueva"},
        "client_created_at": "2026-11-04T12:00:00Z",
    }


def _push(api, ops, device_id=D_A, headers=None):
    return api.post(
        PUSH,
        json={"device_id": str(device_id), "operations": ops},
        headers=headers or {},
    )


async def _version(conn, tabla, eid):
    cur = await conn.execute(
        f"SELECT version FROM {tabla} WHERE id = %s", (str(eid),)
    )
    fila = await cur.fetchone()
    return int(fila["version"]) if fila else None


async def _n_cambios(conn, scope):
    cur = await conn.execute(
        "SELECT count(*) AS n FROM sync_cambios WHERE scope=%s",
        (scope,),
    )
    return (await cur.fetchone())["n"]


async def _resultado_ledger(conn, cop_id):
    cur = await conn.execute(
        "SELECT resultado FROM sync_operaciones"
        " WHERE client_operation_id = %s",
        (str(cop_id),),
    )
    fila = await cur.fetchone()
    return fila["resultado"] if fila else None


# ============================================================================
# VALIDACIÓN DEL SOBRE — base_version
# ============================================================================

def test_update_sin_base_version_422(api):
    _override(U_A)
    op = _op_update("finca", str(uuid.uuid4()), 1, {"nombre": "X"})
    op["base_version"] = None
    r = _push(api, [op])
    assert r.status_code == 422


def test_update_base_version_omitida_422(api):
    _override(U_A)
    op = _op_update("finca", str(uuid.uuid4()), 1, {"nombre": "X"})
    del op["base_version"]
    r = _push(api, [op])
    assert r.status_code == 422


def test_create_con_base_version_422(api):
    _override(U_A)
    op = _op_create()
    op["base_version"] = 1
    r = _push(api, [op])
    assert r.status_code == 422


# ============================================================================
# UPDATE APLICADO — version+1, changelog, seq, ledger
# ============================================================================

def test_update_finca_aplicada(api):
    _override(U_A)
    fid = run(_sembrar_finca())
    cop = str(uuid.uuid4())
    op = _op_update("finca", fid, 1, {"nombre": "Renombrada"})
    op["client_operation_id"] = cop
    r = _push(api, [op])
    res = r.json()["results"][0]
    assert res["status"] == "applied"
    assert res["entity_id"] == fid
    assert res["server_version"] == 2
    conn = run(_conn())
    assert run(_version(conn, "fincas", fid)) == 2
    assert run(_n_cambios(conn, SCOPE_A)) == 1
    cur = run(conn.execute(
        "SELECT entity_version, data->>'nombre' AS nom"
        " FROM sync_cambios WHERE scope=%s", (SCOPE_A,),
    ))
    evt = run(cur.fetchone())
    assert evt["entity_version"] == 2
    assert evt["nom"] == "Renombrada"
    run(conn.close())


def test_update_lote_aplicada(api):
    _override(U_A)
    fid = run(_sembrar_finca())
    lid = run(_sembrar_lote(fid))
    r = _push(api, [_op_update("lote", lid, 1, {"nombre_lote": "L-N"})])
    res = r.json()["results"][0]
    assert res["status"] == "applied"
    assert res["server_version"] == 2
    conn = run(_conn())
    assert run(_version(conn, "lotes", lid)) == 2
    run(conn.close())


def test_update_doble_sube_version_dos_veces(api):
    _override(U_A)
    fid = run(_sembrar_finca())
    r1 = _push(api, [_op_update("finca", fid, 1, {"nombre": "V2"})])
    assert r1.json()["results"][0]["status"] == "applied"
    r2 = _push(api, [_op_update("finca", fid, 2, {"nombre": "V3"})])
    assert r2.json()["results"][0]["status"] == "applied"
    conn = run(_conn())
    assert run(_version(conn, "fincas", fid)) == 3
    assert run(_n_cambios(conn, SCOPE_A)) == 2
    run(conn.close())


# ============================================================================
# CONFLICTO — sin escritura, server_state, ledger replay
# ============================================================================

def test_update_version_desactualizada_conflicto(api):
    _override(U_A)
    fid = run(_sembrar_finca(version=3, nombre="Actual"))
    cop = str(uuid.uuid4())
    op = _op_update("finca", fid, 1, {"nombre": "Vieja"})
    op["client_operation_id"] = cop
    r = _push(api, [op])
    res = r.json()["results"][0]
    assert res["status"] == "conflict"
    assert res["code"] == "version_mismatch"
    assert res["server_state"]["version"] == 3
    assert res["server_state"]["nombre"] == "Actual"
    conn = run(_conn())
    # La entidad NO fue tocada ni el changelog emitido.
    cur = run(conn.execute(
        "SELECT nombre, version FROM fincas WHERE id=%s", (fid,)
    ))
    fila = run(cur.fetchone())
    assert fila["nombre"] == "Actual" and fila["version"] == 3
    assert run(_n_cambios(conn, SCOPE_A)) == 0
    # El resultado conflicto quedó persistido en el ledger.
    led = run(_resultado_ledger(conn, cop))
    assert led["status"] == "conflict"
    assert led["server_state"]["version"] == 3
    run(conn.close())


def test_conflicto_rejugable_misma_operacion(api):
    """Reintentar la MISMA op (misma clave+hash) reproduce el
    conflicto persistido — no re-ejecuta ni inventa otro estado."""
    _override(U_A)
    fid = run(_sembrar_finca(version=2, nombre="V2"))
    op = _op_update("finca", fid, 1, {"nombre": "V1"})
    r1 = _push(api, [op])
    assert r1.json()["results"][0]["status"] == "conflict"
    r2 = _push(api, [op])
    res = r2.json()["results"][0]
    assert res["status"] == "conflict"
    assert res["server_state"]["version"] == 2
    conn = run(_conn())
    assert run(_n_cambios(conn, SCOPE_A)) == 0
    run(conn.close())


def test_conflict_lote(api):
    _override(U_A)
    fid = run(_sembrar_finca())
    lid = run(_sembrar_lote(fid, version=5, nombre="L-Real"))
    r = _push(api, [_op_update("lote", lid, 4, {"nombre_lote": "L-X"})])
    res = r.json()["results"][0]
    assert res["status"] == "conflict"
    assert res["server_state"]["version"] == 5


# ============================================================================
# TOCTOU — dos updates concurrentes, misma base_version
# ============================================================================

def test_toctou_dos_updates_misma_version(api, monkeypatch):
    """Dos push concurrentes con base_version=1: el primero sube a
    2; el segundo, que también leyó version=1, encuentra el UPDATE
    con predicado version=1 sin filas → conflicto, no aplicado."""
    _override(U_A)
    fid = run(_sembrar_finca(version=1))
    original = fincas_repo.actualizar_finca
    listo = threading.Event()

    async def _lenta(*args, **kw):
        fila = await original(*args, **kw)
        if not listo.is_set():
            listo.set()
            await asyncio.sleep(0.5)
        return fila

    monkeypatch.setattr(fincas_repo, "actualizar_finca", _lenta)
    ops1 = [_op_update("finca", fid, 1, {"nombre": "T1"})]
    ops2 = [_op_update("finca", fid, 1, {"nombre": "T2"})]
    salidas = []

    def _hilo(ops, nombre):
        salidas.append(
            (nombre, _push(api, ops).json()["results"][0]["status"])
        )

    t1 = threading.Thread(target=_hilo, args=(ops1, "t1"))
    t2 = threading.Thread(target=_hilo, args=(ops2, "t2"))
    t1.start()
    listo.wait(timeout=5)
    t2.start()
    t1.join(10); t2.join(10)
    estados = sorted(s for _, s in salidas)
    assert estados == ["applied", "conflict"]
    conn = run(_conn())
    assert run(_version(conn, "fincas", fid)) == 2
    assert run(_n_cambios(conn, SCOPE_A)) == 1
    run(conn.close())


# ============================================================================
# PROPIEDAD — ajena e inexistente → not_found indistinguible
# ============================================================================

def test_update_finca_ajena_not_found(api):
    _override(U_A)
    fid_b = run(_sembrar_finca(usuario=U_B))
    r = _push(api, [_op_update("finca", fid_b, 1, {"nombre": "Robo"})])
    res = r.json()["results"][0]
    assert res["status"] == "error"
    assert res["code"] == "not_found"
    conn = run(_conn())
    cur = run(conn.execute(
        "SELECT nombre FROM fincas WHERE id=%s", (fid_b,)
    ))
    assert run(cur.fetchone())["nombre"] != "Robo"
    run(conn.close())


def test_update_inexistente_not_found(api):
    _override(U_A)
    r = _push(api, [
        _op_update("finca", str(uuid.uuid4()), 1, {"nombre": "X"})
    ])
    assert r.json()["results"][0]["code"] == "not_found"


# ============================================================================
# ALLOWLIST — campos internos prohibidos en payload
# ============================================================================

def test_update_payload_campo_prohibido(api):
    _override(U_A)
    fid = run(_sembrar_finca())
    r = _push(api, [_op_update("finca", fid, 1, {
        "nombre": "Ok", "usuario_id": str(uuid.uuid4()),
    })])
    res = r.json()["results"][0]
    assert res["status"] == "error"
    assert res["code"] == "validation"


def test_update_payload_version_no_editable(api):
    _override(U_A)
    fid = run(_sembrar_finca())
    r = _push(api, [_op_update("finca", fid, 1, {
        "nombre": "Ok", "version": 99,
    })])
    assert r.json()["results"][0]["code"] == "validation"


def test_update_payload_vacio_validation(api):
    _override(U_A)
    fid = run(_sembrar_finca())
    r = _push(api, [_op_update("finca", fid, 1, {})])
    assert r.json()["results"][0]["code"] == "validation"


# ============================================================================
# INTERLEAVING — update sync tras update web (I-5 instrumentó)
# ============================================================================

def test_update_tras_update_web_base_vieja_conflicto(api):
    """El update web ya subió la versión a 2 (I-5): un push con
    base_version=1 detecta el desfase y no pisa el cambio web."""
    _override(U_A)
    fid = run(_sembrar_finca())
    r = api.patch(f"/api/v1/fincas/{fid}", json={"nombre": "Web"})
    assert r.status_code == 200                      # version → 2
    r2 = _push(api, [_op_update("finca", fid, 1, {"nombre": "Dev"})])
    res = r2.json()["results"][0]
    assert res["status"] == "conflict"
    assert res["server_state"]["nombre"] == "Web"


def test_update_tras_update_web_base_nueva_aplicada(api):
    """Si el dispositivo hizo pull y llega con base_version=2, su
    update se aplica sobre el estado web — sin pérdida oculta."""
    _override(U_A)
    fid = run(_sembrar_finca())
    api.patch(f"/api/v1/fincas/{fid}", json={"nombre": "Web"})
    r = _push(api, [_op_update("finca", fid, 2, {"nombre": "Dev"})])
    res = r.json()["results"][0]
    assert res["status"] == "applied"
    assert res["server_version"] == 3


# ============================================================================
# LOTE — propiedad vía finca y batch create+update
# ============================================================================

def test_update_lote_finca_ajena_not_found(api):
    _override(U_A)
    fid_b = run(_sembrar_finca(usuario=U_B))
    lid_b = run(_sembrar_lote(fid_b))
    r = _push(api, [_op_update("lote", lid_b, 1, {"nombre_lote": "X"})])
    assert r.json()["results"][0]["code"] == "not_found"


def test_batch_create_y_update(api):
    """Lote mixto: create de finca + update de lote existente en el
    mismo sobre — cada op con su resultado."""
    _override(U_A)
    fid = run(_sembrar_finca())
    lid = run(_sembrar_lote(fid))
    ops = [_op_create(), _op_update("lote", lid, 1, {"nombre_lote": "U"})]
    r = _push(api, ops)
    estados = [x["status"] for x in r.json()["results"]]
    assert estados == ["applied", "applied"]


# ============================================================================
# ROLLBACK — fallo tras UPDATE no deja residuo
# ============================================================================

def test_rollback_integral_en_fallo_interno(api, monkeypatch):
    """Fallo inyectado tras el UPDATE de dominio: la fila vuelve a
    version=1 con el nombre original, sin changelog ni seq."""
    _override(U_A)
    fid = run(_sembrar_finca(version=1, nombre="Original"))
    from shared.repositories import sync as sync_repo_mod
    original = sync_repo_mod.siguiente_seq

    async def _falla(*a, **kw):
        raise RuntimeError("fallo inyectado post-update")

    monkeypatch.setattr(sync_repo_mod, "siguiente_seq", _falla)
    r = _push(api, [_op_update("finca", fid, 1, {"nombre": "Roto"})])
    assert r.json()["results"][0]["status"] == "error"
    monkeypatch.setattr(sync_repo_mod, "siguiente_seq", original)
    conn = run(_conn())
    cur = run(conn.execute(
        "SELECT nombre, version FROM fincas WHERE id=%s", (fid,)
    ))
    fila = run(cur.fetchone())
    assert fila["nombre"] == "Original" and fila["version"] == 1
    assert run(_n_cambios(conn, SCOPE_A)) == 0
    run(conn.close())


# ============================================================================
# AUTH REAL — update exige la misma cadena token→sesión→dispositivo
# ============================================================================

def test_update_auth_real_aplicada(api, auth_supabase):
    fid = run(_sembrar_finca())
    r = _push(
        api,
        [_op_update("finca", fid, 1, {"nombre": "Real"})],
        headers=_headers(_token_supabase(AUTH_U_A, SID_A)),
    )
    assert r.json()["results"][0]["status"] == "applied"


def test_update_sesion_otro_dispositivo_404(api, auth_supabase):
    """Token de la sesión de D_A con device_id=D_A2 → 404, igual
    que en create/pull — ninguna otra sesión sustituye el vínculo."""
    fid = run(_sembrar_finca())
    r = _push(
        api,
        [_op_update("finca", fid, 1, {"nombre": "X"})],
        device_id=D_A2,
        headers=_headers(_token_supabase(AUTH_U_A, SID_A)),
    )
    assert r.status_code == 404
