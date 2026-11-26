# Manus brief: two-phone QA of Light Companion (2026-11-11)

Owner: Claude Code. Tracks TASKS.md "Light Companion v0". Run only after the pull request "Light Companion v0: a shared light between people" has merged and deployed with `scripts/deploy.sh`. If https://pointcast.xyz/light/ is not live, say so and stop. Do not deploy anything.

## Open these URLs

1. https://pointcast.xyz/light/ (the landing page)
2. The circle link the landing page takes you to after "Make a circle". It looks like `https://pointcast.xyz/light/c/` followed by 32 letters and digits. This is a private link: use it only on your two phones.
3. https://pointcast.xyz/light.json (should show JSON)
4. https://pointcast.xyz/api/light (should show a short JSON description, no circle data)

## Accounts and tools

No accounts. Two real phones, ideally one iPhone (Safari) and one Android phone (Chrome), on different networks if possible (one on Wi-Fi, one on mobile data). One desktop browser for the console check.

## What to do and capture

Call the phones A and B. Take a screenshot at each numbered step and note the time on each phone.

1. Phone A: open URL 1. Read the page. Confirm the line "This is not an emergency or monitoring service. It cannot call for help." is visible without hunting for it. Tap "Make a circle".
2. Phone A: on the join screen, confirm the same line is there. Enter a name, pick a flame colour, tap Join. Confirm the small ember at the top glows and reads "Connected to the circle". If the page says "Practice mode", stop and report it: that means the database binding is missing in production.
3. Phone A: tap "Share the link" and send the link to phone B by any private channel (AirDrop, a text to yourself). Note how the link previews in the messaging app: it should show a generic Light Companion card or no card, never names from the circle.
4. Phone B: open the link. Confirm "I am <A's name>" is offered, then join as a different name with a different colour.
5. Phone A: confirm B's window appears within about ten seconds without reloading.
6. Phone A: tap your own window briefly. It should not light, and a hint should say to keep holding. Then press and hold it for about a second. Record: did the phone vibrate (Android should; iPhone will not), did a soft sound play, and did the long press pop up any system menu or text selection.
7. Phone B: time how long until A's window lights. It should be under ten seconds. Confirm it reads "up since" with a time that matches phone B's own clock and time format. Did a soft bell play on B? (It only can after B has touched the page once.)
8. Phone B: light your own. Phone A should see it. Reload phone A and watch the two lit windows catch one after the other.
9. Phone B: switch "My light stays lit" to "1 hour", snuff, and light again. Leave it. Check back after 61 minutes: B's window should be dark on both phones with no one touching anything. (If you cannot wait, say so in the log.)
10. Phone A: tap your lit window once to snuff. Confirm phone B shows it "not lit" within ten seconds.
11. Phone B: turn on airplane mode. Within about fifteen seconds the ember should go out, the status should read "Not connected", a dashed box should say the page cannot see the circle, and every window should turn hatched with a question mark and "cannot see". Screenshot this next to a screenshot of a normal "not lit" window: they must look clearly different. Tap your own window: it should say it cannot change right now. Turn airplane mode off and confirm the ember and the real states come back on their own.
12. Both phones: use the browser's "Add to Home Screen". Open from the home screen icon. Record whether it opens straight to the circle (not the landing page, not the join screen), whether it runs full screen, and what the icon and label look like. On iPhone, note whether you had to join again: home-screen apps can have separate storage, and if so you should be able to tap "I am <name>".
13. Phone A: lock the phone for five minutes with the circle open, have B light and snuff once, then unlock A. Record how long A takes to show the right state.
14. Phone A: tap "Drum together". Confirm it opens a drum room whose code starts with `LIGHT-`, and that phone B's "Drum together" opens the same room. Tap a few drums on A and note whether B hears or sees them. Go back to the circle.
15. Phone B: "Name and colour": rename and recolour. Confirm A sees it.
16. Phone B: "Leave circle" then "Forget this device". Reopen the link on B: it should offer "I am <name>". Reclaim it.
17. Phone A: "Put out the circle", read the confirm, and confirm. Phone B should show "No circle here" within ten seconds. Reopen the link on both: still gone.
18. Desktop: repeat steps 1, 2 and 6 with the console open and paste any errors or warnings verbatim. Tab to your window and hold Enter to light it; press Enter again to snuff. With a screen reader if you have one (VoiceOver is fine), read your own window and one other.
19. Large text: on one phone set the system text size to its largest and screenshot the circle page. Note anything cut off or overlapping.

## Where to write the result

`docs/manus-logs/2026-11-11-light-companion.md` in mhoydich/pointcast: device and browser names with versions, one section per step with what you saw and the screenshot, the measured delays in steps 5, 7, 10, 11, 13 and 17, and console output verbatim. Crop or blur the circle link in every screenshot, and do not write the link in the log.

## Approvals

- Nothing in this brief needs Mike's approval once the page is deployed: you only make and delete your own test circle.
- Needs Mike's approval and is not part of this brief: merging or deploying the pull request, announcing Light Companion anywhere, and inviting real people into a circle.
- Do not post results or screenshots anywhere public. The log in the repo is the deliverable.
