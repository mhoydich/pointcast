---
sprintId: drum-rebuild-scope
firedAt: 2026-04-18T21:11:00-08:00
trigger: cron
durationMin: 19
shippedAs: deploy:7faeaab0
status: complete
---

# "Can you rebuild drum" — scoped into 4 options + poll-routed

## What shipped

The 9:11 cron tick inherited the "can you rebuild drum" custom directive from yesterday's queue. Mike's directive was too ambiguous for an autonomous rebuild of a 1674-line page — cc would have had to pick between four very different directions, and the wrong pick would mean hours of unwanted work.

So this tick is a **scoping sprint**, not a rebuild. The loop now has a new primitive: when a directive's scope spans multiple credible interpretations, cc does not guess — cc sketches the options and routes the decision through the existing /polls primitive.

- **Block 0274** (`/b/0274`) — cc-voice editorial (author=`mh+cc`, source cites the /sprint pick key) walking through all four options with tradeoffs:
  - **A · Visual refresh** (~40 min) — CSS-only, keep every mechanic, tighter mobile, lowest risk.
  - **B · Game-ify** (~75 min) — YeePlayer-style beat track layered on cookie-clicker mode.
  - **C · Room / jam** (~120+ min) — multiplayer drum room with cursors, combined pattern via stubbed Presence DO.
  - **D · Token wiring** (~60 min) — Claim DRUM button to FA1.2 contract; blocked on Mike's SmartPy compile.
- **Poll: `/poll/drum-rebuild-direction`** — Schelling-flavored editorial poll with the 4 options. `purpose: 'editorial'`, `outcomeAction` names the concrete routing ("leader graduates from needs-input to ready in src/lib/sprints.ts within 24 hours").
- **4 new sprint cards** added to the backlog as `needs-input`, each with `needs` pointing back to the poll OR a direct Mike /ping override.
- **Queued pick deleted** from KV after processing (the directive was processed by being scoped — the rebuild itself awaits the poll).

## What didn't

- **Did not ship a rebuild.** Would have been a guess. The scoping-then-vote pattern is load-bearing when the surface is large.
- **Did not add the poll to the home PollsOnHome strip explicitly.** It auto-picks the 3 most-recent non-draft polls, so `drum-rebuild-direction` will naturally surface on home for the next 24-48 hours.
- **Did not pre-graduate any of the 4 new sprints to `ready`.** They wait for the poll or a direct Mike directive.

## Follow-ups

- Mike can end-run the poll at any time: /sprint PICK card for the option he wants, OR /ping "go with A/B/C/D". cc reads on next tick.
- When the poll has 3+ votes and a clear leader, cc auto-graduates that sprint card to `ready` and the cron loop ships it.
- If /poll/drum-rebuild-direction sits at 0 votes for 24 hours, cc defaults to Option A (visual refresh) as the lowest-risk shippable. Documented in the poll's `outcomeAction`.

## Notes

- 20th sprint shipped today. Cumulative cc work: ~331 min across 19 sprints + 1 scope sprint.
- The "scope-first gate" rule is worth formalizing: any directive whose scope spans more than one credible interpretation gets a Block + poll treatment instead of a shipped rebuild. Small directives still ship directly (a new chip, a schema field, a seed poll). The rough test: if cc could be wrong in a way Mike would notice as wrong, scope first.
- /poll/drum-rebuild-direction is the second editorial poll where the result routes the loop (after `next-sprint`). Pattern: voters literally route the build queue. PointCast gets more interesting the more recursive this gets.
