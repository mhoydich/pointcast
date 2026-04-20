---
sprintId: release-sprint-plan
firedAt: 2026-04-19T21:00:00-08:00
trigger: chat
durationMin: 30
shippedAs: deploy:b1fd2d82
status: complete
---

# chat tick — release sprint plan + GTM draft + Codex/Manus check-ins

## What shipped

Mike 20:55 PT: *"set up the next sprint, create a big development and release sprint, check on codex, get manus working, start to also think about a go to market strategy, jump right in go"*. Five artifacts in one tick.

### 1. `docs/plans/2026-04-20-release-sprint.md` — the master plan

Seven-day sprint (04-20 through 04-27) with five phases:

- **Phase 1 — Identity arc** (Mon, gated on Mike's 4 decisions): PC_IDENTITY_KV namespace, /api/identity/log write endpoint, localStorage mirror to server on wallet-connect, /profile fetches remote on connect.
- **Phase 2 — Codex delivery** (Tue-Wed): check-in Tue AM on 5 briefs; merge what lands; re-prioritize if bandwidth-constrained (STATIONS → VideoLens → Pulse → YeePlayer v1 → TrackLab).
- **Phase 3 — Manus reactivation** (Mon-Thu): M-1 platform matrix completion, M-2 CF Email Routing, M-3 Resend setup, M-4 launch-day ops checklist.
- **Phase 4 — GTM launch** (Wed-Mon 04-22 to 04-27): Farcaster → X → Product Hunt → Nouns → HN → week retro.
- **Phase 5 — Measurement** (ongoing).

Risk table, success criteria (Mon 04-27: /profile syncs across devices, 2+ Codex briefs shipped, email live, 100+ unique visitors, 1+ non-Mike wallet completes a daily drop, 1 sprint-recap block).

### 2. `docs/gtm/2026-04-19-draft.md` — go-to-market first pass

- **Positioning**: "first agent-native living broadcast"
- **Audience ranked**: AI builders → crypto-native → local ES → Farcaster → HN
- **5 wedges** each backed by a shipped surface
- **7-day launch cadence** with per-day channel tactics + success criteria
- **Messages that work** + **messages to NOT lead with**
- **Open questions for Mike**: PH maker strategy, Farcaster handle, GIF budget, pre-launch outreach, press pitching

### 3. `docs/briefs/2026-04-19-manus-launch-ops.md` — Manus queue

Four tasks (M-1 through M-4):
- **M-1**: platform matrix completion (in-flight from AM brief)
- **M-2**: CF Email Routing dashboard setup (~10 min, due Mon EOD)
- **M-3**: Resend account + DNS verification + PAGES secret binding (due Tue EOD)
- **M-4**: launch-day ops checklist — GSC, Bing, IndexNow, Farcaster/X/iMessage unfurl verification, analytics (due Thu EOD)

Each task has verbatim step-by-step commands. Deliverable paths specified.

### 4. `docs/briefs/2026-04-19-codex-check-in.md` — Codex status check

Honest: 3 hours since 5 briefs filed, no `docs/reviews/`, no codex-authored blocks, no Pulse/STATIONS/etc. files. Within budget but flagged.

Asks for:
- One-line status in chat
- Any architecture doc (even draft)
- Honest flag on briefs that are too vague

Recommends priority re-order if bandwidth-limited. Offers brief revision path if any scope is wrong.

### 5. Block 0321 — "Release sprint · v2.2 to public launch"

Public announcement. `mh+cc` author, sources Mike's verbatim directive. Mood `sprint-pulse`. External link to the full plan on GitHub. Companions: 0320 (today's reflection), 0282 (broadcast arc), 0283 (Codex Pulse brief), 0286 (Codex TrackLab brief).

## Why this shape

Mike's directive was five things at once: plan + Codex + Manus + GTM + ship. Could've split into ticks; chose to bundle because they're interdependent (the plan structures the Codex / Manus / GTM asks; the announcement block makes the plan public). Batching saves coordination overhead.

The **four artifacts + announcement block** shape is deliberately the same as the earlier Codex-handoff ticks today (0283, 0284, 0285, 0286, 0287): each major direction gets a brief + a public block. Repeatable pattern.

## Honest observations on the Codex + Manus silence

**Codex at T+3h, no landed artifacts.** Neither alarming nor ideal. The briefs were dense + large; honest first-hour response would be "reading, designing, estimating." Plausible Codex is still in that phase. The check-in brief is deliberately non-threatening — status question, not deadline pressure.

**Manus at T+12h on the AM platform-matrix brief.** Longer silence. Morning brief was research-heavy (reach numbers, vendor policies, casting specifics); full matrix could reasonably take 4-8 hours. The new Manus brief re-engages with concrete dashboard ops (email setup) that are binary-executable rather than research-open.

**If both are still silent by Tue AM:** cc escalates in chat and cc starts implementing Codex project #1 (STATIONS) directly as a fallback. Nothing about the plan catastrophically depends on them shipping by a specific hour.

## Design decisions worth recording

- **Plan doc is public (in docs/plans/ on GitHub) rather than private.** PointCast's agent-native stance is "nothing is hidden; agents and humans read the same artifacts." Codex + Manus + Mike + future cc all read from the same file.
- **GTM draft calls out messages NOT to lead with.** Cannabis adjacency via Good Feels is a real positioning risk on some platforms (Apple TV store content policy, HN crowd skepticism). Surfacing the risk in the draft prevents it becoming a late-stage blocker.
- **Launch-date recommendations are tentative.** All dates in Phase 4 are followed by Mike-confirm language. cc isn't committing the company to PH on Fri 04-24 without explicit Mike greenlight.
- **Risk table has quantified probability estimates.** High/Medium/Low. Prevents hedging-everything-as-medium.
- **Success criteria are specific + binary.** "100+ unique visitors across the week" is checkable against analytics; "1 non-Mike wallet completes a daily drop" is checkable against KV (when KV aggregation ships).

## What didn't

- **A launch-day press-release draft.** Would be premature before Mike confirms the week's dates + coverage-seeding unknowns.
- **A Product Hunt hunter / maker assignment confirmed.** Listed as Mike-question.
- **Specific Farcaster cast copy + thread text.** GTM doc has the cadence but not the copy. cc can draft per-channel copy when Mike greenlights the plan.
- **An analytics setup tick.** Flagged in M-4 as Manus's call whether it's already wired; if not, cc picks up in a subsequent tick (Cloudflare Web Analytics is a one-line add).
- **Codex emergency-fallback implementation plans.** Mentioned in observations; not filed as explicit briefs. If cc needs to pick up STATIONS or Pulse, it's a full tick of its own.

## Notes

- Build: 206 → 207 pages (+1: /b/0321).
- Deploy: `https://b1fd2d82.pointcast.pages.dev/b/0321`
- Chat-fired tick. Largest chat tick of the day (30 min — five artifacts).
- Cumulative today: **32 shipped** (18 cron + 14 chat).
- Next cron tick at 21:11 (13 min). Expect to pick a small unblocked item (identity-arc scaffolding if Mike greenlights, else polish or content).

— cc, 21:05 PT
