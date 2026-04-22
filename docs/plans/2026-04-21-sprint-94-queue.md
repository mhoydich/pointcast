# Sprint #94 — overnight reconcile queue (restored 22:45 PT)

**Opened:** 2026-04-21 ~21:45 PT
**Trigger:** Mike: *"next sprint, plan again, reconcile, have a super night you are great, next sprint, go."*
**Note:** this file was wiped by a parallel-thread race at ~22:40 PT; restored with current state. Previous cron-tick attributions are preserved from ledger records.

## Rules

1. Work in `/Users/michaelhoydich/pointcast/`.
2. Pick the FIRST unchecked `[ ]` item. Ship atomically.
3. Check off when landed. Add ledger entry tagging Sprint #94 + tick.
4. Build: `cd /Users/michaelhoydich/pointcast && npm run build`.
   Deploy: `npx wrangler pages deploy dist --project-name pointcast --branch main --commit-dirty=true`.
5. If `dist/` is missing mid-run (parallel thread raced), rebuild before deploying. Copying dist to `/tmp/pc-dist-*` before deploying is the safe pattern.

## Queue

### [x] 1 · Trailing-slash rewrite for /b/:id + /c/:slug + /research/:slug
*T1 cron 22:07 PT. Splat rewrite rules added to `public/_redirects`. Cloudflare Pages static-HTML trailing-slash handler wins over rewrites — 308 persists. Partial close; full fix needs `functions/b/[[id]].ts` middleware. Rolled to stretch. Block 0392.*

### [x] 2 · Co-Authored-By trailers — git hook reading branch prefix
*T2 cron 22:34 PT. Shipped `scripts/git-hooks/prepare-commit-msg` (bash, 70 lines) + `scripts/install-git-hooks.mjs` (Node, 80 lines, idempotent) + `npm run install:hooks`. Smoke-tested: Manus trailer landed on manus/ branch. Block 0394.*

### [x] 3 · Nightly-push script — commit + push the current branch safely  *(T3 cron fired 23:03 PT. scripts/nightly-push.mjs (~170 lines) + npm run push:nightly / push:nightly:apply. 6 safety rails: never-main, never-force, dry-run-default, refuse-mid-rebase, fast-forward-only, explicit --force-with-lease. Smoke-test detected 63 files; dry-run clean. Block 0396.)*

**Goal:** Follow-up #3 from block 0388. A script that commits uncommitted files on the current branch (if safe) and `git push`es with `--force-with-lease` safety. Dry-run default.

**Files:** `scripts/nightly-push.mjs` + `package.json push:nightly` + `push:nightly:apply` + block 0395.

**Success:** `npm run push:nightly` lists what it would do; `npm run push:nightly:apply` commits + pushes. Never pushes to main, never force-pushes shared branches.

---

### [ ] 4 · Reconcile the two local clones — integrate be8ee03

**Goal:** Pull the `be8ee03 feat(local): add El Segundo nature guide` commit from `~/Documents/join us yee/pointcast` into primary.

**Files:** `docs/notes/2026-04-21-reconcile-clones.md` + optional cherry-pick + block 0396.

---

### [ ] 5 · Extend sync-codex-workspace.mjs — add new SOURCES

**Goal:** Sync script currently only handles `pointcast-collabs-map-prototype`. Add `pointcast-xyz` + `pointcast-2027-ui` from T4 of Sprint #93.

**Files:** edit `scripts/sync-codex-workspace.mjs` + `src/pages/lab.astro` card addition + block 0397.

---

### [ ] 6 · MCP server-card at /.well-known/mcp/server-card.json

**Goal:** Sprint #91 C-3. Enumerate the 7 WebMCP tools + /api/* equivalents.

**Files:** edit or create `public/.well-known/mcp/server-card.json` + block 0398.

---

### [ ] 7 · Analytics v0.1 — per-channel time series + live-polls fix

**Goal:** Add a §1.5 section to /analytics with ships-per-channel × last-7-days heat grid. Fix the live-polls "—" counter.

**Files:** edit `src/pages/analytics.astro` + block 0399.

---

### [ ] 8 · Sprint #94 wrap — retrospective + recap file

**Goal:** Read queue state + grep ledger for Sprint #94 entries + write retrospective block + sprint recap.

**Files:** block 0400 + `docs/sprints/2026-04-21-sprint94-reconcile.md`.

---

## Timeline

| T | PT | Status |
|---|---|---|
| T1 | 22:07 | ✓ shipped (partial) |
| T2 | 22:34 | ✓ shipped |
| T3 | 23:03 | pending |
| T4 | 23:29 | pending |
| T5 | 23:58 | pending |
| T6 | 00:23 | pending |
| T7 | 00:47 | pending |
| T8 | 01:11 | wrap |

*— cc, restored 2026-04-21 22:45 PT.*
