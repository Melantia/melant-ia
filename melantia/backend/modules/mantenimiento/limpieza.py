"""Limpieza quincenal selectiva de registros temporales.

Lógica extraída intacta de ``backend/main.py`` al retirar el endpoint
HTTP público ``POST /api/sistema/cron-quincenal`` (FIX-03). Ahora solo
se invoca desde la CLI autorizada (``backend/cli.py``), que exige
acceso al entorno de ejecución.

Protección de concurrencia: advisory lock de sesión de PostgreSQL
(``pg_try_advisory_lock``) adquirido sobre la MISMA conexión que
ejecuta el trabajo, de modo que una segunda ejecución concurrente es
rechazada de forma controlada. La clave es fija y documentada
(``hashtext('melantia.limpieza_quincenal')``); no cambiarla sin
revisar los planificadores autorizados que la usen. El lock se libera
en ``finally`` y solo si esta ejecución lo adquirió — la conexión
vuelve al pool, así que nunca se asume que el cierre limpie el lock.
"""
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

from core.config import settings
from database import get_db_connection

logger = logging.getLogger("melantia.mantenimiento")

# Directorio raíz de almacenamiento de archivos del backend.
# Se usa como límite de seguridad al eliminar evidencias físicas.
STORAGE_DIR: Path = settings.storage_dir

DIAS_RETENCION = 15

# Clave fija del advisory lock (ver docstring del módulo).
_LOCK_CLAVE = "hashtext('melantia.limpieza_quincenal')"
_LOCK_SQL_ADQUIRIR = (
    f"SELECT pg_try_advisory_lock({_LOCK_CLAVE}) AS adquirido"
)
_LOCK_SQL_LIBERAR = (
    f"SELECT pg_advisory_unlock({_LOCK_CLAVE}) AS liberado"
)


async def ejecutar_limpieza_quincenal_selectiva(
    dry_run: bool = False,
) -> dict:
    """
    Limpia registros temporales con más de 15 días de antigüedad.

    Se preservan los registros marcados como conocimiento activo
    (``es_activo_conocimiento = TRUE``) y solo se eliminan archivos
    confinados dentro de ``STORAGE_DIR``.

    Con ``dry_run=True`` informa de lo que se eliminaría sin borrar
    ni modificar nada en la base de datos ni en disco.

    Devuelve un dict de resultado::

        {
            "bloqueada": bool,         # otra ejecución tenía el lock
            "seleccionados": int,      # registros elegibles
            "eliminados": int,         # registros borrados (0 en dry-run)
            "archivos_eliminados": int,  # borrados o "borrables" en dry-run
            "archivos_fuera_de_almacenamiento": int,
            "dry_run": bool,
        }

    Las excepciones de base de datos se propagan al llamador (la CLI
    las convierte en código de salida de error); los errores por
    archivo se registran como warning, como en el comportamiento
    original.
    """

    logger.info(
        "[MELANTIA] Iniciando limpieza selectiva%s...",
        " (dry-run)" if dry_run else "",
    )

    limite_tiempo = (
        datetime.now(timezone.utc) - timedelta(days=DIAS_RETENCION)
    )

    resultado = {
        "bloqueada": False,
        "seleccionados": 0,
        "eliminados": 0,
        "archivos_eliminados": 0,
        "archivos_fuera_de_almacenamiento": 0,
        "dry_run": dry_run,
    }

    async with get_db_connection() as (conn, cursor):
        cursor = None
        lock_adquirido = False

        try:
            cursor = await conn.execute(_LOCK_SQL_ADQUIRIR)
            fila_lock = await cursor.fetchone()
            lock_adquirido = bool(fila_lock and fila_lock["adquirido"])

            if not lock_adquirido:
                resultado["bloqueada"] = True
                logger.warning(
                    "[MELANTIA] Limpieza ya en ejecución "
                    "(advisory lock ocupado); se omite."
                )
                return resultado

            cursor = await conn.execute(
                """
                SELECT id, foto_url
                FROM registros_campo
                WHERE created_at < %s
                  AND es_activo_conocimiento = FALSE
                """,
                (limite_tiempo,),
            )

            registros_a_borrar = await cursor.fetchall()
            resultado["seleccionados"] = len(registros_a_borrar)

            for registro in registros_a_borrar:

                foto_url = registro.get("foto_url")

                # ---------------------------------------------------
                # ELIMINACIÓN SEGURA DEL ARCHIVO
                # ---------------------------------------------------

                if foto_url:

                    try:
                        ruta_archivo = await asyncio.to_thread(
                            Path(foto_url).resolve
                        )

                        # Solo permitimos eliminar archivos dentro
                        # del almacenamiento de MELANTIA.
                        ruta_archivo.relative_to(STORAGE_DIR)

                        if await asyncio.to_thread(
                            ruta_archivo.is_file
                        ):
                            if not dry_run:
                                await asyncio.to_thread(
                                    ruta_archivo.unlink
                                )
                            resultado[
                                "archivos_eliminados"
                            ] += 1

                    except (ValueError, OSError) as error:
                        resultado[
                            "archivos_fuera_de_almacenamiento"
                        ] += 1
                        logger.warning(
                            "No se eliminó archivo fuera del "
                            "almacenamiento permitido: %s",
                            error,
                        )

                # ---------------------------------------------------
                # ELIMINACIÓN DEL REGISTRO
                # ---------------------------------------------------

                if not dry_run:
                    cursor = await conn.execute(
                        """
                        DELETE FROM registros_campo
                        WHERE id = %s
                        """,
                        (registro["id"],),
                    )

                    resultado["eliminados"] += 1

            if not dry_run:
                await conn.commit()

            logger.info(
                "[MELANTIA] Limpieza%s finalizada. "
                "Seleccionados: %s | Eliminados: %s | "
                "Archivos: %s",
                " (dry-run)" if dry_run else "",
                resultado["seleccionados"],
                resultado["eliminados"],
                resultado["archivos_eliminados"],
            )

        finally:
            if lock_adquirido:
                try:
                    await conn.execute(_LOCK_SQL_LIBERAR)
                except Exception:
                    logger.exception(
                        "No se pudo liberar el advisory lock "
                        "de limpieza"
                    )

    return resultado
