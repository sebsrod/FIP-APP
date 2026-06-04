/**
 * GET /api/assets/<key> — stream an uploaded image back from R2.
 *
 * Public (no auth): images are not secret and <img> requests should cache.
 * The whole app is gated, but image bytes themselves carry no user data.
 */
import { error } from '../lib/json';
import type { Env } from '../types';

export async function handleGetAsset(_req: Request, env: Env, key: string): Promise<Response> {
  if (!key) return error(404, 'Not found');
  const object = await env.BUCKET.get(key);
  if (!object) return error(404, 'Asset not found');

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(object.body, { headers });
}
