# Manus brief: Kelp real-device QA

Filed 2026-10-22 by Claude Code. Game: `/kelp`, a snake for the 8-bit heart,
directed by Michael Hoydich, thread 2 of 5 on the games brief. Run this after
the PR merges (it stacks on Breakwater's #1478) and `scripts/deploy.sh`
reports the new tip live (`npm run audit:publishing` should list `/kelp` as
live, not merged-only). No Mike approval is needed for QA itself; nothing on
the page can spend, mint or post.

## URLs to open

- https://pointcast.xyz/kelp (the game)
- https://pointcast.xyz/kelp.json (must return JSON with `name: "Kelp"`)
- https://pointcast.xyz/games/ (the catalog should list Kelp under Retro arcade, next to Breakwater)
- https://pointcast.xyz/play (the play layer should list Kelp)
- https://pointcast.xyz/b/0728 (the Block receipt)

## Devices and browsers

1. iPhone, Safari, portrait: the stage should fill the screen; the 24 x 32
   grid letterboxes inside the border with the wall frame visible on all four
   sides; swipe anywhere on the field to turn; tap to start; the FULL button
   is hidden (iOS has no page fullscreen) and nothing overlaps the field.
2. iPhone, Safari, landscape: the grid shrinks to fit the height, still playable.
3. Android, Chrome, portrait: as 1, plus FULL enters fullscreen and EXIT leaves it.
4. Desktop, Chrome and Safari: arrows and W A S D turn; the first arrow starts
   the swim; Space starts; P pauses; F fullscreen; M mutes; C hides scanlines;
   1 and 2 switch machines; 3 turns the dial.

## What to check

- Boot: 800XL shows `READY` then `RUN "D:KELP"` with short beeps after the
  first tap; C64 shows the `**** POINTCAST 64 BASIC V2 ****` banner, then
  `LOAD"KELP",8,1` with flickering border stripes. A tap skips either.
- Title: an attract strand swims by itself behind the KELP letters and never
  sits still or freezes; a collision in the attract just starts a new strand.
- Swipe: a swipe turns the strand at the next tick; a swipe straight back
  (reverse) is ignored; a continuous drag that changes direction turns again
  without lifting the finger; the page never scrolls while dragging on the
  field; a plain tap starts the swim and does not turn it.
- Sound starts only after the first tap or key (browser rule). Each plankton
  plays a note one step higher than the last; after five plankton the line is
  an octave up. A collision is a low thud. Mute works and persists on reload.
- Mood: eat steadily and watch the top-bar word go DAWN → FLOW (the strand's
  bands start cycling, plankton worth 15 instead of 10 on stage 1); collide
  twice quickly and see DRIFT (ticks visibly slower, the next strand starts
  three long instead of four, the next stage's rocks thinner); keep an unbroken
  run going and see RUSH (border raster bars, a golden blinking plankton that
  speeds the strand up for a moment when eaten and shows `+60` or more).
- Dial CALM: no lives shown, `CALM` in the top right; a collision shows AGAIN
  and the strand restarts at its start length on the same stage.
- Stage clear at length 12 on stage 1: `STAGE 1 CLEAR`, then a new pattern
  (`POSTS`); stage 4 spells `XL` or `64`; stage 7 spells `07` with a doorway
  cut through the loop of the 0; the third stage clear shows `EXTRA LIFE`.
- Switching machine mid-stage only recolors; no rock lands on the strand.
- Game over: best score persists on reload; `pc:mood` in localStorage is set
  to one of chill / flow / hype / quiet after leaving the page, and is NOT set
  if you only looked at the title screen.
- Reduced motion (OS setting): bands stop cycling, raster bars stop scrolling,
  fewer particles, no shake on collision.
- The readout row never changes height while its text changes; the notes
  section below scrolls from the top bar or the readout row.

## Capture

- One screenshot per device of the title screen, mid-RUSH with the golden
  plankton visible, DRIFT after collisions, and the `64` nameplate stage.
- One short screen recording of a stage clear on a phone, including the swipe
  that turns the strand.
- The browser console on desktop after five minutes of play (should be empty of errors).
- Frame rate from the readout row on each device.

## Write the result to

`docs/manus-logs/2026-10-22-kelp.md`, with the device list, pass/fail per
check, screenshots embedded or linked, and anything that felt wrong even if it
passed. Comment on the PR if a check fails.
