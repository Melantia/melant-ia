from pydantic import BaseModel, Field
from typing import Optional

class RegistroRequest(BaseModel):
    identificador_unico: str = Field(..., example="0912345678")
    nombre: str = Field(..., example="Juan Perez")
    acepta_politica_privacidad: bool = Field(..., example=True)
    provincia: Optional[str] = Field(None, example="Manabí")

class RegistroResponse(BaseModel):
    status: Optional[str]
    estado: Optional[str]
    mensaje: str
    perfil_final: Optional[dict]

class RenovacionRequest(BaseModel):
    identificador_unico: str = Field(..., example="0912345678")
    tipo_plan: str = Field(..., example="activo_familiar")

class RenovacionResponse(BaseModel):
    status: Optional[str]
    estado: Optional[str]
    mensaje: str
    monto_pagado_usd: Optional[float]
    perfil_final: Optional[dict]
