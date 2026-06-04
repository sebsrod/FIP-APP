import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/api/client';
import type { Profile } from '@/api/types';

export function useProfile(username: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!username) return;
    setStatus('loading');
    try {
      const p = await api.users.get(username);
      setProfile(p);
      setStatus('ready');
    } catch (e) {
      setStatus('error');
      setError(e instanceof ApiError ? e.message : 'Could not load profile');
    }
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  return { profile, status, error, reload: load };
}
