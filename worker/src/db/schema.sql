-- FIP schema (Cloudflare D1 / SQLite). Idempotent: safe to run repeatedly.

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  username        TEXT UNIQUE NOT NULL COLLATE NOCASE,  -- 3-20 chars [a-zA-Z0-9_], case-insensitive unique
  display_name    TEXT NOT NULL,
  password_hash   TEXT NOT NULL,                        -- PBKDF2 derived key, base64
  password_salt   TEXT NOT NULL,                        -- per-user random salt, base64
  bio             TEXT,
  avatar_url      TEXT,
  followers_count INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,                          -- SHA-256 hash (base64url) of the raw token
  user_id     TEXT NOT NULL REFERENCES users(id),
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS polls (
  id                  TEXT PRIMARY KEY,
  creator_id          TEXT REFERENCES users(id),
  option_a_image_url  TEXT NOT NULL,
  option_b_image_url  TEXT NOT NULL,
  option_a_votes      INTEGER NOT NULL DEFAULT 0,
  option_b_votes      INTEGER NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'active',     -- active | closed
  created_at          INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);

CREATE TABLE IF NOT EXISTS votes (
  id          TEXT PRIMARY KEY,
  poll_id     TEXT NOT NULL REFERENCES polls(id),
  user_id     TEXT NOT NULL REFERENCES users(id),
  side        TEXT NOT NULL,                              -- 'A' | 'B'
  created_at  INTEGER NOT NULL,
  UNIQUE(poll_id, user_id)                                -- one vote per user per poll
);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll ON votes(poll_id);

CREATE TABLE IF NOT EXISTS tags (
  id            TEXT PRIMARY KEY,
  poll_id       TEXT NOT NULL REFERENCES polls(id),
  side          TEXT NOT NULL,                            -- 'A' | 'B'
  x_pct         REAL NOT NULL,                            -- 0-100 horizontal
  y_pct         REAL NOT NULL,                            -- 0-100 vertical
  brand         TEXT NOT NULL,
  item_name     TEXT NOT NULL,
  price_cents   INTEGER NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'USD',
  affiliate_url TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_tags_poll ON tags(poll_id);

CREATE TABLE IF NOT EXISTS looks (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id),
  image_url    TEXT NOT NULL,
  caption      TEXT,
  published_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_looks_user ON looks(user_id);

CREATE TABLE IF NOT EXISTS look_items (
  id            TEXT PRIMARY KEY,
  look_id       TEXT NOT NULL REFERENCES looks(id),
  x_pct         REAL NOT NULL,
  y_pct         REAL NOT NULL,
  brand         TEXT NOT NULL,
  item_name     TEXT NOT NULL,
  price_cents   INTEGER NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'USD',
  affiliate_url TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_look_items_look ON look_items(look_id);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id          TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,                              -- 'poll_tag' | 'look_item'
  source_id   TEXT NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id),
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_clicks_user ON affiliate_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_clicks_source ON affiliate_clicks(source_type, source_id);
