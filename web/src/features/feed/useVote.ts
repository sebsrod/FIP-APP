import { useCallback } from 'react';
import { api } from '@/api/client';
import type { Side, VoteResult } from '@/api/types';

/** Thin wrapper around the vote endpoint (atomic + idempotent server-side). */
export function useVote() {
  const submit = useCallback(
    (pollId: string, side: Side): Promise<VoteResult> => api.polls.vote(pollId, side),
    [],
  );
  return { submit };
}
