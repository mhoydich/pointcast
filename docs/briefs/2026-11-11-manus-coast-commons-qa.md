# Manus brief: real-device QA of Coast Commons (2026-11-11)

Owner: Claude Code. Tracks TASKS.md "Coast Commons: an open study for the beach towns". Run after the pull request is merged and deployed; before that, the same paths work on a Pages preview.

## Open these URLs

1. https://pointcast.xyz/coast-commons/ (the coast strip)
2. https://pointcast.xyz/coast-commons/el-segundo/ (flagship)
3. https://pointcast.xyz/coast-commons/pattern/
4. The fourteen other town pages: /coast-commons/malibu/, /santa-monica/, /venice/, /marina-del-rey/, /playa-del-rey/, /manhattan-beach/, /hermosa-beach/, /redondo-beach/, /torrance/, /palos-verdes-estates/, /rancho-palos-verdes/, /san-pedro/, /long-beach/, /seal-beach/
5. https://pointcast.xyz/coast-commons.json and https://pointcast.xyz/b/0785

## Accounts and tools

None. Every page is public. Use a phone (iOS Safari and Android Chrome if both are at hand) and one desktop browser.

## What to check and capture

- Hub, phone: the notice box is readable without zooming; every stop on the drawn strip is a comfortable tap and opens the right town; no label is cut off at the right edge. Screenshot the first screen and the whole strip.
- Hub filter: drag the miles slider down to 5 and confirm the far stops fade and the list shortens with the count; choose each short-stay rule in the menu. Check the slider with VoiceOver or TalkBack if available.
- El Segundo: tick three ladder steps, reload, confirm they are still ticked; "Clear the ticks" clears them. In a private window the ticks may not survive a reload; say what happened.
- Pattern: type a total, people and a percent in the calculator and check the arithmetic by hand; "Download a blank ledger" saves a CSV that opens with seven column names; "Copy a house-rules outline" puts the outline on the clipboard, or shows the fallback message.
- Any town page: "Copy the questions" works or shows the fallback message.
- Outbound links: open every source link on the El Segundo page and at least two on each other town page. List any that are dead, moved, or now say something different from the sentence beside them. Several city sites block automated requests, so use a normal browser.
- Reading check (most useful): for El Segundo, Manhattan Beach and Long Beach, read the linked short-term rental page and say whether the paraphrase is still fair.
- Console (desktop): note any errors. The pages should make no requests off pointcast.xyz.

## Where to write the result

`docs/manus-logs/2026-11-11-coast-commons-qa.md`: one section per URL with what you saw, screenshots, device and browser names, dead or changed links, and console errors verbatim.

## Approvals

Read-only QA; nothing here needs Mike's approval. Do not contact any city office, do not post about it anywhere public, and do not enquire about any property.
