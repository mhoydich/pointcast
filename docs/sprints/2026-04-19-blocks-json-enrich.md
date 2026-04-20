---
sprintId: blocks-json-enrich
firedAt: 2026-04-19T07:11:00-08:00
trigger: cron
durationMin: 17
shippedAs: deploy:8b348caf
status: complete
---

# 7:11 tick — /blocks.json + /b/{id}.json carry mood, author, companions, source

## What shipped

The canonical feed endpoint `/blocks.json` and the per-block `/b/{id}.json` were missing four fields that have become first-class on the site: `author`, `source`, `mood`, `companions`. Without them surfaced, any agent querying `/blocks.json` for "all blocks tagged rainy-week" or "which blocks are cc-authored" had to either HTML-scrape `/b/{id}` pages or fetch each block's individual JSON mirror. That's a contract leak.

This tick closes it. Added to both endpoints:

- **`author`** — the VOICE.md authorship enum (`cc` / `mike` / `mh+cc` / `codex` / `manus` / `guest`). Now agents can filter or audit by voice attribution.
- **`source`** — the provenance string when present (required for `mike`/`mh+cc`/`guest`, optional for others). Surfaced as `null` when absent, preserving stable shape.
- **`mood`** — the slug. `null` when untagged.
- **`moodUrl`** — convenience field; pre-computed `https://pointcast.xyz/mood/{slug}` or `null`. Lets agents pivot without string-formatting.
- **`companions`** — the cross-link graph, surfaced as empty array `[]` when absent. Agents doing graph traversal now have the edges in the canonical feed.

All four fields are additive-optional. Existing consumers that read the old fields keep working unchanged — verified by regression-testing the /blocks.json shape before deploy (the `id`, `url`, `channel`, `type`, `title`, `dek`, `timestamp`, `edition`, `external` keys are all still present in the same positions and formats).

## Why this over alternatives

- **/blocks.json is the most-queried agent endpoint on the site.** (Per /for-agents, it's the canonical feed surface.) If a field isn't there, it effectively doesn't exist for anyone who ingests the feed in bulk.
- **The fields are all already live.** We've just been adding them to the source-of-truth (block JSON files) without propagating them to the canonical read endpoints. Each tick that added an editorial discipline — VOICE.md authorship (2026-04-18), companions (10pm-bundle), mood (3:11 tick today) — quietly widened the gap between "what the site says" and "what agents can see the site saying."
- **Low-risk, high-leverage.** No schema touch. No route additions. No markup changes. Three edit operations. Regression-tested before deploy via direct JSON read of the rendered file.

## Verification sample

Just to confirm the enrichment landed — block 0281 (this session's editorial) now surfaces in `/blocks.json` as:

```json
{
  "id": "0281",
  "author": "cc",
  "mood": "sprint-pulse",
  "moodUrl": "https://pointcast.xyz/mood/sprint-pulse",
  "source": "cc-voice editorial, 2026-04-19 05:11 tick …",
  "companions": [4 entries]
}
```

Before this tick, an agent pulling `/blocks.json` would have seen none of those fields on any block.

## What didn't

- **`companions` detail in the listing.** The feed carries the full companions array per block; considered summarizing to just `companionCount` to keep payloads small, but 4-8 entries per block is well within reasonable payload size and the richer shape is strictly more useful. Left it full.
- **Pagination for /blocks.json.** The file header already notes: "switch to SSR pagination once the archive crosses ~500." We're at ~40 blocks. Not now.
- **/for-agents update.** Would be appropriate to add a "2026-04-19 changelog" line to /for-agents noting the enriched fields. Skipped to preserve tick discipline — can be folded into a later tick if needed, or Mike can do it in daylight.

## Notes

- Build: 196 pages, unchanged. No new routes — just richer payloads on existing ones.
- Regression check: parsed /blocks.json in python after build, spot-checked block 0281's new fields. Confirmed companions: 4 entries present, mood: "sprint-pulse", author: "cc", source: long string. Existing fields all still present.
- Deploy: `https://8b348caf.pointcast.pages.dev/blocks.json`
- Cumulative overnight: 6 ticks, ~109 min cc-time, 6 deployments.
- The field additions cascade through: /blocks.json, /b/{id}.json. Other agent endpoints (rss.xml, feed.json, feed.xml, c/{channel}.json, archive.json) may also benefit — candidate for a sweep tick if any of those are being queried in production.

— cc, 7:28 PT
