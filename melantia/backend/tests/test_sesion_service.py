# backend/tests/test_sesion_service.py
"""Pruebas del servicio de sesión F7a Fase ② y del discriminador
dual-auth de get_current_user.

Sin BD real ni Supabase real: _FakeConn captura SQL (patrón
test_audit.py); el verificador y la conexión se sustituyen por
falsos inyectados. Ningún token ni secreto se genera ni persiste.
"""
import asyncio
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

import pytest

from core import dependencies
from modules.auth import sesion_service
from modules.auth.sesion_service import SesionError
from shared.repositories import audit

NOW = datetime.now(timezone.utc)

USUARIO = uuid.uuid4()
AUTH_USER = uuid.uuid4()
DISPOSITIVO = uuid.uuid4()
SESION = uuid.uuid4()
AUTH_SESSION = uuid.uuid4()

CLAIMS = {
    "sub": str(AUTH_USER),
    "session_id": str(AUTH_SESSION),
    "iss": "https://lizqreiyysrqgkzyddff.supabase.co/auth/v1",
    "aud": "authenticated",
}

PUENTE_ACTIVO = {"usuario_id": str(USUARIO), "estado": "activo"}
PUENTE_SUSPENDIDO = {"usuario_id": str(USUARIO), "estado": "suspendido"}

SESION_ACTIVA = {
    "id": str(SESION), "usuario_id": str(USUARIO),
    "dispositivo_id": str(DISPOSITIVO), "auth_proveedor": "supabase",
    "auth_session_id": str(AUTH_SESSION), "familia_id": str(AUTH_SESSION),
    "estado": "activa", "rotaciones_observadas": 3,
    "ultimo_refresh_at": NOW - timedelta(hours=1), "ultimo_ip": None,
    "created_at": NOW, "expires_at": NOW + timedelta(days=30),
    "last_seen_at": None, "revocado_at": None,
    "revocado_por": None, "motivo_revocacion": None,
}


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

    def cursor(self, row_factory=None):
        return _FakeCursor(self)

    async def commit(self):
        self.commits += 1


def run(coro):
    return asyncio.run(coro)


def _motivo(conn, claims=CLAIMS):
    with pytest.raises(SesionError) as e:
        run(sesion_service.resolver_usuario_desde_claims(conn, claims))
    return e.value.motivo


# ============================================================================
# resolver_usuario_desde_claims — cadena JWT→puente→sesión
# ============================================================================

def test_jwt_valido_puente_activo_sesion_activa():
    conn = _FakeConn([PUENTE_ACTIVO, SESION_ACTIVA])
    uid = run(
        sesion_service.resolver_usuario_desde_claims(conn, CLAIMS)
    )
    assert uid == str(USUARIO)


def test_sub_sin_puente_rechazado_sin_autoprovisionar():
    conn = _FakeConn([None])                       # sin fila en puente
    assert _motivo(conn) == "puente_inexistente"
    # jamás un INSERT de provisión automática (ADR §12.2)
    assert all("INSERT" not in q[0] for q in conn.queries)


def test_puente_suspendido_bloquea_aunque_jwt_valido():
    conn = _FakeConn([PUENTE_SUSPENDIDO])
    assert _motivo(conn) == "puente_suspendido"    # → 403


def test_sesion_inexistente_rechazada():
    conn = _FakeConn([PUENTE_ACTIVO, None])
    assert _motivo(conn) == "sesion_inexistente"


def test_sesion_revocada_bloquea_aunque_jwt_valido():
    conn = _FakeConn(
        [PUENTE_ACTIVO, {**SESION_ACTIVA, "estado": "revocada"}]
    )
    assert _motivo(conn) == "sesion_no_activa"


def test_sesion_expirada_bloquea():
    conn = _FakeConn(
        [PUENTE_ACTIVO, {**SESION_ACTIVA, "estado": "expirada"}]
    )
    assert _motivo(conn) == "sesion_no_activa"


def test_sesion_sospechosa_bloquea():
    conn = _FakeConn(
        [PUENTE_ACTIVO, {**SESION_ACTIVA, "estado": "sospechosa"}]
    )
    assert _motivo(conn) == "sesion_no_activa"


def test_sub_malformado():
    conn = _FakeConn()
    assert _motivo(conn, {**CLAIMS, "sub": "no-es-uuid"}
                   ) == "sub_invalido"


# ============================================================================
# crear_sesion_post_login — dispositivo nuevo / conocido, idempotencia
# ============================================================================

def test_crear_sesion_dispositivo_nuevo_audita_ambos_eventos():
    conn = _FakeConn([
        PUENTE_ACTIVO,                             # resolver puente
        None,                                      # sesión existente?
        {"id": str(DISPOSITIVO), "estado": "activo"},  # nuevo dispositivo
        {"id": str(uuid.uuid4())},                 # evento disp.nuevo
        {**SESION_ACTIVA},                         # crear_sesion
        {"id": str(uuid.uuid4())},                 # evento sesion.creada
        None,                                      # registrar_acceso
    ])
    run(sesion_service.crear_sesion_post_login(
        conn, CLAIMS, dispositivo_nombre="Tablet-Juan-01",
    ))
    inserts = [q for q in conn.queries
               if "INSERT INTO audit_eventos" in q[0]]
    acciones = [q[1][2] for q in inserts]
    assert acciones == ["dispositivo.nuevo", "sesion.creada"]
    # sin secretos en el detalle auditado
    for q in inserts:
        assert "token" not in str(q[1][7]).lower() if q[1][7] else True


def test_crear_sesion_dispositivo_conocido_solo_evento_sesion():
    conn = _FakeConn([
        PUENTE_ACTIVO, None,                       # puente + existente
        {"id": str(DISPOSITIVO), "usuario_id": str(USUARIO),
         "estado": "activo"},                      # dispositivo propio
        {**SESION_ACTIVA},                         # crear_sesion
        {"id": str(uuid.uuid4())},                 # sesion.creada
        None,                                      # registrar_acceso
    ])
    run(sesion_service.crear_sesion_post_login(
        conn, CLAIMS, dispositivo_id=DISPOSITIVO,
    ))
    inserts = [q for q in conn.queries
               if "INSERT INTO dispositivos" in q[0]]
    assert inserts == []                           # no re-registra


def test_crear_sesion_dispositivo_ajeno_o_revocado_no_reusa():
    # un dispositivo_id de otro usuario jamás ancla la sesión:
    # se ignora y se registra uno nuevo (nunca reasigna)
    ajeno = {"id": str(DISPOSITIVO),
             "usuario_id": str(uuid.uuid4()), "estado": "activo"}
    conn = _FakeConn([
        PUENTE_ACTIVO, None,                       # puente + existente
        ajeno,                                     # lookup dispositivo
        {"id": str(uuid.uuid4()), "estado": "activo"},  # nuevo
        {"id": str(uuid.uuid4())},                 # evento disp.nuevo
        {**SESION_ACTIVA},                         # crear_sesion
        {"id": str(uuid.uuid4())},                 # sesion.creada
        None,                                      # registrar_acceso
    ])
    run(sesion_service.crear_sesion_post_login(
        conn, CLAIMS, dispositivo_id=DISPOSITIVO,
    ))
    inserts = [q for q in conn.queries
               if "INSERT INTO dispositivos" in q[0]]
    assert len(inserts) == 1


def test_crear_sesion_idempotente_si_ya_existe_auth_session_id():
    conn = _FakeConn([
        PUENTE_ACTIVO,
        SESION_ACTIVA,                             # ya existe → retorna
    ])
    sesion = run(sesion_service.crear_sesion_post_login(conn, CLAIMS))
    assert sesion["id"] == str(SESION)
    assert all(
        "INSERT INTO sesiones" not in q[0] for q in conn.queries
    )


# ============================================================================
# registrar_refresh — rotación + detección de replay (CASO C local)
# ============================================================================

def test_refresh_normal_incrementa_rotaciones():
    conn = _FakeConn([
        SESION_ACTIVA,
        {"id": str(SESION), "rotaciones_observadas": 4},
    ])
    rot = run(sesion_service.registrar_refresh(conn, AUTH_SESSION))
    assert rot["rotaciones_observadas"] == 4
    sql, _ = conn.queries[-1]
    assert "rotaciones_observadas + 1" in sql


def test_refresh_colision_marca_sospechosa_y_audita_replay():
    # último refresh hace <5 s = dos actores sobre la misma sesión.
    # Se calcula en tiempo de test: un NOW de módulo envejece con la
    # suite y el gap dejaría de ser <5 s (falso negativo).
    conn = _FakeConn([
        {**SESION_ACTIVA,
         "ultimo_refresh_at": datetime.now(timezone.utc)
         - timedelta(seconds=1)},
        {"id": str(SESION), "estado": "sospechosa"},   # marcar
        {"id": str(uuid.uuid4())},                     # evento replay
    ])
    with pytest.raises(SesionError) as e:
        run(sesion_service.registrar_refresh(conn, AUTH_SESSION))
    assert e.value.motivo == "sesion_sospechosa"
    eventos = [q for q in conn.queries
               if "INSERT INTO audit_eventos" in q[0]]
    assert eventos[0][1][2] == "seguridad.posible_replay"
    assert eventos[0][1][1] == "sistema"           # actor automático


def test_refresh_sobre_sesion_revocada_rechazado():
    conn = _FakeConn(
        [{**SESION_ACTIVA, "estado": "revocada"}]
    )
    with pytest.raises(SesionError) as e:
        run(sesion_service.registrar_refresh(conn, AUTH_SESSION))
    assert e.value.motivo == "sesion_no_activa"
    assert all(
        "UPDATE" not in q[0] for q in conn.queries
    )                                            # jamás rota


def test_refresh_sesion_inexistente():
    conn = _FakeConn([None])
    with pytest.raises(SesionError) as e:
        run(sesion_service.registrar_refresh(conn, AUTH_SESSION))
    assert e.value.motivo == "sesion_inexistente"


# ============================================================================
# revocar_sesion_melantia
# ============================================================================

def test_revocar_sesion_registra_evento():
    conn = _FakeConn([
        {"id": str(SESION), "estado": "revocada",
         "revocado_at": NOW},
        {"id": str(uuid.uuid4())},                 # evento
    ])
    fila = run(sesion_service.revocar_sesion_melantia(
        conn, SESION, revocado_por=USUARIO, motivo="cierre de sesión",
    ))
    assert fila["estado"] == "revocada"
    evento = [q for q in conn.queries
              if "INSERT INTO audit_eventos" in q[0]][0]
    assert evento[1][2] == "sesion.revocada"


def test_revocar_sesion_inerte_rechazado():
    conn = _FakeConn([None])
    with pytest.raises(SesionError):
        run(sesion_service.revocar_sesion_melantia(conn, SESION))


# ============================================================================
# get_current_user — discriminador dual por iss (D4.2 §10)
# ============================================================================

class _Creds:
    def __init__(self, token):
        self.credentials = token


def _token_con_iss(iss):
    import base64, json
    h = base64.urlsafe_b64encode(b'{"alg":"ES256"}').rstrip(b"=")
    p = base64.urlsafe_b64encode(
        json.dumps({"iss": iss}).encode()
    ).rstrip(b"=")
    return f"{h.decode()}.{p.decode()}.firma"


def _token_sin_iss():
    import base64, json
    h = base64.urlsafe_b64encode(b'{"alg":"HS256"}').rstrip(b"=")
    p = base64.urlsafe_b64encode(
        json.dumps({"sub": "u"}).encode()
    ).rstrip(b"=")
    return f"{h.decode()}.{p.decode()}.firma"


def test_get_current_user_ruta_supabase_por_iss(monkeypatch):
    class _V:
        async def verificar(self, token):
            return CLAIMS

    monkeypatch.setattr(
        "core.supabase_jwt.get_supabase_verifier", lambda: _V()
    )

    @asynccontextmanager
    async def _fake_db():
        yield _FakeConn([PUENTE_ACTIVO, SESION_ACTIVA]), None

    monkeypatch.setattr(
        dependencies, "get_db_connection", _fake_db
    )

    token = _token_con_iss(CLAIMS["iss"])
    uid = run(dependencies.get_current_user(_Creds(token)))
    assert uid == str(USUARIO)


def test_get_current_user_iss_desconocido_rechazado():
    token = _token_con_iss("https://emisor-falso.example.com/")
    with pytest.raises(Exception):
        run(dependencies.get_current_user(_Creds(token)))


def test_get_current_user_legacy_flag_on(monkeypatch):
    from core import security
    # Clave sintética inyectada en el módulo (C1 ya no trae default);
    # create/decode leen el global SECRET_KEY en tiempo de llamada.
    monkeypatch.setattr(
        security, "SECRET_KEY", "jwt-test-sintetico-32-chars-minimo-x"
    )
    monkeypatch.setattr(
        dependencies.settings, "auth_legacy_issuer_enabled", True
    )
    token = security.create_access_token({"sub": str(USUARIO)})   # sin iss
    uid = run(dependencies.get_current_user(_Creds(token)))
    assert uid == str(USUARIO)


def test_get_current_user_legacy_flag_off_rechaza(monkeypatch):
    from core import security
    monkeypatch.setattr(
        security, "SECRET_KEY", "jwt-test-sintetico-32-chars-minimo-x"
    )
    monkeypatch.setattr(
        dependencies.settings, "auth_legacy_issuer_enabled", False
    )
    token = security.create_access_token({"sub": str(USUARIO)})
    with pytest.raises(Exception):
        run(dependencies.get_current_user(_Creds(token)))
