"""
Pydantic схемы для auth-эндпоинтов.
"""

from pydantic import BaseModel, Field


class VkLoginRequest(BaseModel):
    """Тело запроса POST /auth/vk — VK Mini App initData."""
    vk_user_id: str = Field(..., min_length=1)
    sign: str = Field(..., min_length=1)
    vk_ts: str = Field(default="")
    vk_app_id: str = Field(default="")
    vk_group_id: str = Field(default="")
    vk_viewer_group_role: str = Field(default="")
    # Допускаем любые дополнительные vk_ параметры
    model_config = {"extra": "allow"}


class TokenResponse(BaseModel):
    """Ответ с access + refresh токенами."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: int
    username: str


class RefreshRequest(BaseModel):
    """Тело запроса POST /auth/refresh."""
    refresh_token: str = Field(..., min_length=1)


class LogoutRequest(BaseModel):
    """Тело запроса POST /auth/logout."""
    refresh_token: str = Field(..., min_length=1)


class MeResponse(BaseModel):
    """Ответ GET /auth/me."""
    id: int
    vk_user_id: str | None = None
    username: str
    created_at: str | None = None


class ErrorResponse(BaseModel):
    """Ошибка аутентификации."""
    code: str
    message: str
