/**
 * Opaque, server-revocable sessions.
 *
 * We mint a high-entropy random token, hand the RAW token to the client as an
 * httpOnly cookie, and store only its SHA-256 hash in D1. A stolen database
 * therefore cannot be replayed as a valid cookie, and logout is a single row
 * delete.
 */
import { bytesToBase64Url, sha256Base64Url } from '../lib/encoding';
import { SESSION_MAX_AGE } from './cookies';
import type { Env, UserRow } from '../types';

const TOKEN_BYTES = 32;

/** Create a new session row for a user and return the RAW token for the cookie. */
export async function createSession(env: Env, userId: string): Promise<string> {
  const raw = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
  const tokenHash = await sha256Base64Url(raw);
  const now = Date.now();
  const expiresAt = now + SESSION_MAX_AGE * 1000;
  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
  )
    .bind(tokenHash, userId, now, expiresAt)
    .run();
  return raw;
}

/** Resolve a raw token to its user, or null if missing/expired/revoked. */
export async function getUserForToken(env: Env, rawToken: string | null): Promise<UserRow | null> {
  if (!rawToken) return null;
  const tokenHash = await sha256Base64Url(rawToken);
  const row = await env.DB.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ?`,
  )
    .bind(tokenHash, Date.now())
    .first<UserRow>();
  return row ?? null;
}

/** Revoke (delete) the session identified by a raw token. */
export async function revokeSession(env: Env, rawToken: string | null): Promise<void> {
  if (!rawToken) return;
  const tokenHash = await sha256Base64Url(rawToken);
  await env.DB.prepare(`DELETE FROM sessions WHERE id = ?`).bind(tokenHash).run();
}

/** Opportunistically purge expired sessions (cheap hygiene on login). */
export async function purgeExpiredSessions(env: Env): Promise<void> {
  await env.DB.prepare(`DELETE FROM sessions WHERE expires_at <= ?`).bind(Date.now()).run();
}
