PRAGMA foreign_keys = ON;

-- The faucet ledger. One row per account per faucet per Los Angeles day.
-- `held` rows are owed; `submitting` rows are mid-send; `delivered` rows
-- carry the tx hash. A send that fails before it is broadcast returns the
-- row to `held`, so nothing is lost by a bad RPC afternoon. A send that is
-- broadcast never goes back, even if the ledger write after it fails.
--
-- `delivered_at` does double duty: while status is `submitting` it holds the
-- moment the send was taken, which is both the stale-row cutoff and the key
-- that moves exactly one call's rows. It becomes the delivery time on
-- `delivered`. Do not repurpose it without reading deliverHeldFaucetDrips.
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

-- One send per faucet at a time. The spigot wallet has a single nonce
-- sequence, so two concurrent deliveries would collide; D1 serialises writes,
-- which makes a conditional UPDATE on this row a real mutex. `acquired_at`
-- older than sixty seconds counts as abandoned.
CREATE TABLE faucet_locks (
  faucet TEXT PRIMARY KEY,
  holder TEXT,
  acquired_at TEXT
);

INSERT INTO faucet_locks (faucet, holder, acquired_at) VALUES ('hello', NULL, NULL);
