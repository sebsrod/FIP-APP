/**
 * Anonymous "guest" actors. A visitor who hasn't logged in still gets a stable
 * identity (a users row with is_guest = 1, no usable password) and an httpOnly
 * session cookie — so their votes and clicks count and dedupe per device, while
 * publishing stays gated behind a real account.
 */
import { newId } from '../db/ids';
import { buildSessionCookie } from './cookies';
import { createSession, getUserForToken } from './session';
import { readCookie, SESSION_COOKIE } from './cookies';
import type { Env, UserRow } from '../types';

export async function createGuestUser(env: Env): Promise<UserRow> {
  const id = newId('guest');
  const now = Date.now();
  const username = `guest_${crypto.randomUUID()}`;
  await env.DB.prepare(
    `INSERT INTO users (id, username, display_name, password_hash, password_salt, bio, avatar_url, followers_count, created_at, is_guest)
     VALUES (?, ?, 'Guest', '', '', NULL, NULL, 0, ?, 1)`,
  )
    .bind(id, username, now)
    .run();
  return {
    id,
    username,
    display_name: 'Guest',
    password_hash: '',
    password_salt: '',
    bio: null,
    avatar_url: null,
    followers_count: 0,
    created_at: now,
    is_guest: 1,
  };
}

/**
 * Resolve the current actor from the session cookie, provisioning a guest if
 * there is none. Returns a Set-Cookie string when a new guest session is minted.
 */
export async function resolveActor(req: Request, env: Env): Promise<{ user: UserRow; cookie?: string }> {
  const token = readCookie(req, SESSION_COOKIE);
  const existing = await getUserForToken(env, token);
  if (existing) return { user: existing };
  const guest = await createGuestUser(env);
  const raw = await createSession(env, guest.id);
  return { user: guest, cookie: buildSessionCookie(req, raw) };
}

/** Clone a response, appending a Set-Cookie header (used to attach guest sessions). */
export function withCookie(res: Response, cookie?: string): Response {
  if (!cookie) return res;
  const clone = new Response(res.body, res);
  clone.headers.append('Set-Cookie', cookie);
  return clone;
}
