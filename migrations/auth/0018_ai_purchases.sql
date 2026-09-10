-- Private owner receipts survive removal of a paired runtime. Provider secrets,
-- wallet authorizations and signatures are never retained in this ledger.
CREATE TABLE ai_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  runtime_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  question TEXT NOT NULL,
  quote_json TEXT NOT NULL CHECK(json_valid(quote_json)),
  quote_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  action_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK(status IN ('quoted','submitting','unresolved','failed','delivered','expired')),
  payment_hash TEXT UNIQUE,
  payer TEXT,
  action_id TEXT,
  transaction_hash TEXT,
  receipt_json TEXT,
  result_json TEXT,
  receipt_verified INTEGER NOT NULL DEFAULT 0,
  chain_verified INTEGER NOT NULL DEFAULT 0,
  delivery_verified INTEGER NOT NULL DEFAULT 0,
  proof_checked_at INTEGER,
  error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, request_id)
);
CREATE INDEX ai_purchases_owner ON ai_purchases(user_id, created_at DESC);
CREATE UNIQUE INDEX ai_purchases_transaction ON ai_purchases(transaction_hash) WHERE transaction_hash IS NOT NULL;
-- An unknown settlement cannot be escaped by simply making a second quote.
CREATE UNIQUE INDEX ai_purchases_one_pending ON ai_purchases(user_id)
  WHERE status IN ('quoted','submitting','unresolved');
