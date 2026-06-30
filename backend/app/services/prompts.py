"""
Prompt cache — загружает все AI-промпты из директории при старте.
Заменяет синхронный open() в async-обработчиках на чтение из памяти.
"""

import os
from pathlib import Path
from functools import lru_cache
from typing import Dict, Optional

from app.core.config import settings


def _discover_prompts(prompts_dir: str) -> Dict[str, str]:
    """
    Сканирует директорию промптов, загружает все .md файлы.
    Ключ: имя файла без расширения (напр. "round_table").
    """
    base = Path(prompts_dir)
    if not base.is_absolute():
        base = Path(settings.PROMPTS_DIR)
    if not base.exists():
        base = Path(__file__).resolve().parent.parent.parent / "prompts"

    prompts: Dict[str, str] = {}
    if not base.is_dir():
        return prompts

    for fpath in sorted(base.iterdir()):
        if fpath.suffix == ".md" and fpath.is_file():
            name = fpath.stem
            prompts[name] = fpath.read_text(encoding="utf-8")
    return prompts


# Глобальный кеш промптов — загружается при импорте модуля
_PROMPT_CACHE: Dict[str, str] = _discover_prompts("app/prompts")


def get_prompt(name: str) -> str:
    """Возвращает содержимое промпта по имени файла (без .md)."""
    try:
        return _PROMPT_CACHE[name]
    except KeyError:
        raise FileNotFoundError(f"Prompt '{name}' not found. Available: {list(_PROMPT_CACHE.keys())}")


def reload_prompts() -> int:
    """Перезагружает все промпты с диска. Возвращает количество загруженных файлов."""
    _PROMPT_CACHE.clear()
    _PROMPT_CACHE.update(_discover_prompts("app/prompts"))
    return len(_PROMPT_CACHE)


def list_prompts() -> list:
    """Возвращает список доступных промптов."""
    return sorted(_PROMPT_CACHE.keys())
