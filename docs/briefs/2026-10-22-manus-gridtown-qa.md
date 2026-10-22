# Manus brief — Gridtown real-device QA (2026-10-22)

Real-browser and real-phone check of Gridtown, the browser city builder, after it is deployed. Headless Chromium already covers mouse play, a touchscreen tap, undo and layout widths; what it cannot cover is a real finger on a real phone.

## Open

- https://pointcast.xyz/gridtown/
- https://pointcast.xyz/gridtown/?seed=7
- https://pointcast.xyz/gridtown.json
- https://pointcast.xyz/b/0740
- https://pointcast.xyz/play/games/gridtown/

## Tools / accounts

None. Public pages, no login, no wallet. Use one iPhone (Safari) and one Android phone (Chrome) if available, plus a desktop browser.

## Check

1. **Phone first screen.** On the phone, the map, the row of tools under it and the Next month button are visible without scrolling, and the page never scrolls sideways.
2. **Swipe versus build.** Start a vertical swipe on the map: the page scrolls and no road is laid. Tap a tile with Road selected: one road appears when you lift your finger. Touch and hold a tile for a moment, then drag: roads paint along your finger and the page does not scroll.
3. **Undo.** After a stray tap, Undo takes the build back and the funds return.
4. **Lessons 1 to 6.** Play by touch to "Reach 50 residents". Each lesson ticks off with a status line; the town title above the name changes from Open country to Hamlet to Village.
5. **Inspect.** Choose Inspect, tap a home that is not growing, and read the panel: it should name one next step (a road, a power plant, more jobs or smoke).
6. **Keyboard only (desktop).** Tab to the map, then arrow keys, Enter to build, 1 to 6 and 0 for tools, I to inspect, Z to undo, N for the next month.
7. **Save.** Reload the page: the city is still there.
8. **City link.** Press Share this city (on a phone this opens the share sheet). Open the link in a private window: a blue banner says you are visiting; tools are dimmed; Inspect still works; Keep it as my city saves it; reload keeps it.
9. **Map link.** Share the empty map; open it in another private window: the same river and trees, no buildings.
10. **Export and import.** Export city, start a New city, import the file: the town comes back.
11. **Game library.** `/play/games/gridtown/` shows the card and the Download game pack link; the zip downloads and its README explains how to play locally.
12. **JSON.** `/gridtown.json` returns 7 tools, 12 lessons, 6 town titles and a sample `cityCode`.

## Capture

Phone screenshots of the first screen, the inspector, the visit banner and the share sheet; a short screen recording of swipe-scroll versus hold-to-paint; desktop screenshot after keyboard-only play; the JSON response headers.

## Write results to

`docs/manus-logs/2026-10-22-gridtown-qa.md`

## Approval

None needed for QA. Do not post city links publicly; that is Mike's call.
