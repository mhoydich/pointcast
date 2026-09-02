PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  created_at TEXT NOT NULL
);

CREATE TABLE identities (
  provider TEXT NOT NULL,
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  PRIMARY KEY (provider, id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE oauth_states (
  state TEXT PRIMARY KEY,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  expires_at INTEGER NOT NULL
);

CREATE INDEX identities_user_id_idx ON identities(user_id);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);
CREATE INDEX oauth_states_expires_at_idx ON oauth_states(expires_at);
