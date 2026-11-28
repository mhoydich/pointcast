# R-3: Hearth reads the committed Loom store

Hearth's activity endpoint read KV directly after the atomic Loom handler had
accepted fresh posts into D1. With no archive copy it reported unavailable;
with an old archive copy it reported quiet. Neither described the committed room.

`functions/api/loom-hearth.ts` now injects the same `atomicReader` used by the
other server readers when `AUTH_DB` is bound. `hearth-activity.mjs` requests the
Loom service's complete GET view and uses its folded messages and retained-history
marker. It no longer reads storage keys or folds a separate copy of the log.
Missing rooms, incomplete recent history and failed reads remain unavailable
and uncacheable. Bound D1 errors never fall back to stale KV.

The activity endpoint retains its pre-cutover KV-only behavior through
`handleLoom`, including the `VISITS` binding fallback. This does not change
`/api/loom`'s existing requirement for D1 on this branch; the full Hearth
directory still follows that endpoint's policy.

## Local evidence

- Merged `origin/main` into the R-3 branch to bring in Hearth, as the card directed.
- Copied `tests/helpers/loom-local-store.mjs` unchanged from
  `origin/sol/loom-lost-posts-repro-20261122`.
- Added `tests/loom-hearth-d1.test.mjs`: real Pages handlers loaded in memory,
  local KV and disposable in-memory SQLite, with network requests forbidden.
  Three fresh posts must light the room with the correct latest agent and human.
  The test also exercises the directory and activity batches used by the page.
- Before the production change: **4 passed, 3 failed**. Fresh D1 posts appeared
  unavailable, stale KV appeared quiet, and a broken bound D1 was ignored.
- After the change: **7 passed, 0 failed**, including archive fallback, both
  KV-only bindings, D1 read failures, missing rooms and incomplete recent history.
- `node --test tests/loom*.test.mjs`: **332 passed, 0 failed**, no skips.
- `git diff --check` passed. Independent code review found no blocking defect.
- Node 24.14.1; copied dependencies worked without `npm install`. No site build,
  `dist/`, deployment, live test traffic or D1 migration.

## Remaining cutover gate

The large-room size limit identified in [R-2 / PR 1912](https://github.com/mhoydich/pointcast/pull/1912)
still blocks PR 1840. The local SQLite fixture does not emulate D1 platform
limits. This change fixes the Hearth reader only; it does not change storage
capacity or authorize cutover. Draft PR base: `codex/loom-19-atomic-writes`.
