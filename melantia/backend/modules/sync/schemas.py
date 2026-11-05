# backend/modules/sync/schemas.py
"""
Contrato del endpoint de sincronización — docs §4.2/§4.3.

Incremento I-2 (create-only): entity_type ∈ {finca, lote},
action ∈ {create} — la allowlist se verifica POR OPERACIÓN en el
servicio (resultado 'error' por op, no rechazo del sobre): los
campos se tipan como str para que una op no soportada llegue al
servicio y produzca su propio resultado.

Identidad: el sobre NUNCA lleva usuario_id ni scope — se derivan
del JWT. entity_id es el UUID asignado por el móvil (PK cliente,
m8/m9 son UUID nativos).
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


class SyncOperation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    client_operation_id: UUID
    entity_type: str = Field(..., min_length=1, max_length=50)
    entity_id: UUID
    action: str = Field(..., min_length=1, max_length=10)
    base_version: Optional[int] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    client_created_at: Optional[datetime] = None

    @model_validator(mode="after")
    def _base_version_segun_accion(self):
        """create: no tiene versión previa que comparar —
        base_version debe venir omitido o null (B-2).
        update (I-6): la concurrencia optimista exige declarar la
        versión que el dispositivo conoció — sin ella el servidor
        no puede detectar modificaciones concurrentes."""
        if self.action == "create" and self.base_version is not None:
            raise ValueError(
                "base_version no aplica a operaciones create"
            )
        if self.action in ("update", "delete") and (
            self.base_version is None
        ):
            raise ValueError(
                "base_version es obligatoria en update/delete"
            )
        return self


class SyncPushRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    device_id: UUID
    operations: List[SyncOperation] = Field(
        ..., min_length=1, max_length=50
    )


class SyncOpResult(BaseModel):
    client_operation_id: UUID
    status: str  # 'applied' | 'duplicate' | 'conflict' | 'error'
    entity_id: Optional[UUID] = None
    server_version: Optional[int] = None
    code: Optional[str] = None
    detail: Optional[str] = None
    server_state: Optional[Dict[str, Any]] = None


class SyncPushResponse(BaseModel):
    results: List[SyncOpResult]
    pull_cursor_hint: Optional[int] = None


# ============================================================================
# PULL — descarga incremental del changelog (I-4)
# ============================================================================
#
# Contrato §4.5 del diseño: cada change es una fila de sync_cambios.
# `scope`/`actor_id`/`created_at` no se exponen: el scope ya es el
# del token, el actor no es necesario para aplicar el cambio y `seq`
# ya ordena. `op` admite los valores del DDL ('upsert','delete');
# hoy solo existen 'upsert' — no se inventan eventos delete.


class SyncChange(BaseModel):
    seq: int
    entity_type: str
    entity_id: UUID
    op: str
    data: Optional[Dict[str, Any]] = None
    entity_version: Optional[int] = None


class SyncPullResponse(BaseModel):
    changes: List[SyncChange]
    next_cursor: int
    has_more: bool
