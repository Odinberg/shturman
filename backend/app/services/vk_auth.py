"""
VK Mini App — верификация подписи запроса.
"""

import hashlib
import hmac
import urllib.parse
from typing import Optional


def verify_vk_signature(query_string: str, app_secret: str) -> bool:
    """
    Проверяет подпись VK Mini App.
    Алгоритм: отсортировать все параметры кроме sign,
    склеить их в строку ?k=v&k=v, добавить секретный ключ,
    вычислить SHA256 и сравнить с параметром sign.
    """
    # Парсим query string
    params = urllib.parse.parse_qs(query_string, keep_blank_values=True)
    # Приводим к dict[str, str] (берём первое значение)
    flat = {k: v[0] for k, v in params.items()}

    received_sign = flat.pop("sign", None)
    if not received_sign:
        return False

    # Сортируем ключи
    sorted_keys = sorted(flat.keys())
    # Формируем строку вида k1=v1&k2=v2
    param_string = "&".join(
        f"{k}={flat[k]}" for k in sorted_keys if k.startswith("vk_")
    )

    # Добавляем секретный ключ
    signed_string = param_string + app_secret
    computed_sign = hmac.new(
        app_secret.encode("utf-8"),
        signed_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(computed_sign, received_sign)


def parse_vk_user_id(query_string: str) -> Optional[str]:
    """Извлекает vk_user_id из query string."""
    params = urllib.parse.parse_qs(query_string)
    return params.get("vk_user_id", [None])[0]
