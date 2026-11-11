# The Loom v2: atomic appends on D1

The Loom launched on 2026-10-20 with KV storage. Each thread was one KV value,
rewritten on every append. Two appends to one thread within about a second could
each read the old value, and the later write erased the earlier message. v2 fixes
that and nothing else. The API and protocol are unchanged (`pointcast.loom/v1`).

## What changed

- **One row per op.** Every op is a row in `loom_ops` (migration
  `migrations/auth/0035_loom.sql`, in `AUTH_DB` like the other feature tables).
  An append is a single `INSERT … SELECT MAX(seq)+1`, so seq assignment and the
  write are one atomic statement. Concurrent writers each get the next number.
- **Nothing is overwritten or deleted.** Edits, votes and hides are new rows, as
  before. Reads return the newest 600 ops per thread; older rows stay in the table.
- **No second copies.** The directory reads `loom_logs`, and an outbox is a query
  on `loom_ops.sender_key`. `loom_logs.summary_json` caches each thread's count
  and last message for the directory; it only moves forward (guarded by seq), so
  out-of-order writers cannot regress it.
- **Polls cost a small read.** A poll with `since=N` reads rows for one thread,
  not a whole KV value.

## Moving over from KV

- KV is not migrated in bulk. A thread that exists only in KV is read from KV,
  and its first new write imports all its v1 ops with their original seq numbers
  and edit-token hashes. The import is `INSERT OR IGNORE` on `(log_key, seq)`, so
  running it twice is harmless.
- The directory and outboxes merge D1 with the KV copies, newest first.
- **Order doesn't matter.** Until migration 0035 has run, D1 answers "no such
  table" and every call falls through to KV, so the code can deploy before or
  after the migration.

To switch on, run the "D1 migrations (pointcast-auth)" workflow from the Actions
tab with `apply` (`.github/workflows/d1-migrations.yml`), or from a machine with
wrangler signed in:

```sh
npx wrangler d1 migrations apply pointcast-auth --remote
curl -s 'https://pointcast.xyz/api/loom?to=%23loom' | grep -o '"storage":"[a-z0-9]*"'   # → "storage":"d1"
```

## Deferred, not dropped

A fuller v2 was built and tested on 2026-10-21 and is kept in this PR's history
at commit `4a33095f`:

- A Durable Object per thread, with live WebSocket push.
- End-to-end sealed DMs: ECDH P-256 + AES-GCM, with an inbox key directory.
- A `/.well-known/loom.json` peer handshake.

At the Loom's traffic in November 2026 (six threads, about ten messages), none of
those paid for its extra Worker, crypto review and upkeep. Bring them back when:

- Polling is visibly too slow, for live push.
- Someone needs to send something that must not be public, for sealed DMs.
- A second site runs a Loom, for peers.

## Verify locally

```sh
node --test tests/loom.test.mjs tests/loom-d1.test.mjs
```

The same flows were also run once against the real D1 engine (Miniflare) on
2026-11-11: fallback before the migration, import, 40 concurrent appends with
ripple, directory, outbox, seed and poll.

`tests/loom-d1.test.mjs` runs the real migration on `node:sqlite` with a few
milliseconds of delay per call. It covers four cases:

- 40 concurrent appends all land, with seq 1 to 40; the same rush on KV loses
  messages.
- Seed threads are imported.
- Before the migration, everything falls back to KV.
- After it, KV threads are imported, old edit tokens keep working, and the
  directory and outboxes are merged.
