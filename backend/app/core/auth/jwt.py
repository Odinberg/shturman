"""
JWT service — access and refresh token creation.
"""

from datetime import datetime, timedelta, timezone
from jose import jwt

from app.core.config import settings


def create_access_token(user_id: int) -> str:
    """Краткосрочный JWT (15 минут) для API-запросов."""
    return jwt.encode(
        {
            "sub": str(user_id),
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        },
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(user_id: int) -> str:
    """Долгосрочный JWT (30 дней) для обновления access token."""
    return jwt.encode(
        {
            "sub": str(user_id),
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(days=30),
        },
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
