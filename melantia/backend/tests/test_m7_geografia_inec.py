# backend/tests/test_m7_geografia_inec.py
"""Verificación de la migración m7 — unicidad de codigo_inec en
cantones y parroquias (catálogo geográfico DPA).

Tres niveles, igual que test_m6_dedup_concurrencia:
1. DDL — verificación estática del archivo de migración.
2. (no aplica — m7 no altera lógica de endpoints)
3. PostgreSQL real: m7 se aplica en un schema temporal aislado
   sobre tablas espejo y se comprueba la restricción.
"""
import os
import re
import uuid
from pathlib import Path

import psycopg
import pytest
from psycopg.errors import UniqueViolation

from conftest import pg_error_conexion, test_db_url

MIGRACION = (
    Path(__file__).resolve().parent.parent
    / "database" / "migraciones" / "m7_geografia_inec_unicidad.sql"
)
MIGRACION_SQL = MIGRACION.read_text(encoding="utf-8")
SQL_EJECUTABLE = "\n".join(
    linea for linea in MIGRACION_SQL.splitlines()
    if not linea.lstrip().startswith("--")
)


# ============================================================================
# 1. DDL — verificación estática de m7
# ============================================================================

def test_m7_indice_unique_cantones():
    sql = " ".join(SQL_EJECUTABLE.split())
    assert (
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_cantones_codigo_inec "
        "ON cantones (codigo_inec);"
    ) in sql


def test_m7_indice_unique_parroquias():
    sql = " ".join(SQL_EJECUTABLE.split())
    assert (
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_parroquias_codigo_inec "
        "ON parroquias (codigo_inec);"
    ) in sql


def test_m7_transaccional_y_aditiva():
    assert "BEGIN;" in SQL_EJECUTABLE
    assert "COMMIT;" in SQL_EJECUTABLE
    assert "CONCURRENTLY" not in SQL_EJECUTABLE
    for prohibido in ("DROP ", "DELETE ", "UPDATE ", "ALTER ", "TRUNCATE "):
        assert prohibido not in SQL_EJECUTABLE.upper()
    # Exactamente dos objetos nuevos.
    assert len(re.findall(r"CREATE\s", SQL_EJECUTABLE.upper())) == 2


# ============================================================================
# 2. POSTGRESQL REAL — m7 en schema temporal aislado
# ============================================================================

ESQUEMA = f"m7_prueba_{uuid.uuid4().hex[:10]}"

# Sin conexión en colección: el predicado solo mira la variable de
# entorno; la disponibilidad real se comprueba dentro del fixture.
pg = pytest.mark.skipif(
    not os.environ.get("MELANTIA_TEST_DATABASE_URL"),
    reason="MELANTIA_TEST_DATABASE_URL no configurada",
)


def _conn_sync():
    try:
        return psycopg.connect(test_db_url(), connect_timeout=3)
    except psycopg.OperationalError as e:
        pg_error_conexion(e)


@pytest.fixture(scope="module")
def esquema_m7():
    """Tablas espejo del catálogo geográfico (columnas relevantes con
    los mismos tipos que geografia.sql) + m7 aplicada desde el
    archivo real."""
    _conn_sync().close()                      # disponibilidad/aislamiento
    url = test_db_url()
    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute(f"CREATE SCHEMA {ESQUEMA}")
        conn.execute(f"SET search_path TO {ESQUEMA}")
        conn.execute(
            """
            CREATE TABLE provincias (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                codigo_inec VARCHAR(10) UNIQUE NOT NULL
            );
            CREATE TABLE cantones (
                id SERIAL PRIMARY KEY,
                provincia_id INT NOT NULL
                    REFERENCES provincias(id) ON DELETE CASCADE,
                nombre VARCHAR(100) NOT NULL,
                codigo_inec VARCHAR(10) NOT NULL
            );
            CREATE TABLE parroquias (
                id SERIAL PRIMARY KEY,
                canton_id INT NOT NULL
                    REFERENCES cantones(id) ON DELETE CASCADE,
                nombre VARCHAR(100) NOT NULL,
                codigo_inec VARCHAR(10) NOT NULL
            );
            INSERT INTO provincias (nombre, codigo_inec)
                VALUES ('Azuay', '01');
            INSERT INTO cantones (provincia_id, nombre, codigo_inec)
                VALUES (1, 'Cuenca', '0101');
            INSERT INTO parroquias (canton_id, nombre, codigo_inec)
                VALUES (1, 'Cuenca', '010150');
            """
        )
        conn.execute(MIGRACION_SQL)
    try:
        yield
    finally:
        with psycopg.connect(url, autocommit=True) as conn:
            conn.execute(f"DROP SCHEMA IF EXISTS {ESQUEMA} CASCADE")


@pg
def test_pg_indices_creados(esquema_m7):
    with psycopg.connect(test_db_url()) as conn:
        filas = conn.execute(
            "SELECT tablename, indexname, indexdef FROM pg_indexes"
            " WHERE schemaname=%s AND indexname LIKE 'uq_%%'"
            " ORDER BY indexname", (ESQUEMA,),
        ).fetchall()
    defs = {r[1]: r[2] for r in filas}
    assert "uq_cantones_codigo_inec" in defs
    assert "uq_parroquias_codigo_inec" in defs
    assert defs["uq_cantones_codigo_inec"].startswith(
        "CREATE UNIQUE INDEX uq_cantones_codigo_inec"
    )
    assert "(codigo_inec)" in defs["uq_cantones_codigo_inec"]
    assert "(codigo_inec)" in defs["uq_parroquias_codigo_inec"]


@pg
def test_pg_m7_idempotente(esquema_m7):
    with psycopg.connect(test_db_url(), autocommit=True) as conn:
        conn.execute(f"SET search_path TO {ESQUEMA}")
        conn.execute(MIGRACION_SQL)     # segunda aplicación: sin error


@pg
def test_pg_duplicado_canton_rechazado(esquema_m7):
    with psycopg.connect(test_db_url(), autocommit=True) as conn:
        conn.execute(f"SET search_path TO {ESQUEMA}")
        with pytest.raises(UniqueViolation):
            conn.execute(
                "INSERT INTO cantones (provincia_id, nombre,"
                " codigo_inec) VALUES (1, 'Duplicado', '0101')"
            )


@pg
def test_pg_duplicado_parroquia_rechazado(esquema_m7):
    with psycopg.connect(test_db_url(), autocommit=True) as conn:
        conn.execute(f"SET search_path TO {ESQUEMA}")
        with pytest.raises(UniqueViolation):
            conn.execute(
                "INSERT INTO parroquias (canton_id, nombre,"
                " codigo_inec) VALUES (1, 'Duplicado', '010150')"
            )


@pg
def test_pg_mismo_nombre_distinto_codigo_admitido(esquema_m7):
    """La unicidad es sobre el código, no sobre el nombre: dos
    divisiones homónimas con códigos distintos coexisten."""
    with psycopg.connect(test_db_url(), autocommit=True) as conn:
        conn.execute(f"SET search_path TO {ESQUEMA}")
        conn.execute(
            "INSERT INTO cantones (provincia_id, nombre, codigo_inec)"
            " VALUES (1, 'San Antonio', '0116'),"
            "        (1, 'San Antonio', '0117')"
        )


@pg
def test_pg_patron_seed_not_exists_sigue_funcionando(esquema_m7):
    """El patrón NOT EXISTS de los seeds convive con el índice:
    re-ejecutar el mismo insert no inserta ni falla."""
    with psycopg.connect(test_db_url(), autocommit=True) as conn:
        conn.execute(f"SET search_path TO {ESQUEMA}")
        cur = conn.execute(
            "INSERT INTO cantones (provincia_id, nombre, codigo_inec)"
            " SELECT id, 'Cuenca', '0101' FROM provincias"
            " WHERE codigo_inec = '01'"
            " AND NOT EXISTS (SELECT 1 FROM cantones"
            " WHERE codigo_inec = '0101') RETURNING id"
        )
        assert cur.fetchone() is None
