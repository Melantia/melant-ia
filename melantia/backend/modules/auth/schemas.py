# backend/modules/auth/schemas.py
"""Schemas del módulo de autenticación."""
from typing import Optional

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    cedula_ruc: str = Field(..., min_length=5, max_length=20)
    password: str = Field(..., min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario_id: str
    nombre: str


class RegistroRequest(BaseModel):
    """Registro mínimo de productor con credenciales locales."""
    nombre: str = Field(..., min_length=2, max_length=150)
    cedula_ruc: str = Field(..., min_length=5, max_length=20)
    password: str = Field(..., min_length=6, max_length=128)
    sector_comunidad: str = Field(..., min_length=1, max_length=150)
    contacto: Optional[str] = Field(None, max_length=100)
    provincia_id: Optional[int] = None
    canton_id: Optional[int] = None
    parroquia_id: Optional[int] = None


class UsuarioResponse(BaseModel):
    id: str
    nombre: str
    cedula_ruc: str
    sector_comunidad: str
