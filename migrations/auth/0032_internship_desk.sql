-- DRAFT ONLY. Do not apply until the separate authentication prerequisite and
-- this private-desk release have passed review. No new binding is required.
-- This is an expression-of-interest / human-managed learning workspace,
-- not an application, hiring, work assignment, credential or deployment system.
PRAGMA foreign_keys = ON;

CREATE TABLE internship_desk_records (
  record_id TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('human', 'bot')),
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  version INTEGER NOT NULL CHECK (version >= 1),
  status TEXT NOT NULL CHECK (status IN ('draft', 'interest_received', 'review_requested', 'changes_requested', 'reviewed')),
  interest_at INTEGER,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  submitted_version INTEGER,
  submitted_payload_json TEXT CHECK (submitted_payload_json IS NULL OR json_valid(submitted_payload_json)),
  review_json TEXT CHECK (review_json IS NULL OR json_valid(review_json)),
  PRIMARY KEY (owner_id, kind),
  CHECK ((submitted_version IS NULL) = (submitted_payload_json IS NULL)),
  CHECK (status = 'draft' OR interest_at IS NOT NULL),
  CHECK (status NOT IN ('review_requested', 'changes_requested', 'reviewed') OR submitted_version IS NOT NULL),
  CHECK (status NOT IN ('changes_requested', 'reviewed') OR review_json IS NOT NULL)
);
CREATE INDEX internship_desk_expiry ON internship_desk_records(expires_at);
CREATE INDEX internship_desk_queue ON internship_desk_records(updated_at DESC, owner_id, kind) WHERE interest_at IS NOT NULL;

-- One atomic counter per authenticated actor per UTC hour, shared by owner
-- and director writes. Rejected CAS attempts consume budget too. No IPs.
CREATE TABLE internship_desk_write_rates (
  actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL CHECK (count BETWEEN 1 AND 60),
  PRIMARY KEY (actor_id, window_start)
);
CREATE INDEX internship_desk_rates_window ON internship_desk_write_rates(window_start);

-- Retention: owner writes renew a record for 90 days. Director review does
-- not extend retention. Reads always exclude expired records; authenticated
-- desk requests delete at most 50 expired records and 100 old rate rows.
-- An owner's expired records are also purged (at most two). Owner deletion
-- removes the entire record, submission snapshot and latest review. Rate
-- counters retain no content and expire separately at the end of the hour.
-- There is no scheduled purge or historical review archive. Inactive expired
-- rows remain inaccessible until the next bounded desk cleanup.
