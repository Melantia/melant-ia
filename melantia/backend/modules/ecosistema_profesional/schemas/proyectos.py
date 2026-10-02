# backend/modules/ecosistema_profesional/schemas/proyectos.py
"""Schemas de proyectos EP y concesiones (EP-4E-D).

Enums reflejan los CHECK del DDL: recurso_tipo (8 valores) y nivel
('consulta','crear','editar' — 'administrar' nunca se concede, E2).
"""
from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

RecursoTipo = Literal[
    "finca", "lote", "levantamiento", "registro",
    "actividad", "documento", "presupuesto", "resultado",
]
NivelConcesion = Literal["consulta", "crear", "editar"]
EstadoProyecto = Literal[
    "borrador", "activo", "en_pausa", "cerrado", "archivado"
]
EstadoConcesion = Literal["activa", "revocada"]


class ProyectoResponse(BaseModel):
    id: UUID
    workspace_id: Optional[UUID] = None
    nombre: str
    descripcion: Optional[str] = None
    estado: EstadoProyecto
    mi_nivel: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class LoteContextualResponse(BaseModel):
    """Lote leído a través del contexto del proyecto (E5)."""
    id: UUID
    finca_id: UUID
    nombre_lote: str
    cultivo_principal: Optional[str] = None
    area_metros_cuadrados: Optional[float] = None
    estado_salud_lote: Optional[str] = None
    contexto: str
    mi_nivel: str


class ConcesionCreate(BaseModel):
    """Otorgar concesión a un USUARIO participante activo del proyecto."""
    usuario_id: UUID
    recurso_tipo: RecursoTipo
    recurso_id: Optional[UUID] = None   # NULL = todo el tipo
    nivel: NivelConcesion
    vigente_hasta: Optional[datetime] = None


class ConcesionResponse(BaseModel):
    id: UUID
    proyecto_id: UUID
    participante_id: UUID
    recurso_tipo: str
    recurso_id: Optional[UUID] = None
    nivel: str
    estado: EstadoConcesion
    otorgado_por: Optional[UUID] = None
    vigente_hasta: Optional[datetime] = None
    revocado_por: Optional[UUID] = None
    revocado_at: Optional[datetime] = None
    created_at: datetime


# ============================================================================
# PARTICIPANTES — ciclo de vida (EP-4E-E)
# ============================================================================

class ParticipanteResponse(BaseModel):
    """Participación tras remover/reactivar."""
    id: UUID
    proyecto_id: UUID
    usuario_id: UUID
    rol: str
    estado: Literal["invitado", "activo", "removido"]
    concesiones_revocadas: int = 0   # informado al remover (E1)
    asignado_por: Optional[UUID]
    created_at: datetime
