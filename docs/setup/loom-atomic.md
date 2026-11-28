# Loom atomic writes and cutover

This draft carries the repair from [#1709](https://github.com/mhoydich/pointcast/pull/1709). Two requests could read the same serialized KV room and both return HTTP 201, even though the last KV put overwrote the first append. This happened below the 600-operation retention limit.

## Write and retry behavior

The handler buffers the source write, echoes, automated notes, directory, outbox, and other derived changes. A single [D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/) checks the global revision, advances it, and commits the buffered writes. The caller receives success after the entire batch commits.

- A revision mismatch triggers the named CHECK and rolls back the whole batch. The handler then reruns against current storage. Rate-limit results and drum reads are reused across attempts.
- If all eight attempts conflict, the API returns HTTP 503 with `loom_write_contention`, `Retry-After: 1`, and `retryAfterSec: 1`. The rejected request has been rolled back and the caller can retry after the delay.
- An absent archive binding, schema or read failure, or other storage error returns HTTP 503 with `loom_storage_unavailable`. An uncertain commit is never automatically replayed. Check the thread before resending a write after an ambiguous failure.

D1 is authoritative for the API, bot, For You, topic, sitemap, and share-card reads. Sessions begin on the primary. Existing page-cache TTLs apply. Legacy KV is a read-only archive for keys D1 has yet to update. Original edit tokens keep working. Opportunistic room-list backfills on reads do not persist.

## Release gates

1. Review this approach against the alternative storage design in [#1475](https://github.com/mhoydich/pointcast/pull/1475). Review the exact head and get the focused, Worker, and build checks described in [#1820](https://github.com/mhoydich/pointcast/pull/1820). Main's auth migrations end at 0034 at the base of this port. Use `0037_loom_atomic.sql` to avoid the 0035 and 0036 numbers proposed in [#1724](https://github.com/mhoydich/pointcast/pull/1724). Confirm the order against the operator's migration ledger before applying it.
2. In authorized staging, verify overlapping writes and their echoes and outbox records, fail-closed behavior, large UTF-8 logs, and limits for D1 rows and queries. The For You path can make more than 100 D1 queries for a populated account even with bounded read concurrency. Retries also multiply query cost. Check the actual plan's limits and cost.
3. Back up the Loom KV archive. Stop all Loom writers, including old Pages versions and direct/admin writers, drain in-flight requests, and let KV propagation settle. Verify the archived data before reopening writes.
4. Apply the reviewed 0037 migration to AUTH_DB before deploying the code. Keep writes paused during the cutover. Check all readers, including cached pages after expiry, and complete the authorized smoke check before resuming writes.
5. If rollback is needed after D1 accepts a write, stop writes first. Keep D1 authoritative until a reviewed reconciliation or export preserves its committed entries. Reverting directly to KV-only readers would hide those posts.

### Room size and retained history

D1 room logs have a `MAX_LOG_BYTES` ceiling of 1,500,000 UTF-8 bytes of serialized JSON, leaving headroom below D1's [2,000,000-byte string and row limit](https://developers.cloudflare.com/d1/platform/limits/). The existing 600-operation cap still applies. When either cap is reached, the oldest operations move into bounded `loom:archive:<room-key>:<first-seq>-<last-seq>` records in `loom_atomic_values`. Each record holds `{ v, key, address, ops }`, preserving the original operations, IDs, and sequence numbers. These records and the retained room commit in the same revision-checked batch; failed writes or revision conflicts cannot archive only half of a change.

The retained room keeps its latest sequence number and sets `trimmedBefore` to the first retained operation's sequence. Existing room reads show that recent window. Archive records preserve older history for storage inspection/export; this change does not add a public archive browser or make archived messages editable. Legacy KV remains read-only. History already discarded by the old operation-count trim cannot be recovered.

If room metadata or an individual operation cannot fit even after trimming, the request returns HTTP 413 with `loom_log_too_large` and `maxLogBytes`; none of its room, archive, echo, or outbox changes commit. All buffered values are also checked before submitting the D1 batch. Small rooms are unchanged. Directory and outbox caps still apply, and the revision remains global.

## Local verification

```sh
node --test tests/loom*.test.mjs
node --test tests/qualification/loom-atomic-miniflare.mjs
```

The regular Loom suite includes a 25-writer regression with overlapping reads. It matches the first-pass receipts exactly to stored posts, verifies the rejected requests return explicit contention, and checks all 25 posts after one paced retry per rejected request. A SQLite-backed suite covers real transaction rollback, concurrent mutations, fail-closed storage errors, and archive compatibility.

The second command uses an isolated local D1 database via `miniflare@4.20260730.0` on Node 24. It checks concurrent appends with echoes and outbox entries, named CHECK rollback, and missing schema. These commands run against local fixtures. Staging and cutover require separate operator verification.
