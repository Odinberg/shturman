"""
Application settings.
"""

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Штурман"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://shturman:shturman_secret@localhost:5432/shturman"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth
    JWT_SECRET: str = "shturman-jwt-secret-dev"
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
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
