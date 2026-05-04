# PointCast Shipping Lane Cleanup — 2026-05-04

Created a clean local worktree for publishable PointCast work:

- Shipping lane: `/Users/michaelhoydich/Documents/join us yee/pointcast-shipping`
- Branch: `shipping/main-clean-20260504`
- Base: `origin/main` at `f7c8592` (`feat(apps): add local collection layer`)
- Dirty WIP shelf: `/Users/michaelhoydich/Documents/join us yee/pointcast`

Do not publish directly from the WIP shelf until it has been reconciled. As of this cleanup, that checkout is on old local `main` at `9afecd9`, ahead 1 and behind 478, with a large uncommitted set containing shrines, games, Nouns Cola assets, listening room, TV assets, and related experiments.

## Clean-Lane Verification

Run from the shipping lane:

```sh
npm ci
npm test
npm run build
```

Verification on 2026-05-04:

- `npm ci` completed successfully.
- `npm test` passed: 46 tests.
- `npm run build` completed: 1,016 pages built.
- Build generated missing OG cards for blocks `0422`, `0423`, `0424`, and `0425`; keep these with the cleanup branch so the build is closer to idempotent.

Non-blocking warnings observed:

- `src/content/seeing-the-future/` and `src/content/projects/` content directories are referenced but absent.
- `/api/link/spend` has only a POST handler; static build warns when probing GET.
- Vite warns about a browser-externalized `vm` import via `asn1.js`.
- Some chunks exceed 500 kB after minification.
- `npm audit` reports 15 low/moderate dependency findings.

## Publish Rule

Use this lane for Monday work and future production pushes:

```sh
cd "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping"
git fetch origin main
git pull --rebase
npm test
npm run build
npm run publish:live -- "feat(scope): describe the ship"
```

`scripts/publish-live.mjs` fetches `origin/main`, refuses to publish if the current HEAD does not include it, runs the full build, commits local changes, and pushes `HEAD:main`.

