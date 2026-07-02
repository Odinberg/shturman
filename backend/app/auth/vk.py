"""
VK Mini App signature verification + anti-replay.

Алгоритм: https://dev.vk.com/mini-apps/development/signing
"""

import hashlib
import hmac
import time
import urllib.parse


# ── Nonce store (in-memory, TTL 5 min) ──────────────────────────────────────

_NONCE_TTL = 300  # 5 минут
_nonce_store: dict[str, float] = {}


def check_nonce(nonce: str) -> bool:
    """Возвращает True если nonce уже использован (replay)."""
    now = time.time()
    expired = [k for k, v in _nonce_store.items() if now - v > _NONCE_TTL]
    for k in expired:
        del _nonce_store[k]
    if nonce in _nonce_store:
        return True
    _nonce_store[nonce] = now
    return False


def build_nonce(vk_user_id: str, vk_ts: str, sign: str) -> str:
    """Строит nonce: SHA256(vk_user_id + vk_ts + первые 8 байт подписи)."""
    raw = f"{vk_user_id}:{vk_ts}:{sign[:8]}"
    return hashlib.sha256(raw.encode()).hexdigest()


# ── VK signature verification ────────────────────────────────────────────────

def verify_vk_signature(data: dict, sign: str, secret: str) -> bool:
    """
    Проверяет подпись VK Mini App.
    data: словарь параметров (vk_user_id, vk_app_id, vk_ts, ...).
    sign: параметр sign из запроса.
    secret: VK_APP_SECRET из настроек.

    Алгоритм:
    1. Исключить sign, sign_query, vk_viewer_group_role.
    2. Отсортировать ключи алфавитно.
    3. Каждое значение URL-encode (safe='' — кодировать всё).
    4. Склеить в k1=v1&k2=v2.
    5. HMAC-SHA256 с app_secret.
    """
    if not sign or not secret:
        return False

    exclude = {"sign", "sign_query", "vk_viewer_group_role"}
    filtered = {k: v for k, v in data.items() if k not in exclude}
    sorted_keys = sorted(filtered.keys())

    param_parts = []
    for k in sorted_keys:
        val = str(filtered[k])
        param_parts.append(f"{k}={urllib.parse.quote(val, safe='')}")

    param_string = "&".join(param_parts)

    expected = hmac.new(
        secret.encode(),
        param_string.encode(),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, sign)
