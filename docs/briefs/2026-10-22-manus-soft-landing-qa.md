# Manus brief: Soft Landing real-device QA

Filed 2026-10-22 by Claude Code. Game: `/soft-landing`, a lunar lander for
the 8-bit heart, directed by Michael Hoydich; thread 3 of the five games that
followed Breakwater. Run this after the PR merges (it stacks on the Breakwater
PR, #1478) and `scripts/deploy.sh` reports the new tip live
(`npm run audit:publishing` should list `/soft-landing` as live, not
merged-only). No Mike approval is needed for QA itself; nothing on the page can
spend, mint or post.

## URLs to open

- https://pointcast.xyz/soft-landing (the game)
- https://pointcast.xyz/soft-landing.json (must return JSON with `name: "Soft Landing"`)
- https://pointcast.xyz/games/ (the catalog should list Soft Landing under Retro arcade, next to Breakwater)
- https://pointcast.xyz/play (the play layer should list Soft Landing after Breakwater)
- https://pointcast.xyz/b/0729 (the Block receipt)

## Devices and browsers

1. iPhone, Safari, portrait: the stage should fill the screen; hold the middle
   third of the field to burn and the left or right third to tilt; a finger
   that slides from the middle to a side should stop burning and start tilting
   without lifting; the FULL button is hidden (iOS has no page fullscreen) and
   nothing else overlaps the field.
2. iPhone, Safari, landscape: the field letterboxes inside the border, still playable.
3. Android, Chrome, portrait: as 1, plus FULL enters fullscreen and EXIT leaves it.
4. Desktop, Chrome and Safari: Up or Space burns; Left/Right tilt; P pauses;
   F fullscreen; M mutes; C hides scanlines; 1 and 2 switch machines; 3 turns the dial.

## What to check

- Boot: 800XL shows `READY` then `RUN "D:SOFTLAND"` with short beeps after the
  first tap; C64 shows the `**** POINTCAST 64 BASIC V2 ****` banner, then
  `LOAD"SOFT LANDING",8,1` with flickering border stripes. A tap skips either.
- Title: the attract lander flies itself down to the widest pad, rests, and a
  new skyline appears.
- Sound starts only after the first tap or key (browser rule). The engine roar
  rises and falls with the burn and stops the instant the finger lifts; a side
  jet ticks; a landing gives a low rumble; a crash gives a descending slide.
  Mute works and persists on reload.
- Instruments: ALT, HS, VS and FUEL in the top right. HS and VS turn red when
  over the limit (14 and 24), the attitude bar turns red when tilted too far,
  FUEL turns red under 150. Landing with any red number should crash with the
  matching word (TOO FAST, DRIFTING, TILTED, NO PAD).
- Landing: `SOFT X1 +n` or `DOWN X1 +n`, fuel goes up by 100 times the pad
  multiplier, a new skyline arrives about two seconds later, `LAND n` in the
  readout row counts up.
- Crash: debris, a flash, the lander count in the top right drops by one, then
  the same skyline returns. After a crash the top-bar word should read DRIFT
  and the pads should be visibly wider than before.
- Mood: a run of good landings with controlled burns should take the word to
  FLOW; on the RUSH dial a hot run should bring raster bars in the border, a
  `WIND>` or `<WIND` marker, and a narrow 5X pad.
- Dial CALM: FUEL reads `CALM`, a crash shows its reason and the same lander
  count comes back; no game over.
- Game over: `GAME OVER`, score, best, landings and peak mood; best persists on
  reload; `pc:mood` in localStorage is one of chill / flow / hype / quiet after
  leaving the page, and is not set by only looking at the title screen.
- Out of fuel on PLAY or RUSH: the lander falls; the game ends with `OUT OF FUEL`.
- Reduced motion (OS setting): steady flame, fewer particles, raster bars stop scrolling.
- Nothing scrolls while holding the field; the notes section below scrolls
  from the top bar or the readout row.
- Switching the tab mid-burn and coming back: the game is paused, the roar is
  silent, no key or finger is still "held".

## Capture

- One screenshot per device of the title screen, a moment before touchdown with
  the instruments green, DRIFT after a crash, and the RUSH border bars.
- One short screen recording of a landing on a phone, with sound.
- The browser console on desktop after five minutes of play (should be empty of errors).
- Frame rate from the readout row on each device.

## Write the result to

`docs/manus-logs/2026-10-22-soft-landing.md`, with the device list, pass/fail
per check, screenshots embedded or linked, and anything that felt wrong even if
it passed (the fuel economy and the crosswind strength are the two numbers most
likely to need a tune). Comment on the PR if a check fails.
