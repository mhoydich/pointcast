# Operations — how work gets from an agent to pointcast.xyz

This is the current rulebook for Claude Code, Codex, and any other agent
working on PointCast from Mike's iMac. It replaces older advice in
`AGENTS.md` and `README.md` wherever they disagree. Last revised 2026-10-17.

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

The sweep lives in the repo as `scripts/disk-sweep.sh` and runs daily at
03:30 on the iMac as `~/bin/pointcast-disk-sweep.sh` (install:
`ln -sf ~/pointcast/scripts/disk-sweep.sh ~/bin/pointcast-disk-sweep.sh`).

```sh
scripts/disk-sweep.sh                         # dry run: what would go
scripts/disk-sweep.sh --apply                 # strip node_modules, dist, dist.stale-*, .astro from idle ~/pc-* worktrees
scripts/disk-sweep.sh --apply --remove-merged # also remove idle, clean, pushed worktrees whose PR merged
```

A worktree is idle when nothing outside node_modules/dist/.git changed in the
last 24 hours (`--idle-hours=N`) and no process is standing in it. It never
touches `~/pc-deploy`, the main checkout, a dirty tree, or unpushed commits,
so it is safe while other agents are mid-task; everything it removes is
either rebuildable or already on origin. It is a backstop, not permission to
leave things behind. Before ending a task, remove what you created.

## 6. Branches: delete yours when the PR merges

GitHub does not delete head branches on merge for this repo. By 2026-10-17
origin carried 1,173 branches for 18 open PRs, and every fetch and
`worktree add` paid for the rest.

- After your PR merges: `git push origin --delete <branch>` (or the "Delete
  branch" button on the PR). Removing the worktree (§1) does not remove the
  branch.
- Periodic sweep: `npm run prune:branches` is a dry run that classifies every
  origin branch by its PR record and prints the plan; add `--report=path.tsv`
  to keep it. `--delete` removes only the `merged` class: a PR merged into
  main whose merged head sha is exactly the branch tip, nothing in the last
  24 hours (`--grace`), and nothing checked out in a local worktree. Branches
  whose PRs were all closed unmerged, or that never had a PR, need
  `--include-closed` / `--include-orphans` plus `--older-than=<days>`
  (default 30). A branch whose tip moved after its merge is always listed for
  a human and never auto-deleted.
- Right before deleting, the script re-reads origin and the open-PR list and
  skips anything that moved or gained a PR since the plan was made. Every
  deletion is logged with its sha in `~/.pointcast-prune.log`; restore one
  with `git push origin <sha>:refs/heads/<name>`, or "Restore branch" on the
  merged PR.
- Once branches are gone from origin, every clone still carries their
  `refs/remotes/origin/*` until it prunes. Run `git config --global
  fetch.prune true` once; `npm run prune:branches -- --delete` also prunes
  the checkout it ran from.
- The real fix is the repository setting *Automatically delete head branches*
  (Settings → General → Pull Requests). Turning it on is Mike's call.
