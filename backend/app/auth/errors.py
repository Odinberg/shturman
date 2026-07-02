"""
Единые коды ошибок аутентификации.
"""

from fastapi import HTTPException

# ── Error messages ───────────────────────────────────────────────────────────

ERROR_MESSAGES: dict[str, str] = {
    "MISSING_TOKEN": "Требуется JWT-токен",
    "TOKEN_EXPIRED": "Access token expired",
    "INVALID_TOKEN": "Неверный JWT-токен",
    "USER_NOT_FOUND": "Пользователь не найден",
    "INVALID_VK_SIGN": "Неверная подпись VK",
    "VK_SIGN_MISSING": "Подпись VK отсутствует",
    "VK_USER_ID_MISSING": "vk_user_id отсутствует",
    "VK_SECRET_NOT_CONFIGURED": "VK_APP_SECRET не настроен",
    "REPLAY_DETECTED": "Повторный запрос — возможна replay-атака",
    "REFRESH_EXPIRED": "Refresh token expired",
    "REFRESH_NOT_FOUND": "Сессия отозвана или не найдена",
    "NOT_MEMBER": "Доступ только для участников клуба Архипелаг",
    "GROUP_CHECK_FAILED": "Не удалось проверить членство в группе",
}


class AuthError(HTTPException):
    """Ошибка аутентификации с кодом."""

    def __init__(self, code: str, status: int = 401):
        message = ERROR_MESSAGES.get(code, code)
        super().__init__(
            status_code=status,
            detail={"code": code, "message": message},
        )
