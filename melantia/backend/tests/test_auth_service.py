# backend/tests/test_auth_service.py
"""
Pruebas de los flujos F7a Fase ③: login, registro (saga) y refresh.

Sin Supabase real ni BD real: se sustituyen las funciones de
supabase_client, el verificador JWKS y la conexión (_FakeConn).
Ningún token, password ni secreto real aparece en estos tests —
los valores grant son sintéticos.
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from psycopg.errors import UniqueViolation

from core.config import settings
from core.supabase_jwt import SupabaseTokenError
from modules.auth import auth_service, supabase_client
from modules.auth.identidad import IdentidadError
from modules.auth.sesion_service import SesionError
from modules.auth.supabase_client import SupabaseAuthError

NOW = datetime.now(timezone.utc)

USUARIO = uuid.uuid4()
AUTH_USER = uuid.uuid4()
DISPOSITIVO = uuid.uuid4()
SESION = uuid.uuid4()
AUTH_SESSION = uuid.uuid4()

CEDULA_VALIDA = "1710034065"          # dv módulo-10 correcto
CANONICO = "NAT:1710034065"

CLAIMS = {
    "sub": str(AUTH_USER),
    "session_id": str(AUTH_SESSION),
    "iss": "https://lizqreiyysrqgkzyddff.supabase.co/auth/v1",
    "aud": "authenticated",
}

GRANT = {
    "access_token": "at-sintetico",
    "refresh_token": "rt-sintetico",
    "expires_in": 3600,
}

PUENTE_ACTIVO = {"usuario_id": str(USUARIO), "estado": "activo"}
PUENTE_ROW = {
    "id": str(AUTH_USER), "usuario_id": str(USUARIO),
    "cedula_ruc": CANONICO, "estado": "activo",
    "vinculado_por": "registro",
}
USUARIO_ROW = {"id": str(USUARIO), "nombre": "Juan Test",
               "created_at": NOW - timedelta(days=400)}

SESION_ROW = {
    "id": str(SESION), "usuario_id": str(USUARIO),
    "dispositivo_id": str(DISPOSITIVO), "auth_proveedor": "supabase",
    "auth_session_id": str(AUTH_SESSION), "familia_id": str(AUTH_SESSION),
    "estado": "activa", "rotaciones_observadas": 1,
    "ultimo_refresh_at": NOW - timedelta(hours=2), "ultimo_ip": None,
    "created_at": NOW, "expires_at": NOW + timedelta(days=30),
    "last_seen_at": None, "revocado_at": None,
    "revocado_por": None, "motivo_revocacion": None,
}

DISP_NUEVO = {"id": str(DISPOSITIVO), "estado": "activo"}
EVENTO = {"id": str(uuid.uuid4())}


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


class _VerifierOk:
    async def verificar(self, token):
        return CLAIMS


class _VerifierFail:
    async def verificar(self, token):
        raise SupabaseTokenError("firma_invalida")


def run(coro):
    return asyncio.run(coro)


@pytest.fixture(autouse=True)
def _pepper_sintetico(monkeypatch):
    """pepper de test — el real jamás se usa ni se imprime."""
    monkeypatch.setattr(settings, "pepper_identidad", "pepper-test")
    monkeypatch.setattr(
        auth_service, "get_supabase_verifier", lambda: _VerifierOk()
    )


def _grant_ok(**_kw):
    async def _f(*_a, **_k):
        return dict(GRANT)
    return _f


def _grant_fail(motivo="grant_rechazado", status=400):
    async def _f(*_a, **_k):
        raise SupabaseAuthError(motivo, status)
    return _f


def _data_registro(**kw):
    base = dict(
        nombre="Juan Test", cedula_ruc=CEDULA_VALIDA,
        password="secreto123", sector_comunidad="Sector X",
        contacto=None, provincia_id=None, canton_id=None,
        parroquia_id=None, acepto_politicas=True,
        dispositivo_id=None, dispositivo_nombre=None,
    )
    base.update(kw)
    return SimpleNamespace(**base)


def _acciones_audit(conn):
    return [
        q[1][2] for q in conn.queries
        if "INSERT INTO audit_eventos" in q[0]
    ]


# ============================================================================
# LOGIN
# ============================================================================

def test_login_exitoso_devuelve_par_de_tokens(monkeypatch):
    monkeypatch.setattr(supabase_client, "password_grant", _grant_ok())
    conn = _FakeConn([
        PUENTE_ACTIVO,          # _resolver_puente
        None,                   # sesión existente
        DISP_NUEVO,             # registrar_dispositivo
        EVENTO,                 # audit dispositivo.nuevo
        SESION_ROW,             # crear_sesion
        EVENTO,                 # audit sesion.creada
        None,                   # registrar_acceso
        {"id": str(USUARIO), "nombre": "Juan Test"},  # usuario básico
        EVENTO,                 # audit auth.login
    ])
    r = run(auth_service.login(conn, CEDULA_VALIDA, "secreto123"))
    assert r["access_token"] == "at-sintetico"
    assert r["refresh_token"] == "rt-sintetico"
    assert r["usuario_id"] == str(USUARIO)
    assert r["dispositivo_id"] == str(DISPOSITIVO)
    assert _acciones_audit(conn)[-1] == "auth.login"


def test_login_cedula_malformada_rechaza_sin_red():
    conn = _FakeConn()
    with pytest.raises(IdentidadError):
        run(auth_service.login(conn, "123", "x"))
    assert conn.queries == []               # ni la BD ni GoTrue


def test_login_credenciales_invalidas_audita_rechazo(monkeypatch):
    monkeypatch.setattr(
        supabase_client, "password_grant", _grant_fail()
    )
    conn = _FakeConn([EVENTO])
    with pytest.raises(SupabaseAuthError):
        run(auth_service.login(conn, CEDULA_VALIDA, "mala"))
    assert _acciones_audit(conn) == ["auth.login_rechazado"]
    assert conn.commits == 1                # el evento sobrevive al
                                            # rollback del error


def test_login_puente_inexistente_rechaza(monkeypatch):
    monkeypatch.setattr(supabase_client, "password_grant", _grant_ok())
    conn = _FakeConn([None, EVENTO])        # sin puente + audit
    with pytest.raises(SesionError) as e:
        run(auth_service.login(conn, CEDULA_VALIDA, "secreto123"))
    assert e.value.motivo == "puente_inexistente"
    assert _acciones_audit(conn) == ["auth.login_rechazado"]


def test_login_puente_suspendido_rechaza(monkeypatch):
    monkeypatch.setattr(supabase_client, "password_grant", _grant_ok())
    conn = _FakeConn([
        {**PUENTE_ACTIVO, "estado": "suspendido"}, EVENTO,
    ])
    with pytest.raises(SesionError) as e:
        run(auth_service.login(conn, CEDULA_VALIDA, "secreto123"))
    assert e.value.motivo == "puente_suspendido"


def test_login_jwt_no_verifica_rechaza(monkeypatch):
    monkeypatch.setattr(supabase_client, "password_grant", _grant_ok())
    monkeypatch.setattr(
        auth_service, "get_supabase_verifier", lambda: _VerifierFail()
    )
    conn = _FakeConn([EVENTO])
    with pytest.raises(SupabaseTokenError):
        run(auth_service.login(conn, CEDULA_VALIDA, "secreto123"))
    assert _acciones_audit(conn) == ["auth.login_rechazado"]


# ============================================================================
# REGISTRO — saga
# ============================================================================

def test_registro_nat_completo_devuelve_tokens(monkeypatch):
    async def _create(*a, **k):
        return {"id": str(AUTH_USER)}
    async def _grant(*a, **k):
        return dict(GRANT)
    monkeypatch.setattr(supabase_client, "admin_create_user", _create)
    monkeypatch.setattr(supabase_client, "password_grant", _grant)
    conn = _FakeConn([
        None,                               # usuario por canónico
        None,                               # puente por canónico
        {"id": str(USUARIO), "nombre": "Juan Test"},  # TX1 insert
        PUENTE_ROW,                         # TX2 crear_vinculo
        PUENTE_ACTIVO,                      # crear_sesion: puente
        None,                               # sesión existente
        DISP_NUEVO,                         # dispositivo nuevo
        EVENTO,                             # audit dispositivo.nuevo
        SESION_ROW,                         # crear_sesion
        EVENTO,                             # audit sesion.creada
        None,                               # registrar_acceso
        EVENTO,                             # audit auth.registro
    ])
    r = run(auth_service.registrar(conn, _data_registro()))
    assert r["registrado"] if "registrado" in r else True
    assert r["requiere_login"] is False
    assert r["access_token"] == "at-sintetico"
    assert conn.commits == 2                # TX1 + TX2
    # el INSERT de usuarios guarda el CANÓNICO, no la entrada cruda
    ins = [q for q in conn.queries if "INSERT INTO usuarios" in q[0]][0]
    assert ins[1][1] == CANONICO
    assert _acciones_audit(conn)[-1] == "auth.registro"


def test_registro_politicas_no_aceptadas_rechaza():
    conn = _FakeConn()
    with pytest.raises(SesionError) as e:
        run(auth_service.registrar(
            conn, _data_registro(acepto_politicas=False)
        ))
    assert e.value.motivo == "politicas_no_aceptadas"
    assert conn.queries == []


def test_registro_identidad_duplicada_409():
    conn = _FakeConn([
        USUARIO_ROW, PUENTE_ROW,            # ESTADO 1: completo
    ])
    with pytest.raises(SesionError) as e:
        run(auth_service.registrar(conn, _data_registro()))
    assert e.value.motivo == "identidad_duplicada"
    assert all(
        "INSERT INTO usuarios (" not in q[0] for q in conn.queries
    )


def test_registro_huerfano_historico_requiere_reclamo():
    # usuarios viejo sin puente → ESTADO 2 → reclamo asistido,
    # nunca auto-claim (§22.4-C): la ventana es para intentos
    # propios recientes
    conn = _FakeConn([
        {**USUARIO_ROW, "created_at": NOW - timedelta(days=400)},
        None,                               # puente por canónico
    ])
    with pytest.raises(SesionError) as e:
        run(auth_service.registrar(conn, _data_registro()))
    assert e.value.motivo == "cuenta_requiere_reclamo"


def test_registro_huerfano_reciente_continua_saga(monkeypatch):
    # el retry dentro de la ventana RECLAMO_AUTO_MIN reconoce el
    # intento propio: no duplica usuarios, continúa en el paso remoto
    async def _create(*a, **k):
        return {"id": str(AUTH_USER)}
    async def _grant(*a, **k):
        return dict(GRANT)
    monkeypatch.setattr(supabase_client, "admin_create_user", _create)
    monkeypatch.setattr(supabase_client, "password_grant", _grant)
    conn = _FakeConn([
        {**USUARIO_ROW,
         "created_at": NOW - timedelta(minutes=2)},
        None,                               # puente por canónico
        PUENTE_ROW,                         # crear_vinculo
        PUENTE_ACTIVO, None, DISP_NUEVO, EVENTO,
        SESION_ROW, EVENTO, None, EVENTO,   # sesión + audit
    ])
    r = run(auth_service.registrar(conn, _data_registro()))
    assert r["requiere_login"] is False
    assert all(
        "INSERT INTO usuarios (" not in q[0] for q in conn.queries
    )


def test_registro_fallo_remoto_compensa_borrando_usuario(monkeypatch):
    async def _create(*a, **k):
        raise SupabaseAuthError("supabase_no_disponible")
    async def _find(*a, **k):
        raise SupabaseAuthError("supabase_no_disponible")
    monkeypatch.setattr(supabase_client, "admin_create_user", _create)
    monkeypatch.setattr(
        supabase_client, "admin_find_user_by_email", _find
    )
    conn = _FakeConn([
        None, None,                          # dedup
        {"id": str(USUARIO), "nombre": "Juan Test"},
        EVENTO,                              # auth.registro_compensado
    ])
    with pytest.raises(SesionError) as e:
        run(auth_service.registrar(conn, _data_registro()))
    assert e.value.motivo == "supabase_no_disponible"
    borrados = [q for q in conn.queries
                if "DELETE FROM usuarios" in q[0]]
    assert len(borrados) == 1               # compensación §7.3
    assert _acciones_audit(conn) == ["auth.registro_compensado"]


def test_registro_fallo_puente_compensa_borrando_auth_user(monkeypatch):
    borrados_remotos = []

    async def _create(*a, **k):
        return {"id": str(AUTH_USER)}
    async def _delete(uid):
        borrados_remotos.append(uid)
    monkeypatch.setattr(supabase_client, "admin_create_user", _create)
    monkeypatch.setattr(
        supabase_client, "admin_delete_user", _delete
    )
    conn = _FakeConn([
        None, None,
        {"id": str(USUARIO), "nombre": "Juan Test"},
        UniqueViolation("pk duplicada"),    # TX2 crear_vinculo
        EVENTO,                             # registro_compensado
    ])
    with pytest.raises(SesionError):
        run(auth_service.registrar(conn, _data_registro()))
    assert borrados_remotos == [str(AUTH_USER)]
    # usuarios se conserva (dato de negocio idempotente, §7.3)
    assert all(
        "DELETE FROM usuarios" not in q[0] for q in conn.queries
    )


def test_registro_reconcilia_auth_user_existente(monkeypatch):
    # alta devuelve 422 ambiguo → reconciliación por email §22.5
    async def _create(*a, **k):
        raise SupabaseAuthError("alta_rechazada", 422)
    async def _find(email):
        return {"id": str(AUTH_USER)}
    passwords = []

    async def _upd(uid, pw):
        passwords.append(pw)
    async def _grant(*a, **k):
        return dict(GRANT)
    monkeypatch.setattr(supabase_client, "admin_create_user", _create)
    monkeypatch.setattr(
        supabase_client, "admin_find_user_by_email", _find
    )
    monkeypatch.setattr(
        supabase_client, "admin_update_user_password", _upd
    )
    monkeypatch.setattr(supabase_client, "password_grant", _grant)
    conn = _FakeConn([
        None, None,
        {"id": str(USUARIO), "nombre": "Juan Test"},
        PUENTE_ROW,
        PUENTE_ACTIVO, None, DISP_NUEVO, EVENTO,
        SESION_ROW, EVENTO, None, EVENTO,
    ])
    r = run(auth_service.registrar(conn, _data_registro()))
    assert r["requiere_login"] is False
    # al reutilizar el auth user, su password se sincroniza con la
    # que el registrante acaba de teclear
    assert passwords == ["secreto123"]


def test_registro_signin_final_falla_responde_login_requerido(
    monkeypatch,
):
    async def _create(*a, **k):
        return {"id": str(AUTH_USER)}
    monkeypatch.setattr(supabase_client, "admin_create_user", _create)
    monkeypatch.setattr(
        supabase_client, "password_grant", _grant_fail()
    )
    conn = _FakeConn([
        None, None,
        {"id": str(USUARIO), "nombre": "Juan Test"},
        PUENTE_ROW,
        EVENTO,                             # auth.registro
    ])
    r = run(auth_service.registrar(conn, _data_registro()))
    # §7.3: cuenta completa; no es error — el cliente hace /login
    assert r["requiere_login"] is True
    assert "access_token" not in r


def test_registro_jur_crea_identidad_juridica(monkeypatch):
    async def _create(*a, **k):
        return {"id": str(AUTH_USER)}
    async def _grant(*a, **k):
        return dict(GRANT)
    monkeypatch.setattr(supabase_client, "admin_create_user", _create)
    monkeypatch.setattr(supabase_client, "password_grant", _grant)
    conn = _FakeConn([
        None, None,
        {"id": str(USUARIO), "nombre": "Finca SA"},
        PUENTE_ROW,
        PUENTE_ACTIVO, None, DISP_NUEVO, EVENTO,
        SESION_ROW, EVENTO, None, EVENTO,
    ])
    r = run(auth_service.registrar(
        conn, _data_registro(
            nombre="Finca SA", cedula_ruc="1790011674001"
        )
    ))
    assert r["requiere_login"] is False
    ins = [q for q in conn.queries if "INSERT INTO usuarios" in q[0]][0]
    assert ins[1][1] == "JUR:1790011674001"


# ============================================================================
# REFRESH
# ============================================================================

def test_refresh_exitoso_devuelve_nuevo_par(monkeypatch):
    async def _grant(*a, **k):
        return {"access_token": "at2", "refresh_token": "rt2",
                "expires_in": 3600}
    monkeypatch.setattr(supabase_client, "refresh_grant", _grant)
    conn = _FakeConn([
        SESION_ROW,                          # sesión por session_id
        {"id": str(SESION), "rotaciones_observadas": 2},
        EVENTO,                              # auth.refresh
    ])
    r = run(auth_service.refresh(conn, "rt-viejo"))
    assert r["access_token"] == "at2"
    assert r["refresh_token"] == "rt2"
    assert _acciones_audit(conn) == ["auth.refresh"]


def test_refresh_token_invalido_rechaza_y_audita(monkeypatch):
    async def _grant(*a, **k):
        raise SupabaseAuthError("grant_rechazado", 400)
    monkeypatch.setattr(supabase_client, "refresh_grant", _grant)
    conn = _FakeConn([EVENTO])
    with pytest.raises(SupabaseAuthError):
        run(auth_service.refresh(conn, "rt-malo"))
    assert _acciones_audit(conn) == ["auth.refresh_rechazado"]
    assert conn.commits == 1


def test_refresh_sesion_revocada_rechaza(monkeypatch):
    async def _grant(*a, **k):
        return dict(GRANT)
    monkeypatch.setattr(supabase_client, "refresh_grant", _grant)
    conn = _FakeConn([
        {**SESION_ROW, "estado": "revocada"},
    ])
    with pytest.raises(SesionError) as e:
        run(auth_service.refresh(conn, "rt"))
    assert e.value.motivo == "sesion_no_activa"


def test_refresh_colision_persiste_sospechosa(monkeypatch):
    # dos refresh en <5 s sobre la misma sesión: marca + evento
    # deben sobrevivir al rechazo (CASO C — defensa local)
    async def _grant(*a, **k):
        return dict(GRANT)
    monkeypatch.setattr(supabase_client, "refresh_grant", _grant)
    conn = _FakeConn([
        {**SESION_ROW,
         "ultimo_refresh_at": datetime.now(timezone.utc)
         - timedelta(seconds=1)},
        {"id": str(SESION), "estado": "sospechosa"},
        EVENTO,
    ])
    with pytest.raises(SesionError) as e:
        run(auth_service.refresh(conn, "rt1"))
    assert e.value.motivo == "sesion_sospechosa"
    assert conn.commits == 1                # la marca se persistió
    assert _acciones_audit(conn) == ["seguridad.posible_replay"]


def test_refresh_no_persiste_rt_en_bd(monkeypatch):
    # el RT solo transita: ningún INSERT/UPDATE lo escribe
    async def _grant(*a, **k):
        return {"access_token": "at2", "refresh_token": "rt2"}
    monkeypatch.setattr(supabase_client, "refresh_grant", _grant)
    conn = _FakeConn([
        SESION_ROW,
        {"id": str(SESION), "rotaciones_observadas": 2},
        EVENTO,
    ])
    run(auth_service.refresh(conn, "rt-plano"))
    for sql, params in conn.queries:
        for p in (params or []):
            assert p not in ("rt-plano", "rt2", "at2")
