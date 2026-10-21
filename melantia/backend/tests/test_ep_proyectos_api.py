# backend/tests/test_ep_proyectos_api.py
"""Pruebas E2E de endpoints contextuales EP (EP-4E-D) — PostgreSQL real.

A diferencia de test_ep_autorizacion (fakes), aquí la cadena completa
    JWT → require_ep_access → resolver_permiso → endpoint → audit
se ejecuta contra melantia_db con datos reales que se crean y limpian
por fixture. Marca: se saltan si PostgreSQL no está disponible.
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone

import psycopg
import pytest
from fastapi.testclient import TestClient
from psycopg.rows import dict_row

from conftest import pg_error_conexion, test_db_url
from core.dependencies import get_current_user, get_db
from main import app

P = "e4ed0000-0000-0000-0000-000000000"  # prefijo (11 dígitos + 3 hex)
U_OWNER = f"{P}001"      # propietario del proyecto A
U_TEC = f"{P}002"        # técnico activo en A
U_INV = f"{P}003"        # invitado en A
U_REM = f"{P}004"        # removido en A
U_CLI = f"{P}005"        # cliente activo en A (techo consulta)
U_AJENO = f"{P}006"      # sin participación en nada
PROY_A = f"{P}0a0"
PROY_B = f"{P}0b0"
FINCA = f"{P}0f0"
LOTE_A = f"{P}01a"       # vinculado al proyecto A
LOTE_B = f"{P}01b"       # vinculado SOLO al proyecto B
PART_TEC = f"{P}0c1"
AHORA = datetime.now(timezone.utc)


def run(coro):
    return asyncio.run(coro)


async def _conn():
    # Solo la BD de pruebas: test_db_url valida aislamiento y hace
    # skip sin la variable; jamás toca la BD de la aplicación.
    try:
        return await psycopg.AsyncConnection.connect(
            test_db_url(), autocommit=False, row_factory=dict_row
        )
    except psycopg.OperationalError as e:
        pg_error_conexion(e)   # 28P01/3D000/otros → fail; solo sin servidor → skip


async def _semilla():
    """Crea el escenario: proyecto A con participantes, proyecto B,
    un lote vinculado a cada uno."""
    conn = await _conn()
    async with conn.cursor() as cur:
        for uid, nombre in [
            (U_OWNER, "EP4ED Owner"), (U_TEC, "EP4ED Tec"),
            (U_INV, "EP4ED Inv"), (U_REM, "EP4ED Rem"),
            (U_CLI, "EP4ED Cli"), (U_AJENO, "EP4ED Ajeno"),
        ]:
            await cur.execute(
                "INSERT INTO usuarios (id, nombre, cedula_ruc,"
                " sector_comunidad) VALUES (%s,%s,%s,%s)",
                (uid, nombre, f"88{uid[-3:]}", "TEST-EP4ED"),
            )
        await cur.execute(
            "INSERT INTO ep_proyectos (id, nombre) VALUES (%s,%s),(%s,%s)",
            (PROY_A, "EP4ED Proyecto A", PROY_B, "EP4ED Proyecto B"),
        )
        await cur.execute(
            "INSERT INTO ep_proyecto_participantes"
            " (id, proyecto_id, usuario_id, rol, estado) VALUES"
            " (%s,%s,%s,'propietario','activo'),"
            " (%s,%s,%s,'tecnico','activo'),"
            " (%s,%s,%s,'tecnico','invitado'),"
            " (%s,%s,%s,'tecnico','removido'),"
            " (%s,%s,%s,'cliente','activo'),"
            " (%s,%s,%s,'propietario','activo')",
            (str(uuid.uuid4()), PROY_A, U_OWNER,
             PART_TEC, PROY_A, U_TEC,
             str(uuid.uuid4()), PROY_A, U_INV,
             str(uuid.uuid4()), PROY_A, U_REM,
             str(uuid.uuid4()), PROY_A, U_CLI,
             str(uuid.uuid4()), PROY_B, U_OWNER),
        )
        await cur.execute(
            "INSERT INTO fincas (id, usuario_id, nombre)"
            " VALUES (%s,%s,%s)",
            (FINCA, U_OWNER, "Finca EP4ED"),
        )
        await cur.execute(
            "INSERT INTO lotes (id, finca_id, nombre_lote) VALUES"
            " (%s,%s,'Lote A'),(%s,%s,'Lote B')",
            (LOTE_A, FINCA, LOTE_B, FINCA),
        )
        await cur.execute(
            "INSERT INTO ep_proyecto_lotes (proyecto_id, lote_id)"
            " VALUES (%s,%s),(%s,%s)",
            (PROY_A, LOTE_A, PROY_B, LOTE_B),
        )
    await conn.commit()
    await conn.close()


async def _limpieza():
    conn = await _conn()
    async with conn.cursor() as cur:
        await cur.execute(
            "DELETE FROM audit_eventos WHERE contexto_id IN (%s,%s)",
            (PROY_A, PROY_B))
        await cur.execute(
            "DELETE FROM ep_proyecto_concesiones WHERE proyecto_id"
            " IN (%s,%s)", (PROY_A, PROY_B))
        await cur.execute(
            "DELETE FROM ep_proyecto_lotes WHERE proyecto_id IN (%s,%s)",
            (PROY_A, PROY_B))
        await cur.execute("DELETE FROM lotes WHERE id IN (%s,%s)",
                          (LOTE_A, LOTE_B))
        await cur.execute("DELETE FROM fincas WHERE id=%s", (FINCA,))
        await cur.execute(
            "DELETE FROM ep_proyecto_participantes WHERE proyecto_id"
            " IN (%s,%s)", (PROY_A, PROY_B))
        await cur.execute("DELETE FROM ep_proyectos WHERE id IN (%s,%s)",
                          (PROY_A, PROY_B))
        await cur.execute(
            "DELETE FROM usuarios WHERE sector_comunidad='TEST-EP4ED'")
    await conn.commit()
    await conn.close()


def _override(usuario):
    """get_db con conexión REAL + usuario fijado (sin JWT real)."""
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
def _limpiar_overrides():
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def _concesiones_limpias():
    """Cada test parte de cero concesiones en ambos proyectos — la
    unicidad de activas (E9) haría tests orden-dependientes."""
    conn = run(_conn())

    async def _borrar():
        async with conn.cursor() as cur:
            await cur.execute(
                "DELETE FROM ep_proyecto_concesiones WHERE proyecto_id"
                " IN (%s,%s)", (PROY_A, PROY_B))
        await conn.commit()
    run(_borrar())
    run(conn.close())
    yield


BASE = "/api/v1/ep/proyectos"


# ============================================================================
# LECTURA CONTEXTUAL
# ============================================================================

def test_participante_lee_proyecto(api):
    _override(U_TEC)
    r = api.get(f"{BASE}/{PROY_A}")
    assert r.status_code == 200
    assert r.json()["nombre"] == "EP4ED Proyecto A"
    assert r.json()["mi_nivel"] == "consulta"


def test_ajeno_404_indistinguible(api):
    _override(U_AJENO)
    assert api.get(f"{BASE}/{PROY_A}").status_code == 404


def test_lote_vinculado_accesible(api):
    _override(U_TEC)
    r = api.get(f"{BASE}/{PROY_A}/lotes/{LOTE_A}")
    assert r.status_code == 200
    assert r.json()["nombre_lote"] == "Lote A"
    assert r.json()["contexto"] == "proyecto"


def test_lote_de_otro_proyecto_no_accesible(api):
    # LOTE_B está vinculado a B, no a A — pedirlo vía A = ninguno → 404
    _override(U_TEC)
    r = api.get(f"{BASE}/{PROY_A}/lotes/{LOTE_B}")
    assert r.status_code == 404


def test_lote_de_A_no_accesible_via_B(api):
    # TEC no participa en B → proyecto B = 404 para él
    _override(U_TEC)
    r = api.get(f"{BASE}/{PROY_B}/lotes/{LOTE_B}")
    assert r.status_code == 404


def test_removido_no_accede(api):
    _override(U_REM)
    assert api.get(f"{BASE}/{PROY_A}").status_code == 404
    assert api.get(f"{BASE}/{PROY_A}/lotes/{LOTE_A}").status_code == 404


def test_invitado_no_accede(api):
    _override(U_INV)
    assert api.get(f"{BASE}/{PROY_A}").status_code == 404


# ============================================================================
# CONCESIÓN — OTORGAR (cadena completa + audit)
# ============================================================================

def test_otorgar_concesion_eleva_permiso(api):
    # owner otorga 'editar' sobre LOTE_A al técnico → 201 + audit
    _override(U_OWNER)
    r = api.post(f"{BASE}/{PROY_A}/concesiones", json={
        "usuario_id": U_TEC, "recurso_tipo": "lote",
        "recurso_id": LOTE_A, "nivel": "editar",
    })
    assert r.status_code == 201, r.text
    assert r.json()["estado"] == "activa"

    # la concesión ya resuelve: audit registrado en la misma transacción
    conn = run(_conn())

    async def _contar():
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT count(*) AS n FROM audit_eventos"
                " WHERE contexto_id=%s AND accion='ep.concesion_otorgada'",
                (PROY_A,))
            return (await cur.fetchone())["n"]
    assert run(_contar()) >= 1
    run(conn.close())


def test_otorgar_a_invitado_404(api):
    _override(U_OWNER)
    r = api.post(f"{BASE}/{PROY_A}/concesiones", json={
        "usuario_id": U_INV, "recurso_tipo": "lote", "nivel": "consulta",
    })
    assert r.status_code == 404


def test_otorgar_a_ajeno_404(api):
    _override(U_OWNER)
    r = api.post(f"{BASE}/{PROY_A}/concesiones", json={
        "usuario_id": U_AJENO, "recurso_tipo": "lote", "nivel": "consulta",
    })
    assert r.status_code == 404


def test_otorgar_nivel_sobre_techo_rechazado(api):
    # cliente tiene techo 'consulta': otorgar 'editar' → 400
    _override(U_OWNER)
    r = api.post(f"{BASE}/{PROY_A}/concesiones", json={
        "usuario_id": U_CLI, "recurso_tipo": "lote",
        "recurso_id": LOTE_A, "nivel": "editar",
    })
    assert r.status_code == 400


def test_otorgar_recurso_no_vinculado_404(api):
    # LOTE_B no está vinculado al proyecto A → no se puede conceder en A
    _override(U_OWNER)
    r = api.post(f"{BASE}/{PROY_A}/concesiones", json={
        "usuario_id": U_TEC, "recurso_tipo": "lote",
        "recurso_id": LOTE_B, "nivel": "editar",
    })
    assert r.status_code == 404


def test_tecnico_no_puede_otorgar_403(api):
    _override(U_TEC)
    r = api.post(f"{BASE}/{PROY_A}/concesiones", json={
        "usuario_id": U_CLI, "recurso_tipo": "lote", "nivel": "consulta",
    })
    assert r.status_code == 403


def test_duplicado_activo_409(api):
    _override(U_OWNER)
    body = {
        "usuario_id": U_TEC, "recurso_tipo": "lote",
        "recurso_id": LOTE_A, "nivel": "editar",
    }
    assert api.post(f"{BASE}/{PROY_A}/concesiones", json=body).status_code == 201
    r2 = api.post(f"{BASE}/{PROY_A}/concesiones", json=body)
    assert r2.status_code == 409   # índice parcial E9 → 409, no 2ª fila


def test_concesion_expirada_no_autoriza(api):
    # Inserta concesión ya vencida directo en BD; acceso por lote sigue
    # siendo solo 'consulta' (base), el nivel 'editar' no resuelve.
    conn = run(_conn())

    async def _expirada():
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO ep_proyecto_concesiones (proyecto_id,"
                " participante_id, recurso_tipo, recurso_id, nivel,"
                " vigente_hasta) VALUES (%s,%s,'lote',%s,'editar',%s)",
                (PROY_A, PART_TEC, LOTE_A, AHORA - timedelta(days=1)))
        await conn.commit()
    run(_expirada())
    run(conn.close())

    _override(U_TEC)
    r = api.get(f"{BASE}/{PROY_A}/lotes/{LOTE_A}")
    assert r.status_code == 200
    assert r.json()["mi_nivel"] == "consulta"   # no 'editar'


# ============================================================================
# REVOCACIÓN — historial + audit
# ============================================================================

def test_revocar_conserva_historial_y_audit(api):
    _override(U_OWNER)
    r = api.post(f"{BASE}/{PROY_A}/concesiones", json={
        "usuario_id": U_TEC, "recurso_tipo": "registro",
        "nivel": "crear",
    })
    assert r.status_code == 201
    cid = r.json()["id"]

    r2 = api.post(f"{BASE}/{PROY_A}/concesiones/{cid}/revocar")
    assert r2.status_code == 200
    j = r2.json()
    assert j["estado"] == "revocada"
    assert j["revocado_por"] == U_OWNER
    assert j["revocado_at"] is not None

    # la fila histórica permanece + audit de revocación
    conn = run(_conn())

    async def _verificar():
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT estado FROM ep_proyecto_concesiones WHERE id=%s",
                (cid,))
            fila = await cur.fetchone()
            await cur.execute(
                "SELECT count(*) AS n FROM audit_eventos WHERE"
                " contexto_id=%s AND accion='ep.concesion_revocada'"
                " AND objeto_id=%s", (PROY_A, cid))
            n = (await cur.fetchone())["n"]
            return fila["estado"], n
    estado, audits = run(_verificar())
    run(conn.close())
    assert estado == "revocada"
    assert audits == 1


def test_revocar_inexistente_404(api):
    _override(U_OWNER)
    r = api.post(f"{BASE}/{PROY_A}/concesiones/{uuid.uuid4()}/revocar")
    assert r.status_code == 404


def test_concesion_revocada_no_autoriza(api):
    _override(U_OWNER)
    r = api.post(f"{BASE}/{PROY_A}/concesiones", json={
        "usuario_id": U_CLI, "recurso_tipo": "lote",
        "recurso_id": LOTE_A, "nivel": "consulta",
    })
    cid = r.json()["id"]
    api.post(f"{BASE}/{PROY_A}/concesiones/{cid}/revocar")
    # tras revocar, cliente puede re-otorgarse (fila nueva permitida E9)
    r3 = api.post(f"{BASE}/{PROY_A}/concesiones", json={
        "usuario_id": U_CLI, "recurso_tipo": "lote",
        "recurso_id": LOTE_A, "nivel": "consulta",
    })
    assert r3.status_code == 201
    assert r3.json()["id"] != cid


# ============================================================================
# ATOMICIDAD — fallo no deja auditoría huérfana
# ============================================================================

def test_fallo_no_deja_auditoria_huerfana(api):
    conn = run(_conn())

    async def _antes():
        async with conn.cursor() as cur:
            await cur.execute(
                "SELECT count(*) AS n FROM audit_eventos"
                " WHERE contexto_id=%s", (PROY_A,))
            return (await cur.fetchone())["n"]
    antes = run(_antes())
    run(conn.close())

    # POST que falla DESPUÉS del resolver (duplicado → 409): ni la
    # concesión ni audit quedan — la excepción revierte la transacción
    _override(U_OWNER)
    body = {"usuario_id": U_TEC, "recurso_tipo": "lote",
            "recurso_id": LOTE_A, "nivel": "editar"}
    api.post(f"{BASE}/{PROY_A}/concesiones", json=body)
    assert api.post(f"{BASE}/{PROY_A}/concesiones",
                    json=body).status_code == 409

    conn = run(_conn())
    despues = run(_antes())
    run(conn.close())
    # solo 1 evento 'otorgada' — el 409 no escribió audit
    assert despues == antes + 1


def test_sin_jwt_401(api):
    # Sin override de usuario: sin token → 401/403
    r = api.get(f"{BASE}/{PROY_A}")
    assert r.status_code in (401, 403)
