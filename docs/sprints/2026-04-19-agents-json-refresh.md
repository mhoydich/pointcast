---
sprintId: agents-json-refresh
firedAt: 2026-04-19T21:11:00-08:00
trigger: cron
durationMin: 17
shippedAs: deploy:76c5890e
status: complete
---

# 21:11 tick — /agents.json catches up to today's ships

## What shipped

`/agents.json` is PointCast's consolidated discovery manifest — one request returns every endpoint an agent cares about. It had fallen behind: the 8 human surfaces and 4 JSON mirrors shipped today weren't listed, plus the presence WebSocket + the mood/yee URL patterns weren't documented.

Added:

### `endpoints.human` (+6 entries)
- `profile` — /profile dashboard (shipped 20:58)
- `family` — /family Fukunaga Hoydich roster
- `today` — /today daily drop
- `moods` — /moods tonal atlas
- `local` — /local 100-mile lens
- `tv` — /tv broadcast mode

### `endpoints.json` (+4 entries)
- `family` — /family.json
- `today` — /today.json (now including `todayStrip` with all 6 rotating picks)
- `moods` — /moods.json
- `local` — /local.json

### `endpoints.api` (+1 entry)
- `presence` — `wss://pointcast.xyz/api/presence` (the WebSocket surface PresenceBar + VisitorHereStrip + /tv constellation all consume)

### `endpoints` (+2 URL patterns)
- `perMood` — `/mood/{slug}` + `/mood/{slug}.json` with brief algorithm note
- `perYeeTrack` — `/yee/{id}` with the "WATCH-type + media.beats" gating note

## Why this over the pool

- **Agent-native credibility.** /agents.json is the first file a serious agent pulls (per the "one request maps the whole site" design stance). Shipping new surfaces without updating the manifest is a silent regression.
- **No Mike-decisions required.** Pure data sweep.
- **Codex-relevant.** Codex will be reading /agents.json when picking up their briefs; having accurate surface inventory helps the architecture docs cite correct URLs.
- **Small scope.** ~15-min tick, clean additive edits, no risk of breaking existing consumers.

## Design decisions worth recording

- **Presence WS uses `wss://` prefix in the JSON.** The distinction matters for agent clients — they should NOT try `https://` on this surface. Inline in the URL string to keep the protocol visible.
- **`perMood.algorithm` inline in the manifest.** A sentence describing "editorial classifier cutting across channels and types" saves agents from having to read /moods.astro to understand the primitive.
- **`perYeeTrack.note` clarifies the gating**. An agent enumerating routes won't know which block IDs have /yee overlays; the note explains "WATCH-type with media.beats".
- **No `/profile` under `json`**. /profile doesn't have a JSON mirror yet — the dashboard reads client-side from localStorage. Adding `/profile.json` would require server-side identity which is Phase 1 of the release sprint (gated on Mike's decisions).
- **No `/tv.json` under `json`**. /tv is a display surface, not a data endpoint. A `/tv/state.json` for real-time broadcast state is a follow-up if it becomes useful.

## What didn't

- **`/visitor.json` or `/identity.json`** — the VisitorHereStrip + /profile primitives could expose an identity-echo endpoint ("here's what the server knows about the wallet you connected"). Gated on Phase 1 of the release sprint.
- **`/videolens` / `/tracklab` / `/play/*`** — Codex-project URLs that don't exist yet. Will add when they ship.
- **Update `/for-agents` again** — both manifests should be kept in sync. /for-agents got the big update at 16:30 today; /agents.json now matches. Future ships should touch both.
- **Change-log entry** — /changelog is authored; didn't add a line for today's work. The sprint plan doc + Block 0321 serve this function for now.

## Notes

- Build: 207 pages (unchanged; pure content update on existing endpoint).
- Verified payload via python parse: all 6 human surfaces, all 4 JSON mirrors, presence WS, perMood + perYeeTrack patterns present.
- Deploy: `https://76c5890e.pointcast.pages.dev/agents.json`
- Cumulative today: **33 shipped** (19 cron + 14 chat).
- This is a maintenance tick — the kind of thing that keeps the agent-native posture honest. cc commits to touching /agents.json every time a new endpoint ships going forward; catching up in batch is worse than rolling updates per-ship.

— cc, 21:29 PT
