# Overnight sprint — front door alive, no dead ends

2026-06-10 ~23:45 PT · cc · Mike asleep, full merge+deploy rights, wrangler auth live

## How this sprint was chosen

Five research agents surveyed the vision corpus, the verified debt, live prod
(swept ~30 min after the june-refresh deploy), the parallel lanes, and the
return-loop inventory. Five candidate sprints were designed from different
lenses, then scored by a three-judge panel (Mike-taste, pragmatist, first-time
visitor). Two judges picked **Front door alive, no dead ends**; the pragmatist
picked **Night watch**. This plan is the winner plus the judges' grafts, with
their warnings encoded as rules. Salvaged research: `/tmp/research-salvage.json`.

The thesis: prod just woke up after 25 days. The next hundred visitors arrive at
a front door that finally works — and currently hit a hard 500 on `/api/recap`,
a DAO page announcing votes that "CLOSE" six weeks ago, an RSS feed frozen at
May 8, and a homepage with no reason to return tomorrow. Fix every dead end on
the first-visit arc, wire the smallest daily loop, land the heartbeat so the
town notices next time something goes stale.

All claims below were re-verified against live prod tonight before writing this
plan (recap 500 ✓, dao CLOSES ✓, rss frozen May 8 ✓, explore recent:[] ✓,
season2 commit 1bc53ab intact in /private/tmp/pointcast-season2 ✓).

## Rules (from the judges' warnings)

- **One owner of HomeProfessional.astro tonight** — all homepage edits ride in a
  single PR (item 7). No other item touches it.
- **Exactly one daySeed helper** — the /today stale-proofing ports
  `src/lib/daily.ts` logic into ONE shared client module with a fixed-date
  parity check; no divergent inline copies.
- **Season Two merges LAST** — push 1bc53ab as-is (preserve authorship), PR
  refs #731, merge after everything else so it can't race the night's PRs.
- **Small PRs, build:bare each, deploy in batches, prod-smoke after each
  deploy.** Stop-loss: if an item runs 2× its estimate, cut per the order below.

## The spine (must land, in order)

1. **`/api/recap` 500 → honest guard, un-break `/recap`** — root-cause the CF
   error (suspected unbound KV), return the standard kv-unbound 503 with a
   readable body, restore the `/recap/*` path. *Acceptance: curl returns non-500
   with useful body; /recap renders.*
2. **`/dao` honest archive state** — proposals past their close date render as
   ARCHIVE/CLOSED, not "CLOSES <date>". No live-vote theater. *Acceptance: prod
   /dao shows no future-tense close on past dates.*
3. **`/rss.xml` → 301 to `/feed.xml`** in `public/_redirects` (the frozen
   legacy generator retires; one feed, one truth). *Acceptance: curl -I shows
   301; feed.xml carries June items.*
4. **Stale-proof `/today`** — client-side date re-pick so a stale deploy can
   never freeze "today" again; single shared daySeed helper with parity test.
   *Acceptance: page renders tomorrow's content with system clock advanced.*
5. **De-conflict `public/_headers`** — kill the contradictory Cache-Control
   pairs on agent JSON surfaces. *Acceptance: curl -I shows one coherent
   Cache-Control per surface.*
6. **`explore.json` recent[] fix** — harden git-mtime extraction, loud fallback.
   *Acceptance: recent[] non-empty in built output.*
7. **Homepage daily strip (single homepage PR)** — re-hang the daily loop on
   HomeProfessional: today's drop + tomorrow tease ("come back tomorrow —
   № next, new cat, new song"). v2 grammar, one section, no creep.
   *Acceptance: strip renders desktop+mobile, links resolve, build clean.*
8. **Season Two first light (merge LAST)** — push existing commit 1bc53ab,
   PR refs #731, merge, dispatch the first heartbeat pulse.
   *Acceptance: heartbeat surface live on prod, #731 commented.*

## Stretch (only after the spine, in order)

9. PC_CAKE_KV binding — restore /api/sing + /api/cake (config-file change if
   Pages bindings are file-based; otherwise write Mike a one-step runbook).
10. `/commons` door v0 — timeboxed 2h, the May 2 spec's registry/ledger page;
    marine-layer stays deferred.
11. drum-academy lessons 7/8 forever-RAF loops (battery drain, punch-list P1).

## Deferred to morning, without guilt

Marine Layer room, PR #723 drumhouse review (not cc's to merge solo), the
visibilitychange audio-scheduler factory bake-in, cast-make-pro stem progress,
music-suite punch list remainder, Show HN (Mike's call), Coffee Mugs FA2
origination (Mike's keys).

## End of night

Block 0482 on the wire, morning report for Mike, final deploy + smoke, cc log
entry. Every merged PR deployed before sign-off — nothing half-shipped.

— cc, 2026-06-10 23:45 PT, El Segundo
