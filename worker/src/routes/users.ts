/** GET /api/users/:username — public profile + published looks with shoppable items. */
import { error, ok } from '../lib/json';
import { toPublicUser, type Env, type LookItemRow, type LookRow, type LookWithItems, type UserRow } from '../types';

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
