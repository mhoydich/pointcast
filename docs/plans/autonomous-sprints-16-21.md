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

## Sprint 17 — /wire Codex task follow-through ✅ SHIPPED

**Shipped:** 2026-04-24 ~01:30 PT · PR #42 squashed to main · deploy `b04ead42` · closes Issue #31

Codex didn't pick up #31 in the 30+ hrs after filing, so cc built it.
`/wire` is a right-to-left marquee of the last 24 events (commits +
recent blocks) with agent-colored chips, an active-tonight sidebar,
and an hour-tinted sky. `/wire.json` twin for agents. Registered in
`/agents.json`, `/for-agents`, and `_middleware.ts` PRETTY_ROUTES so
the URL resolves without 308.

Cut and deferred:
- Click-to-expand modal with full commit + diff
- Sound-on teletype click
- WebMCP `pointcast_wire_events` tool hook (→ Sprint 18 with the
  rate-limit middleware scaffold, same infra)

---

## Sprint 18 — Voice Dispatch Phase 3 foundation ✅ SHIPPED

**Shipped:** 2026-04-24 ~02:10 PT · PR #44 squashed to main · deploy `0ca301f6`

- `functions/_rate-limit.ts` — shared KV fixed-window limiter, graceful
  no-op when PC_RATES_KV unbound (`X-RateLimit-Mode: degraded-no-kv`
  header)
- `/api/wire-events` — WebMCP tool shape backing `pointcast_wire_events`;
  `?since` / `?limit` / `?agent` / `?kind` filters; 60/min/IP rate limit
- `/api/talk` POST — 5 per 10 min per IP rate limited; Phase 3 R2 write
  scaffold in place, gated behind `if (false)` flag until Mike
  provisions the bucket + RFC 0001 Q7/Q8 resolve
- `wrangler.toml` — comment blocks for Mike to provision
  `PC_RATES_KV` (CLI) and `TALK_AUDIO` R2 bucket (dashboard)
- `docs/plans/voice-dispatch-phase-3.md` — R2 key layout, draft→block
  promotion flow, moderation model, quota envelope, readiness gates
- Agent manifests register `/api/wire-events`, `/api/talk`, `/api/room`

Verified live: wire-events returns 24 events, `?since=...&agent=claude`
correctly filters, rate-limit headers attach to both success + error
responses, all in degraded-no-kv mode (expected until Mike provisions).

**Mike-blocked follow-ups** (queued for tomorrow):
- `npx wrangler kv namespace create "PC_RATES_KV"` + paste id
- CF R2 dashboard → bucket `pointcast-audio` → bind `TALK_AUDIO`
- Answer RFC 0001 Q7 (TALK channel?) + Q8 (wallet-required submit?)

---

## Sprint 19 — Race System Phase 2 foundation ✅ SHIPPED

**Shipped:** 2026-04-24 ~02:45 PT · PR #46 squashed to main · deploy `21d30181`

- `src/lib/races.ts` — RaceSpec / RaceEntry / LeaderboardEntry types +
  RACE_REGISTRY seeded with Front Door (status: scheduled, 2099
  placeholder window) + helpers
- `functions/api/race/[slug]/submit.ts` — POST, 10/hr/IP, upserts entrant
  row + merges into sorted entries; graceful no-op when KV unbound
- `functions/api/race/[slug]/leaderboard.ts` — GET, 60/min/IP, full race
  meta + top-N entries + optional `you` via `?entrantId=`
- `wrangler.toml` — PC_RACE_KV provision block
- Manifests updated

Verified: scheduled-race submit correctly returns 409; leaderboard
returns race meta + empty entries with `reason: kv-unbound`; unknown
slug → 404. All rate-limit headers attach in degraded-no-kv mode.

**Deliberately not touched:** PR #18 (/race hub + /race/front-door
page) — Mike's to bless. The two PRs meet up cleanly when both land.

**Mike-blocked follow-ups:**
- `npx wrangler kv namespace create "PC_RACE_KV"` + paste id
- Flip Front Door's opensAt in `src/lib/races.ts` to launch the race
- Merge PR #18 to get the hub + page scaffolds

**Sprint 20 follow-up (auto):** Front Door client instrumentation
once PR #18 is on main — becomes a ~50-line PostJSON wire.

---

## Sprint 20 — /wire evolution + editorial block ✅ SHIPPED

**Shipped:** 2026-04-24 ~03:20 PT · PR #48 squashed to main · deploy `a17cbf95`

- **Block 0344** — `FD READ`, 2x1, "Four sprints after midnight." Capstone
  covering Sprints 16–19. Matches 0339's RC0 recap cadence. Ends with
  a six-item "what Mike provisions in the morning" checklist so the
  follow-up list is visible on the home feed tomorrow.
- **`/wire` refresh button** — sidebar button, fetches `/wire.json` with
  `cache: no-store` and rebuilds both marquee rows from live data.
  Disabled 1.5s after click. Build-time render stays source of truth on
  first paint; button just hydrates on demand.

**Front Door client instrumentation** deliberately skipped — PR #18
is still OPEN (Mike hasn't blessed the Phase 1 RFC yet). Will pick up
whenever #18 lands; tiny PostJSON wire, separate PR.

---

## Sprint 21 — Tezos planning docs (no origination) ✅ SHIPPED

**Shipped:** 2026-04-24 ~03:55 PT · PR #50 squashed to main · docs-only, no deploy

Three tactical Mike-runbooks filed under `docs/plans/`:

1. **`2026-04-24-admin-transfer.md`** — Visit Nouns FA2 admin transfer
   runbook. Pre-flight checks, the `scripts/transfer-admin.mjs`
   invocation, post-transfer verification, a clear after-transfer
   checklist, and notes for future originations (start admin on Mike's
   main wallet directly, no throwaway step).
2. **`2026-04-24-prize-cast-spec.md`** — Prize Cast next-hour tactical
   plan. Three Mike-decisions that gate everything (compile path,
   baker delegate, initial cadence + min deposit) + the 45-minute
   runbook to get from "contract written, untouched" to "ghostnet
   smoke test confirmed" with 4 core flows verified.
3. **`2026-04-24-passport-stamps.md`** — v0.1 one-pager. Defines the
   primitive, relates it to Visit Nouns / Race / Prize Cast / TALK,
   proposes Path A (KV-only, 2 weeks) vs Path B (FA2, v1), maps seven
   flagship stamp kinds to triggers, and closes with 7 open questions
   for Mike + a 3-step go-path.

---

## The whole run: 16 → 21 ✅ COMPLETE

All six sprints shipped one PR each, squash-merged to main, with no
rollbacks and no deploys that stuck in a bad state. Cloudflare Pages
ran clean across six deploys; the pointcast-presence Worker redeployed
once (Sprint 16). Six branches opened, six merged, six deleted.

Merged PRs: #40 · #42 · #44 · #46 · #48 · #50 — plus docs close-outs
#41 · #43 · #45 · #47 · #49 · (this PR rolls its own close-out).

The autonomous loop rests here until Mike is back.

---

## Discipline

- Each sprint = one branch, one PR, squash-merge, one deploy
- `Co-Authored-By: Claude Opus 4.7` trailer on all commits
- 30-min scope; defer anything that wants to grow
- Report at sprint end, schedule next wakeup, update this queue
- Mike's messages always interrupt + take priority
