---
sprintId: polls-refresh-and-yeeplayer-clarity
firedAt: 2026-04-19T07:55:00-08:00
trigger: chat
durationMin: 22
shippedAs: deploy:f3d34baa
status: complete
---

# chat tick — polls auto-refresh + YeePlayer clarity/pacing

## What shipped

Two distinct fixes in one tick, both direct responses to Mike's morning screenshots:

### 1. Polls auto-refresh (PollsOnHome)

Mike's feedback: "ive done these polls, should we refresh with new ones when complete". The home page was showing two polls both at 100% with Mike's pick locked — stale results where a fresh question should be.

Fix: server now renders the top 8 polls (up from 2); client walks the rendered list at load, hides any poll where `localStorage.getItem('pc:poll:voted:{slug}')` returns truthy, and reveals only the first 2 un-voted cards. If all 8 are voted, a new "CAUGHT UP" card surfaces instead — green-accented, links to `/polls` for the full archive, notes that new polls drop with each sprint tick.

Side effect: with 12 polls currently in the pool, most visitors will cycle through fresh questions for a long time before ever hitting the caught-up state. That's the intended shape.

### 2. YeePlayer clarity + pacing (`/yee/[id]`)

Mike's feedback: "was kinda too slow and wasn't totally clear what to do". Screenshot showed the Alan Watts meditation track at 0:55/15:30 with 1/12 hits and an empty track — 12 beats across 15:30 means ~77 seconds between beats, which is the chant's actual meditative cadence, but the game UX made it feel broken.

Three changes landed:

**A. "HOW TO PLAY" overlay before first start.** A dashed-border card covers the empty track before playback begins. Numbered steps explain: press START, watch bija mantras fall, tap SPACE at the line, scoring window (PERFECT ±200ms = +100, GOOD ±650ms = +50). Plus a note that meditation tracks intentionally have long gaps — that's the chant, not a bug. The overlay auto-hides when playback starts.

**B. "NEXT · {word} · in 0:45" live countdown chip.** Always visible during play, just below the top label. Tells the player what's coming and when. When the next beat is within 3 seconds, the chip fills to warm amber + scales + pulses so the player gets a visual "get ready" cue independent of the falling beat. Solves "I'm staring at an empty track wondering if the game is working" completely — you always know the status.

**C. Longer visible travel time.** Bumped `LEAD_MS` from 3000 to 6000 (beats visible for 6 seconds of their approach, was 3). Hit windows relaxed proportionally: PERFECT ±200ms (was 150), GOOD ±650ms (was 500). Feels more like a rhythm game and less like a reaction test. On the Alan Watts track this means each beat is visible and approaching for 6 seconds out of every ~77, instead of 3 — doubles the amount of time the track has something happening.

**D. Corrected legend text.** Old text said "Beats fall every 30 seconds" which was never true on Alan Watts (77s average) and barely true on the music tracks. New text explains that pacing is content-aware — meditation tracks have long gaps (intentional), music tracks are denser. Also clarifies the interaction: tap SPACE when a bija reaches the line.

## Why these two together

Both were inline fixes to existing features, both were direct screenshot-driven UX debt, both should ship before the next cron tick surfaces to avoid Mike hitting the same papercuts twice. Separating them into two ticks would have doubled the deploy overhead for changes that share a theme: make the existing primitives actually legible.

## Voice discipline

No editorial changes. All code. cc authorship throughout; no new blocks created.

## What didn't

- **Ambient track pulse between beats.** Considered: a slow breath-wave animation in the track zone to make it visibly alive during the long meditation gaps. Deferred — the NEXT countdown should be enough; another visual risks overcrowding.
- **Next-3-beats preview rail.** Considered: show the next 3 mantras as small chips above the track so the full upcoming sequence is visible. Deferred — the single NEXT chip is the minimum that solves the "what's happening" problem; a preview rail is a v1 nicety.
- **Different pacing per content type.** Considered: automatically crunch meditation tracks into a denser game by interpolating beats. Didn't — that would dishonor the content. Alan Watts' meditation IS paced this way; the game should match, not override.
- **Mobile-specific instructions.** The HOW TO PLAY card says "SPACE" which doesn't apply to a touch-only device. On mobile, "TAP the zone" is the actual interaction. The copy could branch based on detected input — deferred; the `TAP · SPACE` hit button already tells mobile users what to do.

## Notes

- Build: 198 pages (unchanged; pure component + page updates).
- Deploy: `https://f3d34baa.pointcast.pages.dev`
- Polls refresh is client-side only — no server/API changes. The scaling decision (render 8 vs 2) is a tradeoff: slightly larger initial HTML payload for a much better user experience. At 8 polls × ~800 bytes = +6KB, well within budget.
- YeePlayer's LEAD_MS change affects all tracks. November Rain and Purple Rain (dense tracks) will feel slightly different — more beats visible at once. That's fine; music tracks benefit from the longer runway same as meditation tracks do.
- Cumulative morning (since wake): 4 chat ticks shipped. Running total since last night ~1am: 10 shipped improvements.

— cc, 8:02 PT
