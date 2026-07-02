"""
VK ID Аутентификация — enterprise auth layer.
Единственная точка входа VK → JWT.
"""

import hashlib
import time
from fastapi import APIRouter, Depends, HTTPException, Request, Query
from slowapi.util import get_remote_address
from slowapi import Limiter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.auth.vk import verify_vk_signature
from app.core.auth.jwt import create_access_token, create_refresh_token
from app.core.auth.dependencies import get_current_user
from app.core.sessions.repository import store_session, is_valid_refresh, revoke_session
from app.core.sessions.models import RefreshSession
from app.core.sessions.service import hash_token
from app.models.models import User
from app.services.user_service import get_or_create_user

router = APIRouter()

# Rate limiter for auth endpoints (stricter than default 60/min)
auth_limiter = Limiter(key_func=get_remote_address)

# ─────────────────────────────────────────────────────────────────────────────
# Anti-replay: in-memory nonce store (TTL = 5 min)
# ─────────────────────────────────────────────────────────────────────────────

_NONCE_TTL = 300  # 5 minutes
_nonce_store: dict[str, float] = {}


def _check_nonce(nonce: str) -> bool:
    """Возвращает True если nonce уже использован (replay)."""
    now = time.time()
    # Очистка просроченных
    expired = [k for k, v in _nonce_store.items() if now - v > _NONCE_TTL]
    for k in expired:
        del _nonce_store[k]
    # Проверка
    if nonce in _nonce_store:
        return True
    _nonce_store[nonce] = now
    return False


def _build_nonce(vk_user_id: str, vk_ts: str, sign: str) -> str:
    """Строит nonce из VK-параметров: хеш от user_id + timestamp + первые 8 байт подписи."""
    raw = f"{vk_user_id}:{vk_ts}:{sign[:8]}"
    return hashlib.sha256(raw.encode()).hexdigest()


# ─────────────────────────────────────────────────────────────────────────────
# Group membership check (shared by Mini App & OAuth)
# ─────────────────────────────────────────────────────────────────────────────

async def _check_group_membership(
    vk_user_id: str,
    vk_group_id: str | None = None,
    vk_viewer_group_role: str | None = None,
    user_access_token: str | None = None,
) -> None:
    """Проверяет, что пользователь — участник закрытой группы Архипелаг."""
    if not settings.VK_GROUP_ID:
        return

    group_id_str = str(settings.VK_GROUP_ID)

    # Mini App: проверяем VK launch-параметры
    if vk_group_id and vk_group_id == group_id_str and vk_viewer_group_role:
        if vk_viewer_group_role not in ("none", ""):
            return

    # OAuth: проверяем через VK API
    if user_access_token:
        await _check_group_via_api(vk_user_id, user_access_token)
        return

    raise HTTPException(
        status_code=403,
        detail="Доступ только для участников клуба Архипелаг",
    )


async def _check_group_via_api(vk_user_id: str, access_token: str) -> None:
    """Проверяет членство в группе через VK API groups.isMember."""
    import httpx

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://api.vk.com/method/groups.isMember",
            params={
                "group_id": settings.VK_GROUP_ID,
                "user_id": vk_user_id,
                "v": "5.199",
                "access_token": access_token,
            },
        )

    data = resp.json()
    if "error" in data:
        raise HTTPException(
            status_code=503,
            detail="Не удалось проверить членство в группе Архипелаг",
        )

    if data.get("response") != 1:
        raise HTTPException(
            status_code=403,
            detail="Доступ только для участников клуба Архипелаг",
        )


# ─────────────────────────────────────────────────────────────────────────────
# VK OAuth 2.0 (веб-версия)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/vk-oauth")
async def vk_oauth_callback(
    code: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """VK OAuth 2.0 callback для веб-версии."""
    import httpx

    token_url = "https://oauth.vk.com/access_token"
    async with httpx.AsyncClient() as client:
        resp = await client.get(token_url, params={
            "client_id": settings.VK_WEB_APP_ID,
            "client_secret": settings.VK_WEB_CLIENT_SECRET,
            "redirect_uri": f"https://{settings.DOMAIN}/auth/callback",
            "code": code,
            "v": "5.199",
        })

    token_data = resp.json()
    if "error" in token_data:
        detail = token_data.get("error_description", token_data["error"])
        raise HTTPException(status_code=400, detail=f"VK OAuth error: {detail}")

    vk_user_id = str(token_data.get("user_id", ""))
    user_access_token = token_data.get("access_token")

    if not vk_user_id:
        raise HTTPException(status_code=400, detail="Не удалось получить vk_user_id")

    await _check_group_membership(vk_user_id, user_access_token=user_access_token)
    user = await get_or_create_user(db, vk_user_id)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
    }


# ─────────────────────────────────────────────────────────────────────────────
# VK Mini App Login
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/vk")
@auth_limiter.limit("5/minute")
async def vk_login(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    VK Mini App аутентификация.
    Фронтенд отправляет VK launch-параметры как JSON body.
    Верифицируем подпись, проверяем группу, выдаём access + refresh токены.
    """
    try:
        body: dict = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Тело запроса должно быть JSON")

    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Тело запроса должно быть JSON-объектом")

    vk_user_id = str(body.get("vk_user_id", ""))
    vk_sign = str(body.get("sign", ""))
    vk_ts = str(body.get("vk_ts", ""))

    if not vk_user_id:
        raise HTTPException(status_code=400, detail="vk_user_id отсутствует")
    if not vk_sign:
        raise HTTPException(status_code=403, detail="Подпись VK отсутствует")
    if not settings.VK_APP_SECRET:
        raise HTTPException(status_code=500, detail="VK_APP_SECRET не настроен")

    # 0. Anti-replay check
    nonce = _build_nonce(vk_user_id, vk_ts, vk_sign)
    if _check_nonce(nonce):
        raise HTTPException(status_code=429, detail="Повторный запрос — возможна replay-атака")

    # 1. VK signature verification
    if not verify_vk_signature(body, vk_sign, settings.VK_APP_SECRET):
        raise HTTPException(status_code=403, detail="Неверная подпись VK")

    # 2. Group membership check
    vk_group_id = body.get("vk_group_id", "")
    vk_viewer_group_role = body.get("vk_viewer_group_role", "")
    await _check_group_membership(
        vk_user_id,
        vk_group_id=vk_group_id,
        vk_viewer_group_role=vk_viewer_group_role,
    )

    # 3. Get or create user (race-condition safe)
    user = await get_or_create_user(db, vk_user_id)

    # 4. Issue token pair
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # 5. Store refresh session
    session = RefreshSession(
        user_id=user.id,
        refresh_token_hash=hash_token(refresh_token),
        device_id=request.headers.get("User-Agent"),
        ip=request.client.host if request.client else None,
    )
    await store_session(db, session)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Token refresh
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/refresh")
async def refresh_token(
    refresh_token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Обновляет access-токен по refresh-токену.
    Ротация: старый refresh-токен отзывается, новый создаётся.
    """
    from jose import jwt, JWTError

    # 1. Decode refresh token
    try:
        payload = jwt.decode(
            refresh_token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Неверный refresh-токен")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Требуется refresh-токен")

    user_id = int(payload["sub"])

    # 2. Verify session exists and not revoked
    token_hash = hash_token(refresh_token)
    if not await is_valid_refresh(db, user_id, token_hash):
        raise HTTPException(status_code=401, detail="Сессия отозвана или не найдена")

    # 3. Rotation: revoke old, issue new
    await revoke_session(db, user_id, token_hash)

    new_access = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)

    new_session = RefreshSession(
        user_id=user_id,
        refresh_token_hash=hash_token(new_refresh),
    )
    await store_session(db, new_session)

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Logout
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/logout")
async def logout(
    refresh_token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Выход: отзывает refresh-сессию.
    После logout refresh-токен больше недействителен.
    """
    from jose import jwt, JWTError

    try:
        payload = jwt.decode(
            refresh_token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Неверный токен")

    user_id = int(payload["sub"])
    token_hash = hash_token(refresh_token)

    await revoke_session(db, user_id, token_hash)

    return {"status": "ok", "message": "Сессия завершена"}
