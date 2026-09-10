-- Additive: existing paid-action rows and constraints are unchanged.
CREATE TABLE nouns_battler_records (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL CHECK (action = 'battler'),
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL CHECK (length(request_hash) = 64),
  request_json TEXT NOT NULL CHECK (json_valid(request_json)),
  status TEXT NOT NULL CHECK (status IN ('created','settling','settlement_ambiguous','settlement_failed','settled','acting','action_failed','succeeded')),
  capacity_key TEXT,
  action_lease TEXT,
  settlement_json TEXT CHECK (settlement_json IS NULL OR json_valid(settlement_json)),
  result_json TEXT CHECK (result_json IS NULL OR json_valid(result_json)),
  tx_hash TEXT,
  agent_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(action, idempotency_key)
);
CREATE UNIQUE INDEX nouns_battler_record_transaction ON nouns_battler_records(tx_hash) WHERE tx_hash IS NOT NULL;
CREATE INDEX nouns_battler_record_status ON nouns_battler_records(status, updated_at);
