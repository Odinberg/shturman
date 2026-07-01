"""
Сервисный слой для пользователей.
DRY: единая точка поиска/создания пользователя, защита от race condition.
"""

import logging
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import User

logger = logging.getLogger(__name__)

MAX_RETRIES = 3


async def get_or_create_user(db: AsyncSession, vk_user_id: str) -> User:
    """
    Атомарно находит или создаёт пользователя по vk_user_id.
    Защита от race condition: при IntegrityError (одновременный INSERT
    из двух запросов) откатывает транзакцию и повторяет SELECT.
    """
    for attempt in range(MAX_RETRIES):
        result = await db.execute(
            select(User).where(User.vk_user_id == vk_user_id)
        )
        user = result.scalar_one_or_none()

        if user:
            return user

        user = User(
            username=f"vk_{vk_user_id}",
            vk_user_id=str(vk_user_id),
        )
        db.add(user)

        try:
            await db.flush()
            return user
        except IntegrityError:
            await db.rollback()
            if attempt == MAX_RETRIES - 1:
                raise
            logger.warning(
                f"Race condition при создании пользователя vk_{vk_user_id}, "
                f"повтор {attempt + 2}/{MAX_RETRIES}"
            )
            continue

    raise RuntimeError(
        f"Не удалось создать пользователя vk_{vk_user_id} "
        f"после {MAX_RETRIES} попыток"
    )
