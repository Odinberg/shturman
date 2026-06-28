"""
API router — все эндпоинты Штурмана.
"""

from fastapi import APIRouter

from app.api.routes import health, auth, courses, journal, shturman_chat, community, bonuses, emotional, vk_auth

api_router = APIRouter()

# System
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(vk_auth.router, prefix="/auth", tags=["vk-auth"])

# Направление 1 — Активный дневник
api_router.include_router(journal.router, prefix="/journal", tags=["journal"])

# Направление 2 — Эмоциональный профиль
api_router.include_router(bonuses.router, prefix="/butterfly", tags=["butterfly"])
api_router.include_router(emotional.router, prefix="/emotional", tags=["emotional"])

# Направление 3 — Рефрейминг
api_router.include_router(courses.router, prefix="/reframing", tags=["reframing"])
api_router.include_router(shturman_chat.router, prefix="/sensory", tags=["sensory"])

# Направление 4 — Диалог с Тенью
api_router.include_router(community.router, prefix="/shadow", tags=["shadow"])
