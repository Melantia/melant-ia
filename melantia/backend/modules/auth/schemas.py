# backend/modules/auth/schemas.py
"""Schemas del módulo de autenticación."""
from typing import Optional

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    cedula_ruc: str = Field(..., min_length=5, max_length=20)
    password: str = Field(..., min_length=1, max_length=128)
    # identificación mínima de dispositivo (F7a §6): el id se
    # reutiliza si es conocido del usuario; el nombre solo etiqueta
    dispositivo_id: Optional[str] = Field(None, max_length=40)
    dispositivo_nombre: Optional[str] = Field(None, max_length=100)


class RegistroRequest(BaseModel):
    """Registro vía saga Supabase (D4.2 §7.2) — el canónico fiscal
    se calcula server-side; `acepto_politicas` es obligatorio."""
    nombre: str = Field(..., min_length=2, max_length=150)
    cedula_ruc: str = Field(..., min_length=5, max_length=20)
    password: str = Field(..., min_length=6, max_length=128)
    sector_comunidad: str = Field(..., min_length=1, max_length=150)
    contacto: Optional[str] = Field(None, max_length=100)
    provincia_id: Optional[int] = None
    canton_id: Optional[int] = None
    parroquia_id: Optional[int] = None
    acepto_politicas: bool = Field(...)
    dispositivo_id: Optional[str] = Field(None, max_length=40)
    dispositivo_nombre: Optional[str] = Field(None, max_length=100)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=10, max_length=4096)


class TokenSupabaseResponse(BaseModel):
    """Respuesta de login (D4.2 §8 paso 6) — jamás incluye el email
    sintético ni auth.users.id."""
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "bearer"
    usuario_id: str
    nombre: str
    dispositivo_id: str


class RefreshTokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "bearer"


class RegistroResponse(BaseModel):
    """Alta + signIn inmediato; si el signIn falla la cuenta queda
    creada igualmente (§7.3) y el cliente debe hacer /login."""
    usuario_id: str
    nombre: str
    registrado: bool = True
    requiere_login: bool = False
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None
    token_type: str = "bearer"
    dispositivo_id: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario_id: str
    nombre: str


class UsuarioResponse(BaseModel):
    id: str
    nombre: str
    cedula_ruc: str
    sector_comunidad: str
