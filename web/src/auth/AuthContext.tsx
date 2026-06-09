import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/api/client';
import { setUnauthorizedHandler } from '@/api/unauthorized';
import type { PublicUser } from '@/api/types';

export type AuthStatus = 'loading' | 'ready';

export interface AuthContextValue {
  user: PublicUser | null; // the current actor — may be an anonymous guest
  status: AuthStatus;
  isGuest: boolean; // true when not signed into a real account
  isAuthed: boolean; // true when signed into a real account
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const refresh = useCallback(async () => {
    try {
      const { user: actor } = await api.auth.me();
      setUser(actor);
    } catch {
      setUser(null);
    } finally {
      setStatus('ready');
    }
  }, []);

  // Bootstrap the actor (provisions a guest server-side if needed).
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // A genuine session expiry on a protected route -> re-resolve the actor.
  useEffect(() => {
    setUnauthorizedHandler(() => void refresh());
    return () => setUnauthorizedHandler(null);
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.auth.login({ username, password });
    setUser(res.user);
    setStatus('ready');
  }, []);

  const register = useCallback(async (username: string, password: string, displayName?: string) => {
    const res = await api.auth.register({
      username,
      password,
      display_name: displayName?.trim() ? displayName.trim() : undefined,
    });
    setUser(res.user);
    setStatus('ready');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore */
    }
    // Re-provision a fresh guest so the app keeps working anonymously.
    await refresh();
  }, [refresh]);

  const isGuest = !user || user.is_guest;
  const value = useMemo<AuthContextValue>(
    () => ({ user, status, isGuest, isAuthed: !isGuest, login, register, logout, refresh }),
    [user, status, isGuest, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
