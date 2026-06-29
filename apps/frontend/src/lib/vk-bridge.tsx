'use client';

import { useEffect, useState } from 'react';
import bridge from '@vkontakte/vk-bridge';

interface VkBridgeState {
  ready: boolean;
  isVkApp: boolean;
  vkUserId: string | null;
}

/**
 * Компонент для инициализации VK Bridge в VK Mini App.
 * Встраивается в RootLayout.
 */
export function VkBridgeProvider({ children }: { children: React.ReactNode }) {
  const [, setState] = useState<VkBridgeState>({
    ready: false,
    isVkApp: false,
    vkUserId: null,
  });

  useEffect(() => {
    async function init() {
      try {
        // Пытаемся инициализировать VK Bridge
        const initResult = await bridge.send('VKWebAppInit', {});
        const vkParams = new URLSearchParams(window.location.search);
        const vkUserId = vkParams.get('vk_user_id');

        setState({
          ready: true,
          isVkApp: initResult.result,
          vkUserId,
        });
      } catch (e) {
        // Не внутри VK Mini App — ничего не делаем
        setState({ ready: true, isVkApp: false, vkUserId: null });
      }
    }

    init();
  }, []);

  return <>{children}</>;
}
