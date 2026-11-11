# Manus brief: Breakwater real-device QA

Filed 2026-10-22 by Claude Code. Game: `/breakwater`, a breakout for the
8-bit heart, directed by Michael Hoydich. Run this after the PR merges and
`scripts/deploy.sh` reports the new tip live (`npm run audit:publishing`
should list `/breakwater` as live, not merged-only). No Mike approval is
needed for QA itself; nothing on the page can spend, mint or post.

## URLs to open

- https://pointcast.xyz/breakwater (the game)
- https://pointcast.xyz/breakwater.json (must return JSON with `name: "Breakwater"`)
- https://pointcast.xyz/games/ (the catalog should list Breakwater under Retro arcade)
- https://pointcast.xyz/play (the play layer should list Breakwater)
- https://pointcast.xyz/b/0739 (the Block receipt)

## Devices and browsers

1. iPhone, Safari, portrait: the stage should fill the screen; drag anywhere
   on the field to move the paddle; tap to serve; the FULL button is hidden
   (iOS has no page fullscreen) and nothing else overlaps the field.
2. iPhone, Safari, landscape: the field letterboxes inside the border, still playable.
3. Android, Chrome, portrait: as 1, plus FULL enters fullscreen and EXIT leaves it.
4. Desktop, Chrome and Safari: mouse steers; Space serves; P pauses; F fullscreen;
   M mutes; C hides scanlines; 1 and 2 switch machines; 3 turns the dial.

## What to check

- Boot: 800XL shows `READY` then `RUN "D:BREAKWATER"` with short beeps after the
  first tap; C64 shows the `**** POINTCAST 64 BASIC V2 ****` banner, then
  `LOAD"BREAKWATER",8,1` with flickering border stripes. A tap skips either.
- Sound starts only after the first tap or key (browser rule). Each brick plays a
  note; clearing a row left to right plays a rising run. Music tempo rises in a
  long rally. Mute works and persists on reload.
- Mood: play a steady rally and watch the top-bar word go DAWN → FLOW; lose two
  balls quickly and see DRIFT (paddle visibly wider, ball slower, border bars
  gone); keep a hot rally going and see RUSH (border raster bars, a second ball
  once per wave).
- Dial CALM: no game over; losing a ball shows AGAIN and serves again.
- Extra ball at 400 points on PLAY or RUSH (a chime and a message).
- Wave clear: `WAVE n CLEAR`, then a new pattern; wave 5 spells `XL` or `64`.
- Switching machine mid-wave keeps the same bricks alive and only recolors.
- Game over: best score persists on reload; `pc:mood` in localStorage is set to
  one of chill / flow / hype / quiet after leaving the page.
- Reduced motion (OS setting): fewer particles, raster bars stop scrolling.
- Nothing scrolls while dragging on the field; the notes section below scrolls
  from the top bar or the readout row.

## Capture

- One screenshot per device of the title screen, mid-RUSH with raster bars, and
  DRIFT after losses.
- One short screen recording of a full wave on a phone.
- The browser console on desktop after five minutes of play (should be empty of errors).
- Frame rate from the readout row on each device.

## Write the result to

`docs/manus-logs/2026-10-22-breakwater.md`, with the device list, pass/fail per
check, screenshots embedded or linked, and anything that felt wrong even if it
passed. Comment on the PR if a check fails.
