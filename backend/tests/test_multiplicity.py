"""
Tests: Направление 6 — Множественность Я (self).
"""

from datetime import date as date_type, timedelta
from typing import AsyncGenerator

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import SubpersonalityPost, User


async def _seed_posts_direct(
    db_session: AsyncSession,
    pairs: list[tuple[str, str]],
    start_date_offset: int = 0,
):
    """Insert SubpersonalityPost records directly with incrementing dates.
    Each entry gets a unique date so UniqueConstraint is satisfied."""
    existing = await db_session.execute(select(User).where(User.id == 1))
    user = existing.scalar_one_or_none()
    if not user:
        user = User(id=1, username="test_captain")
        db_session.add(user)
        await db_session.flush()

    today = date_type.today()
    for i, (subpersonality, content) in enumerate(pairs):
        db_session.add(SubpersonalityPost(
            user_id=1,
            subpersonality=subpersonality,
            content=content,
            post_date=today + timedelta(days=start_date_offset + i),
        ))
    await db_session.flush()


class TestSubpersonalityPosts:
    """CRUD тесты для эндпоинтов /self/posts."""

    async def test_create_post(self, client: AsyncClient):
        """POST /self/posts — создать запись субличности."""
        payload = {"subpersonality": "Внутренний Критик", "content": "Ты опять всё делаешь не так."}
        resp = await client.post("/api/self/posts", json=payload)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["status"] == "created"
        assert isinstance(data["id"], int)

    async def test_create_post_invalid_empty(self, client: AsyncClient):
        """POST /self/posts — пустой запрос 422."""
        resp = await client.post("/api/self/posts", json={"subpersonality": "", "content": ""})
        assert resp.status_code == 422

    async def test_create_post_invalid_missing(self, client: AsyncClient):
        """POST /self/posts — missing fields 422."""
        resp = await client.post("/api/self/posts", json={})
        assert resp.status_code == 422

    async def test_list_posts_empty(self, client: AsyncClient):
        """GET /self/posts — пустой список."""
        resp = await client.get("/api/self/posts")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_posts_with_data(self, client: AsyncClient, db_session: AsyncSession):
        """GET /self/posts — одна запись в списке."""
        await _seed_posts_direct(db_session, [("Заботливый", "Всё будет хорошо.")])

        resp = await client.get("/api/self/posts")
        data = resp.json()
        assert len(data) == 1
        assert data[0]["subpersonality"] == "Заботливый"
        assert data[0]["content"] == "Всё будет хорошо."

    async def test_stats_empty(self, client: AsyncClient):
        """GET /self/posts/stats — пусто."""
        resp = await client.get("/api/self/posts/stats")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_stats_with_data(self, client: AsyncClient, db_session: AsyncSession):
        """GET /self/posts/stats — подсчёт по субличностям."""
        await _seed_posts_direct(db_session, [
            ("Критик", "Ты глупый."),
            ("Критик", "Ничего не получится."),
            ("Мудрец", "Всему своё время."),
        ])

        resp = await client.get("/api/self/posts/stats")
        stats = {s["persona"]: s["count"] for s in resp.json()}
        assert stats == {"Критик": 2, "Мудрец": 1}


class TestRoundTable:
    """Тесты для /self/round-table."""

    async def test_round_table_insufficient_posts(
        self, client: AsyncClient, db_session: AsyncSession,
    ):
        """POST /self/round-table — error если < 4 постов."""
        await _seed_posts_direct(db_session, [
            ("Воитель", "Моя история №0"),
            ("Целитель", "Моя история №1"),
        ])
        resp = await client.post("/api/self/round-table")
        assert resp.status_code == 200
        data = resp.json()
        assert "error" in data
        assert "Need 4+ subpersonality posts" in data["error"]

    async def test_round_table_no_ai_key(
        self, client: AsyncClient, db_session: AsyncSession,
    ):
        """POST /self/round-table — достаточно постов, AI провалится без ключа."""
        await _seed_posts_direct(db_session, [
            ("Воитель", f"История #{i}") for i in range(5)
        ])
        resp = await client.post("/api/self/round-table")
        assert resp.status_code == 200
        data = resp.json()
        assert "error" in data
        assert "AI временно недоступен" in data["error"]

    async def test_list_round_tables_empty(self, client: AsyncClient):
        """GET /self/round-table — пустой список."""
        resp = await client.get("/api/self/round-table")
        assert resp.status_code == 200
        assert resp.json() == []


class TestFamilyPortrait:
    """Тесты для /self/family-portrait."""

    async def test_family_portrait_insufficient_posts(
        self, client: AsyncClient, db_session: AsyncSession,
    ):
        """POST /self/family-portrait — error если < 2 постов."""
        await _seed_posts_direct(db_session, [("Мать", "Голос матери.")])
        resp = await client.post("/api/self/family-portrait")
        assert resp.status_code == 200
        data = resp.json()
        assert "error" in data
        assert "Need 2+ subpersonality posts" in data["error"]

    async def test_family_portrait_no_ai_key(
        self, client: AsyncClient, db_session: AsyncSession,
    ):
        """POST /self/family-portrait — AI провалится без ключа."""
        await _seed_posts_direct(db_session, [
            ("Мать", "Голос матери."),
            ("Отец", "Голос отца."),
            ("Ребёнок", "Голос ребёнка."),
        ])
        resp = await client.post("/api/self/family-portrait")
        assert resp.status_code == 200
        data = resp.json()
        assert "error" in data
        assert "AI временно недоступен" in data["error"]

    async def test_list_portraits_empty(self, client: AsyncClient):
        """GET /self/family-portrait — пустой список."""
        resp = await client.get("/api/self/family-portrait")
        assert resp.status_code == 200
        assert resp.json() == []


class TestNegotiator:
    """Тесты для /self/negotiator."""

    async def test_negotiator_no_ai_key(self, client: AsyncClient):
        """POST /self/negotiator — без AI ключа возвращает error."""
        resp = await client.post("/api/self/negotiator", json={
            "critic_quote": "Ты никогда не доводишь дела до конца.",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "error" in data
        assert "AI временно недоступен" in data["error"]

    async def test_negotiator_invalid(self, client: AsyncClient):
        """POST /self/negotiator — пустой запрос 422."""
        resp = await client.post("/api/self/negotiator", json={})
        assert resp.status_code == 422
