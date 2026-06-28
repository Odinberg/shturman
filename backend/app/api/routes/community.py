"""
API: Направление 4 — Диалог с Тенью
Shadow recordings, mirror letters, forbidden desires, anti-hero.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter()


@router.post("/recordings")
async def create_recording(transcript: str, irritation_target: str, db: AsyncSession = Depends(get_db)):
    from app.models.models import ShadowRecording
    rec = ShadowRecording(user_id=1, transcript=transcript, irritation_target=irritation_target)
    db.add(rec)
    await db.flush()
    return {"id": rec.id, "status": "recorded"}


@router.get("/recordings")
async def list_recordings(db: AsyncSession = Depends(get_db)):
    from app.models.models import ShadowRecording
    from sqlalchemy import select
    result = await db.execute(
        select(ShadowRecording).where(ShadowRecording.user_id == 1).order_by(ShadowRecording.created_at.desc()).limit(20)
    )
    return [{"id": r.id, "target": r.irritation_target, "transcript": r.transcript[:200], "created_at": r.created_at.isoformat()} for r in result.scalars().all()]


@router.post("/mirror-letter")
async def generate_mirror_letter(recording_id: int, db: AsyncSession = Depends(get_db)):
    """Зеркальный дублёр (бонус Н4)."""
    from app.models.models import ShadowRecording, MirrorLetter
    from openai import AsyncOpenAI
    from app.core.config import settings

    rec = await db.get(ShadowRecording, recording_id)
    if not rec:
        return {"error": "recording not found"}, 404

    prompt_path = "app/prompts/mirror_double.md"
    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Капитан раздражён на: {rec.irritation_target}\n\nВот его голосовое сообщение:\n{rec.transcript}"},
        ],
        temperature=0.8, max_tokens=1000,
    )

    letter_text = response.choices[0].message.content

    ml = MirrorLetter(user_id=1, recording_id=recording_id, trait_name=rec.irritation_target, letter_text=letter_text)
    db.add(ml)
    await db.flush()
    return {"id": ml.id, "letter": letter_text}


@router.post("/forbidden-desire")
async def generate_forbidden_desire(db: AsyncSession = Depends(get_db)):
    """Карта запретных желаний (бонус Н4)."""
    from app.models.models import ShadowRecording, ForbiddenDesire
    from sqlalchemy import select
    from openai import AsyncOpenAI
    from app.core.config import settings

    result = await db.execute(
        select(ShadowRecording).where(ShadowRecording.user_id == 1).order_by(ShadowRecording.created_at.desc()).limit(3)
    )
    recordings = result.scalars().all()
    if len(recordings) < 3:
        return {"error": f"Need 3 recordings, have {len(recordings)}"}

    prompt_path = "app/prompts/forbidden_desires.md"
    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    data = "\n\n".join(
        f"[{r.created_at.strftime('%d.%m')}] Раздражение на: {r.irritation_target}\n{r.transcript}"
        for r in recordings
    )

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Три разбора:\n\n{data}"},
        ],
        temperature=0.7, max_tokens=1200,
    )

    desire_text = response.choices[0].message.content
    fd = ForbiddenDesire(
        user_id=1,
        recording_ids=[r.id for r in recordings],
        desire_text=desire_text,
        protection_text="",
        hypnosis_script="",
    )
    db.add(fd)
    await db.flush()
    return {"id": fd.id, "desire": desire_text}


@router.post("/anti-hero")
async def generate_anti_hero_comic(db: AsyncSession = Depends(get_db)):
    """Анти-герой комикс (бонус Н4)."""
    from app.models.models import ForbiddenDesire, AntiHeroComic
    from sqlalchemy import select
    from openai import AsyncOpenAI
    from app.core.config import settings

    result = await db.execute(
        select(ForbiddenDesire).where(ForbiddenDesire.user_id == 1).order_by(ForbiddenDesire.created_at.desc()).limit(1)
    )
    fd = result.scalar_one_or_none()
    if not fd:
        return {"error": "No forbidden desire generated yet"}

    prompt_path = "app/prompts/anti_hero.md"
    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Тень капитана: {fd.desire_text[:500]}"},
        ],
        temperature=0.8, max_tokens=1000,
    )

    comic_text = response.choices[0].message.content
    import re
    dalle_match = re.search(r"Рисунок:\s*(.+?)(?:\n|$)", comic_text)
    dalle_prompt = dalle_match.group(1).strip() if dalle_match else ""

    ac = AntiHeroComic(
        user_id=1, shadow_trait=fd.desire_text[:128],
        script_json={"raw": comic_text}, dalle_prompt=dalle_prompt,
    )
    db.add(ac)
    await db.flush()
    return {"id": ac.id, "comic": comic_text, "dalle_prompt": dalle_prompt}


@router.get("/mirror-letters")
async def list_mirror_letters(db: AsyncSession = Depends(get_db)):
    from app.models.models import MirrorLetter
    from sqlalchemy import select
    result = await db.execute(
        select(MirrorLetter).where(MirrorLetter.user_id == 1).order_by(MirrorLetter.created_at.desc()).limit(10)
    )
    return [{"id": ml.id, "trait": ml.trait_name, "created_at": ml.created_at.isoformat()} for ml in result.scalars().all()]


@router.get("/anti-hero")
async def list_comics(db: AsyncSession = Depends(get_db)):
    from app.models.models import AntiHeroComic
    from sqlalchemy import select
    result = await db.execute(
        select(AntiHeroComic).where(AntiHeroComic.user_id == 1).order_by(AntiHeroComic.created_at.desc()).limit(10)
    )
    return [{"id": ac.id, "trait": ac.shadow_trait, "dalle_prompt": ac.dalle_prompt, "created_at": ac.created_at.isoformat()} for ac in result.scalars().all()]
