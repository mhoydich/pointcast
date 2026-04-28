# Manus QA brief · Tide v4 + /federation/preview

**Filed:** 2026-04-28
**Author:** cc
**Sprint:** 5 (Day 4)
**Surfaces under test:** /tide v4, /tide.json, /tide/moments, /federation/preview

## Why this brief

Four sprints landed in one run today — Tide v4 (BOUNCE + PIPES scenes,
GRANULAR soundscape, C-key custom palette, tab-blur auto-mute) and a
federation Phase 0 spike (Block ↔ Lexicon converter + /federation/preview
demo).

Everything builds clean and the local smoke pass looks right. What I
need from you is real-browser validation: actual scene rendering on
real GPUs, real audio context behavior across tab switches, the
visibility/audibility of drift on the federation preview, and any
mobile gotchas.

## Accounts / tools

- A reasonably modern Chrome (or Safari) on desktop.
- A second device for mobile pass — phone-class viewport, low-power.
- No login required. No wallet required. Audio permission gets
  granted by toggling SOUND in the drawer (user-gesture).

## Test plan — Tide v4

### A. Scene cycle

Open https://pointcast.xyz/tide and verify all five scenes render:

1. **WAVES** (default) — sky + parallax SVG wave layers + drifting orb +
   rising foam. Wave paths morph (not just translate).
2. **STARFIELD** — warp-speed canvas particles flowing toward viewer.
   Trail effect (not crisp dots), palette-tinted.
3. **MYSTIFY** — four palette-colored polylines bouncing inside the
   viewport, with a 10-frame history trail per line.
4. **BOUNCE** *(new)* — palette-tinted rectangle with TIDE wordmark
   bouncing around. Color cycles on every wall hit. Corner hits trigger
   a soft palette-foam flash that fades over 600ms.
5. **PIPES** *(new)* — After-Dark grid of growing pipes. Pipes turn at
   12% chance per cell, die on collision, respawn until the grid fills,
   then slowly fade and restart.

Cycle by:
- Pressing **M** repeatedly. Should cycle waves → starfield → mystify →
  bounce → pipes → waves.
- Clicking each pill in the SET drawer.
- Loading direct URLs:
  - https://pointcast.xyz/tide#abyss/bounce
  - https://pointcast.xyz/tide#crystal/pipes
  - https://pointcast.xyz/tide#kelp/mystify

**Capture screenshots of each scene on at least two palettes** (one
light, one dark — try DAYBREAK for light, ABYSS for dark).

### B. Soundscape cycle

Toggle SOUND ON. Then cycle through soundscapes:

1. **DRIFT** — filtered brown-noise wash, low ambient, tuned per palette.
2. **CHIMES** — random soft pentatonic tones at intervals 900ms-4.1s.
3. **BUBBLES** — pitch-swept sine pops, 350ms-2.55s.
4. **GRANULAR** *(new)* — overlapping short grains around palette
   root, slow LFO drift, subtle but continuous texture.

Verify each one feels distinct. Especially listen for:
- Does GRANULAR sound continuous (good — overlapping grains) or stuttery (bug)?
- Does BUBBLES sit in the foreground (correct) or get muddied in DRIFT (wrong, soundscape-switch is broken)?
- Does CHIMES land inside the palette tonality on each cycle (correct) or play the same root regardless of palette (bug)?

### C. Tab-blur auto-mute

With audio ON and DRIFT (or any) playing:

1. Switch to another tab. Audio should ramp down to silence over ~250ms.
2. Switch back. Audio should ramp back up over ~600ms.
3. The SOUND button should still show ON the whole time. Tab-blur must
   not flip the user toggle.
4. Try this several times in a row. There should be no clicks, glitches,
   or AudioContext errors in DevTools console.

### D. C-key custom palette

1. Press **C**. A new palette named CUSTOM should slot into the cycle as
   the 9th entry. The badge top-left should show CUSTOM and 9/9.
2. The page background should change to a coherent palette derived from
   a single random hue (not random per-element).
3. Reload the page. The CUSTOM palette should still be there at position
   9/9 and accessible via cycle.
4. Press C again. A different CUSTOM palette should replace the old
   one. (Press C is a re-roll, not an add.)
5. Verify localStorage key `pc:tide:custom` exists with a valid JSON
   palette object.

### E. Persistence

Set palette = CRYSTAL, scene = MYSTIFY, soundscape = CHIMES, audio ON,
volume = 50%, motion = ON, auto-cycle = 5m. Reload the page.

You should land on exactly that combination. The hash should reflect
palette + scene (`#crystal/mystify`).

### F. /tide.json

Visit https://pointcast.xyz/tide.json and verify:
- `version: 4`
- `scenes` array has 5 entries (waves, starfield, mystify, bounce, pipes)
- `soundscapes` array has 4 entries (drift, chimes, bubbles, granular)
- `interactions.keyboard` lists C key
- `storage` lists `pc:tide:custom`
- `versions.v4` describes BOUNCE/PIPES/GRANULAR/tab-blur/C-key

### G. /tide/moments

Save a moment via the SAVE THIS MOMENT button. Visit /tide/moments and
verify the saved moment renders with the actual palette gradient strip
+ 6-color swatch + reopen link back to /tide.

## Test plan — /federation/preview

### H. Phase 0 demo page

Visit https://pointcast.xyz/federation/preview.

1. Page renders four cards: 0381, 0387, 0384, 0371.
2. Each card shows BLOCK + LEXICON columns side-by-side.
3. Each card shows a chip — LOSSLESS (green) or DRIFT (amber).
4. **All four cards should currently show LOSSLESS** based on the
   converter implementation. If you see DRIFT chips, click to expand
   and capture the path list — that's a real bug.
5. Long bodies fold to a snippet + char count for readability.
6. The example AT-URI in the header is correctly formed:
   `at://did:plc:.../xyz.pointcast.block/0387`.

### I. Mobile pass

Repeat A, B, C, F, H on a phone-class viewport. Specific things to look
for:

- Drawer width on /tide should be `calc(100vw - 32px)` on widths < 520px
- Footer + badge shouldn't overlap on small viewports
- The grain texture overlay shouldn't kill scrolling perf
- /federation/preview should stack BLOCK + LEXICON columns vertically
  below 800px

## What to capture

For each test letter A through I, capture:
- 1-2 representative screenshots
- Any console errors (DevTools console)
- Any visible bug or unexpected behavior
- Audio: a 5-second screen recording with sound for B and C is gold

## Where to write the result

Create `docs/manus-logs/2026-04-28-tide-v4-qa.md` with:

```
# Manus QA · Tide v4 + /federation/preview · 2026-04-28

## Summary
[1 line: shipped clean / found N issues]

## Per-test findings
[A through I, each with screenshots inline]

## Mobile pass
[separate section with phone screenshots]

## Console errors
[anything from DevTools]

## Bugs found
[numbered list with severity guess]
```

Open a GitHub issue for each P0/P1 bug. Tag `tide` for tide-related, `federation`
for federation-related, `qa` for QA-found.

## Mike approval needed?

No. This is read-only QA — no minting, no transfers, no irreversible
actions. Just look, interact, capture, write up.

## Related links

- [/tide v4 ship block 0395](https://pointcast.xyz/blocks/0395)
- [PR #199 — BOUNCE + tab-blur](https://github.com/mhoydich/pointcast/pull/199)
- [PR #200 — PIPES + GRANULAR + C-key](https://github.com/mhoydich/pointcast/pull/200)
- [PR #201 — federation Phase 0](https://github.com/mhoydich/pointcast/pull/201)
- [RFC 0004 — Block Lexicon](../rfcs/0004-pointcast-block-lexicon.md)
- [Sprint 5 plan](../plans/2026-04-28-sprint-federation-rooms.md)

— cc
