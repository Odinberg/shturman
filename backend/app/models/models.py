"""
Модели данных Штурмана для всех 7 направлений методик.
"""

import uuid
from datetime import datetime, date, timezone
from typing import Optional, List
from sqlalchemy import (
    String, Text, Boolean, Integer, Float, Enum as SAEnum,
    DateTime, Date, ForeignKey, JSON, UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _utcnow():
    return datetime.now(timezone.utc)


def _today():
    return date.today()


# ——————————————————————————————————————
# Общие вспомогательные модели
# ——————————————————————————————————————

class User(Base):
    """Пользователь (капитан)."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[str] = mapped_column(
        String(36), default=lambda: str(uuid.uuid4()), unique=True, nullable=False
    )
    telegram_id: Mapped[Optional[str]] = mapped_column(String(64), unique=True)
    vk_user_id: Mapped[Optional[str]] = mapped_column(String(64), unique=True)

    username: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    # relationships
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    emotional_checkins = relationship("EmotionalCheckin", back_populates="user", cascade="all, delete-orphan")
    sensory_checkins = relationship("SensoryCheckin", back_populates="user", cascade="all, delete-orphan")
    shadow_recordings = relationship("ShadowRecording", back_populates="user", cascade="all, delete-orphan")
    subpersonality_posts = relationship("SubpersonalityPost", back_populates="user", cascade="all, delete-orphan")
    butterfly_events = relationship("ButterflyEvent", back_populates="user", cascade="all, delete-orphan")


# ——————————————————————————————————————
# НАПРАВЛЕНИЕ 1: Активный дневник (Resonance)
# ——————————————————————————————————————

class JournalEntry(Base):
    """Запись в дневнике."""
    __tablename__ = "journal_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    mood: Mapped[Optional[str]] = mapped_column(String(64))  # опционально
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    user = relationship("User", back_populates="journal_entries")


class PatternMap(Base):
    """Сгенерированная карта паттернов (Н1-бонус)."""
    __tablename__ = "pattern_maps"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    patterns_json: Mapped[str] = mapped_column(JSON, nullable=False)  # [{title, observation, quote, frequency}]
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class AltRealitySession(Base):
    """Сессия альтернативной реальности (Н1-бонус)."""
    __tablename__ = "alt_reality_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    journal_entry_id: Mapped[int] = mapped_column(ForeignKey("journal_entries.id"), nullable=False)
    genre: Mapped[str] = mapped_column(String(32), nullable=False)  # hobbit, detective, manual, naturalist
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    rewritten_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    journal_entry = relationship("JournalEntry")


# ——————————————————————————————————————
# НАПРАВЛЕНИЕ 2: Эмоциональный профиль
# ——————————————————————————————————————

class EmotionalCheckin(Base):
    """Эмоциональный чекин (Н2-основа)."""
    __tablename__ = "emotional_checkins"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    emoji: Mapped[str] = mapped_column(String(16), nullable=False)
    event_words: Mapped[str] = mapped_column(String(256), nullable=False)
    checkin_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    user = relationship("User", back_populates="emotional_checkins")


class BiorhythmReport(Base):
    """Отчёт биоритмолога (Н2-бонус)."""
    __tablename__ = "biorhythm_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    period_days: Mapped[int] = mapped_column(Integer, nullable=False)
    report_text: Mapped[str] = mapped_column(Text, nullable=False)
    peak_time: Mapped[Optional[str]] = mapped_column(String(64))
    slump_time: Mapped[Optional[str]] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class ResourceCollection(Base):
    """Коллекция ресурсных состояний (Н2-бонус)."""
    __tablename__ = "resource_collections"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    month: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM
    resources_json: Mapped[str] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class EmotionalAvatar(Base):
    """Эмоциональный аватар (Н2-бонус)."""
    __tablename__ = "emotional_avatars"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    avatar_text: Mapped[str] = mapped_column(Text, nullable=False)
    dalle_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    previous_avatar: Mapped[Optional[str]] = mapped_column(String(256))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    __table_args__ = (UniqueConstraint("user_id", "week_start"),)


# ——————————————————————————————————————
# НАПРАВЛЕНИЕ 3: Рефрейминг ситуаций
# ——————————————————————————————————————

class ReframingSession(Base):
    """Сессия рефрейминга (Н3-основа)."""
    __tablename__ = "reframing_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    situation_text: Mapped[str] = mapped_column(Text, nullable=False)
    perspectives_json: Mapped[str] = mapped_column(JSON, nullable=False)  # 5 точек зрения
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class InsightBox(Base):
    """Шкатулка формулировок (Н3-бонус)."""
    __tablename__ = "insight_boxes"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    session_ids: Mapped[str] = mapped_column(JSON, nullable=False)  # [reframing_session_ids]
    box_content: Mapped[str] = mapped_column(Text, nullable=False)  # готовый текст для PDF
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class BlindSpotSession(Base):
    """Сессия Слепого пятна (Н3-бонус)."""
    __tablename__ = "blind_spot_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    user_query: Mapped[str] = mapped_column(Text, nullable=False)
    question_1: Mapped[str] = mapped_column(String(512), nullable=False)
    question_2: Mapped[str] = mapped_column(String(512), nullable=False)
    user_response: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


# ——————————————————————————————————————
# НАПРАВЛЕНИЕ 4: Диалог с Тенью
# ——————————————————————————————————————

class ShadowRecording(Base):
    """Голосовая запись для Диалога с Тенью (Н4-основа)."""
    __tablename__ = "shadow_recordings"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    transcript: Mapped[str] = mapped_column(Text, nullable=False)  # расшифровка речи
    irritation_target: Mapped[str] = mapped_column(String(256), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    user = relationship("User", back_populates="shadow_recordings")


class MirrorLetter(Base):
    """Письмо от зеркального дублёра (Н4-бонус)."""
    __tablename__ = "mirror_letters"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    recording_id: Mapped[int] = mapped_column(ForeignKey("shadow_recordings.id"), nullable=False)
    trait_name: Mapped[str] = mapped_column(String(128), nullable=False)
    letter_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    recording = relationship("ShadowRecording")


class ForbiddenDesire(Base):
    """Карта запретных желаний (Н4-бонус)."""
    __tablename__ = "forbidden_desires"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    recording_ids: Mapped[str] = mapped_column(JSON, nullable=False)  # [3 recording ids]
    desire_text: Mapped[str] = mapped_column(Text, nullable=False)
    protection_text: Mapped[str] = mapped_column(Text, nullable=False)
    hypnosis_script: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class AntiHeroComic(Base):
    """Комикс Анти-герой (Н4-бонус)."""
    __tablename__ = "anti_hero_comics"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    shadow_trait: Mapped[str] = mapped_column(String(128), nullable=False)
    script_json: Mapped[str] = mapped_column(JSON, nullable=False)  # [3 panels]
    dalle_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


# ——————————————————————————————————————
# НАПРАВЛЕНИЕ 5: Сенсорные якоря
# ——————————————————————————————————————

SENSATION_TYPES = ("напряжение", "лёгкость", "холод", "жар", "онемение")


class SensoryCheckin(Base):
    """Телесный чекин (Н5-основа)."""
    __tablename__ = "sensory_checkins"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    sensation: Mapped[str] = mapped_column(String(32), nullable=False)
    checkin_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    accelerometer_json: Mapped[Optional[str]] = mapped_column(JSON)
    location_context: Mapped[Optional[str]] = mapped_column(String(64))

    user = relationship("User", back_populates="sensory_checkins")


class SensoryPrediction(Base):
    """Предсказание телесного компаса (Н5-бонус)."""
    __tablename__ = "sensory_predictions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    predicted_state: Mapped[str] = mapped_column(String(128), nullable=False)
    prediction_horizon: Mapped[int] = mapped_column(Integer)  # minutes
    confidence: Mapped[float] = mapped_column(Float)
    sent_push: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class CalmAnchor(Base):
    """Якорь спокойствия (Н5-бонус)."""
    __tablename__ = "calm_anchors"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    journal_entry_id: Mapped[Optional[int]] = mapped_column(ForeignKey("journal_entries.id"))
    vibration_pattern: Mapped[str] = mapped_column(JSON, nullable=False)
    breathing_rhythm: Mapped[Optional[str]] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


# ——————————————————————————————————————
# НАПРАВЛЕНИЕ 6: Множественность Я
# ——————————————————————————————————————

class SubpersonalityPost(Base):
    """Запись от лица субличности (Н6-основа)."""
    __tablename__ = "subpersonality_posts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    subpersonality: Mapped[str] = mapped_column(String(128), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    post_date: Mapped[date] = mapped_column(Date, default=_today)

    user = relationship("User", back_populates="subpersonality_posts")
    __table_args__ = (UniqueConstraint("user_id", "post_date"),)


class RoundTableSession(Base):
    """Сессия Круглого стола (Н6-бонус)."""
    __tablename__ = "round_table_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    participants_json: Mapped[str] = mapped_column(JSON, nullable=False)  # ["Злой", "Уставший"...]
    dialogue_json: Mapped[str] = mapped_column(JSON, nullable=False)  # [{"speaker": ..., "line": ...}]
    moderator_note: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class FamilyPortrait(Base):
    """Портрет семьи субличностей (Н6-бонус)."""
    __tablename__ = "family_portraits"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    characters_json: Mapped[str] = mapped_column(JSON, nullable=False)  # [{name, type, color, ...}]
    portrait_text: Mapped[str] = mapped_column(Text, nullable=False)
    dalle_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


class NegotiatorSession(Base):
    """Сессия Переговорщика (Н6-бонус)."""
    __tablename__ = "negotiator_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    critic_quote: Mapped[str] = mapped_column(Text, nullable=False)
    dialogue_json: Mapped[str] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


# ——————————————————————————————————————
# НАПРАВЛЕНИЕ 7: Эффект Бабочки
# ——————————————————————————————————————

class ButterflyEvent(Base):
    """Маленькое событие дня (Н7-основа)."""
    __tablename__ = "butterfly_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    event_text: Mapped[str] = mapped_column(String(512), nullable=False)
    event_date: Mapped[date] = mapped_column(Date, default=_today)

    user = relationship("User", back_populates="butterfly_events")


class FractalCard(Base):
    """Фрактал дня (Н7-бонус)."""
    __tablename__ = "fractal_cards"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    event_id: Mapped[int] = mapped_column(ForeignKey("butterfly_events.id"), nullable=False)
    association_chain: Mapped[str] = mapped_column(JSON, nullable=False)
    insight_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    event = relationship("ButterflyEvent")


class WonderVault(Base):
    """Копилка чудес (Н7-бонус)."""
    __tablename__ = "wonder_vaults"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    month: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM
    slideshow_text: Mapped[str] = mapped_column(Text, nullable=False)
    parable_text: Mapped[Optional[str]] = mapped_column(Text)  # Письмо от Вселенной
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)


# ——————————————————————————————————————
# АРХИМЕДОВ РЫЧАГ
# ——————————————————————————————————————

class ChronicleSlot(Base):
    """Срез одного дня в Режиме Хроник (Архимедов рычаг)."""
    __tablename__ = "chronicle_slots"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    slot_date: Mapped[date] = mapped_column(Date, nullable=False)
    layers_json: Mapped[str] = mapped_column(JSON, nullable=False)  # {"emotion":..., "body":..., ...}
    artifact_text: Mapped[Optional[str]] = mapped_column(Text)  # случайная фраза дня
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    __table_args__ = (UniqueConstraint("user_id", "slot_date"),)
