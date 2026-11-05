# backend/modules/gestion_fincas/services/fincas.py
"""
Servicio de fincas del Módulo 3.

Coordina: router -> este servicio -> shared/repositories/{fincas,
geografia}. Mismas reglas de aislamiento que EP:

- Identidad solo vía get_current_user; el frontend nunca envía
  usuario_id (los schemas lo rechazan con extra="forbid").
- Recurso ajeno o inexistente → 404 indistinguible (FincaNotFoundError):
  no se revela la existencia de fincas de otros usuarios.
- Ubicación coherente con la jerarquía DPA/INEC: la parroquia deriva
  cantón y provincia cuando no se envían; si se envían, deben
  corresponder — si no, 422 VALIDATION_ERROR.
- Sin escrituras a audit_eventos: los writers llegan con ADM-2.
"""
import logging
from typing import Any, Dict, Optional, Tuple
from uuid import UUID

from core.exceptions import (
    FincaNotFoundError,
    ValidationError,
)
from modules.gestion_fincas.schemas.fincas import (
    FincaCreate,
    FincaUpdate,
)
from shared.repositories import fincas as repo
from shared.repositories import geografia as geo_repo
from shared.repositories import sync as sync_repo

logger = logging.getLogger("melantia.fincas")


async def _resolver_geo(
    conn,
    provincia_id: Optional[int],
    canton_id: Optional[int],
    parroquia_id: Optional[int],
) -> Tuple[Optional[int], Optional[int], Optional[int]]:
    """
    Normaliza la jerarquía ubicación. Los niveles superiores ausentes
    se derivan del nivel más profundo; los presentes se validan por
    correspondencia real (FK del catálogo, no solo prefijo INEC).

    Raises:
        ValidationError: id inexistente en el catálogo o niveles
        incoherentes entre sí.
    """
    if parroquia_id is not None:
        parroquia = await geo_repo.obtener_parroquia(conn, parroquia_id)
        if not parroquia:
            raise ValidationError(
                "parroquia_id no existe en el catálogo geográfico",
                field="parroquia_id",
            )
        if canton_id is not None and canton_id != parroquia["canton_id"]:
            raise ValidationError(
                "parroquia_id no pertenece al canton_id indicado",
                field="parroquia_id",
            )
        canton_id = parroquia["canton_id"]

    if canton_id is not None:
        canton = await geo_repo.obtener_canton(conn, canton_id)
        if not canton:
            raise ValidationError(
                "canton_id no existe en el catálogo geográfico",
                field="canton_id",
            )
        if (
            provincia_id is not None
            and provincia_id != canton["provincia_id"]
        ):
            raise ValidationError(
                "canton_id no pertenece al provincia_id indicado",
                field="canton_id",
            )
        provincia_id = canton["provincia_id"]

    if provincia_id is not None:
        provincia = await geo_repo.obtener_provincia(conn, provincia_id)
        if not provincia:
            raise ValidationError(
                "provincia_id no existe en el catálogo geográfico",
                field="provincia_id",
            )

    return provincia_id, canton_id, parroquia_id


async def _finca_propia(
    conn, finca_id: UUID, usuario_id: str
) -> Dict[str, Any]:
    """Finca completa si es del usuario; si no → 404 indistinguible."""
    finca = await repo.obtener_finca_completa(conn, str(finca_id))
    if not finca or str(finca["usuario_id"]) != str(usuario_id):
        raise FincaNotFoundError(str(finca_id))
    return finca


async def crear_finca(
    conn, usuario_id: str, data: FincaCreate
) -> Dict[str, Any]:
    """Crea la finca del usuario autenticado."""
    campos = data.model_dump(exclude_unset=True)
    prov, cant, parr = await _resolver_geo(
        conn,
        campos.pop("provincia_id", None),
        campos.pop("canton_id", None),
        campos.pop("parroquia_id", None),
    )
    campos.update(
        {"provincia_id": prov, "canton_id": cant, "parroquia_id": parr}
    )
    campos = {k: v for k, v in campos.items() if v is not None}
    nueva = await repo.insertar_finca(conn, usuario_id, campos)
    # I-5: el evento del changelog confirma en la MISMA transacción
    # que la finca — snapshot post-escritura compatible con pull.
    await _emitir_changelog(conn, usuario_id, "finca", nueva["id"])
    await conn.commit()
    logger.info(
        "[FINCAS] finca %s creada por usuario %s", nueva["id"], usuario_id
    )
    return await repo.obtener_finca_completa(conn, str(nueva["id"]))


async def listar_mias(conn, usuario_id: str) -> list:
    """Fincas del usuario con conteos de lotes y hatos."""
    return await repo.listar_fincas_usuario_resumen(conn, usuario_id)


async def obtener_finca(
    conn, finca_id: UUID, usuario_id: str
) -> Dict[str, Any]:
    """Detalle de una finca propia con sus lotes."""
    finca = await _finca_propia(conn, finca_id, usuario_id)
    finca["lotes"] = await repo.listar_lotes_finca(conn, str(finca_id))
    return finca


async def actualizar_finca(
    conn, finca_id: UUID, usuario_id: str, data: FincaUpdate
) -> Dict[str, Any]:
    """
    UPDATE parcial de campos permitidos. `usuario_id` no forma parte
    del schema: el propietario no puede cambiar por esta vía.
    """
    campos = data.model_dump(exclude_unset=True)
    if not campos:
        raise ValidationError("Ningún campo a actualizar")

    geo_keys = {"provincia_id", "canton_id", "parroquia_id"}
    if geo_keys & campos.keys():
        actual = await _finca_propia(conn, finca_id, usuario_id)
        prov, cant, parr = await _resolver_geo(
            conn,
            campos.get("provincia_id", actual["provincia_id"]),
            campos.get("canton_id", actual["canton_id"]),
            campos.get("parroquia_id", actual["parroquia_id"]),
        )
        campos.update(
            {
                "provincia_id": prov,
                "canton_id": cant,
                "parroquia_id": parr,
            }
        )

    fila = await repo.actualizar_finca(
        conn, str(finca_id), usuario_id, campos
    )
    if not fila:
        raise FincaNotFoundError(str(finca_id))
    # I-5: changelog atómico con el UPDATE (version ya incrementada).
    await _emitir_changelog(conn, usuario_id, "finca", finca_id)
    await conn.commit()
    logger.info("[FINCAS] finca %s actualizada por %s", finca_id, usuario_id)
    return await repo.obtener_finca_completa(conn, str(finca_id))


async def _emitir_changelog(
    conn, usuario_id: str, entity_type: str, entity_id
) -> None:
    """
    Registra el evento 'upsert' de una escritura Web en sync_cambios
    (I-5). Snapshot completo post-escritura — mismo contrato que los
    eventos del push, consumible por GET /api/v1/sync/pull. La
    secuencia y la fila confirman junto al dominio en el commit del
    caller: si algo falla, ni entidad, ni changelog, ni seq quedan.
    """
    scope = sync_repo.scope_de_usuario(usuario_id)
    fila = (
        await sync_repo.fila_finca(conn, entity_id)
        if entity_type == "finca"
        else await sync_repo.fila_lote(conn, entity_id)
    )
    await sync_repo.emitir_upsert(
        conn,
        scope,
        entity_type,
        fila["id"],
        fila,
        fila.get("version"),
        usuario_id,
    )
