CREATE TABLE IF NOT EXISTS inbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  webhook_id TEXT NOT NULL UNIQUE,
  resend_email_id TEXT NOT NULL UNIQUE,
  from_address TEXT NOT NULL,
  to_addresses TEXT NOT NULL,
  subject TEXT NOT NULL,
  text TEXT NOT NULL,
  received_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS inbox_received_at_idx ON inbox(received_at DESC);
