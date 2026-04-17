# PointCast — Overnight Status (2026-04-17, ~03:45 AM Pacific)

Morning Mike. Everything below is **live on pointcast.xyz** and tested.
TL;DR at the bottom; scan the sections to pick what to try first.

---

## 🎁 What shipped overnight

### Security + hardening
- **Beacon SDK pinned** to exact version `@airgap/beacon-sdk@4.8.1` + SHA-384 SRI integrity check on the script tag. Supply-chain attack defense — browser refuses to execute if delivered bytes don't match the hash. *File: `src/components/WalletConnect.astro` lines 108-117.*
- **`/admin/*` gated** behind `ADMIN_TOKEN` cookie+query auth in `functions/_middleware.ts`. Unauthenticated visits return `404 Not Found` (no signal there's anything here). Fallback — if `ADMIN_TOKEN` isn't set in Cloudflare env, admin stays open so you aren't locked out during setup.
- **Prompt-injection filter on `/api/visit`** — visitor notes containing patterns like "ignore previous instructions", "stop Claude", "you are now", "jailbreak" get silently dropped before KV storage. Protects downstream LLM consumers of the public API.

### Visible UX upgrades
- **Mobile fixes** — PulseAlert no longer overlaps the masthead on iPhones; drum stats labels use `whitespace-nowrap` so "YOUR DRUMS" / "GLOBAL" / "COMBO" / "BPM" / "TOGETHER" don't break out of their cells; mobile labels shorten ("YOU" / "JAM") on narrow screens.
- **Drum module achievements** — 8-badge row below the stats: 🥁 first · 🎯 novice · 🔥 combo-3 · ⚡ pace-120 · ✨ combo-5 · 🥋 journeyman · 🚀 pace-240 · 👑 master. Grayscale when locked; full-color pop animation when earned. Next-goal line shows what's next.
- **Feedback success UX** — was a tiny mono line; now a big full-panel ✓ "Got it, thanks" overlay with "send another →" reset.
- **Homepage reorder** — feed moved ABOVE the visitor log so the latest drop is near the fold.
- **Favicon** — swapped from Nouns-noggles SVG to a 📡 broadcast-dish emoji on cream (OS renders its native emoji, so it's crisp everywhere).
- **OG unfurl v3** — dark poster with massive serif PointCast wordmark + broadcast dish + warm radial arcs. Filename bumped to `og-home-v3.png` so link-preview caches refetch.

### /drum room upgrades
- **"You're [name]" input** — lets visitors set a short handle (stored in localStorage). Pairs with the Noun ID as identity: "kana · Noun #672" instead of an anonymous avatar. Answers your "how do you know who is who" question.
- **Live activity feed** — rolling list of the last 8 drum taps across the room, rate indicator "N / min". Pushes a row every remote tap plus your own combo-x3+ taps, so solo drumming still feels alive.

### Editorial blocks (6 new, interleaved across homepage)
- **BaseballBlock** — Dodgers / Mets / Yankees. Tap-to-expand cards with **live MLB StatsAPI data** (today's game, standings, last-5 W/L strip, next 3 games). No external links.
- **BasketballBlock** — Lakers / Knicks. Same pattern via NBA's public CDN (`todaysScoreboard_00.json` + `scheduleLeagueV2_1.json`).
- **PickleballBlock** — 3 self-contained cards: PPA tour (rankings), +223% growth stat, Find-a-Court (South Bay spots Mike plays).
- **PaddleBlock** — dedicated 11SIX24 Vapor Power 2 block with specs grid (weight / core / UPA-approved).
- **TigerBalmBlock** — 1870 Rangoon origin, recipe, "tiger = Aw family name in Hokkien".
- **LautnerBlock** — Chemosphere / Sheats-Goldstein / Silvertop / Elrod / Bob Hope timeline chips.

### Big features
- **Violent Crimes module** — full playable noun-voice tribute. BPM indicator, progress stave, PLAY/PAUSE/RESTART/REMIX buttons, Nouns legend. Uses `chimes.ts playNounVoice()` — no external audio. Scrolling stave, pixel-art noun chips, seeded-random remix that rewrites the URL hash for shareability. Built by Manus (92 credits), score composed by me to match the import contract.
- **Farcaster Frame /drum** — cast pointcast.xyz/drum in Warpcast, it renders as an interactive Frame with a "🥁 Drum along" button. Every tap bumps the global drum counter + returns a fresh image with the new count. Live dynamic SVG image at `/api/frame/drum-image?c=<count>`. Rate-limited 1 action per 2s per FID.
- **Nouns Generator v2** — adds a collapsible Customize panel below the controls: 7 background swatches (cream, warm, terracotta, ink, 2 gradients, transparent), caption input (≤40 chars, italic serif overlay), 4 frame styles (None / Thin / Thick / Midcentury w/ corner dots). Save PNG now composites bg → noun → frame → caption at 512×512. Filename includes caption slug.
- **PulseAlert + Jackpot** — event-driven UX. PulseAlert slides a small banner in from top when notable stuff happens; Jackpot takes over the full screen with confetti + chime for rare moments (FULL HOUSE @ 5+ humans, CENTURY @ every 10k drums, TRENDING @ 3 wire messages in 30s).

### Backend + infra
- **Manus API wired up** at `scripts/manus.mjs`. Commands: `list` / `get` / `create` / `watch`. Key lives in `.env.local` (gitignored). Wrapper handles the `{message: {content}}` payload shape the API requires.
- **`/api/wire` endpoint** built but unmounted pending moderation (the anonymous-chat risk you flagged). Component + backend preserved in repo for a future Mike-only-post auth variant.

### Contracts — **ALL THREE COMPILE CLEAN IN SMARTPY v0.24.1** ✅

Rewrites pulled from Manus, saved under `contracts/v2/`:
- `visit_nouns_fa2.py` (475 lines) + `DEPLOY_NOTES.md` (85 lines)
- `drum_token.py` (511 lines) + `DEPLOY_NOTES_DRUM.md` (365 lines — init storage, voucher-signing Node.js example, full error-code table)
- `marketplace.py` (425 lines) + `DEPLOY_NOTES_MARKETPLACE.md` (262 lines)

I compile-tested all three in smartpy.io IDE — **test scenarios originate cleanly** in every case. No API-migration errors. They're ready for you to compile + deploy via `/admin/deploy` + Kukai.

### Research docs saved
- `docs/manus-research-index.md` — Farcaster Frame spec, Zora 1155 insight (use SDK, UI is deprecated), Web Push library recommendation.
- `docs/11six24-affiliate.md` — **YES, they have an ambassador program**. https://11six24.com/pages/ambassador-program · $15 store credit OR $10 cash per paddle sold · personal referral link + discount code · ~few business days to approve.

---

## 🧱 Blocks by Mike (when you're back at a keyboard)

Highest-leverage, in order:

1. **Deploy the 3 Tezos contracts** — go to smartpy.io IDE, paste each `contracts/v2/*.py`, Run, download the compiled Michelson + init-storage JSON, open `pointcast.xyz/admin/deploy`, paste the two artifacts, pick Ghostnet (dry-run) → Mainnet. Kukai will sign each origination. Then paste the three `KT1…` addresses into `src/data/contracts.json` and redeploy.
   - Start with visit_nouns_fa2 (mint is the user-facing flow). Then marketplace. drum_token can wait until the drum claim flow ships Phase C.
2. **Apply to 11SIX24 ambassador program** at https://11six24.com/pages/ambassador-program. Mention PointCast + monthly traffic. When approved, swap the href in `src/components/PaddleBlock.astro` for the tracked referral URL + optionally add the discount code as a small chip on the card.
3. **Upload Visit Nouns metadata to Pinata** — you'll need a Pinata account + JWT. Then `export PINATA_JWT=…` and `node scripts/upload-nouns-ipfs.mjs`. Script pins 1200 JSON files as a directory → returns a root CID → call `set_metadata_base_cid(cid)` on the FA2 contract once to light up all nouns.
4. **Set Cloudflare Pages secrets** (optional but recommended):
   - `ADMIN_TOKEN` — enables the `/admin/*` gate (currently open because it's unset). Any random ~32-char string. Visit `/admin/deploy?k=<token>` once to set the cookie, then drop the `?k=`.
   - `RESEND_API_KEY` — enables emailed feedback via Resend. Without it, feedback still stores in KV; you just don't get the email.
   - `PINATA_JWT` — local use only, don't set on Cloudflare.
   - `VAPID_PRIVATE_KEY` — unused until Web Push ships.
   - `DRUM_SIGNER_KEY` — unused until Phase C claim flow ships.
5. **Test the Frame in Warpcast** — paste https://pointcast.xyz/drum into a cast draft. Should render as an interactive Frame with your live drum count + a "🥁 Drum along" button. If Warpcast caches stale, use their validator: https://warpcast.com/~/developers/frames.
6. **Zora poster — decide** — SDK path works (Zora Protocol v3 on Base), but the no-code UI was deprecated Feb 2025. Options: (a) build via `@zoralabs/protocol-sdk`, (b) skip Zora in favor of Zora Coins (ERC-20 where the community went), (c) stick to Tezos. I lean (c) given your existing collectors, but your call.

---

## 🧰 What's queued for next session (no action needed from you)

- Web Push subscribe button — Manus spec delivered; ~1 hour of implementation using `@block65/webcrypto-web-push` style libraries.
- Jackpot iteration using Manus's UX catalog — more trigger types, tuned timings.
- Leaderboard next step — with the "name yourself" field live, wire it through `/api/drum` POST so leaderboard entries carry the handle.
- `/drum` room visual upgrades — jam-detection highlighting, session-stats block, share-this-moment card.
- Content discoverability from the Claude audit — clickable tags on posts, `/archive` index page.

---

## 💵 Manus credits used this window

Started 63.3K. Now 60.9K (approx). ~2.4K credits consumed over: Farcaster Frame spec + Zora 1155 research + Web Push spec + Jackpot UX spec + FA2 contract rewrite + marketplace rewrite + drum_token rewrite + Violent Crimes module + 11SIX24 affiliate research + a few test/probe calls. ~25 credits/$ of equivalent work shipped to the repo.

---

## 🔍 TL;DR

- **Mobile UX fixed.** Audit + your feedback both addressed.
- **/drum is richer.** Name input, live activity feed, achievement badges.
- **6 new homepage blocks** (sports × 3, paddle, tiger balm, Lautner).
- **Farcaster Frame shipped + deployed** on /drum.
- **All 3 Tezos contracts compile clean** in current SmartPy; you're unblocked on minting.
- **11SIX24 has an ambassador program.** Apply, get referral URL + code, paste into PaddleBlock.
- **OG unfurl v3 + new favicon.** Link previews look cooler.
- **Violent Crimes module live.** Kanye tribute via Noun voices.
- **Nouns Generator v2 live.** Pick a background, add a caption, pick a frame, export a 512×512 PNG.

Caffeinate is running (PID 75038, 5-hr timer) so the Mac stays awake.
Go back to sleep.

— Claude
