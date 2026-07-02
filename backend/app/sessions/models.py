"""
RefreshSession — модель для хранения refresh-токенов.
В БД хранится только SHA-256 хеш, не сам токен.
"""

import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey

from app.core.database import Base
from app.core.config import settings


def _utcnow():
    return datetime.now(timezone.utc)


class RefreshSession(Base):
    """Сессия refresh-токена."""

    __tablename__ = "refresh_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # SHA-256 хеш refresh-токена (сам токен не хранится)
    refresh_token_hash = Column(String(64), nullable=False, index=True)

    # Случайный UUID сессии (не браузерный device_id)
    session_uuid = Column(String(36), default=lambda: str(uuid.uuid4()))

    # Метаданные (не для аутентификации, для аудита)
    user_agent = Column(String(512), nullable=True)
    ip = Column(String(45), nullable=True)

    created_at = Column(DateTime(timezone=True), default=_utcnow)
    last_used_at = Column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)
    expires_at = Column(
        DateTime(timezone=True),
        default=lambda: _utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    revoked = Column(Boolean, default=False)
