# Sprint · 2026-05-12 → 2026-05-14 · Front-of-house lands

**Owner:** cc (planning) · mh (merge + deploy) · manus (QA) · codex (review)
**Status:** queued — waiting on Mike's review of the open PR stack
**Trigger:** Four PRs from the 2026-05-10/11 session redesigned PointCast's front-of-house. Before the next feature push, let them land cleanly, get real-browser QA, and get a formal agent-readable surface review.

---

## Premise

Four PRs are open from the front-of-house redesign session:

| PR | What | State |
|---|---|---|
| [#558](https://github.com/mhoydich/pointcast/pull/558) | `/` is the room (window + coffee pot), `/desk` is the build log | open |
| [#565](https://github.com/mhoydich/pointcast/pull/565) | block 0463 announcing the room (draft, paired with #558) | open |
| [#585](https://github.com/mhoydich/pointcast/pull/585) | `/at-desk` myYahoo-style portal — current events + local + interesting | open |
| [#589](https://github.com/mhoydich/pointcast/pull/589) | `/plan` weekly agenda + `/plan.json` endpoint + auto-globbed plan-doc index | open |

Together they give PointCast a coherent four-room front-of-house:

  **/** (the room — walk in) → **/at-desk** (today — current events) → **/plan** (the week — agenda) → **/desk** (the log — what shipped)

This sprint is the QA + agent-surface review pass before we move on.

## North Star

Four routes live on prod, QA'd on real devices, agent-readable surface validated by Codex. CF Pages still requires manual `wrangler pages deploy` (INCIDENT 399) — accepted, not in scope for this sprint.

## Sequencing

### Day 1 · Mon 2026-05-12 · Mike merges + manus + codex kick off

**Mike (am):**
1. Review + merge **#558** (the room)
2. Manual `wrangler pages deploy` to push it live
3. Review + merge **#565** — flip `"draft": true` → `false` in `0463.json` before clicking merge so the block surfaces immediately as the lead on /
4. Manual deploy again (block becomes visible)

**Mike (pm):**
5. Review + merge **#585** (/at-desk)
6. Review + merge **#589** (/plan + /plan.json)
7. One last manual deploy
8. Optional: open a small follow-up PR adding `/at-desk` and `/plan` to the new home's exits list (cc volunteered in #585's description)

**Manus (kickoff, can begin in parallel with merges):**
- Pick up `docs/briefs/2026-05-12-manus-front-of-house-qa.md`
- Wait for each merge + deploy to verify the corresponding route on prod
- Do not test on `localhost` — these are static-build routes and the value is the real-prod check

**Codex (kickoff, can begin in parallel):**
- Pick up `docs/reviews/2026-05-12-codex-plan-and-at-desk.md`
- Review **before merge** is fine — most of what Codex looks at is the agent-readable surface shape, which is the PR diff

### Day 2 · Tue 2026-05-13 · QA + review results land

**Manus:**
- Files results at `docs/manus-logs/2026-05-12-front-of-house-qa.md`
- Screenshots in `public/images/qa-2026-05-12/` (8 captures total — 4 routes × {mobile, desktop})
- Flags any visual bugs or missing states (no-JS, reduced-motion, dark mode if it lands)

**Codex:**
- Files review at `docs/reviews/2026-05-12-codex-plan-and-at-desk-reply.md` or as PR comments on #589 + #585
- Specific asks listed in the codex brief — at minimum a yes/no on the agent-readable surface

### Day 3 · Wed 2026-05-14 · cc lands fixes + writes the receipt

**cc:**
- Land any P1 bugs Manus flagged (small PRs, per usual)
- Land any P1 nits Codex flagged
- Write a short `docs/audits/2026-05-14-front-of-house-receipt.md` summarizing what shipped + what was verified
- Optional block on the wire (~250 words, cozy voice) noting the sprint closed

**Mike:**
- Approve + merge the fix PRs
- Decide on follow-on work (next sprint topic — likely the federation stack codex burn-down per `docs/reviews/2026-05-07-codex-federation-stack.md`)

## Success criteria

By end of day Wed 2026-05-14:

- [ ] All four front-of-house routes live on prod and verified by Manus on iPhone + desktop
- [ ] /plan.json validates as JSON and registers in /agents.json (verified by Codex)
- [ ] Block 0463 surfaces as the lead on / and links to /b/0463
- [ ] /at-desk renders the FreshToday band with cards that don't 404
- [ ] /plan's INCIDENT 399 row stays red until Mike reconnects the CF Pages connector (incidentally, a way to remember it)
- [ ] No regressions on /desk (the renamed v2027 home) — operating-mode + recent ships + learnings + today + this-week + places + archive teaser all still render
- [ ] Receipt doc filed at `docs/audits/2026-05-14-front-of-house-receipt.md`

## Out of scope

- **CF Pages auto-deploy reconnect** (INCIDENT 399) — Mike's lane, separate work
- **Coffee Mugs FA2 origination** — Mike's lane, separate work
- **/at-desk JSON sibling** — Codex may recommend one in their review; if so, file as a follow-up PR for cc, not in this sprint
- **Show HN post** — once the front-of-house is verified-good, Mike decides if he posts the draft. Not blocking this sprint.

## Risks

1. **Parallel-agent block ID collisions** continue (see 0462→0463 incident from this session). Mitigation: cc verifies block ids against `origin/main` at PR time, not at branch-creation time.
2. **CF Pages manual-deploy fatigue** — 4 manual deploys in one day is taxing. Mitigation: Mike batches them at end-of-pm rather than per-merge if convenient.
3. **Manus capture cost** — 8 captures is light vs. Sprint 3 sweep (10+ routes). No budget concern.
4. **/plan's "this week" data goes stale** — the dates in `src/data/plan.json` are anchored to 2026-05-11 → 2026-05-17. After Sat the chips will start showing "0d left" / "Day 8 of 7". cc rolls the week at end-of-week as a routine, not in this sprint.

## Linked briefs

- `docs/briefs/2026-05-12-manus-front-of-house-qa.md`
- `docs/reviews/2026-05-12-codex-plan-and-at-desk.md`

— cc, 2026-05-11 PT, El Segundo
