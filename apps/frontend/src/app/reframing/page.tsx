'use client';

import { useState, useEffect, useCallback } from 'react';
import { reframingAPI } from '../../lib/api';

interface Session {
  id: number;
  situation: string;
  created_at: string;
}

export default function ReframingPage() {
  const [situation, setSituation] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ИИ-адвокат
  const [advocateQuery, setAdvocateQuery] = useState('');
  const [advocateResult, setAdvocateResult] = useState('');
  const [advocateLoading, setAdvocateLoading] = useState(false);

  // Шкатулка формулировок
  const [insightBox, setInsightBox] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);

  // Слепое пятно
  const [blindQuery, setBlindQuery] = useState('');
  const [blindResult, setBlindResult] = useState('');
  const [blindLoading, setBlindLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      const data = await reframingAPI.listSessions();
      setSessions(data);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleCreate = async () => {
    if (!situation.trim()) return;
    setLoading(true);
    setError('');
    try {
      await reframingAPI.createSession(situation.trim());
      setSituation('');
      await loadSessions();
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvocate = async () => {
    if (!advocateQuery.trim()) return;
    setAdvocateLoading(true);
    setAdvocateResult('');
    setError('');
    try {
      const res = await reframingAPI.aiAdvocate(advocateQuery.trim());
      setAdvocateResult(res.response);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setAdvocateLoading(false);
    }
  };

  const handleInsightBox = async () => {
    setInsightLoading(true);
    setInsightBox('');
    setError('');
    try {
      const res = await reframingAPI.generateInsightBox();
      setInsightBox(res.box);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setInsightLoading(false);
    }
  };

  const handleBlindSpot = async () => {
    if (!blindQuery.trim()) return;
    setBlindLoading(true);
    setBlindResult('');
    setError('');
    try {
      const res = await reframingAPI.blindSpot(blindQuery.trim());
      setBlindResult(res.result);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setBlindLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .reframing-page {
          min-height: 100vh;
          background: var(--color-dark);
        }

        .reframing-nav {
          padding: 1.5rem 0;
          border-bottom: 1px solid var(--color-border);
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .reframing-nav a {
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 400;
          transition: color 0.3s;
        }

        .reframing-nav a:hover {
          color: var(--color-gold);
        }

        .reframing-hero {
          padding: 4rem 0 3rem;
          text-align: center;
        }

        .reframing-hero h1 {
          font-family: var(--font-cormorant), serif;
          font-size: 3rem;
          font-weight: 500;
          color: var(--color-text);
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
        }

        .reframing-hero p {
          color: var(--color-text-secondary);
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .reframing-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          padding-bottom: 4rem;
        }

        @media (max-width: 768px) {
          .reframing-grid {
            grid-template-columns: 1fr;
          }
        }

        .reframing-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 2rem;
        }

        .reframing-card h2 {
          font-family: var(--font-cormorant), serif;
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--color-gold);
          margin-bottom: 1.5rem;
        }

        .reframing-card label {
          display: block;
          color: var(--color-text-secondary);
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .reframing-card textarea,
        .reframing-card input {
          width: 100%;
          background: var(--color-dark);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          color: var(--color-text);
          font-family: inherit;
          font-size: 0.95rem;
          resize: vertical;
          outline: none;
          transition: border-color 0.3s;
        }

        .reframing-card textarea:focus,
        .reframing-card input:focus {
          border-color: var(--color-gold);
        }

        .reframing-card textarea {
          min-height: 100px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-family: inherit;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.3s;
          margin-top: 1rem;
        }

        .btn-primary {
          background: var(--color-gold);
          color: var(--color-dark);
        }

        .btn-primary:hover {
          background: var(--color-gold-light);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--color-gold);
          color: var(--color-gold);
        }

        .btn-outline:hover {
          background: rgba(201, 169, 110, 0.1);
        }

        .btn-outline:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .reframing-error {
          background: rgba(255, 77, 77, 0.1);
          border: 1px solid rgba(255, 77, 77, 0.3);
          border-radius: 8px;
          padding: 1rem;
          color: #ff4d4d;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }

        .session-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .session-list li {
          background: var(--color-dark);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 1rem;
        }

        .session-list .session-text {
          color: var(--color-text);
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
          line-height: 1.6;
        }

        .session-list .session-date {
          color: var(--color-text-secondary);
          font-size: 0.8rem;
        }

        .session-count {
          color: var(--color-text-secondary);
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }

        .result-block {
          background: var(--color-dark);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 1.25rem;
          margin-top: 1rem;
          line-height: 1.8;
          white-space: pre-wrap;
          color: var(--color-text);
          font-size: 0.95rem;
        }

        .full-width {
          grid-column: 1 / -1;
        }
      `}</style>

      <div className="reframing-page">
        {/* Навигация */}
        <nav className="reframing-nav">
          <div className="container">
            <a href="/">← На главную</a>
          </div>
        </nav>

        {/* Заголовок */}
        <section className="reframing-hero">
          <div className="container">
            <h1>Рефрейминг ситуаций</h1>
            <p>
              Инструмент когнитивной гибкости: посмотри на одну и ту же
              ситуацию с разных ракурсов и открой новые смыслы.
            </p>
          </div>
        </section>

        {/* Основной контент */}
        <div className="container">
          {error && <div className="reframing-error">{error}</div>}

          <div className="reframing-grid">
            {/* Форма: создать сессию */}
            <div className="reframing-card">
              <h2>Новая сессия</h2>
              <label htmlFor="situation">Опиши ситуацию</label>
              <textarea
                id="situation"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="Опиши событие или мысль, которую хочешь переосмыслить..."
              />
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={loading || !situation.trim()}
              >
                {loading ? 'Обрабатываю...' : 'Разобрать'}
              </button>
            </div>

            {/* Список сессий */}
            <div className="reframing-card">
              <h2>История сессий</h2>
              <p className="session-count">
                Всего сессий: {sessions.length}
                {sessions.length >= 3 && (
                  <span style={{ marginLeft: '0.75rem' }}>
                    <button
                      className="btn btn-outline"
                      onClick={handleInsightBox}
                      disabled={insightLoading}
                      style={{ marginTop: 0, padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                    >
                      {insightLoading ? 'Собираю...' : 'Шкатулка формулировок'}
                    </button>
                  </span>
                )}
              </p>
              {insightBox && (
                <div className="result-block">{insightBox}</div>
              )}
              {sessions.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  Пока нет сессий. Создай первую.
                </p>
              ) : (
                <ul className="session-list">
                  {sessions.map((s) => (
                    <li key={s.id}>
                      <div className="session-text">{s.situation}</div>
                      <div className="session-date">
                        {new Date(s.created_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ИИ-адвокат */}
            <div className="reframing-card">
              <h2>ИИ-адвокат</h2>
              <label htmlFor="advocate">В чём тревога?</label>
              <textarea
                id="advocate"
                value={advocateQuery}
                onChange={(e) => setAdvocateQuery(e.target.value)}
                placeholder="Опиши тревожную мысль, и ИИ-адвокат приведёт 5 аргументов против..."
              />
              <button
                className="btn btn-primary"
                onClick={handleAdvocate}
                disabled={advocateLoading || !advocateQuery.trim()}
              >
                {advocateLoading ? 'Адвокат работает...' : 'Получить 5 аргументов'}
              </button>
              {advocateResult && (
                <div className="result-block">{advocateResult}</div>
              )}
            </div>

            {/* Слепое пятно */}
            <div className="reframing-card">
              <h2>Слепое пятно</h2>
              <label htmlFor="blind">Запрос</label>
              <textarea
                id="blind"
                value={blindQuery}
                onChange={(e) => setBlindQuery(e.target.value)}
                placeholder="Сформулируй проблему — получи 2 вопроса, которые переведут фокус с «почему» на «что теперь»..."
              />
              <button
                className="btn btn-primary"
                onClick={handleBlindSpot}
                disabled={blindLoading || !blindQuery.trim()}
              >
                {blindLoading ? 'Ищу слепое пятно...' : 'Показать 2 вопроса'}
              </button>
              {blindResult && (
                <div className="result-block">{blindResult}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
