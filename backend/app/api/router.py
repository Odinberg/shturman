"""
API router — все эндпоинты Штурмана.
"""

from fastapi import APIRouter

from app.api.routes import health, auth, courses, journal, shturman_chat, community, bonuses

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(journal.router, prefix="/journal", tags=["journal"])
api_router.include_router(shturman_chat.router, prefix="/shturman", tags=["shturman"])
api_router.include_router(community.router, prefix="/community", tags=["community"])
api_router.include_router(bonuses.router, prefix="/bonuses", tags=["bonuses"])
