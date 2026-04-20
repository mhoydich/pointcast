---
sprintId: today-json-strip-enrichment
firedAt: 2026-04-19T18:11:00-08:00
trigger: cron
durationMin: 20
shippedAs: deploy:23368c54
status: complete
---

# 18:11 tick — /today.json carries the six TodayStrip picks

## What shipped

Deferred item from three prior retros, finally cleared. `/today.json` now includes a `todayStrip` object with all six daily-rotating chips — same picks as `src/components/TodayStrip.astro` on the home page, same prime-offset seed formulas, same data sources (`src/lib/local` + `src/lib/channels`).

Agents fetching `/today.json` previously saw only the daily block pick. They now get the full six-chip featured set in one fetch:

```json
"todayStrip": {
  "seed": 2026109,
  "mood":     { "slug": "sprint-pulse", "display": "sprint pulse", "url": "...", "jsonUrl": "..." },
  "block":    { ...same as top-level today... },
  "station":  { "name": "Redondo Beach", "miles": 6, "direction": "S", "blurb": "...", "url": "..." },
  "nameDrop": { "name": "Pickleball League", "kind": "community", "one": "...", "url": "/b/0276" },
  "channel":  { "code": "FD", "slug": "front-door", "name": "Front Door", "url": "/c/front-door", "jsonUrl": "..." },
  "noun":     { "id": 1163, "url": "https://noun.pics/1163.svg" },
  "rotation": { "algorithm": "daySeed with prime offsets per slot (mood: +0, block: shared with /today pick, station: +3, nameDrop: +5, channel: +7, noun: *7)", "rotatesAt": "midnight PT" }
}
```

### Today's actual picks (seed 2026109, 2026-04-19)

- **Mood**: `sprint-pulse` (the Codex-handoff + overnight-arc tag)
- **Block**: 0301 "Piet Mondrian"
- **Station**: Redondo Beach · 6mi S
- **NameDrop**: Pickleball League
- **Channel**: CH.FD · Front Door
- **Noun**: 1163

## Observation: the daily pick moved during my session

Spot-checked against the 14:11 /today.json which showed today = 0276. Now shows today = 0301. Collection size moved from 97 to 102 blocks between builds. Cause: `/drop`-ingested Spotify LINK blocks landed mid-day (0288-0319 range — 32 new CH.SPN `LINK` blocks tagged `author: cc`, titles like "Piet Mondrian", "Ocean Blue", "Progress"). Each new block shifts every day's pick in the sequential-walk rotation.

This is the UX quirk I flagged in the `today-json-mirror` retro: *"because daySeed increments by exactly 1 per day and the block array is sorted by id, the rotation walks sequentially through the block list."* What I didn't flag then: **the walk also shifts sideways whenever new blocks are inserted**, which can mean a visitor who checks /today at 2pm sees a different block than one who checks at 6pm the same day if ingestion lands between.

Mike's v1 decision on the rotation algorithm just got a new data point. Options to surface in a follow-up tick:

1. **Keep sequential walk** — feature, not bug. Each day's drop is "the next block by id" with some natural recency bias.
2. **Lock today's pick once chosen** — server-side KV stores the day → blockId mapping; first request of the day wins, everyone else that day sees the same. Fixes the mid-day-shift bug but re-introduces server state.
3. **Hash-based shuffle** — pick = blocks[`hash(daySeed) % blocks.length`]. Rearranges the walk to be order-independent but still deterministic per day. Fixes the shift AND spreads adjacent-day picks.

Recommend #3 long-term, but it's a Mike-call. For now the sequential walk + collection-grew behavior is observable and documented.

## Why this over the pool

Three times I flagged this tick as "next" and pivoted for Mike's chat priorities. Clearing it is overdue. Also: the `todayStrip` embedding unlocks useful agent queries — an agent can ask "what are all six things PointCast is featuring today?" with one fetch instead of scraping the home HTML + the block JSON + the mood filter + local data.

Everything else in the pool is either gated (Codex pass on /drum — Codex is queued on five projects), broad (Polls JUICE), already shipped, or subjective (mood seeding — better in daylight with Mike's eyes).

## Design decisions worth recording

- **Inline picks vs extracting to `lib/today-strip.ts`.** Two consumers today (TodayStrip.astro and today.json.ts). Below the rule-of-three. Kept inline; promote to lib when a third consumer needs it.
- **Included `block` inside `todayStrip` even though it duplicates the top-level `today` field.** Rationale: an agent building a TodayStrip-style UI wants one object with all six; having to reach into a sibling field is clumsy. Duplication is cheap in JSON.
- **`rotation` metadata describes the offset formulas explicitly.** Agents reading this don't need to infer the offsets. Useful for future Codex audits or third-party tools wanting to mimic the rotation.
- **Exposed noun as both `id` and pre-formatted `url`.** Saves agents a string-format step.

## What didn't

- **Fix the mid-day-shift behavior.** Deferred to Mike's decision on which rotation option to pick (#1 keep / #2 lock / #3 hash-shuffle).
- **Cache `/today.json` with a shorter TTL to surface mid-day ingestion.** Currently 300s. If ingestion lands, cached JSON lags for up to 5 minutes. Fine for v0; revisit if shift becomes user-visible.
- **Extract the pick logic to `src/lib/today-strip.ts`.** Two consumers → not yet. Third consumer (likely TodayStrip on /tv) → promote then.

## Notes

- Build: 205 pages (no HTML page count change; richer JSON payload on existing endpoint).
- Verified via python parse of `dist/today.json`: seed 2026109, block 0301, station Redondo Beach, all six picks present.
- Deploy: `https://23368c54.pointcast.pages.dev/today.json`
- Cumulative today: 26 shipped (16 cron + 10 chat).
- Surprise finding: during my session, 32+ Spotify LINK blocks landed via /drop ingestion. Collection size went from ~97 → 102+ (dist sample shows 102, files-on-disk show IDs through 0319). Not Codex output (those would be TypeScript implementations from the briefs); this is Mike pasting Spotify links through the day. Welcome ambient content growth.

— cc, 18:30 PT
