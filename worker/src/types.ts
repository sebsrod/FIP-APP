/// <reference types="@cloudflare/workers-types" />

/** Bindings declared in wrangler.toml. */
export interface Env {
  DB: D1Database;
  BUCKET: R2Bucket;
  ASSETS: Fetcher;
}

/** A user row as stored in D1 (never sent to the client verbatim). */
export interface UserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  password_salt: string;
  bio: string | null;
  avatar_url: string | null;
  followers_count: number;
  created_at: number;
  is_guest: number; // 1 = anonymous (can vote/click, cannot publish)
}

/** The user shape that is safe to return over the API (no secrets). */
export interface PublicUser {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  followers_count: number;
  created_at: number;
  is_guest: boolean;
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio,
    avatar_url: row.avatar_url,
    followers_count: row.followers_count,
    created_at: row.created_at,
    is_guest: row.is_guest === 1,
  };
}

export type Side = 'A' | 'B';

export interface TagRow {
  id: string;
  poll_id: string;
  side: Side;
  x_pct: number;
  y_pct: number;
  brand: string;
  item_name: string;
  price_cents: number;
  currency: string;
  affiliate_url: string;
  verified: number; // 1 = link belongs to a known affiliate program
}

export interface PollRow {
  id: string;
  creator_id: string | null;
  option_a_image_url: string;
  option_b_image_url: string;
  option_a_votes: number;
  option_b_votes: number;
  status: string;
  created_at: number;
  expires_at: number | null; // null = never expires (seed); else epoch ms
  caption: string | null;
}

/** A poll enriched with its tags, as returned by /api/polls/queue. */
export interface PollWithTags extends PollRow {
  tags: TagRow[];
}

export interface LookItemRow {
  id: string;
  look_id: string;
  x_pct: number;
  y_pct: number;
  brand: string;
  item_name: string;
  price_cents: number;
  currency: string;
  affiliate_url: string;
  verified: number;
}

export interface LookRow {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  published_at: number;
}

export interface LookWithItems extends LookRow {
  items: LookItemRow[];
}

/** Request context populated by requireAuth. */
export interface AuthedContext {
  user: UserRow;
}
