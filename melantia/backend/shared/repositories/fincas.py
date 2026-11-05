# backend/shared/repositories/fincas.py
"""
Adaptador de lectura a las entidades del Módulo 3 (Gestión de Fincas).

Rol arquitectónico:
- M2 (Asistente Técnico) necesita contexto de finca/lote/cultivo, pero
  M3 todavía no expone una API. Este repositorio es el adaptador
  temporal estable: cuando M3 publique su servicio, SOLO cambia la
  implementación interna de estas funciones, no su firma.
- M2 NO duplica fincas, lotes, animales ni trazabilidad; solo los lee.

Todas las funciones son async y reciben una conexión psycopg3 abierta
(la provee `database.get_db_connection` / la dependencia `get_db`).

Esquema consultado: backend/database/schema/gestion_fincas.sql
"""
from typing import Any, Dict, List, Optional

from psycopg.rows import dict_row


async def listar_fincas_usuario(conn, usuario_id: str) -> List[Dict[str, Any]]:
    """Fincas registradas por un productor."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT
                f.id, f.nombre, f.tipo_pyme, f.coordenadas_gps,
                p.nombre AS provincia,
                c.nombre AS canton,
                pa.nombre AS parroquia
            FROM fincas f
            LEFT JOIN provincias p  ON f.provincia_id = p.id
            LEFT JOIN cantones c    ON f.canton_id = c.id
            LEFT JOIN parroquias pa ON f.parroquia_id = pa.id
            WHERE f.usuario_id = %s
            ORDER BY f.nombre
            """,
            (usuario_id,),
        )
        return await cursor.fetchall()


async def obtener_finca(conn, finca_id: str) -> Optional[Dict[str, Any]]:
    """Datos de una finca con su ubicación administrativa."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT
                f.id, f.nombre, f.tipo_pyme, f.coordenadas_gps, f.usuario_id,
                p.nombre AS provincia,
                c.nombre AS canton,
                pa.nombre AS parroquia
            FROM fincas f
            LEFT JOIN provincias p  ON f.provincia_id = p.id
            LEFT JOIN cantones c    ON f.canton_id = c.id
            LEFT JOIN parroquias pa ON f.parroquia_id = pa.id
            WHERE f.id = %s
            """,
            (finca_id,),
        )
        return await cursor.fetchone()


async def listar_lotes_finca(conn, finca_id: str) -> List[Dict[str, Any]]:
    """Lotes de una finca con su cultivo principal y estado sanitario."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, finca_id, nombre_lote, cultivo_principal, variedad,
                   fecha_siembra, area_metros_cuadrados,
                   estado_salud_lote, created_at, updated_at
            FROM lotes
            WHERE finca_id = %s
            ORDER BY nombre_lote
            """,
            (finca_id,),
        )
        return await cursor.fetchall()


async def obtener_lote(conn, lote_id: str) -> Optional[Dict[str, Any]]:
    """Datos de un lote y su finca propietaria."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT l.id, l.nombre_lote, l.cultivo_principal, l.variedad,
                   l.fecha_siembra, l.area_metros_cuadrados,
                   l.estado_salud_lote,
                   l.finca_id, f.nombre AS finca_nombre, f.usuario_id
            FROM lotes l
            JOIN fincas f ON l.finca_id = f.id
            WHERE l.id = %s
            """,
            (lote_id,),
        )
        return await cursor.fetchone()


async def actualizar_area_lote(
    conn, lote_id: str, usuario_id: str, area_m2: float
) -> Optional[Dict[str, Any]]:
    """
    Actualiza `lotes.area_metros_cuadrados` (dato derivado) aplicando
    el resultado de un levantamiento GPS. Solo si el lote pertenece a
    una finca del usuario — levantamiento ajeno no escribe nada.
    """
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE lotes
            SET area_metros_cuadrados = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
              AND finca_id IN (
                  SELECT id FROM fincas WHERE usuario_id = %s
              )
            RETURNING id, finca_id, nombre_lote, area_metros_cuadrados
            """,
            (area_m2, lote_id, usuario_id),
        )
        return await cursor.fetchone()


async def contar_animales_finca(conn, finca_id: str) -> int:
    """Cabezas de ganado registradas en los hatos de la finca."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT COALESCE(SUM(h.cantidad_cabezas), 0) AS total
            FROM hatos_ganaderos h
            WHERE h.finca_id = %s
            """,
            (finca_id,),
        )
        fila = await cursor.fetchone()
        return int(fila["total"]) if fila else 0


# ============================================================================
# ESCRITURA — Módulo 3 (Gestión de Fincas)
# Las funciones de arriba son el adaptador de lectura M2↔M3; estas son
# las operaciones del CRUD del módulo. Mismas reglas: psycopg3 async,
# dict_row, conexión inyectada, parámetros posicionales.
# ============================================================================

_CAMPOS_FINCA_EDITABLES = (
    "nombre", "provincia_id", "canton_id", "parroquia_id",
    "coordenadas_gps", "ciiu_id", "tipo_pyme",
)

_CAMPOS_LOTE_EDITABLES = (
    "nombre_lote", "cultivo_principal", "variedad", "fecha_siembra",
    "area_metros_cuadrados", "estado_salud_lote",
)


async def listar_fincas_usuario_resumen(
    conn, usuario_id: str
) -> List[Dict[str, Any]]:
    """Fincas del usuario con conteo de lotes y hatos (vista de lista)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT
                f.id, f.nombre, f.tipo_pyme, f.coordenadas_gps,
                f.provincia_id, f.canton_id, f.parroquia_id,
                p.nombre AS provincia,
                c.nombre AS canton,
                pa.nombre AS parroquia,
                (SELECT COUNT(*) FROM lotes l WHERE l.finca_id = f.id)
                    AS num_lotes,
                (SELECT COUNT(*) FROM hatos_ganaderos h
                 WHERE h.finca_id = f.id) AS num_hatos,
                f.created_at, f.updated_at
            FROM fincas f
            LEFT JOIN provincias p  ON f.provincia_id = p.id
            LEFT JOIN cantones c    ON f.canton_id = c.id
            LEFT JOIN parroquias pa ON f.parroquia_id = pa.id
            WHERE f.usuario_id = %s
            ORDER BY f.nombre
            """,
            (usuario_id,),
        )
        return await cursor.fetchall()


async def obtener_finca_completa(
    conn, finca_id: str
) -> Optional[Dict[str, Any]]:
    """Finca con todos sus campos, nombres geo y conteos de lotes/hatos."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT
                f.id, f.usuario_id, f.nombre, f.tipo_pyme,
                f.provincia_id, f.canton_id, f.parroquia_id,
                f.coordenadas_gps, f.ciiu_id,
                p.nombre AS provincia,
                c.nombre AS canton,
                pa.nombre AS parroquia,
                (SELECT COUNT(*) FROM lotes l WHERE l.finca_id = f.id)
                    AS num_lotes,
                (SELECT COUNT(*) FROM hatos_ganaderos h
                 WHERE h.finca_id = f.id) AS num_hatos,
                f.created_at, f.updated_at
            FROM fincas f
            LEFT JOIN provincias p  ON f.provincia_id = p.id
            LEFT JOIN cantones c    ON f.canton_id = c.id
            LEFT JOIN parroquias pa ON f.parroquia_id = pa.id
            WHERE f.id = %s
            """,
            (finca_id,),
        )
        return await cursor.fetchone()


async def insertar_finca(
    conn,
    usuario_id: str,
    campos: Dict[str, Any],
    entity_id: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Inserta una finca del usuario. `campos` ya viene depurado por el
    service (solo claves de _CAMPOS_FINCA_EDITABLES).

    `entity_id` (opcional): UUID asignado por el cliente en el push de
    sincronización — se inserta como PK en lugar del DEFAULT
    uuid_generate_v4(). Los llamadores web no lo pasan y conservan el
    comportamiento actual.
    """
    columnas = ["usuario_id", *campos.keys()]
    valores = [usuario_id, *campos.values()]
    if entity_id is not None:
        columnas.insert(0, "id")
        valores.insert(0, str(entity_id))
    placeholders = ", ".join(["%s"] * len(columnas))
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            f"""
            INSERT INTO fincas ({", ".join(columnas)})
            VALUES ({placeholders})
            RETURNING id, usuario_id, nombre, provincia_id, canton_id,
                      parroquia_id, coordenadas_gps, ciiu_id, tipo_pyme,
                      created_at, updated_at
            """,
            tuple(valores),
        )
        return await cursor.fetchone()


async def actualizar_finca(
    conn, finca_id: str, usuario_id: str, campos: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    UPDATE parcial de campos editables de una finca PROPIA. La cláusula
    usuario_id impide tocar fincas ajenas: si no hay fila, el service
    responde 404 indistinguible.
    """
    asignaciones = [f"{k} = %s" for k in campos]
    valores = [*campos.values(), finca_id, usuario_id]
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            f"""
            UPDATE fincas
            SET {", ".join(asignaciones)},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND usuario_id = %s
            RETURNING id, usuario_id, nombre, provincia_id, canton_id,
                      parroquia_id, coordenadas_gps, ciiu_id, tipo_pyme,
                      created_at, updated_at
            """,
            tuple(valores),
        )
        return await cursor.fetchone()


async def insertar_lote(
    conn,
    finca_id: str,
    campos: Dict[str, Any],
    entity_id: Optional[Any] = None,
) -> Dict[str, Any]:
    """
    Inserta un lote en una finca (propiedad ya verificada en service).

    `entity_id` (opcional): UUID del cliente vía sync — mismo contrato
    que insertar_finca; sin él se usa el DEFAULT del esquema.
    """
    columnas = ["finca_id", *campos.keys()]
    valores = [finca_id, *campos.values()]
    if entity_id is not None:
        columnas.insert(0, "id")
        valores.insert(0, str(entity_id))
    placeholders = ", ".join(["%s"] * len(columnas))
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            f"""
            INSERT INTO lotes ({", ".join(columnas)})
            VALUES ({placeholders})
            RETURNING id, finca_id, nombre_lote, cultivo_principal,
                      variedad, fecha_siembra, area_metros_cuadrados,
                      estado_salud_lote, created_at, updated_at
            """,
            tuple(valores),
        )
        return await cursor.fetchone()


async def actualizar_lote(
    conn, lote_id: str, finca_id: str, campos: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    UPDATE parcial de un lote vinculado a `finca_id` (la propiedad de la
    finca ya se verificó en el service). None → el lote no pertenece a
    esa finca → 404 indistinguible.
    """
    asignaciones = [f"{k} = %s" for k in campos]
    valores = [*campos.values(), lote_id, finca_id]
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            f"""
            UPDATE lotes
            SET {", ".join(asignaciones)},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND finca_id = %s
            RETURNING id, finca_id, nombre_lote, cultivo_principal,
                      variedad, fecha_siembra, area_metros_cuadrados,
                      estado_salud_lote, created_at, updated_at
            """,
            tuple(valores),
        )
        return await cursor.fetchone()
