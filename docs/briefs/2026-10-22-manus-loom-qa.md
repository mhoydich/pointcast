# Manus brief — The Loom, real-user QA (2026-10-22)

The Loom is live: one public message system with one verb, append(to,
message), over any address (a page, an @handle, a #topic, a place, a file
hash, a reply). v1 shipped 2026-10-20; v1.1 (the right-edge Loom tab on every
regular page, RSS for any address, `/.well-known/loom.json`) shipped
2026-10-22 in PR #1496. Block 0739 announces it. This brief asks for a real
browser pass as a person would use it, on a desktop and on a phone.

**Everything posted to the Loom is public and permanent in the log.** Post
only test text. No names of real people other than `@mike`, no contact
details, no screenshots of anything private.

## Accounts and tools

- A desktop browser (Chrome or Safari, latest) at 1440px wide or wider.
- A phone browser (iPhone Safari or Android Chrome), or a 390px-wide
  responsive window if no phone is available. Say which you used.
- No login is needed. The Loom has no accounts: the sender name is typed in.
  Use the display name `Manus QA` and kind `human`.
- An RSS reader or just the browser's raw view for the feed check.

## URLs to open

1. https://pointcast.xyz/loom — the room.
2. https://pointcast.xyz/loom?to=%23loom — the `#loom` channel.
3. https://pointcast.xyz/loom?to=%40mike — the `@mike` inbox.
4. https://pointcast.xyz/about — a regular page; find the **Loom tab on the
   right edge** and open it.
5. https://pointcast.xyz/api/loom?to=%23loom&format=rss — RSS for `#loom`.
6. https://pointcast.xyz/.well-known/loom.json — federation manifest.
7. https://pointcast.xyz/loom.json — protocol card for agents.
8. https://pointcast.xyz/b/0739 — the announcement block.

## What to do (on desktop, then repeat 1–5 on the phone)

Post everything in `#loom` (URL 2) unless a step says otherwise. Note each
message's address (`loom:<key>#<id>`) if the room shows it.

1. **A note.** Post: `Manus QA note, desktop, 2026-10-22. Testing the Loom.`
   It should appear in the thread without a page reload.
2. **A reply.** Reply to the note from step 1. The reply should be threaded
   under it.
3. **A poll and a vote.** Post a poll: question `QA poll: which screen?`,
   options `desktop` and `phone`. Vote once. The count should go to 1. Reload
   and confirm the vote stuck.
4. **An image by https URL.** Post an image message with a public https image
   URL (use https://pointcast.xyz/pmm/card.svg if nothing else is to hand) and
   alt text `QA test image`. The image should render with its alt text.
5. **Ripple.** Post a note in `#loom` that mentions `@mike`:
   `Manus QA ripple test for @mike`. Then open URL 3 and confirm the same
   message appears in the `@mike` inbox.
6. **Right-edge tab.** On https://pointcast.xyz/about, open the Loom tab.
   It should open that page's own thread. Post one note there:
   `Manus QA, page thread on /about.` Close and reopen the tab; the note is
   still there.
7. **Playback.** In `#loom`, use the scrubber to replay the thread from the
   start. Your messages should appear in the order you posted them.
8. **Feeds and manifests.** Open URLs 5, 6 and 7. The RSS should be valid
   XML listing your `#loom` messages; both JSON files should parse and the
   protocol card should list `loom_read` and `loom_append`.
9. **Block.** Open URL 8. It renders, and its links to `/loom` and
   `/loom.json` work.

On the phone, also check: no horizontal page scroll on `/loom` and `/about`;
the right-edge tab is reachable with a thumb and does not cover page text it
cannot be moved away from; the compose box is usable with the on-screen
keyboard open.

## Screenshots to capture

- `/loom` room on desktop, full window.
- `#loom` thread after steps 1–5, desktop and phone.
- The poll after voting, and after reload.
- The image message.
- The `@mike` inbox showing the ripple from step 5.
- `/about` with the right-edge tab closed, and open with the page thread,
  desktop and phone.
- The scrubber partway through playback.
- Raw view of the RSS (URL 5).

Note any console errors (desktop DevTools) with the URL and the message text.

## Write results to

`docs/manus-logs/2026-10-22-loom-qa.md` — one table, pass/fail per step for
desktop and phone, the device and browser used, the message addresses you
created, links or embeds for the screenshots, and anything broken with exact
reproduction steps.

## Approval

No Mike approval is needed for anything inside the Loom: posting the test
messages above, replying, voting and reading feeds. Anything outside the Loom
(sharing links on social, emailing anyone, creating accounts anywhere,
changing settings) needs Mike's approval first. Do not try to remove or
moderate other people's messages.
