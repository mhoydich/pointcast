PRAGMA foreign_keys = ON;

ALTER TABLE paid_action_intents ADD COLUMN tx_hash TEXT;
ALTER TABLE paid_action_intents ADD COLUMN agent_id TEXT;

CREATE UNIQUE INDEX paid_action_intents_tx_hash_idx
  ON paid_action_intents(tx_hash) WHERE tx_hash IS NOT NULL;
CREATE INDEX paid_action_intents_agent_idx
  ON paid_action_intents(agent_id, created_at DESC) WHERE agent_id IS NOT NULL;

ALTER TABLE aliases ADD COLUMN agent_id TEXT;
CREATE INDEX aliases_agent_idx
  ON aliases(agent_id, renewed_at DESC) WHERE agent_id IS NOT NULL;

CREATE TABLE agent_challenges (
  id TEXT PRIMARY KEY,
  purpose TEXT NOT NULL CHECK (purpose IN ('register', 'rotate', 'revoke')),
  agent_id TEXT,
  proposal_json TEXT NOT NULL CHECK (json_valid(proposal_json)),
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE INDEX agent_challenges_expiry_idx
  ON agent_challenges(expires_at, used_at);

CREATE TABLE agent_keys (
  key_id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  public_key TEXT NOT NULL UNIQUE,
  public_key_alg TEXT NOT NULL DEFAULT 'ed25519' CHECK (public_key_alg = 'ed25519'),
  operator TEXT NOT NULL,
  scopes_json TEXT NOT NULL CHECK (json_valid(scopes_json)),
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rotated', 'revoked')),
  replaces_key_id TEXT,
  registered_challenge_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  rotated_at TEXT,
  revoked_at TEXT,
  FOREIGN KEY (replaces_key_id) REFERENCES agent_keys(key_id),
  FOREIGN KEY (registered_challenge_id) REFERENCES agent_challenges(id)
);

CREATE UNIQUE INDEX agent_keys_one_active_idx
  ON agent_keys(agent_id) WHERE status = 'active';
CREATE INDEX agent_keys_operator_idx
  ON agent_keys(operator, created_at DESC);
