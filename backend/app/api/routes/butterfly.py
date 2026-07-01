"""
API: Направление 7 — Эффект Бабочки
Butterfly events, fractal cards, wonder vaults.
"""

from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db, get_current_user
from app.api.schemas import ButterflyEventCreate, FractalRequest, ApiResponse
from app.services.prompts import get_prompt

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/events")
async def create_butterfly_event(
    body: ButterflyEventCreate = Body(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import ButterflyEvent
    ev = ButterflyEvent(user_id=user_id, event_text=body.event_text)
    db.add(ev)
    await db.flush()
    return ApiResponse(id=ev.id, status="logged")


@router.get("/events")
async def list_events(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import ButterflyEvent
    from sqlalchemy import select
    result = await db.execute(
        select(ButterflyEvent).where(ButterflyEvent.user_id == user_id).order_by(ButterflyEvent.event_date.desc()).limit(100)
    )
    return [{"id": e.id, "event": e.event_text, "date": str(e.event_date)} for e in result.scalars().all()]


@router.get("/events/count")
async def event_stats(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import ButterflyEvent
    from sqlalchemy import select, func
    result = await db.execute(
        select(func.count(ButterflyEvent.id)).where(ButterflyEvent.user_id == user_id)
    )
    total = result.scalar()
    return {"total_events": total, "bonus_unlocked": total >= 7}


@router.post("/fractal")
async def generate_fractal(
    body: FractalRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Фрактал дня (бонус Н7)."""
    from app.models.models import ButterflyEvent, FractalCard
    from openai import AsyncOpenAI
    from app.core.config import settings
    from app.core.ai import safe_ai_call

    event = await db.get(ButterflyEvent, body.event_id)
    if not event:
        return {"error": "event not found"}

    system_prompt = get_prompt("fractal_day")

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    insight = await safe_ai_call(
        client=client,
        model=settings.OPENAI_MODEL,
        system=system_prompt,
        user=f"Событие: {event.event_text}",
        temperature=0.8,
        max_tokens=800,
        label="fractal_day",
    )
    if not insight:
        return {"error": "AI временно недоступен, попробуйте позже"}

    fc = FractalCard(user_id=user_id, event_id=body.event_id, association_chain={"raw": insight}, insight_text=insight)
    db.add(fc)
    await db.flush()
    return {"id": fc.id, "insight": insight}


@router.post("/vault")
async def generate_wonder_vault(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Копилка чудес (бонус Н7)."""
    from app.models.models import ButterflyEvent, WonderVault
    from sqlalchemy import select
    from openai import AsyncOpenAI
    from app.core.config import settings
    from app.core.ai import safe_ai_call

    result = await db.execute(
        select(ButterflyEvent).where(ButterflyEvent.user_id == user_id).order_by(ButterflyEvent.event_date.asc()).limit(100)
    )
    events = result.scalars().all()
    if len(events) < 7:
        return {"error": f"Need 7+ events, have {len(events)}"}

    system_prompt = get_prompt("wonder_vault")
    data = "\n".join(f"[{e.event_date}] {e.event_text}" for e in events)

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    vault_text = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt, user=f"30 событий месяца:\n\n{data}",
        temperature=0.8, max_tokens=1500, label="wonder_vault",
    )
    if not vault_text:
        return {"error": "AI временно недоступен, попробуйте позже"}

    from datetime import datetime
    month = datetime.now().strftime("%Y-%m")
    wv = WonderVault(user_id=user_id, month=month, slideshow_text=vault_text)
    db.add(wv)
    await db.flush()
    return {"id": wv.id, "vault": vault_text}


@router.get("/fractal")
async def list_fractals(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import FractalCard
    from sqlalchemy import select
    result = await db.execute(
        select(FractalCard).where(FractalCard.user_id == user_id).order_by(FractalCard.created_at.desc()).limit(20)
    )
    return [{"id": fc.id, "event_id": fc.event_id, "created_at": fc.created_at.isoformat()} for fc in result.scalars().all()]


@router.get("/vault")
async def list_vaults(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import WonderVault
    from sqlalchemy import select
    result = await db.execute(
        select(WonderVault).where(WonderVault.user_id == user_id).order_by(WonderVault.created_at.desc()).limit(10)
    )
    return [{"id": wv.id, "month": wv.month, "has_parable": bool(wv.parable_text)} for wv in result.scalars().all()]
