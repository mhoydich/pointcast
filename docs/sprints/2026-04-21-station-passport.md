---
sprintId: station-passport
firedAt: 2026-04-21T10:38:00-07:00
trigger: chat
durationMin: 42
shippedAs: deploy:tbd
status: complete
---

# Station Passport

## What shipped

- Added `src/lib/passport.ts` as the Station Passport source of truth: El Segundo origin stamp plus the 15 existing `/tv` stations, each with action copy, proof cue, reward copy, colors, links, coordinates, daily-route support, and nearby-block matching.
- Added `/passport`, a browser-local stamp board with progress meter, daily four-stamp route, 16 stamp cards, localStorage persistence under `pc:station-passport:v1`, reset, JSON export, and a route rail.
- Added `/passport.json`, the agent mirror with totals, daily route, stamp metadata, nearby blocks, storage schema, and adjacent surface links.
- Wired discovery into `/local`, `/local.json`, home endpoint footer, `/collabs/map`, `/for-agents`, `/agents.json`, and the HUD drawer.
- Verified static build and preview routes.

## What didn't

- Did not add backend aggregation or wallet signing yet. v0 is intentionally localStorage-only.
- Did not add a TV slide insert yet. The JSON shape now makes that a small follow-up.

## Follow-ups

- Add a `/tv` station-challenge insert that pulls today's `/passport.json` route.
- Add optional wallet-signed stamp attestations for holders.
- Add DRUM or Visit Nouns yield hooks once the token path is live.

## Notes

Build result: `npm run build:bare` completed with 505 pages. Existing warnings remain: empty `products` / `projects` collections, Rollup chunk-size warnings, and Vite's existing `vm` browser-compat warning.
