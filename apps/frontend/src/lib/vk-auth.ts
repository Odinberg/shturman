'use client';

import { useEffect, useState } from 'react';
import { authAPI, setAuthToken } from './api';

interface VkAuthState {
  ready: boolean;
  userId: number | null;
  username: string | null;
  error: string | null;
}

/**
 * Хук для аутентификации через VK Mini App.
 * Автоматически извлекает VK-параметры из URL,
 * проверяет подпись через бэкенд и сохраняет JWT токен.
 */
export function useVkAuth(): VkAuthState {
  const [state, setState] = useState<VkAuthState>({
    ready: false,
    userId: null,
    username: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function auth() {
      try {
        // Парсим URL параметры
        const params = new URLSearchParams(window.location.search);
        const vkUserId = params.get('vk_user_id');

        if (!vkUserId) {
          // Не VK Mini App — считаем готовым без авторизации
          if (!cancelled) setState({ ready: true, userId: null, username: null, error: null });
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
          setState({ ready: true, userId: null, username: null, error: message });
        }
      }
    }

    auth();
    return () => { cancelled = true; };
  }, []);

  return state;
}
