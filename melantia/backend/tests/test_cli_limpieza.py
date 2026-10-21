# backend/tests/test_cli_limpieza.py
"""Pruebas de FIX-03: retirada del endpoint público de limpieza y CLI
autorizada con advisory lock + --dry-run.

Todo se ejecuta con conexiones falsas: ningún test toca la base de
datos real ni el disco fuera de tmp_path.
"""
import asyncio
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

import cli
from main import app
from modules.mantenimiento import limpieza

client = TestClient(app, raise_server_exceptions=False)


# ============================================================================
# RETIRADA DEL ENDPOINT HTTP
# ============================================================================

def test_endpoint_cron_quincenal_retirado():
    rutas = [getattr(r, "path", "") for r in app.routes]
    assert "/api/sistema/cron-quincenal" not in rutas


def test_cron_quincenal_http_rechazado():
    r = client.post("/api/sistema/cron-quincenal")
    assert r.status_code in (404, 405)


# ============================================================================
# CONEXIÓN FALSA — cola de resultados por orden de consulta
# ============================================================================

class _FakeCursor:
    def __init__(self, result=None):
        self._result = result if result is not None else []

    async def fetchone(self):
        if isinstance(self._result, dict):
            return self._result
        return self._result[0] if self._result else None

    async def fetchall(self):
        return (
            list(self._result) if isinstance(self._result, list) else []
        )


class _FakeConn:
    """results: cola por execute(); fail_at/fail_exc disparan error."""

    def __init__(self, results=None, fail_at=None, fail_exc=None):
        self.results = list(results or [])
        self.queries = []
        self.commits = 0
        self.fail_at = fail_at
        self.fail_exc = fail_exc or Exception("fallo simulado")

    async def execute(self, sql, params=None):
        idx = len(self.queries)
        self.queries.append((sql, params))
        if idx == self.fail_at:
            raise self.fail_exc
        return _FakeCursor(
            self.results.pop(0) if self.results else []
        )

    async def commit(self):
        self.commits += 1


def _fake_db(conn):
    @asynccontextmanager
    async def _ctx():
        yield conn, None
    return _ctx


def _run(coro):
    return asyncio.run(coro)


def _lock_ok():
    return {"adquirido": True}


# ============================================================================
# WORKER — advisory lock, selección, confinamiento
# ============================================================================

def test_limpieza_lock_ocupado_no_ejecuta(monkeypatch):
    # pg_try_advisory_lock devuelve False → no toca registros.
    conn = _FakeConn(results=[{"adquirido": False}])
    monkeypatch.setattr(
        limpieza, "get_db_connection", lambda: _fake_db(conn)()
    )
    r = _run(limpieza.ejecutar_limpieza_quincenal_selectiva())
    assert r["bloqueada"] is True
    assert len(conn.queries) == 1  # solo el intento de lock
    assert "pg_try_advisory_lock" in conn.queries[0][0]
    assert conn.commits == 0


def test_limpieza_lock_se_adquiere_y_libera(monkeypatch):
    # Orden: lock → SELECT (0 filas) → unlock.
    conn = _FakeConn(results=[_lock_ok(), []])
    monkeypatch.setattr(
        limpieza, "get_db_connection", lambda: _fake_db(conn)()
    )
    r = _run(limpieza.ejecutar_limpieza_quincenal_selectiva())
    assert r["bloqueada"] is False
    sqls = [s for s, _ in conn.queries]
    assert sqls[0].startswith("SELECT pg_try_advisory_lock")
    assert sqls[-1].startswith("SELECT pg_advisory_unlock")


def test_limpieza_lock_se_libera_tras_error(monkeypatch):
    # Fallo en el SELECT de registros → el finally libera el lock.
    conn = _FakeConn(
        results=[_lock_ok()], fail_at=1,
        fail_exc=Exception("error de base de datos"),
    )
    monkeypatch.setattr(
        limpieza, "get_db_connection", lambda: _fake_db(conn)()
    )
    with pytest.raises(Exception):
        _run(limpieza.ejecutar_limpieza_quincenal_selectiva())
    sqls = [s for s, _ in conn.queries]
    assert sqls[-1].startswith("SELECT pg_advisory_unlock")


def test_limpieza_no_libera_lock_ajeno(monkeypatch):
    # Si el lock no se adquirió, nunca se ejecuta unlock.
    conn = _FakeConn(results=[{"adquirido": False}])
    monkeypatch.setattr(
        limpieza, "get_db_connection", lambda: _fake_db(conn)()
    )
    _run(limpieza.ejecutar_limpieza_quincenal_selectiva())
    assert not any(
        "pg_advisory_unlock" in s for s, _ in conn.queries
    )


def test_limpieza_real_elimina_y_commitea(monkeypatch, tmp_path):
    monkeypatch.setattr(limpieza, "STORAGE_DIR", tmp_path)
    foto = tmp_path / "evidencia.jpg"
    foto.write_bytes(b"x")
    reg = {"id": uuid.uuid4(), "foto_url": str(foto)}
    conn = _FakeConn(results=[_lock_ok(), [reg], []])
    monkeypatch.setattr(
        limpieza, "get_db_connection", lambda: _fake_db(conn)()
    )
    r = _run(limpieza.ejecutar_limpieza_quincenal_selectiva())
    assert r["seleccionados"] == 1 and r["eliminados"] == 1
    assert r["archivos_eliminados"] == 1
    assert not foto.exists()
    assert conn.commits == 1
    assert any("DELETE" in s.upper() for s, _ in conn.queries)


def test_dry_run_no_elimina_nada(monkeypatch, tmp_path):
    monkeypatch.setattr(limpieza, "STORAGE_DIR", tmp_path)
    foto = tmp_path / "evidencia.jpg"
    foto.write_bytes(b"x")
    reg = {"id": uuid.uuid4(), "foto_url": str(foto)}
    conn = _FakeConn(results=[_lock_ok(), [reg]])
    monkeypatch.setattr(
        limpieza, "get_db_connection", lambda: _fake_db(conn)()
    )
    r = _run(
        limpieza.ejecutar_limpieza_quincenal_selectiva(dry_run=True)
    )
    # Informa de lo que borraría pero no borra ni commitea.
    assert r["seleccionados"] == 1
    assert r["archivos_eliminados"] == 1  # contabiliza "borrables"
    assert r["eliminados"] == 0
    assert foto.exists()
    assert conn.commits == 0
    assert not any(
        "DELETE" in s.upper() or "UPDATE" in s.upper()
        for s, _ in conn.queries
    )


def test_confinamiento_archivo_fuera_de_storage(monkeypatch, tmp_path):
    # foto_url fuera de STORAGE_DIR → no se toca, pero el registro
    # sigue eliminándose (comportamiento original preservado).
    monkeypatch.setattr(limpieza, "STORAGE_DIR", tmp_path)
    fuera = tmp_path.parent / f"{uuid.uuid4().hex}.jpg"
    reg = {"id": uuid.uuid4(), "foto_url": str(fuera)}
    conn = _FakeConn(results=[_lock_ok(), [reg], []])
    monkeypatch.setattr(
        limpieza, "get_db_connection", lambda: _fake_db(conn)()
    )
    r = _run(limpieza.ejecutar_limpieza_quincenal_selectiva())
    assert r["archivos_fuera_de_almacenamiento"] == 1
    assert r["archivos_eliminados"] == 0
    assert r["eliminados"] == 1


def test_criterio_seleccion_preservado(monkeypatch):
    conn = _FakeConn(results=[_lock_ok(), []])
    monkeypatch.setattr(
        limpieza, "get_db_connection", lambda: _fake_db(conn)()
    )
    _run(limpieza.ejecutar_limpieza_quincenal_selectiva())
    sql = conn.queries[1][0]
    assert "created_at <" in sql
    assert "es_activo_conocimiento = FALSE" in sql
    # Umbral de 15 días intacto.
    assert limpieza.DIAS_RETENCION == 15


# ============================================================================
# CLI — parsing, códigos de salida, mensajes
# ============================================================================

def test_cli_parse_dry_run():
    args = cli.build_parser().parse_args(
        ["limpieza-quincenal", "--dry-run"]
    )
    assert args.comando == "limpieza-quincenal"
    assert args.dry_run is True


def test_cli_parse_sin_comando_falla():
    with pytest.raises(SystemExit):
        cli.build_parser().parse_args([])


def test_cli_exito(monkeypatch, capsys):
    async def _fake(dry_run=False):
        return {
            "bloqueada": False, "seleccionados": 3, "eliminados": 3,
            "archivos_eliminados": 1,
            "archivos_fuera_de_almacenamiento": 0,
            "dry_run": dry_run,
        }
    monkeypatch.setattr(
        limpieza, "ejecutar_limpieza_quincenal_selectiva", _fake
    )
    assert cli.main(["limpieza-quincenal"]) == 0
    assert "Registros eliminados: 3" in capsys.readouterr().out


def test_cli_dry_run_mensaje(monkeypatch, capsys):
    async def _fake(dry_run=False):
        return {
            "bloqueada": False, "seleccionados": 2, "eliminados": 0,
            "archivos_eliminados": 2,
            "archivos_fuera_de_almacenamiento": 0,
            "dry_run": dry_run,
        }
    monkeypatch.setattr(
        limpieza, "ejecutar_limpieza_quincenal_selectiva", _fake
    )
    assert cli.main(["limpieza-quincenal", "--dry-run"]) == 0
    out = capsys.readouterr().out
    assert "DRY-RUN" in out and "Registros elegibles: 2" in out


def test_cli_lock_ocupado_exit_2(monkeypatch, capsys):
    async def _fake(dry_run=False):
        return {
            "bloqueada": True, "seleccionados": 0, "eliminados": 0,
            "archivos_eliminados": 0,
            "archivos_fuera_de_almacenamiento": 0,
            "dry_run": dry_run,
        }
    monkeypatch.setattr(
        limpieza, "ejecutar_limpieza_quincenal_selectiva", _fake
    )
    assert cli.main(["limpieza-quincenal"]) == 2
    assert "OCUPADO" in capsys.readouterr().err


def test_cli_error_exit_1_sin_detalle_sensible(monkeypatch, capsys):
    # El mensaje al operador es genérico; el detalle técnico va al
    # log (stderr de pytest puede contener el traceback del logger —
    # lo que no debe hacerse es incrustarlo en la respuesta de CLI).
    async def _falla(dry_run=False):
        raise Exception("host=db.internal password=secreto")
    monkeypatch.setattr(
        limpieza, "ejecutar_limpieza_quincenal_selectiva", _falla
    )
    assert cli.main(["limpieza-quincenal"]) == 1
    err = capsys.readouterr().err
    linea_usuario = next(
        l for l in err.splitlines() if l.startswith("ERROR")
    )
    assert "password" not in linea_usuario
    assert "secreto" not in linea_usuario
