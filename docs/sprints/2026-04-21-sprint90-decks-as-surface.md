---
sprintId: sprint90-decks-as-surface
firedAt: 2026-04-21T12:35:00-08:00
trigger: chat
durationMin: 45
shippedAs: staged · awaiting deploy
status: staged
---

# chat tick — Sprint #90: /decks as a surface + cadence freshness

## What shipped

Mike 2026-04-21 11:34 PT: *"ok, keep going, next sprint."*

Sprint #90 turns the /decks path from a raw file location into a first-class public directory — consistent with /sprints, /compute, /workbench, /play. The versioned-narrative now has a reading room, an agent manifest, proper social-card unfurls, and a build pipeline that regenerates posters automatically. Plus: a cadence-page freshness fix answering Mike's 10:20 PT ping about stale "next ships."

Fourth sprint tick in the Vol. II arc. Predecessors today: `vol-2-deck`, `vol-3-triggers-and-gtm`, `deck-infra-and-federation-examples`.

### Files shipped

- **`src/lib/decks.ts`** (new, ~80 lines) — canonical registry: `DeckEntry` interface, `DECKS` array, `listDecks()` and `getDeck(slug)` helpers. Source of truth for both /decks and /decks.json. Seeded with vol-1 and vol-2 entries (slug, roman, title, dek, publishedAt, slides, bytes, coverBlock, note).

- **`src/pages/decks/index.astro`** (new) — human index. Newest-first poster-card grid, CollectionPage JSON-LD, stats header (volumes / slides total / kb on disk), schema footer naming the registry/posters/decks/build-script paths. Breadcrumb + kicker + serif title "The story, dated." + dek pointing at /b/0361 and /decks.json. Hover lift on poster thumbnails. Scoped CSS, no external dependencies.

- **`src/pages/decks.json.ts`** (new) — agent manifest. Schema identifier `pointcast-decks-v0`. Payload: summary block, full decks array with every poster + cover-block URL, and the Vol. III triggers embedded inline with a `doc` pointer to /b/0361. Headers: `Content-Type: application/json`, `Access-Control-Allow-Origin: *`, `Cache-Control: public, max-age=300`, `X-Content-Type-Options: nosniff`.

- **`public/decks/vol-1.html`** + **`public/decks/vol-2.html`** — og:image + twitter:card meta added to `<head>`. `<title>` on vol-1.html clarified to "PointCast Vol. I — a living broadcast from El Segundo." Canonical link, og:type, og:site_name, og:url, og:image (1200×630), twitter:card summary_large_image. Vol. II's og:image → /posters/vol-2.png; Vol. I's → /posters/vol-1.png. Manus V-2 unblocked.

- **`package.json`** — build script prepends `node scripts/build-deck-poster.mjs`. New `posters` npm script for rerunning manually. Build chain is now: `generate-og-images.mjs → build-deck-poster.mjs → astro build`. Consistent ordering (site-wide OG first, deck posters second, Astro build third).

- **`src/lib/ship-queue.ts`** — `UPCOMING_STALE_HOURS = 4` constant + filter inside `upcomingShips(limit, now)` hides queued entries whose dueAt is more than 4h past. Plus 5 new queued rows appended at the top of `SHIP_QUEUE`:
  - `ship-tue-decks-surface` (this sprint, in-flight)
  - `ship-tue-cadence-refresh` (in-flight, addresses Mike ping 10:20 PT)
  - `ship-tue-block-0364` (queued, block that recaps this sprint)
  - `ship-tue-goodfeels-deploy` (queued, mike collab, fires Trigger 2)
  - `ship-tue-decks-linkback` (queued, small follow-up)

- **`src/content/blocks/0364.json`** (new) — CH.FD · NOTE · 3x2 · `cc` · mood `primitive` · ~5-min read. Editorial recap of Sprint #90 + the cadence fix. Companions: 0360 (Vol. II cover), 0361 (Vol. III triggers), 0358 (CoNav HUD where the future /decks link-back lands).

- **`src/lib/compute-ledger.ts`** — 2 new entries prepended (block 0364 + sprint 90). Stacks above Sprint #89's entries from the 12:30 PT autonomous tick; stacks below newly-arriving entries as the afternoon progresses.

### Why this shape

**Registry first, views second.** Both the human page and the agent manifest read from `src/lib/decks.ts`. Adding Vol. III is one entry in that file + one entry in `scripts/build-deck-poster.mjs`'s DECKS array (two places still, because the poster-build script is intentionally standalone — no Astro imports, so it runs from any context). A future refactor could have the build script read from the same TS module via tsx; not worth it for two decks.

**og:image + twitter:card on the deck HTML directly, not in Astro.** The decks are single-file HTML under public/ — they're served unmodified, not rendered through BaseLayout. Meta tags live in the HTML file. This is also why the posters path is `/posters/vol-{slug}.png` rather than Astro's asset-pipeline output — the decks aren't part of the Astro module graph.

**Freshness filter over bulk state-migration.** Mike's ping was about what the cadence page *shows*, not what's in the underlying array. Auto-defer by state change would mutate intent (we don't actually know which ships are deferred vs which are just un-tended); a view-layer filter is lower-risk and easily tunable via UPCOMING_STALE_HOURS. The underlying entries stay addressable by ID for audit.

**Five new queued rows.** Three represent this sprint's ongoing work (in-flight), two represent follow-ups (queued). This is what Mike expects the cadence page to show: what's actually next today. Sprint-level granularity is deliberate — too-fine-grained queueing creates its own rot problem.

### Voice + author

Block 0364 is `author: 'cc'` (not `mh+cc`). The editorial framing — "receipts, not dashboards," the reading-room metaphor, the concrete unfurl test — is cc's proposal, not Mike's directive. Mike said "next sprint"; cc chose the sprint's scope and wrote the recap. Source field points at all the artifacts + Mike's two relevant directives.

### Guardrail check

- **Schema changes?** One small one: `upcomingShips(limit, now)` signature now takes an optional `now` parameter for testability. Default preserves existing call sites. `src/pages/cadence.astro` does not pass a second arg and continues to work unchanged.
- **Brand claims?** None. `/decks` is an operational surface, not a market claim.
- **Mike-voice content?** None. Block 0364 is cc-voice editorial; code + docs files are cc-voice ops.
- **Real money / DAO?** No. The `ship-tue-goodfeels-deploy` row references the Good Feels /compute.json external deploy as a Mike-owned task; cc does not execute external deploys.
- **Contract origination?** No.

Safe to commit.

### What did NOT ship

- **CoNav HUD link-back to /decks.** Queued as `ship-tue-decks-linkback`. Saved for after the HUD v4 dust settles (Sprint #89's v4 migration is still landing in users' localStorage).
- **Good Feels external deploy.** Staged as `ship-tue-goodfeels-deploy`, collab: mike. Not cc's to ship.
- **Auto-sync between the two DECKS registries** (src/lib/decks.ts and scripts/build-deck-poster.mjs). Two entries isn't worth the refactor cost yet.
- **/decks poster regeneration on schema changes.** Currently only byte-count is stale-able; the rest is stable. If `bytes` matters for the UI, a small post-build step could update it from fs.statSync.

## Deploy (pending)

Files to add on top of the 11:34 PT commit (deck infra + federation examples):

- `src/lib/decks.ts`
- `src/pages/decks/index.astro`
- `src/pages/decks.json.ts`
- `public/decks/vol-1.html` (modified — og meta)
- `public/decks/vol-2.html` (modified — og meta)
- `package.json` (modified — build script + posters script)
- `src/lib/ship-queue.ts` (modified — freshness filter + 5 new rows)
- `src/content/blocks/0364.json`
- `src/lib/compute-ledger.ts` (modified — 2 more entries)
- `docs/sprints/2026-04-21-sprint90-decks-as-surface.md` (this file)

Recommended commit message: `feat(decks): /decks surface — index + manifest + og meta + build wire + cadence freshness`.

Post-deploy verification:
- `curl -sI https://pointcast.xyz/decks` → 200, HTML
- `curl https://pointcast.xyz/decks.json | jq '.summary.total'` → 2
- `curl -sI https://pointcast.xyz/posters/vol-2.png` → 200, image/png
- Paste `https://pointcast.xyz/decks/vol-2.html` into Slack or iMessage; confirm the Vol. II poster unfurls
- `curl https://pointcast.xyz/cadence.json | jq '.upcoming | length'` → ≤ 5, no entries older than 4h from now
- Cadence page renders; "next ships" shows afternoon/evening rows instead of stale 07:00 PT dueAt timestamps

## Follow-ups

- (a) **CoNav HUD NETWORK panel link-back to /decks.** Queued as `ship-tue-decks-linkback`. ~10 min of cc work after HUD v4 settles.
- (b) **Deploy Good Feels /compute.json externally.** Queued as `ship-tue-goodfeels-deploy`, Mike-collab. Fires Trigger 2 of Vol. III.
- (c) **Warpcast V-1 cast on Wed 4/22** (from the Manus GTM brief). Now unblocked — og:image is live after deploy.
- (d) **Dynamic poster bytes.** Index page hardcodes byte counts from the registry; a small `fs.statSync` at build time could keep them live. Not urgent.
- (e) **Vol. III when it fires.** Triggers at /b/0361. One of DRUM mainnet, external peer, field-node TestFlight, guest block. Whichever hits first, add a `vol-3` entry to the DECKS registries, run the poster build, ship the cover-letter block, and the index page picks it up for free.

---

— filed by cc, 2026-04-21 12:35 PT, sprint `sprint90-decks-as-surface`. Fourth sprint tick in the Vol. II arc, following `vol-2-deck`, `vol-3-triggers-and-gtm`, `deck-infra-and-federation-examples`. Block 0364 ships in the same deploy.
