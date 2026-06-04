/** Shared input validation rules for auth and writes. */

export const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
export const MIN_PASSWORD_LEN = 8;

export function validateUsername(input: unknown): { ok: true; value: string } | { ok: false; message: string } {
  if (typeof input !== 'string') return { ok: false, message: 'Username is required' };
  const value = input.trim();
  if (!USERNAME_RE.test(value)) {
    return { ok: false, message: 'Username must be 3–20 letters, numbers, or underscores' };
  }
  return { ok: true, value };
}

export function validatePassword(input: unknown): { ok: true; value: string } | { ok: false; message: string } {
  if (typeof input !== 'string') return { ok: false, message: 'Password is required' };
  if (input.length < MIN_PASSWORD_LEN) {
    return { ok: false, message: `Password must be at least ${MIN_PASSWORD_LEN} characters` };
  }
  return { ok: true, value: input };
}

export function validateDisplayName(input: unknown, fallback: string): string {
  if (typeof input !== 'string') return fallback;
  const value = input.trim();
  if (value.length === 0 || value.length > 40) return fallback;
  return value;
}

/** Coerce/clamp a 0–100 percentage coordinate. */
export function clampPct(input: unknown): number {
  const n = typeof input === 'number' ? input : Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/** Coerce an integer cents value (>= 0). */
export function toCents(input: unknown): number {
  const n = typeof input === 'number' ? input : Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

/** Best-effort URL sanitisation: only allow http(s) and our own /api/assets paths. */
export function sanitizeUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (value.length === 0 || value.length > 2048) return null;
  if (value.startsWith('/api/assets/')) return value;
  try {
    const u = new URL(value);
    if (u.protocol === 'http:' || u.protocol === 'https:') return value;
    return null;
  } catch {
    return null;
  }
}
