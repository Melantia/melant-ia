# backend/modules/sync/routes/sync.py
"""
Endpoint de push del protocolo de sincronización (incremento I-2).

HTTP 200 siempre que el sobre sea válido: los resultados individuales
por operación van en el cuerpo (applied/duplicate/conflict/error),
conforme a docs §4.3 — un lote no es atómico ni todo-o-nada.
"""
from fastapi import APIRouter, Depends

from core.dependencies import get_db
from modules.sync.auth import SyncIdentity, get_sync_identity
from modules.sync.schemas import SyncPushRequest, SyncPushResponse
from modules.sync.services import push as svc

router = APIRouter(prefix="/sync", tags=["Sincronización"])


@router.post("/push", response_model=SyncPushResponse)
async def push(
    data: SyncPushRequest,
    identidad: SyncIdentity = Depends(get_sync_identity),
    db=Depends(get_db),
):
    """
    Acepta un lote de operaciones offline del dispositivo.

    Identidad: get_sync_identity recorre la verificación real del
    token (solo Supabase — los legacy no tienen sesión verificable)
    y devuelve la sesión EXACTA del token; el service la ata al
    device_id del sobre (H-1). Cada operación se procesa en su
    propia transacción.
    """
    conn, _ = db
    return await svc.procesar_push(
        conn, identidad.usuario_id, identidad.session_id, data
    )
