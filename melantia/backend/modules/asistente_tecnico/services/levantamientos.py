# backend/modules/asistente_tecnico/services/levantamientos.py
"""
Servicio de levantamientos GPS (ETAPA 2-B3).

Coordina la operación completa:
    router -> este servicio -> geodesia.py (cálculo) + repository (BD)

Reglas de negocio:
- Todo levantamiento pertenece a un usuario: el repository filtra por
  `usuario_id`, así que un recurso ajeno es indistinguible de uno
  inexistente (404 en ambos casos — no se revela su existencia).
- Los puntos solo se agregan en estado 'borrador'.
- El cálculo exige >= 3 vértices ordenados y solo corre sobre
  'borrador' o 'cerrado' (un levantamiento 'aplicado' ya fijó su
  geometría al lote).
- La geometría la calcula `services/geodesia.py`; el repository solo
  persiste. Este módulo no contiene SQL ni fórmulas.
"""
import logging
from typing import Any, Dict, List
from uuid import UUID

from core.exceptions import (
    AuthorizationError,
    BusinessLogicError,
    DuplicateResourceError,
    LoteNotFoundError,
    OperationNotAllowedError,
    ResourceNotFoundError,
    ValidationError,
)
from modules.asistente_tecnico.schemas.levantamientos import (
    LevantamientoCreate,
    PuntoGPSCaptura,
)
from modules.asistente_tecnico.services import geodesia
from shared.repositories import fincas as repo_fincas
from shared.repositories import levantamientos as repo

logger = logging.getLogger("melantia.levantamientos")


async def crear_levantamiento(
    conn, usuario_id: str, data: LevantamientoCreate
) -> Dict[str, Any]:
    """Crea un levantamiento en 'borrador' para el usuario autenticado."""
    if data.lote_id is not None:
        lote = await repo_fincas.obtener_lote(conn, str(data.lote_id))
        if not lote:
            raise LoteNotFoundError(str(data.lote_id))
        if str(lote.get("usuario_id")) != str(usuario_id):
            raise AuthorizationError(
                "El lote no pertenece al usuario autenticado."
            )

    levantamiento = await repo.crear_levantamiento(
        conn,
        usuario_id,
        lote_id=data.lote_id,
        nombre=data.nombre,
        observaciones=data.observaciones,
        client_operation_id=data.client_operation_id,
    )
    await conn.commit()
    return levantamiento


async def listar_levantamientos(
    conn, usuario_id: str
) -> List[Dict[str, Any]]:
    """Levantamientos del usuario autenticado."""
    return await repo.listar_levantamientos_usuario(conn, usuario_id)


async def obtener_levantamiento(
    conn, levantamiento_id: UUID, usuario_id: str
) -> Dict[str, Any]:
    """Levantamiento completo con sus vértices ordenados."""
    levantamiento = await repo.obtener_levantamiento_completo(
        conn, levantamiento_id, usuario_id
    )
    if not levantamiento:
        raise ResourceNotFoundError("Levantamiento", levantamiento_id)
    return levantamiento


async def agregar_puntos(
    conn,
    levantamiento_id: UUID,
    usuario_id: str,
    puntos: List[PuntoGPSCaptura],
) -> List[Dict[str, Any]]:
    """
    Anexa vértices GPS al levantamiento (solo en 'borrador').

    Idempotencia (offline-first, decisión B1 de la auditoría M2):
    - `orden` repetido dentro del lote → 422 (solicitud ambigua).
    - `orden` ya persistido con las mismas coordenadas → se omite y se
      devuelve la fila existente (reintento tras desconexión es seguro).
    - `orden` ya persistido con coordenadas distintas → 409 (conflicto
      real: mismo orden, captura diferente).
    """
    levantamiento = await repo.obtener_levantamiento(
        conn, levantamiento_id, usuario_id
    )
    if not levantamiento:
        raise ResourceNotFoundError("Levantamiento", levantamiento_id)
    if levantamiento["estado"] != "borrador":
        raise OperationNotAllowedError(
            "agregar_puntos",
            f"el levantamiento está en estado "
            f"'{levantamiento['estado']}'",
        )

    # Tolerancia de comparación: ~1 cm — cubre el redondeo REAL→float
    # de bases aún sin la migración a DOUBLE PRECISION.
    _EPSILON_COORD = 1e-7

    existentes = {
        p["orden"]: p
        for p in await repo.obtener_puntos(conn, levantamiento_id, usuario_id)
    }

    vistos = set()
    nuevos: List[PuntoGPSCaptura] = []
    repetidos: List[Dict[str, Any]] = []
    for p in puntos:
        if p.orden in vistos:
            raise ValidationError(
                f"orden {p.orden} repetido dentro del mismo lote de puntos",
                field="puntos",
            )
        vistos.add(p.orden)

        existente = existentes.get(p.orden)
        if existente is None:
            nuevos.append(p)
        elif (
            abs(float(existente["latitud"]) - p.lat) <= _EPSILON_COORD
            and abs(float(existente["longitud"]) - p.lon) <= _EPSILON_COORD
        ):
            repetidos.append(existente)
        else:
            raise DuplicateResourceError(
                "Punto de levantamiento",
                f"orden {p.orden} con coordenadas diferentes",
            )

    vertices = [
        (p.orden, p.lat, p.lon, p.precision_gps_metros, p.fecha_hora)
        for p in nuevos
    ]
    insertados = await repo.agregar_puntos(
        conn, levantamiento_id, usuario_id, vertices
    )
    await conn.commit()
    return sorted(
        [*repetidos, *insertados], key=lambda p: p["orden"]
    )


async def calcular_area(
    conn, levantamiento_id: UUID, usuario_id: str
) -> Dict[str, Any]:
    """
    Calcula área y perímetro del polígono con geodesia.area_poligono
    (servicio existente, sin cambios) y persiste el resultado pasando
    el levantamiento a estado 'cerrado'.
    """
    levantamiento = await repo.obtener_levantamiento_completo(
        conn, levantamiento_id, usuario_id
    )
    if not levantamiento:
        raise ResourceNotFoundError("Levantamiento", levantamiento_id)
    if levantamiento["estado"] == "aplicado":
        raise OperationNotAllowedError(
            "calcular_area",
            "el levantamiento ya fue aplicado a un lote",
        )

    puntos = levantamiento["puntos"]
    if len(puntos) < 3:
        raise BusinessLogicError(
            "Se requieren al menos 3 puntos para calcular el polígono."
        )

    resultado = geodesia.area_poligono(
        [(p["latitud"], p["longitud"]) for p in puntos]
    )

    actualizado = await repo.guardar_resultado(
        conn,
        levantamiento_id,
        usuario_id,
        area_m2=resultado["area_m2"],
        perimetro_m=resultado["perimetro_m"],
        estado="cerrado",
    )
    if not actualizado:
        # El recurso desapareció entre la lectura y el UPDATE
        # (concurrencia): responde 404 en lugar de desempaquetar None.
        raise ResourceNotFoundError("Levantamiento", levantamiento_id)
    await conn.commit()

    return {**actualizado, "puntos": puntos}


async def aplicar_levantamiento(
    conn, levantamiento_id: UUID, usuario_id: str
) -> Dict[str, Any]:
    """
    Aplica el levantamiento a su lote: escribe el área calculada en
    `lotes.area_metros_cuadrados` (dato derivado) y pasa el
    levantamiento a 'aplicado'.

    Regla fundamental: los vértices GPS y el cálculo original quedan
    intactos en `mediciones_campo`/`levantamientos` — solo se
    actualiza el dato derivado del lote. La operación queda auditada
    en log.
    """
    levantamiento = await repo.obtener_levantamiento(
        conn, levantamiento_id, usuario_id
    )
    if not levantamiento:
        raise ResourceNotFoundError("Levantamiento", levantamiento_id)
    if levantamiento["estado"] != "cerrado":
        raise OperationNotAllowedError(
            "aplicar_levantamiento",
            f"el levantamiento está en estado '{levantamiento['estado']}' "
            "(se requiere 'cerrado')",
        )
    if levantamiento["lote_id"] is None:
        raise BusinessLogicError(
            "El levantamiento no tiene un lote asignado."
        )

    lote = await repo_fincas.actualizar_area_lote(
        conn,
        str(levantamiento["lote_id"]),
        usuario_id,
        float(levantamiento["area_m2"]),
    )
    if not lote:
        # El lote existía al crear el levantamiento pero ya no es del
        # usuario (finca reasignada): se bloquea igual que un ajeno.
        raise ResourceNotFoundError("Lote", levantamiento["lote_id"])

    actualizado = await repo.guardar_resultado(
        conn,
        levantamiento_id,
        usuario_id,
        area_m2=float(levantamiento["area_m2"]),
        perimetro_m=float(levantamiento["perimetro_m"]),
        estado="aplicado",
    )
    if not actualizado:
        raise ResourceNotFoundError("Levantamiento", levantamiento_id)
    await conn.commit()

    logger.info(
        "[LEVANTAMIENTO APLICADO] id=%s usuario=%s lote=%s "
        "area_m2=%s (vertices conservados)",
        levantamiento_id, usuario_id, lote["id"], lote["area_metros_cuadrados"],
    )

    return {**actualizado, "puntos": await repo.obtener_puntos(
        conn, levantamiento_id, usuario_id
    )}
