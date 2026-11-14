-- OFF-52: D1 owns immutable cards and the atomic first answer; KV remains the ordinary thread log.
CREATE TABLE IF NOT EXISTS loom_confirms (
  id TEXT PRIMARY KEY,
  log_key TEXT NOT NULL,
  address TEXT NOT NULL,
  desk TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  message TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  answer TEXT,
  answer_seq INTEGER UNIQUE,
  answered_at TEXT,
  hidden INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS loom_confirms_log ON loom_confirms(log_key);
CREATE INDEX IF NOT EXISTS loom_confirms_open ON loom_confirms(desk, expires_at, id) WHERE answer IS NULL AND hidden = 0;
CREATE INDEX IF NOT EXISTS loom_confirms_answered ON loom_confirms(desk, answer_seq) WHERE answered_at IS NOT NULL AND hidden = 0;
CREATE TABLE IF NOT EXISTS loom_confirm_recipients (
  card_id TEXT NOT NULL REFERENCES loom_confirms(id),
  name TEXT NOT NULL,
  PRIMARY KEY (name, card_id)
);
