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

## PointCast Practice Desk 02

The PointCast-only v2 lives in `src/lib/pickleball-v2`. Its renderer inserts a
checked extension before the existing learning anchor; a changed shared anchor
fails the build for review. Do not edit the canonical RALLY mirror to update these
features. The separate RALLY deployment and shared version `1-9aa7f7903e25` stay
unchanged.

The planner covers 72 combinations of goal, duration, space and company. Compact
portable-net practice measures contact/control decisions; it does not stand in
for regulation-court depth or live four-player coverage. Two-person drills
distinguish feeder/hitter role swaps from imagined teammate decisions.

The scorecard accepts self-reported target counts, validates local calendar
dates and integer bounds, and caps the owned browser key at 100 entries. It
uses `pointcast:pickleball-scorecard:v2`, distinct from v1 lesson checkmarks.
It has no server API or account synchronization. JSON export is explicit; clear
requires an inline confirmation. Corrupt/blocked/quota-limited storage uses
visit memory with a visible limitation. Browser locks and a latest-state reread
reduce stale page writes; mount lifecycle guards cancel interrupted operations.

Both article HTML routes and their JSON twins are static. Original SVG
schematics, raster social twins and hashes are in
`public/images/pickleball-v2/provenance.json`. Source check dates are independent
of the court directory's existing dates. Content uses PointCast Editorial
attribution; existing layout author defaults are preserved.

Review checks:

```sh
node --test tests/pickleball-home.test.mjs tests/pickleball-v2*.test.mjs
node scripts/sync-pickleball-home.mjs --check
npm run build:bare
node scripts/audit-pickleball-v2.mjs
npm run audit:agents
npm run audit:publishing
```

The targeted `Pickleball v2 checks` PR workflow runs source behavior, mirror,
bare build and compiled discovery checks. Broader discovery tests must be
evaluated against current main; preserve other release lanes' additions during
rebase. Merge requires human approval of the reviewed head and the parent's
publication lane grant. Only then use the prescribed serialized deploy script.
