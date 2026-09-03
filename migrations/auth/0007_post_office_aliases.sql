CREATE TABLE IF NOT EXISTS aliases (
  name TEXT PRIMARY KEY,
  forward_kind TEXT NOT NULL CHECK (forward_kind IN ('email', 'webhook')),
  forward_target TEXT NOT NULL,
  owner TEXT NOT NULL,
  receipt_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  renewed_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  forwarded_count INTEGER NOT NULL DEFAULT 0 CHECK (forwarded_count >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended'))
);

CREATE INDEX IF NOT EXISTS aliases_expires_at_idx ON aliases(expires_at);
CREATE INDEX IF NOT EXISTS aliases_created_at_idx ON aliases(created_at);
CREATE INDEX IF NOT EXISTS aliases_renewed_at_idx ON aliases(renewed_at);

-- An append-only payment index prevents one settled receipt from being used
-- for more than one create/renew action and gives the daily worker an exact
-- event count without retaining mail or forwarding targets.
CREATE TABLE IF NOT EXISTS alias_receipts (
  receipt_hash TEXT PRIMARY KEY,
  alias_name TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'renewed', 'reclaimed')),
  event_at TEXT NOT NULL,
  FOREIGN KEY (alias_name) REFERENCES aliases(name)
);

CREATE INDEX IF NOT EXISTS alias_receipts_event_at_idx ON alias_receipts(event_at);
