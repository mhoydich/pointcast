---
sprintId: moods-json-mirror
firedAt: 2026-04-19T06:11:00-08:00
trigger: cron
durationMin: 16
shippedAs: deploy:d9df53cc
status: complete
---

# 6:11 tick — /moods.json + /mood/{slug}.json (agent mirror)

## What shipped

Structural completion of the mood primitive. The human surfaces (`/moods` atlas, `/mood/{slug}` filter) landed in the 3:11 and 4:11 ticks; the agent-facing mirrors landed this tick:

1. **`/moods.json`** — the full tonal atlas as a single JSON payload. Same sort as the HTML page (population desc, freshest-entry tie-break), but with richer metadata per row: block/gallery counts, ISO-8601 freshest timestamp, up to 3 sample block ids, plus an explicit `url` + `jsonUrl` so an agent can pivot into either surface without path construction.

2. **`/mood/[slug].json`** — per-mood filter as JSON. Enumerates matching blocks (with channel, type, title, dek, timestamp, url, jsonUrl, author) and matching gallery items (slug, title, imageUrl, tool, createdAt, url). `counts` object duplicates the split so clients can branch on shape without counting the arrays.

Both endpoints follow the established pattern from `/family.json`, `/blocks.json`, etc.:
- `$schema` self-reference (handy for agents that catalog endpoints)
- `generatedAt` ISO timestamp
- 300s `Cache-Control` with `Access-Control-Allow-Origin: *`
- Stable field names; null over omit where a field is conceptually present but empty

Also updated the `agent-strip` on both `/moods` and `/mood/{slug}` to link their new JSON mirrors — so a visitor who's curious about "how does an agent see this page" can click through directly.

### Sample payload shape

```json
{
  "$schema": "https://pointcast.xyz/moods.json",
  "name": "PointCast · tonal atlas",
  "generatedAt": "2026-04-19T13:28:40.898Z",
  "moodCount": 6,
  "totalEntries": 9,
  "moods": [
    {
      "slug": "rainy-week",
      "blocks": 4,
      "gallery": 0,
      "total": 4,
      "freshest": "2026-04-19T05:20:00.000Z",
      "sampleBlockIds": ["0275", "0264", "0263"],
      "url": "https://pointcast.xyz/mood/rainy-week",
      "jsonUrl": "https://pointcast.xyz/mood/rainy-week.json"
    },
    …
  ]
}
```

7 JSON files rendered this deploy (1× moods.json + 6× per-mood).

## Why this over alternatives

- **Structural pattern completion.** PointCast's agent-native design contract is "every human surface has a machine mirror." Shipping `/moods` without `/moods.json` violated that contract; agents couldn't ingest the atlas without HTML-scraping. This tick closes the gap.
- **No schema risk.** Pure additive — new route files, no content.config.ts touch. Safe tick after the mood-primitive tick that did touch schema.
- **Compounds the last three ticks.** The whole 2-hour mood arc (primitive → atlas → editorial → mirror) is now end-to-end: a block author adds a mood slug, the chip appears, the filter page renders, the atlas updates, the JSON endpoints update, agents index them on next crawl.

## Alternatives considered

- **Seed more moods on existing blocks.** Would increase atlas density. Didn't ship — subjective taxonomy work is better done in daylight with Mike's eyes. The 6 existing slugs are enough to prove the pattern.
- **Polls JUICE micro-improvement.** Would need to run the live site interactively to know what needs polish. Not tick-appropriate without a concrete signal from Mike or a retro.
- **Mood chip on home-feed cards.** Rejected for the same reason as the mood-primitive tick: home grid is already visually dense.

## Notes

- Build: 196 pages (same HTML count; Astro doesn't count .json-route-emitted files here). 7 JSON files rendered to dist/ — verified via filesystem check before deploy.
- Caching: both endpoints use `public, max-age=300` — same as `/family.json`. 5 minutes is generous enough for agents not to hammer, tight enough that a fresh mood slug is visible within one cache window.
- Deploy: `https://d9df53cc.pointcast.pages.dev/moods.json`
- The `$schema` field is a forward-looking affordance; when a JSON Schema file is eventually authored at that URL (out of scope for now), existing consumers already reference the right one.
- Cumulative overnight: 5 ticks, ~92 min cc-time, 5 deployments. The loop is holding its rhythm and the arc is still compounding.

— cc, 6:30 PT
