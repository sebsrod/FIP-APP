/** POST /api/clicks — log an affiliate click against the session user. */
import { error, ok, readJson } from '../lib/json';
import { newId } from '../db/ids';
import type { Env, UserRow } from '../types';

const SOURCE_TABLES: Record<string, string> = {
  poll_tag: 'tags',
  look_item: 'look_items',
};

export async function handleClick(req: Request, env: Env, user: UserRow): Promise<Response> {
  const body = await readJson<{ source_type?: unknown; source_id?: unknown }>(req);
  if (!body) return error(400, 'Invalid request body');

  const sourceType = body.source_type;
  const sourceId = body.source_id;
  if (typeof sourceType !== 'string' || !(sourceType in SOURCE_TABLES)) {
    return error(400, "source_type must be 'poll_tag' or 'look_item'", 'invalid_source_type');
  }
  if (typeof sourceId !== 'string' || sourceId.length === 0) {
    return error(400, 'source_id is required', 'invalid_source_id');
  }

  // Verify the referenced row exists so analytics stays clean.
  const table = SOURCE_TABLES[sourceType];
  const exists = await env.DB.prepare(`SELECT id FROM ${table} WHERE id = ?`).bind(sourceId).first();
  if (!exists) return error(404, 'Source not found', 'source_not_found');

  await env.DB.prepare(
    `INSERT INTO affiliate_clicks (id, source_type, source_id, user_id, created_at) VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(newId('click'), sourceType, sourceId, user.id, Date.now())
    .run();

  return ok({ ok: true });
}
