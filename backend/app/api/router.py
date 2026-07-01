"""
API router — все эндпоинты Штурмана.
"""

from fastapi import APIRouter

from app.api.routes import health, vk_auth
from app.api.routes import journal
from app.api.routes import emotional
from app.api.routes import reframing
from app.api.routes import shadow
from app.api.routes import sensory
from app.api.routes import multiplicity
from app.api.routes import butterfly

api_router = APIRouter()

# System
api_router.include_router(health.router, tags=["health"])
api_router.include_router(vk_auth.router, prefix="/auth", tags=["vk-auth"])

# Direction 1 — Активный дневник
api_router.include_router(journal.router, prefix="/journal", tags=["journal"])

# Direction 2 — Эмоциональный профиль
api_router.include_router(emotional.router, prefix="/emotional", tags=["emotional"])

# Direction 3 — Рефрейминг
api_router.include_router(reframing.router, prefix="/reframing", tags=["reframing"])

# Direction 4 — Диалог с Тенью
api_router.include_router(shadow.router, prefix="/shadow", tags=["shadow"])

# Direction 5 — Сенсорные якоря
api_router.include_router(sensory.router, prefix="/sensory", tags=["sensory"])

# Direction 6 — Множественность Я
api_router.include_router(multiplicity.router, prefix="/self", tags=["multiplicity"])

# Direction 7 — Эффект Бабочки
api_router.include_router(butterfly.router, prefix="/butterfly", tags=["butterfly"])
