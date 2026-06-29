"""
AI-клиент (OpenAI-совместимый: DeepSeek, OpenAI и др.).
"""

from openai import AsyncOpenAI
from app.core.config import settings


def get_ai_client() -> AsyncOpenAI:
    """Создаёт AI-клиент с настройками из конфига."""
    return AsyncOpenAI(
        api_key=settings.OPENAI_API_KEY,
        base_url=settings.OPENAI_API_BASE,
    )


def get_ai_model() -> str:
    """Возвращает название модели AI."""
    return settings.OPENAI_MODEL
