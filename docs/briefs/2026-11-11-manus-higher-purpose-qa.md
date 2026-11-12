# Manus brief: real-device QA of A Higher Purpose (2026-11-11)

Owner: Claude Code. Tracks TASKS.md "Baby Bonfire: A Higher Purpose". Run after the pull request is merged and deployed (or on its Pages preview). The page draws a 3D island with WebGL and plays a loop made in the browser. It has only been run by script in headless Chrome with a software renderer. It has not run on a real phone or in a headset, and nobody has heard it.

## Open these URLs

1. https://pointcast.xyz/baby-bonfire/higher-purpose/
2. https://pointcast.xyz/baby-bonfire/ (the section "Two screens, for now")

## Accounts and tools

None. Use an iPhone (Safari) first, then an Android phone (Chrome), one desktop browser, and a VR headset browser if one is to hand (Quest Browser). Headphones and the phone speaker.

## What to check and capture

- First screen: the island drawn in large square pixels behind a small card with "Begin". Nothing sounds before the tap. Screenshot.
- Tap "Begin": the view drifts forward and a loop starts (kick, shaker, bass, small square and triangle voices). On iPhone, try with the silent switch on and off.
- The four buttons at the bottom: each walks to a place (fire, water, air, ground). Say whether the place's own sound comes forward as you arrive: crackle, a water swell, a breathy pad, a low drone.
- Drag to look; tap the ground to walk there; tap a place in the scene. "Tilt" on a phone should ask for motion permission on iPhone, then follow the phone.
- Smoothness: say whether it stutters on each phone. The page aims at 30 frames a second on phones.
- "Sound off" silences at once; "Sound on" brings it back. Lock the phone for a minute and unlock: sound should resume only if it was on.
- Reduced motion on: the camera should cut rather than glide, and the scene should move slowly with no pulse on the beat.
- Desktop: WASD or arrows, Q and E to turn, 1 to 4 for the places.
- Headset: "Enter VR" should appear only there. Inside, look at a place for about two seconds, or point and select, to walk to it. Note comfort, scale and anything that feels wrong.
- Console and network: no errors; the only requests are the page and /favicon.svg.

## Where to write the result

`docs/manus-logs/2026-11-11-higher-purpose-qa.md`: one section per check, device and browser versions, a short screen recording with sound, and console errors verbatim.

## Approvals

Read-only QA; nothing here needs Mike's approval. Do not post about it anywhere public.
