"""
Journal (дневник) endpoints (placeholder).
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_entries():
    return {"message": "Not implemented yet"}


@router.post("/")
async def create_entry():
    return {"message": "Not implemented yet"}
