# Manus brief: real-device QA of Baby Bonfire, third pass (2026-11-11)

Owner: Claude Code. Tracks TASKS.md "Baby Bonfire: third pass". Run after the pull request is merged and deployed; before that, the same paths work on a Pages preview. This adds to the two earlier Baby Bonfire briefs; it does not replace them.

## Open these URLs

1. https://pointcast.xyz/baby-bonfire/ (the street, now twenty-one windows)
2. https://pointcast.xyz/baby-bonfire/the-helper/
3. https://pointcast.xyz/baby-bonfire/home-press/
4. https://pointcast.xyz/baby-bonfire/house-power/
5. https://pointcast.xyz/baby-bonfire/the-table/
6. https://pointcast.xyz/baby-bonfire/creatures/
7. https://pointcast.xyz/baby-bonfire/four-seasons/
8. https://pointcast.xyz/baby-bonfire/make-a-piece/ (card 3 links The Home Press)
9. https://pointcast.xyz/baby-bonfire.json

## Accounts and tools

None. Every page is public. Use a phone (iOS Safari first, Android Chrome if at hand) and one desktop browser with a keyboard.

## What to check and capture

- The street, phone: twenty-one houses, "Twenty-one windows, none lit yet" on a fresh browser, and each of the six new scenes lights its window on return. Screenshot the full street.
- Every new scene: "Back to the street" sits at the top and nothing is cut off at the bottom with the address bar shown and hidden. Sound starts only after a tap and the mute button works.
- The Helper: drag the stone to the floor with a finger (the page must not scroll); on "tends", light the hearth, press "+1 hour" and watch it fetch the snuffer; open "What it can't do".
- The Home Press: "Make it" at each of the five stations; "Share the file" and "Copy recipe text"; open "5 sources" and open all five links. Note any that are dead or show the wrong page.
- House Power: hold the crank with a finger (it should keep turning and no menu should appear), drag the sun, spend on the bell, open "Numbers" and open all seven links. Note any that are dead.
- The Table: drag pieces up from the shelf, light the covered flame with three pieces set, pass the plate, hold "Hold a moment", wash up. Try all three table styles.
- Creatures: drag the time slider across the day; tap a piece then a place; drag a piece from the tray.
- Four Seasons: drag the wheel a full turn with a finger; North and South; "No winter here"; play the sound bed.
- Reduced motion (system setting on): each scene still works and nothing loops.
- Console (desktop): note any errors or blocked requests. The pages should make no requests off pointcast.xyz.
- This is the least-tested part: touch on a real phone. The author checked in headless Chrome at 390 by 844 with a mouse only.

## Where to write the result

`docs/manus-logs/2026-11-11-baby-bonfire-pass-3.md`: one section per URL with what you saw, screenshots, device and browser names, and console errors verbatim.

## Approvals

Read-only QA; nothing here needs Mike's approval. Do not post about it anywhere public. Do not light anything.
