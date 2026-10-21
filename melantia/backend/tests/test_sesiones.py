# backend/tests/test_sesiones.py
"""Pruebas de la infraestructura de sesiones/dispositivos (F7a Fase ①).

Sin base de datos: conexión falsa que captura SQL y parámetros
(patrón test_audit.py). El DDL real se valida además de forma
estática sobre el archivo de migración m4: constraints, índices,
unicidad y la regla de 30 días quedan verificados en el propio SQL
autorizado.

Ningún test usa secretos, tokens ni datos reales: todos los
identificadores se generan en memoria.
"""
import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path

from shared.repositories import audit, sesiones

NOW = datetime.now(timezone.utc)

USUARIO = uuid.uuid4()
DISPOSITIVO = uuid.uuid4()
SESION = uuid.uuid4()
AUTH_SESSION = uuid.uuid4()
REVOCADOR = uuid.uuid4()

MIGRACION = (
    Path(__file__).resolve().parent.parent
    / "database" / "migraciones" / "m4_f7a_sesiones_dispositivos.sql"
)
MIGRACION_SQL = MIGRACION.read_text(encoding="utf-8")

SESION_ROW = {
    "id": str(SESION), "usuario_id": str(USUARIO),
    "dispositivo_id": str(DISPOSITIVO), "auth_proveedor": "local",
    "auth_session_id": None, "familia_id": str(SESION),
    "estado": "activa", "rotaciones_observadas": 0,
    "ultimo_refresh_at": None, "ultimo_ip": None,
    "created_at": NOW, "expires_at": NOW,
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
        self.rollbacks = 0

    def cursor(self, row_factory=None):
        return _FakeCursor(self)

    async def commit(self):
        self.commits += 1

    async def rollback(self):
        self.rollbacks += 1


def run(coro):
    return asyncio.run(coro)


def _ultimo_sql_params(conn):
    return conn.queries[-1]


# ============================================================================
# DISPOSITIVOS — registro y revocación
# ============================================================================

def test_registrar_dispositivo_inserta_activo():
    conn = _FakeConn([{"id": str(DISPOSITIVO), "estado": "activo"}])
    run(sesiones.registrar_dispositivo(
        conn, usuario_id=USUARIO, nombre="Tablet-Juan-01",
    ))
    sql, params = _ultimo_sql_params(conn)
    assert "INSERT INTO dispositivos" in sql
    assert params[0] == str(USUARIO)
    assert params[1] == "Tablet-Juan-01"
    assert params[2] is None                      # fingerprint futuro


def test_revocar_dispositivo_conserva_historial():
    conn = _FakeConn([{"id": str(DISPOSITIVO), "estado": "revocado"}])
    run(sesiones.revocar_dispositivo(
        conn, dispositivo_id=DISPOSITIVO,
        revocado_por=REVOCADOR, motivo="robo reportado",
    ))
    sql, params = _ultimo_sql_params(conn)
    assert "UPDATE dispositivos" in sql
    assert "DELETE" not in sql                     # nunca borrado físico
    assert "estado = 'revocado'" in sql
    assert "estado = 'activo'" in sql              # solo sobre activos
    assert params[0] == str(REVOCADOR)
    assert params[1] == "robo reportado"


# ============================================================================
# SESIONES — creación, asociaciones, familia
# ============================================================================

def test_crear_sesion_asocia_usuario_y_dispositivo():
    conn = _FakeConn([SESION_ROW])
    run(sesiones.crear_sesion(
        conn, usuario_id=USUARIO, dispositivo_id=DISPOSITIVO,
    ))
    sql, params = _ultimo_sql_params(conn)
    assert "INSERT INTO sesiones" in sql
    assert params[1] == str(USUARIO)               # usuario_id
    assert params[2] == str(DISPOSITIVO)           # dispositivo_id
    assert params[3] == "local"                    # auth_proveedor
    assert params[4] is None                       # auth_session_id


def test_crear_sesion_local_es_su_propia_familia():
    conn = _FakeConn([SESION_ROW])
    run(sesiones.crear_sesion(
        conn, usuario_id=USUARIO, dispositivo_id=DISPOSITIVO,
    ))
    _, params = _ultimo_sql_params(conn)
    assert params[5] == params[0]                  # familia_id = id


def test_crear_sesion_supabase_familia_es_auth_session_id():
    conn = _FakeConn([{**SESION_ROW,
                       "auth_proveedor": "supabase",
                       "auth_session_id": str(AUTH_SESSION),
                       "familia_id": str(AUTH_SESSION)}])
    run(sesiones.crear_sesion(
        conn, usuario_id=USUARIO, dispositivo_id=DISPOSITIVO,
        auth_proveedor="supabase", auth_session_id=AUTH_SESSION,
    ))
    _, params = _ultimo_sql_params(conn)
    assert params[4] == str(AUTH_SESSION)          # auth_session_id
    assert params[5] == str(AUTH_SESSION)          # familia = session_id


def test_crear_sesion_fija_expiracion_30_dias():
    conn = _FakeConn([SESION_ROW])
    run(sesiones.crear_sesion(
        conn, usuario_id=USUARIO, dispositivo_id=DISPOSITIVO,
    ))
    sql, _ = _ultimo_sql_params(conn)
    assert "INTERVAL '30 days'" in sql             # tope absoluto F7a.1
    assert "expires_at" in sql


def test_crear_sesion_no_acepta_rt_en_texto():
    conn = _FakeConn([SESION_ROW])
    run(sesiones.crear_sesion(
        conn, usuario_id=USUARIO, dispositivo_id=DISPOSITIVO,
        refresh_token_enc=b"cifrado-no-texto",
    ))
    _, params = _ultimo_sql_params(conn)
    assert params[6] == b"cifrado-no-texto"        # solo bytes cifrados


# ============================================================================
# SESIONES — estado, uso, rotación, expiración, revocación
# ============================================================================

def test_registrar_rotacion_solo_sobre_vivas():
    conn = _FakeConn([{"id": str(SESION), "rotaciones_observadas": 1}])
    run(sesiones.registrar_rotacion(conn, sesion_id=SESION))
    sql, params = _ultimo_sql_params(conn)
    assert "rotaciones_observadas + 1" in sql
    assert "ultimo_refresh_at" in sql
    assert "IN ('activa', 'sospechosa')" in sql    # revocada → no rota
    assert params[0] == str(SESION)


def test_registrar_uso_actualiza_last_seen_e_ip():
    conn = _FakeConn([{"id": str(SESION)}])
    run(sesiones.registrar_uso(conn, sesion_id=SESION, ip="10.0.0.5"))
    sql, params = _ultimo_sql_params(conn)
    assert "last_seen_at" in sql
    assert "COALESCE" in sql                       # ip opcional
    assert params[0] == "10.0.0.5"


def test_revocar_sesion_conserva_historial():
    conn = _FakeConn([{**SESION_ROW, "estado": "revocada",
                       "revocado_at": NOW}])
    fila = run(sesiones.revocar_sesion(
        conn, sesion_id=SESION, revocado_por=REVOCADOR,
        motivo="reporte de robo",
    ))
    sql, params = _ultimo_sql_params(conn)
    assert "UPDATE sesiones" in sql
    assert "DELETE" not in sql                     # historial intacto
    assert "estado = 'revocada'" in sql
    assert "revocado_at" in sql
    assert "IN ('activa', 'sospechosa')" in sql    # solo estados vivos
    assert params[0] == str(REVOCADOR)             # quién/qué revocó
    assert params[1] == "reporte de robo"          # motivo registrado
    assert fila["estado"] == "revocada"


def test_revocar_sesion_ya_inerte_devuelve_none():
    conn = _FakeConn([])                           # fila no afectada
    fila = run(sesiones.revocar_sesion(conn, sesion_id=SESION))
    assert fila is None                            # idempotente


def test_marcar_sospechosa_solo_desde_activa():
    conn = _FakeConn([{**SESION_ROW, "estado": "sospechosa"}])
    run(sesiones.marcar_sospechosa(
        conn, sesion_id=SESION, motivo="colision refresh <5s",
    ))
    sql, params = _ultimo_sql_params(conn)
    assert "estado = 'sospechosa'" in sql
    assert "estado = 'activa'" in sql              # WHERE estado='activa'
    assert params[0] == "colision refresh <5s"


def test_expirar_sesiones_vencidas_marca_expirada():
    conn = _FakeConn([[{"id": str(SESION)}]])
    run(sesiones.expirar_sesiones_vencidas(conn))
    sql, _ = _ultimo_sql_params(conn)
    assert "estado = 'expirada'" in sql
    assert "expires_at <= CURRENT_TIMESTAMP" in sql
    assert "IN ('activa', 'sospechosa')" in sql


def test_repositorio_nunca_hace_commit():
    conn = _FakeConn([SESION_ROW, {"id": str(DISPOSITIVO)}])
    run(sesiones.crear_sesion(
        conn, usuario_id=USUARIO, dispositivo_id=DISPOSITIVO,
    ))
    run(sesiones.revocar_sesion(conn, sesion_id=SESION))
    assert conn.commits == 0                       # tx del llamador
    assert conn.rollbacks == 0


# ============================================================================
# EVENTOS DE SEGURIDAD — audit_eventos (tabla transversal existente)
# ============================================================================

def test_auditar_sesion_inserta_en_audit_eventos():
    conn = _FakeConn([{"id": str(uuid.uuid4())}])
    run(audit.auditar_sesion(
        conn, accion=audit.AccionSesion.SESION_REVOCADA,
        sesion_id=SESION, actor_id=REVOCADOR,
        dispositivo_id=DISPOSITIVO,
        detalle={"motivo": "robo reportado"},
    ))
    sql, params = _ultimo_sql_params(conn)
    assert "INSERT INTO audit_eventos" in sql
    assert params[1] == "usuario"
    assert params[2] == "sesion.revocada"
    assert params[3] == "sesion"                   # objeto_tipo
    assert params[4] == str(SESION)                # objeto_id
    assert params[5] == "dispositivo"              # contexto_tipo
    assert params[6] == str(DISPOSITIVO)           # contexto_id
    assert params[7].obj["motivo"] == "robo reportado"


def test_auditar_sesion_actor_sistema():
    conn = _FakeConn([{"id": str(uuid.uuid4())}])
    run(audit.auditar_sesion(
        conn, accion=audit.AccionSesion.POSIBLE_REPLAY,
        sesion_id=SESION, actor_id=None,
    ))
    _, params = _ultimo_sql_params(conn)
    assert params[0] is None
    assert params[1] == "sistema"                  # actor automático
    assert params[2] == "seguridad.posible_replay"


def test_acciones_sesion_son_evidencia_catalogadas():
    esperadas = {
        "sesion.creada", "sesion.revocada", "sesion.expirada",
        "sesion.sospechosa", "sesion.reautenticacion",
        "dispositivo.nuevo", "dispositivo.revocado",
        "seguridad.senal_riesgo", "seguridad.ubicacion_inusual",
        "seguridad.posible_replay", "seguridad.cambio_critico",
    }
    acciones = {
        v for k, v in vars(audit.AccionSesion).items()
        if not k.startswith("_")
    }
    assert acciones == esperadas


# ============================================================================
# DDL — verificación estática de la migración m4
# (constraints, FK, unicidad, índices, 30 días, sin tokens en claro)
# ============================================================================

def test_ddl_crea_ambas_tablas_con_uuid():
    assert "CREATE TABLE IF NOT EXISTS dispositivos" in MIGRACION_SQL
    assert "CREATE TABLE IF NOT EXISTS sesiones" in MIGRACION_SQL
    assert "uuid_generate_v4" in MIGRACION_SQL


def test_ddl_fk_usuarios_y_dispositivos():
    assert "REFERENCES usuarios(id) ON DELETE CASCADE" in MIGRACION_SQL
    assert "REFERENCES dispositivos(id) ON DELETE RESTRICT" in MIGRACION_SQL
    assert "REFERENCES usuarios(id) ON DELETE SET NULL" in MIGRACION_SQL


def test_ddl_constraints_de_estado():
    assert "'activa', 'sospechosa', 'revocada', 'expirada'" in MIGRACION_SQL
    assert "'activo', 'revocado'" in MIGRACION_SQL
    assert "'local', 'supabase'" in MIGRACION_SQL


def test_ddl_unicidad_session_id_y_fingerprint():
    assert "auth_session_id UUID UNIQUE" in MIGRACION_SQL
    assert "uq_dispositivos_usuario_fingerprint" in MIGRACION_SQL
    assert "fingerprint_hash IS NOT NULL" in MIGRACION_SQL


def test_ddl_coherencia_revocacion_y_expiracion():
    assert "estado <> 'revocada' OR revocado_at IS NOT NULL" in MIGRACION_SQL
    assert "expires_at > created_at" in MIGRACION_SQL
    assert "rotaciones_observadas >= 0" in MIGRACION_SQL


def test_ddl_indices_necesarios():
    for indice in (
        "idx_sesiones_usuario_estado", "idx_sesiones_dispositivo",
        "idx_sesiones_familia", "idx_sesiones_expira_activas",
        "idx_dispositivos_usuario_estado",
    ):
        assert indice in MIGRACION_SQL


def test_ddl_sin_tokens_en_texto_plano():
    assert "refresh_token_enc BYTEA" in MIGRACION_SQL
    assert "refresh_token VARCHAR" not in MIGRACION_SQL
    assert "access_token" not in MIGRACION_SQL


def test_ddl_transaccion_atomica():
    assert "BEGIN;" in MIGRACION_SQL
    assert "COMMIT;" in MIGRACION_SQL
