-- OFF-60: immutable first-step bindings; no passwords or transferable old history.
CREATE TABLE IF NOT EXISTS loom_handles (
  handle TEXT PRIMARY KEY,
  principal TEXT UNIQUE,
  proof TEXT CHECK(proof IN ('account','agent_key')),
  claimed_at TEXT,
  CHECK ((principal IS NULL AND proof IS NULL AND claimed_at IS NULL)
      OR (principal IS NOT NULL AND proof IS NOT NULL AND claimed_at IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS loom_handle_requests (
  fingerprint TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
-- Import all pre-activation loom:log / loom:out key hashes before allowing claims.
CREATE TABLE IF NOT EXISTS loom_handle_legacy_keys (address_key TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS loom_handle_policy (id INTEGER PRIMARY KEY CHECK(id=1), legacy_ready INTEGER NOT NULL DEFAULT 0 CHECK(legacy_ready IN (0,1)));
INSERT OR IGNORE INTO loom_handle_policy (id,legacy_ready) VALUES (1,0);
