-- Field Report Assignments (/r/assign), phase 1: points and a stamp, never cash.
-- Additive only: two new tables and their indexes; nothing in 0023 changes.
-- Apply to AUTH_DB with `wrangler d1 execute` before the Pages deploy; until
-- then every assignment statement fails inside its own try/catch and reports,
-- confirms and spot pages carry on without it.
--
-- An assignment is a template, a date and a seat count (templates in
-- src/data/air-spots.json, rules in functions/_lib/air-assign.mjs). Only the
-- house creates one (the director session, hasDirectorDeskAccess). There is no
-- free-text column: void_reason is the director's own note, read on
-- /r/assign by directors only. Voiding never takes back a filled seat.

CREATE TABLE IF NOT EXISTS air_assignments (
  id TEXT PRIMARY KEY,                -- newAirId('aa')
  spot TEXT NOT NULL,
  kind TEXT NOT NULL,
  template TEXT NOT NULL,
  starts_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  seats INTEGER NOT NULL CHECK (seats BETWEEN 1 AND 3),
  reward INTEGER NOT NULL CHECK (reward BETWEEN 0 AND 10),
  created_by TEXT NOT NULL,           -- 'user:<id>'
  created_at INTEGER NOT NULL,
  voided_at INTEGER,
  void_reason TEXT,
  CHECK (ends_at > starts_at AND ends_at - starts_at <= 14400000)
);
CREATE INDEX IF NOT EXISTS air_assignments_live ON air_assignments(spot, kind, ends_at);

-- One row = one filled seat = the ASSIGNMENT stamp. A seat fills on the proof
-- a report pays on (the spot code, observed_at inside the window, a real
-- answer; "Can't say" never fills). The reward is the assignment's flat
-- reward, outside the 30/day report cap, two fills a day at most; it never
-- depends on the answer. witnessed_at is the WITNESSED mark: an on-site
-- "still" from another network. It never holds up or changes the reward.
-- net is 'user:<id>' or the report's ip_hash (netOf in air-reading.mjs); no
-- view ever selects it, or owner. report_id UNIQUE makes a retry, a same-slot
-- replacement or a remote report turning on-site fill at most once.
CREATE TABLE IF NOT EXISTS air_assignment_fills (
  assignment_id TEXT NOT NULL,
  report_id TEXT NOT NULL UNIQUE,
  owner TEXT NOT NULL,
  net TEXT NOT NULL,
  day TEXT NOT NULL,
  reward INTEGER NOT NULL CHECK (reward >= 0),
  witnessed_at INTEGER,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (assignment_id, owner),
  UNIQUE (assignment_id, net)
);
CREATE INDEX IF NOT EXISTS air_assignment_fills_owner ON air_assignment_fills(owner, day);
