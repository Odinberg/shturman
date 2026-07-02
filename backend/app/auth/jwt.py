"""
JWT service — access and refresh token generation, decoding, verification.
"""

import uuid
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

from app.core.config import settings


def create_access_token(user_id: int) -> str:
    """Краткосрочный JWT (по умолчанию 15 минут)."""
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user_id),
            "type": "access",
            "jti": str(uuid.uuid4()),
            "iss": settings.JWT_ISSUER,
            "aud": settings.JWT_AUDIENCE,
            "iat": now,
            "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        },
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(user_id: int) -> str:
    """Долгосрочный JWT (по умолчанию 30 дней)."""
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user_id),
            "type": "refresh",
            "jti": str(uuid.uuid4()),
            "iss": settings.JWT_ISSUER,
            "iat": now,
            "exp": now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        },
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_token(token: str) -> dict:
    """Декодирует JWT. Райзит JWTError при истечении/невалидности."""
    return jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],
        options={"verify_exp": True},
    )


def verify_token(token: str, expected_type: str) -> dict:
    """
    Декодирует JWT и проверяет тип (access/refresh).
    Возвращает payload или райзит исключение.
    """
    payload = decode_token(token)

    token_type = payload.get("type")
    if token_type != expected_type:
        from app.auth.errors import AuthError
        raise AuthError("INVALID_TOKEN")

    return payload
