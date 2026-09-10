-- Pool Together: the land-to-park register. Pledges are wallet-signed intents
-- (one row per wallet per lot, atomic upsert); nonces are consumed with a
-- primary-key insert so a signed message can be accepted once; memos are one
-- row each so a sealed (paid) memo can never be lost to a list rewrite.
-- Nothing in these tables represents money held.
CREATE TABLE pool_together_pledges (
  lot TEXT NOT NULL,
  chain TEXT NOT NULL CHECK(chain IN ('tezos','evm')),
  address TEXT NOT NULL,
  amount_usd INTEGER NOT NULL CHECK(amount_usd >= 0),
  via TEXT NOT NULL DEFAULT '',
  issued_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (lot, chain, address)
);
CREATE INDEX pool_together_pledges_recent ON pool_together_pledges(lot, updated_at DESC);

CREATE TABLE pool_together_nonces (
  nonce TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

CREATE TABLE pool_together_memos (
  id TEXT PRIMARY KEY,
  lot TEXT NOT NULL,
  agent TEXT NOT NULL,
  agent_id TEXT,
  apn TEXT,
  address TEXT,
  kind TEXT NOT NULL,
  source TEXT,
  note TEXT NOT NULL DEFAULT '',
  ip_hash TEXT,
  sealed_receipt_hash TEXT,
  sealed_payer TEXT,
  sealed_tx_hash TEXT,
  sealed_action_id TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX pool_together_memos_register ON pool_together_memos(lot, created_at DESC);
CREATE INDEX pool_together_memos_ip ON pool_together_memos(ip_hash, created_at);
CREATE INDEX pool_together_memos_agent ON pool_together_memos(agent, created_at);
