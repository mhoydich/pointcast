# Codex brief — Analytics + share-card generation

**Audience:** Codex. Tenth substantive brief. Infrastructure — supports GTM launch (release sprint Phase 4).

**Context:** Two ops-facing primitives PointCast needs before the public launch:

1. **Analytics** — Mike + cc need to see visitor counts, page views, referrers, conversion to wallet-connect. Currently zero analytics wired.
2. **Share cards** — per-block Open Graph images. Every `/b/{id}` currently falls back to the site-wide `og-home-v3.png`. Shareable only as generic PointCast thumbnail. Want per-block cards that show the block's title + channel + noun.

---

## Part A: Analytics

### Recommendation: Cloudflare Web Analytics

- Free, privacy-first (no cookies), auto-enabled on Cloudflare Pages projects.
- Track: page views, unique visitors, referrers, device type, country.
- Event tracking for: wallet-connect, poll vote, drop collect, HELLO earned, mood set.

### Setup

1. Cloudflare → pointcast (Pages project) → Analytics → enable Web Analytics beacon
2. Add beacon snippet to `BaseLayout.astro` `<head>`
3. Custom events via `fetch('/cdn-cgi/rum?event=wallet_connect')` or the CF docs pattern

### Alternative: Plausible or Fathom

If Mike wants cross-domain tracking or richer reports, Plausible ($9/mo) or Fathom ($15/mo) are privacy-first drop-ins. Not needed for v0.

### Deliverables

- `functions/_middleware.ts` modification to add the CF Analytics beacon server-side
- Custom event helpers in `src/lib/analytics.ts`
- `/profile` + key components call the helpers on user actions
- Opt-out respect: `navigator.doNotTrack` honored

---

## Part B: Per-block share cards

### The feature

Every `/b/{id}` needs its own Open Graph image. When linked in iMessage / Slack / Farcaster / Twitter, the unfurl shows block-specific art not the site-wide OG.

### Image shape

1200x630 PNG (standard OG) with:
- Top-left: "POINTCAST" wordmark (tiny)
- Center: block's noun avatar (large, circular)
- Below: block title (serif, up to 2 lines, wrapped)
- Bottom-right: "№ {id} · CH.{code}"
- Background: channel-tinted cream

### Generation approaches

**Option A — Build-time (simpler)**:
- Astro's `@vercel/og` or Satori library + Astro endpoint
- For each block, generate PNG at build time → `dist/images/og/b/{id}.png`
- All 100+ blocks generated once per build (~5s added)

**Option B — On-demand via Cloudflare Image Resizing**:
- Dynamic endpoint `/api/og/b/{id}.png`
- Cached by Cloudflare edge on first request
- Runtime cost per miss; low after cache warm

Recommend Option A — build-time, predictable, easy to debug.

### Deliverables

1. `docs/reviews/2026-04-19-codex-og-generation.md` — design choice + examples
2. `scripts/generate-og-images.mjs` — the build-time generator (may already exist in partial form; extend)
3. `src/layouts/BlockLayout.astro` — update og:image meta to point at `/images/og/b/{id}.png`
4. Example output: 5 sample images for blocks 0220, 0262, 0275, 0282, 0320 committed to `public/images/og/b/`
5. `package.json` — hook generator into `npm run build`

### Privacy + caching

- Images are public content — no privacy concern
- CF edge caches for 1 year with cache-busting via content hash in filename

---

## Budget

- Part A (Analytics): ~1 hour
- Part B (Share cards): ~3-4 hours

Total: ~4-5 hours.

## Working style

- Ship-to-main, author `codex`
- Both parts independently mergeable

Filed by cc, 2026-04-19 22:35 PT.
