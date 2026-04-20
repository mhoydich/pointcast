---
sprintId: polls-philosophy-and-viz-v1
firedAt: 2026-04-18T18:15:00-08:00
trigger: chat
durationMin: 19
shippedAs: deploy:1494d7df
status: complete
---

# Polls philosophy + viz v1 — purpose field, outcomeAction, aggregate strip

## What shipped

Mike's 6:08pm chat: "best baseball town does that go in a bad direction, tho something there on local, information gathering". Made the line structural, not just editorial.

**Schema (src/content.config.ts):**
- New required field `purpose: 'coordination' | 'utility' | 'editorial' | 'decision'` (defaults to coordination).
- New optional field `outcomeAction: string` (≤280 chars) — one sentence describing what literally happens when the leader is decided.
- Inline doc comments cite the Mike directive + the "if the leader changes, what happens differently?" test.

**6 polls retroactively tagged** with both fields:
- `el-segundo-meeting-spot` → `coordination` · "If a leader emerges (35%+ of votes), cc proposes the spot as default for spontaneous meetups."
- `pick-a-chakra` → `editorial` · "Leader becomes featured chakra on /yee/0236 next time."
- `first-channel` → `editorial` · "Top-2 channels get promoted in MorningBrief and FreshDeck weighting."
- `south-bay-sunset` → `utility` · "Leader becomes recommended sunset perch in a future CH.ESC editorial block."
- `next-sprint` → `editorial` · "Top-2 picks graduate from needs-input to ready in the backlog."
- `weekday-pickleball` → `decision` · "If converges with 40%+, the pickleball drop-in becomes a real standing event."

**/polls page additions:**
- **Aggregate viz strip** at the top: 4 metrics — POLLS LIVE / TOTAL VOTES / MOST ACTIVE / PURPOSE MIX (segmented colored bar). Client-side fetch sums every poll's tally, paints in. First time PointCast has cross-poll viz.
- **Polls philosophy `<details>` callout** under the viz strip — "WHAT MAKES A GOOD POINTCAST POLL" with the four-purpose definition list and the test sentence ("if the leader changes, what happens differently?").
- **Purpose chip** on each poll card — color-coded (coordination=blue, utility=green, editorial=purple, decision=orange).
- **Outcome callout** inline on each card — small purple-bordered "OUTCOME · {sentence}" panel, makes the downstream-use commitment visible to anyone scanning.
- **Build glitch caught + fixed mid-sprint:** `p.data.purpose.toUpperCase()` failed when Astro picked up old draft poll data before purpose default kicked in. Replaced with `(p.data.purpose || 'coordination').toUpperCase()` for safe access.

## What didn't

- **No vote-velocity timeline** — the dedup key has timestamps via metadata but it's not aggregated. To plot vote-rate-per-hour we'd need per-vote timestamps stored separately. Future sprint.
- **No cross-poll insights** ("voters who picked X on poll A also picked Y on poll B") — privacy-aware aggregate requires a different KV layout (per-voter trail with hashed identity). Deferred.
- **No `/polls.json` mirror** — already on the follow-up list from `more-polls-v1`. Worth its own small sprint.
- **Did not enforce schema in Codex** — the `purpose` enum is required by the schema (Zod), so any new poll without it fails the build. That's structural enough; no extra Codex check needed.

## Follow-ups

- Build a `/polls.json` companion (easy, ~10 min).
- Vote-velocity sparklines on each card (needs per-vote timestamp storage).
- Cross-poll heatmap when there are 30+ votes across 10+ polls — need data first.
- Codex round-5 brief: ask for an a11y pass on the new `<details>` callout + the colored chips (color-only differentiation is an a11y issue; chips also have text labels which mitigates).

## Notes

- 16th sprint shipped today. Cumulative cc work: ~268 min.
- Polls philosophy is now load-bearing in the schema, not just a doc convention. Any new poll JSON missing `purpose` fails the build. Outcome action is optional but encouraged — the /polls page renders it as a visible commitment.
- The viz strip is small but real — it's the first cross-surface aggregation cc has shipped on PointCast. Pattern for future: every multi-instance surface (polls, products, sprints, drops) wants a top-of-page aggregate by the time it has 5+ entries.
- "If the leader changes, what happens differently?" — that one sentence is going to be the editorial filter for every new poll. Good rule.
