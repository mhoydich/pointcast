PRAGMA foreign_keys = ON;

-- Only opaque provider/alias hashes and operational outcomes live here. No
-- message content or recipient identity is retained.
CREATE TABLE post_office_deliveries (
  delivery_id TEXT PRIMARY KEY CHECK (length(delivery_id) = 64),
  webhook_hash TEXT NOT NULL CHECK (length(webhook_hash) = 64),
  alias_hash TEXT NOT NULL CHECK (length(alias_hash) = 64),
  day TEXT NOT NULL,
  downstream_idempotency_key TEXT NOT NULL UNIQUE,
  provider_accepted INTEGER NOT NULL DEFAULT 1 CHECK (provider_accepted IN (0, 1)),
  outcome TEXT NOT NULL CHECK (outcome IN ('reserved', 'forwarded', 'bounced', 'unroutable', 'rate_limited', 'failed')),
  error TEXT,
  accepted_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE UNIQUE INDEX post_office_deliveries_provider_alias_idx
  ON post_office_deliveries(webhook_hash, alias_hash);
CREATE INDEX post_office_deliveries_day_alias_idx
  ON post_office_deliveries(day, alias_hash, outcome);

CREATE TABLE post_office_daily_counters (
  day TEXT NOT NULL,
  scope TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (day, scope)
);

CREATE TABLE post_office_counter_locks (
  day TEXT PRIMARY KEY,
  holder TEXT,
  expires_at INTEGER
);
