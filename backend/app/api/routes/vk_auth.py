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


async def _generate_token(user: User) -> dict:
    """Создать JWT для пользователя."""
    from datetime import datetime, timedelta, timezone
    from jose import jwt

    payload = {
        "sub": str(user.id),
        "vk_user_id": str(user.vk_user_id),
        "is_member": bool(user.id),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "username": user.username,
        "is_member": True,
    }


@router.get("/vk-oauth")
async def vk_oauth_callback(
    code: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    VK OAuth 2.0 callback для веб-версии.
    Принимает code, обменивает на access_token через VK API,
    ищет/создаёт пользователя по vk_user_id, возвращает JWT.
    """
    import httpx

    if not settings.VK_SERVICE_TOKEN:
        raise HTTPException(status_code=500, detail="VK_SERVICE_TOKEN не настроен")

    # Шаг 1: обмениваем code на access_token
    token_url = "https://api.vk.com/method/auth.exchangeSilentAuthToken"
    async with httpx.AsyncClient() as client:
        resp = await client.get(token_url, params={
            "v": "5.199",
            "token": settings.VK_SERVICE_TOKEN,
            "access_token": code,
            "uuid": f"{settings.VK_APP_ID}",  # vk_app_id
        })

    token_data = resp.json()
    if "error" in token_data:
        raise HTTPException(status_code=400, detail=f"VK API error: {token_data['error'].get('error_msg', 'unknown')}")

    vk_user_id = str(token_data.get("response", {}).get("user_id", ""))

    if not vk_user_id:
        raise HTTPException(status_code=400, detail="Не удалось получить vk_user_id")

    # Шаг 2: ищем или создаём пользователя
    result = await db.execute(
        select(User).where(User.vk_user_id == vk_user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            username=f"vk_{vk_user_id}",
            vk_user_id=str(vk_user_id),
        )
        db.add(user)
        await db.flush()

    return await _generate_token(user)


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

    return await _generate_token(user)
