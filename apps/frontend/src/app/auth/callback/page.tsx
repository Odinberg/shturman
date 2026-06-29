'use client';

import { useEffect, useState } from 'react';
import { setAuthToken } from '../../../lib/api';

export default function VkCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      setError('Код авторизации не найден в URL');
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

    fetch(`${apiUrl}/auth/vk-oauth?code=${encodeURIComponent(code)}`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Ошибка ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!data.access_token) {
          throw new Error('Токен не получен от сервера');
        }
        setAuthToken(data.access_token);
        window.location.href = '/';
      })
      .catch((err) => {
        setError(err.message || 'Неизвестная ошибка авторизации');
      });
  }, []);

  return (
    <>
      <div className="callback-container">
        {error ? (
          <div className="callback-error">
            <div className="callback-error-icon">⚠️</div>
            <p className="callback-error-text">{error}</p>
            <a href="/" className="callback-home-link">Вернуться на главную</a>
          </div>
        ) : (
          <div className="callback-loading">
            <div className="callback-spinner" />
            <p className="callback-text">Авторизация через VK...</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .callback-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: var(--color-dark);
        }

        /* ─── Загрузка ─── */

        .callback-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .callback-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(201, 169, 110, 0.2);
          border-top-color: var(--color-gold);
          border-radius: 50%;
          animation: callback-spin 0.8s linear infinite;
        }

        @keyframes callback-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .callback-text {
          color: var(--color-gold);
          font-family: var(--font-cormorant), serif;
          font-size: 1.2rem;
          letter-spacing: 0.04em;
        }

        /* ─── Ошибка ─── */

        .callback-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          text-align: center;
          max-width: 360px;
        }

        .callback-error-icon {
          font-size: 3rem;
        }

        .callback-error-text {
          color: var(--color-text);
          font-size: 1rem;
          line-height: 1.6;
        }

        .callback-home-link {
          color: var(--color-gold);
          text-decoration: none;
          font-size: 0.95rem;
          border: 1px solid var(--color-gold);
          border-radius: var(--border-radius, 8px);
          padding: 0.6rem 1.5rem;
          transition: all 0.3s ease;
        }

        .callback-home-link:hover {
          background: var(--color-gold);
          color: var(--color-dark);
        }
      `}</style>
    </>
  );
}
