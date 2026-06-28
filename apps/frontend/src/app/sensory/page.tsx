'use client';

import { useState, useEffect, useCallback } from 'react';
import { sensoryAPI } from '../../lib/api';

interface Checkin {
  id: number;
  sensation: string;
  time: string;
}

interface KineticRow {
  sensation: string;
  time: string;
  hour: number;
  day: number;
}

interface AnchorResult {
  id: number;
  vibration_pattern: number[];
  status: string;
}

interface PredictResult {
  prediction: string;
  confidence: number;
  recommendation: string;
}

const SENSATIONS = [
  { key: 'напряжение', icon: '💪', label: 'Напряжение' },
  { key: 'лёгкость', icon: '🪶', label: 'Лёгкость' },
  { key: 'холод', icon: '❄️', label: 'Холод' },
  { key: 'жар', icon: '🔥', label: 'Жар' },
  { key: 'онемение', icon: '🫥', label: 'Онемение' },
];

export default function SensoryPage() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [kineticData, setKineticData] = useState<KineticRow[] | null>(null);
  const [anchor, setAnchor] = useState<AnchorResult | null>(null);
  const [prediction, setPrediction] = useState<PredictResult | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const setLoadingKey = (key: string, value: boolean) => {
    setLoading((prev) => ({ ...prev, [key]: value }));
  };

  const loadCheckins = useCallback(async () => {
    try {
      setLoadingKey('list', true);
      const data = await sensoryAPI.listCheckins();
      setCheckins(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки чекинов');
    } finally {
      setLoadingKey('list', false);
    }
  }, []);

  useEffect(() => {
    loadCheckins();
  }, [loadCheckins]);

  const handleCheckin = async (sensation: string) => {
    try {
      setLoadingKey(`checkin-${sensation}`, true);
      setError(null);
      await sensoryAPI.createCheckin(sensation);
      await loadCheckins();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка отправки чекина');
    } finally {
      setLoadingKey(`checkin-${sensation}`, false);
    }
  };

  const handleKineticData = async () => {
    try {
      setLoadingKey('kinetic', true);
      setError(null);
      const data = await sensoryAPI.kineticData();
      setKineticData(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки кинетических данных');
    } finally {
      setLoadingKey('kinetic', false);
    }
  };

  const handleSaveAnchor = async () => {
    try {
      setLoadingKey('anchor', true);
      setError(null);
      const data = await sensoryAPI.saveAnchor();
      setAnchor(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения якоря');
    } finally {
      setLoadingKey('anchor', false);
    }
  };

  const handlePredict = async () => {
    try {
      setLoadingKey('predict', true);
      setError(null);
      const data = await sensoryAPI.predict();
      setPrediction(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка предсказания');
    } finally {
      setLoadingKey('predict', false);
    }
  };

  const getSensationIcon = (key: string) => {
    const s = SENSATIONS.find((s) => s.key === key);
    return s ? `${s.icon} ` : '';
  };

  return (
    <>
      <style>{`
        .sensory-nav {
          padding: var(--spacing-sm) 0;
          margin-bottom: var(--spacing-md);
        }

        .sensory-nav a {
          color: var(--color-gold);
          text-decoration: none;
          font-size: 0.95rem;
          transition: var(--transition);
        }

        .sensory-nav a:hover {
          color: var(--color-gold-light);
        }

        .sensory-title {
          font-size: 2.5rem;
          color: var(--color-text);
          font-family: var(--font-cormorant), serif;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .sensory-subtitle {
          font-size: 1rem;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-md);
          font-weight: 300;
        }

        .sensory-error {
          background: rgba(220, 53, 69, 0.12);
          border: 1px solid rgba(220, 53, 69, 0.3);
          border-radius: 6px;
          padding: 0.75rem 1rem;
          color: #f8716f;
          font-size: 0.85rem;
          margin-bottom: var(--spacing-sm);
        }

        .sensory-section {
          margin-bottom: var(--spacing-md);
        }

        .sensory-section-title {
          font-size: 1.3rem;
          color: var(--color-gold);
          font-family: var(--font-cormorant), serif;
          font-weight: 500;
          margin-bottom: 1rem;
        }

        /* Кнопки ощущений */
        .sensory-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: var(--spacing-md);
        }

        .sensory-sense-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: 100px;
          padding: 0.8rem 1.5rem;
          color: var(--color-text);
          font-size: 1rem;
          cursor: pointer;
          transition: var(--transition);
          font-family: var(--font-inter), sans-serif;
        }

        .sensory-sense-btn:hover:not(:disabled) {
          border-color: var(--color-gold);
          background: rgba(201, 169, 110, 0.1);
          transform: translateY(-1px);
        }

        .sensory-sense-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Список чекинов */
        .sensory-checkin-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sensory-checkin-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
          color: var(--color-text);
        }

        .sensory-checkin-item .sensation-name {
          color: var(--color-gold);
          font-weight: 500;
        }

        .sensory-checkin-item .sensation-time {
          color: var(--color-text-secondary);
          margin-left: auto;
          font-size: 0.8rem;
        }

        /* Основные кнопки */
        .sensory-btn {
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

        .sensory-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(201, 169, 110, 0.3);
        }

        .sensory-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sensory-btn-secondary {
          background: transparent;
          border: 1px solid var(--color-gold);
          color: var(--color-gold);
        }

        .sensory-btn-secondary:hover:not(:disabled) {
          background: rgba(201, 169, 110, 0.1);
          box-shadow: none;
        }

        .sensory-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: var(--spacing-sm);
        }

        /* Таблица кинетических данных */
        .sensory-table-wrap {
          overflow-x: auto;
          margin-top: 1rem;
        }

        .sensory-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .sensory-table th {
          text-align: left;
          padding: 0.6rem 0.75rem;
          color: var(--color-gold);
          font-weight: 500;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid var(--color-border);
        }

        .sensory-table td {
          padding: 0.6rem 0.75rem;
          color: var(--color-text);
          border-bottom: 1px solid rgba(112, 112, 112, 0.2);
        }

        .sensory-table tr:hover td {
          background: rgba(201, 169, 110, 0.05);
        }

        /* Результаты */
        .sensory-result-box {
          background: var(--color-card);
          border: 1px solid var(--color-gold);
          border-radius: var(--border-radius);
          padding: 1.5rem;
          margin-top: 1rem;
        }

        .sensory-result-box h3 {
          font-size: 1.1rem;
          color: var(--color-gold);
          font-family: var(--font-cormorant), serif;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }

        .sensory-result-box p {
          color: var(--color-text);
          font-size: 0.9rem;
          line-height: 1.8;
          white-space: pre-wrap;
        }

        .sensory-confidence {
          display: inline-block;
          background: rgba(76, 175, 80, 0.15);
          color: var(--color-success);
          font-size: 0.8rem;
          padding: 0.3rem 0.75rem;
          border-radius: 100px;
          margin-top: 0.5rem;
        }

        .sensory-anchor-pattern {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-top: 0.75rem;
        }

        .sensory-vibe-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--color-gold);
          opacity: 0.6;
        }

        .sensory-vibe-dot.active {
          opacity: 1;
          background: var(--color-accent);
        }

        .sensory-count {
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          margin-left: 0.75rem;
        }

        .sensory-count strong {
          color: var(--color-gold);
        }

        @media (max-width: 768px) {
          .sensory-title { font-size: 1.8rem; }
          .sensory-buttons { gap: 0.5rem; }
          .sensory-sense-btn { padding: 0.65rem 1.1rem; font-size: 0.85rem; }
        }
      `}</style>

      <div className="container" style={{ paddingTop: 'var(--spacing-lg)', paddingBottom: 'var(--spacing-xl)' }}>
        <nav className="sensory-nav">
          <a href="/">← На главную</a>
        </nav>

        <h1 className="sensory-title">Сенсорные якоря</h1>
        <p className="sensory-subtitle">
          Направление 5 — отслеживайте телесные ощущения для предиктивной поддержки
        </p>

        {error && (
          <div className="sensory-error">
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

        {/* Кнопки ощущений */}
        <div className="sensory-section">
          <h2 className="sensory-section-title">Выберите ощущение</h2>
          <div className="sensory-buttons">
            {SENSATIONS.map((s) => (
              <button
                key={s.key}
                className="sensory-sense-btn"
                onClick={() => handleCheckin(s.key)}
                disabled={loading[`checkin-${s.key}`]}
              >
                {s.icon} {s.label}
                {loading[`checkin-${s.key}`] && ' ...'}
              </button>
            ))}
          </div>
        </div>

        {/* Чекины */}
        <div className="sensory-section">
          <h2 className="sensory-section-title">
            Чекины
            <span className="sensory-count">
              (<strong>{checkins.length}</strong>)
            </span>
          </h2>

          {loading['list'] && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Загрузка...</p>
          )}

          {!loading['list'] && checkins.length === 0 && (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Пока нет чекинов. Нажмите на ощущение выше.
            </p>
          )}

          <div className="sensory-checkin-list">
            {checkins.map((c) => (
              <div key={c.id} className="sensory-checkin-item">
                <span className="sensation-name">
                  {getSensationIcon(c.sensation)}{c.sensation}
                </span>
                <span className="sensation-time">
                  {new Date(c.time).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Инструменты */}
        <div className="sensory-section">
          <h2 className="sensory-section-title">Инструменты</h2>

          <div className="sensory-actions">
            <button
              className="sensory-btn sensory-btn-secondary"
              onClick={handleKineticData}
              disabled={loading['kinetic']}
            >
              {loading['kinetic'] ? 'Загрузка...' : 'Кинетический дневник'}
            </button>

            <button
              className="sensory-btn"
              onClick={handleSaveAnchor}
              disabled={loading['anchor']}
            >
              {loading['anchor'] ? 'Сохранение...' : 'Сохранить якорь спокойствия'}
            </button>

            <button
              className="sensory-btn sensory-btn-secondary"
              onClick={handlePredict}
              disabled={loading['predict']}
            >
              {loading['predict'] ? 'Анализ...' : 'Телесный компас'}
            </button>
          </div>

          {/* Кинетический дневник */}
          {kineticData && (
            <div className="sensory-result-box">
              <h3>📊 Кинетический дневник</h3>
              <div className="sensory-table-wrap">
                <table className="sensory-table">
                  <thead>
                    <tr>
                      <th>Ощущение</th>
                      <th>Время</th>
                      <th>Час</th>
                      <th>День</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kineticData.map((row, i) => (
                      <tr key={i}>
                        <td>{getSensationIcon(row.sensation)}{row.sensation}</td>
                        <td>{new Date(row.time).toLocaleString('ru-RU')}</td>
                        <td>{row.hour}</td>
                        <td>{row.day}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Якорь спокойствия */}
          {anchor && (
            <div className="sensory-result-box">
              <h3>⚓ Якорь спокойствия</h3>
              <p>Статус: {anchor.status}</p>
              <div className="sensory-anchor-pattern">
                {anchor.vibration_pattern.map((v, i) => (
                  <div
                    key={i}
                    className={`sensory-vibe-dot${v > 0.5 ? ' active' : ''}`}
                    title={`${Math.round(v * 100)}%`}
                  />
                ))}
              </div>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Вибро-ритм вашего дыхания в спокойный момент
              </p>
            </div>
          )}

          {/* Телесный компас */}
          {prediction && (
            <div className="sensory-result-box">
              <h3>🧭 Телесный компас</h3>
              <p>{prediction.prediction}</p>
              <span className="sensory-confidence">
                Точность: {Math.round(prediction.confidence * 100)}%
              </span>
              <p style={{ marginTop: '0.75rem' }}>
                <strong>Рекомендация:</strong> {prediction.recommendation}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
