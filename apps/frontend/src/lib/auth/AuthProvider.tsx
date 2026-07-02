'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { getAuthToken, setAuthToken } from '../api';

// ── Types ───────────────────────────────────────────────────────────────────

interface AuthState {
  ready: boolean;
  userId: number | null;
  username: string | null;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    ready: false,
    userId: null,
    username: null,
    error: null,
  });

  // ── Who am I? ──────────────────────────────────────────────────────────

  const fetchMe = useCallback(async (): Promise<boolean> => {
    const token = getAuthToken();
    if (!token) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // Token expired or invalid — try refresh
        const refreshToken = localStorage.getItem('shturman_refresh');
        if (refreshToken && res.status === 401) {
          return await doRefresh(refreshToken);
        }
        return false;
      }

      const user = await res.json();
      setState({ ready: true, userId: user.id, username: user.username, error: null });
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── Refresh ────────────────────────────────────────────────────────────

  const doRefresh = async (refreshToken: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        setAuthToken(null);
        localStorage.removeItem('shturman_refresh');
        setState(s => ({ ...s, ready: true }));  // ready — но без токена
        return false;
      }

      const data = await res.json();
      setAuthToken(data.access_token);
      localStorage.setItem('shturman_refresh', data.refresh_token);

      setState({
        ready: true,
        userId: data.user_id,
        username: data.username,
        error: null,
      });
      return true;
    } catch {
      return false;
    }
  };

  // ── VK Login ───────────────────────────────────────────────────────────

  const doVkLogin = useCallback(async (): Promise<void> => {
    const params = new URLSearchParams(window.location.search);
    const vkUserId = params.get('vk_user_id');

    if (!vkUserId) {
      // Not in VK Mini App — show ready without auth
      setState(s => ({ ...s, ready: true }));
      return;
    }

    try {
      const vkParams: Record<string, string> = {};
      params.forEach((value, key) => {
        vkParams[key] = value;
      });

      const res = await fetch(`${API_BASE}/auth/vk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vkParams),
      });

      if (!res.ok) {
        const err = await res.json();
        setState({
          ready: true,
          userId: null,
          username: null,
          error: err.detail?.message || err.detail || 'VK auth failed',
        });
        return;
      }

      const data = await res.json();
      setAuthToken(data.access_token);
      localStorage.setItem('shturman_refresh', data.refresh_token);

      setState({
        ready: true,
        userId: data.user_id,
        username: data.username,
        error: null,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'VK auth error';
      setState({ ready: true, userId: null, username: null, error: msg });
    }
  }, []);

  // ── Bootstrap ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function bootstrap() {
      // 1. Try existing token (hydrate from localStorage)
      const ok = await fetchMe();
      if (ok) return;

      // 2. Try VK login (if inside VK Mini App)
      await doVkLogin();
    }

    bootstrap();
  }, [fetchMe, doVkLogin]);

  // ── Logout ─────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem('shturman_refresh');
    if (refreshToken) {
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch(() => {});
    }

    setAuthToken(null);
    localStorage.removeItem('shturman_refresh');
    setState({ ready: true, userId: null, username: null, error: null });
  }, []);

  const login = useCallback(async () => {
    await doVkLogin();
  }, [doVkLogin]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
