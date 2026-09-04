PRAGMA foreign_keys = ON;

-- The subscriber token remains a reusable unsubscribe capability. Daily mail
-- authentication uses a separate, short-lived, single-use bearer whose raw
-- value is never stored.
CREATE TABLE collect_login_tokens (
  token_hash TEXT PRIMARY KEY,
  subscriber_email TEXT NOT NULL,
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  revoked_at INTEGER,
  sent_day TEXT NOT NULL,
  FOREIGN KEY (subscriber_email) REFERENCES subscribers(email) ON DELETE CASCADE,
  CHECK (expires_at > issued_at)
);

CREATE INDEX collect_login_tokens_subscriber_idx
  ON collect_login_tokens(subscriber_email, issued_at DESC);
CREATE INDEX collect_login_tokens_expiry_idx
  ON collect_login_tokens(expires_at);

-- Sessions remember the instant at which the identity was proved. Rotation of
-- a long-lived session must preserve this value so it cannot manufacture a
-- fresh authentication event.
ALTER TABLE sessions ADD COLUMN authenticated_at INTEGER NOT NULL DEFAULT 0;
