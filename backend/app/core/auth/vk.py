"""
VK Mini App signature verification.
Алгоритм: https://dev.vk.com/mini-apps/development/signing

1. Берутся все параметры, кроме sign, sign_query, vk_viewer_group_role.
2. Ключи сортируются алфавитно.
3. Каждое значение URL-кодируется (без safe-символов).
4. Склеивается в строку k1=v1&k2=v2.
5. HMAC-SHA256: ключ = app_secret, сообщение = строка.
"""

import hashlib
import hmac
import urllib.parse


def verify_vk_signature(data: dict, sign: str, secret: str) -> bool:
    """
    Проверяет подпись VK Mini App.

    data: словарь параметров (vk_user_id, vk_app_id, ...).
    sign: подпись из параметра sign.
    secret: VK_APP_SECRET из настроек.
    """
    if not sign or not secret:
        return False

    # Исключаем sign и обратно-совместимые поля
    exclude = {"sign", "sign_query", "vk_viewer_group_role"}
    filtered = {k: v for k, v in data.items() if k not in exclude}

    # Сортируем ключи алфавитно
    sorted_keys = sorted(filtered.keys())

    # Формируем строку: каждое значение URL-encoded
    # ВАЖНО: safe='' — кодировать ВСЕ символы, включая / и &
    param_parts = []
    for k in sorted_keys:
        val = str(filtered[k])
        encoded_val = urllib.parse.quote(val, safe='')
        param_parts.append(f"{k}={encoded_val}")

    param_string = "&".join(param_parts)

    # HMAC-SHA256: ключ = app_secret, сообщение = строка параметров
    expected = hmac.new(
        secret.encode(),
        param_string.encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, sign)
