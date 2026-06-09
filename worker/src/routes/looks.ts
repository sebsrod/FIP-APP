/** POST /api/looks — publish a look (owner = session user) with shoppable items. */
import { error, json, readJson } from '../lib/json';
import { clampPct, sanitizeUrl, toCents } from '../lib/validate';
import { isAffiliateVerified } from '../lib/affiliate-brands';
import { newId } from '../db/ids';
import type { Env, LookItemRow, LookWithItems, UserRow } from '../types';

interface ItemInput {
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

export async function handleCreateLook(req: Request, env: Env, user: UserRow): Promise<Response> {
  const body = await readJson<{ image_url?: unknown; caption?: unknown; items?: unknown }>(req);
  if (!body) return error(400, 'Invalid request body');

  const imageUrl = sanitizeUrl(body.image_url);
  if (!imageUrl) return error(400, 'A valid image_url is required', 'invalid_image');

  let caption: string | null = null;
  if (typeof body.caption === 'string' && body.caption.trim().length > 0) {
    caption = body.caption.trim().slice(0, 280);
  }

  const rawItems = Array.isArray(body.items) ? (body.items as ItemInput[]) : [];
  if (rawItems.length > 20) return error(400, 'Too many items (max 20)', 'too_many_items');

  const lookId = newId('look');
  const now = Date.now();
  const items: LookItemRow[] = [];

  for (const raw of rawItems) {
    const brand = str(raw.brand, 60);
    const itemName = str(raw.item_name, 80);
    const affiliateUrl = sanitizeUrl(raw.affiliate_url);
    if (!brand || !itemName || !affiliateUrl) {
      return error(400, 'Each item needs brand, item_name and a valid affiliate_url', 'invalid_item');
    }
    items.push({
      id: newId('litem'),
      look_id: lookId,
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

  const statements = [
    env.DB.prepare(
      `INSERT INTO looks (id, user_id, image_url, caption, published_at) VALUES (?, ?, ?, ?, ?)`,
    ).bind(lookId, user.id, imageUrl, caption, now),
    ...items.map((it) =>
      env.DB.prepare(
        `INSERT INTO look_items (id, look_id, x_pct, y_pct, brand, item_name, price_cents, currency, affiliate_url, verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        it.id,
        it.look_id,
        it.x_pct,
        it.y_pct,
        it.brand,
        it.item_name,
        it.price_cents,
        it.currency,
        it.affiliate_url,
        it.verified,
      ),
    ),
  ];
  await env.DB.batch(statements);

  const look: LookWithItems = {
    id: lookId,
    user_id: user.id,
    image_url: imageUrl,
    caption,
    published_at: now,
    items,
  };
  return json({ look }, { status: 201 });
}
