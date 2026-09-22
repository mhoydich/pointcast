PRAGMA foreign_keys = ON;

-- Every sponsored Tezos rail which can use the same manager address shares
-- this lock.  It deliberately has no expiry: once an operation may have been
-- signed or injected, the owning rail must reconcile that exact operation
-- before another rail is allowed to consume the manager counter.
CREATE TABLE IF NOT EXISTS tezos_sponsor_locks (
  sponsor TEXT PRIMARY KEY,
  owner_kind TEXT NOT NULL CHECK (owner_kind IN ('other-worlds', 'agent-cabinet')),
  owner_id TEXT NOT NULL,
  acquired_at INTEGER NOT NULL,
  UNIQUE (owner_kind, owner_id)
);

-- Preserve an outstanding Other Worlds lock when this migration is applied.
INSERT OR IGNORE INTO tezos_sponsor_locks (sponsor, owner_kind, owner_id, acquired_at)
SELECT sponsor, 'other-worlds', claim_id, acquired_at
FROM other_worlds_sponsor_locks;

-- Migration 0021 is applied before the Functions deploy. During that window,
-- old Other Worlds code still writes the legacy table. These compatibility
-- triggers make either table a single lock domain during a mixed-version
-- rollout. Any later rollback still requires disabled gates and reconciliation.
CREATE TRIGGER IF NOT EXISTS tezos_lock_guard_legacy_insert
BEFORE INSERT ON other_worlds_sponsor_locks
WHEN EXISTS (
  SELECT 1 FROM tezos_sponsor_locks
  WHERE sponsor = NEW.sponsor
    AND NOT (owner_kind = 'other-worlds' AND owner_id = NEW.claim_id)
)
BEGIN
  SELECT RAISE(IGNORE);
END;

CREATE TRIGGER IF NOT EXISTS tezos_lock_mirror_legacy_insert
AFTER INSERT ON other_worlds_sponsor_locks
BEGIN
  INSERT INTO tezos_sponsor_locks(sponsor, owner_kind, owner_id, acquired_at)
  SELECT NEW.sponsor, 'other-worlds', NEW.claim_id, NEW.acquired_at
  WHERE NOT EXISTS (
    SELECT 1 FROM tezos_sponsor_locks
    WHERE sponsor = NEW.sponsor AND owner_kind = 'other-worlds' AND owner_id = NEW.claim_id
  );
END;

CREATE TRIGGER IF NOT EXISTS tezos_lock_guard_global_insert
BEFORE INSERT ON tezos_sponsor_locks
WHEN EXISTS (
  SELECT 1 FROM other_worlds_sponsor_locks
  WHERE sponsor = NEW.sponsor
    AND NOT (NEW.owner_kind = 'other-worlds' AND claim_id = NEW.owner_id)
)
BEGIN
  SELECT RAISE(IGNORE);
END;

CREATE TRIGGER IF NOT EXISTS tezos_lock_mirror_global_insert
AFTER INSERT ON tezos_sponsor_locks
WHEN NEW.owner_kind = 'other-worlds'
BEGIN
  INSERT INTO other_worlds_sponsor_locks(sponsor, claim_id, acquired_at)
  SELECT NEW.sponsor, NEW.owner_id, NEW.acquired_at
  WHERE NOT EXISTS (
    SELECT 1 FROM other_worlds_sponsor_locks
    WHERE sponsor = NEW.sponsor AND claim_id = NEW.owner_id
  );
END;

CREATE TRIGGER IF NOT EXISTS tezos_lock_mirror_legacy_delete
AFTER DELETE ON other_worlds_sponsor_locks
BEGIN
  DELETE FROM tezos_sponsor_locks
  WHERE sponsor = OLD.sponsor AND owner_kind = 'other-worlds' AND owner_id = OLD.claim_id;
END;

CREATE TRIGGER IF NOT EXISTS tezos_lock_mirror_global_delete
AFTER DELETE ON tezos_sponsor_locks
WHEN OLD.owner_kind = 'other-worlds'
BEGIN
  DELETE FROM other_worlds_sponsor_locks
  WHERE sponsor = OLD.sponsor AND claim_id = OLD.owner_id;
END;

CREATE TABLE IF NOT EXISTS agent_cabinet_intents (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL CHECK (length(request_hash) = 64),
  agent_id TEXT,

  offer_slug TEXT NOT NULL,
  offer_revision TEXT NOT NULL CHECK (length(offer_revision) = 64),
  config_hash TEXT NOT NULL CHECK (length(config_hash) = 64),
  recipient TEXT NOT NULL,
  contract TEXT NOT NULL,
  token_id TEXT NOT NULL,
  sponsor TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity = 1),
  supply_cap INTEGER NOT NULL CHECK (supply_cap > 0),
  artifact_uri TEXT NOT NULL,
  artifact_sha256 TEXT NOT NULL CHECK (length(artifact_sha256) = 64),
  metadata_uri TEXT NOT NULL,
  metadata_sha256 TEXT NOT NULL CHECK (length(metadata_sha256) = 64),

  price_units INTEGER NOT NULL CHECK (price_units > 0),
  payment_network TEXT NOT NULL,
  payment_asset TEXT NOT NULL,
  payment_pay_to TEXT NOT NULL,

  challenge_nonce TEXT NOT NULL UNIQUE,
  challenge_message TEXT NOT NULL,
  challenge_payload TEXT NOT NULL,
  challenge_expires_at INTEGER NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'verified', 'expired')),
  collect_request_hash TEXT
    CHECK (collect_request_hash IS NULL OR length(collect_request_hash) = 64),
  proof_hash TEXT,
  proof_public_key TEXT,

  payment_status TEXT NOT NULL DEFAULT 'required'
    CHECK (payment_status IN ('required', 'settling', 'ambiguous', 'refused', 'settled')),
  payment_authorization_hash TEXT UNIQUE,
  -- Distinguishes two concurrent HTTP requests carrying the same reusable
  -- Payment-Signature. Only the request which acquired this exact reservation
  -- may roll it back after a locally proven no-submission outcome.
  payment_attempt_id TEXT UNIQUE
    CHECK (payment_attempt_id IS NULL OR length(payment_attempt_id) = 36),
  payment_attempt_json TEXT
    CHECK (payment_attempt_json IS NULL OR json_valid(payment_attempt_json)),
  payment_evidence_json TEXT
    CHECK (payment_evidence_json IS NULL OR json_valid(payment_evidence_json)),
  payment_reconciled_at INTEGER,
  payment_tx_hash TEXT UNIQUE,
  payment_receipt_hash TEXT,
  payment_receipt_json TEXT
    CHECK (payment_receipt_json IS NULL OR json_valid(payment_receipt_json)),
  payer TEXT,

  delivery_status TEXT NOT NULL DEFAULT 'blocked'
    CHECK (delivery_status IN ('blocked', 'reserved', 'preparing', 'signed', 'submitted', 'confirmed', 'failed')),
  signed_bytes TEXT,
  operation_hash TEXT UNIQUE,
  maximum_cost_mutez INTEGER NOT NULL DEFAULT 0 CHECK (maximum_cost_mutez >= 0),
  confirmed_at INTEGER,
  last_error TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS agent_cabinet_offer_capacity_idx
  ON agent_cabinet_intents(offer_slug, config_hash, delivery_status);
CREATE INDEX IF NOT EXISTS agent_cabinet_recipient_idx
  ON agent_cabinet_intents(offer_slug, recipient, delivery_status);
-- Quoted/approved intents do not consume an edition.  The atomic transition
-- from blocked to reserved is the collection boundary and enforces one
-- collected edition of an offer per Tezos wallet.
CREATE UNIQUE INDEX IF NOT EXISTS agent_cabinet_one_collected_per_wallet_idx
  ON agent_cabinet_intents(offer_slug, recipient)
  WHERE delivery_status <> 'blocked';
CREATE INDEX IF NOT EXISTS agent_cabinet_payment_idx
  ON agent_cabinet_intents(payment_status, updated_at);
CREATE INDEX IF NOT EXISTS agent_cabinet_delivery_idx
  ON agent_cabinet_intents(delivery_status, updated_at);
CREATE INDEX IF NOT EXISTS agent_cabinet_challenge_recipient_rate_idx
  ON agent_cabinet_intents(recipient, created_at);
CREATE INDEX IF NOT EXISTS agent_cabinet_challenge_global_rate_idx
  ON agent_cabinet_intents(created_at);

CREATE TABLE IF NOT EXISTS agent_cabinet_readiness (
  config_hash TEXT PRIMARY KEY,
  verified_at INTEGER NOT NULL
);
