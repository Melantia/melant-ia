# backend/modules/asistente_tecnico/routes/contexto.py
"""
Contexto productivo del asistente (base del ítem 1 — Consulta Técnica).

Endpoints autenticados con JWT: el usuario solo ve su propio
contexto (fincas/lotes leídos vía shared.repositories.fincas).
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from core.dependencies import get_current_user, get_db
from modules.asistente_tecnico.context import ContextService

router = APIRouter(
    prefix="/contexto", tags=["Asistente: Contexto Productivo"]
)


@router.get("/fincas")
async def mis_fincas(
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Fincas del usuario autenticado con sus lotes y cabezas de ganado."""
    conn, _ = db
    return await ContextService.contexto_usuario(conn, usuario_id)


@router.get("/lotes/{lote_id}")
async def contexto_lote(
    lote_id: UUID,
    usuario_id: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Contexto de un lote del usuario autenticado."""
    conn, _ = db
    contexto = await ContextService.contexto_lote(conn, str(lote_id))

    # Lote inexistente o ajeno: misma respuesta 404 (no se revela si
    # el recurso existe para otro usuario — patrón del servicio de
    # levantamientos, decisión C6 de la auditoría M2).
    if not contexto or str(contexto["lote"].get("usuario_id")) != usuario_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote no encontrado.",
        )

    return contexto
