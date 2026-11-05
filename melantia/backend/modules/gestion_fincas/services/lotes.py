# backend/modules/gestion_fincas/services/lotes.py
"""
Servicio de lotes del Módulo 3.

Los lotes siempre cuelgan de una finca: la propiedad se verifica en la
finca padre antes de cualquier lectura o escritura. Lote ajeno o
inexistente → 404 indistinguible (LoteNotFoundError); finca ajena →
404 de la finca (FincaNotFoundError).
"""
import logging
from typing import Any, Dict, List
from uuid import UUID

from core.exceptions import LoteNotFoundError, ValidationError
from modules.gestion_fincas.schemas.lotes import LoteCreate, LoteUpdate
from modules.gestion_fincas.services.fincas import (
    _emitir_changelog,
    _finca_propia,
)
from shared.repositories import fincas as repo

logger = logging.getLogger("melantia.lotes")


async def listar_lotes(
    conn, finca_id: UUID, usuario_id: str
) -> List[Dict[str, Any]]:
    """Lotes de una finca propia (verifica propiedad vía la finca)."""
    await _finca_propia(conn, finca_id, usuario_id)
    return await repo.listar_lotes_finca(conn, str(finca_id))


async def crear_lote(
    conn, finca_id: UUID, usuario_id: str, data: LoteCreate
) -> Dict[str, Any]:
    """Crea un lote en una finca del usuario autenticado."""
    await _finca_propia(conn, finca_id, usuario_id)
    campos = data.model_dump(exclude_unset=True)
    nuevo = await repo.insertar_lote(conn, str(finca_id), campos)
    # I-5: changelog atómico con el INSERT.
    await _emitir_changelog(conn, usuario_id, "lote", nuevo["id"])
    await conn.commit()
    logger.info(
        "[LOTES] lote %s creado en finca %s por %s",
        nuevo["id"], finca_id, usuario_id,
    )
    return nuevo


async def actualizar_lote(
    conn, finca_id: UUID, lote_id: UUID, usuario_id: str,
    data: LoteUpdate,
) -> Dict[str, Any]:
    """
    UPDATE parcial de un lote. Doble alcance: el lote debe colgar de
    la finca de la ruta y la finca debe ser del usuario.
    """
    campos = data.model_dump(exclude_unset=True)
    if not campos:
        raise ValidationError("Ningún campo a actualizar")

    await _finca_propia(conn, finca_id, usuario_id)
    fila = await repo.actualizar_lote(
        conn, str(lote_id), str(finca_id), campos
    )
    if not fila:
        raise LoteNotFoundError(str(lote_id))
    # I-5: changelog atómico con el UPDATE (version ya incrementada).
    await _emitir_changelog(conn, usuario_id, "lote", lote_id)
    await conn.commit()
    logger.info(
        "[LOTES] lote %s de finca %s actualizado por %s",
        lote_id, finca_id, usuario_id,
    )
    return fila
