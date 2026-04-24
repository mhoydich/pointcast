---
sprintId: tank-strip-v0
firedAt: 2026-04-21T20:30:00-08:00
trigger: chat
durationMin: 15
shippedAs: staged · awaiting deploy
status: staged
---

# chat tick — TankStrip ambient home preview (v0.1)

## What shipped

Mike 2026-04-21 ~20:25 PT: *"ok next."*

cc picked TankStrip from the v0.1 queue in the `/play/tank` ship recap (block 0383 + sprint `play-tank-v0`). TankStrip is the ambient home-page preview of the tank — completes the "tank-as-functional-ambient-UI" thesis identified in the research memo (`docs/research/2026-04-21-tank-game.md` §1.3) without touching any of the heavier v0.1 items (drum cross-signal, lore federation, FishNouns).

### Files shipped

- **`src/components/TankStrip.astro`** (new) — 640×280 mini canvas. Renders top-5 newest fish from `/api/tank/state`, scaled from the 1000×600 primary tank. Reuses `fishPosition` Lissajous helper + Noun SVG cache + metal-filter-for-agent visual language from `/play/tank`. Click anywhere → jumps to `/play/tank`. Fetch starts on IntersectionObserver intersection (100px root margin, threshold 0) — no `/api/tank/state` hit until the strip scrolls into view. Poll interval while visible: 2s (slower than the tank page's 1.5s — this is ambient, not primary). Pauses on `document.hidden`.
- **`src/pages/index.astro`** — import TankStrip + render it after `<ActionDrawers />`, before `<footer class="endpoints">`. Per Mike's "cc picks go" default: below the fold.
- **`src/lib/compute-ledger.ts`** — one new entry prepended (ops, `modest` signature).

### Why this shape

Three decisions:

1. **Lazy mount.** TankStrip's fetch has zero cost above the fold — IntersectionObserver waits until the strip scrolls in. A reader who never scrolls past ActionDrawers never hits `/api/tank/state` for this preview. Same pattern as HeroBlock's deferred image loads.

2. **Reuse fishPosition.** Fish positions on the strip come from the exact same deterministic Lissajous curve as the main tank — just mapped from the 1000×600 canvas to 640×280. A visitor on `/play/tank` sees their fish at position X; a different visitor on the home page sees the same fish at the scaled version of X. No new math, no server round-trip.

3. **Visual weight low.** Canvas is backgrounded at 0.55 opacity with the kicker + title + count label on top. The gold `/play/tank` CTA is the only high-contrast element. The strip reads as ambient — it doesn't compete with the block grid, the HeroBlock, or the ActionDrawers accordion for attention.

### What did NOT ship

- **WebSocket upgrade.** Still polling; fine for ambient.
- **Fish click for /play/tank deep-link to that fish.** Future — would want a `?focus={fishId}` query param support in /play/tank.
- **Soundscape.** Separate v0.1 candidate. Intentionally kept silent (no audio in below-the-fold strip).
- **Commit or deploy.** Staged on top of the afternoon's tank v0 ship.

### Guardrail check

- **Schema changes?** No.
- **Brand claims?** None.
- **Mike-voice content?** No editorial block this time — the strip itself is the artifact.
- **Real money / DAO?** No.
- **Contract origination?** No.

Safe to commit.

## Deploy (pending)

Stack on the tank v0 commit:

- `src/components/TankStrip.astro`
- `src/pages/index.astro` (modified — import + render slot)
- `src/lib/compute-ledger.ts` (modified — one new entry)
- `docs/sprints/2026-04-21-tank-strip-v0.md` (this file)

Recommended commit message: `feat(tank-strip): ambient /play/tank preview below the fold on home`.

Post-deploy verification:
- Home page → scroll past ActionDrawers → TankStrip appears and begins fetching `/api/tank/state` within 2s
- Bottom-right of the strip shows the fish-count label updating live
- Click → navigates to /play/tank
- In a second tab, close the home page tab → strip pauses its render loop (visibility hidden)
- With TANK DO not yet deployed: strip shows empty state (single drifting bubble) + "— swimming" label; no 503 noise in console

## Follow-ups (still v0.1)

- (a) **Drum cross-signal.** `/noundrum` drum beat → broadcast `recentDrum` on Presence DO → `/play/tank` darts the corresponding fish. ~1h once the Presence DO field lands.
- (b) **Lore → /compute.json auto-federation.** Actually medium effort — compute ledger is currently a static TypeScript file; needs a KV-backed dynamic layer + merge at `/compute.json` read time. Probably a 3–4h proper ship.
- (c) **Gentle Web Audio soundscape on /play/tank.** ~1h. Kick/snare on dart events, ambient drone when fish-count ≥ 3.
- (d) **FishNouns FA2.** 4-day ship per the brief. Independent of any of the above.

---

— filed by cc, 2026-04-21 20:30 PT, sprint `tank-strip-v0`. Fifteen-minute ship. One component + one import + one render slot + one ledger entry + this recap.
