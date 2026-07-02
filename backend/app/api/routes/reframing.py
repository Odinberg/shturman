"""
API: Направление 3 — Рефрейминг (Reframing)
Sessions, AI advocate, insight box, blind spot.
"""

from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db
from app.core.auth.dependencies import get_current_user
from app.api.schemas import ReframingSessionCreate, BlindSpotRequest, AIAdvocateRequest, ApiResponse
from app.services.prompts import get_prompt

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/sessions")
async def create_reframing_session(
    body: ReframingSessionCreate = Body(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import ReframingSession
    session = ReframingSession(user_id=user_id, situation_text=body.situation, perspectives_json={"5_views": []})
    db.add(session)
    await db.flush()
    return ApiResponse(id=session.id, status="created")


@router.post("/insight-box")
async def generate_insight_box(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Шкатулка формулировок (бонус Н3)."""
    from app.models.models import ReframingSession, InsightBox
    from sqlalchemy import select
    from app.core.config import settings
    from app.core.ai import safe_ai_call, get_ai_client

    result = await db.execute(
        select(ReframingSession).where(ReframingSession.user_id == user_id).order_by(ReframingSession.created_at.desc()).limit(20)
    )
    sessions = result.scalars().all()
    if len(sessions) < 3:
        return {"error": f"Need 3+ sessions, have {len(sessions)}"}

    system_prompt = get_prompt("insight_box")
    data = "\n\n".join(
        f"[{s.created_at.strftime('%d.%m')}] Ситуация: {s.situation_text[:300]}" for s in sessions
    )

    client = get_ai_client()
    box_text = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt, user=f"Разобранные ситуации:\n\n{data}",
        temperature=0.7, max_tokens=1500, label="insight_box",
    )
    if not box_text:
        return {"error": "AI временно недоступен, попробуйте позже"}

    ib = InsightBox(user_id=user_id, session_ids=[s.id for s in sessions], box_content=box_text)
    db.add(ib)
    await db.flush()
    return {"id": ib.id, "box": box_text}


@router.post("/blind-spot")
async def blind_spot(
    body: BlindSpotRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """Слепое пятно (бонус Н3)."""
    from app.models.models import BlindSpotSession
    from app.core.config import settings
    from app.core.ai import safe_ai_call, get_ai_client

    system_prompt = get_prompt("blind_spot")

    client = get_ai_client()
    result_text = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt, user=body.query,
        temperature=0.8, max_tokens=500, label="blind_spot",
    )
    if not result_text:
        return {"error": "AI временно недоступен, попробуйте позже"}

    lines = [l.strip() for l in result_text.split('\n') if l.strip()]
    q1 = q2 = ""
    for i, l in enumerate(lines):
        if l.startswith("Вопрос 1:") or l.startswith("Вопрос"):
            q1 = l.split(":", 1)[-1].strip() if ":" in l else ""
        if l.startswith("Вопрос 2:") or (q1 and l.startswith("Вопрос") and not l.startswith("Вопрос 1")):
            q2 = l.split(":", 1)[-1].strip() if ":" in l else ""

    bs = BlindSpotSession(user_id=user_id, user_query=body.query, question_1=q1, question_2=q2)
    db.add(bs)
    await db.flush()
    return {"id": bs.id, "result": result_text}


@router.post("/ai-advocate")
async def ai_advocate(
    body: AIAdvocateRequest = Body(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    """ИИ-адвокат (бонус Н3)."""
    from app.core.config import settings
    from app.core.ai import safe_ai_call, get_ai_client

    system_prompt = get_prompt("ai_advocate")

    client = get_ai_client()
    response = await safe_ai_call(
        client=client, model=settings.OPENAI_MODEL,
        system=system_prompt, user=body.query,
        temperature=0.7, max_tokens=1000, label="ai_advocate",
    )
    if not response:
        return {"error": "AI временно недоступен, попробуйте позже"}
    return {"response": response}


@router.get("/sessions")
async def list_reframing_sessions(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import ReframingSession
    from sqlalchemy import select
    result = await db.execute(
        select(ReframingSession).where(ReframingSession.user_id == user_id).order_by(ReframingSession.created_at.desc()).limit(20)
    )
    return [{"id": s.id, "situation": s.situation_text[:100], "created_at": s.created_at.isoformat()} for s in result.scalars().all()]


@router.get("/insight-box")
async def list_insight_boxes(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user),
):
    from app.models.models import InsightBox
    from sqlalchemy import select
    result = await db.execute(
        select(InsightBox).where(InsightBox.user_id == user_id).order_by(InsightBox.created_at.desc()).limit(10)
    )
    return [{"id": ib.id, "created_at": ib.created_at.isoformat()} for ib in result.scalars().all()]
