# R-2: acknowledged Loom posts can disappear

Tested 2026-11-22 on Node 24.14.1. The same local test fails on main
`6e5c65f2cf52ec038319828633fcd2067af34391` and passes on draft
[PR 1840](https://github.com/mhoydich/pointcast/pull/1840), head
`af82496a7ea514ff5feeee8ff04721170d8a7c3e`.

## Results

Each row starts a fresh store and sends all N requests concurrently. Acknowledged
means HTTP 201. Present means the exact acknowledged message ID is in the real
handler's subsequent GET. No successful request is ever replayed.

| Source | Schedule | Sent | First 201 | First present | Explicit 503 | Retried | Final present | Duplicates |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| main | burst | 25 | 25 | 1 | 0 | 0 | 1 | 0 |
| main | delayed snapshot | 25 | 25 | 1 | 0 | 0 | 1 | 0 |
| main | burst | 100 | 100 | 1 | 0 | 0 | 1 | 0 |
| main | delayed snapshot | 100 | 100 | 1 | 0 | 0 | 1 | 0 |
| 1840 | burst | 25 | 8 | 8 | 17 | 17 | 25 | 0 |
| 1840 | delayed snapshot | 25 | 9 | 9 | 16 | 16 | 25 | 0 |
| 1840 | burst | 100 | 8 | 8 | 92 | 92 | 100 | 0 |
| 1840 | delayed snapshot | 100 | 9 | 9 | 91 | 91 | 100 | 0 |

Main lost **24 of 25 and 99 of 100 acknowledged posts**, well below the
600-operation retention cap. In both delayed-snapshot cases, a successful GET
observed one acknowledged post before the last writer resumed; the next GET
showed that very post had disappeared. This reproduces the reported
"read it back, then it vanished" behavior without cache effects.

1840 lost **zero acknowledged posts**. The delayed-snapshot GET observed eight
posts before the last writer resumed, and all eight survived. Production's eight
internal attempts were unchanged. Rejections were specifically
`503 loom_write_contention`, with `Retry-After: 1` and `retryAfterSec: 1`.
After waiting that second, one sequential retry per rejected writer recovered
all 25/100 posts. This is not a claim that all 100 succeed on their first attempt.

All stored/receipt IDs and stored sequence numbers were unique. The tests also
compare each stored message's body, sender and sequence to its receipt. 1840
wrote nothing to the legacy KV archive. Machine-readable diagnostics are in
[the results file](2026-11-22-loom-lost-posts-results.json).

## What the test actually exercises

`tests/qualification/loom-lost-posts.mjs` bundles and invokes the selected
checkout's **real `functions/api/loom.ts` `onRequest`**, including its limiter
and append/read handlers. It does not substitute an append implementation.
`LOOM_REPRO_SOURCE` selects source files, never a network endpoint. The original
entrypoint and PR branch are not modified.

Main uses a local Map-backed KV fixture. 1840 uses an in-memory SQLite fixture
with the D1 binding shape; the adapter executes the handler's actual prepared
SQL inside BEGIN/COMMIT/ROLLBACK, including its named CHECK constraint. Fixture
DDL creates only a disposable `:memory:` database. No D1 migrations, remote D1
instances, migration ledgers, credentials or live Loom store are used.

The scheduler pauses each first room read **after** its snapshot is captured,
then releases the overlapping requests. The second schedule holds the last
writer until the others finish and a GET observes their posts. These are
controlled adverse interleavings, not estimates of production loss rates or
Cloudflare latency. SQLite does not emulate D1 row/query limits or replication.
The atomic-batch assumption follows the
[D1 batch contract](https://developers.cloudflare.com/d1/worker-api/d1-database/).

Writers have distinct fixture IPs, and a local rate store runs the wrapper's real
limits. A pre-existing welcome marker suppresses unrelated automatic hello
messages. All Request URLs use `loom.test.invalid`, requests are passed directly
to the handler, and global fetch throws if anything tries to use the network.

## Reproduce

Use Node 24 and the existing npm dependencies in the test checkout. Run from
this PR's root. The baseline checkout must contain the main SHA above if
reproducing these exact results.

```sh
# Expected exit 1 on unfixed main: four failed preservation assertions.
node --test --test-reporter=tap tests/qualification/loom-lost-posts.mjs

# An independent, detached source worktree; no modifications to PR 1840.
git fetch origin pull/1840/head
git worktree add --detach .repro-work/pr1840 af82496a7ea514ff5feeee8ff04721170d8a7c3e

# Expected exit 0: all four pass, including the 100-writer cases.
LOOM_REPRO_SOURCE="$PWD/.repro-work/pr1840" node --test --test-reporter=tap tests/qualification/loom-lost-posts.mjs

git worktree remove .repro-work/pr1840
```

The test is deliberately opt-in under `tests/qualification/` so this evidence-only
PR does not turn the normal `npm test` command red before the fix lands. Promote
it to the regular suite with the accepted storage repair. No production files or
dependencies change in this PR.

Focused existing suites also pass: **60 tests on main**, and **75 on 1840**
(including its atomic and swarm suites). The qualification itself has four
expected failures on main and four passes on 1840. Commands, run in each source
checkout:

```sh
node --test tests/loom.test.mjs tests/loom-welcome.test.mjs tests/loom-for-read-concurrency.test.mjs tests/loom-magic.test.mjs
# 1840 only:
node --test tests/loom.test.mjs tests/loom-welcome.test.mjs tests/loom-for-read-concurrency.test.mjs tests/loom-magic.test.mjs tests/loom-atomic.test.mjs tests/loom-swarm.test.mjs
```

The initially sparse checkouts needed their tracked Loom page, public `.mjs`
helpers and Nouns image-data fixture materialized to run the existing suites.
There were no source edits in the comparison worktree. No site build or staging
Miniflare/Cloudflare qualification was run in this task.

## Is 1840 safe to ship?

**The lost-post repair passes this qualification, but do not ship this exact head
onto current main yet.** Independent review found a newer reader missing from
the conversion:

- Current main's `functions/api/loom-hearth.ts:6` passes KV directly to
  `src/lib/loom/hearth-activity.mjs:21`. Those files postdate 1840's base. Once
  the archive is read-only, Hearth will not see D1 writes. A separate local
  probe seeded an archived post from 48 hours earlier, appended a fresh post
  through 1840's handler, then compared reads. The atomic GET contained both
  posts; Hearth reported `quiet`; calculating activity from committed messages
  reported `active`, count 1. Update this reader and add a cutover regression.
- Large rooms remain a release gate. An independent local fixture accepted 600
  posts of 2,000 CJK characters through the original service, producing a
  3,793,912-byte serialized log. 1840 stores the entire log in one D1 value;
  [D1's documented maximum string/row is 2,000,000 bytes](https://developers.cloudflare.com/d1/platform/limits/).
  Valid rooms can therefore become unwritable before the 600-op trim. The
  existing cutover runbook acknowledges row-size risk; this SQLite pass does
  not resolve it.
- The global revision makes unrelated rooms compete too. This experiment proves
  safety of acknowledged posts, while its 92/100 first-pass contention refusals
  illustrate why retry behavior and capacity need staging qualification.

The migration-ledger review, paused-writer cutover, verified archive backup,
authorized staging checks and safe rollback gates in `docs/setup/loom-atomic.md`
remain necessary. No merge, migration, deployment or production test was done.
