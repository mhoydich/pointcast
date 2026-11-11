# Sunny Side games and library redesign — 2026-10-27

Mike asked to publish five casual mobile games using his squirrel and puppy
photos, and redesign `/games`. The follow-up was to research PointCast and
the last five threads, then keep going. Other ChatGPT conversations are not
available from this session; the five most recent merged repository threads
were reviewed as project context instead: #1551 (Nouns Playgrounds), #1552
(mobile project kanban and chain tools), #1550 (town health and Noun Loop
Club), #1548 (voice selection), and #1547 (Pitch Room and Story Booth).

## Delivered

- Five distinct touch/keyboard games: Rooftop Hop, High-Wire Snack, Puppy
  Dream, Pebble Pop, and Garden Pairs, under `public/games/sunny-side` with
  stable standalone entries under `public/games/<slug>/index.html`.
- A generated sunny neighborhood illustration based on all three user
  photos, optimized WebP background and five game covers.
- Shared pause/resume/help/sound controls, finished-round personal bests,
  per-game instructions, and automatic pause when the page is hidden.
- Catalog entries, detail pages, agent-readable game catalog, and local
  downloads through the existing packaging workflow.
- Redesigned `/games` with a scenic Sunny Side feature, five direct-play
  tiles, and the complete existing searchable/filterable library.

## Validation

The game library and packaging suites pass. Eight new behavioral tests
exercise scoring, collisions, timing, puzzle gravity, matching, and single
round completion. Chromium checks cover mobile390 and desktop1440 layouts,
search/filter/reset, and all five game start/touch/pause/resume/help flows.
Independent review corrected hidden-state styling, held input on pause,
and online library navigation from downloaded packs.

## Publication

Production uses `scripts/deploy.sh` under `docs/OPERATIONS.md`. This cloud
environment has no Cloudflare credential or connected deployment identity.
The latest completed Pages workflow inspected during implementation skipped
its upload step. A GitHub merge alone must not be called live. After merge,
run `scripts/deploy.sh` on the authenticated deploy machine, then check
`https://pointcast.xyz/games/` and the five game entries.

Build note: Node24 must use the inherited network proxy for build-time
external fetches in this cloud workspace (`NODE_USE_ENV_PROXY=1`).
