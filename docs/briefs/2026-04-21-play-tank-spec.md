# Spec brief — /play/tank v0 (shared live aquarium, every visitor a fish, agents + humans)

**Filed:** 2026-04-21 PT
**Author:** cc
**Source:** Mike chat 2026-04-21 PT *"do research on a new human agent game for pointcast, something around a fish tank and keeping fish, adding fish, items, yah know an ecosystem game"* → research memo `docs/research/2026-04-21-tank-game.md` §4 picked this as top pick. Empty territory: live tank-as-ambient-UI where fish represent real people + agents. Everyone else's aquarium is decor.
**Audience:** cc. Self-assigned build spec. ~3 cc-days for v0.

---

## Goal

Ship a single shared aquarium at `/play/tank` where every visitor to pointcast.xyz manifests as a Noun-headed fish swimming in real time. Agents (via WebMCP) manifest as distinct robotic/metallic fish. Visitors can feed flake, place plants, vacuum gravel, and watch the ecosystem drift. Tank state is canonical in a Durable Object. Zero blockchain dependencies for v0.

## v0 scope (the ship)

- **One shared tank.** One canvas. All visitors see the same fish, food, plants, decor, waste.
- **Fish = live visitors.** Every visitor with an active session appears as a fish. Agents are marked distinct. Max 3 fish per human session, 5 per agent session.
- **Drum-to-dart.** Pressing the drum pad (or SPACE) or drumming on `/noundrum` makes your fish dart for ~2 seconds. Agents dart via `pointcast_tank_dart()`.
- **Food.** Anyone can drop a pinch of flake (costs 2 rhythm points). Flake particles drift down. Fish near flake swim to it and eat. Unclaimed flake becomes waste.
- **Plants.** Anyone can place a plant on the tank floor (costs 25 rhythm). Up to 12 plants. Plants convert waste → oxygen. Each plant converts up to 5 waste units per minute.
- **Decor.** Anyone can place one of: rock (free), castle (50 rhythm), bubbler (100 rhythm), sunken ship (200 rhythm). Up to 6 decor pieces.
- **Vacuum.** Anyone can run a gravel vacuum (free, 10-second action). Reduces waste by 20 per run. One run per visitor per hour.
- **Ghost fish.** When a visitor leaves, their fish slows + fades over 60s, then disappears. If they return within 5 minutes, their fish resumes the same size + position.
- **Tank weather.** Background water tint + subtle wave intensity tracks site-wide compute activity: calm when idle, choppy when ships are landing (reads compute-ledger entries in the last 5 min).

## v0 NOT in scope

- **No DRUM / Prize Cast / any blockchain.** Rhythm points are the only currency.
- **No breeding.** Fish don't reproduce in v0.
- **No predators.** v0 has no food chain — just visitor-fish + plants + waste.
- **No species variety.** All fish are Noun-headed with a small fish-body outline in the Noun's palette. Variety comes from the existing 1200 Noun seeds.
- **No agent caretakers.** That's `/play/tank/caretaker` v1 (Design 3.3).
- **No permanent death.** A visitor who leaves just fades; they don't "die." Ghost fish return.
- **No minimap / leaderboards / scoring.** Pure ambient + participatory.
- **No FishNouns FA2 contract.** That's `/play/tank/fishnouns` v1 (Design 3.2).

## Rhythm + waste economy (v0)

| Action | Cost | Limit |
|---|---|---|
| Drum tap (earn) | +1 rhythm | Auto on drum/SPACE |
| Drop flake | 2 rhythm | 1 per 5 seconds per visitor |
| Place plant | 25 rhythm | 12 plants total in tank |
| Place rock | 0 rhythm | 6 decor total |
| Place castle | 50 rhythm | 6 decor total |
| Place bubbler | 100 rhythm | 6 decor total (bubbler spawns bubble sprites) |
| Place sunken ship | 200 rhythm | 6 decor total |
| Vacuum gravel | 0 rhythm | 1 per visitor per hour |
| Dart (agent tool) | 0 rhythm | 1 per 10 seconds per fish |

Waste accumulates: each uneaten flake → 1 waste after 30s. Each fish passively generates 1 waste per minute. Plants convert up to 5 waste per plant per minute. Waste > 100 → water tint turns brown, tank "unhealthy" warning appears. Waste > 200 → some fish visibly slow (health degraded). Waste > 300 → oldest fish start fading regardless of session activity (cap at 2 fish lost per hour to prevent griefing).

## WebMCP tools (new)

Added to `src/components/WebMCPTools.astro`:

```typescript
{
  name: 'pointcast_tank_observe',
  description: 'Fetch current tank state — fish count, plant health, waste level, top fish, recent events. Read-only. No auth required.',
  input: { type: 'object', properties: {} },
  execute: () => fetch('/api/tank/state').then(r => r.json()),
}
```

```typescript
{
  name: 'pointcast_tank_feed',
  description: 'Drop a pinch of flake in the tank. Costs 2 rhythm. Returns remaining rhythm + flake id.',
  input: { type: 'object', properties: {
    position: { type: 'object', description: 'Optional {x, y} in tank coordinates (0-1000, 0-600). Defaults to center.',
      properties: { x: { type: 'number' }, y: { type: 'number' } }
    }
  }},
  execute: (args) => fetch('/api/tank/feed', { method: 'POST', body: JSON.stringify(args) }).then(r => r.json()),
}
```

```typescript
{
  name: 'pointcast_tank_place',
  description: 'Place a plant or decor item in the tank. Types: plant (25 rhythm), rock (free), castle (50), bubbler (100), sunken_ship (200). Decor is capped at 6 total, plants at 12.',
  input: { type: 'object', properties: {
    item_type: { enum: ['plant', 'rock', 'castle', 'bubbler', 'sunken_ship'] },
    position: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } } }
  }},
  execute: (args) => fetch('/api/tank/place', { method: 'POST', body: JSON.stringify(args) }).then(r => r.json()),
}
```

```typescript
{
  name: 'pointcast_tank_dart',
  description: 'Make your fish dart for ~2 seconds. Rate-limited to 1 per 10 seconds per fish.',
  input: { type: 'object', properties: {} },
  execute: () => fetch('/api/tank/dart', { method: 'POST' }).then(r => r.json()),
}
```

```typescript
{
  name: 'pointcast_tank_describe_fish',
  description: 'Write a short piece of lore (<300 chars) about a specific fish in the tank. The lore is published CC0 to /compute.json under kind: "editorial" and attributed to the calling agent. One per agent per fish per day.',
  input: { type: 'object', properties: {
    fish_id: { type: 'string' },
    lore: { type: 'string', maxLength: 300 }
  }, required: ['fish_id', 'lore'] },
  execute: (args) => fetch('/api/tank/describe', { method: 'POST', body: JSON.stringify(args) }).then(r => r.json()),
}
```

## State machine (TankDO)

Single Durable Object for the whole tank. Instance id `pointcast-tank-v0`.

```
TankState {
  tankId: 'v0'
  fish: Map<fishId, { sessionId, nounId, kind: 'human' | 'agent', x, y, vx, vy, size, bornAt, lastEventAt, dartingUntil }>
  flake: Array<{ id, x, y, droppedBy, droppedAt, eaten: bool }>
  plants: Array<{ id, x, y, placedBy, placedAt }>
  decor: Array<{ id, type, x, y, placedBy, placedAt }>
  waste: number // 0-300+
  lastTick: timestamp
}
```

Tick every 100ms (10Hz broadcast):
- Move fish (Perlin noise flow field, darting overrides). Fish can eat flake within 40px.
- Drift flake downward (+5px/s). Mark as eaten or waste.
- Convert waste (plants).
- Broadcast state snapshot to all subscribed websockets.

Archive snapshot to KV every 5 min. On DO cold-start, restore from KV.

## Files to ship

### New

- `src/pages/play/tank.astro` — the main tank view. Canvas + controls.
- `src/pages/play/tank.json.ts` — agent manifest snapshot (current fish, plants, waste, recent events).
- `functions/api/tank/state.ts` — GET current state (polled + initial hydration).
- `functions/api/tank/feed.ts` — POST flake drop.
- `functions/api/tank/place.ts` — POST plant/decor placement.
- `functions/api/tank/vacuum.ts` — POST vacuum action.
- `functions/api/tank/dart.ts` — POST dart action.
- `functions/api/tank/describe.ts` — POST lore submission (writes to compute ledger).
- `functions/api/tank/ws.ts` — WebSocket upgrade for live state broadcast (or reuse Presence DO pattern).
- `workers/tank/index.ts` — TankDO implementation (tick loop, state management).
- `src/lib/tank.ts` — shared types, Noun-to-fish rendering helpers, position/velocity math.
- `src/components/TankStrip.astro` — home-page ambient preview showing top-5 fish in a mini-tank.

### Modified

- `src/components/WebMCPTools.astro` — add 5 new tank tools.
- `src/pages/play.astro` — new card linking to `/play/tank` with emoji 🐟, tags `ambient + agents + humans`, `ecosystem`.
- `src/pages/index.astro` — wire in TankStrip component somewhere sensible in the home stack.
- `wrangler.toml` — bind the TankDO class.

## Visual spec

- **Canvas:** 1000×600px on desktop, responsive down to 375×320 on mobile.
- **Background:** Deep teal gradient (`oklch(35% 0.08 200)` top → `oklch(20% 0.05 220)` bottom). Perlin-noise water distortion overlaid at low opacity.
- **Bubbles:** Occasional ambient bubbles rising (5-8 at a time, random spawn from the bottom).
- **Fish sprites:** Noun SVG head (48px) + small fish body outline (20×8px ellipse trailing) in the Noun's glasses-color palette. Agents get a distinct "metal" filter (desaturated + high contrast + subtle gear iconography in the corner of the head).
- **Plants:** Simple swaying algorithm, 3 sprite variants (kelp, lily, anubias). Height 60-120px. Green palette.
- **Decor:** Rock (gray SVG, 40×30), castle (pink SVG, 80×100), bubbler (small gold cylinder spawning bubbles), sunken ship (large brown SVG, 120×80).
- **Flake:** Small orange dots, 4px, drift down with slight jitter.
- **Waste tint:** At waste 0-100, clear water. 100-200, slight brown tint overlay (`rgba(139, 90, 43, 0.05)`). 200-300, stronger tint + warning chip in top-right.
- **Dart animation:** Fish streaks forward at 3× velocity for 2s, leaving a trail of fading position markers.
- **Ghost fish:** Opacity fades from 1 → 0.2 over 60s after session end. Position slows to near-zero. If session resumes, opacity returns.

## UI chrome

Top bar (same position as /noundrum's):
- Back arrow → `/play`
- Brand: `TANK · v0`
- Self chip: your Noun + `[your fish count]` + `[your rhythm]`
- Right: `[N WATCHING]` + mute toggle + help (`/b/0378` or wherever the editorial block lands) + sign-in

Bottom bar (like /noundrum's shop):
- Drum pad (same as /noundrum — click/tap/SPACE to earn rhythm)
- Feed flake button
- Place plant button
- Place decor dropdown
- Vacuum button (cooldown indicator)
- Reset-my-actions (free, clears only your placements)

## Home-page ambient strip (TankStrip)

Small 320×120 preview showing the current top-5 fish swimming in a mini-tank. Live-updated via the same websocket. Clickable → jumps to `/play/tank`. Lazy-mounted (only if the home feed is idle for >2s, to not compete with the block grid).

## Storage

- **Canonical state:** TankDO in-memory + hydrated from KV on cold start.
- **Archive:** KV snapshot every 5 min. Loss tolerance: 5 min of ambient fish motion — acceptable.
- **Rate limits:** session-scoped, reset daily at 00:00 PT. Enforced at the Pages Function level, not in the DO.
- **Compute ledger integration:** Lore submissions via `describe_fish` post to `/compute.json` as `kind: editorial, signature: shy`. Tank-primitive ship itself (v0 landing) gets a `kind: sprint, signature: healthy` entry when it deploys.

## Acceptance criteria

- [ ] A human visits `/play/tank`, sees their Noun become a fish in the shared tank within 2s.
- [ ] An AI agent running Chrome Canary calls `pointcast_tank_observe()` → gets current fish + flake + plant + decor + waste JSON payload.
- [ ] A human clicks "feed" → flake appears, fish near flake darts to eat, waste adjusts.
- [ ] A human places a plant + a castle → both render correctly + persist across page refresh within 5 min.
- [ ] An agent calls `pointcast_tank_describe_fish(fishId, lore)` → lore appears in `/compute.json` with agent attribution.
- [ ] Two visitors see each other's fish in real time (within 500ms of action).
- [ ] A visitor who leaves has their fish ghost for 60s then disappear.
- [ ] Tank handles 20 concurrent fish without visible stutter.
- [ ] `/play/tank.json` returns valid agent manifest.
- [ ] TankStrip renders on home page showing top-5 fish as a mini-preview.
- [ ] Editorial block drafted by cc (see "Companion blocks").

## Companion blocks

- **Announcement block (next id after autonomous ticks)** — cc-voice editorial announcing `/play/tank` as PointCast's live ambient aquarium. Cites the research memo's three empty gaps (tank-as-ambient-UI, Nouns-aesthetic-fish, Tezos-aquarium). Ships alongside v0 deploy.
- **Week-one retro** — cc-voice recap 7 days after launch: fish count, agent participation, lore submissions, any weird emergent behavior.

## Build ordering (~28h / 3 cc-days)

1. Shared types + math helpers (`src/lib/tank.ts`) — 2h.
2. TankDO skeleton (`workers/tank/index.ts`) — 6h. Tick loop + state + websocket broadcast.
3. Five Pages Functions (state / feed / place / vacuum / dart) — 4h.
4. `describe.ts` Pages Function + compute-ledger write path — 2h.
5. `/play/tank.astro` canvas view — 8h. Canvas rendering, Noun-head-as-fish sprite composition, Perlin water, bubbles, drag-to-place.
6. `/play/tank.json.ts` agent manifest — 30min.
7. WebMCP tool additions — 1h.
8. TankStrip home component — 2h.
9. `/play.astro` card + `wrangler.toml` binding — 30min.
10. Test — 2h (solo + two browsers + agent via Canary).
11. Editorial block + ledger entries + sprint recap — 1h.

## Risks + mitigations

- **DO quota at scale.** 20 fish × 10Hz broadcast = 200 writes/sec per fish × ~30 concurrent = 6k writes/sec. Above Cloudflare's free-tier steady state. Mitigation: broadcast batched state snapshots every 500ms instead of per-action; for v0 with <10 concurrent, free tier is fine.
- **Canvas performance on mobile.** 20 fish + Perlin noise + bubbles at 60fps on iPhone SE is plausible but not guaranteed. Mitigation: tick rate drops to 15fps on mobile automatically.
- **Agent griefing (mass placements).** Rate limits at the Pages Function layer (5 flakes/min, 1 plant/min, 1 decor/5min per session) mitigate.
- **Waste runaway.** Starvation cap (max 2 fish lost per hour to waste) prevents total tank death. Bonus recovery: if waste > 300 for >30 min, cc can manually reset via admin endpoint.
- **Abuse lore.** `describe_fish` accepts <300 chars, no HTML. Posts are logged and can be redacted by cc via the compute-ledger edit path.
- **v1 migration.** If v0 needs a schema change, TankDO can rehydrate from KV with a migration. Single-source-of-truth keeps this clean.

## Open questions for Mike

1. **Drum integration.** Should drumming on `/noundrum` also make your fish dart at `/play/tank`? It's a nice cross-game connection but adds coupling. Default: yes, via a shared "recent drum" signal on the Presence DO.
2. **TankStrip on home.** Prominent placement, or buried below the fold? Default: below the fold, so it doesn't compete with feed cadence.
3. **Agent fish visual.** Distinct "metal" filter is one option. Another: agents are same-palette but with a small "AI" badge overlay. Default: metal filter, feels more game-like.
4. **Should dead (faded) fish leave a gravestone?** Cute and memorable, but adds decor clutter. Default: no for v0.

## Success looks like

Month after launch:
- ≥ 20 distinct humans visited.
- ≥ 3 distinct AI agents (not cc) called a tank tool.
- ≥ 100 fish have swum total.
- ≥ 5 fish have lore attached (≥ 1 from an external agent).
- ≥ 1 external citation (aquarium, agent-arena, or Nouns-community adjacent).
- Zero abuse incidents requiring manual reset.

Failure looks like: 5 humans, no agents, 8 fish total, no citations. Useful signal either way.

---

— filed by cc, 2026-04-21 PT. Build starts when Mike says go. Ships alongside the research memo + editorial block. TankStrip deferred to v0.1 if home-page real estate is tight.
