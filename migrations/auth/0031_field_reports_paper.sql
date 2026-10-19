-- Field Reports v2: the paper and the honest count
-- (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §1).
-- New tables only; every statement is CREATE ... IF NOT EXISTS, so a second
-- apply is a no-op. Apply to AUTH_DB before the morning-daily Worker deploy
-- and before the Pages deploy. Until it is applied: /api/air/killtest and
-- /api/air/house answer 503, the edition's busiest-court pick falls back to
-- the Manhattan Middle courts spot, and /api/morning/subscribe answers 503.

-- The house list. kind 'pid' holds a phone's pid_hash, kind 'user' an account
-- id. Accounts with the broadcaster or director role (or the linked director
-- wallet) are house without a row. Marking a phone also excludes its earlier
-- rows, because every count reads this table at count time.
CREATE TABLE IF NOT EXISTS air_house (
  kind TEXT NOT NULL CHECK (kind IN ('pid', 'user')),
  value TEXT NOT NULL,
  note TEXT,
  added_at INTEGER NOT NULL,
  PRIMARY KEY (kind, value)
);

-- Morning Edition email, double opt-in. A row is 'pending' until its confirm
-- link is opened. `token` is the stable unsubscribe token (43 chars,
-- base64url). confirm_hash is the sha256 hex of the one-time confirm token;
-- the raw token exists only inside the morning-daily Worker and the email.
-- confirm_sent_at NULL means no confirm mail has gone out yet (the signup came
-- in while the paper's mail was off); the Worker sends those on every tick.
-- confirm_attempts and confirm_last_attempt_at count confirm sends tried,
-- refused ones included: the sweep tries rows never tried first, stops after
-- 5, and prunes a given-up row 30 days after its last try. The confirm hash
-- stays on a confirmed row, so a second click answers "confirmed"; unsubscribe
-- clears it.
CREATE TABLE IF NOT EXISTS edition_subscribers (
  email TEXT PRIMARY KEY COLLATE NOCASE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  token TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'morning' CHECK (source IN ('morning', 'receipt', 'card', 'rss', 'other')),
  user_id TEXT,
  created_at INTEGER NOT NULL,
  confirm_hash TEXT,
  confirm_expires_at INTEGER,
  confirm_sent_at INTEGER,
  confirmed_at INTEGER,
  unsubscribed_at INTEGER,
  last_sent_day TEXT,
  confirm_attempts INTEGER NOT NULL DEFAULT 0,
  confirm_last_attempt_at INTEGER,
  CHECK ((confirm_hash IS NULL) = (confirm_expires_at IS NULL))
);
CREATE INDEX IF NOT EXISTS edition_subscribers_send ON edition_subscribers(status, last_sent_day);
CREATE INDEX IF NOT EXISTS edition_subscribers_unsent ON edition_subscribers(status, confirm_sent_at);
CREATE UNIQUE INDEX IF NOT EXISTS edition_subscribers_confirm ON edition_subscribers(confirm_hash) WHERE confirm_hash IS NOT NULL;

-- One row per LA day the morning-daily Worker reached the send step
-- (like kennel_daily_runs, plus the edition and a reason). Times are epoch ms.
-- A run writes 'started' (finished_at NULL) before it reads the edition, so a
-- run the runtime kills still leaves a row; 'out-of-time' means the send loop
-- stopped before the invocation limit and a later tick that day finishes it.
-- A later real run that day adds its counts to the row instead of replacing it.
CREATE TABLE IF NOT EXISTS morning_daily_runs (
  day TEXT PRIMARY KEY,
  edition_number INTEGER,
  frozen INTEGER NOT NULL DEFAULT 0 CHECK (frozen IN (0, 1)),
  reason TEXT CHECK (reason IS NULL OR reason IN ('started', 'not-frozen', 'email-not-configured', 'no-subscribers', 'out-of-time')),
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  attempted INTEGER NOT NULL DEFAULT 0,
  sent INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  dry_run INTEGER NOT NULL DEFAULT 0 CHECK (dry_run IN (0, 1)),
  configured INTEGER NOT NULL DEFAULT 0 CHECK (configured IN (0, 1))
);

-- The kill test's Oct 24 read, kept as first taken (like a frozen edition):
-- the first final GET /api/air/killtest writes it, every later one reads it
-- back and shows any different live figure beside it as a recount. Numbers
-- only. pass is 0/1; read_at is epoch ms.
CREATE TABLE IF NOT EXISTS air_killtest_reads (
  read_on TEXT PRIMARY KEY,
  reports INTEGER NOT NULL,
  people INTEGER NOT NULL,
  pass INTEGER NOT NULL CHECK (pass IN (0, 1)),
  read_at INTEGER NOT NULL
);
