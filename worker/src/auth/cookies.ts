/** httpOnly session cookie helpers. */

export const SESSION_COOKIE = 'fip_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, in seconds

/** Read a cookie value from the request's Cookie header. */
export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

/** Only mark cookies Secure over HTTPS so they still work on http://localhost in dev. */
function isSecure(req: Request): boolean {
  try {
    return new URL(req.url).protocol === 'https:';
  } catch {
    return false;
  }
}

export function buildSessionCookie(req: Request, token: string): string {
  const attrs = [
    `${SESSION_COOKIE}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${SESSION_MAX_AGE}`,
  ];
  if (isSecure(req)) attrs.push('Secure');
  return attrs.join('; ');
}

export function buildClearCookie(req: Request): string {
  const attrs = [`${SESSION_COOKIE}=`, 'HttpOnly', 'SameSite=Lax', 'Path=/', 'Max-Age=0'];
  if (isSecure(req)) attrs.push('Secure');
  return attrs.join('; ');
}
