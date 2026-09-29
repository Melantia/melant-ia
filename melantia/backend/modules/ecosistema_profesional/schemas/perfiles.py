# backend/modules/ecosistema_profesional/schemas/perfiles.py
"""Schemas de identidad profesional (EP-4A).

`perfil_id` es siempre el UUID real de `perfiles_profesionales` — el
`codigo` solo identifica el perfil semánticamente en respuestas.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class PerfilProfesionalResponse(BaseModel):
    """Un perfil del catálogo profesional."""
    id: UUID
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    created_at: datetime


class AsignarPerfilRequest(BaseModel):
    """Asignación de un perfil por su UUID (FK real)."""
    perfil_id: UUID


class PerfilAsignadoResponse(BaseModel):
    """Asignación usuario↔perfil con los datos del catálogo."""
    asignacion_id: UUID
    perfil_id: UUID
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    verificado: bool
    principal: bool
    created_at: datetime
