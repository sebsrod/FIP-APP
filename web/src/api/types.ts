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
  tags: Tag[];
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
  looks: Look[];
}

export type ClickSource = 'poll_tag' | 'look_item';

/** Draft item used by the Publish-New-Look modal before it is sent. */
export interface DraftItem {
  x_pct: number;
  y_pct: number;
  brand: string;
  item_name: string;
  price_cents: number;
  currency: string;
  affiliate_url: string;
}
