# backend/core/security.py
"""
Módulo de seguridad centralizado de MELANTIA.

Proporciona métodos base para:
- Generación y verificación de tokens JWT
- Hashing y verificación de contraseñas con bcrypt
- Integración con Supabase Auth
- Validación de permisos y roles
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from core.config import settings


# ============================================================================
# CONFIGURACIÓN DE HASHING DE CONTRASEÑAS
# ============================================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============================================================================
# CONFIGURACIÓN DE JWT
# ============================================================================

# Clave secreta para JWT (en producción debe venir de variable de entorno)
SECRET_KEY = os.getenv("MELANTIA_JWT_SECRET_KEY", "melantia_secret_key_change_in_production_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


# ============================================================================
# GESTIÓN DE CONTRASEÑAS
# ============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si una contraseña en texto plano coincide con el hash almacenado.

    Args:
        plain_password: Contraseña en texto plano
        hashed_password: Hash de la contraseña almacenado

    Returns:
        True si la contraseña es correcta, False en caso contrario
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Genera el hash de una contraseña usando bcrypt.

    Args:
        password: Contraseña en texto plano

    Returns:
        Hash de la contraseña
    """
    return pwd_context.hash(password)


# ============================================================================
# GESTIÓN DE TOKENS JWT
# ============================================================================

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token JWT de acceso.

    Args:
        data: Datos a incluir en el token (payload)
        expires_delta: Tiempo de expiración personalizado (opcional)

    Returns:
        Token JWT codificado
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodifica y verifica un token JWT.

    Args:
        token: Token JWT a decodificar

    Returns:
        Payload del token si es válido, None si es inválido o expiró
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_token(token: str) -> bool:
    """
    Verifica si un token JWT es válido.

    Args:
        token: Token JWT a verificar

    Returns:
        True si el token es válido, False en caso contrario
    """
    payload = decode_access_token(token)
    return payload is not None


# ============================================================================
# EXTRACCIÓN DE INFORMACIÓN DEL TOKEN
# ============================================================================

def get_user_id_from_token(token: str) -> Optional[str]:
    """
    Extrae el ID de usuario de un token JWT.

    Args:
        token: Token JWT

    Returns:
        ID del usuario si el token es válido, None en caso contrario
    """
    payload = decode_access_token(token)
    if payload:
        return payload.get("sub")
    return None


def get_token_payload(token: str) -> Optional[Dict[str, Any]]:
    """
    Obtiene el payload completo de un token JWT.

    Args:
        token: Token JWT

    Returns:
        Payload completo del token si es válido, None en caso contrario
    """
    return decode_access_token(token)


# ============================================================================
# INTEGRACIÓN CON SUPABASE AUTH
# ============================================================================

class SupabaseAuth:
    """
    Cliente de autenticación de Supabase.

    Proporciona métodos para interactuar con el sistema de autenticación
    de Supabase cuando está configurado.
    """

    def __init__(self):
        self.url = settings.supabase_url
        self.service_role_key = settings.supabase_service_role_key
        self.anon_key = settings.supabase_anon_key
        self.is_configured = bool(self.url and self.service_role_key)

    def is_available(self) -> bool:
        """Verifica si Supabase Auth está configurado."""
        return self.is_configured

    def get_auth_headers(self) -> Dict[str, str]:
        """
        Genera los headers de autenticación para Supabase.

        Returns:
            Diccionario con headers de autenticación
        """
        if not self.is_configured:
            raise RuntimeError("Supabase Auth no está configurado")

        return {
            "apikey": self.service_role_key,
            "Authorization": f"Bearer {self.service_role_key}",
            "Content-Type": "application/json"
        }

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene información de usuario desde Supabase usando un token.

        Args:
            token: Token de acceso de Supabase

        Returns:
            Información del usuario si el token es válido, None en caso contrario

        Note:
            Este método requiere implementación con requests o httpx
            para comunicarse con la API de Supabase.
        """
        # TODO: Implementar llamada a la API de Supabase Auth
        # Este es un placeholder para la implementación futura
        if not self.is_configured:
            return None

        # Ejemplo de implementación futura:
        # import requests
        # response = requests.get(
        #     f"{self.url}/auth/v1/user",
        #     headers={"Authorization": f"Bearer {token}"}
        # )
        # return response.json() if response.status_code == 200 else None

        return None


# ============================================================================
# INSTANCIA GLOBAL DE SUPABASE AUTH
# ============================================================================

supabase_auth = SupabaseAuth()


# ============================================================================
# UTILIDADES DE SEGURIDAD
# ============================================================================

def sanitize_input(input_string: str, max_length: int = 1000) -> str:
    """
    Sanitiza una entrada de texto para prevenir inyección de código.

    Args:
        input_string: Texto a sanitizar
        max_length: Longitud máxima permitida

    Returns:
        Texto sanitizado
    """
    if not input_string:
        return ""

    # Truncar a longitud máxima
    sanitized = input_string[:max_length]

    # Eliminar caracteres potencialmente peligrosos
    # (esta es una sanitización básica, para producción usar librerías especializadas)
    dangerous_chars = ['<', '>', '"', "'", '&', '{', '}', '(', ')']
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, '')

    return sanitized.strip()


def validate_email(email: str) -> bool:
    """
    Valida básicamente el formato de un email.

    Args:
        email: Email a validar

    Returns:
        True si el formato parece válido, False en caso contrario
    """
    if not email or '@' not in email:
        return False

    parts = email.split('@')
    if len(parts) != 2 or not parts[0] or not parts[1]:
        return False

    return '.' in parts[1]


# ============================================================================
# EXPORTACIONES
# ============================================================================

__all__ = [
    # Contraseñas
    'verify_password',
    'get_password_hash',
    # Tokens JWT
    'create_access_token',
    'decode_access_token',
    'verify_token',
    'get_user_id_from_token',
    'get_token_payload',
    # Supabase Auth
    'SupabaseAuth',
    'supabase_auth',
    # Utilidades
    'sanitize_input',
    'validate_email',
    # Configuración
    'SECRET_KEY',
    'ALGORITHM',
    'ACCESS_TOKEN_EXPIRE_MINUTES',
]
