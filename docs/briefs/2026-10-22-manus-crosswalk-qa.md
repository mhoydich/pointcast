# Manus brief: Crosswalk real-device QA

Filed 2026-10-22 by Claude Code. Game: `/crosswalk`, five lanes to the sand,
directed by Michael Hoydich; thread 4 of 5 after Breakwater. Run this after
the PR merges (it stacks on #1478, so Breakwater must be live first) and
`scripts/deploy.sh` reports the new tip live (`npm run audit:publishing`
should list `/crosswalk` as live, not merged-only). No Mike approval is
needed for QA itself; nothing on the page can spend, mint or post.

## URLs to open

- https://pointcast.xyz/crosswalk (the game)
- https://pointcast.xyz/crosswalk.json (must return JSON with `name: "Crosswalk"`)
- https://pointcast.xyz/games/ (the catalog should list Crosswalk under Retro arcade, next to Breakwater)
- https://pointcast.xyz/play (the play layer should list Crosswalk after Breakwater)
- https://pointcast.xyz/b/0729 (the Block receipt)

## Devices and browsers

1. iPhone, Safari, portrait: the stage should fill the screen; swipe anywhere
   on the field to hop; a tap above, below, left or right of the beach-goer
   hops that way; the FULL button is hidden (iOS has no page fullscreen) and
   nothing overlaps the field. The hint under the median says SWIPE OR TAP,
   never a key name.
2. iPhone, Safari, landscape: the field letterboxes inside the border, still playable.
3. Android, Chrome, portrait: as 1, plus FULL enters fullscreen and EXIT leaves it.
4. Desktop, Chrome and Safari: arrows and W A S D hop (one hop per press,
   repeating when held); Space starts; P pauses; F fullscreen; M mutes;
   C hides scanlines; 1 and 2 switch machines; 3 turns the dial. Keys do
   nothing while a button in the top bar has focus.

## What to check

- Boot: 800XL shows `READY` then `RUN "D:CROSSWALK"` with short beeps after the
  first tap; C64 shows the `**** POINTCAST 64 BASIC V2 ****` banner, then
  `LOAD"CROSSWALK",8,1` with flickering border stripes. A tap skips either.
- Title: an attract-mode beach-goer crosses on its own, waiting for gaps, and
  rests at a tower. Tapping starts a game without also hopping.
- Sound starts only after the first tap or key (browser rule). Each hop plays
  a blip that rises row by row; a hit plays a two-tone horn; a tower plays four
  notes; the last five seconds of the clock tick. Mute works and persists on reload.
- Crossing: the clock bar at the bottom drains over thirty seconds; a tower
  pays 50 plus 10 per second left (watch the `+NNN` message); hopping into the
  water between towers is SPLASH; a full tower says TOWER FULL and blocks.
- Mood: a run of safe hops takes the top-bar word DAWN → FLOW; two quick hits
  show DRIFT (traffic visibly thinner, lanes slower, the clock bar longer,
  border bars gone); a hot run on the RUSH dial shows RUSH (raster bars, a
  beach ball on the sand; carrying it to a tower pays an extra 200).
- Dial CALM: no lives in the top-right corner (it says CALM); a hit shows
  OUCH and walks you back to the sidewalk; no game over.
- Stage: fill all four towers, see `STAGE 1 CLEAR`, then every lane reversed
  and faster, with a 28-second clock.
- Extra beach-goer at 2000 points on PLAY or RUSH (a chime and an announcement).
- Switching machine mid-crossing only recolors; positions do not change.
- Game over: best score persists on reload; `pc:mood` in localStorage is set to
  one of chill / flow / hype / quiet after leaving the page, and `crosswalk:v1`
  holds best, machine, dial, sound, crt and the mood tape.
- Hidden tab: switch away mid-crossing and back; the game is PAUSED, music
  stopped, and resumes on tap. No burst of notes on return.
- Reduced motion (OS setting): fewer particles, raster bars stop scrolling,
  the water does not drift, no shake on a hit.
- Nothing scrolls while swiping on the field; the notes section below scrolls
  from the top bar or the readout row.

## Capture

- One screenshot per device of the title screen, mid-RUSH with raster bars and
  the beach ball, and DRIFT after hits.
- One short screen recording of a full crossing on a phone, swipe-driven.
- The browser console on desktop after five minutes of play (should be empty of errors).
- Frame rate from the readout row on each device.

## Write the result to

`docs/manus-logs/2026-10-22-crosswalk.md`, with the device list, pass/fail per
check, screenshots embedded or linked, and anything that felt wrong even if it
passed. Comment on the PR if a check fails.
