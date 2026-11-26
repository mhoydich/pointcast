# Manus brief: real-device QA of the 3D pages (2026-11-11)

Owner: Claude Code. Tracks TASKS.md "PointCast in 3D: a spatial kit, the town, the Baby Bonfire room and table". Run after the pull request is merged and deployed. These pages have only been run by script: in headless Chrome, and in an emulated Quest 3 (Meta's Immersive Web Emulation Runtime). Nobody has worn them, and nothing has run on a phone's graphics chip. This brief is the first real test.

## Open these URLs

1. https://pointcast.xyz/vr/ (the town in 3D)
2. https://pointcast.xyz/baby-bonfire/room/ (the hearth room)
3. https://pointcast.xyz/baby-bonfire/ar/ (the fireplace as a model, and AR)
4. https://pointcast.xyz/vr/places.json and https://pointcast.xyz/spatial/README.md

## Accounts and tools

None for the pages. Devices, in this order of usefulness: a Meta Quest (2, 3 or 3S) with its built-in browser; an iPhone (Safari); an Android phone with Chrome; an Apple Vision Pro if one is to hand; one desktop browser. If no headset is to hand, do the phone and desktop parts and say so. Do not buy or borrow hardware without Mike's approval.

## What to check and capture

On a phone and a desktop browser (each of the three pages):

- First screen: the 3D view draws, the names on the buildings (or the fireplace) are readable, and nothing is cut off. Screenshot.
- Drag to look around. Tap the ground to move. Tap a building or a door: a panel should open with Open and Close. Open should go to the page it names.
- Scroll the page so the 3D view is off screen for ten seconds, then back. It should pick up where it was.
- The link list under the view: every building and door is there as a plain link. With a screen reader on, the list reads in order and the 3D view is skipped.
- Tab through with a keyboard (desktop): the view should turn toward each place as its link takes focus, and focus should never get stuck.
- Reduced motion (system setting on): moving should cut straight to the new spot with no glide; in the room the flame holds still.
- The room: press Sound and say whether the fire is heard; press and hold the fire and say whether it brightens.
- Frame rate: say whether it feels smooth, and note the device. On a phone that gets hot or stutters, say so.
- Console and network (desktop): note any error. Every request should be to pointcast.xyz.

In a headset (the town and the room):

- The page shows an "Enter VR" button. Press it. Say whether the session starts and what you see first.
- Height and scale: the floor should be at your feet and the buildings should feel like small pavilions, not toys and not towers. In the room the fireplace is 13 cm tall on a table; say whether it reads at that size.
- Point a controller at a building and pull the trigger: the panel opens. Point at the ground and pull the trigger: you move there after a short fade. Push the thumbstick left or right: the view turns in steps, never smoothly.
- Put the controllers down and use hands: pinch at a building. Say whether the panel opens.
- With no controllers and no hands tracked (Quest: controllers off and hands disabled, or look-only), look at a building for a second and a half: the panel should open. Looking at the ground, at Open, or at a door must not move you or open anything. This matters; please test it carefully.
- From the town, open the "Hearth room" door from inside VR. Say whether the next page starts in VR by itself or drops you back to a flat page.
- Comfort: say plainly if anything made you queasy: any motion you did not ask for, anything too close to your face, text too small to read.
- Leave VR with the headset's own button. The page should return to its flat view and still work.
- On a Vision Pro, if one is to hand: look at a building and pinch. Say whether it selects. This path has only been tried with a simulated input.

AR (the table page):

- iPhone, Safari: "View on your table" should open AR Quick Look. Place the fireplace on a real table and photograph it beside a coffee mug for scale. It should be about 13 cm tall.
- Android, Chrome: the same button. Note whether it opens in the browser or in Google's viewer.
- Quest browser: the same button. Say whether the fireplace appears in the room.
- If the button is missing on a device, say which device and browser.

## Where to write the result

`docs/manus-logs/2026-11-11-spatial-qa.md`: one section per device with its name, system version and browser, what you saw for each check, screenshots or a screen recording from inside the headset, and console errors verbatim.

## Approvals

Read-only QA. Nothing here needs Mike's approval except getting hold of hardware. Do not post about it anywhere public. Do not light anything.
