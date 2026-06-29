"""
API: Направление 3 — Рефрейминг (Reframing)
Sessions, AI advocate, insight box, blind spot.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db, get_current_user

router = APIRouter()


@router.post("/sessions")
async def create_reframing_session(situation: str, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    from app.models.models import ReframingSession
    from openai import AsyncOpenAI
    from app.core.config import settings

    session = ReframingSession(user_id, situation_text=situation, perspectives_json={"5_views": []})
    db.add(session)
    await db.flush()
    return {"id": session.id, "status": "created"}


@router.post("/insight-box")
async def generate_insight_box(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    """Шкатулка формулировок (бонус Н3)."""
    from app.models.models import ReframingSession, InsightBox
    from sqlalchemy import select
    from openai import AsyncOpenAI
    from app.core.config import settings

    result = await db.execute(
        select(ReframingSession).where(ReframingSession.user_id == user_id).order_by(ReframingSession.created_at.desc()).limit(20)
    )
    sessions = result.scalars().all()
    if len(sessions) < 3:
        return {"error": f"Need 3+ sessions, have {len(sessions)}"}

    prompt_path = "app/prompts/insight_box.md"
    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    data = "\n\n".join(
        f"[{s.created_at.strftime('%d.%m')}] Ситуация: {s.situation_text[:300]}" for s in sessions
    )

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Разобранные ситуации:\n\n{data}"},
        ],
        temperature=0.7, max_tokens=1500,
    )

    box_text = response.choices[0].message.content
    ib = InsightBox(
        user_id,
        session_ids=[s.id for s in sessions],
        box_content=box_text,
    )
    db.add(ib)
    await db.flush()
    return {"id": ib.id, "box": box_text}


@router.post("/blind-spot")
async def blind_spot(query: str, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    """Слепое пятно (бонус Н3)."""
    from app.models.models import BlindSpotSession
    from openai import AsyncOpenAI
    from app.core.config import settings

    prompt_path = "app/prompts/blind_spot.md"
    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ],
        temperature=0.8, max_tokens=500,
    )

    result_text = response.choices[0].message.content
    lines = [l.strip() for l in result_text.split('\n') if l.strip()]
    q1 = q2 = ""
    for i, l in enumerate(lines):
        if l.startswith("Вопрос 1:") or l.startswith("Вопрос"):
            q1 = l.split(":", 1)[-1].strip() if ":" in l else ""
        if l.startswith("Вопрос 2:") or (q1 and l.startswith("Вопрос") and not l.startswith("Вопрос 1")):
            q2 = l.split(":", 1)[-1].strip() if ":" in l else ""

    bs = BlindSpotSession(user_id, user_query=query, question_1=q1, question_2=q2)
    db.add(bs)
    await db.flush()
    return {"id": bs.id, "result": result_text}


@router.post("/ai-advocate")
async def ai_advocate(query: str, db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    """ИИ-адвокат (бонус Н3)."""
    from openai import AsyncOpenAI
    from app.core.config import settings

    prompt_path = "app/prompts/ai_advocate.md"
    with open(prompt_path, encoding="utf-8") as f:
        system_prompt = f.read()

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ],
        temperature=0.7, max_tokens=1000,
    )
    return {"response": response.choices[0].message.content}


@router.get("/sessions")
async def list_reframing_sessions(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    from app.models.models import ReframingSession
    from sqlalchemy import select
    result = await db.execute(
        select(ReframingSession).where(ReframingSession.user_id == user_id).order_by(ReframingSession.created_at.desc()).limit(20)
    )
    return [{"id": s.id, "situation": s.situation_text[:100], "created_at": s.created_at.isoformat()} for s in result.scalars().all()]


@router.get("/insight-box")
async def list_insight_boxes(db: AsyncSession = Depends(get_db), user_id: int = Depends(get_current_user)):
    from app.models.models import InsightBox
    from sqlalchemy import select
    result = await db.execute(
        select(InsightBox).where(InsightBox.user_id == user_id).order_by(InsightBox.created_at.desc()).limit(10)
    )
    return [{"id": ib.id, "created_at": ib.created_at.isoformat()} for ib in result.scalars().all()]
