"""
API: Направление 2 — Эмоциональный профиль
Checkins, biorhythm, resource states, avatar.
"""

from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_current_user
from app.api.schemas import EmotionalCheckinCreate, ApiResponse
from app.services.prompts import get_prompt

router = APIRouter()


@router.post("/checkins")
async def create_checkin(
    body: EmotionalCheckinCreate = Body(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import EmotionalCheckin
    checkin = EmotionalCheckin(user_id=user_id, emoji=body.emoji, event_words=body.event_text)
    db.add(checkin)
    await db.flush()
    return ApiResponse(id=checkin.id, status="logged")


@router.get("/checkins")
async def list_checkins(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import EmotionalCheckin
    from sqlalchemy import select
    result = await db.execute(
        select(EmotionalCheckin).where(EmotionalCheckin.user_id == user_id)
        .order_by(EmotionalCheckin.checkin_time.desc()).limit(100)
    )
    return [
        {"id": c.id, "emoji": c.emoji, "event": c.event_words, "time": c.checkin_time.isoformat()}
        for c in result.scalars().all()
    ]


@router.get("/checkins/streak")
async def checkin_streak(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import EmotionalCheckin
    from sqlalchemy import select, func, cast, Date
    result = await db.execute(
        select(cast(EmotionalCheckin.checkin_time, Date), func.count(EmotionalCheckin.id))
        .where(EmotionalCheckin.user_id == user_id)
        .group_by(cast(EmotionalCheckin.checkin_time, Date))
        .order_by(cast(EmotionalCheckin.checkin_time, Date).desc()).limit(30)
    )
    days = [{"date": str(r[0]), "count": r[1]} for r in result.all()]
    total_days = len(days)
    return {"total_days": total_days, "days": days, "bonus_unlocked": total_days >= 14}


@router.post("/biorhythm")
async def generate_biorhythm(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Генерировать отчёт биоритмолога (бонус Н2)."""
    from app.models.models import EmotionalCheckin, BiorhythmReport
    from sqlalchemy import select
    from openai import AsyncOpenAI
    from app.core.config import settings
    from app.core.ai import safe_ai_call
    from datetime import datetime, timedelta, timezone

    cutoff = datetime.now(timezone.utc) - timedelta(days=14)
    result = await db.execute(
        select(EmotionalCheckin).where(EmotionalCheckin.user_id == user_id, EmotionalCheckin.checkin_time >= cutoff)
        .order_by(EmotionalCheckin.checkin_time.asc())
    )
    checkins = result.scalars().all()

    if len(checkins) < 14:
        return {"error": f"Need 14+ checkins, have {len(checkins)}"}

    system_prompt = get_prompt("biorhythm")
    data = "\n".join(
        f"[{c.checkin_time.strftime('%a %d.%m %H:%M')}] {c.emoji} — {c.event_words}"
        for c in checkins
    )

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    report_text = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt, user=f"Вот {len(checkins)} чекинов за 14+ дней:\n\n{data}",
        temperature=0.7, max_tokens=1000, label="biorhythm",
    )
    if not report_text:
        return {"error": "AI временно недоступен, попробуйте позже"}

    report = BiorhythmReport(user_id=user_id, period_days=len(checkins), report_text=report_text)
    db.add(report)
    await db.flush()

    return {"id": report.id, "report": report_text}


@router.get("/biorhythm")
async def list_biorhythm_reports(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import BiorhythmReport
    from sqlalchemy import select
    result = await db.execute(
        select(BiorhythmReport).where(BiorhythmReport.user_id == user_id).order_by(BiorhythmReport.created_at.desc()).limit(10)
    )
    return [{"id": r.id, "period_days": r.period_days, "created_at": r.created_at.isoformat()} for r in result.scalars().all()]


@router.post("/resources")
async def generate_resource_collection(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Генерировать коллекцию ресурсных состояний (бонус Н2)."""
    from app.models.models import JournalEntry, ResourceCollection
    from sqlalchemy import select
    from openai import AsyncOpenAI
    from app.core.config import settings
    from app.core.ai import safe_ai_call

    result = await db.execute(
        select(JournalEntry).where(JournalEntry.user_id == user_id).order_by(JournalEntry.created_at.desc()).limit(50)
    )
    entries = result.scalars().all()

    system_prompt = get_prompt("resource_states")
    data = "\n\n".join(f"[{e.created_at.strftime('%d.%m')}] {e.content}" for e in entries)

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    resources = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt, user=f"Вот записи за месяц:\n\n{data}",
        temperature=0.7, max_tokens=1500, label="resource_states",
    )
    if not resources:
        return {"error": "AI временно недоступен, попробуйте позже"}

    from datetime import datetime
    month = datetime.now().strftime("%Y-%m")
    rc = ResourceCollection(user_id=user_id, month=month, resources_json={"raw": resources})
    db.add(rc)
    await db.flush()

    return {"id": rc.id, "resources": resources}


@router.get("/resources")
async def list_resource_collections(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import ResourceCollection
    from sqlalchemy import select
    result = await db.execute(
        select(ResourceCollection).where(ResourceCollection.user_id == user_id).order_by(ResourceCollection.created_at.desc()).limit(10)
    )
    return [{"id": rc.id, "month": rc.month, "created_at": rc.created_at.isoformat()} for rc in result.scalars().all()]


@router.post("/avatar")
async def generate_avatar(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Генерировать эмоциональный аватар недели (бонус Н2)."""
    from app.models.models import EmotionalCheckin, EmotionalAvatar
    from sqlalchemy import select
    from openai import AsyncOpenAI
    from app.core.config import settings
    from app.core.ai import safe_ai_call
    from datetime import datetime, timedelta, timezone

    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    result = await db.execute(
        select(EmotionalCheckin).where(EmotionalCheckin.user_id == user_id, EmotionalCheckin.checkin_time >= cutoff)
        .order_by(EmotionalCheckin.checkin_time.asc())
    )
    checkins = result.scalars().all()

    if len(checkins) < 7:
        return {"error": f"Need 7 checkins for a week, have {len(checkins)}"}

    system_prompt = get_prompt("emotional_avatar")
    data = "\n".join(f"[{c.checkin_time.strftime('%a %H:%M')}] {c.emoji} — {c.event_words}" for c in checkins)

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    avatar_text = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt, user=f"Чекины за эту неделю:\n\n{data}",
        temperature=0.8, max_tokens=800, label="emotional_avatar",
    )
    if not avatar_text:
        return {"error": "AI временно недоступен, попробуйте позже"}

    import re
    dalle_match = re.search(r"Промпт для генерации:\s*(.+?)(?:\n|$)", avatar_text)
    dalle_prompt = dalle_match.group(1).strip() if dalle_match else ""

    avatar = EmotionalAvatar(
        user_id=user_id,
        week_start=datetime.now().date() - timedelta(days=6),
        avatar_text=avatar_text,
        dalle_prompt=dalle_prompt,
    )
    db.add(avatar)
    await db.flush()

    return {"id": avatar.id, "avatar": avatar_text, "dalle_prompt": dalle_prompt}


@router.get("/avatar")
async def list_avatars(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import EmotionalAvatar
    from sqlalchemy import select
    result = await db.execute(
        select(EmotionalAvatar).where(EmotionalAvatar.user_id == user_id).order_by(EmotionalAvatar.created_at.desc()).limit(10)
    )
    return [{"id": a.id, "week": str(a.week_start), "dalle_prompt": a.dalle_prompt, "created_at": a.created_at.isoformat()} for a in result.scalars().all()]
