# backend/tests/test_workspaces.py
"""Pruebas unitarias de repository + schemas de workspaces (EP-4B).

Sin base de datos: conexión falsa que captura SQL y parámetros para
verificar aislamiento por usuario_id y las reglas de membresía.
"""
import asyncio
import uuid

import pytest
from pydantic import ValidationError

from modules.ecosistema_profesional.schemas.workspaces import (
    ActualizarMiembroRequest,
    InvitarMiembroRequest,
    WorkspaceCreate,
    WorkspaceUpdate,
)
from shared.repositories import workspaces as repo


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
WS = uuid.uuid4()
OBJ = uuid.uuid4()


def run(coro):
    return asyncio.run(coro)


# ============================================================================
# WORKSPACES
# ============================================================================

def test_crear_workspace_inserta_propietario():
    conn = _FakeConn(rows=[{"id": WS}])
    run(repo.crear_workspace(conn, UID, "Oficina Andrade", None))
    sql, params = conn.cursor_obj.queries[0]
    assert "INSERT INTO workspaces" in sql
    assert params == ("Oficina Andrade", str(UID), None)


def test_listar_workspaces_solo_miembros_activos():
    conn = _FakeConn(rows=[])
    run(repo.listar_workspaces_usuario(conn, UID))
    sql, params = conn.cursor_obj.queries[0]
    assert "wm.usuario_id = %s" in sql
    assert "wm.estado = 'activo'" in sql
    assert params == (str(UID),)


def test_actualizar_workspace_campos_editables():
    conn = _FakeConn(rows=[{"id": WS}])
    run(repo.actualizar_workspace(conn, WS, "Nuevo nombre", None))
    sql, params = conn.cursor_obj.queries[0]
    assert "UPDATE workspaces" in sql
    assert "COALESCE" in sql
    assert params == ("Nuevo nombre", None, str(WS))


# ============================================================================
# MIEMBROS
# ============================================================================

def test_obtener_miembro_por_pareja():
    conn = _FakeConn(rows=[{"id": uuid.uuid4(), "rol": "socio"}])
    run(repo.obtener_miembro(conn, WS, UID))
    sql, params = conn.cursor_obj.queries[0]
    assert "workspace_id = %s AND usuario_id = %s" in sql
    assert params == (str(WS), str(UID))


def test_agregar_miembro_estado_invitado_por_defecto():
    conn = _FakeConn(rows=[{"id": uuid.uuid4(), "estado": "invitado"}])
    run(repo.agregar_miembro(conn, WS, OBJ, "colaborador"))
    sql, params = conn.cursor_obj.queries[0]
    assert "INSERT INTO workspace_miembros" in sql
    assert params == (str(WS), str(OBJ), "colaborador")


def test_actualizar_miembro_coalesce():
    conn = _FakeConn(rows=[{"id": uuid.uuid4(), "estado": "activo"}])
    run(repo.actualizar_miembro(conn, WS, OBJ, rol=None, estado="activo"))
    sql, params = conn.cursor_obj.queries[0]
    assert "UPDATE workspace_miembros" in sql
    assert params == (None, "activo", str(WS), str(OBJ))


def test_contar_propietarios_activos():
    conn = _FakeConn(rows=[{"n": 2}])
    assert run(repo.contar_propietarios_activos(conn, WS)) == 2
    sql, _ = conn.cursor_obj.queries[0]
    assert "rol = 'propietario'" in sql and "estado = 'activo'" in sql


def test_existe_usuario():
    conn = _FakeConn(rows=[{"?column?": 1}])
    assert run(repo.existe_usuario(conn, OBJ)) is True
    conn2 = _FakeConn(rows=[])
    assert run(repo.existe_usuario(conn2, OBJ)) is False


# ============================================================================
# SCHEMAS
# ============================================================================

def test_workspace_create_valida_nombre():
    with pytest.raises(ValidationError):
        WorkspaceCreate(nombre="")
    ws = WorkspaceCreate(nombre="Oficina Andrade")
    assert ws.descripcion is None


def test_invitar_rol_valido_y_uuid():
    with pytest.raises(ValidationError):
        InvitarMiembroRequest(usuario_id=str(uuid.uuid4()), rol="admin")
    req = InvitarMiembroRequest(usuario_id=str(OBJ))
    assert req.rol == "colaborador"


def test_actualizar_miembro_opcional():
    req = ActualizarMiembroRequest()
    assert req.rol is None and req.estado is None
    req2 = ActualizarMiembroRequest(estado="removido")
    assert req2.estado == "removido"


def test_workspace_update_parcial():
    upd = WorkspaceUpdate(nombre="Nuevo")
    assert upd.descripcion is None
