"""
Tests: Направление 6 — Множественность Я (self).
"""

from httpx import AsyncClient


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

    async def test_create_multiple_posts_same_day(self, client: AsyncClient):
        """POST /self/posts — можно создать 2+ поста в один день (нет UniqueConstraint)."""
        resp1 = await client.post("/api/self/posts", json={
            "subpersonality": "Злой", "content": "Всё бесит.",
        })
        assert resp1.status_code == 200

        resp2 = await client.post("/api/self/posts", json={
            "subpersonality": "Добрый", "content": "Всё хорошо.",
        })
        assert resp2.status_code == 200
        assert resp2.json()["id"] != resp1.json()["id"]

    async def test_list_posts_empty(self, client: AsyncClient):
        """GET /self/posts — пустой список."""
        resp = await client.get("/api/self/posts")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_posts_with_data(self, client: AsyncClient):
        """GET /self/posts — записи в списке."""
        await client.post("/api/self/posts", json={
            "subpersonality": "Заботливый", "content": "Всё будет хорошо.",
        })
        await client.post("/api/self/posts", json={
            "subpersonality": "Строгий", "content": "Держись плана.",
        })

        resp = await client.get("/api/self/posts")
        data = resp.json()
        assert len(data) == 2
        # both entries present
        contents = {d["subpersonality"]: d["content"] for d in data}
        assert contents["Заботливый"] == "Всё будет хорошо."
        assert contents["Строгий"] == "Держись плана."

    async def test_stats_empty(self, client: AsyncClient):
        """GET /self/posts/stats — пусто."""
        resp = await client.get("/api/self/posts/stats")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_stats_with_data(self, client: AsyncClient):
        """GET /self/posts/stats — подсчёт по субличностям."""
        await client.post("/api/self/posts", json={
            "subpersonality": "Критик", "content": "Ты глупый.",
        })
        await client.post("/api/self/posts", json={
            "subpersonality": "Критик", "content": "Ничего не получится.",
        })
        await client.post("/api/self/posts", json={
            "subpersonality": "Мудрец", "content": "Всему своё время.",
        })

        resp = await client.get("/api/self/posts/stats")
        stats = {s["persona"]: s["count"] for s in resp.json()}
        assert stats == {"Критик": 2, "Мудрец": 1}


class TestRoundTable:
    """Тесты для /self/round-table."""

    async def _seed_posts(self, client: AsyncClient, count: int = 4):
        """Create N subpersonality posts via API."""
        names = ["Воитель", "Целитель", "Скептик", "Мечтатель", "Строитель"]
        for i in range(count):
            await client.post("/api/self/posts", json={
                "subpersonality": names[i],
                "content": f"История #{i}",
            })

    async def test_round_table_insufficient_posts(self, client: AsyncClient):
        """POST /self/round-table — error если < 4 постов."""
        await self._seed_posts(client, count=2)
        resp = await client.post("/api/self/round-table")
        assert resp.status_code == 200
        data = resp.json()
        assert "error" in data
        assert "Need 4+ subpersonality posts" in data["error"]

    async def test_round_table_success(self, client: AsyncClient):
        """POST /self/round-table — успешная генерация круглого стола."""
        await self._seed_posts(client, count=5)
        resp = await client.post("/api/self/round-table")
        assert resp.status_code == 200
        data = resp.json()
        assert "error" not in data
        assert isinstance(data["id"], int)
        assert len(data["participants"]) >= 4
        assert len(data["dialogue"]) > 50

    async def test_list_round_tables_empty(self, client: AsyncClient):
        """GET /self/round-table — пустой список."""
        resp = await client.get("/api/self/round-table")
        assert resp.status_code == 200
        assert resp.json() == []


class TestFamilyPortrait:
    """Тесты для /self/family-portrait."""

    async def _seed_posts(self, client: AsyncClient, count: int = 2):
        """Create N subpersonality posts via API."""
        names = ["Мать", "Отец", "Ребёнок"]
        for i in range(count):
            await client.post("/api/self/posts", json={
                "subpersonality": names[i], "content": f"Голос {names[i]}.",
            })

    async def test_family_portrait_insufficient_posts(self, client: AsyncClient):
        """POST /self/family-portrait — error если < 2 постов."""
        await self._seed_posts(client, count=1)
        resp = await client.post("/api/self/family-portrait")
        assert resp.status_code == 200
        data = resp.json()
        assert "error" in data
        assert "Need 2+ subpersonality posts" in data["error"]

    async def test_family_portrait_success(self, client: AsyncClient):
        """POST /self/family-portrait — успешная генерация портрета."""
        await self._seed_posts(client, count=3)
        resp = await client.post("/api/self/family-portrait")
        assert resp.status_code == 200
        data = resp.json()
        assert "error" not in data
        assert isinstance(data["id"], int)
        assert len(data["portrait"]) > 50
        assert isinstance(data.get("dalle_prompt"), str)

    async def test_list_portraits_empty(self, client: AsyncClient):
        """GET /self/family-portrait — пустой список."""
        resp = await client.get("/api/self/family-portrait")
        assert resp.status_code == 200
        assert resp.json() == []


class TestNegotiator:
    """Тесты для /self/negotiator."""

    async def test_negotiator_success(self, client: AsyncClient):
        """POST /self/negotiator — успешная генерация переговоров."""
        resp = await client.post("/api/self/negotiator", json={
            "critic_quote": "Ты никогда не доводишь дела до конца.",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "error" not in data
        assert isinstance(data["id"], int)
        assert len(data["dialogue"]) > 50

    async def test_negotiator_invalid(self, client: AsyncClient):
        """POST /self/negotiator — пустой запрос 422."""
        resp = await client.post("/api/self/negotiator", json={})
        assert resp.status_code == 422
