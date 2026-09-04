PRAGMA foreign_keys = ON;

-- The faucet ledger. One row per account per faucet per Los Angeles day.
-- `held` rows are owed; `submitting` rows are mid-send; `delivered` rows
-- carry the tx hash. A failed send returns the row to `held`, so nothing
-- is ever lost by a bad RPC afternoon.
CREATE TABLE faucet_claims (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  faucet TEXT NOT NULL,
  day TEXT NOT NULL CHECK (length(day) = 10),
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('held', 'submitting', 'delivered')),
  tx_hash TEXT,
  delivered_to TEXT,
  created_at TEXT NOT NULL,
  delivered_at TEXT,
  UNIQUE (user_id, faucet, day),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX faucet_claims_faucet_day_idx ON faucet_claims(faucet, day);
CREATE INDEX faucet_claims_user_status_idx ON faucet_claims(user_id, faucet, status);
CREATE INDEX faucet_claims_created_at_idx ON faucet_claims(created_at DESC);
