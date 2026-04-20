---
sprintId: brief-7-here-mcp-driven
firedAt: 2026-04-20T09:30:00-08:00
trigger: chat
durationMin: 65
shippedAs: deploy:82dd8e54
status: complete
---

# chat tick — Brief #7 shipped via first-ever MCP-driven Codex run (+ cc takeover)

## What shipped

**Brief #7 (/here full-page congregation view)** — the first feature delivered through the new Codex MCP integration that came online ~50 minutes prior. 6 files, mixed Codex + cc authorship based on where the MCP timeout pattern fit best.

### Files

1. `functions/api/presence.ts` (Codex, modified) — extracted a shared `snapshot()` method; added a `GET /snapshot` handler on the DO class.
2. `functions/api/presence/snapshot.ts` (Codex → cc patched) — Cloudflare Pages Function proxying the DO's snapshot with a 5s edge cache. cc patched to return a graceful empty-state JSON when the DO isn't bound (see DO caveat below).
3. `src/components/HereGrid.astro` (cc) — client-hydrated congregation renderer. Grid with responsive minmax(120px, 1fr), mood aggregation, YOU self-match via `pc:session` sid → nounId + closest joinedAt, WS reconnection + ping.
4. `src/pages/here.astro` (cc) — page shell in /tv's dark/amber visual language, EventPage JSON-LD.
5. `src/pages/for-agents.astro` (cc, appended) — four new endpoint lines: `/api/presence/snapshot`, `/here`, `/for-nodes`, and existing `/api/presence` description.
6. `src/pages/agents.json.ts` (cc, appended) — `html.here`, `html.forNodes`, `api.presenceSnapshot` entries.
7. `docs/reviews/2026-04-19-codex-here-architecture.md` (cc) — architecture doc capturing the design + Codex/cc division of labor.

Also shipped orthogonally in the same tick:

- `src/lib/nodes.ts` (cc, new) — owned-agents registry. `Node` interface + `NODES[]` with cc, codex, mike as initial entries + `getNode()`/`resolveAgentLabel()`/`nodeCounts()` helpers. Groundwork for labeling Jason's OpenClaw when he plugs in.
- `src/pages/for-nodes.astro` (cc, new) — public "become a node" page. Renders the 2-line agent-broadcast snippet, lists registered nodes, explains the namespace-isolation architecture.
- `docs/briefs/2026-04-20-codex-presence-worker-deploy.md` (cc, new) — Codex brief for shipping the Presence DO as a companion Worker so the broadcast plumbing actually lights up.

### Build + deploy

`npx astro build` → 232 pages (up from 230: +/here, +/for-nodes). Deploy `https://82dd8e54.pointcast.pages.dev/`. Smoke tests: `/here`, `/for-nodes`, `/api/presence/snapshot` all return 200.

## The MCP timeout pattern

This was the first ever Codex-via-MCP task. Key learnings:

1. **MCP request timeout is ~60s.** Codex's default `model_reasoning_effort = xhigh` + big prompts blow past it.
2. **Fix 1: reduce reasoning effort** via `config: {model_reasoning_effort: "medium"}` in the tool call. Works for planning + small tasks.
3. **Fix 2: small turns.** Give Codex ONE file per turn with a tight prompt so the read+write+respond cycle fits inside 60s.
4. **Surprise: writes persist even on timeout.** When Codex writes a file before the MCP response is assembled, the file lands on disk. The MCP call times out (no response to cc) but the work is real. cc can verify via filesystem.
5. **Limit: harder turns don't make it to write-time.** HereGrid was too big (lots of context reading before writing); Codex aborted before touching the file. cc took over.
6. **Result**: hybrid division of labor. Codex gets backend-refactor tasks (snapshot handler extraction, DO endpoint adds). cc gets UI + client state. Both are short turns.

This is a working pattern. Not perfect (timeout is a real constraint) but it beats desktop-app + dialog approvals by an order of magnitude.

## The DO caveat

`/api/presence/snapshot` returns an **empty snapshot** currently, not live data. The `PresenceRoom` Durable Object has NEVER actually been bound — Pages Functions can't export DO classes; DOs need a standalone Worker that Pages references via `script_name`. This has been documented in `docs/presence-next-steps.md` since v2 launch. Brief #6's broadcasts technically rely on the same deferred DO; VisitorHereStrip and PresenceBar have been degrading gracefully (silent failure, hidden) the whole time.

Brief #7's `/here` page inherits the same state: it renders cleanly in its "waiting for peoples · broadcast your presence by staying on the page" quiet state. When the DO actually ships, `/here` lights up automatically with zero additional changes.

**The fix**: deploy a companion Worker at `workers/presence/` with the `PresenceRoom` class + bind via `script_name = "pointcast-presence"` in the root wrangler.toml. Brief filed at `docs/briefs/2026-04-20-codex-presence-worker-deploy.md`. Next Codex turn.

## Why this over other tick options

- **Directly acts on Mike's direction**: "lets prioritize getting the mcp working or whichever pathway opens up the development pipeline" — MCP is online + exercised. "yah lets fix whimsical" — diagnosed (extension expects a localhost:21190 bridge from a Whimsical desktop app that isn't installed); awaiting Mike's uninstall-vs-install call. "send me a note i can send to jason" — drafted in-chat with the 2-line snippet; /for-nodes page is the landing page for it.
- **Closes Brief #7**, which was the next-logical-after-#6 queue item.
- **Creates the Jason onboarding infrastructure** as a side effect — nodes.ts registry + /for-nodes page + the honest moderation-via-namespace-isolation architecture all land.

## Observations

- **Codex's write-during-timeout behavior is ideal for this harness.** cc fires, doesn't wait for response, checks disk, fires next. Feels closer to an async queue than a request-response tool.
- **Small-turn overhead matters.** 3 Codex turns × 60s each = 3min of reading + thinking for work cc can do in 30s directly. The balance point is: backend refactors → Codex, UI + client state → cc. Each plays to its strengths.
- **The DO deferred situation is embarrassing in retrospect.** Two Codex briefs (#6, #7) shipped code against a DO that has never been bound. Graceful degradation hid it. /here pushes the issue into visible territory — if Mike looks at /here tomorrow and sees "waiting for peoples" forever, that's the cue to ship the companion Worker.

## What didn't

- **Actual live presence.** Still blocked on the companion-Worker deploy. Brief filed; Codex can ship it next.
- **Fire Codex's DO-Worker brief this tick.** Could have chained it. Chose to stop and write the retro so the MCP-online + Brief #7 arc closes cleanly. Next tick picks it up.
- **Whimsical fix.** Awaiting Mike's uninstall-or-reinstall call (see earlier chat).
- **Send Jason the note.** Mike's job — draft is ready in chat.

## Notes

- Build: 230 → 232 pages (+2 routes).
- Deploy: `https://82dd8e54.pointcast.pages.dev/here/`
- Files new: 5 (HereGrid, here.astro, snapshot.ts, nodes.ts, for-nodes.astro, plus architecture doc + DO-deploy brief + retro).
- Files modified: 3 (presence.ts, for-agents.astro, agents.json.ts).
- Cumulative: **47 shipped** (28 cron + 20 chat). Brief #7 counts as 1 ship.
- Codex queue: 2/10 done (+ Brief #7 partial — UI shipped, DO-deploy follow-up filed).

— cc, 09:50 PT (2026-04-20)
