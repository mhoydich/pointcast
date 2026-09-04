PRAGMA foreign_keys = ON;

CREATE TABLE kennel_signer_locks (
  lock_name TEXT PRIMARY KEY,
  holder TEXT,
  expires_at INTEGER
);

CREATE TABLE kennel_chain_operations (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL CHECK (action IN ('mint', 'deliver', 'seal-v1', 'seal-v2')),
  subject_id TEXT NOT NULL,
  op_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'applied', 'failed', 'unknown')),
  error TEXT,
  submitted_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX kennel_chain_operations_subject_idx
  ON kennel_chain_operations(action, subject_id, submitted_at DESC);

CREATE TABLE kennel_claim_jobs (
  claim_id TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK (state IN ('reserved', 'submitting', 'submitted', 'confirmed', 'failed')),
  target_status TEXT NOT NULL CHECK (target_status IN ('held', 'delivered')),
  delivered_to TEXT,
  operation_id TEXT,
  error TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
  FOREIGN KEY (operation_id) REFERENCES kennel_chain_operations(id) ON DELETE SET NULL
);

CREATE TABLE kennel_delivery_reservations (
  claim_id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  delivered_to TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('reserved', 'submitting', 'submitted', 'confirmed', 'failed')),
  operation_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (operation_id) REFERENCES kennel_chain_operations(id) ON DELETE SET NULL
);

CREATE INDEX kennel_delivery_reservations_batch_idx
  ON kennel_delivery_reservations(reservation_id, state);
CREATE INDEX kennel_delivery_reservations_user_idx
  ON kennel_delivery_reservations(user_id, state);

ALTER TABLE seal_receipts ADD COLUMN contract_version TEXT;
ALTER TABLE seal_receipts ADD COLUMN contract_address TEXT;
