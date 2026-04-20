---
sprintId: polls-on-home
firedAt: 2026-04-18T19:11:00-08:00
trigger: cron
durationMin: 14
shippedAs: deploy:ee9fcc6a
status: complete
---

# Polls visible on home — "yah polls on the home page"

## What shipped

Cron tick read the queue + ping inbox + drop inbox. Found:
- 3 queued PICKs: `feedback-block-strip` (oldest), plus two custom directives — "yah polls on the home page" and "can you rebuild drum"
- 1 ping (the original 9:37pm @mike, already handled, kept for archive)
- 0 drops

Mike's two new custom directives both arrived via /sprint after KV bind landed. Picked **"yah polls on the home page"** this tick — clear scope, fast win, directly serves the polls enthusiasm from earlier. `feedback-block-strip` and "can you rebuild drum" stay queued.

**`PollsOnHome.astro` component** — purple-bordered strip placed on the home feed between MorningBrief and FreshDeck. Renders the 3 most-recent non-draft polls as compact cards, each showing:
- Purpose chip (color-coded coordination/utility/editorial/decision)
- Question (3-line clamp)
- Live leader tally — client-side fetch to `/api/poll?slug=…`, paints "LEADER · {label} · {pct}% OF {N} VOTES" or "0 VOTES · BE THE FIRST" if empty
- Purple "▶ VOTE" CTA → jumps to `/poll/{slug}` for the actual vote UI

Three columns on desktop, single-column on mobile. "all polls →" link at top-right of the kicker. Min-height 92px keeps the row level even when leader text is short.

**Deliberately not** a vote-in-place UI on home — would add too much chrome to the top of the feed. /poll/{slug} owns the actual voting. v2 candidate: inline vote buttons if engagement justifies the extra surface.

**Processed pick deleted from KV** after build verifies clean.

## What didn't

- No vote-in-place on home (above).
- No analytics on which polls get the most home → /poll/ click-through. Would help editorial decisions about which polls to feature. Future sprint candidate: simple `/api/poll-views` counter.
- Did not ship `feedback-block-strip` or process `can you rebuild drum` this tick — both stay queued. cc respects "one sprint per tick" unless directives are tightly related (today's ping-bundle of 3 YeePlayer titles was the exception, since they were all minor edits to existing blocks).

## Follow-ups

- 7:11 next tick → `feedback-block-strip` (the oldest queued PICK from this morning).
- 8:11 tick → "can you rebuild drum" needs scope: full `/drum` page redesign? HomeMajors `major--drum` module? New audio engine? cc will read the existing `/drum` page + HomeMajors before sketching options. May propose a small spec via /ping or recap before shipping.
- After 24 hours of polls being on home, watch which one becomes the "most active" most often. That's the editorial signal for which Schelling-point question lands hardest.
- `next-sprint` poll on home means the home page itself has a meta-recursive hook — readers can vote on what cc builds next, from the front door.

## Notes

- 18th sprint shipped today. Cumulative cc work: ~298 min across 17 sprints + 1 health check.
- Home now has 4 vertical strips above the channels nav: Masthead → MorningBrief → PollsOnHome → FreshDeck → channels chip bar. Each is a different "fresh per visit" signal: clock + weather (MorningBrief), live poll leaders (PollsOnHome), random 3 blocks (FreshDeck). Plus the static channels nav and the main feed below.
- Loop-priority rule update: when the queue has multiple custom directives plus an old sprint pick, cc evaluates each on (a) Mike-recency, (b) scope clarity, (c) shippability in <30m. Today the polls directive won on all three.
- The "polls visible on home" directive is meta — it's a poll-system directive that the polls page explicitly invites. The /sprint primitive routed Mike's editorial want into a working home component in 14 minutes.
