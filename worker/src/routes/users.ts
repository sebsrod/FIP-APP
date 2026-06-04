/** GET /api/users/:username — public profile + published looks with shoppable items. */
import { error, ok } from '../lib/json';
import { toPublicUser, type Env, type LookItemRow, type LookRow, type LookWithItems, type UserRow } from '../types';

/** GET /api/users?q=<query> — search other users by username or display name. */
export async function handleSearchUsers(req: Request, env: Env, currentUser: UserRow): Promise<Response> {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  if (q.length === 0) return ok({ users: [] });

  // Escape LIKE wildcards so the query is matched literally.
  const escaped = q.replace(/[\\%_]/g, (c) => `\\${c}`);
  const pattern = `%${escaped}%`;

  const result = await env.DB.prepare(
    `SELECT * FROM users
     WHERE id != ?1
       AND (username LIKE ?2 ESCAPE '\\' OR display_name LIKE ?2 ESCAPE '\\')
     ORDER BY followers_count DESC, username COLLATE NOCASE ASC
     LIMIT 20`,
  )
    .bind(currentUser.id, pattern)
    .all<UserRow>();

  return ok({ users: (result.results ?? []).map(toPublicUser) });
}

export async function handleGetUser(_req: Request, env: Env, username: string): Promise<Response> {
  const user = await env.DB.prepare(`SELECT * FROM users WHERE username = ? COLLATE NOCASE`)
    .bind(username)
    .first<UserRow>();
  if (!user) return error(404, 'User not found', 'user_not_found');

  const looksResult = await env.DB.prepare(
    `SELECT * FROM looks WHERE user_id = ? ORDER BY published_at DESC`,
  )
    .bind(user.id)
    .all<LookRow>();
  const looks = looksResult.results ?? [];

  let withItems: LookWithItems[] = [];
  if (looks.length > 0) {
    const ids = looks.map((l) => l.id);
    const placeholders = ids.map(() => '?').join(',');
    const itemResult = await env.DB.prepare(
      `SELECT * FROM look_items WHERE look_id IN (${placeholders})`,
    )
      .bind(...ids)
      .all<LookItemRow>();

    const itemsByLook = new Map<string, LookItemRow[]>();
    for (const item of itemResult.results ?? []) {
      const list = itemsByLook.get(item.look_id) ?? [];
      list.push(item);
      itemsByLook.set(item.look_id, list);
    }
    withItems = looks.map((l) => ({ ...l, items: itemsByLook.get(l.id) ?? [] }));
  }

  return ok({ user: toPublicUser(user), looks: withItems });
}
