-- Separate from PR1475's loom_ops and PR1688's confirm-card migration0035.
-- Apply only through an approved cutover; see docs/setup/loom-atomic.md.
CREATE TABLE loom_atomic_state (
 singleton INTEGER PRIMARY KEY CHECK(singleton = 1),
 revision INTEGER NOT NULL CONSTRAINT loom_revision_matches CHECK(revision >= 0)
);
INSERT INTO loom_atomic_state(singleton, revision) VALUES (1, 0);
CREATE TABLE loom_atomic_values (
 key TEXT PRIMARY KEY CHECK(key LIKE 'loom:%'),
 value TEXT NOT NULL
);
