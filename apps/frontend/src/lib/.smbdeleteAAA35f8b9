'use client';

import { useEffect, useState } from 'react';
import { getAuthToken } from './api';

const VK_OAUTH_URL =
  'https://oauth.vk.com/authorize' +
  '?client_id=54657524' +
  '&redirect_uri=https://vnutrenniy-kompas.ru/auth/callback' +
  '&response_type=code' +
  '&v=5.199';

interface AuthGateProps {
  children: React.ReactNode;
}

/**
 * Компонент-защитник: рендерит children только если пользователь авторизован.
 * Иначе показывает экран с предложением войти через VK ID.
 */
export function AuthGate({ children }: AuthGateProps) {
  const [token, setToken] = useState<string | null>();

  useEffect(() => {
    setToken(getAuthToken());
  }, []);

  // Ждём первого чтения токена на клиенте
  if (token === undefined) return null;

  if (token) return <>{children}</>;

  return (
    <>
      <style>{`
        .auth-gate-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-dark, #0a0a0f);
          color: var(--color-text, #e0e0e0);
          z-index: 9999;
          padding: 1.5rem;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .auth-gate-card {
          max-width: 480px;
          width: 100%;
          background: var(--color-card, #1a1a24);
          border: 1px solid rgba(255, 215, 0, 0.12);
          border-radius: 1rem;
          padding: 2.5rem 2rem;
          text-align: center;
          box-shadow: 0 0 40px rgba(0, 0, 0, 0.6);
        }

        .auth-gate-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 1rem;
          color: var(--color-gold, #d4a745);
          letter-spacing: 0.02em;
        }

        .auth-gate-text {
          font-size: 1rem;
          line-height: 1.65;
          margin: 0 0 2rem;
          color: var(--color-text, #e0e0e0);
          opacity: 0.85;
        }

        .auth-gate-btn {
          display: inline-block;
          background: var(--color-gold, #d4a745);
          color: #0a0a0f;
          font-weight: 600;
          font-size: 1.05rem;
          padding: 0.85rem 2rem;
          border: none;
          border-radius: 0.6rem;
          cursor: pointer;
          text-decoration: none;
          transition: filter 0.2s;
          margin-bottom: 1.5rem;
        }

        .auth-gate-btn:hover {
          filter: brightness(1.1);
        }

        .auth-gate-home {
          display: block;
          color: var(--color-text, #e0e0e0);
          opacity: 0.55;
          font-size: 0.9rem;
          transition: opacity 0.2s;
        }

        .auth-gate-home:hover {
          opacity: 0.8;
        }
      `}</style>

      <div className="auth-gate-overlay">
        <div className="auth-gate-card">
          <h1 className="auth-gate-title">Доступ только для участников клуба</h1>
          <p className="auth-gate-text">
            Это приложение доступно участникам закрытого клуба Архипелаг.
            Войдите через VK ID, чтобы получить доступ.
          </p>
          <a href={VK_OAUTH_URL} className="auth-gate-btn">
            Войти через VK ID
          </a>
          <a href="/" className="auth-gate-home">
            На главную
          </a>
        </div>
      </div>
    </>
  );
}
