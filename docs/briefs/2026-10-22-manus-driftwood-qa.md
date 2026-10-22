# Manus brief: Driftwood real-device QA

Filed 2026-10-22 by Claude Code. Game: `/driftwood`, Asteroids on the water,
directed by Michael Hoydich, thread 5 of the five games stacked on
Breakwater. Run this after the PR merges and `scripts/deploy.sh` reports the
new tip live (`npm run audit:publishing` should list `/driftwood` as live,
not merged-only). No Mike approval is needed for QA itself; nothing on the
page can spend, mint or post.

## URLs to open

- https://pointcast.xyz/driftwood (the game)
- https://pointcast.xyz/driftwood?debug (same game; `window.__driftwood` is exposed for reading state in the console)
- https://pointcast.xyz/driftwood.json (must return JSON with `name: "Driftwood"`)
- https://pointcast.xyz/games/ (the catalog should list Driftwood under Retro arcade, next to Breakwater)
- https://pointcast.xyz/play (the play layer should list Driftwood after Breakwater)
- https://pointcast.xyz/b/0731 (the Block receipt)

## Devices and browsers

1. iPhone, Safari, portrait: the stage should fill the screen. The first
   three games draw dashed zone lines with TURN LEFT / TURN RIGHT / TAP TO
   FIRE / HOLD TO PUSH for five seconds. Left third turns left, right third
   turns right, lower middle pushes (a rumble while held), a tap in the upper
   middle fires (held, it keeps firing). Two fingers at once (turn + push,
   turn + fire) must both register. The FULL button is hidden (iOS has no
   page fullscreen) and nothing else overlaps the field.
2. iPhone, Safari, landscape: the field letterboxes inside the border, still playable.
3. Android, Chrome, portrait: as 1, plus FULL enters fullscreen and EXIT leaves it.
4. Desktop, Chrome and Safari: arrows or WASD turn and push; Space fires (held,
   it repeats at the limited rate); P pauses; F fullscreen; M mutes; C hides
   scanlines; 1 and 2 switch machines; 3 turns the dial. The desktop hint
   names keys, the phone hint names zones.

## What to check

- Boot: 800XL shows `READY` then `RUN "D:DRIFTWOOD"` with short beeps after the
  first tap; C64 shows the `**** POINTCAST 64 BASIC V2 ****` banner, then
  `LOAD"DRIFTWOOD",8,1` with flickering border stripes. A tap skips either.
- Sound starts only after the first tap or key (browser rule). The two-note
  heartbeat runs on the title and in play and speeds up as the mood word
  rises; a noise burst per shot; a low crunch per split (deeper for big
  logs); a bright tick when a small log clears; a warble while the bird is on
  the water. Mute works and persists on reload.
- Physics: the boat keeps its speed when you stop pushing; logs, flares and
  the boat all come back on the opposite edge; a flare fired while turning
  leaves along the new heading.
- Mood: a run of hits takes the top-bar word DAWN → FLOW (brighter lines,
  border bars); keep hitting and see RUSH (glow on every line, hot bars,
  the bird often, two more logs on the next field); collide twice quickly
  and see DRIFT (logs visibly slower, a four-second shield ring, faster
  flares, thin sound).
- Dial CALM: no game over; a collision shows AGAIN and brings the boat back
  shielded. CALM mid-game lifts the boat count; leaving CALM leaves three.
- Extra boat at 2000 points on PLAY or RUSH (a chime and EXTRA BOAT).
- Field clear: `FIELD n CLEAR`, a short pause, then one more log than before;
  the readout row says `FIELD n`.
- Tide bird: enters from a side, bobs, flaps; a hit shows TIDE BIRD 200;
  touching it costs a boat; the warble stops when it leaves or dies.
- Switching machine mid-field only recolors (and changes the voices).
- Game over: best score persists on reload; `pc:mood` in localStorage is set
  to one of chill / flow / hype / quiet after leaving the page, and is NOT set
  if you only looked at the title.
- Hidden tab: switch away mid-field and back; the game is paused, the
  heartbeat is silent while away, held controls are released, no burst of
  notes on return.
- Reduced motion (OS setting): water lines still, raster bars still, sparks
  dimmer, no border strobe on load.
- Nothing scrolls while touching the field; the notes section below scrolls
  from the top bar or the readout row.

## Capture

- One screenshot per device of the title screen, mid-RUSH with glow, and
  DRIFT after losses with the shield ring.
- One short screen recording of a full field on a phone, with two-finger play.
- The browser console on desktop after five minutes of play (should be empty of errors).
- Frame rate from the readout row on each device, in RUSH with glow on (the
  shadow blur is the one expensive draw).

## Write the result to

`docs/manus-logs/2026-10-22-driftwood.md`, with the device list, pass/fail per
check, screenshots embedded or linked, and anything that felt wrong even if it
passed. Comment on the PR if a check fails.
