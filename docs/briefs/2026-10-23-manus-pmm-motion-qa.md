# Manus brief: PMM motion lab, real-device QA

**From:** Claude Code, the motion thread of the PMM design sprints.
**Date:** 2026-10-23.
**Needs Mike approval:** no. This is read-only QA on a public page. Nothing is sent or stored.
**When:** after PR #1536 merges and deploys. Check with `npm run audit:publishing`, or open the URL and look for "PMM MOTION LAB".
**Write the result to:** `docs/manus-logs/2026-10-23-pmm-motion-qa.md`, then link it in a comment on PR #1536 or its follow-up.

## Why

The lab's frame timings come from headless Chromium with software rendering, which is not a phone. We need real-device numbers for three things:

- frame rate
- the reduced-motion setting
- battery feel

These decide whether the tape border on `boot` and `connect` ships as designed (see §7 of `docs/design-sprints/2026-10-23-pmm-motion.md`).

## Devices and accounts

- One iPhone, iOS 17 or later, Safari.
- One Android phone, Chrome. A mid-range phone is more useful than a flagship.
- No accounts needed.
- On the iPhone, connect it to a Mac to use Safari Web Inspector's Timelines.
- On Android, connect it to a desktop Chrome via `chrome://inspect` to use the Performance panel.

## URLs

- https://pointcast.xyz/pmm/motion/: the lab
- https://pointcast.xyz/pmm/: the app, for comparison only (motion is not wired in yet)

## Steps, on each phone

1. Open the lab. Check that nothing scrolls sideways. Screenshot the top of the page.
2. Under **ME**, pick SUNNY. Under **THEM**, pick HYPED. Under **1. Three sketches**:
   - tap **PLAY ON ALL THREE**, then **CONNECT**;
   - repeat for RECEIVE, REACT and THEIR MOOD.

   For each, note which direction you would want on your own phone, and why, in a sentence.
3. Under **2. The chosen system**, tap each of the 16 keys in order. Note any moment that:
   - looked janky or stuttered;
   - hid text you were trying to read;
   - flickered uncomfortably.
4. Tap **RECEIVE ALL EIGHT**. Can you tell the eight moods apart without reading the mood label? Write down which ones blur together.
5. Frame rate:
   - start a recording (Safari Timelines with "Rendering Frames", or Chrome Performance);
   - tap BOOT, CONNECT, RECEIVE ALL EIGHT, then the emote row;
   - stop after about 10 s.
   - Report dropped frames, or the longest frame in ms, for BOOT and CONNECT separately. Export the trace if you can and attach it.
6. Reduced motion:
   - turn on the OS setting (iOS: Settings → Accessibility → Motion → Reduce Motion; Android: Settings → Accessibility → Remove animations);
   - reload the lab. The line under the toggle should read YOUR DEVICE ASKS FOR REDUCED MOTION, with the toggle already checked;
   - repeat step 3. Check that nothing slides, shakes or bounces, the emotes hold still, and each event still visibly does something;
   - turn the setting back off.
7. Battery feel:
   - leave the lab open on the emotes section, screen on, for 5 minutes;
   - note whether the phone gets warm. Note the battery percentage before and after if the phone shows it.
   - Then lock the phone for 1 minute and unlock it. The emotes should resume without a burst of catch-up frames.

## Capture

- Screenshots: step 1, one mid-animation if you can catch it, and step 6 with the toggle checked.
- The frame numbers from step 5, per phone.
- Your pick from step 2, the blurring moods from step 4, and anything from step 3.
- Phone model, OS version, browser version.

## Acceptance

- [ ] No sideways scroll at phone width.
- [ ] BOOT and CONNECT drop no more than a few frames on the mid-range Android.
- [ ] With Reduce Motion on, nothing moves position and nothing flickers; every event still shows something.
- [ ] No noticeable warmth after 5 minutes on the emotes.
- [ ] No moment in the chosen system hides text while you are reading it.
