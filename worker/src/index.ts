/**
 * FIP Worker — serves the built React app (ASSETS) and the JSON API under /api/*.
 *
 * Auth tiers:
 *  - public: static assets, /api/assets, /api/auth/*
 *  - guest-allowed: queue, vote, clicks, user search + profiles (an anonymous
 *    guest actor is auto-provisioned and its session cookie attached)
 *  - real account only: create poll, publish look, upload image
 */
import { error } from './lib/json';
import { requireAuth } from './auth/middleware';
import { resolveActor, withCookie } from './auth/guest';
import { handleLogin, handleLogout, handleMe, handleRegister } from './routes/auth';
import { handleCreatePoll, handlePollQueue } from './routes/polls';
import { handleVote } from './routes/votes';
import { handleGetUser, handleSearchUsers } from './routes/users';
import { handleCreateLook } from './routes/looks';
import { handleUpload } from './routes/uploads';
import { handleClick } from './routes/clicks';
import { handleGetAsset } from './routes/assets';
import type { Env } from './types';

async function handleApi(req: Request, env: Env, url: URL): Promise<Response> {
  const method = req.method.toUpperCase();
  const path = url.pathname.split('/').filter(Boolean).slice(1); // ['api', ...rest] -> rest

  // --- Public: uploaded images from R2 ---
  if (method === 'GET' && path[0] === 'assets') {
    return handleGetAsset(req, env, decodeURIComponent(path.slice(1).join('/')));
  }

  // --- Public: auth ---
  if (path[0] === 'auth') {
    if (method === 'POST' && path[1] === 'register') return handleRegister(req, env);
    if (method === 'POST' && path[1] === 'login') return handleLogin(req, env);
    if (method === 'POST' && path[1] === 'logout') return handleLogout(req, env);
    if (method === 'GET' && path[1] === 'me') return handleMe(req, env);
    return error(404, 'Not found');
  }

  const isQueue = path[0] === 'polls' && method === 'GET' && path[1] === 'queue';
  const isVote = path[0] === 'polls' && method === 'POST' && !!path[1] && path[2] === 'vote';
  const isClick = path[0] === 'clicks' && method === 'POST';
  const isUsers = path[0] === 'users' && method === 'GET';

  // --- Guest-allowed: provision an actor (guest if needed), attach its cookie ---
  if (isQueue || isVote || isClick || isUsers) {
    const { user, cookie } = await resolveActor(req, env);
    let res: Response;
    if (isQueue) res = await handlePollQueue(req, env, user);
    else if (isVote) res = await handleVote(req, env, user, path[1]);
    else if (isClick) res = await handleClick(req, env, user);
    else if (path[1]) res = await handleGetUser(req, env, user, decodeURIComponent(path[1]));
    else res = await handleSearchUsers(req, env, user);
    return withCookie(res, cookie);
  }

  // --- Real account only ---
  const user = await requireAuth(req, env);
  if (user instanceof Response) return user;

  if (path[0] === 'polls' && method === 'POST' && !path[1]) return handleCreatePoll(req, env, user);
  if (path[0] === 'looks' && method === 'POST') return handleCreateLook(req, env, user);
  if (path[0] === 'uploads' && method === 'POST') return handleUpload(req, env, user);

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
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
