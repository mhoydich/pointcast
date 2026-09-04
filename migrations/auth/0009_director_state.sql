PRAGMA foreign_keys = ON;

CREATE TABLE director_state (
  id TEXT PRIMARY KEY CHECK (length(id) BETWEEN 1 AND 100),
  done INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX director_state_updated_at_idx ON director_state(updated_at DESC);
