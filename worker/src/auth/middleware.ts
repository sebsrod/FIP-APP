/** requireAuth middleware: resolves the session cookie to a user or returns 401. */
import { error } from '../lib/json';
import { readCookie, SESSION_COOKIE } from './cookies';
import { getUserForToken } from './session';
import type { Env, UserRow } from '../types';

/**
 * Returns the authenticated UserRow, or a 401 Response. Callers do:
 *   const user = await requireAuth(req, env);
 *   if (user instanceof Response) return user;
 */
export async function requireAuth(req: Request, env: Env): Promise<UserRow | Response> {
  const token = readCookie(req, SESSION_COOKIE);
  const user = await getUserForToken(env, token);
  if (!user) return error(401, 'Authentication required', 'unauthorized');
  return user;
}
