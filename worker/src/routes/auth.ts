/** /api/auth/* — register, login, logout, me. */
import { error, json, ok, readJson } from '../lib/json';
import { validateDisplayName, validatePassword, validateUsername } from '../lib/validate';
import { hashPassword, verifyPassword } from '../auth/password';
import { buildClearCookie, buildSessionCookie, readCookie, SESSION_COOKIE } from '../auth/cookies';
import { createSession, getUserForToken, purgeExpiredSessions, revokeSession } from '../auth/session';
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

  const existing = await getUserByUsername(env, u.value);
  if (existing) return error(409, 'Username taken', 'username_taken');

  const { hash, salt } = await hashPassword(p.value);
  const id = newId('usr');
  const now = Date.now();
  const avatar = `${AVATAR_FALLBACK}${encodeURIComponent(u.value)}`;

  try {
    await env.DB.prepare(
      `INSERT INTO users (id, username, display_name, password_hash, password_salt, bio, avatar_url, followers_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    )
      .bind(id, u.value, displayName, hash, salt, null, avatar, now)
      .run();
  } catch {
    // UNIQUE collision backstop (race between check and insert).
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
  };
  return json({ user: toPublicUser(user) }, {
    status: 201,
    headers: { 'Set-Cookie': buildSessionCookie(req, token) },
  });
}

export async function handleLogin(req: Request, env: Env): Promise<Response> {
  const body = await readJson<{ username?: unknown; password?: unknown }>(req);
  if (!body) return error(400, 'Invalid request body');

  // Generic failures only — never reveal which field was wrong.
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const GENERIC = 'Invalid username or password';

  const user = await getUserByUsername(env, username);
  if (!user) {
    // Run a dummy verify so timing doesn't reveal whether the user exists.
    await verifyPassword(password, 'AAAAAAAAAAAAAAAAAAAAAA==', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
    return error(401, GENERIC, 'invalid_credentials');
  }

  const valid = await verifyPassword(password, user.password_salt, user.password_hash);
  if (!valid) return error(401, GENERIC, 'invalid_credentials');

  await purgeExpiredSessions(env);
  const token = await createSession(env, user.id);
  return json({ user: toPublicUser(user) }, {
    status: 200,
    headers: { 'Set-Cookie': buildSessionCookie(req, token) },
  });
}

export async function handleLogout(req: Request, env: Env): Promise<Response> {
  const token = readCookie(req, SESSION_COOKIE);
  await revokeSession(env, token);
  return json({ ok: true }, { status: 200, headers: { 'Set-Cookie': buildClearCookie(req) } });
}

export async function handleMe(req: Request, env: Env): Promise<Response> {
  const token = readCookie(req, SESSION_COOKIE);
  const user = await getUserForToken(env, token);
  if (!user) return error(401, 'Authentication required', 'unauthorized');
  return ok({ user: toPublicUser(user) });
}
