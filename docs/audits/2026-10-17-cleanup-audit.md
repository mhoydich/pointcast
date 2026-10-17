# Cleanup audit — repo hygiene under load (2026-10-17)

Asked for: a cleanup and optimization pass that holds up while Claude Code,
Codex, Manus and Mike all have work in flight (about twenty merges to `main`
a day). This records what was found, what shipped in PR #1419, and what is
left for Mike. Numbers are as of 2026-10-17 22:00 UTC.

Companion files in this folder:

- `2026-10-17-branch-prune-plan.tsv` — every origin branch with the class and
  action `scripts/prune-branches.mjs` assigns it (dry run, default policy).
- `2026-10-17-branch-triage.tsv` — the 209 branches that are not a clean
  merge, each compared against `main` and given a delete/review verdict with
  a one-line description of what is on it.

## 1. Branches: 1,173 on origin, 18 open PRs

Root cause: the repository setting *Automatically delete head branches* is
off, and nobody deletes by hand. 266 branches were deleted manually at some
point; the other 1,155 finished branches stayed.

| class | count | meaning | default action |
| --- | ---: | --- | --- |
| merged | 942 | a PR merged into `main` and its merged head sha is the branch tip | delete |
| closed-unmerged | 149 | every PR from the branch was closed without merging | keep unless `--include-closed` |
| orphan | 54 | no PR was ever opened (52 idle 30+ days, 2 recent) | keep unless `--include-orphans` |
| merged-tip-moved | 8 | PR merged, then more commits were pushed | always a human look |
| merged-elsewhere | 1 | PR merged into another feature branch, not `main` | keep unless `--include-elsewhere` |
| open-pr | 18 | | keep |
| protected | 1 | `main` | keep |

Verification of the 942:

- The tip sha of each equals the `head.sha` GitHub recorded for its merged PR,
  and that PR's base is `main`. 142 of them (every 20th, three offsets) were
  re-read from the API one by one: PR exists, merged, base `main`, head ref
  and sha match. Zero anomalies.
- A second, independent classification (the scout pass that preceded the
  script) agreed on every branch.

The 209 that are not a clean merge were each compared against `main` with
the GitHub compare API and read by an agent (`2026-10-17-branch-triage.tsv`):

- 188 are safe to delete: tips already in `main`, duplicates of commits that
  landed through another PR, superseded experiments, or content `main`
  later removed on purpose.
- 21 carry unmerged work that only exists on that branch. The larger ones:
  the daily email scheduler worker (`codex/nouns-open-circuit-v2`, ~1.8k
  lines), two `/mist` Ethereum room builds (`feat/mist-room-cc-2026-05-08`,
  `codex/wire-attestations-review-2026-05-08`), the Bell Labs paper
  `feat/sports-ticker` that `main` still marks forthcoming, the Kettle
  SmartPy contract (`kettle-contract`), Bloom Party (`claude/tone-bloom-...`),
  the Agent-Web Observatory (`claude/white-spaces-...`), Civic Packet Watch,
  Polygon Bell, `/saturday`, `/halation`, `/sit` presence, `/dotpath`, the
  Qwen Tan River study, and three small ones: the `/this-is-it` OG card
  (2 files, never PR'd), 50 lines of CSS for `/here`'s footprint card, and an
  unpublished Shopify SEO post. None of these are deleted by the default
  policy; they are listed so Mike can decide to land, archive, or drop them.

What shipped: `scripts/prune-branches.mjs` (dry run by default; see
`docs/OPERATIONS.md` §6). It did not delete anything. The one command that
will, once approved: `npm run prune:branches -- --delete`.

## 2. Tracked files that were not source

Removed in PR #1419 (history keeps them):

- 12 `*.dataless.bak-20260516*` copies next to their live files, in
  `functions/api`, `src/pages`, `workers/*`, and the root `wrangler.toml`.
- `public/favicon.ico.bak-antrope-a` (the inventory doc already flagged it).
- `tmp/imagegen/buddha-heads-gpt-image-2.jsonl`, referenced by nothing.
- 11 macOS Finder duplicates `public/images/og/<name> 2.png`, byte-identical
  to `<name>.png` and referenced by nothing.

`.gitignore` now covers `*.bak`, `*.bak-*`, `*.orig`, `*.rej`, `*~`, and
`tmp/`.

Left for a human: six `src/components/<Name> 2.astro` Finder forks
(`DrumNav`, `HomeFireplace`, `NatureFieldDeskStrip`, `NounsWoodChopStrip`,
`SpotifyEmbed`, `WingPulseModule`). Each differs from its sibling by
hundreds of lines and nothing imports them; they look like pre-refactor
copies. Diff, then delete.

## 3. Disk on the iMac

`docs/OPERATIONS.md` already describes the daily sweep at
`~/bin/pointcast-disk-sweep.sh`, but the script was not in the repo.
`scripts/disk-sweep.sh` is now the canonical copy (install line in §5). It
strips `node_modules`, `dist`, `dist.stale-*`, `.astro`, and nested
`workers/*/node_modules` from idle worktrees, reports `.pointcast/` and
`.wrangler/` sizes without touching them, and with `--remove-merged` removes
idle, clean, fully pushed worktrees whose PR merged. It never touches
`~/pc-deploy`, the main checkout, dirty trees, unpushed commits, or a
directory a process is standing in. Dry run by default.

Repository weight that no sweep fixes: the pack is 2.26 GiB (GitHub's own
size figure) and `public/` is 1.8 G of tracked binaries, led by
`public/downloads` (286 M of zips and PDFs) and `public/images/nouns-money`
(248 M). Moving those to Git LFS or external hosting is a Mike decision;
nothing here changes it. One tracked download,
`public/downloads/noggle-reserve-ten-authentic-nouns-prototypes.zip`
(2.2 M), is linked from nowhere.

## 4. CI under heavy activity

Measured over the last 30 days:

| workflow | runs | note |
| --- | ---: | --- |
| Deploy PointCast to Cloudflare Pages | 170 | 5.6 min average; 60 cancelled by cancel-in-progress; deploy step skipped on every run |

- `cloudflare-pages.yml` runs a full `npm run build` on every push to `main`
  and then skips its deploy step because `CLOUDFLARE_API_TOKEN` is not set;
  `scripts/deploy.sh` is the one deploy path. Its name and header still say
  it is the auto-deploy. Options for Mike (TASKS.md): rename it and switch
  the step to `build:bare` as a compile check, strip the deploy step so the
  token can never make it a second deployer, or remove it. A `docs/**`
  paths-ignore would save nothing: none of the last 100 pushes were docs-only.
- Shipped: the two push triggers pinned to branches that merged on
  2026-10-06 are gone; `next-models-pages.yml` gets `timeout-minutes` (it
  was the only workflow without one, so a hung build could hold a runner for
  six hours).
- Everything else checks out: all 17 workflows have concurrency groups,
  the PR checks have path filters, `npm ci` steps use the npm cache and take
  15–24 s. `claude.yml` is triggered by every comment but skips in under a
  second when `@claude` is absent; nothing to gain there.
- A ghost: GitHub lists `.github/workflows/agent-guide-artifact.yml` as an
  active workflow, but the file exists on no branch. Disable it from Settings
  → Actions when the branch setting is changed.

## 5. Other findings, not changed here

Each is small, reversible, and a candidate for its own PR.

- `@x402/svm` is a dependency nothing imports (every other `@x402/*` has
  importers). Removing it drops about 112 M from every `node_modules`
  (`npm uninstall @x402/svm`). Wallet-adjacent, so Codex review.
- `@lancedb/lancedb` (239 M, the largest package) and `umap-js` are loaded
  only by `scripts/lib/oracle-rag.mjs`, which already handles their
  absence. Moving them to `optionalDependencies` lets `~/pc-deploy`, CI, and
  agents run `npm ci --omit=optional`.
- `scripts/post-mainnet-auto.sh` still runs `npx wrangler pages deploy`
  from whatever checkout it sits in, and two scripts print that command as
  a next step. OPERATIONS.md forbids it. Archive or delete the first; point
  the hints at `scripts/deploy.sh`.
- `npm run publish:live` does `git add -A`, commits, and pushes `HEAD:main`,
  which CLAUDE.md and `docs/setup/agent-bridge.md` tell agents never to do.
  Either document it as Mike-only or make the script refuse on `main`.
- 16 docs still prescribe the manual `wrangler pages deploy` procedure; the
  three a new agent is likely to read as current
  (`docs/standards/2026-05-06-current-best-practices.md` and two runbooks)
  need a one-line "superseded by OPERATIONS.md §3" banner.
- 28 files under `scripts/` are referenced by nothing (no package.json
  entry, doc, workflow, or import). A `scripts/README.md` table or a
  `scripts/archive/` move would shrink the 169-entry listing.
- 32 of 477 tests read `dist/`; six throw at import time when it is absent,
  so `npm test` depends on a prior build. Guard them with `existsSync` +
  `t.skip` (the pattern `tests/x402.test.mjs` already uses).
- Two byte-identical image pairs are both referenced on purpose
  (`pointcast-focus/social-card{,-v2}.png`, `sunset-switchboard/og.png` in
  `src/assets` and `public`); left alone.
- Five `.gitkeep` files sit in directories that have other tracked files.
  Harmless.

## 6. What this session did not do

- Delete any remote branch. The plan is in this folder; the deletion is one
  approved command.
- Change any GitHub repository setting.
- Touch Mike's iMac. The sweep is in the repo; installing it is a one-line
  handoff in TASKS.md.
- Run `scripts/deploy.sh` or any publish path.
