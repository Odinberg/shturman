"""
Authentication endpoints (placeholder).
"""

from fastapi import APIRouter

router = APIRouter()


@router.post("/register")
async def register():
    return {"message": "Not implemented yet"}


@router.post("/login")
async def login():
    return {"message": "Not implemented yet"}
