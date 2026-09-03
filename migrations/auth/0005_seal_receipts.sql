PRAGMA foreign_keys = ON;

CREATE TABLE seal_receipts (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  token_id INTEGER NOT NULL CHECK (token_id >= 0 AND token_id < 30),
  kind TEXT NOT NULL CHECK (kind IN ('showed-up', 'streak-7', 'complete-30')),
  evidence TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_wallet', 'pending', 'submitting', 'submitted', 'attested', 'failed')),
  holder TEXT,
  op_hash TEXT,
  run_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  attested_at TEXT,
  UNIQUE (claim_id, kind),
  FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX seal_receipts_status_idx ON seal_receipts(status, token_id);
CREATE INDEX seal_receipts_user_idx ON seal_receipts(user_id, token_id);
CREATE INDEX seal_receipts_op_hash_idx ON seal_receipts(op_hash);
