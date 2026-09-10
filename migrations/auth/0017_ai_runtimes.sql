-- Owner-paired native runtimes. No provider credentials are stored here.
CREATE TABLE IF NOT EXISTS ai_runtimes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  pair_hash TEXT UNIQUE,
  pair_expires_at INTEGER,
  token_hash TEXT UNIQUE,
  token_expires_at INTEGER,
  providers_json TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER,
  last_success_at INTEGER
);
CREATE INDEX IF NOT EXISTS ai_runtimes_owner ON ai_runtimes(user_id);
CREATE TABLE IF NOT EXISTS ai_runtime_jobs (
  id TEXT PRIMARY KEY,
  runtime_id TEXT NOT NULL REFERENCES ai_runtimes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('login', 'prompt')),
  request_id TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('codex', 'claude')),
  model TEXT,
  prompt TEXT,
  status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  lease_hash TEXT,
  login_json TEXT,
  result_json TEXT,
  error TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  finished_at INTEGER
);
-- A runtime can never be leased for two simultaneous jobs.
CREATE UNIQUE INDEX IF NOT EXISTS ai_runtime_one_active_job
  ON ai_runtime_jobs(runtime_id) WHERE status IN ('queued', 'running');
CREATE INDEX IF NOT EXISTS ai_runtime_jobs_owner ON ai_runtime_jobs(user_id, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS ai_runtime_job_request ON ai_runtime_jobs(user_id, request_id);
