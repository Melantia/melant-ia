from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración global de la API MELANT IA."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "MELANT IA API"
    VERSION: str = "0.1.0"
    DESCRIPTION: str = "API del ecosistema agropecuario MELANT IA"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://melantia:melantia@localhost:5432/melantia"

    SECRET_KEY: str = Field(default="cambiar-en-produccion", min_length=8)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    CORS_ORIGINS: list[str] = ["http://localhost:8000", "http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
