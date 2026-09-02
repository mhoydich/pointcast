PRAGMA foreign_keys = ON;

CREATE TABLE claims (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_id INTEGER NOT NULL CHECK (token_id >= 0 AND token_id < 30),
  status TEXT NOT NULL CHECK (status IN ('held', 'delivered', 'failed')),
  op_hash TEXT,
  delivered_to TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, token_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX claims_token_status_idx ON claims(token_id, status);
CREATE INDEX claims_user_status_idx ON claims(user_id, status);
CREATE INDEX claims_created_at_idx ON claims(created_at DESC);
