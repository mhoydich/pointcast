# Brief for ChatGPT — Drum · A super neat drum cookie clicker

**Author:** cc (Claude Code), drafting from Mike's 2026-04-20 16:15 PT directive: *"have chatgpt, upgrade drum, a super neat drum cookie clicker"*
**For:** ChatGPT (GPT-5 / ChatGPT Agent)
**Repo branch:** `feat/drum-cookie-clicker` (ChatGPT creates; Claude Code reviews + merges)
**Surface:** `/drum` (existing page — rebuild as the clicker; existing editorial at `/drum/about` if needed)
**Target deploy:** pointcast.xyz/drum, included in main Cloudflare Pages deploy
**Scope bound:** single-page feature. No new routes beyond `/drum` and optional `/drum/stats`. No server state. No account required.

---

## Context

PointCast (pointcast.xyz) is a living broadcast — blocks, channels, mesh — run by Mike Hoydich (director) and a small team of AI collaborators (Claude Code, Codex, Manus, you). The `/drum` page today is a minimal interactive: tap a pad to make a sound, a Farcaster Frame hook lets Warpcast users hit it too. It's been the "tiniest interactive" on the site since launch.

Mike wants `/drum` upgraded into **a super neat drum cookie clicker**. Idle/incremental genre (cookie-clicker lineage: cookie → factories → prestige), drum-themed, musical, ships on pointcast.xyz as a first-class surface.

---

## The loop

**Tap 1:** tap the big drum head → ONE BEAT, satisfying hit sound + visual ring + number ticks `1`.

**Tap N:** beats accumulate as `pc:drum:beats` in localStorage. The counter is the main HUD number.

**Upgrades unlock at thresholds** (example ladder — tune for feel):
- `10 beats` — unlock `snare` (new pad, adds +1 snare-tone to clicks)
- `50 beats` — unlock `hi-hat` pattern (every 4th click auto-plays hat)
- `200 beats` — unlock `auto-drummer mk.1` (adds 0.5 BPB passive = 1 beat every 2s while tab is focused AND active-in-last-10-min)
- `1,000 beats` — unlock `polyrhythm 3v4` (tap multiplier: every 3rd tap counts 4x)
- `5,000 beats` — unlock `auto-drummer mk.2` (5 BPB passive while focused)
- `25,000 beats` — unlock `prestige: cast a rhythm` (resets to 0, mints a "Drum·Rhythm #N" MINT record in localStorage; later phase: real FA2 mint)

Each upgrade has a cost in beats. Buy = subtract cost, add effect, update visible upgrade shelf. Purchased upgrades persist in `pc:drum:upgrades` (JSON shape below).

**Passive tick:**
- `setInterval(1000)` or `requestAnimationFrame` clock advances `pc:drum:lastTick`; on each tick compute elapsed-seconds × BPB (beats-per-second-from-passive) and add to the beat pool.
- On blur / background tab, pause passive (cookie clicker does this). Resume on focus.
- Optionally (NICE-TO-HAVE): "your drummer was working" catch-up on page load — cap at 2 hours of catch-up so offline hoarding doesn't break the economy.

**Prestige ("cast a rhythm"):**
- Unlocked at 25k beats.
- Spend all beats to mint a `Rhythm` record: `{ n, beats, upgrades, prestigedAt, signature }` in `pc:drum:rhythms` (array).
- Post-prestige: starts you with a permanent +10% tap multiplier per rhythm minted. So prestige 3 times = 1.33x on all future clicks.
- Later phase (PC-06xx proposal, don't build now): real FA2 mint via MintButton using Mike's contract `KT1Qc77qoVQadgwCqrqscWsgQ75aa3Rt1MrP`. For this brief, keep the prestige purely local.

---

## UX constraints

- **Mobile-first.** Giant tap target (drum head ≥ 240px square on small screens, 360+ on desktop). Thumb-reachable.
- **Readable counter.** Big numeric HUD. `toLocaleString()` for comma-grouping. Animate the number (ease into new value) on change so 1→2→3 doesn't feel static.
- **Satisfying hit.** Web Audio synth (not sample file — keeps the page zero-network after first paint). Short attack, low-pass filter, pitch modulated by velocity. Pair with a ring-pulse animation + haptic vibration (`navigator.vibrate(15)` on mobile if available).
- **`prefers-reduced-motion` respect.** No auto-animation; ring-pulse shortens; no number ease.
- **Persistence resilience.** Every state write is JSON.stringify → localStorage. Read with try/catch + schema-version guard so a corrupt entry resets cleanly.
- **No new dependencies.** Use Web Audio, Pointer Events, localStorage. No React, no game framework.
- **Keyboard accessibility.** Spacebar = tap. Tab cycles to upgrades. Enter on an upgrade = buy.

---

## Visual language

Match pointcast.xyz editorial tone, not arcade:
- Palette: deep ink background `#12110E`, warm amber accent `#E89A2D`, paper `#F3E6D8`. Feels like the CoNavigator bar already does.
- Type: `JetBrains Mono Variable` for numbers + labels; `Inter Variable` for body prose (both are `@fontsource-variable` deps already in the project).
- Drum head: circular SVG with subtle grain, amber rim, concentric rings on hit.
- Upgrades panel: right column on desktop, collapsed-accordion-style on mobile. Upgrade entries: `icon · name · tiny-blurb · cost · [BUY]`. Greyed out when unaffordable.
- HUD: top-left number (beats), top-right BPS (beats-per-second passive) + multiplier badge.
- Prestige celebration: full-screen ring-pulse, plus a Tezos-style `RHYTHM #3 · 27,413 beats · 2026-04-20T16:30Z` receipt card that slides up + archives into a "rhythms minted" strip.

---

## Files deliverables

1. **`src/pages/drum/index.astro`** — rewrite. Renders the clicker UI inside `BaseLayout`. Keep the existing Farcaster Frame meta (so Warpcast casts of `pointcast.xyz/drum` still unfurl) but update the Frame button to point at the new loop ("tap the drum").
2. **`src/lib/drum.ts`** — state model, upgrade catalog, save/load, passive-tick calculator. Export `DRUM_UPGRADES` array + `computeBpb(state)` + `processTap(state)` etc. Build-time importable, client-runnable.
3. **`src/lib/drum-audio.ts`** — Web Audio synth for kick, snare, hi-hat, cow-bell (cowbell easter egg at rhythm #4). Expose `playKick({ velocity, pitch })`, etc. Single AudioContext singleton, resumed on first tap (browsers require user gesture).
4. **`src/components/DrumClicker.astro`** — the visual surface + the client script that wires state ↔ audio ↔ DOM. Stays under ~600 lines. Uses `transition:persist` for the audio context if possible, so switching between tabs in-site doesn't recreate it.
5. **`src/content/blocks/{next-id}.json`** — one editorial block by cc announcing "Drum: now a clicker" (cc drafts this AFTER ChatGPT ships; don't author in this brief).
6. **(Optional) `src/pages/drum/stats.astro`** — tiny companion page: "your rhythm receipts." Lists `pc:drum:rhythms` entries newest-first with a download-JSON button. Only needed if time permits; /drum can include an inline recent-receipts strip if not shipped as its own page.

---

## State shape (localStorage)

```ts
// key: pc:drum:state — the live running state
{
  schemaVersion: 1,
  beats: 12418,                // current unspent beats
  lifetime: 54203,             // all-time beats ever (for prestige math)
  tapMultiplier: 1.1,          // 1.0 default; +0.1 per rhythm minted
  unlocks: ["snare", "hihat", "auto-mk1"],
  lastTick: "2026-04-20T16:30:00.000Z",
  lastActiveAt: "2026-04-20T16:30:00.000Z",
}

// key: pc:drum:rhythms — array, newest-last
[
  { n: 1, beats: 25003, upgrades: ["snare","hihat","auto-mk1","poly-3v4"], prestigedAt: "2026-04-20T…", signature: "modest" }
]
```

---

## Integration points

- **`pc:hello:count`** — already incremented by VisitorHereStrip + elsewhere. The drum clicker should NOT increment hello; it has its own counter.
- **CoNavigator.astro** — already has a `drum` quick-nav chip. No changes there unless you want to show "drum · 12k beats" as a mini readout when the visitor has an active drum state (NICE-TO-HAVE).
- **Presence DO (`listening: 'drum'`)** — optional: if the visitor is actively tapping, send a `listening: 'drum · {beats}'` via the existing presence WS protocol. Signals "someone's drumming" to /here visitors. Skip if it feels like scope creep.
- **Farcaster Frame** — preserve the existing `fc:frame` meta on `/drum`. Update button-1 text to "tap drum →" (opens the page).

---

## Out of scope (explicit)

- Real FA2 mint on prestige. The rhythm "receipt" is localStorage only for this brief. Future proposal: PC-0630 "mint a rhythm" — Mike decides.
- Multiplayer: no shared leaderboard. Every visitor's drum is their own. A /drum/leaderboard page is a separate future ask.
- Account system. No signup, no login, no Beacon requirement. Wallet is optional and only surfaces if the visitor has one paired (we can show a tiny "your noun is drumming" chip in the HUD).
- Monetization. This is editorial + play, not a product.

---

## Success criteria

1. Home → tap /drum chip → lands on the clicker within 200ms.
2. First tap plays a sound within 80ms (no awkward AudioContext-setup pause).
3. Getting to first upgrade (10 beats) takes < 20 seconds of comfortable tapping.
4. Tab blur → return → passive catch-up applies correctly (capped 2hr).
5. Prestige flow feels like earning something — the receipt card + multiplier bump reads "I made a thing."
6. Works on iPhone Safari + Android Chrome + desktop Chrome + desktop Safari without visual breakage.
7. `npx astro build` passes with zero warnings.
8. `npx wrangler pages deploy dist --project-name pointcast --branch=main --commit-dirty=true` lands clean.

---

## Coordination protocol

1. ChatGPT creates `feat/drum-cookie-clicker` branch from current `main`.
2. Commits with `Co-Authored-By: ChatGPT <chatgpt@openai.com>` (you pick the contact address — use the OpenAI developer identity).
3. Open a PR titled `feat: drum · super neat cookie clicker` with a short summary + screenshot GIF of the loop.
4. Claude Code reviews within 24h, merges on passing review.
5. cc drafts the announcement block after merge and includes a `Co-Authored-By: ChatGPT` line in the commit that adds the block.
6. Add a `ComputeEntry` to `src/lib/compute-ledger.ts` for the drum-clicker ship (kind: `brief`, signature: `heavy`, collab: `chatgpt` — add the slug to `src/lib/collaborators.ts` if it's not there yet; check first).
7. Write a sprint retro at `docs/sprints/{date}-drum-cookie-clicker.md` matching the shape of existing retros.

---

## Why cookie clicker + drum

Cookie Clicker works because it turns a mindless click into a meaningful number into a decision (buy? save?) into an identity (what's your prestige count?). Drum has the same texture — a tap is satisfying on its own, the satisfaction compounds, and the prestige motion fits naturally into PointCast's broadcast ethos (every rhythm minted is a tiny editorial artifact).

Ship something that makes the first 60 seconds feel earned and the first 10 minutes feel addictive. If it's not addictive, the upgrade ladder is wrong — tune the thresholds.

— cc, 16:20 PT (2026-04-20) · ship this as a gift for the next person who types pointcast.xyz/drum
