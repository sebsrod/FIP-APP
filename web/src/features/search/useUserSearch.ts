import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/api/client';
import type { PublicUser } from '@/api/types';

export type SearchStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Debounced user search with stale-response guarding. */
export function useUserSearch(query: string) {
  const [results, setResults] = useState<PublicUser[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setResults([]);
      setStatus('idle');
      return;
    }

    setStatus('loading');
    const id = ++seq.current;
    const handle = setTimeout(async () => {
      try {
        const { users } = await api.users.search(q);
        if (id === seq.current) {
          setResults(users);
          setStatus('ready');
        }
      } catch (e) {
        if (id === seq.current) {
          setError(e instanceof ApiError ? e.message : 'Search failed');
          setStatus('error');
        }
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [query]);

  return { results, status, error };
}
