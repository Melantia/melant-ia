# backend/tests/test_audit.py
"""Pruebas del writer de audit_eventos (EP-4E-C / E7).

Sin base de datos: conexión falsa que captura SQL y parámetros.
El writer es un INSERT transaccional — estas pruebas verifican la
forma de la consulta, los parámetros y que NO haga commit ni trague
errores; el DDL real ya está verificado en PostgreSQL.
"""
import asyncio
import uuid
from datetime import datetime, timezone

import pytest

from shared.repositories import audit

NOW = datetime.now(timezone.utc)

ACTOR = uuid.uuid4()
PROYECTO = uuid.uuid4()
CONCESION = uuid.uuid4()
PARTICIPANTE = uuid.uuid4()
LOTE = uuid.uuid4()

EVENTO_ROW = {
    "id": str(uuid.uuid4()), "actor_id": str(ACTOR),
    "actor_tipo": "usuario", "accion": "ep.concesion_otorgada",
    "objeto_tipo": "concesion", "objeto_id": str(CONCESION),
    "contexto_tipo": "proyecto", "contexto_id": str(PROYECTO),
    "detalle": {}, "created_at": NOW,
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
# WRITER GENÉRICO
# ============================================================================

def test_registrar_evento_inserta_en_audit_eventos():
    conn = _FakeConn([EVENTO_ROW])
    fila = run(audit.registrar_evento(
        conn, accion="ep.concesion_otorgada", actor_id=ACTOR,
        objeto_tipo="concesion", objeto_id=CONCESION,
        contexto_tipo="proyecto", contexto_id=PROYECTO,
    ))
    sql, params = _ultimo_sql_params(conn)
    assert "INSERT INTO audit_eventos" in sql
    assert params[0] == str(ACTOR)          # actor_id
    assert params[1] == "usuario"           # actor_tipo
    assert params[2] == "ep.concesion_otorgada"
    assert params[3] == "concesion"         # objeto_tipo
    assert params[4] == str(CONCESION)      # objeto_id
    assert params[5] == "proyecto"          # contexto_tipo
    assert params[6] == str(PROYECTO)       # contexto_id
    assert fila["accion"] == "ep.concesion_otorgada"


def test_registrar_evento_actor_sistema_null():
    conn = _FakeConn([{**EVENTO_ROW, "actor_id": None,
                       "actor_tipo": "sistema"}])
    run(audit.registrar_evento(
        conn, accion="ep.participante_removido", actor_id=None,
        actor_tipo="sistema",
    ))
    _, params = _ultimo_sql_params(conn)
    assert params[0] is None
    assert params[1] == "sistema"


def test_registrar_evento_detalle_jsonb():
    conn = _FakeConn([EVENTO_ROW])
    run(audit.registrar_evento(
        conn, accion="ep.concesion_otorgada", actor_id=ACTOR,
        detalle={"nivel": "editar"},
    ))
    _, params = _ultimo_sql_params(conn)
    assert params[7].obj == {"nivel": "editar"}   # Jsonb(obj)


def test_writer_no_hace_commit():
    conn = _FakeConn([EVENTO_ROW])
    run(audit.registrar_evento(conn, accion="ep.concesion_otorgada"))
    assert conn.commits == 0
    assert conn.rollbacks == 0


def test_writer_propaga_error_de_insercion():
    conn = _FakeConn([RuntimeError("violación FK actor_id")])
    with pytest.raises(RuntimeError, match="violación FK"):
        run(audit.registrar_evento(conn, accion="ep.concesion_otorgada"))
    assert conn.commits == 0


# ============================================================================
# CONCESIONES — otorgada / revocada (E7)
# ============================================================================

def test_auditar_concesion_otorgada():
    conn = _FakeConn([EVENTO_ROW])
    run(audit.auditar_concesion(
        conn, otorgada=True, actor_id=ACTOR, proyecto_id=PROYECTO,
        concesion_id=CONCESION, participante_id=PARTICIPANTE,
        recurso_tipo="lote", recurso_id=LOTE, nivel="editar",
    ))
    sql, params = _ultimo_sql_params(conn)
    assert "INSERT INTO audit_eventos" in sql
    assert params[2] == "ep.concesion_otorgada"
    assert params[3] == "concesion" and params[4] == str(CONCESION)
    assert params[5] == "proyecto" and params[6] == str(PROYECTO)
    detalle = params[7].obj
    assert detalle["participante_id"] == str(PARTICIPANTE)
    assert detalle["recurso_tipo"] == "lote"
    assert detalle["recurso_id"] == str(LOTE)
    assert detalle["nivel"] == "editar"


def test_auditar_concesion_revocada_conserva_trazabilidad():
    # Revocación: actor = quien revoca; detalle conserva participante,
    # proyecto (contexto), recurso_tipo, recurso_id, nivel (§14.5/E1)
    conn = _FakeConn([{**EVENTO_ROW, "accion": "ep.concesion_revocada"}])
    run(audit.auditar_concesion(
        conn, otorgada=False, actor_id=ACTOR, proyecto_id=PROYECTO,
        concesion_id=CONCESION, participante_id=PARTICIPANTE,
        recurso_tipo="lote", recurso_id=LOTE, nivel="editar",
        motivo="participante removido",
    ))
    _, params = _ultimo_sql_params(conn)
    assert params[0] == str(ACTOR)                       # actor que revoca
    assert params[2] == "ep.concesion_revocada"
    assert params[5] == "proyecto"                       # proyecto
    assert params[6] == str(PROYECTO)
    detalle = params[7].obj
    assert detalle["participante_id"] == str(PARTICIPANTE)
    assert detalle["recurso_tipo"] == "lote"
    assert detalle["recurso_id"] == str(LOTE)
    assert detalle["nivel"] == "editar"
    assert detalle["motivo"] == "participante removido"


def test_auditar_concesion_revocada_por_sistema():
    # E1: revocación automática al remover participante → sistema
    conn = _FakeConn([{**EVENTO_ROW, "actor_id": None,
                       "actor_tipo": "sistema"}])
    run(audit.auditar_concesion(
        conn, otorgada=False, actor_id=None, proyecto_id=PROYECTO,
        concesion_id=CONCESION, participante_id=PARTICIPANTE,
        recurso_tipo="lote",
    ))
    _, params = _ultimo_sql_params(conn)
    assert params[0] is None and params[1] == "sistema"
    assert params[2] == "ep.concesion_revocada"


# ============================================================================
# PARTICIPANTES — removido / reactivado / transferencia / responsable
# ============================================================================

def test_auditar_participante_removido():
    conn = _FakeConn([{**EVENTO_ROW, "objeto_tipo": "participante"}])
    run(audit.auditar_participante(
        conn, accion=audit.AccionEP.PARTICIPANTE_REMOVIDO,
        actor_id=ACTOR, proyecto_id=PROYECTO,
        participante_id=PARTICIPANTE, rol="tecnico",
    ))
    _, params = _ultimo_sql_params(conn)
    assert params[2] == "ep.participante_removido"
    assert params[3] == "participante"
    assert params[4] == str(PARTICIPANTE)
    assert params[6] == str(PROYECTO)
    assert params[7].obj["rol"] == "tecnico"


def test_auditar_participante_reactivado():
    conn = _FakeConn([{**EVENTO_ROW, "objeto_tipo": "participante"}])
    run(audit.auditar_participante(
        conn, accion=audit.AccionEP.PARTICIPANTE_REACTIVADO,
        actor_id=ACTOR, proyecto_id=PROYECTO,
        participante_id=PARTICIPANTE, rol="colaborador",
    ))
    _, params = _ultimo_sql_params(conn)
    assert params[2] == "ep.participante_reactivado"


def test_auditar_transferencia_propiedad():
    conn = _FakeConn([EVENTO_ROW])
    run(audit.auditar_participante(
        conn, accion=audit.AccionEP.PROPIEDAD_TRANSFERIDA,
        actor_id=ACTOR, proyecto_id=PROYECTO,
        participante_id=PARTICIPANTE, rol="propietario",
        detalle_extra={"propietario_anterior": str(uuid.uuid4())},
    ))
    _, params = _ultimo_sql_params(conn)
    assert params[2] == "ep.propiedad_transferida"
    assert "propietario_anterior" in params[7].obj


def test_auditar_cambio_responsable():
    conn = _FakeConn([EVENTO_ROW])
    run(audit.auditar_participante(
        conn, accion=audit.AccionEP.RESPONSABLE_CAMBIADO,
        actor_id=ACTOR, proyecto_id=PROYECTO,
        participante_id=PARTICIPANTE,
        rol="profesional_responsable",
        detalle_extra={"responsable_anterior": str(uuid.uuid4())},
    ))
    _, params = _ultimo_sql_params(conn)
    assert params[2] == "ep.responsable_cambiado"
