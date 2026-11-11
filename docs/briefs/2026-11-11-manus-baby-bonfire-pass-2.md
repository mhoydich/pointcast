# Manus brief: real-device QA of Baby Bonfire, second pass (2026-11-11)

Owner: Claude Code. Tracks TASKS.md "Baby Bonfire: second pass". Run after the pull request is merged and deployed; before that, the same paths work on a Pages preview. This adds to `docs/briefs/2026-11-11-manus-baby-bonfire-qa.md`; it does not replace it.

## Open these URLs

1. https://pointcast.xyz/baby-bonfire/ (the street, now fifteen windows)
2. https://pointcast.xyz/baby-bonfire/pieces-roam/ (The Roaming Shelf, new)
3. https://pointcast.xyz/baby-bonfire/mesh-street/ (Mesh Street, new)
4. https://pointcast.xyz/baby-bonfire/the-shelf/ (one new line above the footer)
5. https://pointcast.xyz/baby-bonfire/open-mesh/ (new section "One way it could look")
6. https://pointcast.xyz/baby-bonfire/precedents/ (new shelf "Earlier on PointCast")
7. https://pointcast.xyz/baby-bonfire.json

## Accounts and tools

None. Every page is public. Use a phone (iOS Safari and Android Chrome if both are at hand) and one desktop browser with a keyboard.

## What to check and capture

- The street, phone: fifteen houses, the count line reads "Fifteen windows, none lit yet" on a fresh browser, and opening the two new scenes lights their windows on return. Screenshot the full street.
- The Roaming Shelf, phone, with a finger:
  - Drag the key ring from the entry bench to the entry shelf. The page must not scroll while the finger is on a piece. "Home" should light in the list and the entry should glow.
  - Drag the stone from the desk to a window spot: "Workday over". Carry it to the side table and back to the window: it should say no workday ends.
  - Drag the hat to the hat hook: "Out today". Drag any other piece to the hook: nothing changes, and the line says only the hat means anything there.
  - Put three pieces on the table: "Dinner". Fill all three desk spots: "The desk is a shrine".
  - Drop a piece on an occupied spot: the two trade places. Drop a piece on bare floor: it goes back.
  - Tap a piece, then tap a spot (no drag). Same results.
  - Scroll the page with a finger on the floor of a room, not on a piece. It should scroll.
  - This is the least-tested part: iOS Safari was not available to the author. Say plainly whether drag works there.
- The Roaming Shelf, desktop keyboard only: Tab to a piece, Enter, Tab or arrow keys to a spot, Enter. Escape lets go. The focus ring must be visible on pieces and on empty spots. With a screen reader on, note what is announced after a move.
- Reduced motion (system setting on): pieces land without a bounce and the lights change without a fade.
- Mesh Street, phone: nothing is cut off at the bottom with the address bar shown and hidden; tap a house to light it; drag "Rooftop radio" onto a roof; switch Internet off and light another house; open "What's real" and close it. Sound starts only after a tap.
- The Shelf: the new line links to The Roaming Shelf and does not push the footer off screen.
- Precedents: the header count reads 107 entries on 15 shelves. Tap the "Earlier on PointCast" chip: 14 cards. Open all 14 "Open pointcast.xyz/..." links and every "Block" link; note any that are dead or show the wrong page. These links stay in the same tab.
- Console (desktop): note any errors or blocked requests on the six pages. They should make no requests off pointcast.xyz.

## Where to write the result

`docs/manus-logs/2026-11-11-baby-bonfire-pass-2.md`: one section per URL with what you saw, screenshots, device and browser names, and console errors verbatim.

## Approvals

Read-only QA; nothing here needs Mike's approval. Do not post about it anywhere public. Do not light anything.
