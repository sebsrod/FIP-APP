/**
 * POST /api/uploads — store an image in R2 and return its public URL.
 *
 * Accepts EITHER multipart/form-data (field `file`) OR JSON `{ url }` to ingest
 * a remote image. The returned URL is served back through the Worker at
 * /api/assets/<key> (same-origin, no public-bucket config required). For MVP,
 * if remote ingestion fails we fall back to returning the original URL.
 */
import { error, ok, readJson } from '../lib/json';
import { sanitizeUrl } from '../lib/validate';
import { newId } from '../db/ids';
import type { Env, UserRow } from '../types';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

function keyFor(userId: string, contentType: string): string {
  const ext = EXT_BY_TYPE[contentType] ?? 'bin';
  return `uploads/${userId}/${newId()}.${ext}`;
}

async function store(env: Env, userId: string, bytes: ArrayBuffer, contentType: string): Promise<string> {
  const key = keyFor(userId, contentType);
  await env.BUCKET.put(key, bytes, { httpMetadata: { contentType } });
  return `/api/assets/${key}`;
}

export async function handleUpload(req: Request, env: Env, user: UserRow): Promise<Response> {
  const contentType = req.headers.get('Content-Type') ?? '';

  // 1) Multipart file upload.
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    // workers-types declares get() as `string | null`, but at runtime a file
    // field yields a File (Blob subclass); cast through unknown to use it.
    const file = form.get('file') as unknown as File | null;
    if (!file || typeof file === 'string') return error(400, 'Expected a `file` field', 'no_file');
    const type = file.type || 'application/octet-stream';
    if (!type.startsWith('image/')) return error(400, 'Only image uploads are allowed', 'not_image');
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) return error(413, 'Image too large (max 8MB)', 'too_large');
    const url = await store(env, user.id, bytes, type);
    return ok({ url });
  }

  // 2) Remote URL ingestion.
  const body = await readJson<{ url?: unknown }>(req);
  const remote = sanitizeUrl(body?.url);
  if (!remote) return error(400, 'Provide a `file` upload or a valid `url`', 'no_source');

  // If it's already one of our asset URLs, just echo it.
  if (remote.startsWith('/api/assets/')) return ok({ url: remote });

  try {
    const res = await fetch(remote);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const type = res.headers.get('Content-Type') ?? 'image/jpeg';
    if (!type.startsWith('image/')) throw new Error('not an image');
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) return error(413, 'Image too large (max 8MB)', 'too_large');
    const url = await store(env, user.id, bytes, type);
    return ok({ url });
  } catch {
    // MVP fallback: reference the remote URL directly.
    return ok({ url: remote });
  }
}
