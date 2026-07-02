"""
RefreshSession — модель для хранения refresh-токенов.
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from app.core.database import Base
from datetime import datetime, timezone


def _utcnow():
    return datetime.now(timezone.utc)


class RefreshSession(Base):
    """Сессия refresh-токена. Привязка к устройству, IP, возможность отзыва."""

    __tablename__ = "refresh_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    refresh_token_hash = Column(String(64), nullable=False, index=True)
    device_id = Column(String(512), nullable=True)
    ip = Column(String(45), nullable=True)

    created_at = Column(DateTime(timezone=True), default=_utcnow)
    revoked = Column(Boolean, default=False)
