# Manus brief: Low Tide real-device QA

Filed 2026-10-22 by Claude Code. Game: `/low-tide`, catch what the gull
drops, a gentle Kaboom! on Cabinet Row, directed by Michael Hoydich. Run
this after the PR merges and `scripts/deploy.sh` reports the new tip live
(`npm run audit:publishing` should list `/low-tide` as live, not
merged-only). No Mike approval is needed for QA itself; nothing on the page
can spend, mint or post.

## URLs to open

- https://pointcast.xyz/low-tide (the game)
- https://pointcast.xyz/low-tide.json (must return JSON with `name: "Low Tide"`)
- https://pointcast.xyz/cabinet-row (the Low Tide cabinet should be lit, and show your best score after a game)
- https://pointcast.xyz/games/ (the catalog should list Low Tide under Retro arcade, before Breakwater)
- https://pointcast.xyz/play (the play layer should list Low Tide)
- https://pointcast.xyz/b/0741 (the Block receipt)

## Devices and browsers

1. iPhone, Safari, portrait: the stage fills the screen; drag anywhere on the
   field and the buckets follow the finger directly (no lag, no drift); tap to
   start a wave; FULL is hidden; the page does not scroll while dragging.
2. iPhone, Safari, rotate to landscape mid-wave and back: the field
   letterboxes, falling shells stay on screen, the buckets stay under the finger.
3. Android, Chrome, portrait: as 1, plus FULL enters fullscreen and EXIT leaves it.
4. Desktop, Chrome and Safari: the mouse moves the buckets without clicking;
   Space starts a wave; ← → and A D move; P pauses; F fullscreen; M mutes;
   C hides scanlines; 1 and 2 switch machines; 3 turns the dial. Click a
   settings button with the mouse, then press Space: it must start a wave,
   not press the button again.

## What to check

- Boot: 800XL shows `READY` then `RUN "D:LOWTIDE"` with short beeps; C64 shows
  the `**** POINTCAST 64 BASIC V2 ****` banner then `LOAD"LOW TIDE",8,1` with
  flickering border stripes. A tap skips either.
- Sound starts only after the first tap or key. Each catch in a wave plays the
  next, higher note of a run; the run starts over each wave. A miss plays a
  soft wash of noise (no explosion). Mute persists on reload.
- Waves: wave 1 is 10 shells worth 1 each, wave 2 is 15 worth 2, each faster.
  The readout row shows `WAVE n caught/total`.
- A miss: the tide line rises briefly, the remaining shells vanish, the bottom
  bucket goes, the next wave offered is the previous one. With no buckets left,
  the game-over screen shows score, best and peak mood.
- A bucket comes back at 1000 and 2000 points (chime and BUCKET BACK).
- Mood: a long clean run reads FLOW; a hot one reads RUSH with border raster
  bars, a faster gull and an occasional golden shell; after a miss, DRIFT
  with visibly wider buckets and slower shells.
- Dial CALM: misses wash the wave away but never take a bucket; the game never
  ends. Switching to CALM during the last bucket's wash still ends the game.
- Switching machine mid-wave only recolors.
- After a game: `localStorage['low-tide:v1']` holds `best`, `machine`, `dial`,
  `sound`, `crt` and `mood`; after leaving the page `pc:mood` is one of chill /
  flow / hype / quiet. Opening only the title screen must not change `pc:mood`.
- Reduced motion (OS setting): ripples and border bars stop moving, flashes are faint.

## Capture

- One screenshot per device of the title, mid-wave in RUSH, the wash after a
  miss, and the game-over screen.
- One short screen recording of two waves on a phone, with sound.
- The desktop browser console after five minutes of play (should have no errors).
- Frame rate from the readout row on each device.
- A screenshot of `/cabinet-row` showing the lit Low Tide cabinet with the best score.

## Write the result to

`docs/manus-logs/2026-10-22-low-tide.md`, with the device list, pass/fail per
check, screenshots embedded or linked, and anything that felt wrong even if it
passed. Comment on the PR if a check fails.
