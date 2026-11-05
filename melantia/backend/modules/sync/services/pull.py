# backend/modules/sync/services/pull.py
"""
Servicio de pull del protocolo de sincronización — incremento I-4.

Descarga incremental del changelog por scope: el dispositivo envía el
cursor de la última secuencia que ya persistió en su transacción
local y recibe los eventos confirmados posteriores, en orden.

Vínculo H-1 (mismo patrón que push): la sesión EXACTA del token
(auth_session_id verificado) debe estar activa, no vencida, ser del
usuario y pertenecer al dispositivo declarado en el query.

Cursor (Alternativa B — ACK implícito): el `cursor` recibido es la
confirmación del cliente; el servidor NO da por persistida la página
que está devolviendo. `dispositivos.ultimo_pull_seq` se actualiza
solo con ese cursor recibido — monótono (GREATEST) y acotado por el
máximo confirmado del scope.

Sin purga ni retención implementadas: no existe `min_seq` ni snapshot
de resync — todo cursor 0..last_seq es recuperable. La detección de
cursor obsoleto y `requires_full_resync` quedan diferidos a la
política de retención (documentado, no implementado).
"""
from typing import Optional

from fastapi import HTTPException, status
from uuid import UUID

from core.exceptions import (
    AuthenticationError,
    ResourceNotFoundError,
)
from modules.sync.schemas import (
    SyncChange,
    SyncPullResponse,
)
from shared.repositories import sync as sync_repo


async def procesar_pull(
    conn,
    usuario_id: str,
    session_id: UUID,
    device_id: UUID,
    cursor: int,
    limit: int,
) -> SyncPullResponse:
    """
    Valida el sobre autenticado y devuelve la página incremental.

    Errores del sobre (propagados, no por evento):
    - sesión inexacta/inactiva/vencida → 401
    - dispositivo ≠ sesión, ajeno, inactivo o inexistente → 404
      indistinguible
    - cursor > máximo confirmado del scope → 409 `future_cursor`
      (sin servir eventos ni tocar metadatos del dispositivo)
    """
    sesion = await sync_repo.sesion_autenticada_activa(
        conn, session_id, usuario_id
    )
    if not sesion:
        raise AuthenticationError(
            "Sesión inactiva o inexistente para esta credencial"
        )

    if str(sesion["dispositivo_id"]) != str(device_id):
        raise ResourceNotFoundError("Dispositivo", str(device_id))

    dispositivo = await sync_repo.dispositivo_activo_de_usuario(
        conn, device_id, usuario_id
    )
    if not dispositivo:
        raise ResourceNotFoundError("Dispositivo", str(device_id))

    # Scope server-side — jamás del cliente.
    scope = sync_repo.scope_de_usuario(usuario_id)

    # Máximo confirmado del scope (asignador transaccional).
    # last_seq es el MÁXIMO — nunca el mínimo retenido; sin purga
    # implementada no hay cursor obsoleto detectable.
    last_seq = await sync_repo.ultimo_seq(conn, scope)
    max_seq = last_seq if last_seq is not None else 0

    if cursor > max_seq:
        # El cliente declara un estado que el servidor jamás emitió:
        # error controlado sin servir datos ni tocar metadatos.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="future_cursor",
        )

    # Página: limit+1 para detectar has_more sin perder seqs.
    filas = await sync_repo.cambios_desde_cursor(
        conn, scope, cursor, limit + 1
    )
    has_more = len(filas) > limit
    pagina = filas[:limit]

    changes = [
        SyncChange(
            seq=int(f["seq"]),
            entity_type=f["entity_type"],
            entity_id=f["entity_id"],
            op=f["op"],
            data=f["data"],
            entity_version=(
                int(f["entity_version"])
                if f["entity_version"] is not None
                else None
            ),
        )
        for f in pagina
    ]
    next_cursor = changes[-1].seq if changes else cursor

    # ACK: solo el cursor RECIBIDO (lo que el cliente ya persistió),
    # nunca next_cursor — la página entregada aún no está confirmada.
    # Monótono por dispositivo y con tope en max_seq.
    await sync_repo.confirmar_pull_seq(
        conn, device_id, cursor, max_seq
    )

    # §9.1: el pull también actualiza last_seen_at del dispositivo.
    await sync_repo.registrar_uso_dispositivo(conn, device_id)

    await conn.commit()

    return SyncPullResponse(
        changes=changes,
        next_cursor=next_cursor,
        has_more=has_more,
    )
