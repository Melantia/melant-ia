# backend/tests/test_sync_pull_api.py
"""Pruebas E2E del pull de sincronización — PostgreSQL real (I-4).

Cadena completa: GET /api/v1/sync/pull -> services/pull ->
shared/repositories/sync -> melantia_test.

Dos caminos de identidad (mismo patrón que test_sync_push_api):
- Camino REAL (auth): tokens ES256 firmados de prueba + JWKS
  simulado — recorre get_sync_identity de verdad.
- Camino OVERRIDE (dominio): solo SyncIdentity inyectada; la
  comprobación sesión↔dispositivo sigue siendo real.
- get_db se sobrescribe SIEMPRE a melantia_test — ningún test
  escribe en melantia_db.

Cubre: paginación limit+1 (has_more, next_cursor = último incluido),
cursor 0 / sin cambios / == last_seq / negativo 422 / futuro 409,
aislamiento por scope, vínculo token→sesión→dispositivo (H-1),
dos dispositivos con cursores independientes, interrupción y
reintento, ACK implícito de ultimo_pull_seq (monótono, acotado,
solo el cursor recibido), push confirmado entre páginas, pull
concurrente con push sin eventos a medio confirmar, entrega de
entity_types desconocidos y ausencia honesta del CRUD web.
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
from psycopg.types.json import Jsonb

from conftest import pg_error_conexion, test_db_url
from core.config import settings
from core.dependencies import get_current_user, get_db
from core.supabase_jwt import SupabaseJWTVerifier
import core.supabase_jwt as supabase_jwt_mod
from main import app
from modules.sync.auth import SyncIdentity, get_sync_identity
from shared.repositories import fincas as fincas_repo

P = "6b8d0000-0000-0000-0000-0000000000"
U_A = f"{P}01"            # propietario
U_B = f"{P}02"            # otro usuario
D_A = f"{P}11"            # dispositivo activo de A (sesión S_A)
D_B = f"{P}12"            # dispositivo activo de B (sesión S_B)
D_REV = f"{P}13"          # dispositivo revocado de A
D_NS = f"{P}14"           # dispositivo de A SIN sesión
D_A2 = f"{P}15"           # 2.º dispositivo activo de A (sesión S_A2)
SID_A = f"{P}31"          # auth_session_id de la sesión en D_A
SID_A2 = f"{P}32"         # auth_session_id de la sesión en D_A2
SID_B = f"{P}33"          # auth_session_id de la sesión en D_B
SID_REV = f"{P}34"        # sesión revocada (en D_A)
SID_EXP = f"{P}35"        # sesión 'activa' pero expires_at pasado (D_A)
AUTH_U_A = f"{P}41"       # auth.users.id (sub) del puente de A
AUTH_U_B = f"{P}42"       # auth.users.id (sub) del puente de B
SECTOR = "TEST-SYNCPULL"
SCOPE_A = f"usr:{U_A}"
SCOPE_B = f"usr:{U_B}"

# Emisor Supabase de prueba — jamás se contacta (JWKS simulado).
SUPABASE_URL_TEST = "https://supabase-de-prueba.melantia.invalid"
ISSUER = f"{SUPABASE_URL_TEST}/auth/v1"
KID = "kid-de-prueba-sync-pull"


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


def _token_legacy():
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
        for uid, nombre in [(U_A, "Pull A"), (U_B, "Pull B")]:
            await cur.execute(
                "INSERT INTO usuarios (id, nombre, cedula_ruc,"
                " sector_comunidad) VALUES (%s,%s,%s,%s)",
                (uid, nombre, f"88{uid[-3:]}", SECTOR),
            )
        for auth_id, uid, ced in [
            (AUTH_U_A, U_A, "PU00000000000000PA"),
            (AUTH_U_B, U_B, "PU00000000000000PB"),
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
            (D_NS, U_A, "activo"),
        ]:
            await cur.execute(
                "INSERT INTO dispositivos (id, usuario_id, nombre,"
                " estado) VALUES (%s,%s,%s,%s)",
                (did, uid, "dev-test", estado),
            )
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
    await conn.commit()
    await conn.close()


async def _limpieza():
    conn = await _conn()
    await _borrar_datos_prueba(conn)
    await conn.close()


async def _borrar_resultados_sync(conn):
    """Limpieza entre tests: changelog/cursors/ledger/entidades y
    el ACK de dispositivos — cada test arranca determinista."""
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


async def _sembrar_cambios(
    n, scope=SCOPE_A, entity_type="finca", desde=1, actor=U_A
):
    """N eventos 'upsert' contiguos + fila de cursor del scope.

    Inserta directo en sync_cambios (el pull no consulta la entidad
    real — entrega el snapshot del changelog)."""
    conn = await _conn()
    async with conn.cursor() as cur:
        for i in range(n):
            seq = desde + i
            await cur.execute(
                """
                INSERT INTO sync_cambios (
                    scope, seq, entity_type, entity_id, op, data,
                    entity_version, actor_id
                ) VALUES (%s, %s, %s, %s, 'upsert', %s, %s, %s)
                """,
                (
                    scope, seq, entity_type, str(uuid.uuid4()),
                    Jsonb({"marcador": f"{entity_type}-{seq}"}),
                    1, actor,
                ),
            )
        await cur.execute(
            """
            INSERT INTO sync_cursors (scope, last_seq)
            VALUES (%s, %s)
            ON CONFLICT (scope) DO UPDATE
                SET last_seq = EXCLUDED.last_seq
            """,
            (scope, desde + n - 1),
        )
    await conn.commit()
    await conn.close()


async def _ultimo_pull(conn, dispositivo_id):
    cur = await conn.execute(
        "SELECT ultimo_pull_seq FROM dispositivos WHERE id=%s",
        (str(dispositivo_id),),
    )
    return (await cur.fetchone())["ultimo_pull_seq"]


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


def _override(usuario=U_A, session_id=SID_A):
    """Identidad de dominio (NO para tests de autenticación)."""
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
    """Rama Supabase real: verificador con JWKS de prueba (sin red)
    e issuer de prueba en settings."""
    verifier = SupabaseJWTVerifier(
        issuer=ISSUER, jwks_url=f"{ISSUER}/.well-known/jwks.json"
    )

    async def _jwks_falso():
        return {KID: JWK}

    verifier._download_jwks = _jwks_falso
    monkeypatch.setattr(supabase_jwt_mod, "_verifier", verifier)
    monkeypatch.setattr(settings, "supabase_url", SUPABASE_URL_TEST)


PULL = "/api/v1/sync/pull"
PUSH = "/api/v1/sync/push"


def _pull(api, device_id, cursor=0, limit=None, headers=None):
    params = {"device_id": str(device_id), "cursor": cursor}
    if limit is not None:
        params["limit"] = limit
    return api.get(PULL, params=params, headers=headers or {})


def _push_op(payload=None):
    return {
        "client_operation_id": str(uuid.uuid4()),
        "entity_type": "finca",
        "entity_id": str(uuid.uuid4()),
        "action": "create",
        "base_version": None,
        "payload": payload if payload is not None else {"nombre": "F"},
        "client_created_at": "2026-11-04T12:00:00Z",
    }


# ============================================================================
# SCHEMAS — unitarias (sin BD)
# ============================================================================

def test_schema_change_campos():
    from modules.sync.schemas import SyncChange
    eid = uuid.uuid4()
    c = SyncChange(
        seq=3, entity_type="finca", entity_id=eid, op="upsert",
        data={"nombre": "X"}, entity_version=1,
    )
    assert c.seq == 3 and c.entity_id == eid and c.op == "upsert"


def test_schema_pull_response_forma():
    from modules.sync.schemas import SyncPullResponse
    r = SyncPullResponse(changes=[], next_cursor=0, has_more=False)
    assert r.changes == [] and r.next_cursor == 0 and not r.has_more


# ============================================================================
# VALIDACIÓN DE PARÁMETROS — 422 del sobre
# ============================================================================

def test_pull_cursor_negativo_422(api):
    _override(U_A)
    assert _pull(api, D_A, cursor=-1).status_code == 422


def test_pull_cursor_no_entero_422(api):
    _override(U_A)
    r = api.get(PULL, params={"device_id": D_A, "cursor": "abc"})
    assert r.status_code == 422


def test_pull_limit_cero_422(api):
    _override(U_A)
    assert _pull(api, D_A, limit=0).status_code == 422


def test_pull_limit_superior_422(api):
    _override(U_A)
    assert _pull(api, D_A, limit=501).status_code == 422


def test_pull_device_id_no_uuid_422(api):
    _override(U_A)
    r = api.get(PULL, params={"device_id": "no-uuid", "cursor": 0})
    assert r.status_code == 422


def test_pull_sin_device_id_422(api):
    _override(U_A)
    assert api.get(PULL, params={"cursor": 0}).status_code == 422


# ============================================================================
# PAGINACIÓN — limit+1, has_more, next_cursor
# ============================================================================

def test_pull_inicial_cursor_0(api):
    _override(U_A)
    run(_sembrar_cambios(3))
    r = _pull(api, D_A, cursor=0)
    assert r.status_code == 200
    body = r.json()
    assert [c["seq"] for c in body["changes"]] == [1, 2, 3]
    assert body["has_more"] is False
    assert body["next_cursor"] == 3
    assert body["changes"][0]["entity_type"] == "finca"
    assert body["changes"][0]["op"] == "upsert"
    assert body["changes"][0]["entity_version"] == 1


def test_pull_sin_cambios(api):
    _override(U_A)
    r = _pull(api, D_A, cursor=0)
    body = r.json()
    assert body == {"changes": [], "next_cursor": 0, "has_more": False}


def test_pull_pagina_menor_que_limite(api):
    _override(U_A)
    run(_sembrar_cambios(2))
    r = _pull(api, D_A, cursor=0, limit=5)
    body = r.json()
    assert len(body["changes"]) == 2
    assert body["has_more"] is False


def test_pull_pagina_exactamente_limite(api):
    """limit == cambios: sin fila extra -> has_more false."""
    _override(U_A)
    run(_sembrar_cambios(3))
    r = _pull(api, D_A, cursor=0, limit=3)
    body = r.json()
    assert len(body["changes"]) == 3
    assert body["has_more"] is False
    assert body["next_cursor"] == 3


def test_pull_pagina_mas_que_limite(api):
    _override(U_A)
    run(_sembrar_cambios(3))
    r = _pull(api, D_A, cursor=0, limit=2)
    body = r.json()
    assert [c["seq"] for c in body["changes"]] == [1, 2]
    assert body["has_more"] is True
    assert body["next_cursor"] == 2


def test_pull_multipagina_sin_saltos_ni_duplicados(api):
    _override(U_A)
    run(_sembrar_cambios(5))
    vistos = []
    cursor = 0
    for _ in range(4):
        r = _pull(api, D_A, cursor=cursor, limit=2)
        body = r.json()
        vistos += [c["seq"] for c in body["changes"]]
        cursor = body["next_cursor"]
        if not body["has_more"]:
            break
    assert vistos == [1, 2, 3, 4, 5]
    assert cursor == 5


def test_pull_cursor_igual_al_maximo(api):
    """cursor == last_seq: no hay nada posterior -> página vacía
    y next_cursor se mantiene en el cursor enviado."""
    _override(U_A)
    run(_sembrar_cambios(3))
    r = _pull(api, D_A, cursor=3)
    body = r.json()
    assert body == {"changes": [], "next_cursor": 3, "has_more": False}


def test_pull_cursor_medio(api):
    _override(U_A)
    run(_sembrar_cambios(5))
    r = _pull(api, D_A, cursor=2, limit=2)
    body = r.json()
    assert [c["seq"] for c in body["changes"]] == [3, 4]
    assert body["has_more"] is True


# ============================================================================
# CURSOR FUTURO — 409 sin servir ni tocar metadatos
# ============================================================================

def test_pull_cursor_futuro_409(api):
    _override(U_A)
    run(_sembrar_cambios(3))
    r = _pull(api, D_A, cursor=10)
    assert r.status_code == 409
    assert r.json()["detail"] == "future_cursor"
    conn = run(_conn())
    assert run(_ultimo_pull(conn, D_A)) is None   # sin ACK
    run(conn.close())


def test_pull_cursor_futuro_scope_vacio_409(api):
    """Scope sin fila en sync_cursors: máximo = 0; cursor 1 ya es
    futuro."""
    _override(U_A)
    r = _pull(api, D_A, cursor=1)
    assert r.status_code == 409


# ============================================================================
# SEGURIDAD — vínculo token→sesión→dispositivo y aislamiento
# ============================================================================

def test_pull_sin_auth_401(api):
    r = api.get(PULL, params={"device_id": str(D_A), "cursor": 0})
    assert r.status_code == 401


def test_pull_legacy_sin_vinculo_401(api):
    r = api.get(
        PULL,
        params={"device_id": D_A, "cursor": 0},
        headers=_headers(_token_legacy()),
    )
    assert r.status_code == 401


def test_pull_sesion_correcta_real_200(api, auth_supabase):
    run(_sembrar_cambios(2))
    r = _pull(api, D_A, cursor=0,
              headers=_headers(_token_supabase(AUTH_U_A, SID_A)))
    assert r.status_code == 200
    assert len(r.json()["changes"]) == 2


def test_pull_token_sesion_otro_dispositivo_404(api, auth_supabase):
    r = _pull(api, D_A2, cursor=0,
              headers=_headers(_token_supabase(AUTH_U_A, SID_A)))
    assert r.status_code == 404


def test_pull_sesion_revocada_401_real(api, auth_supabase):
    r = _pull(api, D_A, cursor=0,
              headers=_headers(_token_supabase(AUTH_U_A, SID_REV)))
    assert r.status_code == 401


def test_pull_sesion_vencida_401_real(api, auth_supabase):
    r = _pull(api, D_A, cursor=0,
              headers=_headers(_token_supabase(AUTH_U_A, SID_EXP)))
    assert r.status_code == 401


def test_pull_sesion_revocada_401_override(api):
    _override(U_A, SID_REV)
    assert _pull(api, D_A, cursor=0).status_code == 401


def test_pull_sesion_vencida_401_override(api):
    _override(U_A, SID_EXP)
    assert _pull(api, D_A, cursor=0).status_code == 401


def test_pull_dispositivo_revocado_404(api):
    _override(U_A)
    assert _pull(api, D_REV, cursor=0).status_code == 404


def test_pull_aislamiento_usuarios(api):
    """Los cambios del scope de U_B son invisibles para U_A."""
    _override(U_A)
    run(_sembrar_cambios(4, scope=SCOPE_B))
    r = _pull(api, D_A, cursor=0)
    assert r.json()["changes"] == []


def test_pull_usuario_b_ve_su_propio_scope(api):
    _override(U_B, SID_B)
    run(_sembrar_cambios(4, scope=SCOPE_B))
    r = _pull(api, D_B, cursor=0)
    assert [c["seq"] for c in r.json()["changes"]] == [1, 2, 3, 4]


def test_pull_dos_dispositivos_cursores_independientes(api):
    """D_A en cursor 1 y D_A2 en cursor 3: progresos separados,
    ACKs separados por dispositivo."""
    run(_sembrar_cambios(4))
    _override(U_A, SID_A)
    r1 = _pull(api, D_A, cursor=1, limit=10)
    assert [c["seq"] for c in r1.json()["changes"]] == [2, 3, 4]
    _override(U_A, SID_A2)
    r2 = _pull(api, D_A2, cursor=3, limit=10)
    assert [c["seq"] for c in r2.json()["changes"]] == [4]
    conn = run(_conn())
    assert run(_ultimo_pull(conn, D_A)) == 1
    assert run(_ultimo_pull(conn, D_A2)) == 3
    run(conn.close())


# ============================================================================
# ACK IMPLÍCITO — ultimo_pull_seq (Alternativa B)
# ============================================================================

def test_pull_ack_solo_el_cursor_recibido(api):
    """Tras entregar [3] con cursor=2, el ACK es 2 — jamás
    next_cursor (la página aún no está persistida por el cliente)."""
    _override(U_A)
    run(_sembrar_cambios(3))
    r = _pull(api, D_A, cursor=2)
    assert r.json()["next_cursor"] == 3
    conn = run(_conn())
    assert run(_ultimo_pull(conn, D_A)) == 2
    run(conn.close())


def test_pull_ack_monotono_no_retrocede(api):
    _override(U_A)
    run(_sembrar_cambios(3))
    _pull(api, D_A, cursor=2)
    _pull(api, D_A, cursor=1)          # petición antigua/repetida
    conn = run(_conn())
    assert run(_ultimo_pull(conn, D_A)) == 2
    run(conn.close())


def test_pull_ack_no_supera_el_maximo(api):
    """El tope del ACK es last_seq del scope (LEAST defensivo):
    cursor válido queda registrado tal cual, nunca por encima."""
    _override(U_A)
    run(_sembrar_cambios(3))
    r = _pull(api, D_A, cursor=3)
    assert r.status_code == 200
    conn = run(_conn())
    assert run(_ultimo_pull(conn, D_A)) == 3   # == máximo, no más
    run(conn.close())


def test_pull_interrupcion_recupera_eventos(api):
    """Corte tras recibir la página sin persistir el cursor local:
    la repetición con el mismo cursor entrega los mismos eventos."""
    _override(U_A)
    run(_sembrar_cambios(3))
    r1 = _pull(api, D_A, cursor=0, limit=2)
    assert [c["seq"] for c in r1.json()["changes"]] == [1, 2]
    # El cliente NO guardó next_cursor: reintenta desde 0
    r2 = _pull(api, D_A, cursor=0, limit=2)
    assert [c["seq"] for c in r2.json()["changes"]] == [1, 2]


def test_pull_push_confirmado_entre_paginas(api):
    """Un push que confirma entre dos peticiones aparece en la
    página siguiente (seq > cursor siempre alcanzable)."""
    _override(U_A)
    run(_sembrar_cambios(2))
    r1 = _pull(api, D_A, cursor=0, limit=1)
    assert [c["seq"] for c in r1.json()["changes"]] == [1]
    assert r1.json()["has_more"] is True

    # Push real: confirma finca + changelog con seq siguiente (3)
    eid = str(uuid.uuid4())
    pr = api.post(PUSH, json={
        "device_id": D_A,
        "operations": [_push_op()],
    })
    assert pr.json()["results"][0]["status"] == "applied"

    r2 = _pull(api, D_A, cursor=1, limit=10)
    seqs = [c["seq"] for c in r2.json()["changes"]]
    assert seqs == [2, 3]
    assert r2.json()["changes"][1]["entity_type"] == "finca"


def test_pull_concurrente_con_push_sin_parciales(api, monkeypatch):
    """Pull mientras un push retiene su tx abierta: el evento no
    aparece hasta que confirma (READ COMMITTED + seq en orden)."""
    original = fincas_repo.insertar_finca
    listo = threading.Event()

    async def _lenta(*args, **kw):
        fila = await original(*args, **kw)
        if not listo.is_set():
            listo.set()
            await asyncio.sleep(0.4)
        return fila

    monkeypatch.setattr(fincas_repo, "insertar_finca", _lenta)
    _override(U_A)
    cuerpo = {"device_id": D_A, "operations": [_push_op()]}
    salidas = []

    def _hilo_push():
        salidas.append(
            api.post(PUSH, json=cuerpo).json()["results"][0]["status"]
        )

    t = threading.Thread(target=_hilo_push)
    t.start()
    listo.wait(timeout=5)

    # Pull con la tx del push aún abierta: el evento no confirmado
    # no debe verse.
    r = _pull(api, D_A, cursor=0)
    assert r.json()["changes"] == []

    t.join(10)
    assert salidas == ["applied"]
    r2 = _pull(api, D_A, cursor=0)
    assert [c["op"] for c in r2.json()["changes"]] == ["upsert"]


# ============================================================================
# STREAM COMPLETO — sin filtros que oculten secuencias
# ============================================================================

def test_pull_tipo_entidad_desconocido_se_entrega(api):
    """Un entity_type que el servidor no escribe hoy NO se filtra:
    el stream del scope se sirve completo (cliente tolera tipos
    futuros)."""
    _override(U_A)
    run(_sembrar_cambios(2, entity_type="hato_futuro"))
    r = _pull(api, D_A, cursor=0)
    body = r.json()
    assert [c["seq"] for c in body["changes"]] == [1, 2]
    assert body["changes"][0]["entity_type"] == "hato_futuro"


def test_pull_web_crud_no_emite_changelog(api):
    """El CRUD web actual NO escribe en sync_cambios: una finca
    creada por la vía web no aparece en pull (limitación real y
    documentada — no se finge cobertura)."""
    _override(U_A)
    r = api.post("/api/v1/fincas", json={"nombre": "Finca Solo Web"})
    assert r.status_code == 201
    r2 = _pull(api, D_A, cursor=0)
    assert r2.json()["changes"] == []
