-- The Loom v2 (docs/setup/loom-v2.md): every Loom thread is an append-only op log, one row per op.
-- An append is one INSERT that takes the next seq for its log, so concurrent writers never overwrite
-- each other (v1 rewrote a whole KV value per append). Ops are never deleted; reads take the newest 600.
-- sender_key is the addressKey of who wrote an append (the outbox); echoes and Collator notes carry none.
CREATE TABLE loom_ops (
 log_key TEXT NOT NULL, seq INTEGER NOT NULL CHECK(seq > 0),
 op_json TEXT NOT NULL CHECK(json_valid(op_json)),
 sender_key TEXT, at TEXT NOT NULL,
 PRIMARY KEY (log_key, seq)
);
CREATE INDEX loom_ops_sender ON loom_ops(sender_key, at) WHERE sender_key IS NOT NULL;
-- One row per thread: what its address is, and summary_json {count, last}, a cache the directory reads
-- so it never folds every log. The ops are the truth; the cache is rewritten after every append.
CREATE TABLE loom_logs (
 key TEXT PRIMARY KEY, address TEXT NOT NULL, kind TEXT NOT NULL, label TEXT NOT NULL, title TEXT,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 summary_json TEXT CHECK(summary_json IS NULL OR json_valid(summary_json))
);
CREATE INDEX loom_logs_updated ON loom_logs(updated_at);
