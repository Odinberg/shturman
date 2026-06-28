"""
API: Направление 1 — Активный дневник (Resonance)
Journal entries, pattern maps, alt reality.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

router = APIRouter()


@router.get("/entries")
async def list_entries(db: AsyncSession = Depends(get_db)):
    from app.models.models import JournalEntry
    from sqlalchemy import select
    result = await db.execute(select(JournalEntry).order_by(JournalEntry.created_at.desc()).limit(50))
    entries = result.scalars().all()
    return [{"id": e.id, "content": e.content[:200], "mood": e.mood, "created_at": e.created_at.isoformat()} for e in entries]


@router.post("/entries")
async def create_entry(content: str, mood: str = None, db: AsyncSession = Depends(get_db)):
    from app.models.models import JournalEntry
    entry = JournalEntry(user_id=1, content=content, mood=mood)
    db.add(entry)
    await db.flush()
    return {"id": entry.id, "status": "created"}


@router.get("/entries/{entry_id}")
async def get_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.models import JournalEntry
    result = await db.get(JournalEntry, entry_id)
    if not result:
        return {"error": "not found"}, 404
    return {"id": result.id, "content": result.content, "mood": result.mood, "created_at": result.created_at.isoformat()}


@router.post("/patterns/generate")
async def generate_pattern_map(db: AsyncSession = Depends(get_db)):
    """Генерация карты повторяющихся сценариев (бонус Н1)."""
    from app.models.models import JournalEntry, PatternMap
    from sqlalchemy import select
    from datetime import datetime, timedelta, timezone
    from openai import AsyncOpenAI
    from app.core.config import settings

    cutoff = datetime.now(timezone.utc) - timedelta(days=21)
    result = await db.execute(
        select(JournalEntry).where(JournalEntry.user_id == 1, JournalEntry.created_at >= cutoff)
        .order_by(JournalEntry.created_at.asc())
    )
    entries = result.scalars().all()

    if len(entries) < 7:
        return {"error": f"Need at least 7 entries, have {len(entries)}"}

    prompt_path = "app/prompts/pattern_map.md"
    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    entries_text = "\n\n".join(
        f"[{e.created_at.strftime('%d.%m')}] {e.content}" for e in entries
    )

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Вот записи капитана за последние 21 день (с {entries[0].created_at.strftime('%d.%m')} по {entries[-1].created_at.strftime('%d.%m')}):\n\n{entries_text}"},
        ],
        temperature=0.7,
        max_tokens=1500,
    )

    pattern_text = response.choices[0].message.content

    pm = PatternMap(
        user_id=1,
        period_start=entries[0].created_at.date(),
        period_end=entries[-1].created_at.date(),
        patterns_json={"raw": pattern_text},
    )
    db.add(pm)
    await db.flush()

    return {"id": pm.id, "patterns": pattern_text}


@router.post("/alt-reality")
async def generate_alt_reality(entry_id: int, genre: str, db: AsyncSession = Depends(get_db)):
    """Создать альтернативную реальность для записи (бонус Н1)."""
    from app.models.models import JournalEntry, AltRealitySession
    from openai import AsyncOpenAI
    from app.core.config import settings

    entry = await db.get(JournalEntry, entry_id)
    if not entry:
        return {"error": "entry not found"}, 404

    prompt_path = "app/prompts/alt_reality.md"
    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Жанр: {genre}\n\nЗапись капитана:\n{entry.content}"},
        ],
        temperature=0.8,
        max_tokens=1200,
    )

    rewritten = response.choices[0].message.content

    session = AltRealitySession(
        user_id=1,
        journal_entry_id=entry_id,
        genre=genre,
        original_text=entry.content,
        rewritten_text=rewritten,
    )
    db.add(session)
    await db.flush()

    return {"id": session.id, "genre": genre, "rewritten": rewritten}


@router.get("/patterns")
async def list_pattern_maps(db: AsyncSession = Depends(get_db)):
    from app.models.models import PatternMap
    from sqlalchemy import select
    result = await db.execute(select(PatternMap).where(PatternMap.user_id == 1).order_by(PatternMap.created_at.desc()).limit(10))
    return [{"id": pm.id, "period": f"{pm.period_start} - {pm.period_end}", "created_at": pm.created_at.isoformat()} for pm in result.scalars().all()]


@router.get("/alt-reality")
async def list_alt_reality_sessions(db: AsyncSession = Depends(get_db)):
    from app.models.models import AltRealitySession
    from sqlalchemy import select
    result = await db.execute(select(AltRealitySession).where(AltRealitySession.user_id == 1).order_by(AltRealitySession.created_at.desc()).limit(10))
    return [{"id": s.id, "genre": s.genre, "created_at": s.created_at.isoformat()} for s in result.scalars().all()]
