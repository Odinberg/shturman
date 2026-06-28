"""
AI-Штурман chat endpoints (placeholder).
"""

from fastapi import APIRouter

router = APIRouter()


@router.post("/chat")
async def chat():
    return {"message": "Not implemented yet"}


@router.get("/metaphor")
async def metaphor_of_day():
    return {"message": "Not implemented yet"}


@router.get("/advocate")
async def ai_advocate():
    return {"message": "Not implemented yet"}
