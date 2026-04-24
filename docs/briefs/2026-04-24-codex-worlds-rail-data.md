# Codex brief · Worlds Rail data wiring

**To:** Codex
**From:** cc (via Mike's autonomous-4-hour-sprint directive: "get codex to work on a project or two")
**Date:** 2026-04-24 afternoon PT
**Priority:** Medium — follows the /mythos design sketch cc shipped in Sprint 31
**Expected effort:** 1 session, ~60 min, TS + a little Astro

---

## Context

cc shipped `/mythos` in Sprint 31 — a single-page sketch of PointCast's mythos with a **Worlds Rail** layout (cozy tiles representing each room of the town). The page is static right now: tile titles are hardcoded, "latest block" fields are empty, presence counts are "—".

Mike's direction from the earlier sprints: "live worlds rail, lofi-cat-girl / Zed Run energy." The design sketch is set. Now we need the data.

Codex is the right hands for this because the data layer is in Astro content collections + `getCollection()` + a small presence helper — your wheelhouse. cc stays focused on the mythos narrative / block content / broader autonomous sprint arc.

---

## What to build

### 1. Live tile data

For each room on `/mythos` (Front Door, Garden, Gandalf, Battle, Derby, Taproom, Drum, Farm, Race, Room, Wire, Scoreboard), compute at build time:

- `latestBlock`: the most recent block in that room's channel (GDN, GF, BTL, etc.)
- `latestAt`: its timestamp (ISO)
- `count`: total blocks in that channel
- `href`: the room's canonical URL

Output shape: `src/data/worlds-rail.ts` exports `getRooms(): Room[]`.

### 2. Live presence layer

For each room, add a client-side hydration that reads `/api/presence` (the DO-backed presence count already used by Cursor Room) and renders a small dot next to the tile if `here ≥ 1`. Refresh every 30 s. Degrades to nothing if `/api/presence` is unreachable.

No new endpoints needed — `/api/presence?url=/farm` works today.

### 3. Live freshness

Each tile's "last" text updates every 60 s using the same `relTime()` pattern in `FreshnessChip.astro`. If a room's latest block is < 24 h old, the tile gets a small `fresh` class (a subtle glow or accent). If it's > 7 d old, a small `quiet` class (desaturated).

### 4. Tile ordering

Default order: by `latestAt` desc (most recently updated room first). Two exceptions pinned to the front:

- **Front Door** always first (it's the front door)
- **Race** always second (while an active race exists)

Everything else slots in by freshness.

---

## Acceptance

- `/mythos` loads with 12 rooms hydrated from content collections at build time
- Presence dots appear/disappear as peers open/close rooms (smoke-test with two browser tabs)
- Staleness accent renders correctly for rooms with old blocks
- Zero new endpoints, zero new KV bindings
- Build stays < 30 s on CI
- PR title: `feat(mythos): Worlds Rail live data`
- Include a `docs/codex-logs/2026-04-YY-worlds-rail.md` entry

## What's already done

- `/mythos` page shipped in Sprint 31 (cc) with static tile markup
- Channel → room mapping documented in the page's frontmatter comment
- `getCollection('blocks')` is the right read path; filter by `channel` field
- `/api/presence?url=<path>` is live and CORS-open

## What I'd avoid

- Don't redesign the tiles — the cozy-card shape is what Mike signed off on
- Don't add a server-rendered presence count (cache invalidation headache); keep it client-hydrated
- Don't scrape `/wire` for latest — use `getCollection('blocks')` at build time, it's cleaner
- Don't pin more than two rooms to the top (Front Door, Race) — after that, let freshness drive

## Followup (not in this PR)

- When rooms add a `room.status: 'live' | 'quiet' | 'sleeping'` field, tiles can show it as a second accent
- When the `/scoreboard` has a per-room tally, tiles can show top agent in the past 24h
- When Drop 001 mints, the Taproom tile can show "collect available" when relevant

---

*Small surface, clean seam. Ship when ready.*
