-- A private visit receipt, not a model credential or ongoing agent permission.
CREATE TABLE IF NOT EXISTS ai_companions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  approach TEXT NOT NULL CHECK (approach IN ('subscription', 'api', 'other')),
  gentle INTEGER NOT NULL DEFAULT 0 CHECK (gentle IN (0, 1)),
  invitation_id TEXT NOT NULL,
  code_hash TEXT UNIQUE,
  expires_at INTEGER,
  confirmed_at INTEGER,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, provider)
);
