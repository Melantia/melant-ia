# backend/shared/repositories/geografia.py
"""
Lecturas del catálogo geográfico DPA/INEC (provincias, cantones,
parroquias) compartidas por los módulos que referencian ubicación
(M3 fincas, registro de usuarios, levantamientos, ...).

Solo lectura: el catálogo se alimenta de backend/database/seeds/.
Convenciones: psycopg3 async, dict_row, conexión inyectada.
"""
from typing import Any, Dict, List, Optional

from psycopg.rows import dict_row


async def listar_provincias(conn) -> List[Dict[str, Any]]:
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            "SELECT id, nombre, codigo_inec FROM provincias"
            " ORDER BY codigo_inec"
        )
        return await cursor.fetchall()


async def listar_cantones(
    conn, provincia_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    sql = (
        "SELECT id, provincia_id, nombre, codigo_inec FROM cantones"
    )
    params: tuple = ()
    if provincia_id is not None:
        sql += " WHERE provincia_id = %s"
        params = (provincia_id,)
    sql += " ORDER BY codigo_inec"
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(sql, params)
        return await cursor.fetchall()


async def listar_parroquias(
    conn, canton_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    sql = (
        "SELECT id, canton_id, nombre, codigo_inec FROM parroquias"
    )
    params: tuple = ()
    if canton_id is not None:
        sql += " WHERE canton_id = %s"
        params = (canton_id,)
    sql += " ORDER BY codigo_inec"
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(sql, params)
        return await cursor.fetchall()


async def obtener_provincia(
    conn, provincia_id: int
) -> Optional[Dict[str, Any]]:
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            "SELECT id, nombre, codigo_inec FROM provincias"
            " WHERE id = %s",
            (provincia_id,),
        )
        return await cursor.fetchone()


async def obtener_canton(
    conn, canton_id: int
) -> Optional[Dict[str, Any]]:
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            "SELECT id, provincia_id, nombre, codigo_inec"
            " FROM cantones WHERE id = %s",
            (canton_id,),
        )
        return await cursor.fetchone()


async def obtener_parroquia(
    conn, parroquia_id: int
) -> Optional[Dict[str, Any]]:
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            "SELECT id, canton_id, nombre, codigo_inec"
            " FROM parroquias WHERE id = %s",
            (parroquia_id,),
        )
        return await cursor.fetchone()
