# backend/tests/test_perfiles_profesionales.py
"""Pruebas unitarias de repository + schemas de perfiles (EP-4A).

Sin base de datos: el repository se verifica con una conexión falsa que
captura el SQL y los parámetros — así se comprueba el aislamiento por
usuario_id y que `perfil_id` viaja siempre como UUID real.
"""
import asyncio
import uuid

import pytest
from pydantic import ValidationError

from modules.ecosistema_profesional.schemas.perfiles import (
    AsignarPerfilRequest,
    PerfilAsignadoResponse,
    PerfilProfesionalResponse,
)
from shared.repositories import perfiles_profesionales as repo


# ============================================================================
# CONEXIÓN FALSA — captura SQL y parámetros
# ============================================================================

class _FakeCursor:
    def __init__(self, rows=None):
        self.rows = rows or []
        self.queries = []

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def execute(self, sql, params=None):
        self.queries.append((sql, params))

    async def fetchall(self):
        return self.rows

    async def fetchone(self):
        return self.rows[0] if self.rows else None


class _FakeConn:
    def __init__(self, rows=None):
        self.cursor_obj = _FakeCursor(rows)

    def cursor(self, row_factory=None):
        return self.cursor_obj


UID = uuid.uuid4()
PID = uuid.uuid4()


def run(coro):
    return asyncio.run(coro)


# ============================================================================
# REPOSITORY — catálogo
# ============================================================================

def test_listar_catalogo_solo_activos():
    conn = _FakeConn(rows=[{"id": PID, "codigo": "agronomo"}])
    resultado = run(repo.listar_catalogo_activo(conn))
    sql, params = conn.cursor_obj.queries[0]
    assert "WHERE activo = TRUE" in sql
    assert params is None
    assert resultado[0]["codigo"] == "agronomo"


def test_obtener_perfil_por_uuid():
    conn = _FakeConn(rows=[{"id": PID, "activo": True}])
    run(repo.obtener_perfil(conn, PID))
    sql, params = conn.cursor_obj.queries[0]
    assert "WHERE id = %s" in sql
    assert params == (str(PID),)


# ============================================================================
# REPOSITORY — asignaciones (aislamiento por usuario_id)
# ============================================================================

def test_listar_perfiles_usuario_filtra_por_usuario():
    conn = _FakeConn(rows=[])
    run(repo.listar_perfiles_usuario(conn, UID))
    sql, params = conn.cursor_obj.queries[0]
    assert "up.usuario_id = %s" in sql
    assert "JOIN perfiles_profesionales" in sql
    assert params == (str(UID),)


def test_asignar_perfil_inserta_fk_uuid():
    conn = _FakeConn(rows=[{"asignacion_id": uuid.uuid4()}])
    run(repo.asignar_perfil(conn, UID, PID))
    sql, params = conn.cursor_obj.queries[0]
    assert "INSERT INTO usuarios_perfiles" in sql
    assert params == (str(UID), str(PID))


def test_desasignar_perfil_borra_por_pareja():
    conn = _FakeConn(rows=[{"id": uuid.uuid4()}])
    eliminado = run(repo.desasignar_perfil(conn, UID, PID))
    sql, params = conn.cursor_obj.queries[0]
    assert "DELETE FROM usuarios_perfiles" in sql
    assert "usuario_id = %s AND perfil_id = %s" in sql
    assert params == (str(UID), str(PID))
    assert eliminado is True


def test_desasignar_perfil_inexistente_false():
    conn = _FakeConn(rows=[])
    assert run(repo.desasignar_perfil(conn, UID, PID)) is False


def test_tiene_perfil_consulta_por_codigo():
    conn = _FakeConn(rows=[{"?column?": 1}])
    assert run(repo.tiene_perfil(conn, UID, "agronomo")) is True
    sql, params = conn.cursor_obj.queries[0]
    assert "p.codigo = %s" in sql
    assert params == (str(UID), "agronomo")


def test_tiene_perfil_ausente_false():
    conn = _FakeConn(rows=[])
    assert run(repo.tiene_perfil(conn, UID, "veterinario")) is False


# ============================================================================
# SCHEMAS
# ============================================================================

def test_asignar_request_exige_uuid():
    with pytest.raises(ValidationError):
        AsignarPerfilRequest(perfil_id="agronomo")  # código ≠ UUID


def test_asignar_request_acepta_uuid():
    req = AsignarPerfilRequest(perfil_id=str(PID))
    assert req.perfil_id == PID


def test_perfil_response_modelo():
    from datetime import datetime, timezone
    resp = PerfilProfesionalResponse(
        id=PID, codigo="agronomo", nombre="Agrónomo/a",
        descripcion=None, created_at=datetime.now(timezone.utc),
    )
    assert resp.codigo == "agronomo"


def test_perfil_asignado_response_modelo():
    from datetime import datetime, timezone
    resp = PerfilAsignadoResponse(
        asignacion_id=uuid.uuid4(), perfil_id=PID,
        codigo="agronomo", nombre="Agrónomo/a",
        descripcion=None, verificado=False, principal=False,
        created_at=datetime.now(timezone.utc),
    )
    assert resp.verificado is False
