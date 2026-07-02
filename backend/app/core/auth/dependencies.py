"""
Auth dependencies — get_current_user (JWT-only).
"""

import logging
from fastapi import Request, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError

from app.core.config import settings
from app.core.database import get_db

logger = logging.getLogger(__name__)


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> int:
    """
    Dependency: возвращает user_id из JWT access-токена.
    Токен передаётся в заголовке Authorization: Bearer <token>.
    Принимаются только токены с type="access".
    """
    from sqlalchemy import select
    from app.models.models import User

    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Требуется JWT-токен")

    token = auth_header.split(" ", 1)[1]

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )

        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Требуется access-токен")

        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError) as e:
        logger.warning(f"JWT decode failed: {e}")
        raise HTTPException(status_code=401, detail="Неверный JWT-токен")

    result = await db.execute(select(User).where(User.id == user_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    return user_id


async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> int:
    """
    Dependency: как get_current_user, но не выбрасывает 401.
    Возвращает user_id или 0 для неаутентифицированных запросов.
    """
    try:
        return await get_current_user(request, db)
    except HTTPException:
        return 0
