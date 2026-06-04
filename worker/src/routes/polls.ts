/** GET /api/polls/queue — active polls with tags, excluding ones already voted. */
import { ok } from '../lib/json';
import type { Env, PollRow, PollWithTags, TagRow, UserRow } from '../types';

export async function handlePollQueue(req: Request, env: Env, user: UserRow): Promise<Response> {
  const url = new URL(req.url);
  const rawLimit = Number(url.searchParams.get('limit') ?? '10');
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(50, Math.trunc(rawLimit))) : 10;

  const pollResult = await env.DB.prepare(
    `SELECT * FROM polls
     WHERE status = 'active'
       AND id NOT IN (SELECT poll_id FROM votes WHERE user_id = ?)
     ORDER BY RANDOM()
     LIMIT ?`,
  )
    .bind(user.id, limit)
    .all<PollRow>();

  const polls = pollResult.results ?? [];
  if (polls.length === 0) return ok({ polls: [] });

  // Fetch all tags for the returned polls in one query (no N+1).
  const ids = polls.map((p) => p.id);
  const placeholders = ids.map(() => '?').join(',');
  const tagResult = await env.DB.prepare(
    `SELECT * FROM tags WHERE poll_id IN (${placeholders})`,
  )
    .bind(...ids)
    .all<TagRow>();

  const tagsByPoll = new Map<string, TagRow[]>();
  for (const tag of tagResult.results ?? []) {
    const list = tagsByPoll.get(tag.poll_id) ?? [];
    list.push(tag);
    tagsByPoll.set(tag.poll_id, list);
  }

  const withTags: PollWithTags[] = polls.map((p) => ({
    ...p,
    tags: tagsByPoll.get(p.id) ?? [],
  }));

  return ok({ polls: withTags });
}
