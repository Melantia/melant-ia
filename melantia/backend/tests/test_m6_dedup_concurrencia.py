# backend/tests/test_m6_dedup_concurrencia.py
"""Migración m6 — deduplicación concurrente de incentivos (FIX-01).

Tres niveles:
1. Estático: el archivo m6 declara exactamente el índice UNIQUE parcial
   aditivo esperado (convención test_sesiones/m4).
2. Endpoint + carrera simulada: dos peticiones concurrentes con el mismo
   hash superan ambas el SELECT fast-path; el índice (emulado) rechaza
   el segundo INSERT → 201 + 409 y un solo abono.
3. PostgreSQL real: m6 se aplica en un schema temporal aislado
   (tabla espejo de registros_campo, nunca la tabla real) y se verifica
   el índice, el bloqueo concurrente y la semántica de NULL. Se salta si
   PostgreSQL no está disponible. Usa exclusivamente
   MELANTIA_TEST_DATABASE_URL (conftest.test_db_url — validada,
   jamás la BD de la aplicación); sin ella, skip explícito.

Los duplicados secuenciales y el 409 por UniqueViolation a nivel de
endpoint ya están cubiertos en test_main_endpoints_seguridad.py.
"""
import asyncio
import os
import re
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
import psycopg
import pytest
from psycopg.errors import UniqueViolation

import main as main_module
from conftest import pg_error_conexion, test_db_url
from core.dependencies import get_current_user
from main import app

MIGRACION = (
    Path(__file__).resolve().parent.parent
    / "database" / "migraciones" / "m6_registros_campo_dedup_hash.sql"
)
MIGRACION_SQL = MIGRACION.read_text(encoding="utf-8")
SQL_EJECUTABLE = "\n".join(
    linea for linea in MIGRACION_SQL.splitlines()
    if not linea.lstrip().startswith("--")
)

CLASIFICAR = "/api/ia/clasificar-evidencia"
USER_A = str(uuid.uuid4())
USER_B = str(uuid.uuid4())


# ============================================================================
# 1. DDL — verificación estática de m6
# ============================================================================

def test_m6_indice_unique_parcial():
    sql = " ".join(SQL_EJECUTABLE.split())
    assert (
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_registros_campo_dedup "
        "ON registros_campo (usuario_id, hash_transaccion) "
        "WHERE hash_transaccion IS NOT NULL;"
    ) in sql


def test_m6_transaccional_y_aditiva():
    assert "BEGIN;" in SQL_EJECUTABLE
    assert "COMMIT;" in SQL_EJECUTABLE
    assert "CONCURRENTLY" not in SQL_EJECUTABLE
    for prohibido in ("DROP ", "DELETE ", "UPDATE ", "ALTER ", "TRUNCATE "):
        assert prohibido not in SQL_EJECUTABLE.upper()
    # Un único objeto nuevo.
    assert len(re.findall(r"CREATE\s", SQL_EJECUTABLE.upper())) == 1


# ============================================================================
# 2. ENDPOINT — carrera de dos peticiones con índice UNIQUE emulado
# ============================================================================

class _AlmacenConIndice:
    """Estado compartido entre conexiones: emula registros_campo con
    uq_registros_campo_dedup y el saldo de usuarios_suscripciones.
    Solo lo confirmado (commit) es visible para otras transacciones."""

    def __init__(self, sincronizar_selects=0):
        self.registros = set()         # (usuario, hash) confirmados
        self.pendientes = set()        # (usuario, hash) sin confirmar
        self.abonos = 0                # abonos confirmados
        self._esperando = sincronizar_selects
        self._barrera = asyncio.Event()
        if not sincronizar_selects:
            self._barrera.set()

    async def tras_select_dedup(self):
        # Fuerza la carrera TOCTOU: nadie inserta hasta que todas las
        # peticiones hayan pasado el SELECT fast-path.
        self._esperando -= 1
        if self._esperando <= 0:
            self._barrera.set()
        await self._barrera.wait()


class _Cursor:
    def __init__(self, filas):
        self._filas = filas

    async def fetchone(self):
        return self._filas[0] if self._filas else None


class _ConexionCompartida:
    def __init__(self, almacen):
        self.a = almacen
        self.claves = set()
        self.abonos = 0

    async def execute(self, sql, params=None):
        s = " ".join(sql.split()).upper()
        if s.startswith("SELECT ID FROM REGISTROS_CAMPO"):
            existe = tuple(params) in self.a.registros
            await self.a.tras_select_dedup()
            return _Cursor([{"id": "x"}] if existe else [])
        if s.startswith("INSERT INTO REGISTROS_CAMPO"):
            usuario, hash_ = params[0], params[-1]
            if hash_ is not None:
                clave = (usuario, hash_)
                if clave in self.a.registros or clave in self.a.pendientes:
                    raise UniqueViolation("uq_registros_campo_dedup")
                self.a.pendientes.add(clave)
                self.claves.add(clave)
            return _Cursor([{"id": str(uuid.uuid4())}])
        if "USUARIOS_SUSCRIPCIONES" in s and s.startswith(("INSERT", "UPDATE")):
            self.abonos += 1
        return _Cursor([])

    async def commit(self):
        self.a.registros |= self.claves
        self.a.pendientes -= self.claves
        self.a.abonos += self.abonos
        self.claves, self.abonos = set(), 0

    async def rollback(self):
        self.a.pendientes -= self.claves
        self.claves, self.abonos = set(), 0


@pytest.fixture
def almacen(monkeypatch):
    def _instalar(**kw):
        a = _AlmacenConIndice(**kw)

        @asynccontextmanager
        async def _ctx():
            conn = _ConexionCompartida(a)
            try:
                yield conn, None
            except Exception:
                await conn.rollback()
                raise

        monkeypatch.setattr(main_module, "get_db_connection", _ctx)
        app.dependency_overrides[get_current_user] = lambda: USER_A
        return a
    yield _instalar
    app.dependency_overrides.clear()


def _payload(hash_="hash-m6-carrera"):
    p = {
        "tipo_registro": "plaga",
        "especie_afectada": "Maíz",
        "diagnostico_usuario": "Posible cogollero",
        "foto_url": "storage/evidencias/foto.jpg",
    }
    if hash_ is not None:
        p["hash_transaccion"] = hash_
    return p


async def _peticiones_concurrentes(n, payload):
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(
        transport=transport, base_url="http://test"
    ) as c:
        return await asyncio.gather(
            *(c.post(CLASIFICAR, json=payload) for _ in range(n))
        )


def test_endpoint_carrera_mismo_hash_un_solo_abono(almacen):
    a = almacen(sincronizar_selects=2)
    rs = asyncio.run(_peticiones_concurrentes(2, _payload()))
    codigos = sorted(r.status_code for r in rs)
    assert codigos == [201, 409]
    assert a.abonos == 1
    assert a.registros == {(USER_A, "hash-m6-carrera")}
    assert a.pendientes == set()
    r409 = next(r for r in rs if r.status_code == 409)
    assert r409.json()["detail"] == "Esta evidencia ya fue procesada."
    assert "uq_registros_campo_dedup" not in r409.text


def test_endpoint_carrera_n_peticiones_un_solo_abono(almacen):
    a = almacen(sincronizar_selects=5)
    rs = asyncio.run(_peticiones_concurrentes(5, _payload()))
    assert sorted(r.status_code for r in rs) == [201] + [409] * 4
    assert a.abonos == 1


def test_endpoint_hash_null_concurrente_abona_cada_registro(almacen):
    # Sin clave de dedup no hay protección posible: comportamiento
    # previo conservado (cada registro inserta y abona).
    a = almacen()
    rs = asyncio.run(_peticiones_concurrentes(3, _payload(hash_=None)))
    assert [r.status_code for r in rs] == [201, 201, 201]
    assert a.abonos == 3


# ============================================================================
# 3. POSTGRESQL REAL — m6 en schema temporal aislado
# ============================================================================

ESQUEMA = f"m6_prueba_{uuid.uuid4().hex[:10]}"

# Sin conexión en colección: el predicado solo mira la variable de
# entorno; la disponibilidad real se comprueba dentro del fixture.
pg = pytest.mark.skipif(
    not os.environ.get("MELANTIA_TEST_DATABASE_URL"),
    reason="MELANTIA_TEST_DATABASE_URL no configurada",
)


async def _aconn():
    try:
        conn = await psycopg.AsyncConnection.connect(test_db_url())
    except psycopg.OperationalError as e:
        pg_error_conexion(e)   # clasifica: solo conectividad real → skip
    await conn.execute(f"SET search_path TO {ESQUEMA}")
    await conn.commit()
    return conn


def _conn_sync():
    try:
        return psycopg.connect(test_db_url(), connect_timeout=3)
    except psycopg.OperationalError as e:
        pg_error_conexion(e)


@pytest.fixture(scope="module")
def esquema_m6():
    """Tabla espejo de registros_campo (columnas relevantes con los
    mismos tipos) + m6 aplicada desde el archivo real."""
    _conn_sync().close()                      # disponibilidad/aislamiento
    url = test_db_url()
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute(f"CREATE SCHEMA {ESQUEMA}")
        conn.execute(f"SET search_path TO {ESQUEMA}")
        conn.execute(
            """
            CREATE TABLE registros_campo (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                usuario_id UUID,
                tipo_registro VARCHAR(50) NOT NULL,
                hash_transaccion VARCHAR(64)
            )
            """
        )
        conn.execute(MIGRACION_SQL)
    try:
        yield
    finally:
        with psycopg.connect(url, autocommit=True) as conn:
            conn.execute(f"DROP SCHEMA IF EXISTS {ESQUEMA} CASCADE")


INSERT = (
    "INSERT INTO registros_campo (usuario_id, tipo_registro,"
    " hash_transaccion) VALUES (%s, 'plaga', %s)"
)


async def _contar(usuario, hash_):
    conn = await _aconn()
    try:
        if hash_ is None:
            cur = await conn.execute(
                "SELECT count(*) FROM registros_campo WHERE usuario_id=%s"
                " AND hash_transaccion IS NULL", (usuario,))
        else:
            cur = await conn.execute(
                "SELECT count(*) FROM registros_campo WHERE usuario_id=%s"
                " AND hash_transaccion=%s", (usuario, hash_))
        return (await cur.fetchone())[0]
    finally:
        await conn.close()


@pg
def test_pg_indice_creado(esquema_m6):
    with psycopg.connect(test_db_url()) as conn:
        fila = conn.execute(
            "SELECT indexdef FROM pg_indexes WHERE schemaname=%s"
            " AND tablename='registros_campo'"
            " AND indexname='uq_registros_campo_dedup'", (ESQUEMA,),
        ).fetchone()
    assert fila is not None
    d = fila[0]
    assert d.startswith("CREATE UNIQUE INDEX uq_registros_campo_dedup")
    assert "(usuario_id, hash_transaccion)" in d
    assert "WHERE (hash_transaccion IS NOT NULL)" in d


@pg
def test_pg_m6_idempotente(esquema_m6):
    with psycopg.connect(test_db_url(), autocommit=True) as conn:
        conn.execute(f"SET search_path TO {ESQUEMA}")
        conn.execute(MIGRACION_SQL)


@pg
def test_pg_duplicado_secuencial_rechazado(esquema_m6):
    async def _caso():
        u = str(uuid.uuid4())
        conn = await _aconn()
        try:
            await conn.execute(INSERT, (u, "h-seq"))
            await conn.commit()
            with pytest.raises(UniqueViolation):
                await conn.execute(INSERT, (u, "h-seq"))
            await conn.rollback()
        finally:
            await conn.close()
        assert await _contar(u, "h-seq") == 1
    asyncio.run(_caso())


@pg
def test_pg_concurrente_segundo_bloquea_y_falla_al_confirmar(esquema_m6):
    async def _caso():
        u = str(uuid.uuid4())
        c1, c2 = await _aconn(), await _aconn()
        try:
            await c1.execute(INSERT, (u, "h-conc"))       # sin commit
            t2 = asyncio.create_task(c2.execute(INSERT, (u, "h-conc")))
            await asyncio.sleep(0.5)
            assert not t2.done(), "el 2.º INSERT debe esperar al 1.º"
            await c1.commit()
            with pytest.raises(UniqueViolation):
                await t2
            await c2.rollback()
        finally:
            await c1.close()
            await c2.close()
        assert await _contar(u, "h-conc") == 1
    asyncio.run(_caso())


@pg
def test_pg_concurrente_rollback_del_primero_libera_la_clave(esquema_m6):
    # Fallo de persistencia en la 1.ª transacción: el reintento entra.
    async def _caso():
        u = str(uuid.uuid4())
        c1, c2 = await _aconn(), await _aconn()
        try:
            await c1.execute(INSERT, (u, "h-rb"))
            t2 = asyncio.create_task(c2.execute(INSERT, (u, "h-rb")))
            await asyncio.sleep(0.5)
            assert not t2.done()
            await c1.rollback()
            await t2
            await c2.commit()
        finally:
            await c1.close()
            await c2.close()
        assert await _contar(u, "h-rb") == 1
    asyncio.run(_caso())


@pg
def test_pg_n_transacciones_concurrentes_una_sola_fila(esquema_m6):
    async def _intento(u):
        conn = await _aconn()
        try:
            await conn.execute(INSERT, (u, "h-n"))
            await conn.commit()
            return "ok"
        except UniqueViolation:
            await conn.rollback()
            return "dup"
        finally:
            await conn.close()

    async def _caso():
        u = str(uuid.uuid4())
        rs = await asyncio.gather(*(_intento(u) for _ in range(8)))
        assert sorted(rs) == ["dup"] * 7 + ["ok"]
        assert await _contar(u, "h-n") == 1
    asyncio.run(_caso())


@pg
def test_pg_hash_null_no_deduplica(esquema_m6):
    async def _caso():
        u = str(uuid.uuid4())
        conn = await _aconn()
        try:
            for _ in range(3):
                await conn.execute(INSERT, (u, None))
            await conn.commit()
        finally:
            await conn.close()
        assert await _contar(u, None) == 3
    asyncio.run(_caso())


@pg
def test_pg_mismo_hash_distinto_usuario_permitido(esquema_m6):
    async def _caso():
        conn = await _aconn()
        try:
            await conn.execute(INSERT, (USER_A, "h-compartido"))
            await conn.execute(INSERT, (USER_B, "h-compartido"))
            await conn.commit()
        finally:
            await conn.close()
        assert await _contar(USER_A, "h-compartido") == 1
        assert await _contar(USER_B, "h-compartido") == 1
    asyncio.run(_caso())
