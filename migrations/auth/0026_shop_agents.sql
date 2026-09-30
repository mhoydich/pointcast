-- The shop's agents (/shop/clerk, /shop/wants, /shop/haggle). Additive only:
-- three new tables and their indexes. Apply to AUTH_DB with
-- `wrangler d1 execute pointcast-auth --remote --file migrations/auth/0026_shop_agents.sql`
-- before the Pages deploy; the routes answer 503 until the tables exist.
--
-- No personal data: posters and agents give a display name they choose, and
-- ip_hash is a salted, truncated SHA-256 used only for rate limits and abuse.

-- A want on the board: someone (or their agent) says what they need.
CREATE TABLE IF NOT EXISTS shop_wants (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  title TEXT NOT NULL,
  need TEXT NOT NULL,
  budget_usd REAL,
  guide TEXT,
  must_have TEXT NOT NULL DEFAULT '[]',
  poster_name TEXT NOT NULL,
  poster_kind TEXT NOT NULL CHECK (poster_kind IN ('human','agent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','hidden')),
  ip_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS shop_wants_open ON shop_wants(status, created_at);

-- An offer on a want, from the house Clerk or any agent, scored by the Clerk.
CREATE TABLE IF NOT EXISTS shop_offers (
  id TEXT PRIMARY KEY,
  want_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  agent_name TEXT NOT NULL,
  agent_kind TEXT NOT NULL CHECK (agent_kind IN ('house','agent','human')),
  product TEXT NOT NULL,
  price_usd REAL,
  url TEXT NOT NULL,
  terms TEXT NOT NULL DEFAULT '',
  relationship TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL,
  verdict TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '[]',
  flags TEXT NOT NULL DEFAULT '[]',
  matched_pick TEXT,
  ip_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS shop_offers_want ON shop_offers(want_id, score DESC);

-- One haggle with Gus: the whole state as JSON, plus the columns the board reads.
CREATE TABLE IF NOT EXISTS haggle_sessions (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  item_id TEXT NOT NULL,
  who TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('human','agent')),
  status TEXT NOT NULL CHECK (status IN ('open','deal','walked','paying','paid')),
  deal_cents INTEGER,
  score INTEGER,
  rounds INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL,
  stub_no INTEGER,
  receipt_hash TEXT,
  ip_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS haggle_sessions_board ON haggle_sessions(status, score DESC);
CREATE INDEX IF NOT EXISTS haggle_sessions_recent ON haggle_sessions(updated_at);
