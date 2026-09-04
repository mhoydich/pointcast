PRAGMA foreign_keys = ON;

-- Rewarded runs: a trip to a satellite that can end in one ledger line.
--
-- PointCast keeps the account-to-run mapping here and never tells the
-- satellite whose run it is; the satellite only ever sees the run id. The
-- protocol both sides implement is docs/plans/2026-09-05-rewards-protocol.md.
--
-- `status` is the whole life of a run:
--   open       launched, the person is over there
--   completed  a receipt has been seen but not yet redeemed
--   redeemed   a ledger line was written; `redeemed_claim_id` names it
--   resolved   finished, but awarded nothing, truthfully (already claimed
--              today, or the town-wide cap was full). Recording this is what
--              stops an old completion becoming a fresh entitlement tomorrow.
--   expired    the two hour lifetime ran out with nothing to show
CREATE TABLE reward_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL,
  program TEXT NOT NULL,
  faucet TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'completed', 'redeemed', 'resolved', 'expired')),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  launch_nonce TEXT NOT NULL,
  receipt_nonce TEXT,
  redeemed_claim_id TEXT,
  resolved_reason TEXT
);

CREATE INDEX reward_runs_user_program_idx ON reward_runs(user_id, program, status);

-- Single use, enforced by the primary key rather than by a read-then-write.
-- Consuming a receipt and writing its ledger line happen in one D1 batch, so
-- two browsers racing the same receipt leave exactly one line: the loser's
-- whole transaction rolls back on this key, and it reads `claim_id` to return
-- the winner's line instead of writing a second one.
--
-- Keep these rows through at least receipt expiry plus a clock allowance. They
-- are the durable record that a given receipt is spent; the full signed receipt
-- is never stored here or logged anywhere.
CREATE TABLE reward_receipts (
  issuer TEXT NOT NULL,
  nonce TEXT NOT NULL,
  run_id TEXT NOT NULL,
  consumed_at TEXT NOT NULL,
  claim_id TEXT,
  PRIMARY KEY (issuer, nonce)
);

-- Server-written provenance on the claim itself. NULL on every ordinary drip
-- and on every row written before this migration, so existing HELLO rows stay
-- valid untouched. A `via` query parameter grants nothing; only a verified
-- receipt writes these three columns.
--
-- functions/api/faucet/_claims.ts adds the same columns by guarded ALTER on
-- first request, for deploys that never run migrations.
ALTER TABLE faucet_claims ADD COLUMN via TEXT;
ALTER TABLE faucet_claims ADD COLUMN program TEXT;
ALTER TABLE faucet_claims ADD COLUMN reward_run_id TEXT;

INSERT INTO faucet_locks (faucet, holder, acquired_at) VALUES ('fishclub', NULL, NULL);
