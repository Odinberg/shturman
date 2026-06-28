'use client';

import { useState, useEffect, useCallback } from 'react';
import { butterflyAPI, ButterflyEvent } from '../../lib/api';

interface EventCount {
  total_events: number;
  bonus_unlocked: boolean;
}

interface FractalResult {
  id: number;
  insight: string;
}

interface VaultResult {
  id: number;
  vault: string;
}

export default function ButterflyPage() {
  const [eventText, setEventText] = useState('');
  const [events, setEvents] = useState<ButterflyEvent[]>([]);
  const [eventCount, setEventCount] = useState<EventCount | null>(null);
  const [fractals, setFractals] = useState<Record<number, string>>({});
  const [vault, setVault] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const setLoadingKey = (key: string, value: boolean) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  };

  const loadEvents = useCallback(async () => {
    try {
      setLoadingKey('list', true);
      const data = await butterflyAPI.listEvents();
      setEvents(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки событий');
    } finally {
      setLoadingKey('list', false);
    }
  }, []);

  const loadCount = useCallback(async () => {
    try {
      const data = await butterflyAPI.eventCount();
      setEventCount(data);
    } catch {
      // тихо игнорируем ошибку счётчика
    }
  }, []);

  useEffect(() => {
    loadEvents();
    loadCount();
  }, [loadEvents, loadCount]);

  const handleCreateEvent = async () => {
    if (!eventText.trim()) return;
    try {
      setLoadingKey('create', true);
      setError(null);
      await butterflyAPI.createEvent(eventText);
      setEventText('');
      await loadEvents();
      await loadCount();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка создания события');
    } finally {
      setLoadingKey('create', false);
    }
  };

  const handleFractal = async (eventId: number) => {
    try {
      setLoadingKey(`fractal-${eventId}`, true);
      setError(null);
      const result: FractalResult = await butterflyAPI.generateFractal(eventId);
      setFractals((prev) => ({ ...prev, [eventId]: result.insight }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка генерации фрактала');
    } finally {
      setLoadingKey(`fractal-${eventId}`, false);
    }
  };

  const handleVault = async () => {
    try {
      setLoadingKey('vault', true);
      setError(null);
      const result: VaultResult = await butterflyAPI.generateVault();
      setVault(result.vault);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка генерации копилки чудес');
    } finally {
      setLoadingKey('vault', false);
    }
  };

  const bonusUnlocked = eventCount ? eventCount.total_events >= 7 : false;

  return (
    <>
      <style>{`
        .bf-nav {
          padding: var(--spacing-sm) 0;
          margin-bottom: var(--spacing-md);
        }

        .bf-nav a {
          color: var(--color-gold);
          text-decoration: none;
          font-size: 0.95rem;
          transition: var(--transition);
        }

        .bf-nav a:hover {
          color: var(--color-gold-light);
        }

        .bf-title {
          font-size: 2.5rem;
          color: var(--color-text);
          font-family: var(--font-cormorant), serif;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .bf-subtitle {
          font-size: 1rem;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-md);
          font-weight: 300;
        }

        .bf-error {
          background: rgba(220, 53, 69, 0.12);
          border: 1px solid rgba(220, 53, 69, 0.3);
          border-radius: 6px;
          padding: 0.75rem 1rem;
          color: #f8716f;
          font-size: 0.85rem;
          margin-bottom: var(--spacing-sm);
        }

        .bf-form {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: 2rem;
          margin-bottom: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .bf-form label {
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: -0.5rem;
        }

        .bf-form input {
          background: var(--color-dark);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          padding: 0.85rem 1rem;
          color: var(--color-text);
          font-family: var(--font-inter), sans-serif;
          font-size: 0.95rem;
          transition: var(--transition);
        }

        .bf-form input:focus {
          outline: none;
          border-color: var(--color-gold);
        }

        .bf-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: var(--color-gold);
          color: var(--color-dark);
          border: none;
          border-radius: 6px;
          padding: 0.75rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          font-family: var(--font-inter), sans-serif;
          letter-spacing: 0.03em;
        }

        .bf-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(201, 169, 110, 0.3);
        }

        .bf-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .bf-btn-secondary {
          background: transparent;
          border: 1px solid var(--color-gold);
          color: var(--color-gold);
        }

        .bf-btn-secondary:hover:not(:disabled) {
          background: rgba(201, 169, 110, 0.1);
          box-shadow: none;
        }

        .bf-section {
          margin-bottom: var(--spacing-md);
        }

        .bf-section-title {
          font-size: 1.3rem;
          color: var(--color-gold);
          font-family: var(--font-cormorant), serif;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        /* Счётчик */
        .bf-counter {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: 1.25rem 1.5rem;
          margin-bottom: var(--spacing-md);
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .bf-counter-progress {
          flex: 1;
          min-width: 200px;
        }

        .bf-counter-text {
          font-size: 1rem;
          color: var(--color-text);
          margin-bottom: 0.5rem;
        }

        .bf-counter-text strong {
          color: var(--color-gold);
          font-size: 1.2rem;
        }

        .bf-progress-bar {
          width: 100%;
          height: 8px;
          background: var(--color-dark);
          border-radius: 4px;
          overflow: hidden;
        }

        .bf-progress-fill {
          height: 100%;
          background: var(--color-gold);
          border-radius: 4px;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .bf-bonus-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(76, 175, 80, 0.15);
          color: var(--color-success);
          font-size: 0.8rem;
          padding: 0.35rem 0.75rem;
          border-radius: 100px;
          font-weight: 500;
        }

        /* Список событий */
        .bf-event-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .bf-event-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: 1.25rem;
          transition: var(--transition);
        }

        .bf-event-card:hover {
          border-color: var(--color-gold);
        }

        .bf-event-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .bf-event-text {
          color: var(--color-text);
          font-size: 0.95rem;
          line-height: 1.6;
          flex: 1;
        }

        .bf-event-date {
          color: var(--color-text-secondary);
          font-size: 0.8rem;
          white-space: nowrap;
        }

        .bf-insight {
          background: rgba(201, 169, 110, 0.08);
          border: 1px solid var(--color-gold);
          border-radius: 6px;
          padding: 1rem;
          margin-top: 0.75rem;
          color: var(--color-text);
          font-size: 0.9rem;
          line-height: 1.8;
          white-space: pre-wrap;
          font-style: italic;
        }

        /* Результаты */
        .bf-result-box {
          background: var(--color-card);
          border: 1px solid var(--color-gold);
          border-radius: var(--border-radius);
          padding: 1.5rem;
          margin-top: 1rem;
        }

        .bf-result-box h3 {
          font-size: 1.1rem;
          color: var(--color-gold);
          font-family: var(--font-cormorant), serif;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }

        .bf-result-box p {
          color: var(--color-text);
          font-size: 0.9rem;
          line-height: 1.8;
          white-space: pre-wrap;
        }

        .bf-vault-actions {
          margin-top: var(--spacing-sm);
        }

        @media (max-width: 768px) {
          .bf-title { font-size: 1.8rem; }
        }
      `}</style>

      <div className="container" style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-xl)' }}>
        <nav className="bf-nav">
          <a href="/">← На главную</a>
        </nav>

        <h1 className="bf-title">Эффект Бабочки</h1>
        <p className="bf-subtitle">
          Направление 7 — замечайте маленькие события и наблюдайте их связь с большой картиной
        </p>

        {error && (
          <div className="bf-error">
            {error}
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: '1rem',
                background: 'none',
                border: 'none',
                color: '#f8716f',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Счётчик */}
        <div className="bf-counter">
          <div className="bf-counter-progress">
            <p className="bf-counter-text">
              Событий: <strong>{eventCount?.total_events ?? 0}</strong> / 7 для бонуса
            </p>
            <div className="bf-progress-bar">
              <div
                className="bf-progress-fill"
                style={{
                  width: `${Math.min(((eventCount?.total_events ?? 0) / 7) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
          {bonusUnlocked && (
            <span className="bf-bonus-badge">🌱 Бонус открыт</span>
          )}
        </div>

        {/* Форма события */}
        <div className="bf-form">
          <label htmlFor="event">Маленькое событие дня</label>
          <input
            id="event"
            type="text"
            value={eventText}
            onChange={(e) => setEventText(e.target.value)}
            placeholder="Например: увидел радугу, незнакомец улыбнулся, нашёл монетку..."
          />
          <button
            className="bf-btn"
            onClick={handleCreateEvent}
            disabled={loading['create'] || !eventText.trim()}
          >
            {loading['create'] ? 'Запись...' : 'Записать'}
          </button>
        </div>

        {/* Список событий */}
        <div className="bf-section">
          <h2 className="bf-section-title">События</h2>

          {loading['list'] && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Загрузка...</p>
          )}

          {!loading['list'] && events.length === 0 && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Пока нет событий. Запишите первое маленькое событие дня.
            </p>
          )}

          <div className="bf-event-list">
            {events.map((ev) => (
              <div key={ev.id} className="bf-event-card">
                <div className="bf-event-header">
                  <span className="bf-event-text">{ev.event}</span>
                  <span className="bf-event-date">
                    {new Date(ev.date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <button
                  className="bf-btn bf-btn-secondary"
                  onClick={() => handleFractal(ev.id)}
                  disabled={loading[`fractal-${ev.id}`]}
                  style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                >
                  {loading[`fractal-${ev.id}`] ? 'Генерация...' : 'Фрактал дня'}
                </button>
                {fractals[ev.id] && (
                  <div className="bf-insight">{fractals[ev.id]}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Бонус: Копилка чудес */}
        {bonusUnlocked && (
          <div className="bf-section">
            <h2 className="bf-section-title">Бонус за долгосрочность</h2>

            <div className="bf-vault-actions">
              <button
                className="bf-btn"
                onClick={handleVault}
                disabled={loading['vault']}
              >
                {loading['vault'] ? 'Генерация...' : 'Копилка чудес'}
              </button>
            </div>

            {vault && (
              <div className="bf-result-box">
                <h3>✨ Копилка чудес</h3>
                <p>{vault}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
