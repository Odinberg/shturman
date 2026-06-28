'use client';

import { useState, useEffect, useCallback } from 'react';
import { journalAPI, type JournalEntry } from '../../lib/api';

const GENRES = [
  { value: 'hobbit', label: 'Хоббит' },
  { value: 'detective', label: 'Детектив' },
  { value: 'manual', label: 'Инструкция' },
  { value: 'naturalist', label: 'Натуралист' },
];

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [creating, setCreating] = useState(false);

  const [patternsResult, setPatternsResult] = useState<string | null>(null);
  const [patternsLoading, setPatternsLoading] = useState(false);

  const [altResults, setAltResults] = useState<
    Record<number, { rewritten: string; genre: string }>
  >({});
  const [altLoading, setAltLoading] = useState<Record<number, boolean>>({});
  const [altGenre, setAltGenre] = useState<Record<number, string>>({});
  const [altOpen, setAltOpen] = useState<Record<number, boolean>>({});

  const loadEntries = useCallback(async () => {
    try {
      setError(null);
      const data = await journalAPI.list();
      setEntries(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
      setError(`Не удалось загрузить записи: ${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      setCreating(true);
      setError(null);
      await journalAPI.create(content.trim(), mood.trim() || undefined);
      setContent('');
      setMood('');
      await loadEntries();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
      setError(`Не удалось сохранить запись: ${message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleGeneratePatterns = async () => {
    try {
      setPatternsLoading(true);
      setError(null);
      const result = await journalAPI.generatePatterns();
      setPatternsResult(result.patterns);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
      setError(`Не удалось сгенерировать паттерны: ${message}`);
    } finally {
      setPatternsLoading(false);
    }
  };

  const handleAltReality = async (entryId: number) => {
    const genre = altGenre[entryId] || 'hobbit';
    try {
      setAltLoading((prev) => ({ ...prev, [entryId]: true }));
      setError(null);
      const result = await journalAPI.generateAltReality(entryId, genre);
      setAltResults((prev) => ({
        ...prev,
        [entryId]: { rewritten: result.rewritten, genre: result.genre },
      }));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
      setError(`Не удалось создать альтернативную реальность: ${message}`);
    } finally {
      setAltLoading((prev) => ({ ...prev, [entryId]: false }));
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <style>{`
        .journal-page {
          min-height: 100vh;
          background: var(--color-dark);
        }

        .journal-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--spacing-md) var(--spacing-md) var(--spacing-xl);
        }

        .journal-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-gold);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 400;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: var(--spacing-md);
          transition: var(--transition);
        }

        .journal-back:hover {
          color: var(--color-gold-light);
        }

        .journal-header {
          margin-bottom: var(--spacing-lg);
        }

        .journal-title {
          font-family: var(--font-cormorant), serif;
          font-size: 3rem;
          font-weight: 500;
          color: var(--color-text);
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }

        .journal-title span {
          color: var(--color-gold);
        }

        .journal-subtitle {
          font-size: 1.05rem;
          color: var(--color-gold);
          font-weight: 300;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .journal-divider {
          width: 100px;
          height: 1px;
          background: var(--color-gold);
          margin: var(--spacing-md) 0;
          opacity: 0.3;
        }

        /* ─── Сообщение об ошибке ─── */
        .journal-error {
          background: rgba(220, 80, 80, 0.12);
          border: 1px solid rgba(220, 80, 80, 0.3);
          border-radius: var(--border-radius);
          padding: var(--spacing-sm) var(--spacing-md);
          color: #e08080;
          font-size: 0.9rem;
          margin-bottom: var(--spacing-md);
        }

        /* ─── Форма создания ─── */
        .journal-form {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .journal-form-title {
          font-family: var(--font-cormorant), serif;
          font-size: 1.4rem;
          color: var(--color-gold);
          margin-bottom: var(--spacing-sm);
          font-weight: 500;
        }

        .journal-form-group {
          margin-bottom: var(--spacing-sm);
        }

        .journal-form-label {
          display: block;
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.4rem;
        }

        .journal-textarea {
          width: 100%;
          min-height: 120px;
          background: var(--color-dark);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: var(--spacing-sm);
          color: var(--color-text);
          font-family: var(--font-inter), sans-serif;
          font-size: 0.95rem;
          line-height: 1.7;
          resize: vertical;
          transition: var(--transition);
        }

        .journal-textarea:focus {
          outline: none;
          border-color: var(--color-gold);
        }

        .journal-input {
          width: 100%;
          background: var(--color-dark);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: 0.7rem var(--spacing-sm);
          color: var(--color-text);
          font-family: var(--font-inter), sans-serif;
          font-size: 0.95rem;
          transition: var(--transition);
        }

        .journal-input:focus {
          outline: none;
          border-color: var(--color-gold);
        }

        .journal-form-actions {
          display: flex;
          gap: var(--spacing-sm);
          align-items: center;
          margin-top: var(--spacing-sm);
        }

        .journal-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--color-gold);
          color: var(--color-dark);
          border: none;
          border-radius: var(--border-radius);
          padding: 0.7rem 1.6rem;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          font-family: var(--font-inter), sans-serif;
        }

        .journal-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(201, 169, 110, 0.3);
        }

        .journal-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .journal-btn-outline {
          background: transparent;
          color: var(--color-gold);
          border: 1px solid var(--color-gold);
        }

        .journal-btn-outline:hover:not(:disabled) {
          background: rgba(201, 169, 110, 0.08);
          box-shadow: 0 4px 15px rgba(201, 169, 110, 0.15);
        }

        /* ─── Паттерны ─── */
        .journal-patterns {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .journal-patterns-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }

        .journal-patterns-title {
          font-family: var(--font-cormorant), serif;
          font-size: 1.3rem;
          color: var(--color-gold);
          font-weight: 500;
        }

        .journal-patterns-body {
          margin-top: var(--spacing-md);
          white-space: pre-wrap;
          font-size: 0.95rem;
          line-height: 1.8;
          color: var(--color-text);
          background: var(--color-dark);
          border-radius: var(--border-radius);
          padding: var(--spacing-md);
          border: 1px solid var(--color-border);
        }

        /* ─── Список записей ─── */
        .journal-entries-title {
          font-family: var(--font-cormorant), serif;
          font-size: 1.5rem;
          color: var(--color-text);
          margin-bottom: var(--spacing-md);
          font-weight: 500;
        }

        .journal-entries {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .journal-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: var(--spacing-md);
          transition: var(--transition);
        }

        .journal-card:hover {
          border-color: var(--color-gold);
        }

        .journal-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-sm);
        }

        .journal-card-date {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .journal-card-mood {
          font-size: 0.8rem;
          color: var(--color-gold);
          background: rgba(201, 169, 110, 0.08);
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
          border-left: 2px solid var(--color-gold);
        }

        .journal-card-content {
          font-size: 0.95rem;
          color: var(--color-text);
          line-height: 1.7;
          white-space: pre-wrap;
          margin-bottom: var(--spacing-sm);
        }

        .journal-card-alt {
          border-top: 1px solid var(--color-border);
          padding-top: var(--spacing-sm);
          margin-top: var(--spacing-sm);
        }

        .journal-card-alt-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: none;
          border: none;
          color: var(--color-gold);
          cursor: pointer;
          font-size: 0.85rem;
          font-family: var(--font-inter), sans-serif;
          padding: 0;
          transition: var(--transition);
        }

        .journal-card-alt-toggle:hover {
          color: var(--color-gold-light);
        }

        .journal-card-alt-controls {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          margin-top: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .journal-genre-select {
          background: var(--color-dark);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          color: var(--color-text);
          padding: 0.4rem 0.6rem;
          font-size: 0.85rem;
          font-family: var(--font-inter), sans-serif;
          cursor: pointer;
        }

        .journal-genre-select:focus {
          outline: none;
          border-color: var(--color-gold);
        }

        .journal-alt-result {
          margin-top: var(--spacing-sm);
          background: var(--color-dark);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: var(--spacing-sm);
          white-space: pre-wrap;
          font-size: 0.9rem;
          line-height: 1.7;
          color: var(--color-text);
        }

        .journal-alt-result-label {
          font-size: 0.75rem;
          color: var(--color-gold);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.5rem;
        }

        /* ─── Empty / Loading ─── */
        .journal-empty {
          text-align: center;
          padding: var(--spacing-xl) var(--spacing-md);
          color: var(--color-text-secondary);
          font-size: 1rem;
        }

        .journal-loading {
          text-align: center;
          padding: var(--spacing-xl) var(--spacing-md);
          color: var(--color-gold);
          font-size: 1rem;
        }

        @media (max-width: 768px) {
          .journal-title {
            font-size: 2.2rem;
          }
          .journal-patterns-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="journal-page">
        <div className="journal-container">
          {/* Навигация назад */}
          <a href="/" className="journal-back">
            ← На главную
          </a>

          {/* Заголовок */}
          <div className="journal-header">
            <h1 className="journal-title">
              Активный <span>дневник</span>
            </h1>
            <p className="journal-subtitle">
              Resonance — записывай мысли, отслеживай паттерны
            </p>
            <div className="journal-divider" />
          </div>

          {/* Ошибка */}
          {error && <div className="journal-error">{error}</div>}

          {/* Форма создания */}
          <form className="journal-form" onSubmit={handleCreate}>
            <h2 className="journal-form-title">Новая запись</h2>
            <div className="journal-form-group">
              <label className="journal-form-label" htmlFor="journal-content">
                О чём думаешь?
              </label>
              <textarea
                id="journal-content"
                className="journal-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Запиши свои мысли, наблюдения или переживания..."
                disabled={creating}
              />
            </div>
            <div className="journal-form-group">
              <label className="journal-form-label" htmlFor="journal-mood">
                Настроение (необязательно)
              </label>
              <input
                id="journal-mood"
                className="journal-input"
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="Например: спокойное, тревожное, вдохновлённое..."
                disabled={creating}
              />
            </div>
            <div className="journal-form-actions">
              <button
                type="submit"
                className="journal-btn"
                disabled={creating || !content.trim()}
              >
                {creating ? 'Сохраняю...' : 'Сохранить'}
              </button>
            </div>
          </form>

          {/* Карта паттернов */}
          <div className="journal-patterns">
            <div className="journal-patterns-header">
              <h2 className="journal-patterns-title">Карта паттернов</h2>
              <button
                className="journal-btn journal-btn-outline"
                onClick={handleGeneratePatterns}
                disabled={patternsLoading || entries.length === 0}
              >
                {patternsLoading ? 'Генерирую...' : 'Сгенерировать карту паттернов'}
              </button>
            </div>
            {patternsResult && (
              <div className="journal-patterns-body">{patternsResult}</div>
            )}
          </div>

          {/* Список записей */}
          <h2 className="journal-entries-title">Записи</h2>

          {loading && <div className="journal-loading">Загружаю записи...</div>}

          {!loading && entries.length === 0 && !error && (
            <div className="journal-empty">
              Пока нет ни одной записи. Напиши первую — и увидишь её здесь.
            </div>
          )}

          <div className="journal-entries">
            {entries.map((entry) => (
              <div key={entry.id} className="journal-card">
                <div className="journal-card-header">
                  <span className="journal-card-date">
                    {formatDate(entry.created_at)}
                  </span>
                  {entry.mood && (
                    <span className="journal-card-mood">{entry.mood}</span>
                  )}
                </div>
                <div className="journal-card-content">{entry.content}</div>

                {/* Альтернативная реальность */}
                <div className="journal-card-alt">
                  <button
                    className="journal-card-alt-toggle"
                    onClick={() =>
                      setAltOpen((prev) => ({
                        ...prev,
                        [entry.id]: !prev[entry.id],
                      }))
                    }
                  >
                    {altOpen[entry.id] ? '▾' : '▸'} Альтернативная реальность
                  </button>

                  {altOpen[entry.id] && (
                    <>
                      <div className="journal-card-alt-controls">
                        <select
                          className="journal-genre-select"
                          value={altGenre[entry.id] || 'hobbit'}
                          onChange={(e) =>
                            setAltGenre((prev) => ({
                              ...prev,
                              [entry.id]: e.target.value,
                            }))
                          }
                        >
                          {GENRES.map((g) => (
                            <option key={g.value} value={g.value}>
                              {g.label}
                            </option>
                          ))}
                        </select>
                        <button
                          className="journal-btn journal-btn-outline"
                          style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                          onClick={() => handleAltReality(entry.id)}
                          disabled={altLoading[entry.id]}
                        >
                          {altLoading[entry.id]
                            ? 'Переписываю...'
                            : 'Переписать'}
                        </button>
                      </div>

                      {altResults[entry.id] && (
                        <div className="journal-alt-result">
                          <div className="journal-alt-result-label">
                            Жанр: {GENRES.find((g) => g.value === altResults[entry.id].genre)?.label || altResults[entry.id].genre}
                          </div>
                          {altResults[entry.id].rewritten}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
