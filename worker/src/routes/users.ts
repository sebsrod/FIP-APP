/** /api/users — search (?q=) and profile (/:username), both guest-viewable. */
import { error, ok } from '../lib/json';
import { percentages } from '../lib/percent';
import { gcExpiredPolls } from './polls';
import {
  toPublicUser,
  type Env,
  type LookItemRow,
  type LookRow,
  type LookWithItems,
  type PollRow,
  type TagRow,
  type UserRow,
} from '../types';

/** GET /api/users?q=<query> — search real users by username or display name. */
export async function handleSearchUsers(req: Request, env: Env, currentUser: UserRow): Promise<Response> {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  if (q.length === 0) return ok({ users: [] });

  const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`);
  const pattern = `%${escaped}%`;

  const result = await env.DB.prepare(
    `SELECT * FROM users
     WHERE is_guest = 0
       AND id != ?1
       AND (username LIKE ?2 ESCAPE '\\' OR display_name LIKE ?2 ESCAPE '\\')
     ORDER BY followers_count DESC, username COLLATE NOCASE ASC
     LIMIT 20`,
  )
    .bind(currentUser.id, pattern)
    .all<UserRow>();

  return ok({ users: (result.results ?? []).map(toPublicUser) });
}

export async function handleGetUser(_req: Request, env: Env, viewer: UserRow, username: string): Promise<Response> {
  const user = await env.DB.prepare(`SELECT * FROM users WHERE username = ? COLLATE NOCASE`)
    .bind(username)
    .first<UserRow>();
  if (!user || user.is_guest === 1) return error(404, 'User not found', 'user_not_found');

  await gcExpiredPolls(env);

  // Permanent profile photos (looks) + their shoppable items.
  const looksResult = await env.DB.prepare(`SELECT * FROM looks WHERE user_id = ? ORDER BY published_at DESC`)
    .bind(user.id)
    .all<LookRow>();
  const looks = looksResult.results ?? [];

  let withItems: LookWithItems[] = [];
  if (looks.length > 0) {
    const ids = looks.map((l) => l.id);
    const ph = ids.map(() => '?').join(',');
    const itemResult = await env.DB.prepare(`SELECT * FROM look_items WHERE look_id IN (${ph})`)
      .bind(...ids)
      .all<LookItemRow>();
    const byLook = new Map<string, LookItemRow[]>();
    for (const it of itemResult.results ?? []) {
      const list = byLook.get(it.look_id) ?? [];
      list.push(it);
      byLook.set(it.look_id, list);
    }
    withItems = looks.map((l) => ({ ...l, items: byLook.get(l.id) ?? [] }));
  }

  // Active (non-expired) polls this user has published — for the stories-style ring.
  const now = Date.now();
  const pollsResult = await env.DB.prepare(
    `SELECT * FROM polls
     WHERE creator_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > ?)
     ORDER BY created_at DESC`,
  )
    .bind(user.id, now)
    .all<PollRow>();
  const polls = pollsResult.results ?? [];

  let activePolls: Array<
    PollRow & { tags: TagRow[]; a_pct: number; b_pct: number; voted_side: 'A' | 'B' | null }
  > = [];
  if (polls.length > 0) {
    const ids = polls.map((p) => p.id);
    const ph = ids.map(() => '?').join(',');
    const [tagRes, voteRes] = await Promise.all([
      env.DB.prepare(`SELECT * FROM tags WHERE poll_id IN (${ph})`).bind(...ids).all<TagRow>(),
      env.DB.prepare(`SELECT poll_id, side FROM votes WHERE user_id = ? AND poll_id IN (${ph})`)
        .bind(viewer.id, ...ids)
        .all<{ poll_id: string; side: 'A' | 'B' }>(),
    ]);
    const tagsBy = new Map<string, TagRow[]>();
    for (const t of tagRes.results ?? []) {
      const list = tagsBy.get(t.poll_id) ?? [];
      list.push(t);
      tagsBy.set(t.poll_id, list);
    }
    const votedBy = new Map<string, 'A' | 'B'>();
    for (const v of voteRes.results ?? []) votedBy.set(v.poll_id, v.side);

    activePolls = polls.map((p) => {
      const { a_pct, b_pct } = percentages(p.option_a_votes, p.option_b_votes);
      return { ...p, tags: tagsBy.get(p.id) ?? [], a_pct, b_pct, voted_side: votedBy.get(p.id) ?? null };
    });
  }

  return ok({
    user: toPublicUser(user),
    is_owner: viewer.id === user.id,
    looks: withItems,
    polls: activePolls,
  });
}
