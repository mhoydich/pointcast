---
sprintId: deck-infra-and-federation-examples
firedAt: 2026-04-21T11:34:00-08:00
trigger: chat
durationMin: 25
shippedAs: staged · awaiting deploy
status: staged
---

# chat tick — Deck poster infra + Good Feels federation drop-in

## What shipped

Third tick in the Vol. II arc (after `2026-04-21-vol-2-deck.md` and `2026-04-21-vol-3-triggers-and-gtm.md`). Mike 2026-04-21 11:20 PT: *"ok go"* — approving the three follow-ups cc queued at the end of the Vol. III-triggers handoff: (1) Good Feels `/compute.json`, (2) Vol. II poster image, (3) reusable poster build script.

Items 2 and 3 collapsed into one ship (the build script renders the posters). Item 1 became a drop-in federation-examples package since hyperframes-good-feels is a video project, not an HTTP host Mike could federate from directly.

### Files staged

- **`scripts/build-deck-poster.mjs`** (new, ~130 lines) — SVG + `@resvg/resvg-js` pipeline matching the existing `build-og.mjs` pattern. Zero new deps. A `DECKS` registry keys posters by slug; appending a new entry + rerunning the script yields `public/posters/{slug}.png`. Iconic red Nouns noggles (14-cell SVG), sunset gradient, DM Serif Display wordmark + italic title, gold JetBrains-Mono URL, black-chip roman-numeral volume label. `node scripts/build-deck-poster.mjs` renders all; `node scripts/build-deck-poster.mjs vol-2` renders one.

- **`public/posters/vol-1.png`** (new, ~223 kb) — 1200×630 social card for Vol. I ("The Dispatch from El Segundo").
- **`public/posters/vol-2.png`** (new, ~217 kb) — 1200×630 social card for Vol. II ("The Network Shape"). Unblocks Manus V-2 (X tweet 0 attachment) and V-1 (Warpcast frame fallback card).

- **`docs/federation-examples/README.md`** (new) — schema doc for `compute-ledger-v0`, required CORS headers, 5-minute deploy path, registration flow (publish `/compute.json`, email `hello@pointcast.xyz`, get mirrored within 24h).

- **`docs/federation-examples/good-feels-compute.json`** (new) — minimum-viable 4-entry ledger for `getgoodfeels.com`. Ready to copy to the peer domain's static root. Describes the federation link upstream to PointCast. Does NOT deploy to any external domain — sits in the repo until Mike (or a peer operator) copies to a real host.

- **`src/lib/compute-ledger.ts`** — 2 more entries prepended (federation examples + poster infra). Note: Sprint #89 fired at 12:30 via the :11 cron during this ship and added 2 more entries (block 0363 + sprint retro). The ledger now has Sprint-89 entries at the head, then this sprint's entries, then the earlier Vol. II/III entries. Chronology respected newest-first.

### Why this shape

**Posters first, infrastructure-shaped.** Manus V-2 explicitly calls for a Vol. II poster for the X tweet 0 attachment. Rather than hand-crop a screenshot of the deck cover (fragile, non-reproducible), stand up an SVG-rasterization pipeline that generalizes. The design pattern (`build-og.mjs`) already exists in the repo — matching it keeps deck posters consistent with the per-block OG cards and avoids introducing Playwright or Satori. Adding Vol. III to the `DECKS` registry later is a one-line edit.

**Federation examples as staging, not deployment.** Good Feels is Mike's property but the nearest HTTP-hostable surface is Shopify-shaped, which isn't a repo cc can PR. The clean move is to stage the drop-in JSON and a deploy README in `docs/federation-examples/` so (a) Mike can copy-deploy in ~5 minutes when convenient, (b) other peer operators have a template, and (c) Vol. III's Trigger 2 is one paste away from firing. `hyperframes-good-feels` was considered and rejected — it's a video/hyperframes project without a standard HTTP root.

**Directory discipline.** Both new additions are first-class surfaces: `public/posters/` next to `public/images/og/`, `docs/federation-examples/` next to `docs/gtm/` and `docs/briefs/`. Consistent with the PointCast pattern of giving named concepts named directories.

### What did NOT ship

- **No deployment of Good Feels /compute.json to an external domain.** Staged only. Fires Trigger 2 the moment Mike (or anyone) deploys it and registers.
- **No Vol. II embedding on the home page.** The block at /b/0360 surfaces through the feed as a normal grid card; a hero embed is overkill for v1. If it's needed after Manus V-2 fires, add it then.
- **No X/Warpcast posts.** Manus brief covers distribution cadence — those fire on schedule with Mike's approval on exact copy.
- **No commit or deploy.** Everything staged.

### Guardrail check

- **Schema changes?** No. Federation example JSON conforms to `compute-ledger-v0` as documented in `src/lib/compute-ledger.ts`.
- **Brand claims?** None.
- **Mike-voice content?** None. Posters carry deck titles; federation README is cc-voice ops documentation.
- **Real money / DAO?** No.
- **Contract origination?** No.

Safe to commit.

## Deploy (pending)

Files to add on top of the 11:18 PT commit (Vol. III triggers + GTM brief):

- `scripts/build-deck-poster.mjs`
- `public/posters/vol-1.png`
- `public/posters/vol-2.png`
- `docs/federation-examples/README.md`
- `docs/federation-examples/good-feels-compute.json`
- `src/lib/compute-ledger.ts` (modified — 2 more entries on top of the 4 from earlier in the day)
- `docs/sprints/2026-04-21-deck-infra-and-federation-examples.md` (this file)

Recommended commit message: `feat(decks): poster build script + vol-1/vol-2 posters + federation examples directory`.

Post-deploy verification:
- `curl -sI https://pointcast.xyz/posters/vol-2.png` → 200, Content-Type image/png
- Inspect the posters in a Warpcast/Twitter preview by casting /decks/vol-2.html directly with an og:image meta referring to /posters/vol-2.png (Mike: BaseLayout tweak if wanted, else Manus V-2 attaches the PNG manually)

## Follow-ups

- (a) **Wire og:image meta on /decks/{slug}.html pages** so platforms auto-unfurl without Manus attaching. The decks are static HTML, so this is a two-line `<meta property="og:image">` addition in each deck file's `<head>`. ~5 min of cc work next pass.
- (b) **Ship Good Feels /compute.json to the real domain.** Mike's call — either deploy the staged JSON via Cloudflare Worker in front of shop.getgoodfeels.com, or copy to a simpler static target (GitHub Pages, Vercel-hosted landing). Fires Trigger 2 of Vol. III.
- (c) **Add a `sparrow-compute.json` and `magpie-compute.json` to `docs/federation-examples/`** when those clients spin out their own domains. Same pattern, different seed entries.
- (d) **Generate posters during `npm run build`.** Add `scripts/build-deck-poster.mjs` to the build pipeline so a fresh deploy always ships fresh posters. ~10 min follow-up.

---

— filed by cc, 2026-04-21 11:34 PT, sprint `deck-infra-and-federation-examples`. Third tick in the Vol. II arc. Two predecessor sprint docs: `2026-04-21-vol-2-deck.md` (10:12 PT) and `2026-04-21-vol-3-triggers-and-gtm.md` (11:18 PT).
