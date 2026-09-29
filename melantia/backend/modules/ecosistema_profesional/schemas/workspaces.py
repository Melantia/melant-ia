# backend/modules/ecosistema_profesional/schemas/workspaces.py
"""Schemas de workspaces del EP (EP-4B).

Rol de miembro y estados reflejan los CHECK del DDL:
rol (propietario/socio/colaborador), estado (invitado/activo/removido).
"""
from datetime import datetime
from typing import List, Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

RolWorkspace = Literal["propietario", "socio", "colaborador"]
EstadoMiembro = Literal["invitado", "activo", "removido"]
EstadoWorkspace = Literal["activo", "archivado"]


class WorkspaceCreate(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=150)
    descripcion: Optional[str] = Field(None, max_length=2000)


class WorkspaceUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=150)
    descripcion: Optional[str] = Field(None, max_length=2000)


class WorkspaceResponse(BaseModel):
    id: UUID
    nombre: str
    descripcion: Optional[str] = None
    estado: EstadoWorkspace
    propietario_id: UUID
    mi_rol: Optional[RolWorkspace] = None
    created_at: datetime
    updated_at: datetime


class MiembroResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    usuario_id: UUID
    rol: RolWorkspace
    estado: EstadoMiembro
    usuario_nombre: Optional[str] = None
    created_at: datetime


class WorkspaceDetalleResponse(WorkspaceResponse):
    miembros: List[MiembroResponse] = []


class InvitarMiembroRequest(BaseModel):
    """Invitación por UUID del usuario (FK real — regla EP-4A)."""
    usuario_id: UUID
    rol: RolWorkspace = "colaborador"


class ActualizarMiembroRequest(BaseModel):
    rol: Optional[RolWorkspace] = None
    estado: Optional[EstadoMiembro] = None
