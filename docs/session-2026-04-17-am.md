# PointCast Session — 2026-04-17 AM

**Duration:** ~1.5 hours
**Tooling:** Claude + Manus (5 parallel tasks) + Claude Design (2 projects) + Chrome MCP

## Headline wins

### 🎨 Claude Design — two finished projects

1. **Slide deck: "PointCast — Broadcast Yourself"** (10 slides + speaker notes)
   URL: https://claude.ai/design/p/7f59795f-f2f0-4d98-b0ad-bbc800b20429

   Slide order: POINTCAST · THE PROBLEM · THE IDEA · THE NOUNS · THE DRUM ROOM · EDITORIAL BLOCKS · THE TOKENS · THE STACK · THE NUMBERS · WHAT'S NEXT. Newspaper-front-page aesthetic — "Point·Cast" wordmark with terracotta dot, concentric broadcast arcs, newspaper masthead ("VOL. 01 · NO. 01"), `SIGNAL STRONG`/`ON AIR` badges. Big serif display + small mono kickers. Print-to-PDF ready via the deck-stage component.

2. **Ads: "PointCast Ads — Nouns in the Wild"** (5 formats, 1:1 dimensions, ready to screenshot)
   URL: https://claude.ai/design/p/28cf81e3-1aa6-46de-82c2-1d7e95a8621f

   - 01 Square 1080×1080 — "THE DRUM ROOM" with 4 Nouns labeled KICK/SNARE/HH/BELL
   - 02 Story 1080×1920 — "BROADCAST YOURSELF" with a giant Noun and broadcast arcs
   - 03 Banner 1600×400 — "NOW BROADCASTING FROM THE OPEN WEB" 5-Noun lineup
   - 04 Poster 1200×1500 — "THE TIMES YOU MISSED" newspaper-classifieds layout
   - 05 Card 1050×600 — "YOU GOT ONE" visitor membership card

### 🤖 Manus — 5 tasks completed (~464 credits)

All 5 delivered. Files integrated where marked ✓.

| # | Task | Credits | Outcome |
|---|---|---|---|
| 1 | Happy Friday weekend block | 41 | **✓ integrated** — `src/components/HappyFridayBlock.astro`, `src/data/happy-friday.ts`, imported in `index.astro` after `<SpinningBox />`. Renders Thu 5pm → Sun 11am PT, rotates 5 modes (playlist/cocktail/long read/city/ritual). |
| 2 | MetaMask failure diagnosis | 78 | **✓ acted on** — MetaMask + Phantom buttons hidden in `WalletConnect.astro`. Replaced with "Tezos only for now" note. Full findings in `docs/wallet-metamask-diagnosis.md`. |
| 3 | Farcaster Frame debug | 137 | **✓ documented** — Frames v1 deprecated (late 2025); Warpcast shows link-preview only. Migration plan in `docs/frame-mini-app-migration.md`. Report saved to `docs/frame-debug.md`. |
| 4 | Weekly Recap module | 42 | **✓ files placed** — `WeeklyRecapBlock.astro`, `src/pages/recap/[week].astro`, `functions/api/recap.ts`, `functions/cron/weekly-recap.ts`. Not yet imported into index (needs KV binding + cron config). Docs in `docs/weekly-recap-architecture.md`. |
| 5 | Share-card generator | 166 | **LIVE DEMO at Manus URL** — 5 presets (user milestone, mint receipt, leaderboard, platform milestone, weekly recap). Code not yet pulled into repo; ready for next session. URL: https://manus.im/app/LUKTFzRhfG5ZsRKe4Fg6Ni |

### 🎛️ UX fixes you asked for

- **Sports block colors readability** — BaseballBlock + BasketballBlock rebuilt to use `bg-card` (cream) with team-color top accent strip (8px) + team-color city kicker in bold + ink body text. Dodgers blue-on-blue and Knicks orange-on-blue problems are gone.
- **Spotify blocks "too close together"** — `second-set.md` switched from `variant: full` (352px) to `variant: compact` (80px) with a short caption ("Afternoon shift — late-Friday heat index."). Now alternates visual rhythm instead of stacking two tall embeds.
- **MetaMask pairing bug** — wallet menu now shows Kukai only, with an italic note about Ethereum/Solana arriving with the Zora drop.

## Frame debug — root cause summary

Mike tested the Frame cast at https://farcaster.xyz/mhoydich/0x0b003a1c and reported "not sure it works." Manus found **three** issues:

1. `/api/frame/drum-image` returns SVG (Farcaster v1 requires PNG/JPEG/GIF)
2. Cloudflare Pages routing bug makes HEAD requests return `text/html` content-type
3. The POST handler at `/api/frame/drum` crashes with Cloudflare Worker 1101 on payload

**But:** Frames v1 (`fc:frame=vNext`) was deprecated in early 2025 and replaced by **Mini Apps**. Fixing v1 is a dead-end. The cast now renders as a beautiful link preview (which is fine for now). Migration plan in `docs/frame-mini-app-migration.md`.

## Mike's next actions

### Low-effort wins
- **Open the deck:** https://claude.ai/design/p/7f59795f-f2f0-4d98-b0ad-bbc800b20429 — click Present for full-screen.
- **Open the ads:** https://claude.ai/design/p/28cf81e3-1aa6-46de-82c2-1d7e95a8621f — scroll through all 5, screenshot any you want to use, or Export the HTML.
- **Review MetaMask copy** in `WalletConnect.astro` — if you want different language for the "Tezos only for now" note, it's one string.

### Still on your plate from previous session
- **Deploy 3 Tezos contracts** via `/admin/deploy` (compile each in smartpy.io, paste Michelson + init storage, Kukai signs).
- **11SIX24 ambassador program** — https://11six24.com/pages/ambassador-program.
- **Cloudflare Pages secrets** — `ADMIN_TOKEN`, `RESEND_API_KEY`, `PINATA_JWT`, eventually `VAPID_PRIVATE_KEY` and `DRUM_SIGNER_KEY`.

### Queued for next session
- Pull Share Card Generator code from Manus into the repo (live demo is ready, just needs a download pass).
- Wire Weekly Recap: create `RECAPS` KV namespace, add Cron Trigger for Monday 9am PT, import `<WeeklyRecapBlock />` into homepage.
- Migrate Farcaster Frame → Mini App on `/drum` (separate project; roadmap in `docs/frame-mini-app-migration.md`).

## Files changed in this session

```
A  docs/happy-friday.md
A  docs/wallet-metamask-diagnosis.md
A  docs/frame-debug.md
A  docs/frame-mini-app-migration.md
A  docs/weekly-recap-architecture.md
A  docs/weekly-recap-architecture-secondary.md
A  docs/session-2026-04-17-am.md   ← this file
A  src/components/HappyFridayBlock.astro
A  src/components/WeeklyRecapBlock.astro
A  src/data/happy-friday.ts
A  src/pages/recap/[week].astro
A  functions/api/recap.ts
A  functions/cron/weekly-recap.ts
M  src/components/BaseballBlock.astro      (color readability)
M  src/components/BasketballBlock.astro    (color readability)
M  src/components/WalletConnect.astro      (hide MetaMask + Phantom)
M  src/pages/index.astro                    (import + place <HappyFridayBlock />)
M  src/content/drops/2026-04-16-second-set.md (variant: compact + caption)
```

`git status` after this session should show all of the above as modified/added, on top of the overnight-status delta. Recommend a commit batch: _"Ship Happy Friday + Weekly Recap scaffolding + wallet cleanup + sports color fix"_ — or break into three commits if you prefer thinner history.
