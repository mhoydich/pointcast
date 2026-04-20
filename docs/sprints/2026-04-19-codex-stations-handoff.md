---
sprintId: codex-stations-handoff
firedAt: 2026-04-19T17:40:00-08:00
trigger: chat
durationMin: 11
shippedAs: deploy:c032c559
status: complete
---

# chat tick — Codex gets a second project: STATIONS mode on /tv

## What shipped

Mike 17:45 PT: *"ok, lets give codex another project"*. Pulse went out 22 minutes ago. This is project #2.

Two artifacts:

### 1. Codex brief — `docs/briefs/2026-04-19-codex-tv-stations.md` (~1,300 words)

Full spec for STATIONS mode on `/tv`. The feature in one sentence: press a button (or wait for auto-cycle) and `/tv` flips from the global feed into a station-specific micro-feed — one of 15 SoCal cities within 100 miles of El Segundo — each carrying its own filtered block rotation, weather readout, and local identity.

Brief covers:

- **UX shape**: three modes (global → stations-index → station-feed), transitions via keyboard (S / Esc / numbers), touch (swipe up/down), or a dedicated "STATIONS" button. Auto-return after N minutes idle.
- **Filtering**: permissive substring match against `meta.location`. Special-case for "Los Angeles" station (matches every in-radius block since LA is the county-level anchor).
- **Weather per station**: Open-Meteo with a Cloudflare Function proxy + 10-min edge cache recommended.
- **Five architecture questions (A1-A5)**: SSG-with-embedded-data vs SSR, state machine, key mapping, back-to-global timeout, KV-vs-cache.default.
- **Four deliverables**: add coords to `src/lib/local.ts` STATIONS, integrate modes into `src/pages/tv.astro`, optional `/tv/{station}` dedicated URLs, `functions/api/weather.ts` proxy.

### 2. Block 0284 — "Codex gets a second project — STATIONS mode on /tv"

Public companion to 0283. Same `mh+cc` authorship + verbatim source. Mood `sprint-pulse`. Companions to 0283 (Pulse), 0282 (the arc), /tv, /local.

Body is explicit: **Pulse is the interactive game layer; STATIONS is the geo-channel layer.** Codex works both in parallel or sequence — they don't block each other. Pulse = new route + DO. STATIONS = additive on /tv + weather proxy.

## Why STATIONS as the second Codex project

- **Distinct from Pulse.** Pulse is realtime multiplayer WS; STATIONS is data filtering + geo. Different architectural muscles exercised.
- **Infrastructure-leveraged.** `/local.json` (9:11 tick), `src/lib/local.ts` (same tick), and `filterInRangeBlocks()` are already in place. STATIONS is a consumer of that data, not a new data layer.
- **Biggest missing shape on /tv.** 15 stations × ~8 blocks each ≈ 120 possible micro-feeds — compared to /tv's single 28-slide global feed, that's a significant content multiplier.
- **Feeds Manus's platform work.** The morning Manus brief asked about location APIs + 100-mile-radius features. STATIONS is the answer Manus can reference concretely when their analysis lands.

## Design decisions worth recording

- **Both briefs filed within 25 minutes.** Mike's "super fast" framing applies to queuing as well as execution. Don't pace Codex's work — let them batch-intake. If they only ship one of the two, we learn that; if they ship both, we learn that too.
- **Blocks 0283 + 0284 are siblings.** Each carries a companion link to the other. When /b/0283 or /b/0284 gets viewed, the other appears in the COMPANIONS strip. The two projects are visually paired in the feed.
- **No stub files for STATIONS either.** Same rationale as Pulse — let Codex own the full file shape. `src/lib/local.ts` is the only file they modify rather than create; the coords addition is small enough that it won't constrain architecture.
- **Stations auto-rotate is optional in spec.** Codex gets to choose whether /tv auto-cycles through stations or stays on a viewer-chosen one. Open-ended to let them think about it.
- **`/tv/{station}` is also optional in spec.** Bookmarkable castable URLs vs client-side mode switch — Codex decides. cc's bias (documented): yes, make them real URLs, because bookmarking a station is a real use case.

## What didn't

- **A meta-block about Codex handoff patterns.** Could editorialize on the "cc leaves room, Codex fills it" pattern that's emerging. Deferred; if Pulse + STATIONS both land, that editorial becomes natural. If one stalls, the editorial would be premature.
- **A third project.** Tempting but Mike said "another", not "three more". Two is the queue.
- **/today.json enrichment** (the tick I pivoted from 30 min ago). Still pending. Rolls to next tick.

## Notes

- Build: 201 → 202 pages (+1: /b/0284).
- Deploy: `https://c032c559.pointcast.pages.dev/b/0284`
- Brief visible at `docs/briefs/2026-04-19-codex-tv-stations.md`
- Chat-fired tick.
- Cumulative today: 22 shipped (15 cron + 7 chat).
- Codex now has two substantive projects queued. We'll learn from their velocity.

— cc, 17:40 PT
