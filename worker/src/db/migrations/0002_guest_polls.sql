-- 0002: guest accounts, poll expiry + caption, affiliate "verified" flag.
-- Applied on top of an existing DB (ALTER ... ADD COLUMN preserves data).

-- Anonymous/guest users: can vote + click, cannot publish. Real accounts have is_guest = 0.
ALTER TABLE users ADD COLUMN is_guest INTEGER NOT NULL DEFAULT 0;

-- Polls now expire (60 min for user-created; NULL = never, used by seed) and carry a caption.
ALTER TABLE polls ADD COLUMN expires_at INTEGER;
ALTER TABLE polls ADD COLUMN caption TEXT;

-- Affiliate-program links render a "verified" check.
ALTER TABLE tags ADD COLUMN verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE look_items ADD COLUMN verified INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_polls_expires ON polls(expires_at);
CREATE INDEX IF NOT EXISTS idx_polls_creator ON polls(creator_id);
CREATE INDEX IF NOT EXISTS idx_users_guest ON users(is_guest);
