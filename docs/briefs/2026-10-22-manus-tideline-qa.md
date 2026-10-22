# Manus brief: Tideline real-device QA

Filed 2026-10-22 by Claude Code. Game: `/tideline`, Pong stood on its end,
directed by Michael Hoydich, thread 1 of 5 after Breakwater. Run this after
the PR merges (it stacks on Breakwater's #1478) and `scripts/deploy.sh`
reports the new tip live (`npm run audit:publishing` should list `/tideline`
as live, not merged-only). No Mike approval is needed for QA itself; nothing
on the page can spend, mint or post.

## URLs to open

- https://pointcast.xyz/tideline (the game)
- https://pointcast.xyz/tideline.json (must return JSON with `name: "Tideline"`)
- https://pointcast.xyz/games/ (the catalog should list Tideline under Retro arcade, next to Breakwater)
- https://pointcast.xyz/play (the play layer should list Tideline)
- https://pointcast.xyz/b/0727 (the Block receipt)

## Devices and browsers

1. iPhone, Safari, portrait: the stage should fill the screen; drag anywhere
   on the field to move the bottom paddle; tap to serve on your serve; the
   FULL button is hidden (iOS has no page fullscreen) and nothing overlaps the field.
2. iPhone, Safari, landscape: the field letterboxes inside the border, still playable.
3. Android, Chrome, portrait: as 1, plus FULL enters fullscreen and EXIT leaves it.
4. Desktop, Chrome and Safari: mouse steers; Space serves; P pauses; F fullscreen;
   M mutes; C hides scanlines; 1 and 2 switch machines; 3 turns the dial; 4 toggles 2UP.
5. Two people on one phone: turn on 2UP, one thumb in the top half, one in the
   bottom. Both paddles must move at once (two simultaneous touches), and the
   top player serves with a tap in the top half.

## What to check

- Boot: 800XL shows `READY` then `RUN "D:TIDELINE"` with short beeps after the
  first tap; C64 shows the `**** POINTCAST 64 BASIC V2 ****` banner, then
  `LOAD"TIDELINE",8,1` with flickering border stripes. A tap skips either.
- Sound starts only after the first tap or key (browser rule). The paddle pok is
  a short square-wave tone; the wall is a lower blip; a point is a longer tone.
  Mute works and persists on reload.
- Serve: on your serve the ball waits on your paddle until you tap; on the
  house's serve it comes down after about a second. Serves alternate every point.
- Angle: hitting with the edge of the paddle sends the ball off flat; the middle
  sends it back steeply. Speed visibly rises in a long rally and resets on a point.
- Mood: keep a rally going and watch the top-bar word go DAWN → FLOW; lose two
  points quickly and see DRIFT (your paddle wider, ball slower, the house
  arriving late and missing); push a hot rally and see RUSH (border raster
  bars, a sharper house, a second ball once per game).
- The readout row shows `RALLY n HOUSE nn`; the house number should drop in DRIFT
  and rise in RUSH.
- Dial CALM: no game ends; the digits keep counting past 11; a lost point shows AGAIN.
- Game to 11: `YOU WIN` or `HOUSE WINS`, the final digits, longest rally; best rally
  and wins persist on reload; `pc:mood` in localStorage is set to one of
  chill / flow / hype / quiet after leaving the page, but not after only
  watching the title screen.
- Switching machine mid-game only recolors; the score and the ball stay.
- Reduced motion (OS setting): fewer particles, raster bars stop scrolling, no shake.
- Nothing scrolls while dragging on the field; the notes section below scrolls
  from the top bar or the readout row.

## Capture

- One screenshot per device of the title screen, mid-RUSH with raster bars, and
  DRIFT after lost points.
- One short screen recording of a full game on a phone, and one of 2UP with two thumbs.
- The browser console on desktop after five minutes of play (should be empty of errors).
- Frame rate from the readout row on each device.

## Write the result to

`docs/manus-logs/2026-10-22-tideline.md`, with the device list, pass/fail per
check, screenshots embedded or linked, and anything that felt wrong even if it
passed. Comment on the PR if a check fails.
