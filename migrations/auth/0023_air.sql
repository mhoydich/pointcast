-- Field Reports (/r): one observation per phone per spot per 30-minute slot.
-- Reports and confirms are the whole record; points, stamps, firsts and
-- broadcasts are derived and keyed so each pays or posts once. Phones are
-- sha256 of a random device id (pid_hash); IPs are salted by day (ip_hash).
-- Neither hash ever leaves the Functions. Rate limits count rows by
-- created_at (server time), never the client's observed_at. Agents file the same record as
-- 'agent:<name>' with a source_url, never on site, so they never count.
-- morning_editions ships here so PR 2 (Morning Edition) needs no migration.

CREATE TABLE IF NOT EXISTS air_reports (
  id TEXT PRIMARY KEY,
  spot TEXT NOT NULL,
  kind TEXT NOT NULL,
  value TEXT NOT NULL,
  extras_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(extras_json)),
  schema_v INTEGER NOT NULL DEFAULT 1,
  observed_at INTEGER NOT NULL,
  day TEXT NOT NULL,
  slot INTEGER NOT NULL,
  pid_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  user_id TEXT,
  byline TEXT NOT NULL,
  onsite INTEGER NOT NULL DEFAULT 0 CHECK (onsite IN (0,1)),
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok','flagged','removed')),
  source TEXT NOT NULL DEFAULT 'page' CHECK (source = 'page' OR source LIKE 'agent:_%'),
  source_url TEXT,
  created_at INTEGER NOT NULL,
  -- Set once the row's points and stamps are paid. NULL on an on-site row
  -- means it has not paid yet (new, just turned on-site, or a retry).
  awarded_at INTEGER,
  CHECK (source = 'page' OR (onsite = 0 AND source_url IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS air_reports_once ON air_reports(spot, kind, pid_hash, slot);
CREATE INDEX IF NOT EXISTS air_reports_spot ON air_reports(spot, kind, observed_at DESC);
CREATE INDEX IF NOT EXISTS air_reports_user ON air_reports(user_id, day);
CREATE INDEX IF NOT EXISTS air_reports_pid ON air_reports(pid_hash, observed_at);
CREATE INDEX IF NOT EXISTS air_reports_pid_new ON air_reports(pid_hash, created_at);
CREATE INDEX IF NOT EXISTS air_reports_ip ON air_reports(ip_hash, created_at);

CREATE TABLE IF NOT EXISTS air_confirms (
  report_id TEXT NOT NULL,
  pid_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  user_id TEXT,
  verdict TEXT NOT NULL CHECK (verdict IN ('still','changed','cant')),
  -- The report's value when confirmed: what the confirmer saw, even if the
  -- reporter later changes their answer in the same slot.
  value TEXT NOT NULL,
  onsite INTEGER NOT NULL DEFAULT 0 CHECK (onsite IN (0,1)),
  at INTEGER NOT NULL,
  PRIMARY KEY (report_id, pid_hash)
);
CREATE INDEX IF NOT EXISTS air_confirms_pid ON air_confirms(pid_hash, at);
CREATE INDEX IF NOT EXISTS air_confirms_ip ON air_confirms(ip_hash, at);
CREATE INDEX IF NOT EXISTS air_confirms_at ON air_confirms(at);

-- owner is 'user:<id>' or 'dev:<pid_hash>'.
CREATE TABLE IF NOT EXISTS air_points (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('report','first-light','confirm','cant','byline')),
  ref TEXT NOT NULL,
  units INTEGER NOT NULL CHECK (units >= 0),
  day TEXT NOT NULL,
  report_id TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE (owner, action, ref)
);
CREATE INDEX IF NOT EXISTS air_points_owner ON air_points(owner, day);

-- Badges use day '-' (earned once). meta_json carries the stamp's traits
-- ({spot, kind, weekday, hour, crewSize, firstLight, deadAirHours, value})
-- for a future public rarity rating.
CREATE TABLE IF NOT EXISTS air_stamps (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('place','crew','badge')),
  ref TEXT NOT NULL,
  day TEXT NOT NULL,
  report_id TEXT,
  meta_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(meta_json)),
  created_at INTEGER NOT NULL,
  UNIQUE (owner, kind, ref, day)
);

CREATE TABLE IF NOT EXISTS air_firsts (
  spot TEXT NOT NULL,
  day TEXT NOT NULL,
  report_id TEXT NOT NULL,
  PRIMARY KEY (spot, day)
);

-- One station post per spot per kind per decay window; win is '<day>:<windowIdx>'.
-- text is what the post should read now (the crew update rewrites it); the
-- writer reads it back after each KV put, so the last write is always right.
CREATE TABLE IF NOT EXISTS air_broadcasts (
  spot TEXT NOT NULL,
  kind TEXT NOT NULL,
  win TEXT NOT NULL,
  post_id TEXT NOT NULL,
  support INTEGER NOT NULL,
  crew_at INTEGER,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (spot, kind, win)
);

-- One crew per spot per kind per LA day, anchored at its first formation:
-- id is '<spot>:<day>:<windowIdx>' of the third phone, at its epoch ms, n the
-- most phones seen in it. Later phones join this crew; it never re-forms.
CREATE TABLE IF NOT EXISTS air_crews (
  spot TEXT NOT NULL,
  kind TEXT NOT NULL,
  day TEXT NOT NULL,
  id TEXT NOT NULL,
  at INTEGER NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (spot, kind, day)
);

-- code_hash = HMAC-SHA-256(AIR_CODE_PEPPER, 'air-code:' || spot || ':' || CODE),
-- first 32 hex (codeHash() in functions/_lib/air-kinds.mjs). The pepper is a
-- Pages secret; without it no code verifies. Codes are never committed: print
-- the INSERT with scripts/air-codes.mjs and apply it with wrangler d1 execute
-- from an untracked file. Rotating needs no deploy.
CREATE TABLE IF NOT EXISTS air_codes (
  spot TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  valid_from TEXT NOT NULL,
  valid_to TEXT NOT NULL,
  PRIMARY KEY (spot, code_hash)
);

CREATE TABLE IF NOT EXISTS morning_editions (
  date TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  json TEXT NOT NULL CHECK (json_valid(json)),
  frozen_at INTEGER NOT NULL
);
