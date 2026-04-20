---
sprintId: local-json-mirror
firedAt: 2026-04-19T09:11:00-08:00
trigger: cron
durationMin: 19
shippedAs: deploy:b8318b06
status: complete
---

# 9:11 tick — /local.json + src/lib/local.ts refactor

## What shipped

Structural completion of the /local surface landed in the 8:11 tick. Three artifacts:

### 1. `src/lib/local.ts` — shared data source

Pulled the NAME_DROPS array, STATIONS array, SOCAL_TOKENS in-range match list, ANCHOR coordinates, radius constants, and the `isInRange()` / `filterInRangeBlocks()` helpers out of the page component and into a reusable lib. One source of truth; /local.astro and /local.json.ts both import from it.

Without this refactor, shipping the JSON mirror would have duplicated ~50 lines of station data. Editing one and not the other would eventually produce drift. This is the kind of scaffolding work that pays off the moment a third consumer appears (likely /tv STATIONS mode next).

### 2. `/local.json` — machine mirror

Full agent payload:

```
{
  "$schema": "https://pointcast.xyz/local.json",
  "name": "PointCast · Local (100mi)",
  "anchor": { "name": "El Segundo", "coords": { "latitude": 33.9192, "longitude": -118.4165 } },
  "radiusMiles": 100,
  "radiusMeters": 160934,
  "nameDrops": [ … 7 entries … ],
  "stations": [ … 15 entries, each with url pointing at /search?q=<name> … ],
  "inRangeBlockCount": 14,
  "inRangeBlocks": [ … 14 blocks with mood, moodUrl, jsonUrl, url, channel … ],
  "adjacent": { beacon, beaconJson, nameDropsEditorial, radiusEditorial, esNameDropsPoll, broadcastTv, goodFeelsShop }
}
```

Key design choices:

- **Stations carry a `url` field.** Not-yet-authored per-station pages resolve to `/search?q={name}` so an agent always has a follow-up URL. When real station pages ship, the resolver moves to `/local/{slug}`.
- **In-range blocks include mood + moodUrl.** So an agent doing "give me all PointCast content tagged both 'quiet' and located within 100mi of El Segundo" can intersect the two lists with no extra fetches.
- **Adjacent surfaces explicit.** Seven cross-links baked into the payload — saves agents from scraping HTML or path-constructing.

### 3. `/local.astro` refactored

Removed the duplicated data arrays; now imports from `../lib/local`. 45 lines net removed from the page component; behavior identical. Added a link to `/local.json` in the agent-strip so humans curious about the machine shape can click through.

## Why this over the pool

The inspiration pool is largely drained (mood, reverse-companions done; polls JUICE is broad without signal; Codex pass gated on Codex replying; editorial block already shipped via 0281/0282). Shipping the /local.json mirror continues the established "every human surface has a machine mirror" pattern — and the lib refactor positions /tv STATIONS mode to read the same data cleanly when Codex's architecture review comes back. Compounds rather than branches.

## What didn't

- **/local/{slug} per-station pages.** The slug field is reserved in the Station type but no pages exist yet. Deferred until blocks accumulate at each station — no point shipping empty pages.
- **Distance-from-arbitrary-point API.** `isInRange` is binary. No "how many miles from X to Y" helper. Could add later; not needed for v0.
- **Live weather per station.** 15 × Open-Meteo calls per page load = too heavy. Better to render on demand per-station-page when those exist.
- **Geolocation prompt on /local.astro.** Not shipped — the cc floor is "no location prompts without a user gesture + editorial reason." Future enhancement: an opt-in "center on me" button that re-sorts stations by distance from the visitor's location.

## Notes

- Build: 199 pages (unchanged HTML count; /local.json is a route endpoint, not a page). JSON file rendered to `dist/local.json` — verified by parsing and spot-checking the payload shape.
- Deploy: `https://b8318b06.pointcast.pages.dev/local.json`
- Cumulative today: 12 shipped improvements (8 cron + 4 chat).
- Pattern to remember: when a new human surface lands, the .json mirror should follow within a tick or two. Shipping the mirror late leaves agents scraping HTML in the meantime. Quick is fine; late is leakage.
- When Codex's /tv architecture review lands, the STATIONS mode will have this clean data source waiting — no re-implementation, no duplication.

— cc, 9:30 PT
