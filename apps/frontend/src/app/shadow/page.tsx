'use client';

import { useState, useEffect, useCallback } from 'react';
import { shadowAPI } from '../../lib/api';

interface Recording {
  id: number;
  target: string;
  transcript: string;
  created_at: string;
}

interface MirrorResult {
  id: number;
  letter: string;
}

interface ForbiddenDesireResult {
  id: number;
  desire: string;
}

interface AntiHeroResult {
  id: number;
  comic: string;
  dalle_prompt: string;
}

export default function ShadowPage() {
  const [transcript, setTranscript] = useState('');
  const [irritationTarget, setIrritationTarget] = useState('');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [mirrorLetters, setMirrorLetters] = useState<Record<number, string>>({});
  const [forbiddenDesire, setForbiddenDesire] = useState<string | null>(null);
  const [antiHero, setAntiHero] = useState<AntiHeroResult | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const setLoadingKey = (key: string, value: boolean) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  };

  const loadRecordings = useCallback(async () => {
    try {
      setLoadingKey('list', true);
      const data = await shadowAPI.listRecordings();
      setRecordings(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки записей');
    } finally {
      setLoadingKey('list', false);
    }
  }, []);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  const handleCreateRecording = async () => {
    if (!transcript.trim() || !irritationTarget.trim()) return;
    try {
      setLoadingKey('create', true);
      setError(null);
      await shadowAPI.createRecording(transcript, irritationTarget);
      setTranscript('');
      setIrritationTarget('');
      await loadRecordings();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка создания записи');
    } finally {
      setLoadingKey('create', false);
    }
  };

  const handleMirrorLetter = async (recordingId: number) => {
    try {
      setLoadingKey(`mirror-${recordingId}`, true);
      setError(null);
      const result: MirrorResult = await shadowAPI.generateMirrorLetter(recordingId);
      setMirrorLetters((prev) => ({ ...prev, [recordingId]: result.letter }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка генерации зеркального письма');
    } finally {
      setLoadingKey(`mirror-${recordingId}`, false);
    }
  };

  const handleForbiddenDesire = async () => {
    try {
      setLoadingKey('desire', true);
      setError(null);
      const result: ForbiddenDesireResult = await shadowAPI.generateForbiddenDesire();
      setForbiddenDesire(result.desire);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка генерации карты желаний');
    } finally {
      setLoadingKey('desire', false);
    }
  };

  const handleAntiHero = async () => {
    try {
      setLoadingKey('antihero', true);
      setError(null);
      const result: AntiHeroResult = await shadowAPI.generateAntiHero();
      setAntiHero(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка генерации комикса');
    } finally {
      setLoadingKey('antihero', false);
    }
  };

  return (
    <>
      <style>{`
        .shadow-nav {
          padding: var(--spacing-sm) 0;
          margin-bottom: var(--spacing-md);
        }

        .shadow-nav a {
          color: var(--color-gold);
          text-decoration: none;
          font-size: 0.95rem;
          transition: var(--transition);
        }

        .shadow-nav a:hover {
          color: var(--color-gold-light);
        }

        .shadow-title {
          font-size: 2.5rem;
          color: var(--color-text);
          font-family: var(--font-cormorant), serif;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .shadow-subtitle {
          font-size: 1rem;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-md);
          font-weight: 300;
        }

        .shadow-form {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: 2rem;
          margin-bottom: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .shadow-form label {
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: -0.5rem;
        }

        .shadow-form textarea,
        .shadow-form input {
          background: var(--color-dark);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          padding: 0.85rem 1rem;
          color: var(--color-text);
          font-family: var(--font-inter), sans-serif;
          font-size: 0.95rem;
          resize: vertical;
          transition: var(--transition);
        }

        .shadow-form textarea:focus,
        .shadow-form input:focus {
          outline: none;
          border-color: var(--color-gold);
        }

        .shadow-form textarea {
          min-height: 100px;
        }

        .shadow-btn {
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

        .shadow-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(201, 169, 110, 0.3);
        }

        .shadow-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .shadow-btn-secondary {
          background: transparent;
          border: 1px solid var(--color-gold);
          color: var(--color-gold);
        }

        .shadow-btn-secondary:hover:not(:disabled) {
          background: rgba(201, 169, 110, 0.1);
          box-shadow: none;
        }

        .shadow-error {
          background: rgba(220, 53, 69, 0.12);
          border: 1px solid rgba(220, 53, 69, 0.3);
          border-radius: 6px;
          padding: 0.75rem 1rem;
          color: #f8716f;
          font-size: 0.85rem;
          margin-bottom: var(--spacing-sm);
        }

        .shadow-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: var(--spacing-md);
        }

        .shadow-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: 1.5rem;
          transition: var(--transition);
        }

        .shadow-card:hover {
          border-color: var(--color-gold);
        }

        .shadow-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .shadow-card-target {
          color: var(--color-gold);
          font-weight: 500;
          font-size: 1rem;
        }

        .shadow-card-date {
          color: var(--color-text-secondary);
          font-size: 0.8rem;
        }

        .shadow-card-transcript {
          color: var(--color-text);
          font-size: 0.9rem;
          line-height: 1.7;
          margin-bottom: 1rem;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .shadow-letter {
          background: rgba(201, 169, 110, 0.08);
          border: 1px solid var(--color-gold);
          border-radius: 6px;
          padding: 1.25rem;
          margin-top: 1rem;
          color: var(--color-text);
          font-size: 0.9rem;
          line-height: 1.8;
          white-space: pre-wrap;
          font-style: italic;
        }

        .shadow-section {
          margin-bottom: var(--spacing-md);
        }

        .shadow-section-title {
          font-size: 1.3rem;
          color: var(--color-gold);
          font-family: var(--font-cormorant), serif;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        .shadow-result-box {
          background: var(--color-card);
          border: 1px solid var(--color-gold);
          border-radius: var(--border-radius);
          padding: 1.5rem;
          margin-bottom: var(--spacing-sm);
        }

        .shadow-result-box h3 {
          font-size: 1.1rem;
          color: var(--color-gold);
          font-family: var(--font-cormorant), serif;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }

        .shadow-result-box p {
          color: var(--color-text);
          font-size: 0.9rem;
          line-height: 1.8;
          white-space: pre-wrap;
        }

        .shadow-dalle {
          background: rgba(106, 139, 172, 0.1);
          border: 1px solid var(--color-accent);
          border-radius: 6px;
          padding: 1rem;
          margin-top: 1rem;
        }

        .shadow-dalle span {
          color: var(--color-accent);
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .shadow-dalle p {
          color: var(--color-text-secondary);
          font-size: 0.85rem;
          margin-top: 0.5rem;
          line-height: 1.6;
        }

        .shadow-count {
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          margin-bottom: 1rem;
        }

        .shadow-count strong {
          color: var(--color-gold);
        }

        .shadow-actions-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: var(--spacing-sm);
        }

        @media (max-width: 768px) {
          .shadow-title { font-size: 1.8rem; }
          .shadow-card-header { flex-direction: column; }
        }
      `}</style>

      <div className="container" style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-xl)' }}>
        <nav className="shadow-nav">
          <a href="/">← На главную</a>
        </nav>

        <h1 className="shadow-title">Диалог с Тенью</h1>
        <p className="shadow-subtitle">
          Направление 4 — исследуйте скрытые стороны через честный диалог
        </p>

        {error && (
          <div className="shadow-error">
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

        {/* Форма записи */}
        <div className="shadow-form">
          <label htmlFor="transcript">Расшифровка голосового сообщения</label>
          <textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Запишите, что вас беспокоит, что вы проговаривали вслух..."
          />
          <label htmlFor="irritation">Кто/что раздражает</label>
          <input
            id="irritation"
            type="text"
            value={irritationTarget}
            onChange={(e) => setIrritationTarget(e.target.value)}
            placeholder="Например: коллега на работе, пробки, критика от других..."
          />
          <button
            className="shadow-btn"
            onClick={handleCreateRecording}
            disabled={loading['create'] || !transcript.trim() || !irritationTarget.trim()}
          >
            {loading['create'] ? 'Запись...' : 'Записать'}
          </button>
        </div>

        {/* Записи */}
        <div className="shadow-section">
          <h2 className="shadow-section-title">
            Записи
            <span className="shadow-count" style={{ marginLeft: '0.75rem' }}>
              (<strong>{recordings.length}</strong>)
            </span>
          </h2>

          {loading['list'] && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Загрузка...</p>
          )}

          {!loading['list'] && recordings.length === 0 && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Пока нет записей. Создайте первую запись выше.
            </p>
          )}

          <div className="shadow-list">
            {recordings.map((r) => (
              <div key={r.id} className="shadow-card">
                <div className="shadow-card-header">
                  <span className="shadow-card-target">🎯 {r.target}</span>
                  <span className="shadow-card-date">
                    {new Date(r.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="shadow-card-transcript">{r.transcript}</div>
                <button
                  className="shadow-btn shadow-btn-secondary"
                  onClick={() => handleMirrorLetter(r.id)}
                  disabled={loading[`mirror-${r.id}`]}
                >
                  {loading[`mirror-${r.id}`] ? 'Генерация...' : 'Зеркальный дублёр'}
                </button>
                {mirrorLetters[r.id] && (
                  <div className="shadow-letter">{mirrorLetters[r.id]}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Бонусы */}
        {recordings.length >= 3 && (
          <div className="shadow-section">
            <h2 className="shadow-section-title">Бонусы за смелость</h2>

            <div className="shadow-actions-row">
              <button
                className="shadow-btn"
                onClick={handleForbiddenDesire}
                disabled={loading['desire']}
              >
                {loading['desire'] ? 'Генерация...' : 'Карта запретных желаний'}
              </button>
            </div>

            {forbiddenDesire && (
              <div className="shadow-result-box" style={{ marginTop: '1rem' }}>
                <h3>🗺️ Карта запретных желаний</h3>
                <p>{forbiddenDesire}</p>
              </div>
            )}

            {forbiddenDesire && (
              <div className="shadow-actions-row" style={{ marginTop: '0.75rem' }}>
                <button
                  className="shadow-btn shadow-btn-secondary"
                  onClick={handleAntiHero}
                  disabled={loading['antihero']}
                >
                  {loading['antihero'] ? 'Генерация...' : 'Анти-герой комикс'}
                </button>
              </div>
            )}

            {antiHero && (
              <div className="shadow-result-box" style={{ marginTop: '1rem' }}>
                <h3>🦹 Анти-герой</h3>
                <p>{antiHero.comic}</p>
                <div className="shadow-dalle">
                  <span>🎨 DALL·E prompt</span>
                  <p>{antiHero.dalle_prompt}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
