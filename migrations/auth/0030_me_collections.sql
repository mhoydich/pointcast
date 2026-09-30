-- Private collection drafts and explicit public snapshots. Keeps stay owner scoped.
CREATE TABLE IF NOT EXISTS me_collections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  items_json TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  published_json TEXT,
  published_at TEXT,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS me_collections_owner ON me_collections(user_id, updated_at);
CREATE TRIGGER IF NOT EXISTS me_collections_cap BEFORE INSERT ON me_collections
WHEN (SELECT COUNT(*) FROM me_collections WHERE user_id=NEW.user_id)>=50
BEGIN SELECT RAISE(ABORT, 'collection-limit'); END;
CREATE TABLE IF NOT EXISTS me_profiles (
  user_id TEXT PRIMARY KEY,
  public_id TEXT UNIQUE NOT NULL,
  draft_json TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  published_json TEXT,
  published_at TEXT,
  hidden INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS me_reports (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL CHECK(resource_type IN ('collection','profile')),
  resource_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(resource_type, resource_id, reporter_id)
);
