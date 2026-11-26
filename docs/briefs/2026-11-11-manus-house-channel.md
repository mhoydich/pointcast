# Manus brief: House Channel on real devices (2026-11-11)

From Claude Code. House Channel v0 has only been run in headless desktop
Chrome with a pretend TV and a pretend phone. This brief is the real-device
check. Do it after the pull request is merged and `scripts/deploy.sh` has
run; until then the pages do not exist on pointcast.xyz.

No logins are needed anywhere. If a step seems to need one, stop and write
that down.

## URLs

- TV page: https://pointcast.xyz/house/
- Phone remote: https://pointcast.xyz/house/r/
- About: https://pointcast.xyz/house/about/
- JSON: https://pointcast.xyz/house.json
- Pairing endpoint: https://pointcast.xyz/api/house (GET should show `"store":"kv"`)

## Devices

1. A real smart TV using its own built-in web browser. Note the make, model year and browser version.
2. A laptop with Chrome, casting the tab to a TV or cast device.
3. An iPhone (Safari), on Wi-Fi and then on mobile data.
4. An Android phone (Chrome).

If a device is not available, say so in the log. Do not substitute an emulator and call it the device.

## Steps (repeat A to H once with the smart TV browser as the TV, once with the cast tab as the TV)

A. **Open and pair.** Open the TV page. It should show five large letters within a few seconds and must not say "Practice mode". On the iPhone open the remote, type the letters, press Pair. The TV should say a phone is paired and show the hearth.
B. **Second phone.** Pair the Android phone with the same letters. Both phones should say "2 phones". Then type a wrong code nine times in a minute on one phone: it should say to wait.
C. **Hearth.** Add two logs, choose 15 min, press and hold the fire on the phone until it lights. Time the gap between the phone and the TV by eye. Press and hold again to breathe; drag the lid down to snuff. On Android, note whether the phone buzzes. On iPhone it should not.
D. **Sound.** Press "Turn sound on" on a phone. Either the TV plays, or the TV shows "press OK or click" and the phone says the TV wants a press. Press OK on the TV remote (smart TV) or click the tab (laptop). Write down which happened on each TV. Try the volume slider and Mute. Nothing should ever play before a phone asked.
E. **Window.** Switch to Window. It should say LIVE or LIVE IN PART with a read time, or SIMULATED. Write down exactly what the badge and the bottom line say. Change the place. Switch to Simulated and move the sliders.
F. **Lights.** Switch to Lights. Until Light Companion is live it must say DEMO CIRCLE. If Light Companion is live (`https://pointcast.xyz/light/`), make a circle there, paste its link on the phone, light a light from another device, and check the window catches on the TV with a soft bell.
G. **Drum.** Switch to Drum. Tap pads on both phones. The TV should flash pads and make the sound. Open "the full drum room" link on one phone and tap there too.
H. **Manners.** Switch to Off: the TV must be fully black. Leave a view up with no input for 25 minutes: it should dim, and a tap on a phone should wake it. Lock the iPhone for five minutes while a fire burns, unlock it: the remote should reconnect without a code, and the fire must not have been covered by a pairing screen. Light a 15-minute fire and let it burn down. Press "Let another phone in": a code appears in the TV's corner. Finally press End twice: the TV goes black, both phones say Ended, and the old code no longer pairs.

Also, once: leave the smart TV browser on the hearth for two hours. Does the TV's own screensaver or sleep timer take over? Does the page stay connected?

## Capture

- A photo of each TV on the pairing screen, the hearth, the window (with the badge readable), the lights and the drum.
- A phone screenshot of each tab of the remote on iPhone and Android.
- For any failure: the exact words on both screens, and the browser console if the device allows it.
- A short video (10 seconds) of lighting the fire with the TV and phone both in frame.

## Where to write

`docs/manus-logs/2026-11-11-house-channel.md`, one section per device pairing, with a pass/fail line per step A to H and the device and browser versions.

## Needs Mike's approval

- Nothing in this brief changes production, costs money or posts anywhere.
- Do not deploy. If the pages are not live, stop and report that; the deploy is Mike's (`scripts/deploy.sh`).
- Do not use a real family circle link for step F without Mike saying so; make a new test circle.
