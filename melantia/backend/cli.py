# backend/cli.py
"""CLI autorizada de mantenimiento MELANTIA (FIX-03).

Sustituye al endpoint público retirado ``POST /api/sistema/
cron-quincenal``. Solo puede ejecutarse desde un entorno con acceso
local autorizado (operador, planificador del sistema, Task
Scheduler); no hay vía HTTP.

Uso::

    cd backend
    python -m cli limpieza-quincenal            # ejecución real
    python -m cli limpieza-quincenal --dry-run  # solo informa

La conexión a PostgreSQL usa los mecanismos existentes
(``database.get_db_connection`` / ``core.config.settings``); no hay
credenciales en el código.

Códigos de salida:
    0  ejecución correcta
    1  error controlado (conexión, SQL, etc.)
    2  otra limpieza ya está en ejecución (advisory lock ocupado)
    130 interrupción por teclado
"""
import argparse
import asyncio
import logging
import sys

logger = logging.getLogger("melantia.cli")

EXITO, ERROR, OCUPADO = 0, 1, 2


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="melantia-cli",
        description=(
            "Utilidades autorizadas de mantenimiento de MELANTIA."
        ),
    )
    sub = parser.add_subparsers(dest="comando", required=True)
    limpieza = sub.add_parser(
        "limpieza-quincenal",
        help=(
            "Elimina registros_campo con más de 15 días que no sean "
            "activo de conocimiento, junto a sus archivos confinados "
            "en el almacenamiento."
        ),
    )
    limpieza.add_argument(
        "--dry-run",
        action="store_true",
        help=(
            "Informa de lo que se eliminaría sin borrar registros "
            "ni archivos ni modificar la base de datos."
        ),
    )
    return parser


async def _cmd_limpieza_quincenal(dry_run: bool) -> int:
    # Import diferido: la CLI no debe cargar módulos de aplicación
    # solo por mostrar --help.
    from modules.mantenimiento.limpieza import (
        ejecutar_limpieza_quincenal_selectiva,
    )

    try:
        r = await ejecutar_limpieza_quincenal_selectiva(
            dry_run=dry_run
        )
    except Exception:
        logger.exception("Error ejecutando la limpieza quincenal")
        print(
            "ERROR: la limpieza no se completó. "
            "Revisa el log del backend para el detalle.",
            file=sys.stderr,
        )
        return ERROR

    if r["bloqueada"]:
        print(
            "OCUPADO: ya hay una limpieza en ejecución. "
            "Inténtalo más tarde.",
            file=sys.stderr,
        )
        return OCUPADO

    if r["dry_run"]:
        print(
            "DRY-RUN — nada se eliminó:\n"
            f"  Registros elegibles: {r['seleccionados']}\n"
            f"  Archivos que se eliminarían: {r['archivos_eliminados']}\n"
            f"  Archivos fuera del almacenamiento (omitidos): "
            f"{r['archivos_fuera_de_almacenamiento']}"
        )
    else:
        print(
            "Limpieza completada:\n"
            f"  Registros eliminados: {r['eliminados']}\n"
            f"  Archivos eliminados: {r['archivos_eliminados']}\n"
            f"  Archivos fuera del almacenamiento (omitidos): "
            f"{r['archivos_fuera_de_almacenamiento']}"
        )
    return EXITO


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)

    if sys.platform == "win32":
        # psycopg async requiere el loop de selector en Windows
        # (misma política que usa backend/main.py para uvicorn).
        asyncio.set_event_loop_policy(
            asyncio.WindowsSelectorEventLoopPolicy()
        )

    try:
        if args.comando == "limpieza-quincenal":
            return asyncio.run(
                _cmd_limpieza_quincenal(dry_run=args.dry_run)
            )
    except KeyboardInterrupt:
        print("Interrumpido por el usuario.", file=sys.stderr)
        return 130

    return ERROR


if __name__ == "__main__":
    sys.exit(main())
