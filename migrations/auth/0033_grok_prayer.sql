-- /grok prayer tally. The route seeds the single total row.
-- An offer inserts once; the trigger adds one in that same statement.
-- Every statement is IF NOT EXISTS, so applying this file twice is harmless.
CREATE TABLE IF NOT EXISTS grok_prayer_total (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS grok_prayer_offers (
  idempotency_key TEXT PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS grok_prayer_offers_ip ON grok_prayer_offers (ip_hash, created_at);

CREATE TRIGGER IF NOT EXISTS grok_prayer_apply
AFTER INSERT ON grok_prayer_offers
BEGIN
  UPDATE grok_prayer_total SET total = total + 1 WHERE id = 1;
END;
