"""
Pydantic-схемы для валидации входящих запросов API.
"""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator


# ─── Health ──────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    service: str


# ─── Direction 1: Journal (Активный дневник) ────────────────────────────────

class JournalEntryCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000, description="Текст записи")
    mood: Optional[str] = Field(None, max_length=64)


class AltRealityRequest(BaseModel):
    entry_id: int = Field(..., gt=0)
    genre: str = Field(..., pattern=r"^(hobbit|detective|manual|naturalist)$")


class JournalEntryResponse(BaseModel):
    id: int
    content: str
    mood: Optional[str] = None
    created_at: str


# ─── Direction 2: Emotional (Эмоциональный профиль) ─────────────────────────

class EmotionalCheckinCreate(BaseModel):
    emoji: str = Field(..., max_length=16, min_length=1)
    event_text: str = Field(default="", max_length=256)


class EmotionalCheckinResponse(BaseModel):
    id: int
    emoji: str
    event: str
    time: str


# ─── Direction 3: Reframing (Рефрейминг) ────────────────────────────────────

class ReframingSessionCreate(BaseModel):
    situation: str = Field(..., min_length=1, max_length=5000)


class BlindSpotRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)


class AIAdvocateRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)


# ─── Direction 4: Shadow (Диалог с Тенью) ───────────────────────────────────

class ShadowRecordingCreate(BaseModel):
    transcript: str = Field(..., min_length=1, max_length=10000)
    irritation_target: str = Field(..., min_length=1, max_length=256)


class MirrorLetterRequest(BaseModel):
    recording_id: int = Field(..., gt=0)


class NegotiatorRequest(BaseModel):
    critic_quote: str = Field(..., min_length=1, max_length=5000)


# ─── Direction 5: Sensory (Сенсорные якоря) ─────────────────────────────────

class SensoryCheckinCreate(BaseModel):
    sensation: str = Field(..., pattern=r"^(напряжение|лёгкость|холод|жар|онемение)$")


# ─── Direction 6: Self/Subpersonality (Множественность Я) ───────────────────

class SubpersonalityPostCreate(BaseModel):
    subpersonality: str = Field(..., min_length=1, max_length=128)
    content: str = Field(..., min_length=1, max_length=5000)


# ─── Direction 7: Butterfly (Эффект Бабочки) ────────────────────────────────

class ButterflyEventCreate(BaseModel):
    event_text: str = Field(..., min_length=1, max_length=512)


class FractalRequest(BaseModel):
    event_id: int = Field(..., gt=0)


# ─── GENERIC ─────────────────────────────────────────────────────────────────

class ApiResponse(BaseModel):
    id: int
    status: str


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
