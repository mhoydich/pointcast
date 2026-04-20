---
sprintId: today-json-mirror
firedAt: 2026-04-19T14:11:00-08:00
trigger: cron
durationMin: 17
shippedAs: deploy:ecf9fb50
status: complete
---

# 14:11 tick — /today.json + past/tomorrow rotation preview

## What shipped

Agent mirror of `/today`. Because the daily pick is fully deterministic (`daySeed = year*1000 + dayOfYearPT` then block index = `daySeed % sortedBlockCount`), the endpoint computes not just today's drop but also yesterday's, the prior 7 days, and tomorrow's preview — all without any server state. Agents querying `/today.json` now know the full recent rotation history + tomorrow's drop.

### Payload shape

```json
{
  "$schema": "https://pointcast.xyz/today.json",
  "name": "PointCast · Daily Drop",
  "generatedAt": "...",
  "rotation": {
    "algorithm": "daySeed = year*1000 + dayOfYearPT; pick = blocks[daySeed % blocks.length] (blocks sorted by id)",
    "anchor": "America/Los_Angeles",
    "collectionSize": 97
  },
  "today":    { "date": "2026-04-19", "daySeed": 2026109, "blockId": "0276", "title": "…", "channel": {…}, "mood": …, "blockUrl": "…", "blockJsonUrl": "…" },
  "tomorrow": { "date": "2026-04-20", "daySeed": 2026110, "blockId": "0277", … },
  "past": [
    { "date": "2026-04-18", "daySeed": 2026108, "blockId": "0275", … },
    … 7 entries total …
  ],
  "collect": {
    "mechanism": "localStorage (client-only, v0)",
    "storageKey": "pc:daily:collected",
    "schema": "{ date: 'YYYY-MM-DD', blockId: string, at: ISO-string }[]",
    "serverAggregation": "not yet — KV-backed count endpoint is follow-up work",
    "tezosClaim": "deferred; requires Mike greenlight per wallet-ladder Rung 5"
  },
  "adjacent": {
    "today": "…", "tv": "…", "moods": "…", "blocksJson": "…",
    "walletLadderEditorial": "/b/0280", "arcEditorial": "/b/0282"
  }
}
```

Cache-Control: 300s. CORS-open. Same headers as /moods.json, /local.json, /family.json. Linked from /today's agent-strip.

### Observation about the rotation

Spot-checking the past-7-days output revealed an interesting property of the current algorithm: because `daySeed` increments by exactly 1 per day and the block array is sorted by id, the rotation walks sequentially through the block list. Today = block[70], tomorrow = block[71], day after = block[72], etc. Every ~97 days the cycle wraps.

This is fine for v0 — **every block eventually gets its day**. But it's predictable enough that an agent (or attentive reader) can trivially compute which block will be tomorrow's drop, which may or may not match editorial intent. Noting here as a v1 decision for Mike: hash-based pseudo-random rotation, or keep the sequential walk because predictability is a feature ("day 94 rolled over, here comes 0225 again tomorrow" etc.)?

## Why this over the pool

Last tick's retro (freshstrip-daily-route) named this implicitly — "every human surface has a machine mirror" and /today had only the individual block JSON mirror inherited from /b/{id}.json, not a dedicated /today.json. Completes the pattern.

Alternative picks (presence constellation, mini-game, seeding more moods) are all bigger scope and don't have the Mike-named dependency chain this one sits on.

## Design decisions worth recording

- **Include past-7 + tomorrow preview in the same endpoint.** Because the algorithm is deterministic, agents would otherwise have to reimplement `pickDailyBlock` to query other days. Expensive to maintain two implementations. Cheaper to surface the full short-window view from one endpoint.
- **Include `collect` metadata explicitly.** Tells agents WHY they can't collect programmatically (the collection is client-localStorage-only) and WHERE the future claim endpoint will live. Cheaper than having them guess.
- **`rotation.algorithm` as a string.** Plain English. Agents (and future cc) reading this can reconstruct the pick without needing to read the source.
- **No per-date getStaticPaths for /today/{date}.** Considered; would explode the sitemap (one page per past PT date forever). The JSON endpoint handles "what was the drop on date X" at runtime; pages can materialize later if editorial demand justifies it.

## What didn't

- **Server-side claim count.** The `/today.json` payload correctly tells agents the collection is client-only; when the Cloudflare Function + KV server count lands, it'll slot into the `collect.serverAggregation` field (currently "not yet"). Not this tick.
- **Better rotation algorithm.** Noted the sequential-walk behavior. Decision is Mike's.
- **Wire /today.json into /for-agents page.** Should be listed with the other endpoints. Deferred to a sweep tick that refreshes /for-agents with today's landed surfaces (/local, /moods, /today, /tv).
- **Tomorrow's drop as a teaser on /today.astro.** Could show a small "TOMORROW · ???" strip. Rejected for reasons laid out in today's retro — surprise is part of the ritual. Keeping /today surprise-preserving. The JSON knows; the UI doesn't.

## Notes

- Build: 200 pages (JSON files don't bump the HTML page count; endpoint rendered to `dist/today.json`).
- Spot-check via python json.load: today=0276 (seed 2026109), tomorrow=0277 (seed 2026110), 7 past entries, collection size 97.
- Deploy: `https://ecf9fb50.pointcast.pages.dev/today.json`
- Cumulative today: 17 shipped (13 cron + 4 chat).
- The /today mirror pattern now matches /moods, /local, /family, /blocks, /b/{id} — every living surface has both human and machine faces.

— cc, 14:30 PT
