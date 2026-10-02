# backend/tests/test_ep_participantes_e1.py
"""Pruebas E2E del ciclo de vida de participantes con E1 (EP-4E-E).

PostgreSQL real. Verifica la cadena aprobada:
    ACTIVO → remover → REMOVIDO + concesiones activas revocadas
             en la MISMA transacción + audit_eventos (retiro y cada
             revocación). REMOVIDO → ACTIVO recupera solo el nivel
             base; las concesiones revocadas nunca reviven y el
             re-otorgamiento crea fila nueva (E9).
"""
import asyncio
import uuid

import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg.rows import dict_row

from core.config import settings
from core.dependencies import get_current_user, get_db
from main import app

P = "e4ee0000-0000-0000-0000-000000000"   # prefijo aislado E1
U_OWNER = f"{P}001"
U_TEC = f"{P}002"                        # se remueve/reactiva en tests
U_INV = f"{P}003"                        # invitado
U_AJENO = f"{P}004"
PROY = f"{P}0a0"
FINCA = f"{P}0f0"
LOTE = f"{P}010"
PART_TEC = f"{P}0c1"
PART_INV = f"{P}0c2"
CONC_LOTE = f"{P}0d1"                    # concesión activa 'editar' lote
CONC_TIPO = f"{P}0d2"                    # concesión activa 'consulta' registro (tipo)

BASE = "/api/v1/ep/proyectos"


def run(coro):
    return asyncio.run(coro)


async def _conn():
    return await psycopg.AsyncConnection.connect(
        settings.database_url, autocommit=False, row_factory=dict_row
    )


async def _semilla():
    conn = await _conn()
    async with conn.cursor() as cur:
        for uid, nombre in [
            (U_OWNER, "E1 Owner"), (U_TEC, "E1 Tec"),
            (U_INV, "E1 Inv"), (U_AJENO, "E1 Ajeno"),
        ]:
            await cur.execute(
                "INSERT INTO usuarios (id, nombre, cedula_ruc,"
                " sector_comunidad) VALUES (%s,%s,%s,%s)",
                (uid, nombre, f"99{uid[-3:]}", "TEST-E1"),
            )
        await cur.execute(
            "INSERT INTO ep_proyectos (id, nombre) VALUES (%s,%s)",
            (PROY, "E1 Proyecto"),
        )
        await cur.execute(
            "INSERT INTO ep_proyecto_participantes"
            " (id, proyecto_id, usuario_id, rol, estado) VALUES"
            " (%s,%s,%s,'propietario','activo'),"
            " (%s,%s,%s,'tecnico','activo'),"
            " (%s,%s,%s,'tecnico','invitado')",
            (str(uuid.uuid4()), PROY, U_OWNER,
             PART_TEC, PROY, U_TEC,
             PART_INV, PROY, U_INV),
        )
        await cur.execute(
            "INSERT INTO fincas (id, usuario_id, nombre)"
            " VALUES (%s,%s,'Finca E1')", (FINCA, U_OWNER),
        )
        await cur.execute(
            "INSERT INTO lotes (id, finca_id, nombre_lote)"
            " VALUES (%s,%s,'Lote E1')", (LOTE, FINCA),
        )
        await cur.execute(
            "INSERT INTO ep_proyecto_lotes (proyecto_id, lote_id)"
            " VALUES (%s,%s)", (PROY, LOTE),
        )
    await conn.commit()
    await conn.close()


async def _reset_escenario():
    """Estado conocido por test: TEC activo con exactamente 2
    concesiones activas, INV invitado, audit limpio.

    Las concesiones se recrean desde cero: no se puede re-activar una
    fila revocada si el test anterior re-otorgó la misma clave — el
    índice parcial E9 la bloquearía (esa es precisamente la regla que
    se prueba)."""
    conn = await _conn()
    async with conn.cursor() as cur:
        await cur.execute(
            "UPDATE ep_proyecto_participantes SET estado='activo'"
            " WHERE id=%s", (PART_TEC,))
        await cur.execute(
            "UPDATE ep_proyecto_participantes SET estado='invitado'"
            " WHERE id=%s", (PART_INV,))
        await cur.execute(
            "DELETE FROM ep_proyecto_concesiones WHERE proyecto_id=%s",
            (PROY,))
        await cur.execute(
            "INSERT INTO ep_proyecto_concesiones"
            " (id, proyecto_id, participante_id, recurso_tipo,"
            "  recurso_id, nivel, estado) VALUES"
            " (%s,%s,%s,'lote',%s,'editar','activa')",
            (CONC_LOTE, PROY, PART_TEC, LOTE))
        await cur.execute(
            "INSERT INTO ep_proyecto_concesiones"
            " (id, proyecto_id, participante_id, recurso_tipo,"
            "  nivel, estado) VALUES"
            " (%s,%s,%s,'registro','consulta','activa')",
            (CONC_TIPO, PROY, PART_TEC))
        await cur.execute(
            "DELETE FROM audit_eventos WHERE contexto_id=%s", (PROY,))
    await conn.commit()
    await conn.close()


async def _limpieza():
    conn = await _conn()
    async with conn.cursor() as cur:
        await cur.execute(
            "DELETE FROM audit_eventos WHERE contexto_id=%s", (PROY,))
        await cur.execute(
            "DELETE FROM ep_proyecto_concesiones WHERE proyecto_id=%s",
            (PROY,))
        await cur.execute(
            "DELETE FROM ep_proyecto_lotes WHERE proyecto_id=%s", (PROY,))
        await cur.execute("DELETE FROM lotes WHERE id=%s", (LOTE,))
        await cur.execute("DELETE FROM fincas WHERE id=%s", (FINCA,))
        await cur.execute(
            "DELETE FROM ep_proyecto_participantes WHERE proyecto_id=%s",
            (PROY,))
        await cur.execute("DELETE FROM ep_proyectos WHERE id=%s", (PROY,))
        await cur.execute(
            "DELETE FROM usuarios WHERE sector_comunidad='TEST-E1'")
    await conn.commit()
    await conn.close()


def _override(usuario):
    async def _db():
        conn = await _conn()
        try:
            yield conn, None
        finally:
            try:
                await conn.rollback()
            except Exception:
                pass
            await conn.close()
    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user] = lambda: usuario


@pytest.fixture(scope="module")
def api():
    run(_semilla())
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()
    run(_limpieza())


@pytest.fixture(autouse=True)
def _reset():
    run(_reset_escenario())       # estado conocido ANTES de cada test
    yield
    app.dependency_overrides.clear()


def _fila_concesion(cid):
    conn = run(_conn())

    async def _get():
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT estado, revocado_por, revocado_at"
                " FROM ep_proyecto_concesiones WHERE id=%s", (cid,))
            return await cur.fetchone()
    fila = run(_get())
    run(conn.close())
    return fila


def _audits(accion):
    conn = run(_conn())

    async def _get():
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT accion, objeto_id, actor_id, detalle"
                " FROM audit_eventos WHERE contexto_id=%s"
                " AND accion=%s ORDER BY created_at", (PROY, accion))
            return await cur.fetchall()
    filas = run(_get())
    run(conn.close())
    return filas


# ============================================================================
# E1 — REMOVER: revocación masiva + audit en la misma transacción
# ============================================================================

def test_remover_revoca_todas_las_concesiones_activas(api):
    _override(U_OWNER)
    r = api.post(f"{BASE}/{PROY}/participantes/{U_TEC}/remover")
    assert r.status_code == 200, r.text
    j = r.json()
    assert j["estado"] == "removido"
    assert j["concesiones_revocadas"] == 2

    # ambas concesiones quedan 'revocada' con trazabilidad completa
    for cid in (CONC_LOTE, CONC_TIPO):
        fila = _fila_concesion(cid)
        assert fila["estado"] == "revocada"
        assert str(fila["revocado_por"]) == U_OWNER
        assert fila["revocado_at"] is not None

    # audit: 1 retiro + 2 revocaciones con motivo
    retiros = _audits("ep.participante_removido")
    assert len(retiros) == 1
    assert str(retiros[0]["actor_id"]) == U_OWNER
    assert retiros[0]["detalle"]["concesiones_revocadas"] == 2
    revocaciones = _audits("ep.concesion_revocada")
    assert len(revocaciones) == 2
    assert all(
        r["detalle"]["motivo"] == "participante removido"
        for r in revocaciones
    )


def test_removido_pierde_acceso_inmediato(api):
    _override(U_OWNER)
    api.post(f"{BASE}/{PROY}/participantes/{U_TEC}/remover")
    _override(U_TEC)
    # concesión 'editar' sobre lote NO rescata — removido = ninguno
    assert api.get(f"{BASE}/{PROY}").status_code == 404
    assert api.get(f"{BASE}/{PROY}/lotes/{LOTE}").status_code == 404


def test_remover_propietario_rechazado(api):
    _override(U_OWNER)
    r = api.post(f"{BASE}/{PROY}/participantes/{U_OWNER}/remover")
    assert r.status_code == 400
    # propietario sigue activo
    conn = run(_conn())

    async def _estado():
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT estado FROM ep_proyecto_participantes"
                " WHERE proyecto_id=%s AND usuario_id=%s",
                (PROY, U_OWNER))
            return (await cur.fetchone())["estado"]
    assert run(_estado()) == "activo"
    run(conn.close())


def test_tecnico_no_puede_remover(api):
    _override(U_TEC)
    r = api.post(f"{BASE}/{PROY}/participantes/{U_OWNER}/remover")
    assert r.status_code == 403


def test_remover_ajeno_404(api):
    _override(U_OWNER)
    r = api.post(f"{BASE}/{PROY}/participantes/{U_AJENO}/remover")
    assert r.status_code == 404


def test_remover_ya_removido_404(api):
    _override(U_OWNER)
    api.post(f"{BASE}/{PROY}/participantes/{U_TEC}/remover")
    r = api.post(f"{BASE}/{PROY}/participantes/{U_TEC}/remover")
    assert r.status_code == 404


def test_remover_fallido_no_deja_audit(api):
    antes = len(_audits("ep.participante_removido"))
    _override(U_OWNER)
    api.post(f"{BASE}/{PROY}/participantes/{U_AJENO}/remover")   # 404
    assert len(_audits("ep.participante_removido")) == antes


# ============================================================================
# E1 — REACTIVAR: solo nivel base, concesiones no reviven
# ============================================================================

def test_reactivar_recupera_solo_nivel_base(api):
    _override(U_OWNER)
    api.post(f"{BASE}/{PROY}/participantes/{U_TEC}/remover")
    r = api.post(f"{BASE}/{PROY}/participantes/{U_TEC}/reactivar")
    assert r.status_code == 200, r.text
    assert r.json()["estado"] == "activo"

    # acceso vuelve pero SOLO con el base de técnico ('consulta')
    _override(U_TEC)
    lote = api.get(f"{BASE}/{PROY}/lotes/{LOTE}")
    assert lote.status_code == 200
    assert lote.json()["mi_nivel"] == "consulta"   # no 'editar'

    # las concesiones permanecen 'revocada' — nunca reviven (E1)
    assert _fila_concesion(CONC_LOTE)["estado"] == "revocada"
    assert _fila_concesion(CONC_TIPO)["estado"] == "revocada"

    # audit de reactivación registrado
    react = _audits("ep.participante_reactivado")
    assert len(react) == 1
    assert str(react[0]["actor_id"]) == U_OWNER


def test_reotorgar_tras_reactivar_crea_fila_nueva(api):
    _override(U_OWNER)
    api.post(f"{BASE}/{PROY}/participantes/{U_TEC}/remover")
    api.post(f"{BASE}/{PROY}/participantes/{U_TEC}/reactivar")
    r = api.post(f"{BASE}/{PROY}/concesiones", json={
        "usuario_id": U_TEC, "recurso_tipo": "lote",
        "recurso_id": LOTE, "nivel": "editar",
    })
    assert r.status_code == 201
    assert r.json()["id"] != CONC_LOTE   # fila nueva (E9), la vieja sigue revocada
    assert _fila_concesion(CONC_LOTE)["estado"] == "revocada"

    # y la nueva sí eleva el permiso
    _override(U_TEC)
    lote = api.get(f"{BASE}/{PROY}/lotes/{LOTE}")
    assert lote.json()["mi_nivel"] == "editar"


def test_reactivar_no_removido_404(api):
    # TEC está activo — reactivar no aplica
    _override(U_OWNER)
    r = api.post(f"{BASE}/{PROY}/participantes/{U_TEC}/reactivar")
    assert r.status_code == 404
    # invitado tampoco (no es 'removido')
    r2 = api.post(f"{BASE}/{PROY}/participantes/{U_INV}/reactivar")
    assert r2.status_code == 404


def test_sin_jwt_401(api):
    r = api.post(f"{BASE}/{PROY}/participantes/{U_TEC}/remover")
    assert r.status_code in (401, 403)
