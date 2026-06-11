# June refresh sprint — wake the front door

2026-06-10 · cc · branch `feat/2026-06-10-june-refresh`

## Where we are

The May 31 inflection (#722) settled the homepage question: the Bloomberg-terminal
professional register won, the pixel-art candidates were archived at `/window-home`
and `/visit`, and the front door finally matches BLOCKS.md. Right call. Keep it.

But three things went stale at once, and together they make the site read as asleep:

1. **Prod hasn't deployed since May 16.** The wrangler OAuth token expired that day
   and the GitHub→Pages webhook has been down since April. The live site is ~25 days
   and ~500 commits behind main. Visitors see a block count of 254 when main has 255+,
   and none of the May work (rooms federation, shrines, music hub, the new homepage
   itself) is live.
2. **The homepage's freshness signals broke.** `SHIPS · 7 DAYS` reads from
   hand-curated `src/data/recent-ships.json`, last updated May 9 — so the status bar
   says **0 ships** while the repo runs 10+ commits a day. The residents card
   hardcodes "Four AI agents build here." The latest-blocks band ends at block 0480
   (May 16). A professional homepage that under-reports its own momentum is worse
   than a cozy one that doesn't try.
3. **The town outgrew its doors.** ~700 routes, 6 room cards, one footer. Music hub,
   36 cast spells, 70+ drum surfaces, six shrines, the battler complex, federation,
   webring — none reachable from the front door. The sprawl is real depth, but
   undiscoverable depth reads as absence.

## What this sprint ships

1. **Live ships counter** — `SHIPS · 7 DAYS` derived from git merge history at build
   time (`src/lib/ships.ts`), falling back to `recent-ships.json` if git is
   unavailable. The number is true on every deploy with zero hand-curation.
2. **Residents line from source of truth** — room card text computed from
   `src/data/residents.ts` statuses, so seats open/filled never drifts.
3. **`/directory` — the town directory.** One page, v2 grammar, every door worth
   walking through grouped and labeled: core rooms, music, drums & shrines, games,
   battler, money & chain, federation, machine surfaces, and a history shelf (the
   old homepages stay reachable — nothing is deleted, everything is organized).
   Backed by `src/data/directory.ts` as the single source of truth. Linked from the
   homepage rooms band ("FULL DIRECTORY →") and the footer.
4. **Grammar polish** — status-cell and room-card borders to 1.5px per BLOCKS.md,
   10px mono floor on small screens (9.5px fails comfortably-readable on phones).
5. **Block 0481** — a wire block announcing the refresh, so LATEST FROM THE
   BROADCAST shows June, not May.

## What this sprint defers

- YeePlayer, DAO voting, yield drip, Wire Attestations — engagement-layer threads,
  unchanged from the v3 strategy queue.
- The music-suite punch lists (2026-05-10 / 2026-05-11 audits) — real bugs, separate
  PR lane.
- 301-ing the drum-v2…v18 and cast-* graveyards — the directory makes them
  discoverable-on-purpose instead; redirects can come later if Mike wants them gone.

## Needs Mike's hand

- **Deploy auth**: `npx wrangler login` → click Allow. One minute. Until then,
  every merge stacks behind a door nobody can open.
- The standing items: Coffee Mugs FA2 origination, Show HN timing, RFC 0003
  decisions.

— cc, 2026-06-10, El Segundo
