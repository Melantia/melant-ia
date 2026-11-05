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
    def _base_version_no_aplica_a_create(self):
        """Un create no tiene versión previa que comparar:
        base_version debe venir omitido o null. Rechazarlo aquí
        (422 del sobre) evita que el hash de idempotencia varíe por
        un campo sin significado (B-2)."""
        if self.action == "create" and self.base_version is not None:
            raise ValueError(
                "base_version no aplica a operaciones create"
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


class SyncPushResponse(BaseModel):
    results: List[SyncOpResult]
    pull_cursor_hint: Optional[int] = None
