"""
Application settings.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, model_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    APP_NAME: str = "Штурман"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://shturman:shturman_secret@localhost:5432/shturman"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # AI Provider (OpenAI-compatible: OpenAI, DeepSeek, etc.)
    OPENAI_API_KEY: str = ""
    OPENAI_API_BASE: str = "https://api.deepseek.com"
    OPENAI_MODEL: str = "deepseek-chat"

    # VK Mini App (app54657016 — Штурман)
    VK_APP_ID: str = "54657016"
    VK_APP_SECRET: str = ""

    # VK Web (веб-версия для внешнего сайта)
    VK_WEB_APP_ID: str = "54657524"
    VK_WEB_CLIENT_SECRET: str = ""
    VK_SERVICE_TOKEN: str = ""

    # Domain
    DOMAIN: str = "vnutrenniy-kompas.ru"

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://vnutrenniy-kompas.ru",
        "http://vnutrenniy-kompas.ru",
        # VK Mini App iframe domain
        "https://prod-app54657016-*.vk-apps.com",
        "https://vk.com",
        "https://id.vk.com",
    ]

    # Rate limiting
    RATE_LIMIT_DEFAULT: str = "60/minute"
    RATE_LIMIT_AI: str = "10/minute"  # stricter for AI generation endpoints

    # Prompts directory
    PROMPTS_DIR: str = "app/prompts"

    @model_validator(mode="after")
    def validate_secrets(self) -> "Settings":
        if not self.DEBUG:
            if not self.JWT_SECRET:
                raise ValueError(
                    "JWT_SECRET must be set via environment variable or .env file. "
                    "Generate a strong random string (e.g. openssl rand -hex 32)."
                )
            if not self.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY must be set via environment variable or .env file.")
        elif not self.JWT_SECRET:
            # Dev mode: provide a warning but don't block
            import warnings
            warnings.warn(
                "WARNING: JWT_SECRET not set. Using weak dev default. "
                "Set JWT_SECRET in .env for production."
            )
            self.JWT_SECRET = "shturman-jwt-secret-dev"
        return self

    @field_validator("JWT_ALGORITHM")
    @classmethod
    def validate_jwt_algorithm(cls, v: str) -> str:
        allowed = {"HS256", "HS384", "HS512"}
        if v not in allowed:
            raise ValueError(f"JWT_ALGORITHM must be one of {allowed}")
        return v


settings = Settings()
