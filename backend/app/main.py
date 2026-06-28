"""
Штурман — AI-навигатор клуба Архипелаг.
FastAPI backend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.api.router import api_router

# Ensure all models are registered on Base.metadata before create_all
import app.models.models  # noqa: F401

# Create tables (dev mode; production uses Alembic migrations)
# Base.metadata.create_all will be called on startup

app = FastAPI(
    title="Штурман API",
    description="AI-навигатор для клуба Архипелаг",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix="/api")


@app.on_event("startup")
async def startup():
    """Create tables on startup (dev mode)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "shturman"}
