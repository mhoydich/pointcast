-- Match the v1 lazy schema so this works before or after the first directory GET.
CREATE TABLE IF NOT EXISTS agent_wallets (
  agent_id TEXT PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  secret_iv TEXT NOT NULL,
  secret_ciphertext TEXT NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

ALTER TABLE agent_wallets ADD COLUMN bearer_token_hash TEXT
  CHECK (bearer_token_hash IS NULL OR (
    length(bearer_token_hash) = 64 AND bearer_token_hash NOT GLOB '*[^a-f0-9]*'
  ));
CREATE UNIQUE INDEX agent_wallet_bearer_hash ON agent_wallets (bearer_token_hash);

ALTER TABLE agent_wallets ADD COLUMN daily_cap_mutez INTEGER NOT NULL DEFAULT 5000000
  CHECK (typeof(daily_cap_mutez) = 'integer' AND daily_cap_mutez BETWEEN 0 AND 9007199254740991);

CREATE TABLE agent_wallet_signer_locks (
  agent_id TEXT PRIMARY KEY REFERENCES agent_wallets (agent_id),
  holder TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE agent_wallet_ops (
  id INTEGER PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agent_wallets (agent_id),
  kind TEXT NOT NULL CHECK (kind IN ('send', 'mint')),
  op_hash TEXT NOT NULL UNIQUE,
  max_cost_mutez INTEGER NOT NULL CHECK (max_cost_mutez > 0),
  last_counter INTEGER NOT NULL,
  expires_level INTEGER NOT NULL,
  idempotency_hash TEXT,
  request_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (agent_id, idempotency_hash)
);

CREATE INDEX agent_wallet_ops_day ON agent_wallet_ops (agent_id, created_at);
CREATE INDEX agent_wallet_ops_latest ON agent_wallet_ops (agent_id, id DESC);

CREATE TRIGGER agent_wallet_ops_no_update BEFORE UPDATE ON agent_wallet_ops
BEGIN
  SELECT RAISE(ABORT, 'agent_wallet_ops is append-only');
END;

CREATE TRIGGER agent_wallet_ops_no_delete BEFORE DELETE ON agent_wallet_ops
BEGIN
  SELECT RAISE(ABORT, 'agent_wallet_ops is append-only');
END;
