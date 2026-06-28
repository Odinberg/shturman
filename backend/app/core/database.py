"""
Database engine and session configuration.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """Dependency: yields a database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_current_user(
    request: __import__("fastapi").Request,
    db: AsyncSession = __import__("fastapi").Depends(get_db),
) -> int:
    """
    Dependency: возвращает user_id из JWT токена или 1 (dev-режим).
    Для VK Mini App: токен передаётся в header Authorization: Bearer <token>
    или параметры VK передаются через query string с подписью.
    """
    from sqlalchemy import select
    from app.models.models import User
    from app.core.config import settings
    from app.services.vk_auth import verify_vk_signature, parse_vk_user_id

    # Пробуем JWT токен
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            from jose import jwt, JWTError
            token = auth_header.split(" ", 1)[1]
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            user_id = int(payload["sub"])
            # Проверяем, что пользователь существует
            result = await db.execute(select(User).where(User.id == user_id))
            if result.scalar_one_or_none():
                return user_id
        except (JWTError, ValueError, KeyError):
            pass

    # Пробуем VK Mini App параметры
    vk_user_id = request.query_params.get("vk_user_id")
    if vk_user_id and settings.VK_APP_SECRET:
        query_string = str(request.query_params)
        if verify_vk_signature(query_string, settings.VK_APP_SECRET):
            result = await db.execute(
                select(User).where(User.vk_user_id == str(vk_user_id))
            )
            user = result.scalar_one_or_none()
            if user:
                return user.id

    # Dev-режим: возвращаем пользователя по умолчанию (id=1)
    if settings.DEBUG:
        # Убедимся, что пользователь-заглушка существует
        result = await db.execute(select(User).where(User.id == 1))
        if result.scalar_one_or_none():
            return 1

    # Неаутентифицированный доступ — возвращаем 0 для read-only
    return 0
