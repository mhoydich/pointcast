---
sprintId: more-polls-v1
firedAt: 2026-04-18T17:55:00-08:00
trigger: chat
durationMin: 14
shippedAs: deploy:604e9f82
status: complete
---

# Polls v1.5 · 5 more polls + live catalog tallies

## What shipped

Mike's chat: "the polls thing is super interesting, lots of polls, data collection visualization, etc." Ran with it.

- **5 new seed polls** in `src/content/polls/`:
  - `pick-a-chakra` — 7 chakra options with bija mantras + colors. Cross-references /yee/0236.
  - `first-channel` — 7-of-9 PointCast channels. Onboarding signal.
  - `south-bay-sunset` — 5 sunset perches between LAX and Palos Verdes. Local Schelling.
  - `next-sprint` — 5 backlog candidates needing Mike review. Vote literally routes the autonomous loop.
  - `weekday-pickleball` — Mon-Fri morning drop-in coordination. If converges, becomes a real meetup.
- **`/polls` catalog now shows live tallies per card.** Each card fetches `/api/poll?slug=…` client-side after page load, paints:
  - "N VOTES" indicator (top-right of card, purple+bold when N>0)
  - "LEADER · {label} · {pct}%" line at the bottom (only when there are votes)
  - Card layout reorganized into top + bottom rows to accommodate the new chrome.
- **Schema-org `Question` JSON-LD per poll** already in place from v1 — agents that crawl the catalog see all options as `suggestedAnswer`.
- **Sprint card `more-polls-v1` added** as `done`. Shifts the polls primitive from "one demo" to "small cluster" in one tick.

## What didn't

- **No aggregate dashboard yet.** "Total polls / votes today / sparkline of vote velocity" was on the candidate list — kept this sprint tight to seed + per-card tally. Future sprint candidate: `polls-aggregate-dashboard`.
- **No cross-poll insights.** "People who picked X on poll A also picked Y on poll B" is a real follow-on but requires a different KV layout (per-voter trail) and privacy thinking. Deferred.
- **No poll-result blocks.** When a poll closes, an auto-generated NOTE summarizing the result would be a nice cron-driven feature. Future.
- **No filter or category UI.** Six polls is browseable as a flat list; at 15+ would need filter pills.

## Follow-ups

- The `next-sprint` poll's results literally tell us what to ship next. After 24 hours, top-2 options graduate from `needs-input` to `ready` in the backlog.
- A `/polls.json` mirror endpoint (parallel to the existing `/sprints.json`, `/collabs.json`) would let agents pull all polls + live tallies in one request. Worth a small sprint.
- Per-poll OG cards (vs. all polls sharing the catalog OG) once the catalog grows past ~10.

## Notes

- 15th sprint shipped today. Cumulative cc work: ~249 min.
- Polls catalog now: 6 live polls. The first poll (`el-segundo-meeting-spot`) has cc's smoke-test vote (1 for Old Town Music Hall) — that'll show up as the LEADER until real voters arrive.
- Loop is doing what Mike wanted from the start: a one-line directive ("polls thing is super interesting") becomes 5 polls + a catalog upgrade in 14 minutes. The async pipeline narrows the gap between intent and surface area.
