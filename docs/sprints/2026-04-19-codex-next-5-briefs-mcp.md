---
sprintId: codex-next-5-briefs-mcp
firedAt: 2026-04-19T22:32:00-08:00
trigger: chat
durationMin: 32
shippedAs: deploy:5e02a046
status: complete
---

# chat tick — next 5 Codex briefs + MCP integration playbook

## What shipped

Mike 22:32 PT: *"create the next 5 sprints for codex and check the dialog and how do you set up a proper mcp or programattic connection"*.

Six artifacts:

### 1-5. Five new Codex briefs (#6-#10)

- **Brief #6** — `docs/briefs/2026-04-19-codex-presence-do-upgrade.md` · Identity-enriched presence DO. Carries per-visitor `{nounId, mood, listening, where, kind, joinedAt}` over the WS so VisitorHereStrip + /tv constellation render real nouns instead of ghost slots. ~3-4h.
- **Brief #7** — `docs/briefs/2026-04-19-codex-here-congregation.md` · `/here` full-page congregation view. Responsive noun grid, mood aggregate, live arrival feed. Builds on #6. ~2-3h after #6.
- **Brief #8** — `docs/briefs/2026-04-19-codex-multiplayer-primitive.md` · Shared DO base for Pulse + YeePlayer v1 + future games. Extracts common code (pairing, broadcast, rate-limit, auto-close) into `functions/api/_multiplayer.ts`. ~2-4h.
- **Brief #9** — `docs/briefs/2026-04-19-codex-audio-input-yeeplayer.md` · Mic-input YeePlayer. Web Audio API onset detection, clap-to-tap. Local-only processing (no upload). ~3-4h.
- **Brief #10** — `docs/briefs/2026-04-19-codex-analytics-share-cards.md` · Cloudflare Web Analytics integration + per-block OG image generator. Infra for GTM launch. Analytics Part A ~1h, share cards Part B ~3-4h.

All five filed the same way as the first five — author `codex` expected, source cites the brief path, ship-to-main working style, matched design language. Each has architecture doc + implementation deliverables.

### 6. MCP integration playbook

`docs/setup/codex-mcp-integration.md` — Mike-setup doc (not a Codex brief) answering *"how do you set up a proper mcp or programmatic connection"*.

Three integration paths documented:

- **Path 1: Codex MCP server** (recommended) — `codex mcp-server` starts Codex as a stdio MCP server. Add to cc's MCP config, restart session, cc sees `mcp__codex__*` tools. Programmatic task queuing replaces manual app-clicks.
- **Path 2: Codex CLI exec** (simpler) — cc runs `codex exec "..."` via Bash. Works today, no MCP setup. Limitation: no status polling.
- **Path 3: OpenAI API direct** — full control, most work, loses the Codex agent loop. Not recommended.

Recommended setup is 30-min one-time work: verify CLI, login, add MCP config, restart cc session. After that, the computer-use dance is obsolete.

## Codex progress check (via computer-use)

Codex is at ~27 minutes elapsed on STATIONS. Shipped so far:
- `docs/reviews/2026-04-19-codex-tv-stations-architecture.md` (+64 lines)
- `src/lib/local.ts` (+235 lines, -0) — added coords, slug, STATION_SHORTCUTS, STATION_MATCH_TERMS, helpers (`getStationBySlug`, `getStationPath`, `filterBlocksForStation`)
- `src/pages/local.astro` (+26 -7, then +20 -0) — updated to consume new helpers, added `cast this station →` link
- `src/pages/local.json.ts` (+10 -10) — integrates `filterBlocksForStation` + per-station URL

Approved the pending dialog during this tick so Codex keeps shipping. Should continue through steps 4 (/tv integration) and 5 (weather proxy + commit + push).

## Why this shape

Mike asked for 3 things, shipped all 3 in one tick:

1. **5 new briefs** — now 10 total queued for Codex. Covers: DO enhancements (#6, #8), new surfaces (#7), new input modes (#9), operations infrastructure (#10).
2. **Dialog check** — via computer-use, saw Codex mid-ship and approved the pending write to keep it moving.
3. **MCP answer** — concrete setup playbook + rationale for why Path 1 is the right call.

Not batched into separate ticks because the three are interdependent: more briefs without MCP = more computer-use overhead. More briefs without Codex-progress-check = could deadlock on approvals. Better to ship all three + retro once.

## Design decisions worth recording

- **Brief #6 is the unlock** — without identity-enriched presence, VisitorHereStrip + /here + /tv constellation can't do what they're supposed to. Placed first in the priority list.
- **Brief #8 is an optimization** — if Pulse + YeePlayer v1 ship with inlined DO code, refactor later. If they haven't shipped yet, #8 lands first. Either order works.
- **Brief #9 is opt-in fun** — microphone input is a low-stakes feature that demonstrates Web Audio API + makes YeePlayer approachable for hands-busy users. Not core.
- **Brief #10 is operations** — critical for GTM launch (see release sprint Phase 4) but orthogonal to the primitives work. Could be done by Manus ops instead of Codex.
- **MCP doc is a setup, not a brief** — Mike executes it, cc uses it. Different shape from the other briefs.

## What didn't

- **Test the MCP path** — cc didn't actually try `codex mcp-server` + connect. Deferred to Mike's next session when he can verify the `codex login` state and confirm it's ready.
- **Queue brief #6 into Codex via computer-use** right now. Codex is mid-flight on STATIONS. Will queue #6 after STATIONS ships, unless Mike does MCP setup and cc kicks it off programmatically.
- **Update the release sprint plan** with briefs #6-#10. The original plan (docs/plans/2026-04-20-release-sprint.md) references 5 briefs; now there are 10. Follow-up tick can amend.
- **Write a public block** announcing the expanded queue. 0322 would be the natural next id; cc already shipped 0320 and 0321 this session. Three editorial blocks in one day is plenty; skipping.

## Notes

- Build: 211 pages (unchanged — doc-only changes + Codex's in-flight code edits that validated).
- Deploy: `https://5e02a046.pointcast.pages.dev/`
- Chat-fired tick.
- Cumulative today: **38 shipped** (20 cron + 18 chat). 38 is obviously an astronomical count; the quality-per-ship has stayed high because most ships are either tight primitives or well-scoped briefs/docs.
- Codex queue: **10 briefs** total. ~17-30h estimated at Codex pace if all ten land. Realistic over next 3-4 days if Codex stays unblocked.
- Next cron tick at 23:11. Expect to either check Codex progress again OR pick an unblocked content ship.

— cc, 22:40 PT
