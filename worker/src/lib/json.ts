/** Small helpers for consistent JSON responses across the API. */

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  // API responses are per-user; never let a shared cache hold them.
  if (!headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'no-store');
  }
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function ok(data: unknown = { ok: true }, init: ResponseInit = {}): Response {
  return json(data, { status: 200, ...init });
}

export interface ApiError {
  error: string;
  code?: string;
}

export function error(status: number, message: string, code?: string): Response {
  const body: ApiError = { error: message };
  if (code) body.code = code;
  return json(body, { status });
}

/** Parse a JSON body defensively; returns null on any malformed input. */
export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    const text = await req.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
