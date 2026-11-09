-- Network Points: one open, append-only, hash-chained points ledger.
-- Collectible marks only: no cash value, never sold, redeemed or traded for money.
-- Members join by choice; profile is an opaque hash (drumMemberKey of the user id).
-- handle is optional and set only by the member, so a shared profile (elsegundo.xyz
-- /profiles/<handle>.json) can read the ledger by handle. Readers check the profile's
-- sites.pointcast.drummer against the returned hash before trusting the join.
CREATE TABLE points_profiles (
 profile TEXT PRIMARY KEY,
 user_id TEXT NOT NULL UNIQUE,
 display_name TEXT,
 handle TEXT UNIQUE,
 joined_at TEXT NOT NULL
);
CREATE TABLE points_ledger (
 seq INTEGER PRIMARY KEY AUTOINCREMENT,
 id TEXT NOT NULL UNIQUE,
 prev TEXT NOT NULL,
 profile TEXT NOT NULL REFERENCES points_profiles(profile),
 kind TEXT NOT NULL,
 points INTEGER NOT NULL CHECK(points >= 0 AND points <= 100),
 note TEXT CHECK(note IS NULL OR (length(note) BETWEEN 1 AND 24 AND note NOT GLOB '*[^a-z0-9-]*')),
 edition TEXT NOT NULL,
 site TEXT NOT NULL,
 ref TEXT NOT NULL,
 day TEXT NOT NULL,
 place TEXT NOT NULL DEFAULT '',
 at TEXT NOT NULL,
 UNIQUE(profile, kind, ref),
 UNIQUE(profile, prev)
);
CREATE INDEX points_ledger_profile ON points_ledger(profile, seq);
CREATE INDEX points_ledger_recent ON points_ledger(seq DESC);
