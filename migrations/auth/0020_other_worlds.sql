-- Other Worlds uses the existing AUTH_DB. No new contract or storage service.
CREATE TABLE IF NOT EXISTS other_worlds_challenges (
  nonce TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  artwork_id INTEGER NOT NULL CHECK (artwork_id BETWEEN 1 AND 9),
  origin TEXT NOT NULL,
  message TEXT NOT NULL,
  config_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  proof_hash TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS other_worlds_challenges_wallet ON other_worlds_challenges(address, created_at);
CREATE TABLE IF NOT EXISTS other_worlds_claims (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  artwork_id INTEGER NOT NULL CHECK (artwork_id BETWEEN 1 AND 9),
  nonce TEXT NOT NULL UNIQUE REFERENCES other_worlds_challenges(nonce),
  config_hash TEXT NOT NULL,
  contract TEXT NOT NULL,
  token_id TEXT NOT NULL,
  sponsor TEXT NOT NULL,
  metadata_sha256 TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reserved','preparing','signed','submitted','confirmed','failed')),
  operation_hash TEXT UNIQUE,
  signed_bytes TEXT,
  maximum_cost_mutez INTEGER NOT NULL DEFAULT 0 CHECK (maximum_cost_mutez >= 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  last_error TEXT
);
CREATE INDEX IF NOT EXISTS other_worlds_claims_artwork ON other_worlds_claims(artwork_id);
-- A sponsor has one outstanding counter across this collection. Locks never expire:
-- uncertainty must be reconciled using the stored operation, never a new transfer.
CREATE TABLE IF NOT EXISTS other_worlds_sponsor_locks (
  sponsor TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL UNIQUE REFERENCES other_worlds_claims(id),
  acquired_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS other_worlds_readiness (
  config_hash TEXT PRIMARY KEY,
  verified_at INTEGER NOT NULL
);
