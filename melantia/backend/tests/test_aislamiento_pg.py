# backend/tests/test_aislamiento_pg.py
"""Validación del clasificador de errores de conexión pg_error_conexion
y de las reglas del guard test_db_url — sin ninguna conexión real.

Las excepciones son simuladas: subclase de psycopg.OperationalError
con sqlstate inyectado (la propiedad real delega en diag; aquí se
sombrea para fabricar cada caso)."""
import pytest
import psycopg

from conftest import pg_error_conexion, test_db_url


class _ErrPg(psycopg.OperationalError):
    """OperationalError con sqlstate controlado (None = sin respuesta)."""

    def __init__(self, sqlstate, msg="error simulado"):
        # psycopg.__init__ lee self.sqlstate — asignar antes de super()
        self._ss = sqlstate
        super().__init__(msg)

    @property
    def sqlstate(self):
        return self._ss


# ============================================================================
# CLASIFICACIÓN DE ERRORES — pg_error_conexion
# ============================================================================

def test_error_sin_sqlstate_es_skip():
    """Servidor que nunca respondió (caído/timeout) → omitir."""
    with pytest.raises(pytest.skip.Exception):
        pg_error_conexion(_ErrPg(None, "connection refused"))


def test_error_sqlstate_vacio_es_skip():
    with pytest.raises(pytest.skip.Exception):
        pg_error_conexion(_ErrPg(""))


def test_password_invalida_es_fail_no_skip():
    with pytest.raises(pytest.fail.Exception):
        pg_error_conexion(_ErrPg("28P01"))


def test_autenticacion_invalida_28000_es_fail():
    with pytest.raises(pytest.fail.Exception):
        pg_error_conexion(_ErrPg("28000"))


def test_base_inexistente_es_fail_no_skip():
    with pytest.raises(pytest.fail.Exception):
        pg_error_conexion(_ErrPg("3D000"))


def test_error_desconocido_es_fail_no_falso_skip():
    """Cualquier sqlstate no clasificado → fail, jamás skip."""
    for codigo in ("57P01", "53300", "XX000", "58P01"):
        with pytest.raises(pytest.fail.Exception):
            pg_error_conexion(_ErrPg(codigo))


def test_mensajes_no_filtran_secretos():
    """El mensaje original puede contener fragmentos del intento; el
    resultado nunca lo incluye."""
    secreto = "Sup3rClaveNoMostrar"
    try:
        pg_error_conexion(_ErrPg("28P01", f"password={secreto}"))
    except pytest.fail.Exception as e:
        assert secreto not in str(e)
    try:
        pg_error_conexion(_ErrPg("XX999", f"password={secreto}"))
    except pytest.fail.Exception as e:
        assert secreto not in str(e)


# ============================================================================
# GUARD test_db_url — reglas sin conexión (URL nunca se abre)
# ============================================================================

def test_guard_skip_sin_variable(monkeypatch):
    monkeypatch.delenv("MELANTIA_TEST_DATABASE_URL", raising=False)
    with pytest.raises(pytest.skip.Exception):
        test_db_url()


@pytest.mark.parametrize("url", [
    "postgresql://u@localhost/melantia_db",          # BD de la app
    "postgresql://u@localhost/latest_db",            # falso positivo
    "postgresql://u@localhost/attestation",          # falso positivo
    "postgresql://u@prod.example.com/x_test",        # remoto
    "postgresql://u@h1,h2/melantia_test",            # multi-host
    "postgresql://u@localhost/:",                    # sin dbname
])
def test_guard_rechaza_destinos_inseguros(monkeypatch, url):
    monkeypatch.setenv("MELANTIA_TEST_DATABASE_URL", url)
    with pytest.raises(pytest.fail.Exception):
        test_db_url()


@pytest.mark.parametrize("url", [
    "postgresql://u@localhost/melantia_test",
    "postgresql://u@127.0.0.1:5444/test_m6",
    "postgresql://u@[::1]/e2e_test",
])
def test_guard_acepta_destinos_validos(monkeypatch, url):
    monkeypatch.setenv("MELANTIA_TEST_DATABASE_URL", url)
    assert test_db_url() == url
