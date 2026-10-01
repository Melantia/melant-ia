# backend/shared/repositories/levantamientos.py
"""
Adaptador de persistencia para levantamientos GPS (ETAPA 2-B2).

Rol arquitectónico:
- Persistencia pura: esta capa NO calcula área ni perímetro; la
  geometría vive en `modules/asistente_tecnico/services/geodesia.py`.
- `levantamientos` agrupa los vértices capturados; cada vértice es una
  fila de `mediciones_campo` con `levantamiento_id` + `orden`.
- Toda lectura/escritura filtra por `usuario_id`: un levantamiento solo
  es accesible para su propietario.

Convención para vértices en `mediciones_campo` (columnas NOT NULL
heredadas del esquema de sensores): `sensor_tipo='GPS'`,
`valor_lectura=0`, `unidad_medida='grados_decimales'`.

Todas las funciones son async y reciben una conexión psycopg3 abierta
(la provee `database.get_db_connection` / la dependencia `get_db`).

Esquema consultado: backend/database/schema/levantamientos.sql
"""
from datetime import datetime
from typing import Any, Dict, List, Optional, Sequence, Tuple
from uuid import UUID

from psycopg.rows import dict_row

# (orden, latitud, longitud, precision_gps_metros, fecha_hora)
PuntoVertice = Tuple[int, float, float, Optional[float], Optional[datetime]]


async def listar_levantamientos_usuario(
    conn, usuario_id: UUID
) -> List[Dict[str, Any]]:
    """Levantamientos del productor, más recientes primero."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, usuario_id, lote_id, nombre, observaciones,
                   estado, area_m2, perimetro_m, created_at, updated_at
            FROM levantamientos
            WHERE usuario_id = %s
            ORDER BY created_at DESC
            """,
            (usuario_id,),
        )
        return await cursor.fetchall()


async def obtener_levantamiento(
    conn, levantamiento_id: UUID, usuario_id: UUID
) -> Optional[Dict[str, Any]]:
    """Un levantamiento solo si pertenece al usuario (aislamiento)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, usuario_id, lote_id, nombre, observaciones,
                   estado, area_m2, perimetro_m, created_at, updated_at
            FROM levantamientos
            WHERE id = %s AND usuario_id = %s
            """,
            (levantamiento_id, usuario_id),
        )
        return await cursor.fetchone()


async def obtener_por_client_operation_id(
    conn, usuario_id: UUID, client_operation_id: UUID
) -> Optional[Dict[str, Any]]:
    """Busca un levantamiento por la clave de operación del cliente."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT id, usuario_id, lote_id, nombre, observaciones,
                   estado, area_m2, perimetro_m, created_at, updated_at
            FROM levantamientos
            WHERE usuario_id = %s AND client_operation_id = %s
            """,
            (usuario_id, client_operation_id),
        )
        return await cursor.fetchone()


async def crear_levantamiento(
    conn,
    usuario_id: UUID,
    lote_id: Optional[UUID] = None,
    nombre: Optional[str] = None,
    observaciones: Optional[str] = None,
    client_operation_id: Optional[UUID] = None,
) -> Dict[str, Any]:
    """
    Crea un levantamiento en estado 'borrador' para el usuario.

    Idempotencia (offline-first, decisión B1 de la auditoría M2):
    `client_operation_id` identifica la operación de creación del
    cliente — si ya existe un levantamiento del mismo usuario con esa
    clave, se devuelve el registro existente en lugar de crear un
    duplicado, así un reintento tras desconexión es seguro.

    `client_operation_id` requiere la columna homónima en la tabla
    (migración de integridad M2); sin ella, enviar la clave produce
    un error de base de datos y el comportamiento previo se mantiene
    solo para clientes que no la envían.
    """
    if client_operation_id is not None:
        existente = await obtener_por_client_operation_id(
            conn, usuario_id, client_operation_id
        )
        if existente:
            return existente

    async with conn.cursor(row_factory=dict_row) as cursor:
        if client_operation_id is None:
            await cursor.execute(
                """
                INSERT INTO levantamientos
                    (usuario_id, lote_id, nombre, observaciones)
                VALUES (%s, %s, %s, %s)
                RETURNING id, usuario_id, lote_id, nombre, observaciones,
                          estado, area_m2, perimetro_m, created_at, updated_at
                """,
                (usuario_id, lote_id, nombre, observaciones),
            )
        else:
            await cursor.execute(
                """
                INSERT INTO levantamientos
                    (usuario_id, lote_id, nombre, observaciones,
                     client_operation_id)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, usuario_id, lote_id, nombre, observaciones,
                          estado, area_m2, perimetro_m, created_at, updated_at
                """,
                (
                    usuario_id, lote_id, nombre, observaciones,
                    client_operation_id,
                ),
            )
        return await cursor.fetchone()


async def agregar_puntos(
    conn,
    levantamiento_id: UUID,
    usuario_id: UUID,
    puntos: Sequence[PuntoVertice],
) -> List[Dict[str, Any]]:
    """
    Inserta vértices GPS ordenados en `mediciones_campo`.

    El INSERT va contra `levantamientos` con `usuario_id` en el WHERE:
    si el levantamiento no es del usuario, no se inserta nada.
    """
    insertados: List[Dict[str, Any]] = []
    async with conn.cursor(row_factory=dict_row) as cursor:
        for orden, lat, lon, precision, fecha_hora in puntos:
            # ON CONFLICT DO NOTHING: segunda línea de defensa de la
            # idempotencia — activa solo cuando existe el índice
            # uq_mediciones_levantamiento_orden (migración M2); la
            # primera línea es la deduplicación del servicio.
            await cursor.execute(
                """
                INSERT INTO mediciones_campo
                    (usuario_id, sensor_tipo, valor_lectura, unidad_medida,
                     lote_id, levantamiento_id, orden,
                     latitud, longitud, precision_gps_metros, fecha_hora)
                SELECT l.usuario_id, 'GPS', 0, 'grados_decimales',
                       l.lote_id, l.id, %s, %s, %s, %s,
                       COALESCE(%s, CURRENT_TIMESTAMP)
                FROM levantamientos l
                WHERE l.id = %s AND l.usuario_id = %s
                ON CONFLICT DO NOTHING
                RETURNING id, levantamiento_id, orden, latitud, longitud,
                          precision_gps_metros, fecha_hora
                """,
                (
                    orden, lat, lon, precision, fecha_hora,
                    levantamiento_id, usuario_id,
                ),
            )
            fila = await cursor.fetchone()
            if fila:
                insertados.append(fila)
    return insertados


async def obtener_puntos(
    conn, levantamiento_id: UUID, usuario_id: UUID
) -> List[Dict[str, Any]]:
    """Vértices del levantamiento ordenados por `orden` (aislamiento)."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            SELECT m.id, m.levantamiento_id, m.orden,
                   m.latitud, m.longitud, m.precision_gps_metros,
                   m.fecha_hora
            FROM mediciones_campo m
            JOIN levantamientos l ON l.id = m.levantamiento_id
            WHERE m.levantamiento_id = %s AND l.usuario_id = %s
            ORDER BY m.orden
            """,
            (levantamiento_id, usuario_id),
        )
        return await cursor.fetchall()


async def obtener_levantamiento_completo(
    conn, levantamiento_id: UUID, usuario_id: UUID
) -> Optional[Dict[str, Any]]:
    """Levantamiento + sus vértices ordenados, solo del propietario."""
    levantamiento = await obtener_levantamiento(
        conn, levantamiento_id, usuario_id
    )
    if not levantamiento:
        return None
    levantamiento["puntos"] = await obtener_puntos(
        conn, levantamiento_id, usuario_id
    )
    return levantamiento


async def guardar_resultado(
    conn,
    levantamiento_id: UUID,
    usuario_id: UUID,
    area_m2: float,
    perimetro_m: float,
    estado: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Persiste el resultado geométrico calculado por la capa de servicio."""
    async with conn.cursor(row_factory=dict_row) as cursor:
        await cursor.execute(
            """
            UPDATE levantamientos
            SET area_m2 = %s,
                perimetro_m = %s,
                estado = COALESCE(%s, estado),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND usuario_id = %s
            RETURNING id, usuario_id, lote_id, nombre, observaciones,
                      estado, area_m2, perimetro_m, created_at, updated_at
            """,
            (area_m2, perimetro_m, estado, levantamiento_id, usuario_id),
        )
        return await cursor.fetchone()
