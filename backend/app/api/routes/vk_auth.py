"""
VK ID Аутентификация.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.config import settings
from app.models.models import User
from app.services.vk_auth import verify_vk_signature, parse_vk_user_id

router = APIRouter()


@router.post("/vk")
async def vk_auth(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Аутентификация через VK Mini App.
    Принимает query-параметры от VK (vk_user_id, vk_app_id, vk_ts, sign, ...)
    и проверяет подпись. Возвращает JWT токен.
    """
    query_string = str(request.query_params)
    vk_user_id = parse_vk_user_id(query_string)

    if not vk_user_id:
        raise HTTPException(status_code=400, detail="vk_user_id отсутствует")

    if not settings.VK_APP_SECRET:
        raise HTTPException(status_code=500, detail="VK_APP_SECRET не настроен")

    # Верифицируем подпись
    if not verify_vk_signature(query_string, settings.VK_APP_SECRET):
        raise HTTPException(status_code=403, detail="Неверная подпись VK")

    # Ищем или создаём пользователя
    result = await db.execute(
        select(User).where(User.vk_user_id == str(vk_user_id))
    )
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            username=f"vk_{vk_user_id}",
            vk_user_id=str(vk_user_id),
        )
        db.add(user)
        await db.flush()

    # Генерируем JWT токен
    from datetime import datetime, timedelta, timezone
    from jose import jwt

    payload = {
        "sub": str(user.id),
        "vk_user_id": str(vk_user_id),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
    }
