PRAGMA foreign_keys = ON;

CREATE TABLE user_state (
  user_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  version INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
