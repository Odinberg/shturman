"""
Community (Тихая бухта) endpoints (placeholder).
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/messages")
async def list_messages():
    return {"message": "Not implemented yet"}


@router.post("/messages")
async def send_message():
    return {"message": "Not implemented yet"}
