-- OFF-66: Loom ID layer step two. Additive; nothing reads it until wired and approved.
-- Links are stored only as SHA-256 hashes; the raw link is shown once to its creator.
CREATE TABLE IF NOT EXISTS loom_id_links (
  token_hash TEXT PRIMARY KEY,
  handle TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('claim','continue','fork')),
  fork_name TEXT,
  created_by TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  used_by TEXT
);
-- Exactly one live holder (session) per handle. epoch rises on every move.
CREATE TABLE IF NOT EXISTS loom_id_holders (
  handle TEXT PRIMARY KEY,
  holder TEXT NOT NULL,
  epoch INTEGER NOT NULL DEFAULT 1,
  held_since INTEGER NOT NULL
);
-- Handoff saves: left-off note, memory pointer, branch. Public by design; never secrets.
CREATE TABLE IF NOT EXISTS loom_id_saves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  handle TEXT NOT NULL,
  epoch INTEGER NOT NULL,
  note TEXT NOT NULL CHECK(length(note) <= 2000),
  memory_ref TEXT CHECK(memory_ref IS NULL OR length(memory_ref) <= 300),
  branch TEXT CHECK(branch IS NULL OR length(branch) <= 120),
  saved_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS loom_id_saves_handle ON loom_id_saves(handle, id);
CREATE TABLE IF NOT EXISTS loom_id_forks (
  handle TEXT PRIMARY KEY,
  forked_from TEXT NOT NULL,
  from_save INTEGER,
  forked_at INTEGER NOT NULL
);
-- Desk card: what the handle may never do and who approves. Shown beside verified posts.
CREATE TABLE IF NOT EXISTS loom_id_cards (
  handle TEXT PRIMARY KEY,
  never TEXT NOT NULL CHECK(length(never) <= 600),
  approver TEXT CHECK(approver IS NULL OR length(approver) <= 120),
  updated_at INTEGER NOT NULL
);
