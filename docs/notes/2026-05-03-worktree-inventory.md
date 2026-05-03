# Worktree Inventory · 2026-05-03

**Owner:** X · **Status:** first pass · **Companion plan:** `docs/plans/2026-05-03-planning-cleanup-sprint.md`

## Purpose

Classify the current local PointCast worktree before publishing. This is intentionally conservative: unknown or mixed files stay out of the first release candidate until reviewed.

## Buckets

- `ship-now` — likely part of the first cleanup release candidate.
- `needs-review` — may ship, but should be inspected before staging.
- `hold` — useful work, not part of this cleanup release.
- `generated` — local build/runtime output; should not be committed.
- `unknown-owner` — changed by another thread or unclear source.

## RC-A · Local Collection Layer

Likely first publish bundle.

| Path | Bucket | Notes |
|---|---:|---|
| `src/components/MicroAppShell.astro` | ship-now | Shared shell for the new local-first rooms. |
| `src/data/collection-layer.ts` | ship-now | Shared source for collection layer objects and receipts. |
| `src/lib/pointcast-apps.ts` | needs-review | Registry includes RC-A plus other app entries; stage only after checking scope. |
| `src/components/AppLaunchStrip.astro` | needs-review | Home launch strip integration; verify it does not pull unrelated rooms into RC-A. |
| `src/pages/cabinet.astro` | ship-now | Local shelf / receipt reader. |
| `src/pages/observatory.astro` | ship-now | Local lens / constellation reader. |
| `src/pages/gallery-wall.astro` | ship-now | Local curation receipts. |
| `src/pages/ritual-clock.astro` | ship-now | Local ritual marks. |
| `src/pages/exchange-table.astro` | ship-now | Local wish/offer table. |
| `src/pages/provenance-ledger.astro` | ship-now | Local proof export view. |
| `src/pages/world-atlas.astro` | ship-now | Local world stamps. |
| `src/pages/cat-passport.astro` | ship-now | Local cat passport stamps. |
| `src/pages/signal-garden.astro` | ship-now | Reads existing local receipts and writes `pc:signal-garden:plants`. |

## RC-B · Art + Mintable Metadata

Hold until images, metadata, and mint language are checked.

| Path | Bucket | Notes |
|---|---:|---|
| `src/pages/zen-cats.astro` | hold | Strong product surface, but should be released with image/metadata QA. |
| `src/pages/zen-cats.json.ts` | hold | Agent metadata path. |
| `src/pages/morning-ocean.astro` | hold | Needs image display verification and mint-pending copy pass. |
| `src/pages/morning-ocean.json.ts` | hold | Metadata-ready, not necessarily contract-live. |
| `src/lib/morning-ocean.ts` | hold | Shared Morning Ocean data. |
| `src/pages/mint-studio.astro` | hold | Crosses into mint workflow language; review carefully. |
| `src/pages/harbor-log.astro` | hold | Morning Ocean companion app. |
| `src/pages/referral-garden.astro` | hold | Needs legal/claims copy review before release. |
| `src/pages/sats-path.astro` | hold | Bitcoin/capital journey language needs safety review. |

## RC-C · Agent Money + MCP

Keep separate from the first app publish.

| Path | Bucket | Notes |
|---|---:|---|
| `src/pages/money.astro` | needs-review | Public money surface; requires claims and approval-boundary review. |
| `src/pages/money.json.ts` | needs-review | Machine-readable money ledger. |
| `src/lib/money.ts` | needs-review | Shared data/types. |
| `src/lib/money-api.mjs` | needs-review | Runtime path. |
| `src/lib/money-runtime.mjs` | needs-review | Runtime path. |
| `src/lib/money-runtime.d.mts` | needs-review | Type declarations. |
| `tests/money-api.test.mjs` | needs-review | Required if RC-C ships. |
| `tests/money-runtime.test.mjs` | needs-review | Required if RC-C ships. |
| `functions/api/link/` | needs-review | Link API path. |
| `scripts/link-spend-request.mjs` | needs-review | Spend request helper. |
| `scripts/promote-money-receipts.mjs` | needs-review | Receipt promotion helper. |
| `functions/api/mcp.ts` | needs-review | Modified MCP endpoint; may include unrelated but valuable work. |
| `docs/mcp/pointcast-drum.md` | needs-review | MCP docs update. |

## RC-D · Sit / Presence Worker

Hold as its own worker/bindings release.

| Path | Bucket | Notes |
|---|---:|---|
| `functions/api/sit.ts` | hold | Needs Cloudflare binding review. |
| `functions/api/sit/` | hold | Worker/API subtree. |
| `workers/sit/` | hold | Separate deploy/runtime surface. |
| `src/durable_objects/` | hold | Durable Object changes need dedicated pass. |

## Core Site Changes

Review one by one. Some may be needed by RC-A; many are broader.

| Path | Bucket | Notes |
|---|---:|---|
| `.gitignore` | needs-review | May need generated artifact ignores. |
| `README.md` | needs-review | Updated surface list may include RC-B/C/D claims. |
| `BLOCKS.md` | needs-review | Spec changes should be explicit. |
| `astro.config.mjs` | needs-review | Build output/config changed; verify publish expectations. |
| `package.json` | needs-review | Test/build scripts include money tests. |
| `public/_headers` | needs-review | Agent/security headers. |
| `public/robots.txt` | needs-review | Agent discovery changes. |
| `scripts/clean-build.mjs` | needs-review | Build behavior. |
| `scripts/generate-og-images.mjs` | needs-review | OG output changes. |
| `src/content.config.ts` | needs-review | Schema changes. |
| `src/lib/channels.ts` | needs-review | Channel additions affect Blocks globally. |
| `src/lib/play-layer.ts` | needs-review | Shared play registry. |
| `src/lib/seo.ts` | needs-review | Global SEO behavior. |
| `src/styles/global.css` | needs-review | Shared app styles may be required by RC-A. |
| `wrangler.toml` | needs-review | Deploy/binding config; do not stage casually. |

## Modified Existing Pages

Mostly needs review before inclusion.

| Path | Bucket | Notes |
|---|---:|---|
| `src/pages/index.astro` | needs-review | Home integration; likely needed for launch strip. |
| `src/pages/apps.astro` | needs-review | Existing page; should include Signal Garden if RC-A ships. |
| `src/pages/apps.json.ts` | needs-review | App registry mirror. |
| `src/pages/agents.json.ts` | needs-review | Agent manifest. |
| `src/pages/for-agents.astro` | needs-review | Human-readable agent manifest. |
| `src/pages/blocks.json.ts` | needs-review | Global block feed. |
| `src/pages/feed.json.ts` | needs-review | Feed output. |
| `src/pages/b/[id].json.ts` | needs-review | Block JSON route. |
| `src/pages/c/[channel].json.ts` | needs-review | Channel JSON route. |
| `src/pages/sitemap-discovery.xml.ts` | needs-review | Discovery sitemap. |
| `src/pages/marketplace.astro` | hold | Marketplace is live; avoid incidental changes. |
| `src/pages/wallet.astro` | hold | Wallet path should not ship accidentally. |
| `src/pages/federation/preview.astro` | hold | Federation thread, separate from RC-A. |
| `src/pages/federation/blocks.json.ts` | hold | Federation thread. |
| `src/pages/mesh.astro` | hold | Separate surface. |
| `src/pages/pace.astro` | hold | Separate surface. |
| `src/pages/bath/recent.astro` | hold | Existing sprint thread. |
| `src/pages/sparrow/deck.astro` | hold | Separate Sparrow work. |
| `src/pages/sparrow/saved.astro` | hold | Separate Sparrow work. |
| `src/pages/tv/weather.astro` | hold | Weather TV surface. |
| `src/pages/weather-tv.astro` | hold | Weather TV surface. |

## Content + Generated Media

| Path | Bucket | Notes |
|---|---:|---|
| `src/content/blocks/0398.json` | needs-review | Existing modified block. |
| `src/content/blocks/0399.json` | hold | Pets block; release with Pets bundle. |
| `src/content/blocks/0410.json` | needs-review | New block, unknown release bundle. |
| `src/content/blocks/0412.json` | needs-review | New block, unknown release bundle. |
| `src/content/blocks/0413.json` | needs-review | New block, unknown release bundle. |
| `public/images/og/b/0366.png` | generated | Existing generated OG image modified. |
| `public/images/og/b/0367.png` | generated | Existing generated OG image modified. |
| `public/images/og/b/0398.png` | generated | Existing generated OG image modified. |
| `public/images/og/b/0399.png` | generated | New generated OG image. |
| `public/images/og/b/0410.png` | generated | New generated OG image. |
| `public/images/og/b/0412.png` | generated | New generated OG image. |
| `public/images/og/b/0413.png` | generated | New generated OG image. |
| `public/images/og/og-home-v2.png` | generated | Generated home OG image. |
| `public/images/home/` | needs-review | Asset source unknown; inspect before staging. |

## Docs

| Path | Bucket | Notes |
|---|---:|---|
| `docs/plans/2026-05-03-planning-cleanup-sprint.md` | ship-now | Cleanup sprint plan. |
| `docs/notes/2026-05-03-worktree-inventory.md` | ship-now | This inventory. |
| `docs/notes/2026-04-28-lexicon-converter-spike.md` | hold | Federation thread. |
| `docs/plans/2026-05-02-pointcast-pets.md` | hold | Pets bundle. |
| `docs/reviews/2026-04-27-farcaster-pointcast-review.md` | hold | Farcaster review; useful but separate. |
| `skill.md` | unknown-owner | Inspect before staging. |

## Generated / Local Runtime Output

Exclude from release unless there is a very specific reason.

| Path | Bucket | Notes |
|---|---:|---|
| `.wrangler/` | generated | Local Wrangler state. |
| `_worker.bundle` | generated | Worker build artifact. |
| `dist-cabinet-check/` | generated | Local build/check output. |
| `dist-release/` | generated | Local release artifact. |

## First Recommendation

Start with RC-A only.

RC-A is the cleanest expression of the current direction and carries the least external risk. The collection layer can make the site feel more intentional immediately while leaving art metadata, money, workers, and Tezos flows for separate reviewable releases.

## Route Smoke Check · 2026-05-03

Initial report: Mike saw `/cabinet` and related URLs failing in the in-app browser at `http://127.0.0.1:4323/`.

Finding:

- No server was listening on `4323`.
- A separate older Astro process was listening on `4331` from `/private/tmp/pointcast-nouns-production-v38`.
- Starting this repo with `npm run dev -- --host 127.0.0.1 --port 4323` restored the expected routes.

Smoke result after starting the active repo:

| Route | Status |
|---|---:|
| `/cabinet/` | 200 |
| `/observatory/` | 200 |
| `/signal-garden/` | 200 |
| `/gallery-wall/` | 200 |
| `/ritual-clock/` | 200 |
| `/exchange-table/` | 200 |
| `/provenance-ledger/` | 200 |
| `/world-atlas/` | 200 |
| `/cat-passport/` | 200 |
| `/apps/` | 200 |

Live status at `https://pointcast.xyz`:

| Route | Live Status | Notes |
|---|---:|---|
| `/cabinet` | 404 | Not published to live yet; renders Block 404. |
| `/observatory` | 200 | Already live. |
| `/signal-garden` | 404 | Not published to live yet; renders Block 404. |
| `/apps` | 200 | Already live. |

Follow-up:

- Keep active dev URL explicit in handoffs.
- Clean or relocate generated `dist-*` folders because Astro watches them during dev.
- Add a route smoke command to the cleanup sprint before any publish attempt.
- Do not run `npm run publish:live` blindly while the worktree is mixed; the script stages with `git add -A`.
