/** /api/auth/* — register, login, logout, me (with anonymous guest support). */
import { error, json, ok, readJson } from '../lib/json';
import { validateDisplayName, validatePassword, validateUsername } from '../lib/validate';
import { hashPassword, verifyPassword } from '../auth/password';
import { buildClearCookie, buildSessionCookie, readCookie, SESSION_COOKIE } from '../auth/cookies';
import { createSession, getUserForToken, purgeExpiredSessions, revokeSession } from '../auth/session';
import { resolveActor, withCookie } from '../auth/guest';
import { newId } from '../db/ids';
import { toPublicUser, type Env, type UserRow } from '../types';

const AVATAR_FALLBACK = 'https://api.dicebear.com/7.x/notionists/svg?seed=';

async function getUserByUsername(env: Env, username: string): Promise<UserRow | null> {
  return (
    (await env.DB.prepare(`SELECT * FROM users WHERE username = ? COLLATE NOCASE`)
      .bind(username)
      .first<UserRow>()) ?? null
  );
}

export async function handleRegister(req: Request, env: Env): Promise<Response> {
  const body = await readJson<{ username?: unknown; password?: unknown; display_name?: unknown }>(req);
  if (!body) return error(400, 'Invalid request body');

  const u = validateUsername(body.username);
  if (!u.ok) return error(400, u.message, 'invalid_username');
  const p = validatePassword(body.password);
  if (!p.ok) return error(400, p.message, 'invalid_password');
  const displayName = validateDisplayName(body.display_name, u.value);

  if (await getUserByUsername(env, u.value)) return error(409, 'Username taken', 'username_taken');

  const { hash, salt } = await hashPassword(p.value);
  const avatar = `${AVATAR_FALLBACK}${encodeURIComponent(u.value)}`;

  // If the caller is currently a guest, upgrade that row in place so their
  // existing votes/clicks carry over and the session stays valid.
  const current = await getUserForToken(env, readCookie(req, SESSION_COOKIE));
  if (current && current.is_guest === 1) {
    await env.DB.prepare(
      `UPDATE users SET username=?, display_name=?, password_hash=?, password_salt=?, avatar_url=?, is_guest=0 WHERE id=?`,
    )
      .bind(u.value, displayName, hash, salt, avatar, current.id)
      .run();
    const upgraded: UserRow = {
      ...current,
      username: u.value,
      display_name: displayName,
      password_hash: hash,
      password_salt: salt,
      avatar_url: avatar,
      is_guest: 0,
    };
    return json({ user: toPublicUser(upgraded) }, { status: 201 });
  }

  const id = newId('usr');
  const now = Date.now();
  try {
    await env.DB.prepare(
      `INSERT INTO users (id, username, display_name, password_hash, password_salt, bio, avatar_url, followers_count, created_at, is_guest)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 0)`,
    )
      .bind(id, u.value, displayName, hash, salt, null, avatar, now)
      .run();
  } catch {
    return error(409, 'Username taken', 'username_taken');
  }

  const token = await createSession(env, id);
  const user: UserRow = {
    id,
    username: u.value,
    display_name: displayName,
    password_hash: hash,
    password_salt: salt,
    bio: null,
    avatar_url: avatar,
    followers_count: 0,
    created_at: now,
    is_guest: 0,
  };
  return json({ user: toPublicUser(user) }, {
    status: 201,
    headers: { 'Set-Cookie': buildSessionCookie(req, token) },
  });
}

export async function handleLogin(req: Request, env: Env): Promise<Response> {
  const body = await readJson<{ username?: unknown; password?: unknown }>(req);
  if (!body) return error(400, 'Invalid request body');

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const GENERIC = 'Invalid username or password';

  const user = await getUserByUsername(env, username);
  if (!user || user.is_guest === 1) {
    await verifyPassword(password, 'AAAAAAAAAAAAAAAAAAAAAA==', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
    return error(401, GENERIC, 'invalid_credentials');
  }

  const valid = await verifyPassword(password, user.password_salt, user.password_hash);
  if (!valid) return error(401, GENERIC, 'invalid_credentials');

  // Drop any current (e.g. guest) session, then mint a fresh one for this user.
  await revokeSession(env, readCookie(req, SESSION_COOKIE));
  await purgeExpiredSessions(env);
  const token = await createSession(env, user.id);
  return json({ user: toPublicUser(user) }, {
    status: 200,
    headers: { 'Set-Cookie': buildSessionCookie(req, token) },
  });
}

export async function handleLogout(req: Request, env: Env): Promise<Response> {
  await revokeSession(env, readCookie(req, SESSION_COOKIE));
  return json({ ok: true }, { status: 200, headers: { 'Set-Cookie': buildClearCookie(req) } });
}

/** Returns the current actor — a real user or an auto-provisioned guest. */
export async function handleMe(req: Request, env: Env): Promise<Response> {
  const { user, cookie } = await resolveActor(req, env);
  return withCookie(ok({ user: toPublicUser(user) }), cookie);
}
