PRAGMA foreign_keys = ON;

CREATE TABLE subscribers (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  user_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  confirmed_at TEXT,
  last_sent_day TEXT,
  tz TEXT NOT NULL DEFAULT 'America/Los_Angeles',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX subscribers_user_id_idx ON subscribers(user_id);
CREATE INDEX subscribers_status_sent_idx ON subscribers(status, last_sent_day);

CREATE TABLE kennel_daily_runs (
  day TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  attempted INTEGER NOT NULL DEFAULT 0,
  sent INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  dry_run INTEGER NOT NULL DEFAULT 0,
  configured INTEGER NOT NULL DEFAULT 0
);
