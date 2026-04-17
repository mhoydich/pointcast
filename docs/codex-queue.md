# Codex Task Queue

**Setup:** Codex CLI v0.121.0 installed at `~/.npm-global/bin/codex` (user-level npm), authenticated via ChatGPT (no API key needed). PATH added to `~/.zshrc`.

**Usage:**
```bash
cd /Users/michaelhoydich/pointcast
codex exec --sandbox workspace-write "your task here"
# OR
codex  # interactive
```

## Active queue — /drum build-out

Ordered by impact × clarity. Pick from the top.

### 1. Session Stats strip on /drum (simple, visible)
A small row under the achievement badges showing the current visitor's session stats:
- Session duration (MM:SS, live counter from first tap)
- Drums tapped this session
- Best combo
- Personal BPM (rolling 10-tap avg)
- Drums unlocked count (0–2, since 3 are always on)

All state already exists in `/drum` runtime — just surface it in a compact strip.

### 2. Jam Moments detection + visual flash
When the global taps-per-second crosses 3/sec for 5s (from `/api/visit` presence + drum rate), fire a `PulseAlert` with "JAM 🔥 N drumming together" + brief screen flash. Works off the existing SSE-ish polling. Bonus: queue a "Jam" Jackpot tier below FULL HOUSE.

### 3. Sound pack switcher
Add a dropdown above the rack: "Taiko (default) · Trap · Jazz · Lo-fi". Each pack swaps the noun-voice `chimes.ts` emission mapping. Preserves rack + noun-id layout; only timbre changes.

### 4. Share button via Share Card generator
Hook the Share Card module (from Manus task `LUKTFzRhfG5ZsRKe4Fg6Ni`) into `/drum`. "Share my session" button at the bottom generates a 1024×1024 PNG with session stats + Noun + date + PointCast wordmark. Web Share API with download fallback.

### 5. DRUM token claim stub (Phase C prep)
A disabled "Claim DRUM →" button at the bottom of /drum that reads localStorage drum count and shows "Claim X DRUM tokens coming soon — sign in with Kukai first" tooltip. Wire the actual exchange when `drum_token.py` is originated.

### 6. Keyboard shortcuts
1/2/3/4/5 trigger drums 1–5. Space = default drum. ? = show shortcut overlay. Respects prefers-reduced-motion and focus state (no triggers when typing in name input).

### 7. Drum history sparkline
Tiny 24h chart of global drum count under the counter. Reads from a new KV key `drum:history` that the `/api/drum` endpoint appends to hourly. Shows rolling 24 bars. Pure SVG sparkline.

---

## Active queue — other ideas

### Infrastructure
- **Wire Weekly Recap** — add `RECAPS` KV namespace binding to `wrangler.toml`, add Cron Trigger for Monday 9am PT, import `<WeeklyRecapBlock />` into `src/pages/index.astro`.
- **`/tag/[slug]`** pages — auto-generate from posts/drops frontmatter tags. Adds a `TagChip` component for clickable in-body chips.
- **`/archive`** index — all posts + drops, reverse-chronological, grouped by month. Use Astro content collection query.
- **RSS feed v2** — include full drop bodies (today only shows post bodies). Add `/rss-posts.xml` + `/rss-drops.xml` split feeds.
- **Sitemap** — add `/collect/*` pages for SEO. Already partially in astro.config but under-populated.

### UX polish
- **Noun metadata preloader** — prefetch noun.pics URLs for Nouns used on homepage (VisitLog avatars, drum rack, etc.) on `requestIdleCallback` so they're cache-warm by the time they render.
- **Feedback success tracking** — after feedback submit, show a counter "N thanks this week" if `ADMIN_TOKEN` is set. Proves the channel is getting read.
- **PWA offline** — tiny service worker that caches the homepage shell + recent Nouns for faux-offline viewing of the paper.

### Tests
- **Prompt injection filter tests** — unit test `/api/visit`'s filter against a set of known attack strings.
- **Admin gate tests** — simulate `/admin/*` requests with and without cookie/query token.
- **Build diff smoke test** — `scripts/smoke.mjs` that curls 10 critical URLs after a deploy and diffs HTML length / status codes against a baseline.

### Phase C (post-contract-origination)
- **DRUM claim flow** — real exchange: sign voucher in browser → `/api/drum/voucher` returns signed message → user submits claim on FA1.2.
- **Marketplace collect UI** — finish the `/collect/[tokenId]` flow end-to-end once the marketplace `KT1…` is in `src/data/contracts.json`.
- **Nouns metadata upload** — `node scripts/upload-nouns-ipfs.mjs` + call `set_metadata_base_cid(cid)` on the FA2 once.

---

## Conventions

- **Prefer editing existing files** over creating new ones (Claude Code / Codex instructions align here).
- **Target ~100–250 lines per task** — bigger ones get split.
- **Run `npx astro build` before claiming done** to catch type/imports breakage.
- **No new npm deps** unless explicitly needed — we've got Astro + Tailwind + Beacon + Taquito and that's it.
- **Match the existing aesthetic** — paper cream bg, ink text, warm accent, corner dots, mono kickers, serif italics, hairline rules.

## Sandbox + review flow

```bash
# Kick off a task
codex exec --sandbox workspace-write "Build SessionStatsBlock.astro per docs/codex-queue.md item 1."

# Review what it did
git status
git diff

# If good: keep going. If bad: git restore + iterate.
# codex apply re-applies the most recent diff if needed.
```
