"""
Courses endpoints (placeholder).
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_courses():
    return {"message": "Not implemented yet"}


@router.get("/{course_id}")
async def get_course(course_id: str):
    return {"course_id": course_id, "message": "Not implemented yet"}
