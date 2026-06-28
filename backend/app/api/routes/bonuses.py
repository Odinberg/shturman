"""
Bonuses endpoints (placeholder).
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_bonuses():
    return {"message": "Not implemented yet"}


@router.get("/achievements")
async def achievements():
    return {"message": "Not implemented yet"}
