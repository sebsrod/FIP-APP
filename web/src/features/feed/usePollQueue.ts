import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/api/client';
import type { Poll } from '@/api/types';

const BATCH = 10;
const TOPUP_THRESHOLD = 2; // fetch more when this few remain

export interface PollQueue {
  current: Poll | null;
  next: Poll | null; // for image prefetch
  status: 'loading' | 'ready' | 'error';
  error: string | null;
  isEmpty: boolean;
  advance: () => void;
  reload: () => void;
}

/**
 * Manages the local poll queue: an initial batch, transparent top-ups as the
 * user nears the end, de-duplication, and an "all caught up" terminal state.
 * The server already excludes polls the user has voted on.
 */
export function usePollQueue(): PollQueue {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [index, setIndex] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const exhausted = useRef(false);
  const loadingMore = useRef(false);
  const ids = useRef<Set<string>>(new Set());

  const fetchBatch = useCallback(async (initial: boolean) => {
    if (loadingMore.current) return;
    loadingMore.current = true;
    try {
      const { polls: batch } = await api.polls.queue(BATCH);
      const fresh = batch.filter((p) => !ids.current.has(p.id));
      fresh.forEach((p) => ids.current.add(p.id));
      if (fresh.length === 0) exhausted.current = true;
      setPolls((prev) => (initial ? fresh : [...prev, ...fresh]));
      if (initial) setStatus('ready');
    } catch (e) {
      if (initial) {
        setStatus('error');
        setError(e instanceof ApiError ? e.message : 'Could not load the feed');
      }
    } finally {
      loadingMore.current = false;
    }
  }, []);

  useEffect(() => {
    fetchBatch(true);
  }, [fetchBatch]);

  // Top up the queue before it runs dry.
  useEffect(() => {
    if (status !== 'ready') return;
    const remaining = polls.length - index;
    if (remaining <= TOPUP_THRESHOLD && !exhausted.current && !loadingMore.current) {
      fetchBatch(false);
    }
  }, [index, polls.length, status, fetchBatch]);

  const advance = useCallback(() => setIndex((i) => i + 1), []);

  const reload = useCallback(() => {
    ids.current.clear();
    exhausted.current = false;
    loadingMore.current = false;
    setPolls([]);
    setIndex(0);
    setError(null);
    setStatus('loading');
    fetchBatch(true);
  }, [fetchBatch]);

  const current = polls[index] ?? null;
  const next = polls[index + 1] ?? null;
  const isEmpty = status === 'ready' && current === null && exhausted.current;

  return { current, next, status, error, isEmpty, advance, reload };
}
