"""
VK Mini App signature verification.
HMAC-SHA256: ключ = app_secret, сообщение = key1=val1&key2=val2.
"""

import hashlib
import hmac
from urllib.parse import urlencode


def verify_vk_signature(data: dict, sign: str, secret: str) -> bool:
    """
    Проверяет подпись VK Mini App.
    data: словарь с vk_ параметрами (как пришли от фронтенда).
    sign: подпись из параметра sign.
    secret: VK_APP_SECRET из настроек.
    """
    if not sign or not secret:
        return False

    filtered = {k: v for k, v in data.items() if k.startswith("vk_")}
    sorted_params = dict(sorted(filtered.items()))
    query = urlencode(sorted_params)

    expected = hmac.new(
        secret.encode(),
        query.encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, sign)
