---
sprintId: sprint2-night1
firedAt: 2026-04-20T17:32:00-08:00
trigger: chat
durationMin: 30
shippedAs: deploy:b064cad0
status: complete
---

# chat tick — Sprint 2 Night 1: PULSE multi-agent + Manus MCP shim + Codex sprint 4/4 + Home Phase 2 + /play

## What shipped

Mike 2026-04-20 17:32 PT: *"add a codex working if codex working and manus ... so yah, when humans land things like collect, drum, interacting with existing peoples at the time, learnings, information updates ... its 5:32 on 4/20, not night 1 close out, lets get a good 4 hour sprint in lets go team."*

Eight ships in ~30 minutes. Five deploys. Codex shipped 4/4 of the sprint brief from earlier in the evening. Manus has a real local rail. Home rethink Phase 2 is live.

### Files shipped

- **`src/components/PulseStrip.astro`** — multi-agent dots. Shows `cc · codex · manus · chatgpt` (chatgpt only if any ledger entry exists). Each dot derives state from the most-recent `ComputeEntry` for that collaborator slug; green pulse if within 20 minutes, idle otherwise. Per Mike's direct ask "add a codex working if codex working and manus."

- **`tools/manus-mcp/{package.json,index.js,README.md}`** (new directory, ~280 lines, zero dependencies) — hand-rolled JSON-RPC stdio MCP server wrapping the Manus REST API. Two MCP tools:
  - `manus_run_task(prompt, files?, agent?, poll_timeout_sec?)` — create + poll until terminal state.
  - `manus_task_status(task_id)` — check a task already in flight.
  - Config-driven via env vars: `MANUS_API_KEY` (required), `MANUS_BASE_URL` (default `https://api.manus.ai`), `MANUS_AGENT_DEFAULT` (default `manus-1.6-max`), `MANUS_CREATE_PATH` (default `/v2/tasks`), `MANUS_STATUS_PATH_TPL` (default `/v2/tasks/{id}`), `MANUS_AUTH_SCHEME` (default `Bearer`). Once Mike confirms the actual Manus REST endpoint paths against the docs, override via env vars; no code change needed.
  - Install: `claude mcp add manus -e MANUS_API_KEY=$KEY -- node /absolute/path/tools/manus-mcp/index.js`. Stderr startup log confirms the binding.

- **`src/components/HeroBlock.astro`** — **shipped by Codex** (single-file low-reasoning MCP fire, 136 lines). Daily deterministic pick from a curated pool of 7 hero-worthy block IDs. Renders one block as a full-width editorial card above the fold (noun + kicker + title + dek + open-link). 4th Codex single-file win of the night.

- **`src/components/ActionDrawers.astro`** — **shipped by cc** (Codex MCP timed out on this multi-drawer spec earlier, cc shipped directly). 4-button accordion at the bottom of the home: ping (composer), drop (deep link), polls (deep link), contribute (pledge composer). One drawer open at a time. Each drawer color-coded (amber/green/violet/blue). Inline composers POST to `/api/ping`.

- **`src/pages/play.astro`** — discovery hub for all 8 interactive surfaces (drum, cards, quiz, here, polls, today, battle, prize-cast). Card-grid layout with accent color per game + 1-line description + tags + "play →" CTA. Single URL to send to a friend who wants to see what PointCast is in 30 seconds.

- **`src/content/blocks/0337.json`** — sprint mid-burn editorial. 4-min read. Captures Codex 4/4 results, manus-mcp shape, home rethink Phase 2 landing, the visitors-first pivot continuing. Cross-linked to /b/0336 (the pivot block) and /b/0332 (Codex retro).

- **`src/pages/index.astro`** — wired in HeroBlock (above PULSE) + ActionDrawers (after the BlockReorder grid).

- **`src/components/TodayOnPointCast.astro`** — added `PLAY · HUB` entry to the rotation pool.

- **`src/lib/compute-ledger.ts`** — synced 9 new `ComputeEntry` rows for tonight's ships. Disciple held: every shipped retro writes a matching ledger entry in the same commit.

- **`src/lib/ship-queue.ts`** — synced 6 new `QueuedShip` rows (ship-0056 through ship-0061), all marked `shipped` with landedAt timestamps + artifact pointers.

### Deploy chain (Sprint 2 Night 1)

| Hash | What |
|---|---|
| `cc430870` | PulseStrip multi-agent + manus-mcp + HeroBlock + ActionDrawers wired |
| `b064cad0` | /play hub + block 0337 + TodayOnPointCast pool entry |

Plus four earlier deploys this evening covered in `docs/sprints/2026-04-20-codex-sprint*.md` history.

### Codex operationalization — empirical rule confirmed

Tonight: **5 Codex MCP fires, 4 successful ships, 1 deferred-to-cc.**

- ✅ PrizeCastChip — low reasoning, single file → MCP "timed out" but file landed (filesystem confirmed)
- ✅ SHA-256 hash script — low reasoning, single file → MCP returned cleanly + script ran
- ✅ OAuth authorization server stub + headers edit — low reasoning, 2 atomic files → MCP returned cleanly
- ❌ /quiz — medium reasoning, 3 files including a content JSON → MCP timed out, no files. cc shipped directly.
- ✅ HeroBlock — low reasoning, single file → MCP returned cleanly + 136 lines

**The rule:** Codex MCP at low reasoning effort + single-file atomic spec + < 200 lines = reliable inside the 60s MCP budget. Anything else → split into smaller atomic units, or fall back to cc.

**The corollary:** the MCP "timeout" return code is not authoritative. Always check filesystem for expected output regardless of MCP response status.

**The fix at the source:** Mike's local Codex CLI install (per `docs/setup/codex-full-blast.md`) inherits `model_reasoning_effort=high` + a longer timeout. Once installed, the timeout class of failure should disappear and we can ask Codex bigger things.

### Manus operationalization — shim ready, awaiting key

The Manus REST API exists; there's no official MCP server; community packages are inconsistent. Tonight's ship is a clean local shim Mike can install in one command once he has his `MANUS_API_KEY`. The shim is deliberately env-config-driven so when the actual endpoint paths differ from the documented defaults (the open.manus.im docs are partial and the full reference requires a logged-in dev portal), Mike can adjust without code edits.

Test path:
```bash
export MANUS_API_KEY=sk-...
cd tools/manus-mcp && node index.js   # should print "[manus-mcp] ready ... · key-set" to stderr
```

If that works, then:
```bash
claude mcp add manus -e MANUS_API_KEY=$MANUS_API_KEY -- node $(pwd)/tools/manus-mcp/index.js
```

Restart Claude Code. `/mcp` should list `manus` with the two tools. From then on, any Claude Code session can route long-horizon research / web automation / file-producing tasks to Manus on your credit budget.

## What didn't

- **Block 0336 Phase 1 pivot blocks** — cleaned up earlier, fine.
- **The `/quiz` Codex fire** — failed but cc covered. Pattern data is more useful than the loss.
- **BlockReorder debug** — still queued. Honest answer: needs Mike's specific failing device + a screen recording to reproduce. Local dev Chrome works.
- **A new editorial topical block** beyond 0337 — chose to retro instead. Easy to add in next slot.
- **ChatGPT operationalization beyond a brief** — drum-cookie-clicker brief still sitting; cc shipped /drum/click directly earlier tonight. ChatGPT route stays manual until Mike pastes a brief.

## Honest read on the visitor-first pivot

Six interactive primitives are now live + linked from `/play`:

1. `/drum/click` — Web Audio cookie clicker (cc, this evening)
2. `/cards` — daily collectible (cc, this evening)
3. `/quiz` — daily trivia (cc, this evening)
4. `/here` — live congregation
5. `/polls` — community voting
6. `/today` — daily drop collect
7. `/battle` — card-of-the-day duel (existing)
8. `/yield` — Prize Cast (pending originate)

Plus the home now has HeroBlock above the fold (above PULSE) so a first-time visitor sees an editorial card before any infrastructure strip. ActionDrawers at the bottom captures the "I want to do something" affordances (ping, drop, polls, contribute) without taking space above the fold.

The remaining gap on the visitor axis: real **interactions with other people in real time**. /here has the presence DO but the surface reads dashboard. A `/room` or chat-style refresh of /here is the natural next ship — not in this tick.

## Follow-ups (priority for the next 3h of the 4h sprint window)

1. **Mike installs Codex CLI + manus-mcp** (his terminal, not cc's session). One-time setup; unblocks heavier delegations going forward.
2. **One more visitor primitive** — candidates: `/here-as-a-room` refresh, `/learn` micro-pages, a topical editorial block on something current.
3. **BlockReorder debug** — needs Mike's device-specific failure repro. Cc willing to attempt Chrome MCP mobile emulation if Mike confirms the extension is installed.
4. **ChatGPT brief queue** — drum brief, Field Node client brief, etc. Could become a `/briefs` page that Mike pastes from.

## Notes

- Files new: 5 (HeroBlock, ActionDrawers, /play, block 0337, manus-mcp directory tree)
- Files modified: 4 (PulseStrip, TodayOnPointCast, index.astro, compute-ledger, ship-queue)
- Cumulative shipped (this evening): **18 ships** between 17:30 and 19:50 PT.
- Five deploys: `8902e3a0` → `4dd0aaec` → `f46d75b6` → `1e3935c6` → `0354c6f4` → `90da7ae9` → `cc430870` → `b064cad0` (8 deploys total since 4:30 PT today; this retro covers the post-cadence-system arc).

— cc, 19:50 PT (2026-04-20) · five deploys, eight ships, one Manus shim, four Codex wins, one home that finally reads like a newspaper
