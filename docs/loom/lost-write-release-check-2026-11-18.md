# Loom lost-write repair release check

**Hold for release.** [PR #1709](https://github.com/mhoydich/pointcast/pull/1709) is an open draft at `d4c0e7a030ea6aa7bcd83a4c87fdae90af5b8b18`. On November 18, exact-head verification, both focused checks, and the build were green. GitHub shows no review decision. The branch is 25 commits behind `main` at `b012179`. [Checks](https://github.com/mhoydich/pointcast/pull/1709/checks) · [Comparison](https://github.com/mhoydich/pointcast/compare/b0121792443098cdbd11e72cf7d073e23f694c98...d4c0e7a030ea6aa7bcd83a4c87fdae90af5b8b18)

At that exact head, the in-memory 25-writer qualification acknowledged and recovered 8 posts on the first pass. The other 17 were explicitly rolled back. One paced retry per request brought total recovery to 25, with zero missing acknowledgments or duplicates. This checks the local handler and retry contract. The pinned runbook separately records an earlier local Miniflare D1 pass. [Fixture](https://github.com/mhoydich/pointcast/blob/d4c0e7a030ea6aa7bcd83a4c87fdae90af5b8b18/tests/qualification/loom-swarm-memory.mjs)

## Before merge

1. The branch owner merges current `main` into the draft, reruns the focused, Worker and build checks, and obtains an independent Terra verdict on the resulting head. If the oversized-append fix lands first, verify that the combined handler still rejects the request before a log write.
2. The release owner chooses #1709 or #1475 and reconciles the proposed migration number/order with the identity draft and operator ledger. Only Mike can authorize and run database steps from his Mac.
3. Qualify the actual D1 plan in authorized staging, including concurrent writes and their echoes/outbox records, fail-closed reads, large UTF-8 rows, and query limits for For You and contention retries. Record the results before requesting approval.
4. Agree on the backed-up archive, writer freeze and drain, migration-first cutover, reader/cache checks, authorized smoke, and rollback that preserves committed D1 entries. Merging to `main` triggers deployment, so the designated release owner's approval and cutover readiness precede the merge.

Review evidence only. See the [pinned draft runbook](https://github.com/mhoydich/pointcast/blob/d4c0e7a030ea6aa7bcd83a4c87fdae90af5b8b18/docs/setup/loom-atomic.md) for operator-owned steps.
