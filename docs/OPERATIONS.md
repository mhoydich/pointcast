# Operations — how work gets from an agent to pointcast.xyz

This is the current rulebook for Claude Code, Codex, and any other agent
working on PointCast, whether from Mike's iMac or from a cloud session. It
replaces older advice in `AGENTS.md` and `README.md` wherever they disagree.
Last revised 2026-11-11.

## 1. Work in a worktree, and remove it when the PR merges

On the iMac:

- Branch a worktree off a fresh `origin/main` under your home folder:
  `git -C ~/pointcast fetch origin && git -C ~/pointcast worktree add -b <agent>/<topic>-<date> ~/pc-<topic> origin/main`
- Never under `~/Documents` (iCloud evicts files, so reads hang and TCC blocks
  dev servers there), and never in a session scratchpad (it is wiped when the
  session ends).
- Never work in `~/pointcast` itself. It sits on a dead, divergent commit and
  other agents leave work in progress there.
- Copy `node_modules` rather than symlinking it, or Astro fails with
  "No cached compile metadata": `cp -c -R ~/pc-deploy/node_modules ~/pc-<topic>/`
  (an APFS clone, instant), then `npm install`.
- When your PR merges: `git -C ~/pointcast worktree remove ~/pc-<topic>`.
  A checkout costs 1.4G before node_modules (0.8G) and dist (1.8G). On
  2026-10-01, 21 merged-and-forgotten worktrees were holding ~30G.

In a cloud session:

- Work in a fresh clone or a new worktree off `origin/main`, never in a
  checkout another session left behind.
- Push a branch and open a PR. That is the whole path; CI does the rest.

## 2. Build only what you need to check

- `npm run build:bare` (plain astro build) is enough to prove a change compiles.
- Don't run the full `npm run build` just to verify; it regenerates every OG
  card. The GitHub deploy runs the full build.
- In a small cloud sandbox, don't run either build: the full build needs more
  than 8 GB. Run the focused tests and let CI's build be the proof.
- On the iMac, delete `dist/` when you are done with it.

## 3. Deploy: merge to main; GitHub builds, gates, uploads and smoke-tests

Every push to `main` runs the GitHub workflow "Deploy PointCast to Cloudflare
Pages" (`.github/workflows/cloudflare-pages.yml`). It builds the full site
(one retry on failure, for transient `api.tzkt.io` fetches), refuses to upload
a dist missing `/`, `/court`, or `/blocks.json` or holding fewer than 3,000
files, uploads with wrangler, then smoke-tests `/`, `/court/` and
`/blocks.json` on pointcast.xyz.

- **Live means that run is green.** A merged PR whose run is still going, or
  red, is not live. `npm run audit:publishing` lists merged blocks that the
  live site does not serve yet; run it before telling anyone a page is up.
- Watch it: `gh run list --workflow cloudflare-pages.yml --branch main --limit 3`
  (then `gh run watch <id>`). A newer push cancels an older run in progress,
  so the newest commit is the one that ships.
- Redeploy the same commit (for example after changing Pages secrets):
  `gh workflow run cloudflare-pages.yml --ref main`.
- When the run is red: read the failed step. A build or gate failure means
  nothing was uploaded and the previous deploy is still live; fix forward with
  a PR, or re-run if it was transient. A smoke failure means the upload
  happened; check the site at once. A "Not deployed" warning means the
  `CLOUDFLARE_API_TOKEN` secret is missing; tell Mike.
- **Fallback only:** if the run cannot go green soon, or GitHub is down,
  `scripts/deploy.sh --fallback` on the iMac builds `origin/main` in the shared
  `~/pc-deploy` worktree with the same gates and smoke test. It refuses to
  upload if main moved during its build, so it cannot roll back a newer
  GitHub deploy. Without `--fallback` the script only prints these
  instructions; `--dry-run` still builds and gates without deploying. Log:
  `~/Library/Logs/pointcast-deploy.log` (build output in `.log.build`).
- When newer main changes cannot yet pass review, a reviewed corrective commit
  can ship independently: `scripts/deploy.sh --fallback --release-sha=<full 40-character SHA>`.
  This exception requires the selected source and any deployment-script change
  to pass independent review and the user's publication authorization. It still
  fetches main, uses the same shared lock/worktree, and runs the complete build,
  integrity gates, upload, smoke checks, and live marker update. The pin must be
  an ancestor of freshly fetched main and a descendant of the previous live
  commit. Missing history, missing live marker, and rollback pins stop before
  checkout/build; `--force` does not bypass these ancestry checks. Its live
  marker does not know about GitHub's deploys, and the next push to main
  replaces the pin.
- `npm run publish:live` pushes to main; GitHub then deploys it.
- Workers in `workers/*` are not deployed by GitHub. They still deploy by
  hand: `npx wrangler deploy` in that folder, from a machine signed in to
  Cloudflare, which today means the iMac. Deploy them before merging pages
  that depend on them.
- Don't run `wrangler pages deploy` by hand. Every manual deploy from a
  worktree is how prod went backwards in September.

## 4. After the deploy

Walk the town and file the report in your next PR (see README, "After the
deploy: walk the town"): `npm run inspect:town -- --write`.

## 5. Disk (iMac)

`~/bin/pointcast-disk-sweep.sh` runs daily at 03:30. It strips node_modules
and dist from idle `~/pc-*` worktrees and gzips old Codex transcripts. It is
a backstop, not permission to leave things behind. Before ending a task,
remove what you created.
