# Manus brief: Lighthouse real-device QA

Filed 2026-10-22 by Claude Code. Game: `/lighthouse`, Simon as a lighthouse
lens at night, a wave-two game in the Breakwater family, directed by Michael
Hoydich. Run this after the PR merges and `scripts/deploy.sh` reports the
new tip live (`npm run audit:publishing` should list `/lighthouse` as live,
not merged-only). No Mike approval is needed for QA itself; nothing on the
page can spend, mint or post.

## URLs to open

- https://pointcast.xyz/lighthouse (the game)
- https://pointcast.xyz/lighthouse.json (must return JSON with `name: "Lighthouse"`)
- https://pointcast.xyz/cabinet-row (the Lighthouse cabinet should be lit, and after a game show its best)
- https://pointcast.xyz/games/ (the catalog should list Lighthouse under Retro arcade, just before Breakwater)
- https://pointcast.xyz/play (the play layer should list Lighthouse)
- https://pointcast.xyz/b/0733 (the Block receipt)

## Devices and browsers

1. iPhone, Safari, portrait: the stage fills the screen; the lens is centered
   with sky above and sea lines below; tapping a lamp lights it and sounds it at
   once; the FULL button is hidden (iOS has no page fullscreen).
2. iPhone, Safari, rotate to landscape mid-sequence and back: the lens stays
   whole and tappable, the round carries on.
3. Android, Chrome, portrait: as 1, plus FULL enters fullscreen and EXIT leaves it.
4. Desktop, Chrome and Safari: mouse clicks the lamps; arrows, W D S A and 1 to 4
   play them; Space starts; P pauses; F full screen; M mutes; C scanlines;
   X switches machines; Z turns the dial; T toggles free play.

## What to check

- Boot: 800XL shows `READY` then `RUN "D:LIGHTHOUSE"` with short beeps after the
  first tap; C64 shows the `**** POINTCAST 64 BASIC V2 ****` banner, then
  `LOAD"LIGHTHOUSE",8,1` with flickering border stripes. A tap skips either.
- Sound starts only after the first tap or key. Each lamp has its own tone
  (north lowest, west highest; the four make a major chord). The 800XL sounds
  buzzier (square), the C64 softer (triangle).
- Sequence: the light plays, then `TAP THE LAMPS` (phone) or `YOUR TURN`
  (desktop) with a draining bar. Each round adds one lamp. Playback is clearly
  quicker from the 6th, 10th and 14th step.
- A wrong lamp or a long wait: low buzz, `MISS`, the due lamp blinks and its
  name shows (`NORTH WAS DUE`). On PLAY that ends the game (`LIGHTS OUT`); on
  CALM the same sequence replays.
- Mood: after a miss the word goes DRIFT and the next playback is slower with a
  longer bar; a clean run reaches FLOW; on RUSH the lamps go dark between flashes
  and raster bars run in the border. Between rounds a beam sweeps the field.
- FREE: the lens becomes an instrument; holding a lamp holds the note; sliding a
  finger across lamps plays a run; no score is kept.
- Best persists on reload; `lighthouse:v1` and `pc:mood` (chill / flow / hype /
  quiet) are in localStorage after a game, and `pc:mood` is not written by
  free play alone.
- Reduced motion (OS setting): no beam sweep, no star twinkle, faint flashes.
- Nothing scrolls while tapping on the field; the notes section scrolls from
  the top bar or the readout row.
- After a mouse click on any top-bar button, Space and the arrow keys still play.

## Capture

- One screenshot per device of the title, a lamp mid-flash, a miss with the due
  lamp named, and free play.
- One short screen recording of a phone game reaching at least 8 steps.
- The desktop browser console after five minutes of play (should have no errors).
- Frame rate from the readout row on each device.

## Write the result to

`docs/manus-logs/2026-10-22-lighthouse.md`, with the device list, pass/fail per
check, screenshots embedded or linked, and anything that felt wrong even if it
passed. Comment on the PR if a check fails.
