'use client';

import { useState, useEffect, useCallback } from 'react';
import { multiplicityAPI } from '../../lib/api';

interface Post {
  id: number;
  subpersonality: string;
  content: string;
  date: string;
}

interface Stat {
  persona: string;
  count: number;
}

export default function SelfPage() {
  const [subpersonality, setSubpersonality] = useState('');
  const [content, setContent] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Круглый стол
  const [roundTable, setRoundTable] = useState('');
  const [roundLoading, setRoundLoading] = useState(false);

  // Портрет семьи
  const [familyPortrait, setFamilyPortrait] = useState('');
  const [portraitLoading, setPortraitLoading] = useState(false);

  // Переговорщик
  const [criticQuote, setCriticQuote] = useState('');
  const [negotiatorResult, setNegotiatorResult] = useState('');
  const [negotiatorLoading, setNegotiatorLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [postsData, statsData] = await Promise.all([
        multiplicityAPI.listPosts(),
        multiplicityAPI.stats(),
      ]);
      setPosts(postsData);
      setStats(statsData);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePost = async () => {
    if (!subpersonality.trim() || !content.trim()) return;
    setLoading(true);
    setError('');
    try {
      await multiplicityAPI.createPost(subpersonality.trim(), content.trim());
      setSubpersonality('');
      setContent('');
      await loadData();
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoundTable = async () => {
    setRoundLoading(true);
    setRoundTable('');
    setError('');
    try {
      const res = await multiplicityAPI.generateRoundTable();
      setRoundTable(res.dialogue);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setRoundLoading(false);
    }
  };

  const handleFamilyPortrait = async () => {
    setPortraitLoading(true);
    setFamilyPortrait('');
    setError('');
    try {
      const res = await multiplicityAPI.generateFamilyPortrait();
      setFamilyPortrait(res.portrait);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setPortraitLoading(false);
    }
  };

  const handleNegotiator = async () => {
    if (!criticQuote.trim()) return;
    setNegotiatorLoading(true);
    setNegotiatorResult('');
    setError('');
    try {
      const res = await multiplicityAPI.generateNegotiator(criticQuote.trim());
      setNegotiatorResult(res.dialogue);
    } catch (e: unknown) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setNegotiatorLoading(false);
    }
  };

  // Группировка постов по субличности
  const groupedPosts = posts.reduce<Record<string, Post[]>>((acc, post) => {
    const key = post.subpersonality;
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {});

  // Данные для круговой диаграммы
  const totalCount = stats.reduce((sum, s) => sum + s.count, 0);
  const colors = [
    '#C9A96E',
    '#6A8BAC',
    '#4CAF50',
    '#E57373',
    '#BA68C8',
    '#FFB74D',
    '#4DD0E1',
    '#AED581',
  ];

  // Кумулятивный прогресс для диаграммы
  let cumulative = 0;
  const segments = stats.map((s, i) => {
    const start = cumulative;
    const pct = totalCount > 0 ? (s.count / totalCount) * 100 : 0;
    cumulative += pct;
    return {
      ...s,
      pct,
      start,
      color: colors[i % colors.length],
    };
  });

  // Строка conic-gradient для круговой диаграммы
  let conicGradient = '#1A1A1A 0% 100%';
  {
    let cum = 0;
    const parts: string[] = [];
    stats.forEach((s, i) => {
      const pct = totalCount > 0 ? (s.count / totalCount) * 100 : 0;
      if (pct > 0) {
        parts.push(`${colors[i % colors.length]} ${cum}% ${cum + pct}%`);
        cum += pct;
      }
    });
    if (parts.length > 0) {
      conicGradient = parts.join(', ');
    }
  }

  return (
    <>
      <style>{`
        .self-page {
          min-height: 100vh;
          background: var(--color-dark);
        }

        .self-nav {
          padding: 1.5rem 0;
          border-bottom: 1px solid var(--color-border);
          background: rgba(10, 10, 10, 0.95);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .self-nav a {
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 400;
          transition: color 0.3s;
        }

        .self-nav a:hover {
          color: var(--color-gold);
        }

        .self-hero {
          padding: 4rem 0 3rem;
          text-align: center;
        }

        .self-hero h1 {
          font-family: var(--font-cormorant), serif;
          font-size: 3rem;
          font-weight: 500;
          color: var(--color-text);
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
        }

        .self-hero p {
          color: var(--color-text-secondary);
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .self-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          padding-bottom: 4rem;
        }

        @media (max-width: 768px) {
          .self-grid {
            grid-template-columns: 1fr;
          }
        }

        .self-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          padding: 2rem;
        }

        .self-card h2 {
          font-family: var(--font-cormorant), serif;
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--color-gold);
          margin-bottom: 1.5rem;
        }

        .self-card label {
          display: block;
          color: var(--color-text-secondary);
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .self-card textarea,
        .self-card input {
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

        .self-card textarea:focus,
        .self-card input:focus {
          border-color: var(--color-gold);
        }

        .self-card textarea {
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

        .self-error {
          background: rgba(255, 77, 77, 0.1);
          border: 1px solid rgba(255, 77, 77, 0.3);
          border-radius: 8px;
          padding: 1rem;
          color: #ff4d4d;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }

        .post-group {
          margin-bottom: 1.5rem;
        }

        .post-group h3 {
          font-family: var(--font-cormorant), serif;
          font-size: 1.15rem;
          color: var(--color-gold);
          margin-bottom: 0.75rem;
          font-weight: 500;
        }

        .post-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .post-list li {
          background: var(--color-dark);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 0.75rem 1rem;
        }

        .post-list .post-content {
          color: var(--color-text);
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 0.25rem;
        }

        .post-list .post-date {
          color: var(--color-text-secondary);
          font-size: 0.75rem;
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

        /* Круговая диаграмма (на CSS) */
        .pie-chart {
          display: flex;
          align-items: center;
          gap: 2rem;
          flex-wrap: wrap;
        }

        .pie-visual {
          position: relative;
          width: 140px;
          height: 140px;
          border-radius: 50%;
        }

        .pie-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70px;
          height: 70px;
          border-radius: 50%;
          background: var(--color-card);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          color: var(--color-text-secondary);
        }

        .pie-legend {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .pie-legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--color-text);
        }

        .pie-legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .pie-legend-count {
          color: var(--color-text-secondary);
          font-size: 0.8rem;
          margin-left: auto;
        }

        .bonus-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-top: 0;
        }
      `}</style>

      <div className="self-page">
        {/* Навигация */}
        <nav className="self-nav">
          <div className="container">
            <a href="/">← На главную</a>
          </div>
        </nav>

        {/* Заголовок */}
        <section className="self-hero">
          <div className="container">
            <h1>Множественность Я</h1>
            <p>
              Услышь каждый голос внутри себя. Дай слово разным субличностям —
              и открой диалог, который ведёт к целостности.
            </p>
          </div>
        </section>

        {/* Основной контент */}
        <div className="container">
          {error && <div className="self-error">{error}</div>}

          <div className="self-grid">
            {/* Форма: создать пост */}
            <div className="self-card">
              <h2>Новая запись</h2>
              <label htmlFor="subpersonality">Имя субличности</label>
              <input
                id="subpersonality"
                type="text"
                value={subpersonality}
                onChange={(e) => setSubpersonality(e.target.value)}
                placeholder="Например: Внутренний Критик, Ребёнок, Мудрец..."
              />
              <label htmlFor="content" style={{ marginTop: '1rem' }}>
                Голос субличности
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Что говорит эта часть тебя? Дай ей высказаться..."
              />
              <button
                className="btn btn-primary"
                onClick={handleCreatePost}
                disabled={loading || !subpersonality.trim() || !content.trim()}
              >
                {loading ? 'Сохраняю...' : 'Записать'}
              </button>
            </div>

            {/* Список постов */}
            <div className="self-card">
              <h2>Голоса</h2>
              {Object.keys(groupedPosts).length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  Пока нет записей. Дай слово первой субличности.
                </p>
              ) : (
                Object.entries(groupedPosts).map(([persona, personaPosts]) => (
                  <div key={persona} className="post-group">
                    <h3>{persona}</h3>
                    <ul className="post-list">
                      {personaPosts.map((p) => (
                        <li key={p.id}>
                          <div className="post-content">{p.content}</div>
                          <div className="post-date">
                            {new Date(p.date).toLocaleDateString('ru-RU', {
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
                  </div>
                ))
              )}
            </div>

            {/* Статистика — круговая диаграмма */}
            <div className="self-card">
              <h2>Статистика</h2>
              {stats.length === 0 ? (
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  Нет данных для статистики.
                </p>
              ) : (
                <div className="pie-chart">
                  <div className="pie-visual" style={{ background: `conic-gradient(${conicGradient})` }}>
                    <div className="pie-center">{totalCount}</div>
                  </div>
                  <div className="pie-legend">
                    {segments.map((s, i) => (
                      <div key={s.persona} className="pie-legend-item">
                        <div
                          className="pie-legend-dot"
                          style={{ background: colors[i % colors.length] }}
                        />
                        <span>{s.persona}</span>
                        <span className="pie-legend-count">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Бонусные действия */}
            <div className="self-card">
              <h2>Инструменты</h2>

              {/* Круглый стол (4+ поста) */}
              {posts.length >= 4 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    Доступно: 4+ записей
                  </p>
                  <button
                    className="btn btn-outline"
                    onClick={handleRoundTable}
                    disabled={roundLoading}
                    style={{ marginTop: 0 }}
                  >
                    {roundLoading ? 'Собираю стол...' : 'Круглый стол'}
                  </button>
                  {roundTable && <div className="result-block">{roundTable}</div>}
                </div>
              )}

              {/* Портрет семьи (2+ поста) */}
              {posts.length >= 2 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    Доступно: 2+ записей
                  </p>
                  <button
                    className="btn btn-outline"
                    onClick={handleFamilyPortrait}
                    disabled={portraitLoading}
                    style={{ marginTop: 0 }}
                  >
                    {portraitLoading ? 'Рисую портрет...' : 'Портрет семьи'}
                  </button>
                  {familyPortrait && <div className="result-block">{familyPortrait}</div>}
                </div>
              )}

              {/* Переговорщик (всегда доступен) */}
              <div>
                <label htmlFor="critic">Цитата критика</label>
                <textarea
                  id="critic"
                  value={criticQuote}
                  onChange={(e) => setCriticQuote(e.target.value)}
                  placeholder="Что тебе говорит внутренний критик? Процитируй..."
                />
                <button
                  className="btn btn-primary"
                  onClick={handleNegotiator}
                  disabled={negotiatorLoading || !criticQuote.trim()}
                >
                  {negotiatorLoading ? 'Веду переговоры...' : 'Переговорщик'}
                </button>
                {negotiatorResult && (
                  <div className="result-block">{negotiatorResult}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
