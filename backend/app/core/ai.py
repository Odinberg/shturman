"""
AI-клиент (OpenAI-совместимый: DeepSeek, OpenAI и др.)
с обработкой ошибок и переиспользуемым клиентом.
"""

import logging
from typing import Optional
from openai import AsyncOpenAI, APIStatusError, APIConnectionError, RateLimitError
from app.core.config import settings

logger = logging.getLogger(__name__)


_client: Optional[AsyncOpenAI] = None


def get_ai_client() -> AsyncOpenAI:
    """Возвращает переиспользуемый AI-клиент (singleton)."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_API_BASE,
        )
    return _client


def get_ai_model() -> str:
    """Возвращает название модели AI."""
    return settings.OPENAI_MODEL


async def safe_ai_call(
    client: AsyncOpenAI,
    model: str,
    system: str,
    user: str,
    temperature: float = 0.7,
    max_tokens: int = 1000,
    label: str = "ai_call",
) -> Optional[str]:
    """
    Безопасный вызов AI с обработкой ошибок.
    Возвращает текст ответа или None при ошибке.
    """
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content

    except RateLimitError:
        logger.error(f"[{label}] AI rate limit exceeded")
        return None
    except APIConnectionError as e:
        logger.error(f"[{label}] AI connection error: {e}")
        return None
    except APIStatusError as e:
        logger.error(f"[{label}] AI API error {e.status_code}: {e.message}")
        return None
    except Exception as e:
        logger.exception(f"[{label}] Unexpected AI error: {type(e).__name__}")
        return None
