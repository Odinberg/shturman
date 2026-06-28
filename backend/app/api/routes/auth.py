"""
API: Направление 6 — Множественность Я
Subpersonality posts, round table, family portrait, negotiator.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db

router = APIRouter()


@router.post("/posts")
async def create_subpersonality_post(subpersonality: str, content: str, db: AsyncSession = Depends(get_db)):
    from app.models.models import SubpersonalityPost
    post = SubpersonalityPost(user_id=1, subpersonality=subpersonality, content=content)
    db.add(post)
    await db.flush()
    return {"id": post.id, "status": "created"}


@router.get("/posts")
async def list_posts(db: AsyncSession = Depends(get_db)):
    from app.models.models import SubpersonalityPost
    from sqlalchemy import select
    result = await db.execute(
        select(SubpersonalityPost).where(SubpersonalityPost.user_id == 1).order_by(SubpersonalityPost.post_date.desc()).limit(50)
    )
    return [{"id": p.id, "subpersonality": p.subpersonality, "content": p.content[:200], "date": str(p.post_date)} for p in result.scalars().all()]


@router.get("/posts/stats")
async def subpersonality_stats(db: AsyncSession = Depends(get_db)):
    from app.models.models import SubpersonalityPost
    from sqlalchemy import select, func
    result = await db.execute(
        select(SubpersonalityPost.subpersonality, func.count(SubpersonalityPost.id))
        .where(SubpersonalityPost.user_id == 1)
        .group_by(SubpersonalityPost.subpersonality)
    )
    return [{"persona": r[0], "count": r[1]} for r in result.all()]


@router.post("/round-table")
async def generate_round_table(db: AsyncSession = Depends(get_db)):
    """Круглый стол (бонус Н6)."""
    from app.models.models import SubpersonalityPost, RoundTableSession
    from sqlalchemy import select
    from openai import AsyncOpenAI
    from app.core.config import settings

    result = await db.execute(
        select(SubpersonalityPost).where(SubpersonalityPost.user_id == 1).order_by(SubpersonalityPost.post_date.desc()).limit(10)
    )
    posts = result.scalars().all()
    if len(posts) < 4:
        return {"error": f"Need 4+ subpersonality posts, have {len(posts)}"}

    prompt_path = "app/prompts/round_table.md"
    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    data = "\n\n".join(
        f"[{p.subpersonality}] {p.content}" for p in posts
    )

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Голоса капитана:\n\n{data}"},
        ],
        temperature=0.8, max_tokens=1000,
    )

    dialogue = response.choices[0].message.content
    participants = list(set(p.subpersonality for p in posts))

    rt = RoundTableSession(
        user_id=1,
        participants_json=participants,
        dialogue_json={"raw": dialogue},
        moderator_note="",
    )
    db.add(rt)
    await db.flush()
    return {"id": rt.id, "dialogue": dialogue, "participants": participants}


@router.post("/family-portrait")
async def generate_family_portrait(db: AsyncSession = Depends(get_db)):
    """Портрет семьи (бонус Н6)."""
    from app.models.models import SubpersonalityPost, FamilyPortrait
    from sqlalchemy import select
    from openai import AsyncOpenAI
    from app.core.config import settings

    result = await db.execute(
        select(SubpersonalityPost).where(SubpersonalityPost.user_id == 1).order_by(SubpersonalityPost.post_date.desc()).limit(10)
    )
    posts = result.scalars().all()
    if len(posts) < 2:
        return {"error": f"Need 2+ subpersonality posts, have {len(posts)}"}

    prompt_path = "app/prompts/family_portrait.md"
    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    data = "\n\n".join(
        f"[{p.subpersonality}] {p.content}" for p in posts
    )

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Субличности капитана:\n\n{data}"},
        ],
        temperature=0.8, max_tokens=1200,
    )

    portrait = response.choices[0].message.content
    import re
    dalle_match = re.search(r"Промпт для генерации\s*[:(]\s*(.+?)(?:\n---|\n\n|$)", portrait, re.DOTALL)
    dalle_prompt = dalle_match.group(1).strip() if dalle_match else ""

    fp = FamilyPortrait(
        user_id=1,
        characters_json={"raw": portrait},
        portrait_text=portrait,
        dalle_prompt=dalle_prompt,
    )
    db.add(fp)
    await db.flush()
    return {"id": fp.id, "portrait": portrait, "dalle_prompt": dalle_prompt}


@router.post("/negotiator")
async def run_negotiator(critic_quote: str, db: AsyncSession = Depends(get_db)):
    """Переговорщик vs Критик (бонус Н6)."""
    from app.models.models import NegotiatorSession
    from openai import AsyncOpenAI
    from app.core.config import settings

    prompt_path = "app/prompts/negotiator.md"
    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": critic_quote},
        ],
        temperature=0.8, max_tokens=1000,
    )

    dialogue = response.choices[0].message.content
    ns = NegotiatorSession(user_id=1, critic_quote=critic_quote, dialogue_json={"raw": dialogue})
    db.add(ns)
    await db.flush()
    return {"id": ns.id, "dialogue": dialogue}


@router.get("/round-table")
async def list_round_tables(db: AsyncSession = Depends(get_db)):
    from app.models.models import RoundTableSession
    from sqlalchemy import select
    result = await db.execute(
        select(RoundTableSession).where(RoundTableSession.user_id == 1).order_by(RoundTableSession.created_at.desc()).limit(10)
    )
    return [{"id": rt.id, "participants": rt.participants_json, "created_at": rt.created_at.isoformat()} for rt in result.scalars().all()]


@router.get("/family-portrait")
async def list_portraits(db: AsyncSession = Depends(get_db)):
    from app.models.models import FamilyPortrait
    from sqlalchemy import select
    result = await db.execute(
        select(FamilyPortrait).where(FamilyPortrait.user_id == 1).order_by(FamilyPortrait.created_at.desc()).limit(10)
    )
    return [{"id": fp.id, "dalle_prompt": fp.dalle_prompt, "created_at": fp.created_at.isoformat()} for fp in result.scalars().all()]
