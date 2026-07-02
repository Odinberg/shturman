"""
Session repository — работа с refresh-сессиями.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.sessions.models import RefreshSession


async def store_session(db: AsyncSession, session: RefreshSession) -> None:
    """Сохраняет новую refresh-сессию."""
    db.add(session)
    await db.commit()


async def is_valid_refresh(db: AsyncSession, user_id: int, token_hash: str) -> bool:
    """Проверяет, что refresh-сессия существует и не отозвана."""
    result = await db.execute(
        select(RefreshSession).where(
            RefreshSession.user_id == user_id,
            RefreshSession.refresh_token_hash == token_hash,
            RefreshSession.revoked == False,  # noqa: E712
        )
    )
    return result.scalar_one_or_none() is not None


async def revoke_session(db: AsyncSession, user_id: int, token_hash: str) -> None:
    """Отзывает refresh-сессию (при ротации токенов)."""
    result = await db.execute(
        select(RefreshSession).where(
            RefreshSession.user_id == user_id,
            RefreshSession.refresh_token_hash == token_hash,
        ).limit(1)
    )
    session = result.scalar_one_or_none()
    if session:
        session.revoked = True
        await db.commit()
