# Manus brief: Sandcastle real-device QA

Filed 2026-10-22 by Claude Code. Game: `/sandcastle`, hold back the tide, a
wave-two Cabinet Row game after Missile Command, directed by Michael
Hoydich. Run this after the PR merges and `scripts/deploy.sh` reports the new
tip live (`npm run audit:publishing` should list `/sandcastle` as live, not
merged-only). No Mike approval is needed for QA itself; nothing on the page
can spend, mint or post.

## URLs to open

- https://pointcast.xyz/sandcastle (the game)
- https://pointcast.xyz/sandcastle.json (must return JSON with `name: "Sandcastle"`)
- https://pointcast.xyz/cabinet-row (the Sandcastle cabinet should be lit; after a game it shows your best)
- https://pointcast.xyz/games/ (the catalog should list Sandcastle under Retro arcade)
- https://pointcast.xyz/play (the play layer should list Sandcastle)
- https://pointcast.xyz/b/0744 (the Block receipt)

## Devices and browsers

1. iPhone, Safari, portrait: the stage fills the screen; a tap on the field
   throws sand from the nearest bucket to that point; the FULL button is
   hidden (iOS has no page fullscreen) and nothing overlaps the field.
2. iPhone, Safari, landscape, and rotating mid-round: the field letterboxes
   inside the border, the beach moves at once, nothing in flight ends up below it.
3. Android, Chrome, portrait: as 1, plus FULL enters fullscreen and EXIT leaves it.
4. Desktop, Chrome and Safari: the mouse moves the crosshair and a click throws;
   arrows or WASD move it; Space throws from the nearest bucket; 1, 2 and 3
   throw from the left, middle and right one; P pauses; F fullscreen; M mutes;
   C hides scanlines; X switches machines; Z turns the dial.

## What to check

- Boot: 800XL shows `READY` then `RUN "D:SANDCASTLE"` with short beeps after
  the first tap; C64 shows the `**** POINTCAST 64 BASIC V2 ****` banner, then
  `LOAD"SANDCASTLE",8,1` with flickering border stripes. A tap skips either.
- Title: an attract round plays itself faintly behind the title.
- Sound starts only after the first tap or key. Each stopped wave line plays
  a note; three in one burst plays a chime and shows CHAIN. Mute persists on reload.
- Rounds: `ROUND n` banner; the multiplier shows top right from round 3
  (`X2`); at the end, the tally counts castles and sand left; a round with all
  six castles standing says so.
- A bucket hit by a wave line goes dim and its sand is gone until the next round.
- A castle every 10,000 points: `CASTLE EARNED`, and at the round end it goes
  up on an empty plot.
- Mood: stop a run of lines and watch DAWN → FLOW; lose a castle and see DRIFT
  (lines visibly slower, bursts wider); a hot run reaches RUSH (border
  raster bars, more splits, now and then a fast red rogue wave).
- Dial CALM: the game never ends; at the round end every castle is rebuilt.
  Turning the dial away from CALM with no castles standing rebuilds one.
- Game over on PLAY: `THE LAST CASTLE IS GONE`, then `GAME OVER` with score
  and best. Best persists on reload; `pc:mood` in localStorage is set to one of
  chill / flow / hype / quiet after a game.
- Click a settings button with the mouse, then press Space: it should throw
  sand, not press the button again.
- Reduced motion (OS setting): bursts keep one color, the sea and raster bars
  stop moving, flashes are faint.
- Nothing scrolls while tapping on the field; the notes below scroll from the
  top bar or the readout row.

## Capture

- One screenshot per device of the title screen, mid-round with bursts open,
  a RUSH moment with raster bars, and the round tally.
- One short screen recording of a full round on a phone.
- The browser console on desktop after five minutes of play (should be empty of errors).
- Frame rate from the readout row on each device.

## Write the result to

`docs/manus-logs/2026-10-22-sandcastle.md`, with the device list, pass/fail
per check, screenshots embedded or linked, and anything that felt wrong even
if it passed. Comment on the PR if a check fails.
