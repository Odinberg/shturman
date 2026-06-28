'use client';

import { useEffect, useState } from 'react';
import { emotionalAPI } from '../../lib/api';
import type { EmotionalCheckin } from '../../lib/api';

const EMOJIS = ['😊', '😢', '😤', '😰', '😐', '🧘'];

const EMOJI_LABELS: Record<string, string> = {
  '😊': 'Радость',
  '😢': 'Грусть',
  '😤': 'Злость',
  '😰': 'Тревога',
  '😐': 'Спокойствие',
  '🧘': 'Осознанность',
};

export default function EmotionalProfilePage() {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [eventText, setEventText] = useState('');
  const [checkins, setCheckins] = useState<EmotionalCheckin[]>([]);
  const [streak, setStreak] = useState<{
    total_days: number;
    bonus_unlocked: boolean;
  } | null>(null);
  const [biorhythm, setBiorhythm] = useState<string | null>(null);
  const [resources, setResources] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<{ avatar: string; dalle_prompt: string } | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const setLoad = (key: string, v: boolean) =>
    setLoading((p) => ({ ...p, [key]: v }));
  const setErr = (key: string, msg: string | null) =>
    setErrors((p) => ({ ...p, [key]: msg }));
  const clearErr = (key: string) => setErr(key, null);

  const fetchCheckins = async () => {
    setLoad('checkins', true);
    clearErr('checkins');
    try {
      const data = await emotionalAPI.listCheckins();
      setCheckins(data);
    } catch (e: unknown) {
      setErr('checkins', e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoad('checkins', false);
    }
  };

  const fetchStreak = async () => {
    setLoad('streak', true);
    clearErr('streak');
    try {
      const data = await emotionalAPI.streak();
      setStreak({ total_days: data.total_days, bonus_unlocked: data.bonus_unlocked });
    } catch (e: unknown) {
      setErr('streak', e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoad('streak', false);
    }
  };

  useEffect(() => {
    fetchCheckins();
    fetchStreak();
  }, []);

  const handleCheckin = async () => {
    if (!selectedEmoji) return;
    setLoad('create', true);
    clearErr('create');
    try {
      await emotionalAPI.createCheckin(selectedEmoji, eventText);
      setEventText('');
      setSelectedEmoji(null);
      await fetchCheckins();
      await fetchStreak();
    } catch (e: unknown) {
      setErr('create', e instanceof Error ? e.message : 'Ошибка при записи');
    } finally {
      setLoad('create', false);
    }
  };

  const handleBiorhythm = async () => {
    setLoad('biorhythm', true);
    clearErr('biorhythm');
    try {
      const data = await emotionalAPI.generateBiorhythm();
      setBiorhythm(data.report);
    } catch (e: unknown) {
      setErr('biorhythm', e instanceof Error ? e.message : 'Ошибка генерации');
    } finally {
      setLoad('biorhythm', false);
    }
  };

  const handleResources = async () => {
    setLoad('resources', true);
    clearErr('resources');
    try {
      const data = await emotionalAPI.generateResources();
      setResources(data.resources);
    } catch (e: unknown) {
      setErr('resources', e instanceof Error ? e.message : 'Ошибка генерации');
    } finally {
      setLoad('resources', false);
    }
  };

  const handleAvatar = async () => {
    setLoad('avatar', true);
    clearErr('avatar');
    try {
      const data = await emotionalAPI.generateAvatar();
      setAvatar({ avatar: data.avatar, dalle_prompt: data.dalle_prompt });
    } catch (e: unknown) {
      setErr('avatar', e instanceof Error ? e.message : 'Ошибка генерации');
    } finally {
      setLoad('avatar', false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <style>{`
        .emotional-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--spacing-md) var(--spacing-md) var(--spacing-xl);
        }

        .emotional-back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          margin-bottom: var(--spacing-md);
          transition: var(--transition);
        }

        .emotional-back-link:hover {
          color: var(--color-gold);
        }

        .emotional-header {
          text-align: center;
          margin-bottom: var(--spacing-lg);
        }

        .emotional-title {
          font-family: var(--font-cormorant), serif;
          font-size: 3.2rem;
          color: var(--color-gold);
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .emotional-subtitle {
          font-size: 1.1rem;
          color: var(--color-text-secondary);
          font-weight: 300;
        }

        .emotional-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .emotional-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: 1.75rem;
        }

        .emotional-card--full {
          grid-column: 1 / -1;
        }

        .emotional-card-title {
          font-family: var(--font-cormorant), serif;
          font-size: 1.4rem;
          color: var(--color-gold);
          margin-bottom: 1rem;
          font-weight: 500;
        }

        /* --- Checkin --- */
        .emoji-row {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }

        .emoji-btn {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          background: var(--color-dark);
          border: 2px solid var(--color-border);
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: var(--transition);
          position: relative;
        }

        .emoji-btn:hover {
          border-color: var(--color-gold);
          transform: scale(1.08);
        }

        .emoji-btn--selected {
          border-color: var(--color-gold);
          background: rgba(201, 169, 110, 0.12);
          box-shadow: 0 0 12px rgba(201, 169, 110, 0.25);
        }

        .emoji-label {
          display: block;
          font-size: 0.65rem;
          color: var(--color-text-secondary);
          text-align: center;
          margin-top: 0.15rem;
        }

        .emotional-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--color-dark);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          color: var(--color-text);
          font-family: var(--font-inter), sans-serif;
          font-size: 0.95rem;
          margin-bottom: 1rem;
          outline: none;
          transition: var(--transition);
          resize: vertical;
          min-height: 80px;
        }

        .emotional-input:focus {
          border-color: var(--color-gold);
        }

        .emotional-input::placeholder {
          color: var(--color-text-secondary);
          opacity: 0.6;
        }

        /* --- Streak --- */
        .streak-value {
          font-size: 4rem;
          font-weight: 500;
          color: var(--color-gold);
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .streak-label {
          font-size: 1rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.75rem;
        }

        .streak-bonus {
          display: inline-block;
          background: rgba(76, 175, 80, 0.15);
          color: var(--color-success);
          font-size: 0.85rem;
          padding: 0.35rem 0.75rem;
          border-radius: 4px;
          border: 1px solid rgba(76, 175, 80, 0.3);
        }

        .streak-bonus--locked {
          background: rgba(169, 169, 169, 0.1);
          color: var(--color-text-secondary);
          border-color: var(--color-border);
        }

        /* --- Checkin list --- */
        .checkin-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .checkin-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--color-dark);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: 0.75rem 1rem;
          transition: var(--transition);
        }

        .checkin-item:hover {
          border-color: var(--color-gold);
        }

        .checkin-emoji {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .checkin-body {
          flex: 1;
          min-width: 0;
        }

        .checkin-event {
          color: var(--color-text);
          font-size: 0.9rem;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .checkin-time {
          color: var(--color-text-secondary);
          font-size: 0.75rem;
          margin-top: 0.15rem;
        }

        .checkin-empty {
          color: var(--color-text-secondary);
          text-align: center;
          padding: 1.5rem 0;
          font-style: italic;
        }

        /* --- Buttons --- */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-family: var(--font-inter), sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          padding: 0.7rem 2rem;
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: var(--transition);
          border: none;
          letter-spacing: 0.02em;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn--gold {
          background: var(--color-gold);
          color: var(--color-dark);
        }

        .btn--gold:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(201, 169, 110, 0.3);
        }

        .btn--outline {
          background: transparent;
          border: 1px solid var(--color-gold);
          color: var(--color-gold);
        }

        .btn--outline:hover:not(:disabled) {
          background: rgba(201, 169, 110, 0.1);
          transform: translateY(-2px);
        }

        .btn--full {
          width: 100%;
        }

        /* --- Bonus results --- */
        .bonus-result {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--color-dark);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          font-size: 0.9rem;
          line-height: 1.7;
          color: var(--color-text);
          white-space: pre-wrap;
        }

        .bonus-result-label {
          font-size: 0.75rem;
          color: var(--color-gold);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.4rem;
        }

        .error-text {
          color: #E57373;
          font-size: 0.85rem;
          margin-top: 0.5rem;
          padding: 0.5rem 0.75rem;
          background: rgba(229, 115, 115, 0.08);
          border-left: 2px solid #E57373;
          border-radius: 0 4px 4px 0;
        }

        /* --- Loading spinner --- */
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(201, 169, 110, 0.3);
          border-top-color: var(--color-gold);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .emotional-grid {
            grid-template-columns: 1fr;
          }
          .emotional-title {
            font-size: 2.2rem;
          }
          .emoji-btn {
            width: 48px;
            height: 48px;
            font-size: 1.3rem;
          }
          .streak-value {
            font-size: 3rem;
          }
        }
      `}</style>

      <div className="emotional-page">
        {/* Навигация */}
        <a href="/" className="emotional-back-link">
          ← На главную
        </a>

        {/* Заголовок */}
        <div className="emotional-header">
          <h1 className="emotional-title">Эмоциональный профиль</h1>
          <p className="emotional-subtitle">
            Отслеживай настроение, получай инсайты
          </p>
        </div>

        <div className="emotional-grid">
          {/* Быстрый чекин */}
          <div className="emotional-card emotional-card--full">
            <h2 className="emotional-card-title">Быстрый чекин</h2>

            <div className="emoji-row">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`emoji-btn${selectedEmoji === emoji ? ' emoji-btn--selected' : ''}`}
                  onClick={() => setSelectedEmoji(emoji)}
                  title={EMOJI_LABELS[emoji]}
                >
                  {emoji}
                  <span className="emoji-label">{EMOJI_LABELS[emoji]}</span>
                </button>
              ))}
            </div>

            <textarea
              className="emotional-input"
              placeholder="Что случилось?"
              value={eventText}
              onChange={(e) => setEventText(e.target.value)}
              rows={3}
            />

            <button
              type="button"
              className="btn btn--gold"
              onClick={handleCheckin}
              disabled={!selectedEmoji || loading['create']}
            >
              {loading['create'] ? (
                <>
                  <span className="spinner" /> Запись...
                </>
              ) : (
                'Записать'
              )}
            </button>

            {errors['create'] && (
              <div className="error-text">{errors['create']}</div>
            )}
          </div>

          {/* Streak */}
          <div className="emotional-card">
            <h2 className="emotional-card-title">Серия чекинов</h2>

            {loading['streak'] ? (
              <span className="spinner" />
            ) : streak ? (
              <>
                <div className="streak-value">{streak.total_days}</div>
                <div className="streak-label">
                  {streak.total_days === 1
                    ? 'день подряд'
                    : streak.total_days >= 2 && streak.total_days <= 4
                    ? 'дня подряд'
                    : 'дней подряд'}
                </div>
                <div
                  className={`streak-bonus${streak.bonus_unlocked ? '' : ' streak-bonus--locked'}`}
                >
                  {streak.bonus_unlocked
                    ? '🔓 Бонус разблокирован'
                    : '🔒 Бонус с 14+ дней'}
                </div>
              </>
            ) : errors['streak'] ? (
              <div className="error-text">{errors['streak']}</div>
            ) : null}
          </div>

          {/* Последние чекины */}
          <div className="emotional-card">
            <h2 className="emotional-card-title">Последние чекины</h2>

            {loading['checkins'] ? (
              <span className="spinner" />
            ) : checkins.length > 0 ? (
              <ul className="checkin-list">
                {checkins.map((c) => (
                  <li key={c.id} className="checkin-item">
                    <span className="checkin-emoji">{c.emoji}</span>
                    <div className="checkin-body">
                      <div className="checkin-event">
                        {c.event || 'Без описания'}
                      </div>
                      <div className="checkin-time">{formatTime(c.time)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : !errors['checkins'] ? (
              <div className="checkin-empty">
                Пока нет записей. Сделайте первый чекин!
              </div>
            ) : null}

            {errors['checkins'] && (
              <div className="error-text">{errors['checkins']}</div>
            )}
          </div>

          {/* Биоритмолог */}
          <div className="emotional-card emotional-card--full">
            <h2 className="emotional-card-title">Биоритмолог</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Сгенерируйте персональный отчёт о вашем эмоциональном ритме
            </p>

            <button
              type="button"
              className="btn btn--outline"
              onClick={handleBiorhythm}
              disabled={loading['biorhythm']}
            >
              {loading['biorhythm'] ? (
                <>
                  <span className="spinner" /> Генерация...
                </>
              ) : (
                'Сгенерировать отчёт'
              )}
            </button>

            {biorhythm && (
              <div className="bonus-result">
                <div className="bonus-result-label">Отчёт биоритмолога</div>
                {biorhythm}
              </div>
            )}
            {errors['biorhythm'] && (
              <div className="error-text">{errors['biorhythm']}</div>
            )}
          </div>

          {/* Эмоциональный аватар */}
          <div className="emotional-card">
            <h2 className="emotional-card-title">Эмоциональный аватар</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Живое существо, отражающее ваше состояние
            </p>

            <button
              type="button"
              className="btn btn--outline btn--full"
              onClick={handleAvatar}
              disabled={loading['avatar']}
            >
              {loading['avatar'] ? (
                <>
                  <span className="spinner" /> Генерация...
                </>
              ) : (
                'Сгенерировать аватар'
              )}
            </button>

            {avatar && (
              <div className="bonus-result">
                <div className="bonus-result-label">Описание аватара</div>
                {avatar.avatar}
                {avatar.dalle_prompt && (
                  <>
                    <div className="bonus-result-label" style={{ marginTop: '0.75rem' }}>
                      DALL·E промпт
                    </div>
                    <code style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                      {avatar.dalle_prompt}
                    </code>
                  </>
                )}
              </div>
            )}
            {errors['avatar'] && (
              <div className="error-text">{errors['avatar']}</div>
            )}
          </div>

          {/* Ресурсные состояния */}
          <div className="emotional-card">
            <h2 className="emotional-card-title">Ресурсные состояния</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Персональный плейлист ваших ресурсных состояний
            </p>

            <button
              type="button"
              className="btn btn--outline btn--full"
              onClick={handleResources}
              disabled={loading['resources']}
            >
              {loading['resources'] ? (
                <>
                  <span className="spinner" /> Генерация...
                </>
              ) : (
                'Сгенерировать'
              )}
            </button>

            {resources && (
              <div className="bonus-result">
                <div className="bonus-result-label">Ресурсные состояния</div>
                {resources}
              </div>
            )}
            {errors['resources'] && (
              <div className="error-text">{errors['resources']}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
