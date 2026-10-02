# backend/tests/test_levantamientos.py
"""Pruebas unitarias de repository + schemas de levantamientos (ETAPA 2-B2).

Sin base de datos: el repository se verifica con una conexión falsa que
captura el SQL y los parámetros — así se comprueba el aislamiento por
usuario_id y el orden de vértices sin tocar la BD.
"""
import asyncio
import uuid
from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from modules.asistente_tecnico.schemas.levantamientos import (
    LevantamientoCreate,
    PoligonoCaptura,
    PuntoGPSCaptura,
    PuntosAgregar,
    ResultadoLevantamiento,
)
from shared.repositories import levantamientos as repo


# ============================================================================
# CONEXIÓN FALSA — captura SQL y parámetros
# ============================================================================

class _FakeCursor:
    def __init__(self, rows=None):
        self.rows = rows or []
        self.queries = []
        self.row_factory = None

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return False

    async def execute(self, sql, params=None):
        self.queries.append((sql, params))

    async def fetchall(self):
        return self.rows

    async def fetchone(self):
        return self.rows[0] if self.rows else None


class _FakeConn:
    def __init__(self, rows=None):
        self.cursor_obj = _FakeCursor(rows)

    def cursor(self, row_factory=None):
        self.cursor_obj.row_factory = row_factory
        return self.cursor_obj


UID = uuid.uuid4()
LEV = uuid.uuid4()


# ============================================================================
# SCHEMAS
# ============================================================================

def test_punto_gps_captura_valido():
    p = PuntoGPSCaptura(
        lat=-0.95, lon=-80.73, orden=1,
        precision_gps_metros=4.2,
        fecha_hora=datetime.now(timezone.utc),
    )
    assert p.lat == -0.95 and p.orden == 1


def test_punto_gps_hereda_validacion_latlon():
    with pytest.raises(ValidationError):
        PuntoGPSCaptura(lat=91, lon=-80.73, orden=1)
    with pytest.raises(ValidationError):
        PuntoGPSCaptura(lat=-0.95, lon=181, orden=1)


def test_precision_gps_no_negativa():
    with pytest.raises(ValidationError):
        PuntoGPSCaptura(lat=0, lon=0, orden=1, precision_gps_metros=-1)


def test_orden_debe_ser_positivo():
    with pytest.raises(ValidationError):
        PuntoGPSCaptura(lat=0, lon=0, orden=0)


def test_medicion_individual_permite_un_punto():
    p = PuntosAgregar(puntos=[{"lat": 0, "lon": 0, "orden": 1}])
    assert len(p.puntos) == 1


def test_poligono_exige_minimo_tres_puntos():
    with pytest.raises(ValidationError):
        PoligonoCaptura(puntos=[
            {"lat": 0, "lon": 0, "orden": 1},
            {"lat": 0, "lon": 1, "orden": 2},
        ])
    ok = PoligonoCaptura(puntos=[
        {"lat": 0, "lon": 0, "orden": 1},
        {"lat": 0, "lon": 1, "orden": 2},
        {"lat": 1, "lon": 0, "orden": 3},
    ])
    assert len(ok.puntos) == 3


def test_levantamiento_create_valida_tipos_y_longitud():
    ok = LevantamientoCreate(
        nombre="Lote norte", observaciones="x" * 2000,
        lote_id=uuid.uuid4(),
    )
    assert ok.nombre == "Lote norte"
    with pytest.raises(ValidationError):
        LevantamientoCreate(nombre="x" * 151)
    with pytest.raises(ValidationError):
        LevantamientoCreate(lote_id="no-es-uuid")


def test_resultado_estado_controlado():
    ok = ResultadoLevantamiento(area_m2=9980.0, perimetro_m=400.0)
    assert ok.estado == "cerrado"
    with pytest.raises(ValidationError):
        ResultadoLevantamiento(
            area_m2=100, perimetro_m=40, estado="inexistente",
        )


# ============================================================================
# REPOSITORY — aislamiento por usuario_id (conexión falsa)
# ============================================================================

def test_listar_filtra_por_usuario():
    conn = _FakeConn()
    asyncio.run(repo.listar_levantamientos_usuario(conn, UID))
    sql, params = conn.cursor_obj.queries[0]
    assert "WHERE usuario_id = %s" in sql
    assert params == (UID,)


def test_obtener_exige_propietario():
    conn = _FakeConn(rows=[{"id": LEV}])
    res = asyncio.run(repo.obtener_levantamiento(conn, LEV, UID))
    sql, params = conn.cursor_obj.queries[0]
    assert "usuario_id = %s" in sql
    assert params == (LEV, UID)
    assert res["id"] == LEV


def test_puntos_ordenados_y_aislados():
    conn = _FakeConn()
    asyncio.run(repo.obtener_puntos(conn, LEV, UID))
    sql, params = conn.cursor_obj.queries[0]
    assert "ORDER BY m.orden" in sql
    assert "l.usuario_id = %s" in sql
    assert params == (LEV, UID)


def test_agregar_puntos_inserta_solo_si_propietario():
    conn = _FakeConn()
    asyncio.run(repo.agregar_puntos(
        conn, LEV, UID, [(1, -0.95, -80.73, 4.2, None)]))
    sql, params = conn.cursor_obj.queries[0]
    assert "WHERE l.id = %s AND l.usuario_id = %s" in sql
    assert params[-2:] == (LEV, UID)


def test_guardar_resultado_exige_propietario():
    conn = _FakeConn()
    asyncio.run(repo.guardar_resultado(
        conn, LEV, UID, 9980.0, 400.0, "cerrado"))
    sql, params = conn.cursor_obj.queries[0]
    assert "WHERE id = %s AND usuario_id = %s" in sql
    assert params == (9980.0, 400.0, "cerrado", LEV, UID)


def test_levantamiento_completo_none_si_ajeno():
    conn = _FakeConn(rows=[])  # obtener_levantamiento devuelve None
    res = asyncio.run(repo.obtener_levantamiento_completo(conn, LEV, UID))
    assert res is None
