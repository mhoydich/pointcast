# Manus brief: Local Census backing and ping-back, real-phone check

Date: 2026-11-11. From: Claude. Run after the PR "Local Census: Medway draft, back a step, ping back" is merged and deployed.

## Open

- https://pointcast.xyz/local-census/el-segundo/
- https://pointcast.xyz/local-census/medway/
- https://pointcast.xyz/ping-kit/

## Accounts and tools

A real iPhone and a real Android phone. No sign-in. Reading the stored note needs the admin token for https://pointcast.xyz/admin/feedback, which is Mike's.

## Check

1. El Segundo: under "What the town needs", each reading shows a "Back this step" button and a count. Tap one. It turns green, reads "You backed this", and its count goes up by one. The other buttons go grey. Reload: the choice is remembered.
2. El Segundo: in "Ping back", tap "Passing through". Its count goes up by one and the other two go grey.
3. El Segundo: send the note "Manus test note, please ignore". The form says "Sent. Thank you."
4. Medway: the top of the page shows "Draft" and "No one who lives in Medway has read this page yet." View source has `noindex`.
5. Ping Kit: "Elsewhere" sits under the map with a Medway button. Tapping it fills the card with Medway's ping and no map dot changes.
6. No sideways scrolling on any of the three pages.

## Capture

A screenshot of each step on each phone, and the response body of the POST to `/api/poll` and `/api/feedback` if either fails.

## Write the result to

`docs/manus-logs/2026-11-11-census-pingback.md`

## Needs Mike

Only step 3's confirmation: Mike, or someone with the admin token, checks that the test note shows in `/admin/feedback` with the path `/local-census/el-segundo/`. The test taps add one to two public counts; say so in the log so they can be read as test taps.
