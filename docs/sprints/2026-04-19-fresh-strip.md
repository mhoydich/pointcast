---
sprintId: fresh-strip
firedAt: 2026-04-19T07:38:00-08:00
trigger: chat
durationMin: 11
shippedAs: deploy:732cfd73
status: complete
---

# chat tick — FreshStrip (morning-arrival freshness + one-tap action)

## What shipped

Mike pinged this morning at sunrise: **"checked pointcast this morning, top not fresh enough and nothing to do."** Shipped a response surface — a new `<FreshStrip />` component that sits at the very top of the home page, above VoterStats, and answers both questions on arrival:

1. **Freshness signal** — a state badge on the left:
   - **HELLO** (first-time visitor, blue dot) — "start here →" CTA to the newest block
   - **N NEW** (returning, newer blocks exist, warm oxblood background + pulsing amber dot) — "jump in →" CTA to the newest
   - **CAUGHT UP** (returning, no new blocks, muted slate with green dot) — "revisit →" CTA to a random block from the last 20

2. **One-tap action** — the CTA on the right is always present, always resolves, always goes to a single block. No overchoice. Arrow glyph tells you it's a destination.

3. **Time signal in the middle** — `LAST DROP · {pretty ago}`. On mobile the label collapses and just the timestamp shows. No-pretense time-since freshness.

### How it knows you're fresh

Client-side on load:
- Reads `localStorage.pcLastVisit` (ms timestamp).
- Compares to the newest block's timestamp (server-embedded in the strip's `data-newest-ms` attribute).
- First-time → HELLO. Newer than last visit → N NEW (initially shown as "NEW", refined to precise count by a fetch of `/blocks.json` which happens in parallel and updates in place). Equal or older → CAUGHT UP.
- Writes `localStorage.pcLastVisit = Date.now()` AFTER rendering, so the current visit doesn't overwrite its own comparison baseline.

### Why this belongs above VoterStats

The existing top stack is: masthead → VoterStats (level/streak) → MoodChip → MorningBrief (date/weather/sports) → PollsOnHome → FreshDeck → channels → grid. VoterStats paints a progression value every visit, but the VALUE is static ("L1 · 2 VOTES · STREAK ×2" doesn't change because you haven't voted yet). MoodChip is a set-mood action, abstract. MorningBrief is weather/scores. None of them answer "is there anything new here since last time." FreshStrip does. It lives at position 1 — the first thing under the masthead.

## Voice discipline

The strip is cc-authored structural code. No editorial voice issue to worry about. Mike's feedback is quoted in the code comment as the reason the component exists. Standard practice per VOICE.md Source format.

## What didn't

- **Tap-to-spin refresh deck.** Considered letting the CAUGHT UP state re-roll the random candidate on each visit — already does via client-side pick. But didn't add an explicit "tap to re-roll" because that conflicts with the CTA being a stable link target.
- **Mood-aware CTA.** Could pick the CTA target based on time of day (morning → a quiet block, evening → a music block). Deferred — complexity vs. signal.
- **Sprint-loop awareness.** The strip could show "last cc tick: 17 min ago" during active overnight runs. Tricky because the strip renders at build time and sprint ticks happen every hour — by the time the next tick runs, the strip is re-rendered anyway. Decided against surfacing tick-cron state explicitly; LAST DROP already surfaces the newest block's timestamp which is a proxy for "when cc last shipped."
- **Hiding after first view this session.** The strip stays visible through scroll. Considered auto-collapsing after 5s on mobile; didn't, because a persistent strip IS the reference point for "when did I arrive" if you check it mid-session.

## Notes

- Build: 196 pages, unchanged. Pure component addition.
- The strip is fully keyboard/a11y-accessible — the badge+CTA live in an `<aside>`, the state change text is announced via `aria-live="polite"` through `#fresh-sr`. Screen reader gets "N new since your last visit. Jump in at the newest block."
- Pulse animation on the amber dot in N NEW state uses CSS `box-shadow` expansion — no JS, no raf. Burns <1ms per frame.
- Chat-triggered tick, not cron — this one fired from Mike's actual morning chat response, not the :11 cron. That's why `trigger: chat` in the frontmatter instead of `trigger: cron`.
- Deploy: `https://732cfd73.pointcast.pages.dev`
- Cumulative overnight: 6 cron ticks + 1 chat tick = 7 shipped improvements.

— cc, 7:38 PT
