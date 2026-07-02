"""
Auth router — единая точка входа VK → JWT.
POST /vk       — VK Mini App login
POST /refresh  — обновление токенов
POST /logout   — завершение сессии
GET  /me       — информация о текущем пользователе
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.auth.errors import AuthError
from app.auth.vk import verify_vk_signature, check_nonce, build_nonce
from app.auth.jwt import create_access_token, create_refresh_token, verify_token
from app.auth.service import get_or_create_vk_user
from app.auth.dependencies import get_current_user
from app.auth.schemas import (
    VkLoginRequest, TokenResponse, RefreshRequest,
    LogoutRequest, MeResponse,
)
from app.sessions.repository import store_session, is_valid_refresh, revoke_session
from app.sessions.models import RefreshSession
from app.sessions.service import hash_token
from app.models.models import User

logger = logging.getLogger("auth")
router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# POST /vk — VK Mini App Login
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/vk", response_model=TokenResponse)
async def vk_login(
    body: VkLoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    VK Mini App аутентификация.
    Принимает VK launch-параметры, верифицирует подпись,
    проверяет группу, создаёт/находит пользователя, выдаёт JWT.
    """
    if not settings.VK_APP_SECRET:
        raise AuthError("VK_SECRET_NOT_CONFIGURED", 500)

    vk_user_id = body.vk_user_id
    vk_sign = body.sign

    # 1. Anti-replay check
    nonce = build_nonce(vk_user_id, body.vk_ts, vk_sign)
    if check_nonce(nonce):
        logger.warning(f"Replay detected for vk_user_id={vk_user_id}")
        raise AuthError("REPLAY_DETECTED", 429)

    # 2. VK signature verification
    if not verify_vk_signature(body.model_dump(), vk_sign, settings.VK_APP_SECRET):
        logger.warning(f"Invalid VK signature for vk_user_id={vk_user_id}")
        raise AuthError("INVALID_VK_SIGN", 403)

    # 3. Group membership check
    await _check_group_membership(
        vk_user_id,
        vk_group_id=body.vk_group_id,
        vk_viewer_group_role=body.vk_viewer_group_role,
    )

    # 4. Identity binding
    user = await get_or_create_vk_user(db, vk_user_id)
    logger.info(f"VK login: user_id={user.id}, vk_user_id={vk_user_id}")

    # 5. Issue tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # 6. Store session
    _ = await _try_store_session(db, user.id, refresh_token)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user.id,
        username=user.username,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /refresh — обновление токенов
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """Ротация: отзывает старый refresh, выдаёт новую пару токенов."""
    from jose import JWTError

    try:
        payload = verify_token(body.refresh_token, "refresh")
    except JWTError:
        raise AuthError("REFRESH_EXPIRED")
    except AuthError:
        raise

    user_id = int(payload["sub"])

    token_hash = hash_token(body.refresh_token)
    if not await is_valid_refresh(db, user_id, token_hash):
        raise AuthError("REFRESH_NOT_FOUND")

    await revoke_session(db, user_id, token_hash)

    # Issue new pair
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    _ = await _try_store_session(db, user_id, refresh_token)

    # Get username for response
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_id=user_id,
        username=user.username if user else "unknown",
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /logout — завершение сессии
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/logout")
async def logout(
    body: LogoutRequest,
    db: AsyncSession = Depends(get_db),
):
    """Отзывает refresh-сессию. Access истечёт сам через 15 минут."""
    payload = verify_token(body.refresh_token, "refresh")
    user_id = int(payload["sub"])
    token_hash = hash_token(body.refresh_token)
    await revoke_session(db, user_id, token_hash)
    logger.info(f"Logout: user_id={user_id}")
    return {"status": "ok"}


# ─────────────────────────────────────────────────────────────────────────────
# GET /me — текущий пользователь
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=MeResponse)
async def me(
    user_id: int = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Возвращает информацию о текущем пользователе."""
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise AuthError("USER_NOT_FOUND")

    return MeResponse(
        id=user.id,
        vk_user_id=user.vk_user_id,
        username=user.username,
        created_at=user.created_at.isoformat() if user.created_at else None,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

async def _check_group_membership(
    vk_user_id: str,
    vk_group_id: str | None = None,
    vk_viewer_group_role: str | None = None,
    user_access_token: str | None = None,
) -> None:
    """Проверяет членство в закрытой группе Архипелаг."""
    if not settings.VK_GROUP_ID:
        return

    group_id_str = str(settings.VK_GROUP_ID)

    if vk_group_id and vk_group_id == group_id_str and vk_viewer_group_role:
        if vk_viewer_group_role not in ("none", ""):
            return

    if user_access_token:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.vk.com/method/groups.isMember",
                params={
                    "group_id": settings.VK_GROUP_ID,
                    "user_id": vk_user_id,
                    "v": "5.199",
                    "access_token": user_access_token,
                },
            )
        data = resp.json()
        if "error" in data:
            raise AuthError("GROUP_CHECK_FAILED", 503)
        if data.get("response") != 1:
            raise AuthError("NOT_MEMBER", 403)
        return

    raise AuthError("NOT_MEMBER", 403)


async def _try_store_session(db: AsyncSession, user_id: int, refresh_token: str) -> bool:
    """Пытается сохранить сессию. Не блокирует логин при ошибке."""
    try:
        session = RefreshSession(
            user_id=user_id,
            refresh_token_hash=hash_token(refresh_token),
            expires_at=datetime.now(timezone.utc).replace(
                tzinfo=None
            ) + __import__("datetime").timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        await store_session(db, session)
        return True
    except Exception:
        return False
