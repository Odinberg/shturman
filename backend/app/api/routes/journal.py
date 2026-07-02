"""
API: Направление 1 — Активный дневник (Resonance)
Journal entries, pattern maps, alt reality.
"""

from typing import List
from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, get_current_user
from app.api.schemas import (
    JournalEntryCreate, JournalEntryResponse,
    AltRealityRequest, ApiResponse,
)
from app.services.prompts import get_prompt

router = APIRouter()


@router.get("/entries", response_model=List[JournalEntryResponse])
async def list_entries(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import JournalEntry
    from sqlalchemy import select
    result = await db.execute(
        select(JournalEntry).where(JournalEntry.user_id == user_id).order_by(JournalEntry.created_at.desc()).limit(50)
    )
    entries = result.scalars().all()
    return [JournalEntryResponse(id=e.id, content=e.content[:200], mood=e.mood, created_at=e.created_at.isoformat()) for e in entries]


@router.post("/entries")
async def create_entry(
    body: JournalEntryCreate = Body(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import JournalEntry
    entry = JournalEntry(user_id=user_id, content=body.content, mood=body.mood)
    db.add(entry)
    await db.flush()
    return ApiResponse(id=entry.id, status="created")


@router.get("/entries/{entry_id}", response_model=JournalEntryResponse)
async def get_entry(
    entry_id: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import JournalEntry
    result = await db.get(JournalEntry, entry_id)
    if not result or result.user_id != user_id:
        raise HTTPException(status_code=404, detail="Entry not found")
    return JournalEntryResponse(id=result.id, content=result.content, mood=result.mood, created_at=result.created_at.isoformat())


@router.post("/patterns/generate")
async def generate_pattern_map(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Генерация карты повторяющихся сценариев (бонус Н1)."""
    from app.models.models import JournalEntry, PatternMap
    from sqlalchemy import select
    from datetime import datetime, timedelta, timezone
    from app.core.config import settings
    from app.core.ai import safe_ai_call, get_ai_client

    cutoff = datetime.now(timezone.utc) - timedelta(days=21)
    result = await db.execute(
        select(JournalEntry).where(JournalEntry.user_id == user_id, JournalEntry.created_at >= cutoff)
        .order_by(JournalEntry.created_at.asc())
    )
    entries = result.scalars().all()

    if len(entries) < 7:
        return {"error": f"Need at least 7 entries, have {len(entries)}"}

    system_prompt = get_prompt("pattern_map")
    entries_text = "\n\n".join(
        f"[{e.created_at.strftime('%d.%m')}] {e.content}" for e in entries
    )

    client = get_ai_client()
    pattern_text = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt,
        user=f"Вот записи капитана за последние 21 день (с {entries[0].created_at.strftime('%d.%m')} по {entries[-1].created_at.strftime('%d.%m')}):\n\n{entries_text}",
        temperature=0.7, max_tokens=1500, label="pattern_map",
    )
    if not pattern_text:
        return {"error": "AI временно недоступен, попробуйте позже"}

    pm = PatternMap(
        user_id=user_id,
        period_start=entries[0].created_at.date(),
        period_end=entries[-1].created_at.date(),
        patterns_json={"raw": pattern_text},
    )
    db.add(pm)
    await db.flush()

    return {"id": pm.id, "patterns": pattern_text}


@router.post("/alt-reality")
async def generate_alt_reality(
    body: AltRealityRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Создать альтернативную реальность для записи (бонус Н1)."""
    from app.models.models import JournalEntry, AltRealitySession
    from app.core.config import settings
    from app.core.ai import safe_ai_call, get_ai_client

    entry = await db.get(JournalEntry, body.entry_id)
    if not entry:
        return {"error": "entry not found"}

    system_prompt = get_prompt("alt_reality")

    client = get_ai_client()
    rewritten = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt,
        user=f"Жанр: {body.genre}\n\nЗапись капитана:\n{entry.content}",
        temperature=0.8, max_tokens=1200, label="alt_reality",
    )
    if not rewritten:
        return {"error": "AI временно недоступен, попробуйте позже"}

    session = AltRealitySession(
        user_id=user_id,
        journal_entry_id=body.entry_id,
        genre=body.genre,
        original_text=entry.content,
        rewritten_text=rewritten,
    )
    db.add(session)
    await db.flush()

    return {"id": session.id, "genre": body.genre, "rewritten": rewritten}


@router.get("/patterns")
async def list_pattern_maps(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import PatternMap
    from sqlalchemy import select
    result = await db.execute(select(PatternMap).where(PatternMap.user_id == user_id).order_by(PatternMap.created_at.desc()).limit(10))
    return [{"id": pm.id, "period": f"{pm.period_start} - {pm.period_end}", "created_at": pm.created_at.isoformat()} for pm in result.scalars().all()]


@router.get("/alt-reality")
async def list_alt_reality_sessions(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import AltRealitySession
    from sqlalchemy import select
    result = await db.execute(select(AltRealitySession).where(AltRealitySession.user_id == user_id).order_by(AltRealitySession.created_at.desc()).limit(10))
    return [{"id": s.id, "genre": s.genre, "created_at": s.created_at.isoformat()} for s in result.scalars().all()]
