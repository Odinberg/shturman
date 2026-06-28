"""
Health check endpoints.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "shturman"}


@router.get("/health/db")
async def health_db():
    """Check database connection."""
    from app.core.database import async_session
    try:
        async with async_session() as session:
            await session.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}
