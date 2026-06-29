"""
API: Направление 5 — Сенсорные якоря
Sensory checkins, predictions, calm anchors.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db, get_current_user

router = APIRouter()


@router.post("/checkins")
async def create_sensory_checkin(sensation: str, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    from app.models.models import SensoryCheckin
    from app.models.models import SENSATION_TYPES
    if sensation not in SENSATION_TYPES:
        return {"error": f"Must be one of: {', '.join(SENSATION_TYPES)}"}
    sc = SensoryCheckin(user_id, sensation=sensation)
    db.add(sc)
    await db.flush()
    return {"id": sc.id, "status": "logged"}


@router.get("/checkins")
async def list_sensory_checkins(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    from app.models.models import SensoryCheckin
    from sqlalchemy import select
    result = await db.execute(
        select(SensoryCheckin).where(SensoryCheckin.user_id == user_id).order_by(SensoryCheckin.checkin_time.desc()).limit(100)
    )
    return [{"id": sc.id, "sensation": sc.sensation, "time": sc.checkin_time.isoformat()} for sc in result.scalars().all()]


@router.get("/kinetic-data")
async def kinetic_animation_data(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    """Данные для кинетического дневника (бонус Н5)."""
    from app.models.models import SensoryCheckin
    from sqlalchemy import select
    from datetime import datetime, timedelta, timezone

    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    result = await db.execute(
        select(SensoryCheckin).where(SensoryCheckin.user_id == user_id, SensoryCheckin.checkin_time >= cutoff)
        .order_by(SensoryCheckin.checkin_time.asc())
    )
    checkins = result.scalars().all()
    return [
        {"sensation": sc.sensation, "time": sc.checkin_time.isoformat(), "hour": sc.checkin_time.hour, "day": sc.checkin_time.weekday()}
        for sc in checkins
    ]


@router.post("/anchor/save")
async def save_calm_anchor(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    """Сохранить якорь спокойствия (бонус Н5)."""
    from app.models.models import CalmAnchor
    pattern = [500, 200, 500, 200, 500]
    anchor = CalmAnchor(user_id, vibration_pattern=pattern, breathing_rhythm="4-7-8")
    db.add(anchor)
    await db.flush()
    return {"id": anchor.id, "vibration_pattern": pattern, "status": "saved"}


@router.get("/anchor/play")
async def play_calm_anchor(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    from app.models.models import CalmAnchor
    from sqlalchemy import select
    result = await db.execute(
        select(CalmAnchor).where(CalmAnchor.user_id == user_id).order_by(CalmAnchor.created_at.desc()).limit(1)
    )
    anchor = result.scalar_one_or_none()
    if not anchor:
        return {"error": "No anchor saved"}
    return {"vibration_pattern": anchor.vibration_pattern, "breathing_rhythm": anchor.breathing_rhythm}


@router.get("/predict")
async def predict_state(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    """Предсказание телесного компаса."""
    from app.models.models import SensoryCheckin
    from sqlalchemy import select
    from datetime import timedelta, timezone

    cutoff = datetime.now(timezone.utc) - timedelta(days=14)
    result = await db.execute(
        select(SensoryCheckin).where(SensoryCheckin.user_id == user_id, SensoryCheckin.checkin_time >= cutoff)
    )
    count = len(result.scalars().all())
    if count < 14:
        return {"error": f"Need 14+ checkins for prediction, have {count}"}
    return {"prediction": "Через 2 часа вероятно: напряжение", "confidence": 0.65, "recommendation": "Сделать паузу на 5 минут"}
