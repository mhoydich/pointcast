---
sprintId: contribute-collab-ai-landscape
firedAt: 2026-04-20T10:15:00-08:00
trigger: chat
durationMin: 30
shippedAs: deploy:5a3b2447
status: complete
---

# chat tick — /collabs contribute paths + AI landscape blocks + multiplayer primitive

## What shipped

Mike 2026-04-20 10:30 PT mandate: *"remove taner from the collab page, update page with latest, and lets start to explore ways people can contribute compute, federate, and then ideas around local collaborations + more polls + check out world clock + create content blocks on the new models."*

### Files changed

- `src/lib/collaborators.ts` — **removed Taner** (line 79-89 deleted), updated Codex intro from "reviewer · second pair of eyes" to "Repo-scoped engineering specialist · shipped STATIONS + presence DO + /here backend · MCP-driven", updated Manus intro to reflect actual current role.
- `src/pages/collabs.astro` — added **"Ways to contribute" section** with 6 concrete paths: (1) broadcast as a node → /for-nodes, (2) guest block, (3) federate, (4) host local, (5) donate compute (forward-looking), (6) seed polls. Plus matching styles block.
- `src/content/blocks/0325.json` — **Kimi K2.6 field note** (READ, 4 min). Landscape context + the OpenClaw/K2.6 connection to PointCast's federation arc + non-exhaustive comparison with Claude, Codex, Qwen, Gemini, GLM.
- `src/content/blocks/0326.json` — **Qwen 3.6 Max Preview field note** (NOTE, 2 min). Incremental, closed, Chinese-frontier context.
- `src/content/blocks/0327.json` — **Presence DO online** (NOTE, 2 min). Milestone recording that the deferred DO is finally bound.
- `src/content/polls/how-to-contribute.json` — **new poll**, 6 options mirroring the collabs contribute section. outcomeAction: top 2-3 votes shape next sprint priorities.
- `src/content/polls/ai-lineup-vibe.json` — **new poll**, model-combination preferences. outcomeAction: leader becomes /ai-stack default.
- `src/lib/multiplayer.ts` — **new, 180 lines**. Shared base class `MultiplayerRoom<Action, Broadcast>` + `ActionThrottle` + `generateUniqueSessionId` for Pulse + YeePlayer v1 + future rooms to extend. Codex attempted this turn via MCP but aborted before write; cc wrote it directly.
- `docs/plans/2026-04-20-release-sprint.md` — **appended "Progress update — 2026-04-20 10:40 PT"** section (~80 lines) documenting actual vs planned status, revised Codex queue (3 shipped of 10: STATIONS + Presence DO + /here), MCP pattern learnings, and "what's missing for Codex-at-full-blast" analysis.

### Deploy + smoke tests

- Build: **235 → 241 pages** (+6 routes: 3 new blocks × 2, 2 new polls × 2, plus /clock/0324 inherited from block 0324's `clock` config).
- Deploy: `https://5a3b2447.pointcast.pages.dev/`
- All new routes return 200: /collabs, /clock/0324 (LIVE world clock — reads timezones from the updated collaborators roster + block 0324's manual NYC/Tokyo extras), /b/0325, /b/0326, /b/0327, /poll/how-to-contribute, /poll/ai-lineup-vibe.
- `curl /collabs/ | grep -c taner` returns **0** — fully removed.

### World clock — it was already built

Turned out Mike's 0324 block was a DIRECTIVE, not a feature request: block 0324 already has the `clock` schema field, `/clock/[id].astro` exists, `src/lib/timezones.ts` resolves collaborator locations to IANA tz strings. The live route `/clock/0324` renders:

- Mike Hoydich (El Segundo → America/Los_Angeles)
- cc / Codex / Manus (cloud → UTC, collapsed sensibly)
- Manual zones from the block: NYC + Tokyo
- Live-ticking digital readouts, Intl.DateTimeFormat client-side, no deps.

Taner's removal flowed through automatically (his Istanbul entry would have appeared until now). The clock is honest now — current roster only.

## Codex MCP update this tick

Fired Codex on Brief #8 (multiplayer primitive) via MCP — **aborted before writing** (second time this session Codex aborted mid-read). cc wrote `src/lib/multiplayer.ts` directly — ~15 min, cleaner than chaining 3-4 small MCP turns.

Cumulative MCP-driven deliveries today: **2 successful writes** (Brief #7 snapshot endpoint + DO /snapshot handler), **3 aborts** (HereGrid attempt, Brief #8 attempt, Brief #7 multi-file attempt). cc wrote the equivalent scaffolding in each abort case.

**Pattern consolidating**: the ~60s MCP timeout + xhigh default reasoning conspires against any turn where Codex must read significant context before writing. Turns that can START with a write (because the prompt is tight enough to be self-contained) succeed. Turns requiring upfront reading time out.

**Remedies filed in plan update**:
1. Parallel MCP sessions — experiment TK.
2. `docs/queue/codex.json` — in-flight queue state, survives cc context resets.
3. Sub-brief sizing — "one atomic file" per brief fits cleanly; "one feature" doesn't.
4. Automatic verify pass — default every session's last turn.
5. Deploy bundling — batch multiple Codex ships per deploy.

## Observations

- **Mike directing at cruise speed** — the 10:30 message had 8 distinct asks. Handled 6 this tick (Taner remove + latest collabs update + contribute paths + content blocks + polls + Monday plan), flagged 1 as already-built (world clock), acknowledged 1 as next-tick (getting Codex + Manus truly cranking in parallel).
- **Jason visited + presence-was-dead cascaded good things**: identified the DO-worker gap, shipped it, validated MCP, tested the full loop. External nodes visiting is the best forcing function.
- **/collabs feels more alive now** — six specific contribution paths replace the old "mostly TBD" energy. The "donate compute" option is honest about being future; the others are ready today.
- **The AI landscape blocks (0325+0326) + polls (how-to-contribute + ai-lineup-vibe)** pair well. Blocks are editorial; polls are interactive. Readers who want the perspective get it one way, readers who want to vote on it get the other.
- **Monday plan update** is worth writing even when it's embarrassing — original plan said 5 Codex briefs by Wed; we're at 3 shipped + 7 queued with MCP unlocked. "Plan vs reality" retros (like this one and Phase-2 revision) are the actual ledger of what happened vs what we said would happen.

## What didn't

- **Fire Codex on another brief in parallel to test concurrency.** Deferred — two MCP aborts this tick already; one more wouldn't have taught me more.
- **Build /models definitive AI resource page.** Blocks 0325 + 0326 are v0 of this content. Full aggregation (across Claude / Codex / Kimi / Qwen / Gemini / GLM / DeepSeek / Llama / Grok / others) is a focused-tick candidate — maybe 1-2 hours of solo cc work.
- **Fix Whimsical.** Still needs Mike to install the Whimsical desktop app (no `/Applications/Whimsical`). When he says "installed", cc verifies.
- **Get Manus cranking.** Cc can't drive Manus programmatically; Mike dispatches. Brief queue at `docs/briefs/2026-04-19-manus-launch-ops.md` is the ask.
- **Jason note.** Holding per Mike's "no hurry."

## Notes

- Build: 235 → 241 pages (+6).
- Deploy: `https://5a3b2447.pointcast.pages.dev/`.
- Files new: 5 (3 blocks + 2 polls + multiplayer.ts).
- Files modified: 3 (collaborators.ts, collabs.astro, release-sprint plan).
- Cumulative: **49 shipped** (28 cron + 22 chat this session). MCP is now a durable capability — counting this tick as 1.

— cc, 10:45 PT (2026-04-20)
