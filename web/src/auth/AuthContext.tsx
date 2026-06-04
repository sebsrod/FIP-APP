import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError } from '@/api/client';
import { setUnauthorizedHandler } from '@/api/unauthorized';
import type { PublicUser } from '@/api/types';

export type AuthStatus = 'loading' | 'authed' | 'anon';

export interface AuthContextValue {
  user: PublicUser | null;
  status: AuthStatus;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Bootstrap auth state from the session cookie on first load.
  useEffect(() => {
    let alive = true;
    api.auth
      .me()
      .then((res) => {
        if (!alive) return;
        setUser(res.user);
        setStatus('authed');
      })
      .catch((err) => {
        if (!alive) return;
        // 401 is the normal "not logged in" case — anything else, also treat as anon.
        if (!(err instanceof ApiError)) console.error(err);
        setUser(null);
        setStatus('anon');
      });
    return () => {
      alive = false;
    };
  }, []);

  // If any protected request 401s, fall back to the auth screen.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus('anon');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.auth.login({ username, password });
    setUser(res.user);
    setStatus('authed');
  }, []);

  const register = useCallback(async (username: string, password: string, displayName?: string) => {
    const res = await api.auth.register({
      username,
      password,
      display_name: displayName?.trim() ? displayName.trim() : undefined,
    });
    setUser(res.user);
    setStatus('authed');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* clear local state regardless */
    }
    setUser(null);
    setStatus('anon');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
