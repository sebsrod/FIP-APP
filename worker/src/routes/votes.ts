/** POST /api/polls/:id/vote — record a vote, atomic + idempotent per user. */
import { error, ok, readJson } from '../lib/json';
import { percentages } from '../lib/percent';
import { newId } from '../db/ids';
import type { Env, PollRow, Side, UserRow } from '../types';

export async function handleVote(req: Request, env: Env, user: UserRow, pollId: string): Promise<Response> {
  const body = await readJson<{ side?: unknown }>(req);
  if (!body) return error(400, 'Invalid request body');
  const side = body.side;
  if (side !== 'A' && side !== 'B') return error(400, "side must be 'A' or 'B'", 'invalid_side');

  const poll = await env.DB.prepare(`SELECT * FROM polls WHERE id = ?`).bind(pollId).first<PollRow>();
  if (!poll) return error(404, 'Poll not found', 'poll_not_found');
  if (poll.expires_at !== null && poll.expires_at <= Date.now()) {
    return error(410, 'This poll has ended', 'poll_expired');
  }

  // Insert the vote; UNIQUE(poll_id, user_id) makes re-votes a no-op (changes = 0).
  const insert = await env.DB.prepare(
    `INSERT OR IGNORE INTO votes (id, poll_id, user_id, side, created_at) VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(newId('vote'), pollId, user.id, side as Side, Date.now())
    .run();

  const inserted = (insert.meta?.changes ?? 0) > 0;

  // Only the first vote for this (poll,user) increments — never double-count.
  // Closed polls accept no new tallies but still return current totals.
  let a = poll.option_a_votes;
  let b = poll.option_b_votes;
  if (inserted && poll.status === 'active') {
    const col = side === 'A' ? 'option_a_votes' : 'option_b_votes';
    const updated = await env.DB.prepare(
      `UPDATE polls SET ${col} = ${col} + 1 WHERE id = ? RETURNING option_a_votes, option_b_votes`,
    )
      .bind(pollId)
      .first<{ option_a_votes: number; option_b_votes: number }>();
    if (updated) {
      a = updated.option_a_votes;
      b = updated.option_b_votes;
    }
  }

  const { a_pct, b_pct } = percentages(a, b);
  return ok({ pollId, a_votes: a, b_votes: b, a_pct, b_pct });
}
