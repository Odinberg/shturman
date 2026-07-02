"""
Auth dependencies — get_current_user (JWT-only).
"""

import logging
from fastapi import Request, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.auth.errors import AuthError
from app.auth.jwt import verify_token
from app.models.models import User

logger = logging.getLogger(__name__)


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> int:
    """
    Dependency: возвращает user_id из JWT access-токена.
    Токен передаётся в заголовке Authorization: Bearer <token>.
    Никакого VK, никакого DEBUG — только JWT.
    """
    from jose import JWTError

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise AuthError("MISSING_TOKEN")

    token = auth_header.split(" ", 1)[1]

    try:
        payload = verify_token(token, "access")
    except JWTError:
        raise AuthError("TOKEN_EXPIRED")
    except AuthError:
        raise
    except Exception:
        raise AuthError("INVALID_TOKEN")

    user_id = int(payload["sub"])

    result = await db.execute(select(User).where(User.id == user_id))
    if not result.scalar_one_or_none():
        raise AuthError("USER_NOT_FOUND")

    return user_id


async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> int:
    """Как get_current_user, но возвращает 0 вместо 401."""
    try:
        return await get_current_user(request, db)
    except AuthError:
        return 0
