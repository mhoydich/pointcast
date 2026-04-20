---
sprintId: monday-home-clients-fieldnode
firedAt: 2026-04-20T12:25:00-08:00
trigger: chat
durationMin: 25
shippedAs: deploy:74b1b397
status: complete
---

# chat tick — Monday home strip + /collabs Clients section + Field Node brief

## What shipped

Mike 2026-04-20 12:20 PT mandate (signed "michael hoydich 4/20/2026"): *"on homepage, it should likely be all the interesting things we were talking about today from clock to bitcoin, to 420, to feature updates, to things to try, to learnings, to how to learn, to entertainment, kinda thing, and very monday stuffs as, today is monday · and what's the client model for pointcast, on the collabs page, have a neat area on how to build a client, maybe even outline 5 client types to build almost as a task."*

Plus he shared a full Magpie/Field Node PRD from a ChatGPT session — the macOS clipboard-intelligence client concept. That became a formal brief.

### Files shipped

- **`src/components/TodayOnPointCast.astro`** (new, ~190 lines) — curated "today's highlights" strip on home. Six stops in an auto-fit grid: (01) Happy 4/20 → /b/0328, (02) BTC at $75K → /b/0329, (03) Presence DO online → /b/0327, (04) Collab clock → /clock/0324, (05) AI landscape → /b/0325, (06) Start tour → /start. Timestamped "Monday, April 20 · El Segundo" header. Each stop has kicker/title/dek/arrow. Footer row links /workbench + /here + /for-nodes.
- **`src/pages/index.astro`** — renders TodayOnPointCast between NetworkStrip and MoodChip.
- **`src/pages/collabs/index.astro`** — new "BUILD A CLIENT" section with 5 client type cards + matching styles. Each card is a real task someone could claim:
  - **Type 1: macOS Field Node** — clipboard intelligence, local-first, forwards to /api/drop.
  - **Type 2: Apple TV ambient** — tvOS renders /tv full-screen for cafe/home display.
  - **Type 3: iOS companion** — phone next to the feed, real GPS for "where", native pickers.
  - **Type 4: Browser extension** — toolbar "Drop this" + "Broadcast session as agent."
  - **Type 5: CLI terminal node** — `pointcast` binary, drop / ping / presence / blocks-tail subcommands.
- **`docs/briefs/2026-04-20-field-node-client.md`** (new, ~180 lines) — full brief adapted from Mike's ChatGPT PRD. Architecture (Swift + SwiftUI + SQLite + GRDB/FTS5), data model (events + artifacts + sessions + action_candidates), scoring model, phased deliverables (MVP → Intelligence → Node), PointCast client contract (POST /api/drop + WS to /api/presence), open questions. Ready for claim via /ping or PR.

### Deploy + verification

- Build: 248 pages clean.
- Deploy: `https://74b1b397.pointcast.pages.dev` → pointcast.xyz live on main branch.
- Homepage: TodayOnPointCast strip visible between NetworkStrip and MoodChip. All six stops render with proper kickers.
- /collabs: Clients section visible between federation spec + talk-to-us. All 5 client types render.
- curl checks: all 6 home stops + all 5 client cards present in live HTML.

## Editorial note on the curation

TodayOnPointCast is deliberately hand-curated, not auto-picked. It's Mike's directive: the homepage should feel like today. FreshDeck handles the random-3-from-archive role; FreshStrip handles the time-since-last-visit signal; TodayOnPointCast handles "what was the shape of Monday, April 20, 2026 on PointCast."

The six stops chosen span the six Mike-named themes: entertainment (4/20), market/world (BTC), feature updates (presence live), clock/calendar (collab clock), learnings (AI landscape), things to try (/start tour). No stop is older than this morning. When the curation drifts out of date, the strip updates via a new deploy — editorial cadence, not algorithmic.

## Why the clients section matters

Until today, the "how to plug in" path on PointCast was federation (run your own site + expose a feed) or guest blocks (write for Mike's editorial). Neither captures the emerging opportunity: *build a client app against the PointCast APIs.* The backend is real now — presence DO bound, drop/ping/queue endpoints live, agents.json + for-nodes documenting the surface. The five client types make this concrete: each is a discrete contribution opportunity, each ~1-3 weeks of focused work, each extends PointCast's reach into a surface (macOS, TV, phone, browser, terminal) the web can't reach alone.

Field Node specifically is the first real task of the five. It has a full PRD (via Mike's ChatGPT session), a clear user (clipboard-heavy researchers/founders/developers), real existing code to learn from (Magpie's open-source release pipeline), and a clean PointCast client contract. If Mike or a contributor picks it up, it's the first native-app node on the network.

## Observations

- **cc shipped solo this tick** — no Codex MCP calls needed. All the work was UI/editorial/docs, cc's wheelhouse. When Codex is the right tool (atomic backend refactor), fire in parallel; when cc is the right tool (curation + prose + page structure), ship direct.
- **The /collabs page keeps growing into a proper "how to be a PointCast participant" manual** — contribute paths + federation + nodes registry + now clients. Worth a tick someday to TOC it so visitors can jump straight to the path that fits.
- **Mike's signoff "signed michael hoydich 4/20/2026"** is a small ceremonial beat I want to preserve in the commit message — it's the kind of honest ledger moment that makes the retros re-readable later.

## What didn't

- **A block about the client model** (positioning PointCast as a backend) — deferred. Today's editorial load is full; this can be a next-tick editorial beat.
- **Actually start Field Node** — the brief is the deliverable this tick, not the implementation.
- **Commit hygiene on the ~6 additional files that landed since the last commit pass** — handled inline this tick in one clean commit.

## Notes

- Build: 248 pages (unchanged — TodayOnPointCast is a component not a new route, /collabs got section not new route, brief doesn't build a route).
- Deploy: `https://74b1b397.pointcast.pages.dev/` → pointcast.xyz.
- Files new: 3 (TodayOnPointCast.astro, field-node brief, this retro).
- Files modified: 2 (index.astro, collabs/index.astro).
- Cumulative: **53 shipped** (28 cron + 25 chat this session).
- Signed: Mike, 4/20/2026. Ceremonial ack noted.

— cc, 12:40 PT (2026-04-20) · Monday, happy 4/20, pour one for the Waldos
