"""
API: Направление 6 — Множественность Я
Subpersonality posts, round table, family portrait, negotiator.
"""

from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db, get_current_user
from app.api.schemas import SubpersonalityPostCreate, NegotiatorRequest, ApiResponse
from app.services.prompts import get_prompt

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/posts")
async def create_subpersonality_post(
    body: SubpersonalityPostCreate = Body(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Создать запись от лица субличности (Н6-основа)."""
    from app.models.models import SubpersonalityPost
    post = SubpersonalityPost(user_id=user_id, subpersonality=body.subpersonality, content=body.content)
    db.add(post)
    await db.flush()
    return ApiResponse(id=post.id, status="created")


@router.get("/posts")
async def list_posts(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Список последних 50 записей субличностей пользователя."""
    from app.models.models import SubpersonalityPost
    from sqlalchemy import select
    result = await db.execute(
        select(SubpersonalityPost).where(SubpersonalityPost.user_id == user_id).order_by(SubpersonalityPost.post_date.desc()).limit(50)
    )
    return [{"id": p.id, "subpersonality": p.subpersonality, "content": p.content[:200], "date": str(p.post_date)} for p in result.scalars().all()]


@router.get("/posts/stats")
async def subpersonality_stats(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Статистика — сколько записей от каждой субличности."""
    from app.models.models import SubpersonalityPost
    from sqlalchemy import select, func
    result = await db.execute(
        select(SubpersonalityPost.subpersonality, func.count(SubpersonalityPost.id))
        .where(SubpersonalityPost.user_id == user_id)
        .group_by(SubpersonalityPost.subpersonality)
    )
    return [{"persona": r[0], "count": r[1]} for r in result.all()]


@router.post("/round-table")
async def generate_round_table(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Круглый стол (бонус Н6)."""
    from app.models.models import SubpersonalityPost, RoundTableSession
    from sqlalchemy import select
    from openai import AsyncOpenAI
    from app.core.config import settings
    from app.core.ai import safe_ai_call

    result = await db.execute(
        select(SubpersonalityPost).where(SubpersonalityPost.user_id == user_id).order_by(SubpersonalityPost.post_date.desc()).limit(10)
    )
    posts = result.scalars().all()
    if len(posts) < 4:
        return {"error": f"Need 4+ subpersonality posts, have {len(posts)}"}

    system_prompt = get_prompt("round_table")
    data = "\n\n".join(f"[{p.subpersonality}] {p.content}" for p in posts)

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    dialogue = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt, user=f"Голоса капитана:\n\n{data}",
        temperature=0.8, max_tokens=1000, label="round_table",
    )
    if not dialogue:
        return {"error": "AI временно недоступен, попробуйте позже"}

    participants = list(set(p.subpersonality for p in posts))
    rt = RoundTableSession(
        user_id=user_id,
        participants_json=participants,
        dialogue_json={"raw": dialogue},
        moderator_note="",
    )
    db.add(rt)
    await db.flush()
    return {"id": rt.id, "dialogue": dialogue, "participants": participants}


@router.post("/family-portrait")
async def generate_family_portrait(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Портрет семьи (бонус Н6)."""
    from app.models.models import SubpersonalityPost, FamilyPortrait
    from sqlalchemy import select
    from openai import AsyncOpenAI
    from app.core.config import settings
    from app.core.ai import safe_ai_call

    result = await db.execute(
        select(SubpersonalityPost).where(SubpersonalityPost.user_id == user_id).order_by(SubpersonalityPost.post_date.desc()).limit(10)
    )
    posts = result.scalars().all()
    if len(posts) < 2:
        return {"error": f"Need 2+ subpersonality posts, have {len(posts)}"}

    system_prompt = get_prompt("family_portrait")
    data = "\n\n".join(f"[{p.subpersonality}] {p.content}" for p in posts)

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    portrait = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt, user=f"Субличности капитана:\n\n{data}",
        temperature=0.8, max_tokens=1200, label="family_portrait",
    )
    if not portrait:
        return {"error": "AI временно недоступен, попробуйте позже"}

    import re
    dalle_match = re.search(r"Промпт для генерации\s*[:(]\s*(.+?)(?:\n---|\n\n|$)", portrait, re.DOTALL)
    dalle_prompt = dalle_match.group(1).strip() if dalle_match else ""

    fp = FamilyPortrait(
        user_id=user_id,
        characters_json={"raw": portrait},
        portrait_text=portrait,
        dalle_prompt=dalle_prompt,
    )
    db.add(fp)
    await db.flush()
    return {"id": fp.id, "portrait": portrait, "dalle_prompt": dalle_prompt}


@router.post("/negotiator")
async def run_negotiator(
    body: NegotiatorRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Переговорщик vs Критик (бонус Н6)."""
    from app.models.models import NegotiatorSession
    from openai import AsyncOpenAI
    from app.core.config import settings
    from app.core.ai import safe_ai_call

    system_prompt = get_prompt("negotiator")

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    dialogue = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt, user=body.critic_quote,
        temperature=0.8, max_tokens=1000, label="negotiator",
    )
    if not dialogue:
        return {"error": "AI временно недоступен, попробуйте позже"}

    ns = NegotiatorSession(user_id=user_id, critic_quote=body.critic_quote, dialogue_json={"raw": dialogue})
    db.add(ns)
    await db.flush()
    return {"id": ns.id, "dialogue": dialogue}


@router.get("/round-table")
async def list_round_tables(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Список последних сессий Круглого стола."""
    from app.models.models import RoundTableSession
    from sqlalchemy import select
    result = await db.execute(
        select(RoundTableSession).where(RoundTableSession.user_id == user_id).order_by(RoundTableSession.created_at.desc()).limit(10)
    )
    return [{"id": rt.id, "participants": rt.participants_json, "created_at": rt.created_at.isoformat()} for rt in result.scalars().all()]


@router.get("/family-portrait")
async def list_portraits(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Список последних портретов семьи субличностей."""
    from app.models.models import FamilyPortrait
    from sqlalchemy import select
    result = await db.execute(
        select(FamilyPortrait).where(FamilyPortrait.user_id == user_id).order_by(FamilyPortrait.created_at.desc()).limit(10)
    )
    return [{"id": fp.id, "dalle_prompt": fp.dalle_prompt, "created_at": fp.created_at.isoformat()} for fp in result.scalars().all()]
