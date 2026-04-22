# Manus · manus-02 · Show HN launch execution

**Priority:** runs AFTER codex-02 delivers the draft. Blocks nothing; everything else continues in parallel.

## The ask

Execute a full Show HN launch and monitor it for 24 hours. This is a high-touch task — one bad first comment from OP can kill momentum; a fast, substantive reply to an early skeptic can flip a post.

## Pre-flight

Before posting:

1. Confirm `docs/outreach/2026-04-22-show-hn.md` has the four sections: title options, short draft, first comment, backup tweet thread.
2. Verify the site is healthy: `/sparrow`, `/sparrow/friends`, `/sparrow/signals`, `/sparrow.json`, `/sparrow/federation.json`, `/for-agents` all return 200. Open them in a fresh browser; visually confirm no console errors.
3. Confirm the rebase (codex-01) has landed — if it hasn't, the federation URLs may 500.
4. Pick the posting time: **Tuesday or Wednesday, 8:30-9:30 AM Pacific** is HN-optimal. Avoid Friday evening and weekends.

## Post

1. Use the title option ranked #1 by codex-02 (or #3 if the recorded demo lands strongest on the ambient strip — trust the recordings).
2. URL: `https://pointcast.xyz/sparrow`.
3. Paste the short-draft body text verbatim. Don't re-edit on the posting form.
4. Within 30 seconds of posting, paste the long-draft as a top-level comment on your own post, signed "OP."

## Monitor (first 4 hours — critical)

- Check every 15 min for comments. Reply to every technical question within 30 minutes of it landing.
- For critical/skeptical comments: acknowledge the critique, provide the receipt (link to the relevant file / doc / commit), move on. Don't defend. Don't argue about framing.
- For compliments: a short "thanks, here's the thing I'd actually like you to look at" pointing at the Nostr RFC (codex-05) or the federation.json if it's a Nostr person.
- If the post gains traction (front-page of /newest, any upvotes >5 in first hour), queue the backup tweet thread and post it.

## Monitor (next 20 hours)

- Check every 2 hours.
- Reply to new comments within a few hours, not a few days.
- Capture notable feedback in `docs/reports/2026-04-22-hn-launch-log.md` — link to each thread, summarize the substance, note any feature requests worth adding to the roadmap.

## Escalations

- If the post is flagged / dead: don't second-guess. Re-post once only, 24 hours later, with a different title from the ranked list. Repeated reposts look spammy.
- If a comment reveals a real bug (500 on federation.json, broken link): notify Mike in a fresh DM, let him decide whether to fix-then-reply or reply-then-fix.
- If a comment asks "is this open source?": the honest answer is "the reader is open, the broadcast content is CC0 per-block except where noted." Don't over-promise licensing.

## Deliverables

1. The HN post goes live.
2. `docs/reports/2026-04-22-hn-launch-log.md` with:
   - Post URL + timestamp.
   - Final upvote count at 24h + front-page duration.
   - Link to every substantive comment thread.
   - Summary of feedback: 3-5 themes, bullets of interesting asks.
3. A post-mortem paragraph: did it work, what would you do differently, which kind of commenter engaged most.

## Done when

- Post is live + OP long-draft comment is up within 30s.
- First 4 hours monitored tightly; log kept.
- 24h post-mortem written.
- Update `docs/plans/2026-04-22-10-assignments.md` row for manus-02 to `shipped` with a link to the HN URL.
