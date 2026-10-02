# RALLY and the PointCast pickleball sister

RALLY is the primary home at `https://tez-rally.pages.dev/`. PointCast's sister is
`https://pointcast.xyz/pickleball/home`. The existing PointCast court board remains
at `/pickleball` with its original reporting and provenance behavior.

RALLY owns the plain ES-module renderer, stylesheet, interaction module, lesson
data, and verified directory in `tez-experiments/tez-rally/src/pickleball-home`.
PointCast keeps a build-time mirror at `src/lib/pickleball-home`; no cross-origin
runtime dependency is needed. Update the canonical RALLY files, run
`node scripts/version-pickleball-home.mjs` in `tez-rally` to refresh their
`shared-version.json` hashes, then run in PointCast:

```sh
node scripts/sync-pickleball-home.mjs --source /path/to/tez-rally/src/pickleball-home
node scripts/sync-pickleball-home.mjs --check --source /path/to/tez-rally/src/pickleball-home
node --test tests/pickleball-home.test.mjs
npm run build:bare
```

Each court carries its ownership, address, access terms, source URLs, checked date,
and uncertainty. This directory does not calculate availability or request a
visitor's location. Keep conflicting official pages visible, and recheck fees,
schedule, and access against the venue source when updating. The existing board
continues to own live player reports. Original practice prompts are distinct from
the linked official USA Pickleball rules.

Campaign and Nouns courtwear artwork is generated concept work with fictional
locations. The gallery displays that status and offers the supplied exact CC0
Nouns art and concept specification. `public/images/pickleball-home/assets.json`
records source and optimized-image hashes; `nouns-provenance.json` retains official
art provenance. No merch availability, third-party affiliation, account creation,
purchase, reservation, or wallet transaction was added by this page.

All existing paddle IDs, Court Blocks, games, RALLY crew tools, and board routes
remain. Two retired instruction URLs redirect to the new hub's learning/gear
sections. Standard deployment remains `scripts/deploy.sh` after reviewed PR merge;
coordinate the single publisher with the active release lane.
