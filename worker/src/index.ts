/**
 * FIP Worker — serves the built React app (via the ASSETS binding) and the
 * JSON API under /api/*. Because `run_worker_first = true`, this fetch handler
 * is invoked for every request; API paths are handled here and everything else
 * is delegated to static assets (with SPA fallback to index.html).
 */
import { error } from './lib/json';
import { requireAuth } from './auth/middleware';
import { handleLogin, handleLogout, handleMe, handleRegister } from './routes/auth';
import { handlePollQueue } from './routes/polls';
import { handleVote } from './routes/votes';
import { handleGetUser } from './routes/users';
import { handleCreateLook } from './routes/looks';
import { handleUpload } from './routes/uploads';
import { handleClick } from './routes/clicks';
import { handleGetAsset } from './routes/assets';
import type { Env } from './types';

async function handleApi(req: Request, env: Env, url: URL): Promise<Response> {
  const method = req.method.toUpperCase();
  // ['api', ...rest]
  const path = url.pathname.split('/').filter(Boolean).slice(1);

  // --- Public: serve uploaded images from R2 ---
  if (method === 'GET' && path[0] === 'assets') {
    const key = decodeURIComponent(path.slice(1).join('/'));
    return handleGetAsset(req, env, key);
  }

  // --- Public: auth ---
  if (path[0] === 'auth') {
    if (method === 'POST' && path[1] === 'register') return handleRegister(req, env);
    if (method === 'POST' && path[1] === 'login') return handleLogin(req, env);
    if (method === 'POST' && path[1] === 'logout') return handleLogout(req, env);
    if (method === 'GET' && path[1] === 'me') return handleMe(req, env);
    return error(404, 'Not found');
  }

  // --- Everything below requires a valid session ---
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;

  if (path[0] === 'polls') {
    if (method === 'GET' && path[1] === 'queue') return handlePollQueue(req, env, user);
    if (method === 'POST' && path[1] && path[2] === 'vote') return handleVote(req, env, user, path[1]);
    return error(404, 'Not found');
  }

  if (path[0] === 'users' && path[1] && method === 'GET') {
    return handleGetUser(req, env, decodeURIComponent(path[1]));
  }

  if (path[0] === 'looks' && method === 'POST') return handleCreateLook(req, env, user);
  if (path[0] === 'uploads' && method === 'POST') return handleUpload(req, env, user);
  if (path[0] === 'clicks' && method === 'POST') return handleClick(req, env, user);

  return error(404, 'Not found');
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(req, env, url);
      } catch (err) {
        console.error('API error:', err);
        return error(500, 'Internal server error');
      }
    }
    // Static assets (SPA). run_worker_first=true routes all non-API here.
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
