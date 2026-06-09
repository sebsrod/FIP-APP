/** API DTOs — mirror of the Worker's JSON responses. */

export type Side = 'A' | 'B';

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

export interface Tag {
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
  verified: number;
}

export interface Poll {
  id: string;
  creator_id: string | null;
  option_a_image_url: string;
  option_b_image_url: string;
  option_a_votes: number;
  option_b_votes: number;
  status: string;
  created_at: number;
  expires_at: number | null;
  caption: string | null;
  tags: Tag[];
}

/** A creator's active poll as returned on their profile (stories-style). */
export interface ActivePoll extends Poll {
  a_pct: number;
  b_pct: number;
  voted_side: Side | null;
}

export interface VoteResult {
  pollId: string;
  a_votes: number;
  b_votes: number;
  a_pct: number;
  b_pct: number;
}

export interface LookItem {
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

export interface Look {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  published_at: number;
  items: LookItem[];
}

export interface Profile {
  user: PublicUser;
  is_owner: boolean;
  looks: Look[];
  polls: ActivePoll[];
}

export type ClickSource = 'poll_tag' | 'look_item';

/** Draft item used by the look (profile photo) composer before it is sent. */
export interface DraftItem {
  x_pct: number;
  y_pct: number;
  brand: string;
  item_name: string;
  price_cents: number;
  currency: string;
  affiliate_url: string;
}

/** Draft tag for the A/B poll composer (carries its side). */
export interface DraftPollTag extends DraftItem {
  side: Side;
}

export interface CreatePollBody {
  caption: string;
  option_a_image_url: string;
  option_b_image_url: string;
  tags: DraftPollTag[];
}
