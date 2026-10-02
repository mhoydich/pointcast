-- Before enabling '1': deploy ME_KEEPS_D1='pause', drain all old KV writers,
-- verify the frozen source, and apply this migration. See the rollout runbook.
CREATE TABLE IF NOT EXISTS me_keeps (
  user_id TEXT NOT NULL,
  id TEXT NOT NULL,
  item_id TEXT NOT NULL UNIQUE,
  data_json TEXT NOT NULL CHECK (json_valid(data_json)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  PRIMARY KEY (user_id, id)
);
CREATE INDEX IF NOT EXISTS me_keeps_user_order ON me_keeps(user_id, created_at DESC);

-- The limit is checked inside the write transaction, including simultaneous
-- requests that both observed room before submitting their insert.
CREATE TRIGGER IF NOT EXISTS me_keeps_cap
BEFORE INSERT ON me_keeps
WHEN NOT EXISTS (SELECT 1 FROM me_keeps WHERE user_id = NEW.user_id AND id = NEW.id)
 AND (SELECT count(*) FROM me_keeps WHERE user_id = NEW.user_id) >= 300
BEGIN
  SELECT RAISE(ABORT, 'me-keeps-cap');
END;

CREATE TABLE IF NOT EXISTS me_keeps_migrations (
  user_id TEXT PRIMARY KEY,
  migrated_at TEXT NOT NULL,
  source_count INTEGER NOT NULL
);
