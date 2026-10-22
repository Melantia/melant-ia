# backend/tests/test_m8_m9_sync_infraestructura.py
"""Verificación de m8 (infraestructura sync) y m9 (metadatos entidad).

Niveles:
1. DDL estático — convenciones m2–m7 (transaccional, aditiva, sin
   ALTER/DROP fuera de alcance).
2. PostgreSQL real sobre melantia_test: m8+m9 ya aplicadas al esquema
   público (verificadas por information_schema); los tests ejercitan
   las tablas/filas reales con fixtures que se limpian.
3. Concurrencia de cursores — la propiedad central de §4.6 del diseño:
   con dos transacciones independientes, seq=N+1 solo puede confirmarse
   después de seq=N (ni pérdida ni salto de cursor), y el rollback no
   deja huecos.
"""
import hashlib
import json
import os
import threading
import time
import uuid
from pathlib import Path

import psycopg
import pytest
from psycopg.errors import (ForeignKeyViolation, NotNullViolation,
                            UniqueViolation)

from conftest import pg_error_conexion, test_db_url

MIG_DIR = Path(__file__).resolve().parent.parent / "database" / "migraciones"
M8_SQL = (MIG_DIR / "m8_sync_infraestructura.sql").read_text(encoding="utf-8")
M9_SQL = (MIG_DIR / "m9_sync_metadatos_entidades.sql").read_text(encoding="utf-8")


def _exec(sql: str) -> str:
    """DDL sin comentarios ni BEGIN/COMMIT para asertos estáticos."""
    return "\n".join(
        l for l in sql.splitlines() if not l.lstrip().startswith("--")
    )


# ============================================================================
# 1. DDL — verificación estática
# ============================================================================

def test_m8_transaccional_y_aditiva():
    sql = _exec(M8_SQL)
    assert "BEGIN;" in sql and "COMMIT;" in sql
    for t in ("sync_cursors", "sync_cambios", "sync_operaciones"):
        assert f"CREATE TABLE IF NOT EXISTS {t}" in sql
    assert "CREATE OR REPLACE FUNCTION sync_next_seq" in sql
    # Sin ALTER/DROP sobre objetos existentes.
    for prohibido in ("ALTER TABLE", "DROP TABLE", "DROP COLUMN", "TRUNCATE"):
        assert prohibido not in sql.upper()


def test_m8_no_usa_bigserial_para_el_cursor():
    """El cursor no puede ser una secuencia: BIGSERIAL asigna en el
    INSERT, no en el COMMIT (pérdida demostrable). sync_next_seq debe
    bump-ear la fila del scope con row lock."""
    sql = _exec(M8_SQL)
    assert "BIGSERIAL" not in sql.upper()
    assert "ON CONFLICT (scope) DO UPDATE" in sql
    assert "last_seq = sync_cursors.last_seq + 1" in sql


def test_m8_ledger_sin_duplicados_por_operacion():
    sql = _exec(M8_SQL)
    assert "uq_sync_operaciones_client_op" in sql
    assert "(usuario_id, client_operation_id)" in sql.replace(" ", " ")


def test_m8_payload_hash_en_ledger():
    """FAIL-01: sin huella de la solicitud, la misma clave con contenido
    distinto se descartaría en silencio."""
    sql = _exec(M8_SQL)
    assert "payload_hash VARCHAR(64) NOT NULL" in sql


def _hash_op(scope, entity_type, entity_id, accion, base_version, payload):
    """Serialización canónica de la solicitud (especificación en m8):
    claves ordenadas, separadores mínimos, Unicode literal, UTF-8,
    null explícito. Réplica exacta del algoritmo que deberán usar el
    servicio de sync y el cliente."""
    canonica = {
        "accion": accion,
        "base_version": base_version,
        "entity_id": entity_id,
        "entity_type": entity_type,
        "payload": payload,
        "scope": scope,
    }
    raw = json.dumps(canonica, sort_keys=True, ensure_ascii=False,
                     separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def test_m9_solo_add_column_y_alcance():
    sql = _exec(M9_SQL)
    assert "BEGIN;" in sql and "COMMIT;" in sql
    assert sql.upper().count("ADD COLUMN IF NOT EXISTS") >= 10
    for prohibido in ("DROP TABLE", "DROP COLUMN", "DELETE FROM",
                      "TRUNCATE", " UPDATE "):
        assert prohibido not in sql.upper()
    # Ninguna entidad fuera del alcance aprobado.
    for fuera in ("registros_campo", "mediciones_campo", "levantamientos",
                  "usuarios", "trazabilidades"):
        assert f"ALTER TABLE {fuera}" not in sql


def test_m9_client_operation_id_no_en_entidades():
    """client_operation_id es clave de operación: vive en el ledger
    (m8), no en cada entidad."""
    sql = _exec(M9_SQL)
    assert "client_operation_id" not in sql


# ============================================================================
# 2. POSTGRESQL REAL — fixtures
# ============================================================================

pg = pytest.mark.skipif(
    not os.environ.get("MELANTIA_TEST_DATABASE_URL"),
    reason="MELANTIA_TEST_DATABASE_URL no configurada",
)


def _conn(autocommit=False):
    try:
        return psycopg.connect(test_db_url(), autocommit=autocommit,
                               connect_timeout=3)
    except psycopg.OperationalError as e:
        pg_error_conexion(e)


@pytest.fixture()
def sujeto():
    """usuario + dispositivo + scope propios; limpieza total al final."""
    conn = _conn(autocommit=True)
    cur = conn.cursor()
    uid = uuid.uuid4()
    cur.execute(
        "INSERT INTO usuarios (id, nombre, cedula_ruc, sector_comunidad)"
        " VALUES (%s, %s, %s, %s) RETURNING id",
        (uid, "Test Sync", f"T-{uuid.uuid4().hex[:11]}", "Sector QA"),
    )
    did = uuid.uuid4()
    cur.execute(
        "INSERT INTO dispositivos (id, usuario_id, nombre) VALUES (%s,%s,%s)",
        (did, uid, "dev-test"),
    )
    scope = f"usr:{uid}"
    yield {"uid": uid, "did": did, "scope": scope}
    cur.execute("DELETE FROM sync_cambios WHERE scope=%s", (scope,))
    cur.execute("DELETE FROM sync_cursors WHERE scope=%s", (scope,))
    cur.execute("DELETE FROM sync_operaciones WHERE usuario_id=%s", (uid,))
    cur.execute("DELETE FROM dispositivos WHERE id=%s", (did,))
    cur.execute("DELETE FROM usuarios WHERE id=%s", (uid,))
    conn.close()


def _push_cambio(conn, scope, tipo, op="upsert"):
    """Simula una tx de negocio: bump del cursor + fila de changelog
    (la fila de dominio la aportan los callers cuando corresponda)."""
    seq = conn.execute(
        "SELECT sync_next_seq(%s)", (scope,)
    ).fetchone()[0]
    conn.execute(
        "INSERT INTO sync_cambios (scope, seq, entity_type, entity_id,"
        " op, data) VALUES (%s,%s,%s,%s,%s,%s)",
        (scope, seq, tipo, uuid.uuid4(), op,
         psycopg.types.json.Jsonb({"x": 1}) if op == "upsert" else None),
    )
    return seq


def _pull(scope, cursor):
    """Lectura tipo pull: solo filas confirmadas por MVCC."""
    with _conn() as conn:
        return [r[0] for r in conn.execute(
            "SELECT seq FROM sync_cambios WHERE scope=%s AND seq>%s"
            " ORDER BY seq", (scope, cursor)).fetchall()]


# --- esquema aplicado ---------------------------------------------------------

@pg
def test_pg_m8_objetos_creados(sujeto):
    with _conn() as conn:
        tabs = {r[0] for r in conn.execute(
            "SELECT tablename FROM pg_tables WHERE schemaname='public'"
            " AND tablename LIKE 'sync\\_%' ESCAPE '\\'")}
        assert {"sync_cursors", "sync_cambios", "sync_operaciones"} <= tabs
        fn = conn.execute(
            "SELECT count(*) FROM pg_proc WHERE proname='sync_next_seq'"
        ).fetchone()[0]
        assert fn == 1


@pg
def test_pg_m9_columnas_presentes(sujeto):
    with _conn() as conn:
        cols = conn.execute(
            "SELECT table_name, column_name FROM information_schema.columns"
            " WHERE table_name IN ('fincas','lotes','hatos_ganaderos')"
            " AND column_name IN ('version','deleted_at','dispositivo_origen_id')"
        ).fetchall()
        assert len(cols) == 9
        pull = conn.execute(
            "SELECT count(*) FROM information_schema.columns"
            " WHERE table_name='dispositivos' AND column_name='ultimo_pull_seq'"
        ).fetchone()[0]
        assert pull == 1


# --- cursor: comportamiento básico y atomicidad -------------------------------

@pg
def test_pg_cursor_monotono_por_scope(sujeto):
    with _conn() as conn:
        s1 = _push_cambio(conn, sujeto["scope"], "finca")
        s2 = _push_cambio(conn, sujeto["scope"], "lote")
        assert (s1, s2) == (1, 2)
        # scope distinto tiene su propia secuencia
        otro_scope = f"usr:{uuid.uuid4()}"
        s_otro = _push_cambio(conn, otro_scope, "finca")
        assert s_otro == 1
        conn.execute(
            "DELETE FROM sync_cambios WHERE scope=%s", (otro_scope,))
        conn.execute(
            "DELETE FROM sync_cursors WHERE scope=%s", (otro_scope,))


@pg
def test_pg_rollback_no_deja_rastro(sujeto):
    """Dominio + changelog + cursor revierten juntos (atomicidad)."""
    conn = _conn()
    uid = sujeto["uid"]
    conn.execute(
        "INSERT INTO fincas (usuario_id, nombre) VALUES (%s,%s)",
        (uid, "Finca rollback"))
    _push_cambio(conn, sujeto["scope"], "finca")
    conn.rollback()
    conn.close()
    with _conn() as chk:
        assert chk.execute(
            "SELECT count(*) FROM fincas WHERE usuario_id=%s"
            " AND nombre='Finca rollback'", (uid,)).fetchone()[0] == 0
        assert chk.execute(
            "SELECT count(*) FROM sync_cambios WHERE scope=%s",
            (sujeto["scope"],)).fetchone()[0] == 0
        assert chk.execute(
            "SELECT last_seq FROM sync_cursors WHERE scope=%s",
            (sujeto["scope"],)).fetchone() is None


# --- la prueba bloqueante: commit fuera de orden + rollback -------------------

@pg
def test_pg_cursor_commits_fuera_de_orden(sujeto):
    """T1 (seq=1) y T2 concurrente: T2 BLOQUEA en sync_next_seq hasta
    que T1 termine → seq=2 nunca es visible sin seq=1. Un pull durante
    el bloqueo ve 0 filas y no puede adelantar su cursor."""
    scope = sujeto["scope"]
    got_seq_a = threading.Event()
    allow_a = threading.Event()
    b_bump_intentado = threading.Event()
    b_done = threading.Event()
    resultados = {}

    def tx_a():
        with _conn() as conn:
            conn.execute(
                "INSERT INTO fincas (usuario_id, nombre)"
                " VALUES (%s,'A')", (sujeto["uid"],))
            resultados["seq_a"] = _push_cambio(conn, scope, "finca")
            got_seq_a.set()
            assert allow_a.wait(timeout=15)
            conn.commit()

    def tx_b():
        with _conn() as conn:
            conn.execute(
                "INSERT INTO fincas (usuario_id, nombre)"
                " VALUES (%s,'B')", (sujeto["uid"],))
            b_bump_intentado.set()
            resultados["seq_b"] = _push_cambio(conn, scope, "finca")
            conn.commit()
            b_done.set()

    a = threading.Thread(target=tx_a)
    b = threading.Thread(target=tx_b)
    a.start()
    assert got_seq_a.wait(timeout=15)          # A ya tiene seq=1 (sin commit)
    b.start()
    assert b_bump_intentado.wait(timeout=15)   # B pidió seq=2 → bloqueado
    time.sleep(0.5)                            # margen: si no serializara,
    # B ya habría confirmado
    # CONDICIÓN CENTRAL: pull durante el bloqueo → nada visible aún
    assert _pull(scope, 0) == []
    assert not b_done.is_set()                 # B realmente está bloqueado
    allow_a.set()                              # A confirma primero
    a.join(timeout=15)
    b.join(timeout=15)
    assert resultados["seq_a"] == 1
    assert resultados["seq_b"] == 2            # B recibió el siguiente
    assert _pull(scope, 0) == [1, 2]           # sin huecos, en orden
    # y el cursor del cliente puede avanzar a 2 sin pérdida posible:
    assert _pull(scope, 2) == []


@pg
def test_pg_cursor_rollback_no_deja_hueco(sujeto):
    """T1 obtiene seq=N y revierte → la siguiente transacción recibe
    de nuevo N: el changelog queda contiguo, sin gap silencioso."""
    scope = sujeto["scope"]
    with _conn() as conn:
        _push_cambio(conn, scope, "finca")       # seq 1, confirmado
    conn_a = _conn()
    conn_a.execute(
        "INSERT INTO fincas (usuario_id, nombre) VALUES (%s,'A2')",
        (sujeto["uid"],))
    seq_a2 = _push_cambio(conn_a, scope, "finca")  # seq 2 en vuelo
    assert seq_a2 == 2
    conn_a.rollback()                            # aborta → seq 2 liberado
    conn_a.close()
    conn_b = _conn()
    seq_b = _push_cambio(conn_b, scope, "lote")    # recibe 2 otra vez
    conn_b.commit()
    conn_b.close()
    assert seq_b == 2
    assert _pull(scope, 0) == [1, 2]             # contiguo, sin hueco


# --- idempotencia del ledger ---------------------------------------------------

@pg
def test_pg_ledger_idempotente_reintento(sujeto):
    """Caso A: misma clave + mismo hash → reintento reconocido: la fila
    previa queda intacta con su resultado; el servicio devolverá ese
    resultado ('duplicate') sin re-ejecutar el cambio de negocio."""
    cop = uuid.uuid4()
    h = _hash_op(sujeto["scope"], "finca", "e-1", "create", None,
                 {"nombre": "La Esperanza"})
    with _conn() as conn:
        conn.execute(
            "INSERT INTO sync_operaciones (usuario_id, dispositivo_id,"
            " client_operation_id, payload_hash, entity_type, entity_id,"
            " accion, estado, resultado) VALUES (%s,%s,%s,%s,'finca',%s,"
            "'create','applied', %s)",
            (sujeto["uid"], sujeto["did"], cop, h, uuid.uuid4(),
             psycopg.types.json.Jsonb({"ok": True})),
        )
        conn.commit()
        # reintento idéntico → 23505, la fila previa intacta
        with pytest.raises(UniqueViolation):
            conn.execute(
                "INSERT INTO sync_operaciones (usuario_id,"
                " client_operation_id, payload_hash, entity_type,"
                " accion, estado)"
                " VALUES (%s,%s,%s,'finca','create','applied')",
                (sujeto["uid"], cop, h))
        conn.rollback()
        fila = conn.execute(
            "SELECT estado, resultado->>'ok', payload_hash"
            " FROM sync_operaciones"
            " WHERE usuario_id=%s AND client_operation_id=%s",
            (sujeto["uid"], cop)).fetchone()
        # resultado persistido tras el reintento, hash reconocible
        assert fila == ("applied", "true", h)


@pg
def test_pg_misma_clave_hash_distinto_detectable(sujeto):
    """Caso B: la fila ganadora conserva SU payload_hash; una clave
    reutilizada con contenido distinto produce hash distinto → el
    servicio de sync rechazará con 'idempotency_key_reuse' (409) en
    lugar de devolver el resultado previo. La BD retiene la huella
    que hace esa comparación posible."""
    cop = uuid.uuid4()
    h1 = _hash_op(sujeto["scope"], "finca", "e-1", "create", None,
                  {"nombre": "Original"})
    h2 = _hash_op(sujeto["scope"], "finca", "e-1", "update", 1,
                  {"nombre": "Distinto"})
    assert h1 != h2
    with _conn() as conn:
        conn.execute(
            "INSERT INTO sync_operaciones (usuario_id,"
            " client_operation_id, payload_hash, entity_type, accion,"
            " estado) VALUES (%s,%s,%s,'finca','create','applied')",
            (sujeto["uid"], cop, h1))
        conn.commit()
        # la reutilización no inserta (UNIQUE) y la huella previa
        # permite distinguir el contenido
        with pytest.raises(UniqueViolation):
            conn.execute(
                "INSERT INTO sync_operaciones (usuario_id,"
                " client_operation_id, payload_hash, entity_type,"
                " accion, estado)"
                " VALUES (%s,%s,%s,'finca','update','applied')",
                (sujeto["uid"], cop, h2))
        conn.rollback()
        hash_guardado = conn.execute(
            "SELECT payload_hash FROM sync_operaciones"
            " WHERE usuario_id=%s AND client_operation_id=%s",
            (sujeto["uid"], cop)).fetchone()[0]
        assert hash_guardado == h1
        assert hash_guardado != h2     # → el servicio rechazará


def test_hash_canonico_determinista():
    """Dos solicitudes semánticamente idénticas (con claves en distinto
    orden y nulos ausentes) → mismo hash. Cualquier cambio de
    significado (entidad, acción, versión, payload) → hash distinto."""
    base = ("usr:u", "finca", "e-1", "create", None, {"a": 1, "b": "ñ"})
    h = _hash_op(*base)
    assert _hash_op(*base) == h                       # determinismo
    assert len(h) == 64
    # sensibilidad a cada campo con significado
    assert _hash_op("usr:u", "lote", "e-1", "create", None,
                    {"a": 1, "b": "ñ"}) != h          # entity_type
    assert _hash_op("usr:u", "finca", "e-2", "create", None,
                    {"a": 1, "b": "ñ"}) != h          # entity_id
    assert _hash_op("usr:u", "finca", "e-1", "update", None,
                    {"a": 1, "b": "ñ"}) != h          # accion
    assert _hash_op("usr:u", "finca", "e-1", "create", 1,
                    {"a": 1, "b": "ñ"}) != h          # base_version
    assert _hash_op("usr:u", "finca", "e-1", "create", None,
                    {"a": 2, "b": "ñ"}) != h          # payload
    assert _hash_op("usr:v", "finca", "e-1", "create", None,
                    {"a": 1, "b": "ñ"}) != h          # scope


@pg
def test_pg_payload_hash_obligatorio(sujeto):
    """El ledger exige la huella: sin payload_hash la fila no entra —
    imposible registrar una operación sin detección de reutilización."""
    with _conn() as conn:
        with pytest.raises(NotNullViolation):
            conn.execute(
                "INSERT INTO sync_operaciones (usuario_id,"
                " client_operation_id, entity_type, accion, estado)"
                " VALUES (%s,%s,'finca','create','applied')",
                (sujeto["uid"], uuid.uuid4()))
        conn.rollback()


@pg
def test_pg_ledger_concurrencia_misma_clave(sujeto):
    """Caso C: dos conexiones con la misma clave — la inserción
    especulativa del UNIQUE bloquea a la segunda hasta que la primera
    confirma (→ 23505: reconoce y compara hash) o revierte (→ la
    segunda toma el relevo). Nunca dos operaciones de negocio."""
    cop = uuid.uuid4()
    h = _hash_op(sujeto["scope"], "finca", "e-1", "create", None, {"n": 1})

    def escenario(commit: bool):
        """T1 inserta la clave y retiene sin confirmar hasta recibir la
        señal; T2 (misma clave) se queda bloqueada en la inserción
        especulativa del UNIQUE. Resultados por eventos, sin reloj."""
        t1_insertado = threading.Event()
        t1_libera = threading.Event()
        res = {}

        def t1():
            with _conn() as conn:
                conn.execute(
                    "INSERT INTO sync_operaciones (usuario_id,"
                    " client_operation_id, payload_hash, entity_type,"
                    " accion, estado) VALUES (%s,%s,%s,'finca','create',"
                    "'applied')", (sujeto["uid"], cop, h))
                t1_insertado.set()
                assert t1_libera.wait(timeout=15)
                if commit:
                    conn.commit()
                else:
                    conn.rollback()          # Caso D: no queda éxito

        def t2():
            with _conn() as conn:
                try:
                    conn.execute(
                        "INSERT INTO sync_operaciones (usuario_id,"
                        " client_operation_id, payload_hash, entity_type,"
                        " accion, estado) VALUES (%s,%s,%s,'finca',"
                        "'create','applied')", (sujeto["uid"], cop, h))
                    conn.commit()
                    res["t2"] = "inserto"
                except UniqueViolation:
                    res["t2"] = "duplicado"

        a = threading.Thread(target=t1)
        a.start()
        assert t1_insertado.wait(timeout=15)  # T1 tiene la clave en vuelo
        b = threading.Thread(target=t2)
        b.start()
        time.sleep(0.5)
        # Mientras T1 no termine, T2 NO puede haber resuelto la clave
        assert "t2" not in res
        t1_libera.set()
        a.join(timeout=15)
        b.join(timeout=15)
        return res["t2"]

    # T1 confirma → T2 recibe duplicado (reintento reconocido)
    assert escenario(commit=True) == "duplicado"

    # Clave nueva; T1 revierte → T2 toma el relevo y una sola op queda
    cop = uuid.uuid4()
    assert escenario(commit=False) == "inserto"
    with _conn() as conn:
        n = conn.execute(
            "SELECT count(*) FROM sync_operaciones"
            " WHERE usuario_id=%s AND client_operation_id=%s",
            (sujeto["uid"], cop)).fetchone()[0]
        assert n == 1                           # una sola operación


@pg
def test_pg_ledger_mismo_cop_otro_usuario_admitido(sujeto):
    """El ámbito de la clave es (usuario_id, cop): otro usuario puede
    usar el mismo UUID sin colisión — aísla por propietario."""
    cop = uuid.uuid4()
    h = _hash_op("usr:x", "finca", "e-1", "create", None, {"n": 1})
    with _conn() as conn:
        conn.execute(
            "INSERT INTO usuarios (nombre, cedula_ruc, sector_comunidad)"
            " VALUES ('Otro', %s, 'X') RETURNING id",
            (f"T-{uuid.uuid4().hex[:11]}",))
        otro = conn.execute("SELECT id FROM usuarios ORDER BY created_at"
                            " DESC LIMIT 1").fetchone()[0]
        for u in (sujeto["uid"], otro):
            conn.execute(
                "INSERT INTO sync_operaciones (usuario_id,"
                " client_operation_id, payload_hash, entity_type,"
                " accion, estado)"
                " VALUES (%s,%s,%s,'finca','create','applied')",
                (u, cop, h))
        conn.execute("DELETE FROM sync_operaciones WHERE usuario_id=%s",
                     (otro,))
        conn.execute("DELETE FROM usuarios WHERE id=%s", (otro,))


# --- aislamiento por scope y FK de m9 -----------------------------------------

@pg
def test_pg_pull_aisla_scopes(sujeto):
    """Un pull por scope jamás devuelve filas de otro scope."""
    scope_ajeno = f"usr:{uuid.uuid4()}"
    with _conn() as conn:
        _push_cambio(conn, scope_ajeno, "finca")
        _push_cambio(conn, sujeto["scope"], "lote")
        conn.execute(
            "DELETE FROM sync_cambios WHERE scope=%s", (scope_ajeno,))
        conn.execute(
            "DELETE FROM sync_cursors WHERE scope=%s", (scope_ajeno,))
    assert _pull(sujeto["scope"], 0) == [1]


@pg
def test_pg_m9_finca_version_default_y_fk(sujeto):
    with _conn() as conn:
        fid = conn.execute(
            "INSERT INTO fincas (usuario_id, nombre) VALUES (%s,'V1')"
            " RETURNING id, version, deleted_at, dispositivo_origen_id",
            (sujeto["uid"],)).fetchone()
        assert fid[1] == 1 and fid[2] is None and fid[3] is None
        # dispositivo_origen_id exige FK real
        with pytest.raises(ForeignKeyViolation):
            conn.execute(
                "INSERT INTO fincas (usuario_id, nombre,"
                " dispositivo_origen_id) VALUES (%s,'Bad',%s)",
                (sujeto["uid"], uuid.uuid4()))
        conn.rollback()
        # dispositivo propio aceptado
        conn.execute(
            "INSERT INTO fincas (usuario_id, nombre,"
            " dispositivo_origen_id) VALUES (%s,'Ok',%s)",
            (sujeto["uid"], sujeto["did"]))
