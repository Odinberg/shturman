'use client';

import { useEffect, useState } from 'react';
import { authAPI, setAuthToken, getAuthToken } from './api';

interface VkAuthState {
  ready: boolean;
  userId: number | null;
  username: string | null;
  error: string | null;
}

/**
 * Хук для аутентификации через VK Mini App.
 *
 * Порядок:
 * 1. Сразу восстанавливает токен из localStorage (hydration).
 * 2. Если есть VK-параметры в URL — обменивает их на JWT через бэкенд.
 * 3. ready = true означает: токен либо получен, либо VK-параметров нет.
 */
export function useVkAuth(): VkAuthState {
  const [state, setState] = useState<VkAuthState>(() => {
    // ⚡ Hydration: сразу читаем токен из localStorage при первом рендере
    const existingToken = getAuthToken();
    return {
      ready: !!existingToken,  // если токен уже есть — готовы сразу
      userId: null,
      username: null,
      error: null,
    };
  });

  useEffect(() => {
    let cancelled = false;

    async function auth() {
      try {
        // Парсим VK параметры из URL
        const params = new URLSearchParams(window.location.search);
        const vkUserId = params.get('vk_user_id');

        if (!vkUserId) {
          // Не VK Mini App — если токен уже был из localStorage, ready уже true.
          // Если нет — всё равно ready, но без авторизации.
          if (!cancelled) setState(s => ({ ...s, ready: true }));
          return;
        }

        // Собираем все VK параметры
        const vkParams: Record<string, string> = {};
        params.forEach((value, key) => {
          vkParams[key] = value;
        });

        // Отправляем на бэкенд для верификации
        const result = await authAPI.vkLogin(vkParams);
        setAuthToken(result.access_token);

        if (!cancelled) {
          setState({
            ready: true,
            userId: result.user_id,
            username: result.username,
            error: null,
          });
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Ошибка авторизации';
        if (!cancelled) {
          // Даже при ошибке — ready, чтобы не блокировать UI навечно
          setState({ ready: true, userId: null, username: null, error: message });
        }
      }
    }

    auth();
    return () => { cancelled = true; };
  }, []);

  return state;
}
