# Manus brief: Sea Glass real-device QA

Filed 2026-10-22 by Claude Code. Game: `/sea-glass`, a cube-hopping pyramid
game after Gottlieb's 1982 Q*bert, directed by Michael Hoydich, one of the
five wave-two Cabinet Row games. Run this after the PR merges and
`scripts/deploy.sh` reports the new tip live (`npm run audit:publishing`
should list `/sea-glass` as live, not merged-only). No Mike approval is
needed for QA itself; nothing on the page can spend, mint or post.

## URLs to open

- https://pointcast.xyz/sea-glass (the game)
- https://pointcast.xyz/sea-glass.json (must return JSON with `name: "Sea Glass"`)
- https://pointcast.xyz/cabinet-row (the Sea Glass cabinet should be lit, and show your best score after a game)
- https://pointcast.xyz/games/ (the catalog should list Sea Glass under Retro arcade)
- https://pointcast.xyz/play (the play layer should list Sea Glass)
- https://pointcast.xyz/b/0743 (the Block receipt)

## Devices and browsers

1. iPhone, Safari, portrait: the stage fills the screen; tapping the top-left,
   top-right, bottom-left and bottom-right quarters of the field hops the crab
   up-left, up-right, down-left and down-right; holding keeps hopping; the
   FULL button is hidden (iOS has no page fullscreen); the title says
   TAP A CORNER and TAP TO PLAY, never key names.
2. iPhone, Safari, landscape: the field letterboxes inside the border, still
   playable. Rotate mid-hop: the pyramid stays whole and the crab stays on it.
3. Android, Chrome, portrait: as 1, plus FULL enters fullscreen and EXIT leaves it.
4. Desktop, Chrome and Safari: Q, E, A, D hop; the arrows hop turned 45 degrees
   (up = up-right, left = up-left, down = down-left, right = down-right);
   clicking a quadrant hops too; Space starts; P pauses; F fullscreen; M mutes;
   C hides scanlines; 1 and 2 switch machines; 3 turns the dial. Click a
   settings button with the mouse, then press Space and Q: both must reach the game.

## What to check

- Boot: 800XL shows `READY` then `RUN "D:SEAGLASS"`; C64 shows the
  `**** POINTCAST 64 BASIC V2 ****` banner, then `LOAD"SEA GLASS",8,1` with
  flickering border stripes. A tap skips either.
- Sound starts only after the first tap or key. Each landing that turns a cube
  rings a note that climbs as the pyramid fills; a finished row plays a chord;
  a fall is a long falling whistle and a splash. Mute persists on reload.
- Rules: the first pyramids turn a cube in one landing; from pyramid 5 (PLAY)
  or 3 (RUSH) a cube needs two, with a pale frosted step between; later, a
  landing on finished glass turns it back to sand. The HUD shows TO (target
  color) and the rule.
- Hazards: bubbles drop in at the second row and bounce down; the gull drops in
  later and follows the crab. Ride a lifebuoy with the gull close and it
  follows you off the edge (GULL LURED, +500).
- Mood: turn a run of cubes and watch DAWN → FLOW; fall twice quickly and see
  DRIFT (the gull flies away, bubbles slower, border bars gone).
- Dial CALM: no game over; a fall shows SPLASH, AGAIN and puts the crab on top.
- Game over on PLAY after three crabs; best score persists on reload; `pc:mood`
  in localStorage is one of chill / flow / hype / quiet after leaving the page.
- Reduced motion (OS setting): the shore foam and border bars stop moving, no
  screen shake, flashes faint.
- Nothing scrolls while tapping on the field; the notes section scrolls from the
  top bar or the readout row.

## Capture

- One screenshot per device of the title screen, mid-pyramid, a two-landing
  pyramid with frosted tops, and the game-over screen.
- One short screen recording of a cleared pyramid on a phone.
- The browser console on desktop after five minutes of play (should be empty of errors).
- `/cabinet-row` after a game, showing the Sea Glass cabinet lit with the best score.

## Write the result to

`docs/manus-logs/2026-10-22-sea-glass.md`, with the device list, pass/fail per
check, screenshots embedded or linked, and anything that felt wrong even if it
passed. Comment on the PR if a check fails.
