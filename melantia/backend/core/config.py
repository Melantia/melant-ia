# backend/core/config.py
"""
Configuración centralizada de MELANTIA.

Centraliza todas las variables de entorno, claves secretas y parámetros
de configuración utilizando pydantic-settings para validación y tipado.
"""
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Cargar variables de entorno desde el archivo .env en la raíz del proyecto
load_dotenv()


class Settings(BaseSettings):
    """
    Configuración global de MELANTIA.

    Todas las variables de entorno están tipadas y validadas.
    Los valores por defecto son seguros para desarrollo local.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # ============================================================================
    # CONFIGURACIÓN GENERAL DE LA APLICACIÓN
    # ============================================================================

    app_name: str = Field(default="MELANTIA", description="Nombre de la aplicación")
    app_version: str = Field(default="1.3.0", description="Versión de la aplicación")
    environment: str = Field(default="development", description="Entorno de ejecución")
    debug: bool = Field(default=False, description="Modo debug")

    # ============================================================================
    # CONFIGURACIÓN DEL SERVIDOR API
    # ============================================================================

    api_host: str = Field(default="127.0.0.1", description="Host del servidor API")
    api_port: int = Field(default=8000, description="Puerto del servidor API")

    # ============================================================================
    # CONFIGURACIÓN DE BASE DE DATOS POSTGRESQL
    # ============================================================================

    db_host: str = Field(default="localhost", alias="MELANTIA_DB_HOST", description="Host de PostgreSQL")
    db_name: str = Field(default="melantia_db", alias="MELANTIA_DB_NAME", description="Nombre de la base de datos")
    db_user: str = Field(default="postgres", alias="MELANTIA_DB_USER", description="Usuario de PostgreSQL")
    # Sin valor por defecto (Etapa 1 C2): la contraseña jamás vive en el
    # código. None = database_url falla cerrada hasta provisionarla.
    db_password: Optional[str] = Field(default=None, alias="MELANTIA_DB_PASS", description="Contraseña de PostgreSQL — sin valor por defecto")
    db_port: int = Field(default=5432, alias="MELANTIA_DB_PORT", description="Puerto de PostgreSQL")

    # URL de conexión completa — precedencia sobre las variables
    # MELANTIA_DB_* separadas (convención de PR1).
    database_url_override: Optional[str] = Field(default=None, alias="DATABASE_URL", description="URL completa de PostgreSQL — precede a MELANTIA_DB_*")

    # ============================================================================
    # CONFIGURACIÓN DE SUPABASE
    # ============================================================================

    supabase_url: Optional[str] = Field(default=None, description="URL de Supabase")
    supabase_service_role_key: Optional[str] = Field(default=None, description="Service Role Key de Supabase (LEGACY — prohibida, no usar)")
    supabase_anon_key: Optional[str] = Field(default=None, alias="VITE_SUPABASE_ANON_KEY", description="Anonymous Key de Supabase (LEGACY — prohibida, no usar)")
    supabase_secret_key: Optional[str] = Field(default=None, alias="SUPABASE_SECRET_KEY", description="sb_secret_* backend-only — Admin API")
    supabase_publishable_key: Optional[str] = Field(default=None, alias="VITE_SUPABASE_PUBLISHABLE_KEY", description="sb_publishable_* — grants públicos server-side")

    # Secreto del emisor local HS256 (rama legacy §10) — fuente única
    # para security.py, mismo patrón que pepper_identidad/vault_key.
    # None + flag ON = fail-closed en arranque.
    jwt_secret_key: Optional[str] = Field(default=None, alias="MELANTIA_JWT_SECRET_KEY", description="Secreto JWT del emisor local HS256 — sin valor por defecto")

    # Transición JWT local (HS256) → Supabase (ES256) — D4.2 §10.
    # OFF retira la rama legacy; los tokens locales mueren por exp a los
    # 30 min sin revocación adicional.
    auth_legacy_issuer_enabled: bool = Field(default=True, alias="AUTH_LEGACY_ISSUER_ENABLED", description="Aceptar JWT local HS256 durante la transición")

    # Pepper para derivar email sintético HMAC (D4.2 §6) — secreto
    # server-side separado de cualquier clave Supabase. None = la
    # derivación falla cerrada hasta que se provisione (pendiente).
    pepper_identidad: Optional[str] = Field(default=None, alias="PEPPER_IDENTIDAD", description="Pepper HMAC para email sintético — sin valor por defecto")

    # Clave del vault de sesión (F7a.1 §9): cifra refresh_token_enc
    # en `sesiones`. Vive solo en .env — jamás en BD ni en código.
    # None = la custodia de RT falla cerrada (no hay degradación a
    # texto plano: si no hay clave, el RT simplemente no se guarda).
    session_vault_key: Optional[str] = Field(default=None, alias="MELANTIA_SESSION_VAULT_KEY", description="Clave de cifrado del vault de sesión — sin valor por defecto")

    # ============================================================================
    # CONFIGURACIÓN DE ALMACENAMIENTO
    # ============================================================================

    storage_dir: Path = Field(
        default=Path(__file__).resolve().parent.parent / "storage",
        description="Directorio de almacenamiento de archivos"
    )

    # ============================================================================
    # CONFIGURACIÓN DE PAGOS (PAYPHONE)
    # ============================================================================

    payphone_public_key: Optional[str] = Field(default=None, alias="VITE_PAYPHONE_PUBLIC_KEY", description="Clave pública de Payphone")
    payphone_secret_key: Optional[str] = Field(default=None, alias="PAYPHONE_SECRET_KEY", description="Clave secreta de Payphone")

    # ============================================================================
    # CONFIGURACIÓN DE MODELOS DE IA
    # ============================================================================

    vosk_model_path: str = Field(default="./models/vosk-model-small-es-0.42", alias="PATH_VOSK_MODEL", description="Ruta del modelo Vosk")

    # ============================================================================
    # CONFIGURACIÓN DE CORS
    # ============================================================================

    cors_origins: list[str] = Field(
        default=["http://localhost:5173", "http://127.0.0.1:5173"],
        description="Orígenes permitidos para CORS"
    )

    # ============================================================================
    # CONFIGURACIÓN DE POOL DE CONEXIONES
    # ============================================================================

    db_pool_min_size: int = Field(default=2, description="Tamaño mínimo del pool de conexiones async")
    db_pool_max_size: int = Field(default=10, description="Tamaño máximo del pool de conexiones async")
    db_sync_pool_min_size: int = Field(default=1, description="Tamaño mínimo del pool de conexiones sync")
    db_sync_pool_max_size: int = Field(default=5, description="Tamaño máximo del pool de conexiones sync")

    # ============================================================================
    # VALIDADORES
    # ============================================================================

    @field_validator('environment')
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Valida que el entorno sea uno de los permitidos."""
        allowed = ['development', 'staging', 'production']
        if v not in allowed:
            raise ValueError(f'environment must be one of {allowed}')
        return v

    @field_validator('api_port')
    @classmethod
    def validate_port(cls, v: int) -> int:
        """Valida que el puerto esté en rango válido."""
        if not (1 <= v <= 65535):
            raise ValueError('port must be between 1 and 65535')
        return v

    # ============================================================================
    # PROPIEDADES COMPUTADAS
    # ============================================================================

    @property
    def database_url(self) -> str:
        """
        URL de conexión a PostgreSQL. `DATABASE_URL` tiene precedencia;
        si no está, se construye desde MELANTIA_DB_* y exige
        MELANTIA_DB_PASS — sin credencial, falla cerrada sin exponer
        valores en el error.
        """
        if self.database_url_override:
            return self.database_url_override
        if not self.db_password:
            raise RuntimeError(
                "Configuración de base de datos incompleta: define "
                "DATABASE_URL o MELANTIA_DB_PASS"
            )
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def is_development(self) -> bool:
        """Indica si estamos en entorno de desarrollo."""
        return self.environment == 'development'

    @property
    def is_production(self) -> bool:
        """Indica si estamos en entorno de producción."""
        return self.environment == 'production'


# ============================================================================
# INSTANCIA GLOBAL DE CONFIGURACIÓN
# ============================================================================

settings = Settings()


# ============================================================================
# FUNCIÓN DE UTILIDAD PARA RECARGAR CONFIGURACIÓN
# ============================================================================

def reload_settings() -> Settings:
    """
    Recarga la configuración desde las variables de entorno.

    Útil para pruebas o cuando las variables de entorno cambian en runtime.
    """
    global settings
    settings = Settings()
    return settings


# ============================================================================
# EXPORTACIONES
# ============================================================================

__all__ = [
    'Settings',
    'settings',
    'reload_settings',
]
