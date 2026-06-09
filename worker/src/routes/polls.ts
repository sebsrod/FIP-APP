/** /api/polls — queue (guest-allowed) and create (real account only). */
import { error, json, ok, readJson } from '../lib/json';
import { clampPct, sanitizeUrl, toCents } from '../lib/validate';
import { isAffiliateVerified } from '../lib/affiliate-brands';
import { newId } from '../db/ids';
import type { Env, PollRow, PollWithTags, Side, TagRow, UserRow } from '../types';

export const POLL_TTL_MS = 60 * 60 * 1000; // 60 minutes

/** Lazily delete expired polls (and their tags/votes). Cheap GC on read paths. */
export async function gcExpiredPolls(env: Env): Promise<void> {
  const now = Date.now();
  const sub = `SELECT id FROM polls WHERE expires_at IS NOT NULL AND expires_at <= ?`;
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM tags WHERE poll_id IN (${sub})`).bind(now),
    env.DB.prepare(`DELETE FROM votes WHERE poll_id IN (${sub})`).bind(now),
    env.DB.prepare(`DELETE FROM polls WHERE expires_at IS NOT NULL AND expires_at <= ?`).bind(now),
  ]);
}

export async function handlePollQueue(req: Request, env: Env, user: UserRow): Promise<Response> {
  await gcExpiredPolls(env);

  const url = new URL(req.url);
  const rawLimit = Number(url.searchParams.get('limit') ?? '10');
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(50, Math.trunc(rawLimit))) : 10;
  const now = Date.now();

  const pollResult = await env.DB.prepare(
    `SELECT * FROM polls
     WHERE status = 'active'
       AND (expires_at IS NULL OR expires_at > ?)
       AND id NOT IN (SELECT poll_id FROM votes WHERE user_id = ?)
     ORDER BY RANDOM()
     LIMIT ?`,
  )
    .bind(now, user.id, limit)
    .all<PollRow>();

  const polls = pollResult.results ?? [];
  if (polls.length === 0) return ok({ polls: [] });

  const ids = polls.map((p) => p.id);
  const placeholders = ids.map(() => '?').join(',');
  const tagResult = await env.DB.prepare(`SELECT * FROM tags WHERE poll_id IN (${placeholders})`)
    .bind(...ids)
    .all<TagRow>();

  const tagsByPoll = new Map<string, TagRow[]>();
  for (const tag of tagResult.results ?? []) {
    const list = tagsByPoll.get(tag.poll_id) ?? [];
    list.push(tag);
    tagsByPoll.set(tag.poll_id, list);
  }

  const withTags: PollWithTags[] = polls.map((p) => ({ ...p, tags: tagsByPoll.get(p.id) ?? [] }));
  return ok({ polls: withTags });
}

interface TagInput {
  side?: unknown;
  x_pct?: unknown;
  y_pct?: unknown;
  brand?: unknown;
  item_name?: unknown;
  price_cents?: unknown;
  currency?: unknown;
  affiliate_url?: unknown;
}

function str(input: unknown, max: number): string | null {
  if (typeof input !== 'string') return null;
  const v = input.trim();
  if (v.length === 0 || v.length > max) return null;
  return v;
}

/** POST /api/polls — create an A/B poll (owner = session user), expires in 60 min. */
export async function handleCreatePoll(req: Request, env: Env, user: UserRow): Promise<Response> {
  const body = await readJson<{
    caption?: unknown;
    option_a_image_url?: unknown;
    option_b_image_url?: unknown;
    tags?: unknown;
  }>(req);
  if (!body) return error(400, 'Invalid request body');

  const imageA = sanitizeUrl(body.option_a_image_url);
  const imageB = sanitizeUrl(body.option_b_image_url);
  if (!imageA || !imageB) return error(400, 'Both option images are required', 'missing_images');

  let caption: string | null = null;
  if (typeof body.caption === 'string' && body.caption.trim()) caption = body.caption.trim().slice(0, 280);

  const rawTags = Array.isArray(body.tags) ? (body.tags as TagInput[]) : [];
  if (rawTags.length > 40) return error(400, 'Too many tags', 'too_many_tags');

  const pollId = newId('poll');
  const now = Date.now();
  const tags: TagRow[] = [];
  for (const raw of rawTags) {
    const side: Side = raw.side === 'B' ? 'B' : 'A';
    const brand = str(raw.brand, 60);
    const itemName = str(raw.item_name, 80);
    const affiliateUrl = sanitizeUrl(raw.affiliate_url);
    if (!brand || !itemName || !affiliateUrl) {
      return error(400, 'Each tag needs brand, item_name and a valid affiliate_url', 'invalid_tag');
    }
    tags.push({
      id: newId('tag'),
      poll_id: pollId,
      side,
      x_pct: clampPct(raw.x_pct),
      y_pct: clampPct(raw.y_pct),
      brand,
      item_name: itemName,
      price_cents: toCents(raw.price_cents),
      currency: str(raw.currency, 3)?.toUpperCase() ?? 'USD',
      affiliate_url: affiliateUrl,
      verified: isAffiliateVerified(affiliateUrl) ? 1 : 0,
    });
  }

  const expiresAt = now + POLL_TTL_MS;
  const statements = [
    env.DB.prepare(
      `INSERT INTO polls (id, creator_id, option_a_image_url, option_b_image_url, option_a_votes, option_b_votes, status, created_at, expires_at, caption)
       VALUES (?, ?, ?, ?, 0, 0, 'active', ?, ?, ?)`,
    ).bind(pollId, user.id, imageA, imageB, now, expiresAt, caption),
    ...tags.map((t) =>
      env.DB.prepare(
        `INSERT INTO tags (id, poll_id, side, x_pct, y_pct, brand, item_name, price_cents, currency, affiliate_url, verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(t.id, t.poll_id, t.side, t.x_pct, t.y_pct, t.brand, t.item_name, t.price_cents, t.currency, t.affiliate_url, t.verified),
    ),
  ];
  await env.DB.batch(statements);

  const poll: PollWithTags = {
    id: pollId,
    creator_id: user.id,
    option_a_image_url: imageA,
    option_b_image_url: imageB,
    option_a_votes: 0,
    option_b_votes: 0,
    status: 'active',
    created_at: now,
    expires_at: expiresAt,
    caption,
    tags,
  };
  return json({ poll }, { status: 201 });
}
