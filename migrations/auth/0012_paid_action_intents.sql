PRAGMA foreign_keys = ON;

CREATE TABLE paid_action_intents (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN ('bench', 'cast', 'claim')),
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL CHECK (length(request_hash) = 64),
  request_json TEXT NOT NULL CHECK (json_valid(request_json)),
  status TEXT NOT NULL CHECK (status IN (
    'created', 'settling', 'settlement_ambiguous', 'settlement_failed',
    'settled', 'acting', 'action_failed', 'succeeded'
  )),
  capacity_key TEXT,
  settlement_json TEXT CHECK (settlement_json IS NULL OR json_valid(settlement_json)),
  result_json TEXT CHECK (result_json IS NULL OR json_valid(result_json)),
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (action, idempotency_key),
  UNIQUE (action, request_hash, idempotency_key)
);

CREATE INDEX paid_action_intents_status_idx
  ON paid_action_intents(status, updated_at);
