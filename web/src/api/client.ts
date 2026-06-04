/** Typed, same-origin API client. Cookies ride along via credentials:'include'. */
import type { Look, Poll, Profile, PublicUser, Side, VoteResult, ClickSource, DraftItem } from './types';
import { notifyUnauthorized } from './unauthorized';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { credentials: 'include', ...init });
  } catch {
    throw new ApiError(0, 'Network error — check your connection', 'network');
  }

  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!res.ok) {
    // An expired/invalid session on a protected route -> drop local auth state.
    if (res.status === 401 && !path.startsWith('/auth/')) {
      notifyUnauthorized();
    }
    const body = data as { error?: string; code?: string };
    throw new ApiError(res.status, body.error ?? res.statusText, body.code);
  }
  return data as T;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export const api = {
  auth: {
    register: (body: { username: string; password: string; display_name?: string }) =>
      request<{ user: PublicUser }>('/auth/register', jsonInit('POST', body)),
    login: (body: { username: string; password: string }) =>
      request<{ user: PublicUser }>('/auth/login', jsonInit('POST', body)),
    logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
    me: () => request<{ user: PublicUser }>('/auth/me'),
  },

  polls: {
    queue: (limit = 10) => request<{ polls: Poll[] }>(`/polls/queue?limit=${limit}`),
    vote: (pollId: string, side: Side) =>
      request<VoteResult>(`/polls/${encodeURIComponent(pollId)}/vote`, jsonInit('POST', { side })),
  },

  users: {
    get: (username: string) => request<Profile>(`/users/${encodeURIComponent(username)}`),
    search: (q: string) => request<{ users: PublicUser[] }>(`/users?q=${encodeURIComponent(q)}`),
  },

  looks: {
    create: (body: { image_url: string; caption: string; items: DraftItem[] }) =>
      request<{ look: Look }>('/looks', jsonInit('POST', body)),
  },

  uploads: {
    fromUrl: (url: string) => request<{ url: string }>('/uploads', jsonInit('POST', { url })),
    fromFile: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<{ url: string }>('/uploads', { method: 'POST', body: form });
    },
  },

  clicks: {
    log: (source_type: ClickSource, source_id: string) =>
      request<{ ok: true }>('/clicks', jsonInit('POST', { source_type, source_id })),
  },
};
