# Loom lost-write repair: draft cutover plan

This is a **draft**, not a deployed fix. Do not merge or apply migrations from
this document without a separate publication/cutover approval.

## Diagnosis and relationship to existing drafts

PR1707 correctly reproduces the race: two requests read the same serialized
KV room, each returns201, and the last put silently drops the other message.
The 600-op retention cap is unrelated to that below-cap reproduction.
PR1475 proposes per-operation D1 storage but conflicts with current main and
replaces an older service. This smaller alternative keeps the current handler
and atomically commits its complete set of writes. Do not deploy both designs.

## What changes

`atomic.mjs` buffers all mutations the current handler makes: source message,
echoes, Collator/welcome posts, outboxes, room directory, seen marks, edits,
votes, plus and hides. A D1 batch first advances a global revision only if it
matches the revision before the request ran. Otherwise a named CHECK aborts
the **entire transaction**, and the handler reruns against the new state.
Nothing from a failed attempt reaches a client or KV. Successful responses are
released only after the batch commits. Rate-limit calls and drum reads are
memoized across retries. Eight conflicts produce503, not a false201.

All API and bot/For You/topic/sitemap/share-card readers use the new storage.
D1 sessions start on the primary. Ordinary page/cache TTLs still apply; a
cached public page is not an immediate commit receipt. A GET never persists the
handler's opportunistic legacy room-list backfill. Schema, database and archive
read errors fail closed, even where the old service swallowed the error.
There is **no automatic fallback to KV writes**. The legacy KV namespace remains
a read-only archive: a key not yet in D1 reads its legacy value; once updated,
D1 owns it. Original edit-token hashes remain private and continue to work.

This uses D1's documented transactional batch and first-primary session:
https://developers.cloudflare.com/d1/worker-api/d1-database/

## Cutover gates (operator only, NOT performed by this PR)

1. Review this alternative versus PR1475, including production D1 limits and
   cost. This is a correctness-first bridge, not the final per-op architecture.
   Review pending migrations;0036 avoids known0035 drafts but must be checked
   again before applying it. Do not blindly apply all unrelated migrations.
2. Back up the existing Loom KV data. Stop **all** Loom writes, including old
   Pages versions, direct/admin writers and MCP callers; drain in-flight work.
   Freeze the archive and allow KV propagation to settle. A stale/missing KV
   archive snapshot cannot recover already lost posts. Verify source snapshots
   before reopening. Old and new writers must never run concurrently.
3. Apply only the reviewed0036 schema to AUTH_DB. Deploy the reviewed code as
   one cutover while writes remain stopped. Do not deploy before schema exists:
   this intentionally returns503 rather than silently keeping the unsafe path.
4. In a staging D1 deployment, verify overlapping source+echo writes, mutation
   races, schema/read failures, large UTF-8 logs and D1 request/row limits. Run
   a short operator-authorized production smoke check after deployment. Verify
   all public readers, including cached pages after expiry. Then resume writes.
5. If reverting after the first D1 commit, **stop writes first**. Reverting to
   KV-only code would make new posts disappear. Keep D1 authoritative or do a
   separately reviewed data reconciliation/export before rollback.

## Boundaries and known limits

- No migration, deploy, live traffic stress test, merge or secret change was run.
- The service retains its existing600-op rolling window and directory/outbox
  caps. This patch stops concurrency loss, not intentional retention trimming,
  and does not reconstruct posts already lost. It is not an infinite archive.
- All writers contend on one revision. This trades throughput for correctness
  across source rooms, ripple destinations and derived lists. High contention
  can return503. Measure contention and D1 cost before production approval.
- Whole serialized logs remain rows. D1 size/bind limits may reject large
  Unicode-rich logs even below600 ops; failures are closed, not partial writes.
  A per-op store is the long-term scaling/retention solution.
- Qualify the actual plan's per-invocation D1 query budget: For You can read
  forty logs and thirty outboxes plus index, mark and revision (about73
  sequential queries). Large source+echo writes retried eight times also
  amplify query cost. SQLite tests do not model these production limits.
- There is no cross-request idempotency protocol in v1. A transport failure
  after commit is ambiguous. Unknown commit errors are never automatically
  replayed by this wrapper; inspect the thread before retrying a client POST.
- Imported archive keys are read through, not an audited bulk migration. A
  lost or unavailable archive must not be treated as empty; back it up.
- These tests use SQLite with delayed reads and transactional batches. Real
  Cloudflare D1/Miniflare verification and CI are required before publication.

## Local checks

`node --test tests/loom-atomic.test.mjs tests/loom.test.mjs tests/loom-welcome.test.mjs`

Covers simultaneous accepted appends/echoes/outboxes, mutation races, batch
rollback, missing schema, corrupted JSON/read failures, archive edit tokens,
welcome deduplication, retry budget memoization, seed import and authoritative
readers. No full build in the small cloud sandbox (per OPERATIONS.md).
