# Manus brief: Stretch with Claude real-device QA

Filed 2026-10-23 by Claude Code. Page: `/stretch`, a 2, 5 or 8 minute guided
stretch break with a pixel figure, a before-and-after mood check-in, and
chip-tune cues. Run this after the PR merges and `scripts/deploy.sh` reports
the new tip live (`npm run audit:publishing` should list `/stretch` as live,
not merged-only). No Mike approval is needed: nothing on the page can spend,
mint, post, or send data anywhere.

## URLs to open

- https://pointcast.xyz/stretch (the room)
- https://pointcast.xyz/stretch.json (JSON with `name: "Stretch with Claude"`, three sessions of 120, 300 and 480 seconds, ten poses)
- https://pointcast.xyz/b/0763 (the Block; card art should be the three pixel figures)
- https://pointcast.xyz/for-agents and https://pointcast.xyz/agents.json (both should mention `/stretch`)

## Accounts and tools

None. Use a phone (iPhone Safari and Android Chrome) and a desktop browser
(Chrome and Safari). Turn the phone's ringer on so you can hear the cues.

## Devices and checks

1. **iPhone Safari, portrait, one hand.** Pick a mood (TIRED should suggest
   Evening unwind, HYPED should suggest Desk reset). Start Phone neck. Every
   button should be reachable with the thumb and nothing should overlap the
   BACK / PAUSE / NEXT row. No sideways scrolling.
2. **Sound.** Nothing plays before the first tap. After starting: a short
   rising arpeggio, a soft low tick on each breath change, a two-note blip on
   each new pose, a four-note chime at the end. SND OFF silences all of it,
   and stays off after a reload.
3. **Wake lock.** Start Desk reset, put the phone down, and don't touch it for
   two minutes. On Android Chrome and iOS 16.4+ the screen should stay on
   while running. Pause: the screen may sleep again. Older iOS: no error,
   the screen just sleeps.
4. **Background tab.** Start a session, switch apps for 30 seconds, come back.
   The clock should have moved on by about 30 seconds, not frozen.
5. **Desktop keyboard only.** Tab to a session, press Enter. Space pauses and
   resumes (even with focus on NEXT, Space should only pause). Right arrow
   goes to the next pose, Left arrow restarts the pose or, in its first two
   seconds, goes back one. M toggles sound. Focus rings should be visible
   (yellow).
6. **Reduced motion.** macOS: System Settings › Accessibility › Display ›
   Reduce motion. iOS: Settings › Accessibility › Motion › Reduce Motion.
   The figure should hold still on each pose (no breathing movement, no dot
   around the box), the cursor stops blinking, and the step list under THE
   PLAN still shows progress.
7. **Finish.** Let Phone neck run out, or press NEXT to the end. Pick a mood:
   the line should read "You came in X, you leave Y." For CALM, HYPED,
   CURIOUS, TIRED or LOW a checkbox appears to carry the mood around
   PointCast; tick it, open the home page, and the page tint should match
   (calm → chill, hyped → hype, curious → curious, tired/low → quiet). For
   SOFT, SUNNY or SALTY there should be no checkbox.
8. **Storage blocked.** In Safari private browsing, or with site data
   blocked, the page should still run and finish with no errors.

## Capture

- Screenshots: the pick screen, a running pose, a paused pose, and the done
  screen, on iPhone and desktop; one with Reduce Motion on.
- A short screen recording (about 10 seconds, with sound) of a pose changing.
- Any console errors from desktop Chrome DevTools.
- The value of `localStorage['stretch:v1']` after one finished session.

## Where to write it

`docs/manus-logs/2026-10-23-stretch-qa.md`, one section per device with
pass/fail per numbered check above and links to the screenshots.

## Also check

The copy should read as Claude's guide, with no Anthropic logo or brand marks
anywhere, and the safety line ("Not medical advice. Stop if anything hurts…")
should be visible on the pick screen and under the plan.
