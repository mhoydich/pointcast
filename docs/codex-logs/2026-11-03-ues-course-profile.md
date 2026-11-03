# UES private account snapshot foundation — 2026-11-03

Base: `f46edb419ca7ef4fb7a2718d34902b0ec4268b85` (`main`).

Requested: a low-friction shared identity foundation, with courses on a profile,
future El Segundo interactions and cross-site voting. This first slice implements
only explicit, private PointCast-hosted UES checklist snapshots. Implementation,
API, privacy boundaries and activation steps: `docs/setup/ues-course-profile.md`.

The active `~/pointcast` checkout has unrelated auth edits and was left untouched.
Work is isolated in the task workspace. User authorization for the requested
implementation/draft PR supersedes AGENTS.md's older reviewer-only Codex role;
its no-main-merge and production approval requirements remain intact.

Dependency: #1590 (session JSON redaction) must land before activation. No auth
files are changed here. #1287 (larger Me/profile rewrite) remains separate; its
Me insertion needs reconciliation if both land. Google OAuth code exists but its
live configuration was not probed. No real sessions or learner records were read.

## Validation

- The scoped workflow command passes **43 tests**, including 24 new API/client
  tests. It includes the existing profile compatibility, progress, receipt and
  front-door tests.
- The broader auth/Me/UES command passes **149 of 150**. Its sole failure is the
  existing `ues-classes` catalog test, which expects the superseded phrase
  “Ten active, self-paced University of El Segundo classes” in the newer
  Learning by Making front door. The same test fails on an unchanged main
  fixture (3/4 pass there). No newly failing test remains.
- Scoped strict TypeScript passes with pinned Workers types 5.20260902.1 and
  current 5.20261103.1; the Pages Function bundles with esbuild.
- The first full build compiled but could not resolve the existing public
  `api.tzkt.io` dependency under sandbox networking. A network-enabled build
  passed: 3,807 pages and 145 game downloads. A final build after browser
  refinements is recorded in the PR.
- Actual local browser QA uses two synthetic accounts and an in-memory SQLite
  bridge to the bundled real API. Course save -> later local edit -> restore ->
  remove worked. Removal preserved the local checklist. The profile shelf loaded
  and removed its saved course while the unrelated holdings API returned 503.
  At 390px, both course and Me had a 390px document width, with no horizontal
  overflow; the dynamic removal button measured over 44px tall. Keyboard Tab
  reached Check, sign-in, course link and Remove. Account and cached-page race
  protections are tested with JSDOM; no real OAuth or two-device login is claimed.
- The browser pass found and fixed raw transport error text, dynamic scoped CSS,
  the Me holdings gate and keyboard focus after removal. Those final client
  behaviors have targeted regressions. `git diff --check` is clean.

Fixtures are synthetic;
in-memory SQLite exercises the actual API SQL and JSDOM exercises the client.
The later user instruction authorizes publication, but this draft stays held
until independent review and #1590. This agent did not approve its own PR.
No OAuth client creation, credential generation, persistent access grant, wallet
transaction, on-chain write, paid service, migration, merge or deployment occurred.


## Independent-review follow-up: preserve pending local edits and empty-view history

The reviewer reproduced two real races at `50b81b00`:

1. A Restore read could finish after the learner edited or reset the checklist
   and overwrite that newer local state. A monotonic page-local revision now
   advances on checklist saves and confirmed resets, before any storage early
   return. Restore captures it before reading and refuses to replace local work
   if it changed. The reviewed account copy remains visible for another explicit
   choice. Six deferred-response tests execute the actual bundled Astro course
   script, covering module edits, final outcome, reset, empty reset, reverted
   edits and blocked storage. All six failed before the fix and pass after it.
2. A client could read an empty profile, delay its first save, then insert after
   another client saved and removed the course. The original regression returned
   200 instead of 409. Account generation metadata now survives removal, storing
   only user_id and an opaque marker. A transactional read binds an empty/nonempty
   course view to that generation. Every mutation requires both that generation
   and its course revision and atomically advances the generation with the course
   change. The ABA regression now returns 409 and confirms no course rows/content
   remain; a fresh explicit save after a recheck still works. An injected SQLite
   trigger failure proves both statements roll back and the same generation can
   safely be retried. User deletion cascades the marker as well as course data.

The held 0033 migration now contains both tables; it was never applied to
production. No checklist tombstone or hash is retained. The global marker means
other-course writes conservatively require a recheck, and the shelf carries each
successful removal's new generation into its next removal. This tradeoff is
explicit in the runbook. Client requests now include expectedGeneration; requests
without a reviewed marker fail closed.

The original full-site build and browser screenshots above describe `50b81b00`.
Follow-up validation and exact new head are recorded in the PR. Both independent
findings require re-review. No activation, migration, merge, approval, real login,
chain write or deployment was performed; #1590 still awaits specific approval.


Follow-up checks: **54/54 scoped checks pass** (35 API/client tests), including
all six actual-course-script deferred regressions, the absent-row ABA case,
transaction rollback, successive shelf removals and old-server/missing-generation
fail-closed behavior. The broader auth/Me/UES suite is **160/161**, with only the
same reproduced main catalog-copy assertion failing. Strict Typescript passes
with pinned and current Workers types; the changed Pages Function bundles and
the Astro course compiles. The actual extracted course script is bundled and
executed by the race tests. The full-site build and manual browser pass were not
repeated for this follow-up and must not be attributed to the new head. The
release remains held for the reviewer's recheck and specific #1590 approval.
