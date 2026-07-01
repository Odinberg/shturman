"""
Штурман — AI-навигатор клуба Архипелаг.
FastAPI backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings
from app.core.database import engine, Base, async_session
from app.api.router import api_router
from app.services.prompts import reload_prompts, list_prompts

# Ensure all models are registered on Base.metadata before create_all
import app.models.models  # noqa: F401

# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_DEFAULT])

# Create tables (dev mode; production uses Alembic migrations)
# Base.metadata.create_all will be called on startup

app = FastAPI(
    title="Штурман API",
    description="AI-навигатор для клуба Архипелаг",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix="/api")


@app.on_event("startup")
async def startup():
    """Create tables on startup (dev mode)."""
    # Загружаем промпты в кеш
    count = reload_prompts()
    print(f"📝 Загружено {count} промптов в кеш: {list_prompts()}")

    # Dev mode: auto-create tables if they don't exist.
    # Production: use "alembic upgrade head" via deploy.sh
    if settings.DEBUG:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("ℹ️  Dev mode: tables auto-created (production uses Alembic)")

        # Create default dev user if none exists
        from sqlalchemy import select
        from app.models.models import User
        async with async_session() as session:
            result = await session.execute(select(User).where(User.id == 1))
            if not result.scalar_one_or_none():
                session.add(User(id=1, username="dev_user"))
                await session.commit()
                print("👤 Dev mode: default user created (id=1)")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "shturman"}
