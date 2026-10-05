# Operations — how work gets from an agent to pointcast.xyz

This is the current rulebook for Claude Code, Codex, and any other agent
working on PointCast from Mike's iMac. It replaces older advice in
`AGENTS.md` and `README.md` wherever they disagree. Last revised 2026-10-01.

## 1. Work in a worktree, and remove it when the PR merges

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

## 2. Build only what you need to check

- `npm run build:bare` (plain astro build) is enough to prove a change compiles.
- Don't run the full `npm run build` just to verify; it regenerates every OG
  card. The deploy script runs the full build.
- Delete `dist/` when you are done with it.

## 3. Deploy: one script, origin/main by default

```sh
scripts/deploy.sh             # build + deploy origin/main, skips if it's already live
scripts/deploy.sh --dry-run   # build and gate, don't deploy
scripts/deploy.sh --force     # redeploy the same sha
```

- Merge your PR first. The script deploys the tip of `origin/main` from the
  shared `~/pc-deploy` worktree, never from your checkout, so a deploy can't
  roll back work that merged after your branch was cut.
- Run it from any worktree. Concurrent callers queue on one lock. If main is
  already live, it exits in a second, so calling it after every merge is fine.
- Gates: a failed build retries once (transient `api.tzkt.io` fetches), then
  stops. A dist missing `/`, `/court`, or `/blocks.json`, or one with fewer
  than 3,000 files, is never uploaded. After upload it smoke-tests prod.
- Log: `~/Library/Logs/pointcast-deploy.log` (build output in `.log.build`).
- `npm run publish:live` pushes to main and then calls this script
  (`--no-deploy` to skip it).
- When newer main changes cannot yet pass review, a reviewed corrective commit
  can ship independently: `scripts/deploy.sh --release-sha=<full 40-character SHA>`.
  This exception requires the selected source and any deployment-script change
  to pass independent review and the user's publication authorization. It still
  fetches main, uses the same shared lock/worktree, and runs the complete build,
  integrity gates, upload, smoke checks, and live marker update. The pin must be
  an ancestor of freshly fetched main and a descendant of the previous live
  commit. Missing history, missing live marker, and rollback pins stop before
  checkout/build; `--force` does not bypass these ancestry checks.
- Workers in `workers/*` deploy separately: `npx wrangler deploy` in that
  folder, before the Pages deploy if the pages depend on them.
- Don't run `wrangler pages deploy` by hand. Every manual deploy from a
  worktree is how prod went backwards in September.

## 4. After the deploy

Walk the town and file the report in your next PR (see README, "After the
deploy: walk the town"): `npm run inspect:town -- --write`.

## 5. Disk

`~/bin/pointcast-disk-sweep.sh` runs daily at 03:30. It strips node_modules
and dist from idle `~/pc-*` worktrees and gzips old Codex transcripts. It is
a backstop, not permission to leave things behind. Before ending a task,
remove what you created.
