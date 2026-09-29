-- Early Shift + the Desk (/r/desk, /r/agent/[call]): agents file facts and put
-- out calls, never points, stamps or cash. Additive only: two new tables,
-- their indexes and one new index on air_reports; no 0023 or 0024 column or
-- constraint changes. Apply to AUTH_DB with
-- `wrangler d1 execute` before the early-shift Worker and the Pages deploy;
-- old code never reads either table.
--
-- Agent rows live in air_reports (0023): source 'agent:<call>', a source_url,
-- onsite 0, awarded_at NULL forever. Their pid_hash is
-- hash16('air:agent:v1:' || call) and their ip_hash hash16('air:agent:v1')
-- (agentRowOf() in functions/_lib/air-desk.mjs). Agent stamps, the record and
-- On time are computed at read time from these tables; no agent ever gets an
-- air_points or air_stamps row.

-- One row per LA morning per feed (sky, tides, swell, sun, air): what the
-- early shift did. A later run upgrades a gap to filed and never files twice.
-- 'blocked' means the house has not set the feed's key; it never counts
-- against On time. `at` is when the row was written (server time).
CREATE TABLE IF NOT EXISTS air_shift_feeds (
  day TEXT NOT NULL, feed TEXT NOT NULL, agent TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('filed','gap')),
  reason TEXT CHECK (reason IS NULL OR reason IN ('blocked','upstream','stale','shape')),
  report_id TEXT, at INTEGER NOT NULL,
  PRIMARY KEY (day, feed),
  CHECK ((outcome = 'filed' AND report_id IS NOT NULL AND reason IS NULL) OR (outcome = 'gap' AND report_id IS NULL AND reason IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS air_shift_feeds_agent ON air_shift_feeds(agent, day);

-- A call from the desk: an agent asks the next person on site one bucketed
-- desk-kind question (desk: true in src/data/air-spots.json). The asker's
-- belief is its own agent row (report_id). holder is who the call sits with
-- now; relay_json is the pass chain, [{from, to, reason, at}]. One open call
-- per spot (the partial unique index), 48 hours at most. An on-site answer is
-- a normal report; answered_report_id points at it. No free-text column.
CREATE TABLE IF NOT EXISTS air_calls (
  id TEXT PRIMARY KEY, spot TEXT NOT NULL, kind TEXT NOT NULL,
  asker TEXT NOT NULL, holder TEXT NOT NULL,
  report_id TEXT NOT NULL UNIQUE,          -- the asker's belief row
  day TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','expired')),
  asked_at INTEGER NOT NULL, expires_at INTEGER NOT NULL,
  answered_report_id TEXT, answered_at INTEGER,
  relay_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(relay_json)),
  CHECK (expires_at > asked_at AND expires_at - asked_at <= 172800000),
  CHECK ((status = 'answered') = (answered_report_id IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS air_calls_open_spot ON air_calls(spot) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS air_calls_asker ON air_calls(asker, day);
CREATE INDEX IF NOT EXISTS air_calls_live ON air_calls(spot, kind, expires_at);

-- An agent's own rows by source ('agent:<call>'): the agent card
-- (GET /api/air/desk?agent=, a public read) and the early shift's
-- once-a-day guard select by it, never by scanning every report.
CREATE INDEX IF NOT EXISTS air_reports_source ON air_reports(source, observed_at);
