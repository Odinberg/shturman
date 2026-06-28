#!/bin/bash
# ==============================================================================
# Деплой Штурман на Synology NAS
# Домен: vnutrenniy-kompas.ru
# Локальный IP: 192.168.0.72
# Публичный IP: 91.247.233.83
# ==============================================================================

set -e

echo "🚀 Деплой Штурман на Synology"

# --- Проверка окружения ---
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY не задан. Создайте .env.prod:"
    echo "   OPENAI_API_KEY=sk-..."
    echo "   JWT_SECRET=<случайная строка>"
    echo "   DB_PASSWORD=<пароль БД>"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET не задан"
    exit 1
fi

# --- Сборка ---
echo ""
echo "📦 Сборка образов..."
docker compose -f docker-compose.prod.yml build --no-cache

# --- Запуск ---
echo ""
echo "▶️  Запуск контейнеров..."
docker compose -f docker-compose.prod.yml up -d --wait --wait-timeout 60

# --- Проверка ---
echo ""
echo "🔍 Проверка..."
sleep 5

# Проверка PostgreSQL
if docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U shturman > /dev/null 2>&1; then
    echo "  ✅ PostgreSQL — OK"
else
    echo "  ❌ PostgreSQL — не отвечает"
fi

# Проверка Redis
if docker compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "  ✅ Redis — OK"
else
    echo "  ❌ Redis — не отвечает"
fi

# Проверка бэкенда
sleep 3
if curl -sf http://localhost/health > /dev/null 2>&1; then
    echo "  ✅ Backend API — OK"
else
    echo "  ⚠️  Backend API — проверьте логи: docker compose -f docker-compose.prod.yml logs backend"
fi

# Проверка фронтенда
if curl -sf -o /dev/null http://localhost/ 2>&1; then
    echo "  ✅ Frontend — OK"
else
    echo "  ⚠️  Frontend — проверьте логи: docker compose -f docker-compose.prod.yml logs frontend"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Штурман развёрнут!"
echo ""
echo "   Локально:  http://192.168.0.72"
echo "   Внешне:    http://91.247.233.83"
echo "   Домен:     http://vnutrenniy-kompas.ru (после DNS)"
echo ""
echo "   API docs:  http://192.168.0.72/api/docs"
echo "   Swagger:   http://192.168.0.72/api/openapi.json"
echo ""
echo "   Логи:      docker compose -f docker-compose.prod.yml logs -f"
echo "   Статус:    docker compose -f docker-compose.prod.yml ps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
