"""
API: Направление 4 — Диалог с Тенью
Shadow recordings, mirror letters, forbidden desires, anti-hero.
"""

from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db, get_current_user
from app.api.schemas import ShadowRecordingCreate, ApiResponse
from app.services.prompts import get_prompt

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/recordings")
async def create_recording(
    body: ShadowRecordingCreate = Body(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import ShadowRecording
    rec = ShadowRecording(user_id=user_id, transcript=body.transcript, irritation_target=body.irritation_target)
    db.add(rec)
    await db.flush()
    return ApiResponse(id=rec.id, status="recorded")


@router.get("/recordings")
async def list_recordings(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import ShadowRecording
    from sqlalchemy import select
    result = await db.execute(
        select(ShadowRecording).where(ShadowRecording.user_id == user_id).order_by(ShadowRecording.created_at.desc()).limit(20)
    )
    return [{"id": r.id, "target": r.irritation_target, "transcript": r.transcript[:200], "created_at": r.created_at.isoformat()} for r in result.scalars().all()]


@router.post("/mirror-letter")
async def generate_mirror_letter(
    recording_id: int = Body(..., ge=1, embed=True),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Зеркальный дублёр (бонус Н4)."""
    from app.models.models import ShadowRecording, MirrorLetter
    from openai import AsyncOpenAI
    from app.core.config import settings
    from app.core.ai import safe_ai_call

    rec = await db.get(ShadowRecording, recording_id)
    if not rec:
        return {"error": "recording not found"}

    system_prompt = get_prompt("mirror_double")

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    letter_text = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt,
        user=f"Капитан раздражён на: {rec.irritation_target}\n\nВот его голосовое сообщение:\n{rec.transcript}",
        temperature=0.8, max_tokens=1000, label="mirror_letter",
    )
    if not letter_text:
        return {"error": "AI временно недоступен, попробуйте позже"}

    ml = MirrorLetter(user_id=user_id, recording_id=recording_id, trait_name=rec.irritation_target, letter_text=letter_text)
    db.add(ml)
    await db.flush()
    return {"id": ml.id, "letter": letter_text}


@router.post("/forbidden-desire")
async def generate_forbidden_desire(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Карта запретных желаний (бонус Н4)."""
    from app.models.models import ShadowRecording, ForbiddenDesire
    from sqlalchemy import select
    from openai import AsyncOpenAI
    from app.core.config import settings
    from app.core.ai import safe_ai_call

    result = await db.execute(
        select(ShadowRecording).where(ShadowRecording.user_id == user_id).order_by(ShadowRecording.created_at.desc()).limit(3)
    )
    recordings = result.scalars().all()
    if len(recordings) < 3:
        return {"error": f"Need 3 recordings, have {len(recordings)}"}

    system_prompt = get_prompt("forbidden_desires")
    data = "\n\n".join(
        f"[{r.created_at.strftime('%d.%m')}] Раздражение на: {r.irritation_target}\n{r.transcript}"
        for r in recordings
    )

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    desire_text = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt, user=f"Три разбора:\n\n{data}",
        temperature=0.7, max_tokens=1200, label="forbidden_desire",
    )
    if not desire_text:
        return {"error": "AI временно недоступен, попробуйте позже"}

    fd = ForbiddenDesire(
        user_id=user_id,
        recording_ids=[r.id for r in recordings],
        desire_text=desire_text,
        protection_text="",
        hypnosis_script="",
    )
    db.add(fd)
    await db.flush()
    return {"id": fd.id, "desire": desire_text}


@router.post("/anti-hero")
async def generate_anti_hero_comic(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Анти-герой комикс (бонус Н4)."""
    from app.models.models import ForbiddenDesire, AntiHeroComic
    from sqlalchemy import select
    from openai import AsyncOpenAI
    from app.core.config import settings
    from app.core.ai import safe_ai_call

    result = await db.execute(
        select(ForbiddenDesire).where(ForbiddenDesire.user_id == user_id).order_by(ForbiddenDesire.created_at.desc()).limit(1)
    )
    fd = result.scalar_one_or_none()
    if not fd:
        return {"error": "No forbidden desire generated yet"}

    system_prompt = get_prompt("anti_hero")

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    comic_text = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt, user=f"Тень капитана: {fd.desire_text[:500]}",
        temperature=0.8, max_tokens=1000, label="anti_hero",
    )
    if not comic_text:
        return {"error": "AI временно недоступен, попробуйте позже"}

    import re
    dalle_match = re.search(r"Рисунок:\s*(.+?)(?:\n|$)", comic_text)
    dalle_prompt = dalle_match.group(1).strip() if dalle_match else ""

    ac = AntiHeroComic(
        user_id=user_id, shadow_trait=fd.desire_text[:128],
        script_json={"raw": comic_text}, dalle_prompt=dalle_prompt,
    )
    db.add(ac)
    await db.flush()
    return {"id": ac.id, "comic": comic_text, "dalle_prompt": dalle_prompt}


@router.get("/mirror-letters")
async def list_mirror_letters(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import MirrorLetter
    from sqlalchemy import select
    result = await db.execute(
        select(MirrorLetter).where(MirrorLetter.user_id == user_id).order_by(MirrorLetter.created_at.desc()).limit(10)
    )
    return [{"id": ml.id, "trait": ml.trait_name, "created_at": ml.created_at.isoformat()} for ml in result.scalars().all()]


@router.get("/anti-hero")
async def list_comics(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import AntiHeroComic
    from sqlalchemy import select
    result = await db.execute(
        select(AntiHeroComic).where(AntiHeroComic.user_id == user_id).order_by(AntiHeroComic.created_at.desc()).limit(10)
    )
    return [{"id": ac.id, "trait": ac.shadow_trait, "dalle_prompt": ac.dalle_prompt, "created_at": ac.created_at.isoformat()} for ac in result.scalars().all()]
