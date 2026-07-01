"""
VK ID Аутентификация.
"""

import hashlib
import hmac
import urllib.parse

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.config import settings
from app.models.models import User
from app.services.user_service import get_or_create_user

router = APIRouter()


async def _check_group_membership(
    vk_user_id: str,
    vk_group_id: str | None = None,
    vk_viewer_group_role: str | None = None,
    user_access_token: str | None = None,
) -> None:
    """
    Проверяет, что пользователь — участник закрытой группы Архипелаг.
    Если VK_GROUP_ID не задан в настройках — проверка пропускается.

    Для Mini App: проверяет vk_group_id == VK_GROUP_ID и role != "none".
    Для OAuth: вызывает VK API groups.isMember.
    """
    if not settings.VK_GROUP_ID:
        return  # проверка отключена

    group_id_str = str(settings.VK_GROUP_ID)

    # Mini App flow: проверяем VK launch-параметры
    if vk_group_id and vk_group_id == group_id_str and vk_viewer_group_role:
        if vk_viewer_group_role not in ("none", ""):
            return  # пользователь — участник группы

    # OAuth flow: проверяем через VK API
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


def _build_vk_param_string(params: dict) -> str:
    """
    Строит каноническую строку параметров для VK HMAC-верификации.
    Аналог того, что делает verify_vk_signature из services/vk_auth для query string.
    """
    exclude = {"sign", "sign_query", "vk_viewer_group_role"}
    filtered = {k: v for k, v in params.items() if k not in exclude}
    sorted_keys = sorted(filtered.keys())

    parts = []
    for k in sorted_keys:
        val = str(filtered[k])
        encoded_val = urllib.parse.quote(val, safe='')
        parts.append(f"{k}={encoded_val}")

    return "&".join(parts)


@router.get("/vk-oauth")
async def vk_oauth_callback(
    code: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    VK OAuth 2.0 callback для веб-версии.
    Принимает code, обменивает на access_token через VK API,
    проверяет членство в закрытой группе, ищет/создаёт пользователя,
    возвращает JWT.
    """
    import httpx

    # Шаг 1: обмениваем code на access_token (стандартный OAuth 2.0)
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
        raise HTTPException(status_code=400, detail=f"VK OAuth error: {token_data.get('error_description', token_data['error'])}")

    vk_user_id = str(token_data.get("user_id", ""))
    user_access_token = token_data.get("access_token")

    if not vk_user_id:
        raise HTTPException(status_code=400, detail="Не удалось получить vk_user_id")

    # Шаг 2: проверяем членство в закрытой группе Архипелаг
    await _check_group_membership(vk_user_id, user_access_token=user_access_token)

    # Шаг 3: ищем или создаём пользователя (защита от race condition)
    user = await get_or_create_user(db, vk_user_id)
    return await _generate_token(user)


@router.post("/vk")
async def vk_auth(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Аутентификация через VK Mini App.

    Фронтенд отправляет VK query-параметры (vk_user_id, vk_app_id, sign, ...)
    как JSON body (POST). Эндпоинт читает их из тела, проверяет HMAC-подпись,
    членство в закрытой группе, ищет или создаёт пользователя, возвращает JWT.
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Тело запроса должно быть JSON")

    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="Тело запроса должно быть JSON-объектом")

    vk_user_id = str(body.get("vk_user_id", ""))
    if not vk_user_id:
        raise HTTPException(status_code=400, detail="vk_user_id отсутствует")

    if not settings.VK_APP_SECRET:
        raise HTTPException(status_code=500, detail="VK_APP_SECRET не настроен")

    # Верифицируем подпись — реконструируем каноническую строку из JSON body
    received_sign = body.get("sign", "")
    if not received_sign:
        raise HTTPException(status_code=403, detail="Подпись VK отсутствует")

    param_string = _build_vk_param_string(body)
    computed_sign = hmac.new(
        settings.VK_APP_SECRET.encode("utf-8"),
        param_string.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(computed_sign, received_sign):
        raise HTTPException(status_code=403, detail="Неверная подпись VK")

    # Проверяем членство в закрытой группе Архипелаг
    vk_group_id = body.get("vk_group_id", "")
    vk_viewer_group_role = body.get("vk_viewer_group_role", "")
    await _check_group_membership(
        vk_user_id,
        vk_group_id=vk_group_id,
        vk_viewer_group_role=vk_viewer_group_role,
    )

    # Ищем или создаём пользователя (защита от race condition)
    user = await get_or_create_user(db, vk_user_id)
    return await _generate_token(user)
