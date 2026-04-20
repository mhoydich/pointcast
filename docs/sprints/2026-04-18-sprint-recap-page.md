---
sprintId: sprint-recap-page
firedAt: 2026-04-18T11:11:00-08:00
trigger: cron
durationMin: 22
shippedAs: pending-deploy
status: complete
---

# /sprints · the recap log

## What shipped

- **`src/lib/sprint-recap.ts`** — build-time reader of `docs/sprints/*.md`. Hand-rolled YAML frontmatter parser (no new dependency) + section extractor that splits markdown by `## Heading` into a keyed map. Returns `SprintRecap[]` newest-first, plus a `summary()` helper aggregating count, total minutes, by-trigger and by-status counts.
- **`/sprints` page** — renders all recaps with: title (from H1), trigger pill (cron/chat/ping/queue), firedAt time in PT, duration, status pill, sprintId. "What shipped" expanded by default. "What didn't", "Follow-ups", "Notes" collapsed under `<details>` summary toggles. Mobile-friendly — single column, big tap targets on the toggles.
- **`/sprints.json`** — machine mirror, same data shape, CORS-open, 60-sec cache.
- **OG card** for /sprints (green accent matching /sprint).
- **Discovery wiring:** /sprints + /sprints.json added to `agents.json` (human + json) + home footer.
- **Self-referential closure:** /sprints renders this very recap as the newest entry the moment it deploys.

## What didn't

- **Per-sprint permalink page (`/sprints/{slug}`):** considered; deferred. The single-page list with anchor links (`/sprints#voice-audit`) is enough for v1. A future sprint can split if individual sprints become long enough to deserve their own URL.
- **Filter / search UI:** the page is short enough at 5 recaps that filtering is overkill. Re-evaluate at 25+.
- **Markdown rendering beyond bullets + bold + code + links:** kept to a minimal regex set in the page. Not a full MD parser. If a recap section uses tables or code blocks, they'll render as plain text. Acceptable trade-off; can graduate to a proper parser later.
- **RSS/JSON feed of new sprints:** could be useful for Mike to subscribe-and-skim from his phone. Future sprint candidate (`sprints-feed`).

## Follow-ups

- After Manus M-3-2 binds `PC_QUEUE_KV`, the page could surface "currently picked but not yet executed" sprints alongside completed ones.
- A `trigger=manual` (chat-tick) recap would be useful — when Mike chats with cc directly and a sprint runs from chat, that recap should also land here. Need to remember to write the recap on chat sprints too, not just cron.
- Possible future: `/sprints/feed.xml` or `/sprints/feed.json` syndication.
- Codex review candidate: confirm the regex-based markdown rendering doesn't open an XSS surface (escape order matters; current code escapes `&<>` BEFORE applying inline markdown — looks safe but worth a second pair of eyes).

## Notes

- Cron tick :11 fired clean fifth time today. The autonomous loop is reliable.
- Cumulative cc work since 7:11: 22+28+18+14+22 = ~104 min across 5 sprints. ~30% of the morning. On pace for Mike's "30-35% weekly progress" target.
- This sprint creates a feedback loop: every future sprint is automatically discoverable + auditable via /sprints. Great for Codex review and for Mike to scan when he checks back.
- After deploy, /sprints will show 5 entries. /sprint shows 5 done in the "Recently shipped" strip too — same data, different view (picker vs. log).
