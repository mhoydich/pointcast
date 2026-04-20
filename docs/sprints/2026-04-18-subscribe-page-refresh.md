---
sprintId: subscribe-page-refresh
firedAt: 2026-04-18T15:11:00-08:00
trigger: cron
durationMin: 14
shippedAs: pending-deploy
status: complete
---

# /subscribe · cover new feed surfaces

## What shipped

- **`/subscribe` agent-feeds dl expanded from 4 to 10 entries:**
  - DISCOVERY, SUMMARY, CANONICAL, STRIPPED — kept (existing).
  - **LIVE STATE** — `/now.json` (60s cache, current state).
  - **WORK LOG** — `/sprints.json` (autonomous sprint history, updates each cron tick).
  - **TEAM** — `/collabs.json` (collaborators registry + 3-step federation spec).
  - **SHOP** — `/products.json` (Good Feels SEO scaffold with schema.org Product).
  - **CONTROL** — `/sprint.json` + reference to POSTing picks to `/api/queue`.
  - **INBOX** — POST `/api/ping` (messages) + POST `/api/drop` (URLs).
- **Three-tier footer note** under the agent-feeds list:
  > Three tiers: RSS / JSON Feed (for humans with readers), Farcaster / X / GitHub (for humans without), everything above (for agents). All endpoints are CORS-open. No auth, no preflight.
- **CSS** for `.agent-feeds__footer` — dashed top rule, ink-soft body, accent on the italic phrase.
- **Sprint backlog updated:** `subscribe-page-refresh` now `status: 'done'`. The 1:11 refill's middle item shipped.

## What didn't

- **Did not touch the `feeds[]` array** — RSS / JSON Feed / blocks JSON / per-channel feeds are correct as-is for human readers. Adding the v3 JSON surfaces there would conflate "this works in your RSS reader" with "this is a state snapshot endpoint."
- **Did not add OG / external-reader hints** to the new agent surfaces — they're not designed to be added to a feed reader (they don't update at the cadence a reader expects).
- **Did not restructure the page** — the existing 3-panel layout (Feeds / Apps / Socials → Agent panel) is correct. Just expanded the agent panel.

## Follow-ups

- One more refill-batch sprint remains ready: `block-author-backfill` (20m). Next cron tick at 4:11 picks it.
- After Manus M-3-2 binds PC_QUEUE_KV, the CONTROL row could note "currently {N} picks queued" pulling from /api/queue?action=list.
- Consider adding a "RSS for sprints" — a `/sprints.rss` Atom feed that LLMs friendly to RSS could subscribe to for new autonomous sprints. Future sprint candidate.

## Notes

- 9th cron tick of the day, 8th sprint shipped.
- Cumulative cc work since 7:11: ~160 min across 8 sprints.
- The agent-feeds dl is now 10 entries deep, which is approaching "this should be a separate page" territory. If we add 2-3 more, consider promoting it to `/agents` (a new page distinct from `/agents.json`) or `/feeds` for routing.
- Loop is steady. Five ticks in, three modes exercised: full sprint, substitute, audit-and-refill.
