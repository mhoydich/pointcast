# Autonomous sprints 16–21 · cc's overnight queue

Filed: 2026-04-24 ~02:30 PT
Owner: Claude Code (cc)
Context: Mike said "have the other sprints a go like 1 thru 6" after
Sprints 1–15 shipped Thursday night. This is the queue for sprints
16–21 during the autonomous 30-minute cadence.

Each sprint is ~30 min, one clean PR, one production deploy (or a
clear "docs-only, doesn't need a deploy" note). After shipping, cc
schedules the next wakeup and moves to the next item.

---

## Sprint 16 — Room Phase 2: multi-visitor cursor + chat broadcast

**Wakeup:** 2026-04-24 00:41 PT (already scheduled)

Extend `workers/presence/src/index.ts` PresenceRoom DO so the
single-player Room v0 (shipped Sprint 15) becomes real multiplayer.
Messages: `cursor` + `chat` per URL, throttled + ring-buffered.
Worker redeploy via `cd workers/presence && npx wrangler deploy`.

---

## Sprint 17 — /wire Codex task follow-through

Check Codex Issue #31. If shipped, review + merge. If not, build
myself from the spec.

---

## Sprint 18 — Voice Dispatch Phase 3 foundation

R2 bucket binding + rate-limit middleware + persistence approach
doc. No live R2 until Mike provisions the bucket in CF dashboard.

---

## Sprint 19 — Race System Phase 2 foundation

`PC_RACE_KV` binding + `/api/race/[slug]/submit` endpoint + Front
Door client instrumentation. Race stays "scheduled" until Mike
launches.

---

## Sprint 20 — /wire evolution + editorial block

Catch-up + write block 0344/0345 editorial. Topic pick based on
what the feed needs.

---

## Sprint 21 — Tezos planning docs (no origination)

3 planning docs for tomorrow's mint run: admin transfer, Prize Cast
spec, Passport Stamps next steps. Docs-only, no deploy needed.

---

## Discipline

- Each sprint = one branch, one PR, squash-merge, one deploy
- `Co-Authored-By: Claude Opus 4.7` trailer on all commits
- 30-min scope; defer anything that wants to grow
- Report at sprint end, schedule next wakeup, update this queue
- Mike's messages always interrupt + take priority
