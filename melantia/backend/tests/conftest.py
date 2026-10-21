# backend/tests/conftest.py
"""Permite importar los paquetes del backend (core, modules, shared)
y centraliza la URL exclusiva de la base de datos de pruebas."""
import os
import sys
from pathlib import Path
from typing import Optional, Tuple

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
# pytest 9 (importlib) no añade tests/ a sys.path — necesario para
# que los módulos de test puedan hacer 'from conftest import ...'
sys.path.insert(0, str(Path(__file__).resolve().parent))

import pytest  # noqa: E402
from psycopg.conninfo import conninfo_to_dict  # noqa: E402

from core.config import settings  # noqa: E402

_LOOPBACK = {"localhost", "127.0.0.1", "::1", "[::1]"}


def _destino_desde_conninfo(info: dict) -> Optional[Tuple[str, int, str]]:
    """
    Normaliza un conninfo a (host, puerto, dbname) — o None si el
    destino es incompleto o imposible de verificar de forma segura.
    hostaddr manda sobre host (libpq); los alias de loopback se
    colapsan a 'loopback'; multi-host y pg_service son ambiguos.
    """
    if info.get("service"):
        return None                      # pg_service: no resoluble aquí
    host = (info.get("hostaddr") or info.get("host") or "localhost")
    host = host.strip().lower()
    if not host or "," in host:          # multi-host: destino ambiguo
        return None
    if host in _LOOPBACK:
        host = "loopback"
    try:
        port = int(info.get("port") or 5432)
    except (TypeError, ValueError):
        return None
    dbname = (info.get("dbname") or "").strip().lower()
    if not dbname:
        return None
    return host, port, dbname


def _destino_app() -> Optional[Tuple[str, int, str]]:
    """
    Destino efectivo de la aplicación sin conectar ni tocar
    settings.database_url (la propiedad lanza sin credenciales):
    DATABASE_URL (campo Optional) tiene precedencia; si no, los
    campos MELANTIA_DB_* separados. None = no determinable.
    """
    override = settings.database_url_override
    if override:
        try:
            return _destino_desde_conninfo(conninfo_to_dict(override))
        except Exception:
            return None                  # override no parseable
    return _destino_desde_conninfo({
        "host": settings.db_host,
        "port": settings.db_port,
        "dbname": settings.db_name,
    })


def _es_base_de_pruebas(dbname: str) -> bool:
    """Nombre inequívoco de base desechable — sin falsos positivos
    ('latest_db', 'attestation', 'protesta_datos' quedan fuera)."""
    return (
        dbname == "melantia_test"
        or dbname.startswith("test_")
        or dbname.endswith("_test")
    )


def test_db_url() -> str:
    """
    URL de conexión exclusiva para pruebas: MELANTIA_TEST_DATABASE_URL.

    Fail-closed, antes de cualquier conexión u operación destructiva:
    - sin la variable → skip explícito, sin intentar conectar;
    - conninfo inválido o destino no verificable → fallo;
    - destino remoto → fallo (solo se autoriza servidor local);
    - dbname sin marca estricta de pruebas → fallo;
    - coincidencia con el destino efectivo de la aplicación
      (DATABASE_URL si existe, si no MELANTIA_DB_*) → fallo;
    - destino de la aplicación no determinable → fallo.
    Jamás recurre a settings.database_url ni a la BD de MELANTIA.
    """
    url = os.environ.get("MELANTIA_TEST_DATABASE_URL")
    if not url:
        pytest.skip(
            "MELANTIA_TEST_DATABASE_URL no configurada — "
            "tests de PostgreSQL omitidos sin conectar"
        )
    try:
        info = conninfo_to_dict(url)
    except Exception:
        pytest.fail("MELANTIA_TEST_DATABASE_URL no es un conninfo válido")

    destino = _destino_desde_conninfo(info)
    if destino is None:
        pytest.fail(
            "MELANTIA_TEST_DATABASE_URL tiene un destino incompleto, "
            "ambiguo o no verificable"
        )
    host, port, dbname = destino

    if host != "loopback":
        pytest.fail(
            "MELANTIA_TEST_DATABASE_URL apunta a un destino remoto — "
            "no autorizado"
        )
    if not _es_base_de_pruebas(dbname):
        pytest.fail(
            "MELANTIA_TEST_DATABASE_URL debe apuntar a una base de "
            "pruebas explícita (melantia_test, test_* o *_test)"
        )

    app = _destino_app()
    if app is None:
        pytest.fail(
            "No se pudo determinar el destino efectivo de la "
            "aplicación — aislamiento no demostrable, fail-closed"
        )
    if (host, port, dbname) == app:
        pytest.fail(
            "MELANTIA_TEST_DATABASE_URL coincide con el destino de la "
            "aplicación — prohibido"
        )
    return url


# Evita que pytest la recoja como test al importarla desde módulos de test
test_db_url.__test__ = False


def pg_error_conexion(exc: BaseException) -> "NoReturn":  # noqa: F821
    """
    Clasifica un OperationalError de psycopg al conectar con la BD de
    pruebas. Regla: la URL fue configurada explícitamente — solo la
    ausencia real de servidor justifica omitir.

    - sqlstate ausente (None/''): el servidor nunca respondió →
      conectividad genuina (caído, DNS, timeout) → skip.
    - 28P01 / 28000 (autenticación) → fail: credencial rechazada no es
      "infraestructura ausente".
    - 3D000 (base inexistente) → fail: melantia_test debía existir.
    - cualquier otro sqlstate → fail con tipo + sqlstate, sin valor del
      error original (puede contener fragmentos del intento).
    """
    estado = getattr(exc, "sqlstate", None) or ""
    if not estado:
        pytest.skip("PostgreSQL de pruebas no disponible")
    if estado in ("28P01", "28000"):
        pytest.fail(
            "MELANTIA_TEST_DATABASE_URL: autenticación rechazada "
            "(revisar usuario/contraseña del rol de pruebas)"
        )
    if estado == "3D000":
        pytest.fail(
            "MELANTIA_TEST_DATABASE_URL: la base de pruebas no existe "
            "en el servidor"
        )
    pytest.fail(
        "Error de conexión PostgreSQL no clasificado: "
        f"{type(exc).__name__} sqlstate={estado}"
    )
