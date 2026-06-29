"""
VK Mini App — верификация подписи запроса.

По документации VK (https://dev.vk.com/mini-apps/development/signing):
1. Берутся все query-параметры, кроме sign, sign_query, vk_viewer_group_role.
2. Ключи сортируются алфавитно.
3. Строка вида k1=v1&k2=v2 (значения URL-encoded как в исходном запросе).
4. HMAC-SHA256: ключ = app_secret, сообщение = строка параметров.
5. Результат сравнивается с параметром sign.
"""

import hashlib
import hmac
import urllib.parse
from typing import Optional


def verify_vk_signature(query_string: str, app_secret: str) -> bool:
    """
    Проверяет подпись VK Mini App по алгоритму HMAC-SHA256.
    """
    # Парсим query string (значения автоматически URL-decoded)
    params = urllib.parse.parse_qs(query_string, keep_blank_values=True)
    flat = {k: v[0] for k, v in params.items()}

    received_sign = flat.pop("sign", None)
    if not received_sign:
        return False

    # Исключаем sign, sign_query, vk_viewer_group_role
    exclude = {"sign", "sign_query", "vk_viewer_group_role"}
    filtered = {k: v for k, v in flat.items() if k not in exclude}

    # Сортируем ключи алфавитно
    sorted_keys = sorted(filtered.keys())

    # Формируем строку с URL-кодированными значениями (как в исходном запросе)
    param_parts = []
    for k in sorted_keys:
        val = str(filtered[k])
        # URL-encode значение, чтобы соответствовать оригинальной query string
        encoded_val = urllib.parse.quote(val, safe='')
        param_parts.append(f"{k}={encoded_val}")

    param_string = "&".join(param_parts)

    # HMAC-SHA256: ключ = app_secret, сообщение = строка параметров
    computed_sign = hmac.new(
        app_secret.encode("utf-8"),
        param_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(computed_sign, received_sign)


def parse_vk_user_id(query_string: str) -> Optional[str]:
    """Извлекает vk_user_id из query string."""
    params = urllib.parse.parse_qs(query_string)
    return params.get("vk_user_id", [None])[0]
