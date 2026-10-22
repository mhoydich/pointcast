# Manus brief: Morning Route real-device QA

Filed 2026-10-22 by Claude Code. Game: `/morning-route`, a paper route at
6:45 AM after Paperboy (1985), a wave-two cabinet on Cabinet Row, directed by
Michael Hoydich. Run this after the PR merges and `scripts/deploy.sh` reports
the new tip live (`npm run audit:publishing` should list `/morning-route` as
live, not merged-only). No Mike approval is needed for QA itself; nothing on
the page can spend, mint or post.

## URLs to open

- https://pointcast.xyz/morning-route (the game)
- https://pointcast.xyz/morning-route.json (must return JSON with `name: "Morning Route"`)
- https://pointcast.xyz/cabinet-row (the Morning Route cabinet should be lit; after a ride it shows your best score and the mood you left)
- https://pointcast.xyz/games/ (the catalog should list Morning Route under Retro arcade, just before Breakwater)
- https://pointcast.xyz/play (the play layer should list Morning Route)
- https://pointcast.xyz/b/0747 (the Block)

## Devices and browsers

1. iPhone, Safari, portrait: the stage fills the screen; drag anywhere to
   steer; drag up to speed up and down to slow; tap the right half of the
   field to throw. Try two thumbs: one dragging on the left, one tapping on
   the right. The FULL button is hidden (iOS has no page fullscreen).
2. iPhone, Safari: rotate to landscape mid-ride and back. The field
   letterboxes, the ride continues, nothing jumps off the field.
3. Android, Chrome, portrait: as 1, plus FULL enters fullscreen and EXIT leaves it.
4. Desktop, Chrome and Safari: arrows or WASD steer and pedal; Space throws;
   P pauses; F fullscreen; M mutes; C hides scanlines; 1 and 2 switch
   machines; 3 turns the dial. Click a settings button with the mouse, then
   press Space: it should throw (or start), not press the button again.

## What to check

- Boot: 800XL shows `READY` then `RUN "D:ROUTE"`; C64 shows the
  `**** POINTCAST 64 BASIC V2 ****` banner and `LOAD"MORNING ROUTE",8,1`.
  A tap skips either.
- Touch prompts say TAP, DRAG or SWIPE, never key names, on the title, the
  day card, the report card and the pause screen.
- Sound starts only after the first tap or key. Throw whoosh, porch thump,
  a two-note bell for a mailbox, a honk before a car backs out, an arf near
  the dog. Music stops when the tab is hidden and comes back on return.
- Delivering: a paper on a lit porch shows +100, in the mailbox +250 (the
  flag drops and a paper shows in the box); a paper on a dark house shows
  MISS. The bag count in the HUD falls and bundles refill it by five.
- Falls: bumping a bin, the dog, a skater, the car or a sprinkler while it
  sprays shows `2 LEFT`, then `1 LEFT`, then `LAST FALL` and ROUTE OVER.
  On CALM it says OOPS and the route never ends.
- Mood: five porches in a row should reach FLOW; a fall brings DRIFT (the
  street visibly slows, fewer obstacles); on the RUSH dial a ramp with four
  stars appears in the left lane; riding it lifts the rider and catches stars.
- A day ends after 16 houses with a report card (delivered, porches,
  mailboxes, misses, crashes, bonus, score, grade). A perfect day says
  PERFECT DAY: EXTRA RIDER on PLAY.
- Best score persists on reload; `pc:mood` in localStorage is one of
  chill / flow / hype / quiet after leaving a ride, and is not written by
  only opening the title screen.
- Reduced motion (OS setting): border bars stop scrolling, prompts stop
  blinking, the sprinkler stops sweeping, flashes are faint.
- Nothing scrolls the page while dragging on the field.

## Capture

- Per device: the title, mid-ride with a lit porch near the rider, a report
  card, and ROUTE OVER.
- One short screen recording of a full Monday on a phone.
- The desktop console after five minutes of play (should be empty of errors).
- Frame rate from the readout row on each device.

## Write the result to

`docs/manus-logs/2026-10-22-morning-route.md`, with the device list,
pass/fail per check, screenshots embedded or linked, and anything that felt
wrong even if it passed (especially whether Monday is too hard on a phone).
Comment on the PR if a check fails.
