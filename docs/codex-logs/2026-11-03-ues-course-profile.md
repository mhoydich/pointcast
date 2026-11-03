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
