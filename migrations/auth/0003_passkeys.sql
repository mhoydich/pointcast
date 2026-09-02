PRAGMA foreign_keys = ON;

CREATE TABLE passkey_credentials (
  credential_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  public_key BLOB NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  transports TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(transports)),
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  label TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX passkey_credentials_user_id_idx
  ON passkey_credentials(user_id);
