# Manus brief: real-device QA of Baby Bonfire (2026-11-11)

Owner: Claude Code. Tracks TASKS.md "Baby Bonfire: an open exploration". Run after the pull request is merged and deployed; before that, the same paths work on a Pages preview.

## Open these URLs

1. https://pointcast.xyz/baby-bonfire/ (the street)
2. https://pointcast.xyz/baby-bonfire/light-the-hearth/
3. https://pointcast.xyz/baby-bonfire/the-shelf/
4. https://pointcast.xyz/baby-bonfire/the-rounds/
5. https://pointcast.xyz/baby-bonfire/any-object/
6. https://pointcast.xyz/baby-bonfire/paired-hearths/
7. https://pointcast.xyz/baby-bonfire/stations/
8. https://pointcast.xyz/baby-bonfire/weather-in-the-house/
9. https://pointcast.xyz/baby-bonfire/five-levels/
10. https://pointcast.xyz/baby-bonfire/seven-homes/
11. https://pointcast.xyz/baby-bonfire/cabinet-of-no-bounds/
12. https://pointcast.xyz/baby-bonfire/ritual-atlas/
13. https://pointcast.xyz/baby-bonfire/anchors-and-open-time/
14. https://pointcast.xyz/baby-bonfire/precedents/
15. https://pointcast.xyz/baby-bonfire/open-spec/, /open-mesh/, /barter-board/, /make-a-piece/
16. https://pointcast.xyz/baby-bonfire.json and https://pointcast.xyz/b/0782

## Accounts and tools

None. Every page is public. Use a phone (iOS Safari and Android Chrome if both are at hand) and one desktop browser.

## What to check and capture

- The street, phone: thirteen houses in three columns, the notice box readable without zooming, each house a comfortable tap. Screenshot the first screen and the full street.
- Lit windows: open a scene, come back with the browser's Back button and with the "Back to the street" link. The window should be lit both ways and the count should rise. Open all thirteen and confirm the beacon on the hill lights. "Put the lights out" clears them.
- Private browsing (iOS Safari Private, Chrome Incognito): the street still works; say whether windows stay lit after Back.
- Each scene: the "Back to the street" link is visible at the top and does not cover any control; nothing is cut off at the bottom of the screen (Light the Hearth and Weather in the House fill the screen exactly, so check those two with the address bar shown and hidden); touch, drag and press-and-hold work; sound starts only after a tap.
- Precedents: tap six outbound links at random and note any that are dead.
- Reduced motion (system setting on): the street still lights windows, without animation.
- Console (desktop): note any errors or blocked requests. The pages should make no requests off pointcast.xyz.

## Where to write the result

`docs/manus-logs/2026-11-11-baby-bonfire-qa.md`: one section per URL with what you saw, screenshots, device and browser names, and console errors verbatim.

## Approvals

Read-only QA; nothing here needs Mike's approval. Do not post about it anywhere public. Do not light anything.
