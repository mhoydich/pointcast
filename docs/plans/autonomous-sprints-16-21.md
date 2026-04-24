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

## Sprint 16 — Room Phase 2: multi-visitor cursor + chat broadcast ✅ SHIPPED

**Shipped:** 2026-04-24 ~00:55 PT · PR #40 squashed to main · deploy `ea0577c7`

Extended PresenceRoom DO with `cursor` + `chat` message types (no
migration — in-memory fields only). New `/api/room` Pages Function
shards the same DO class per URL (`idFromName('room:<path>')`) so each
URL is its own multiplayer room; `/api/presence → 'global'` stays
untouched. CursorRoom client opens a WebSocket on toggle, quantizes
cursor to viewport ×10000 at ≤15 Hz, renders peers as 28px Nouns with
120ms lerp and their own chat bubbles. Broadcast cadence self-adapts:
100ms while cursor/chat active, 1s when idle.

Verified live: two concurrent WebSocket peers on `/smoke` each see the
other's cursor (`peers:1`) and both chat messages (`chat:2`).

Deploy sequence: Worker first (`cd workers/presence && npx wrangler
deploy`), then Pages. Both already live.

**Open follow-up:** chat rate-limit middleware (1 msg/s/session) is
deferred to Sprint 18 alongside Voice Dispatch Phase 3's rate limiter.

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
