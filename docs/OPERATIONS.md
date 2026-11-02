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
- Merged is not live. The GitHub workflow "Deploy PointCast to Cloudflare
  Pages" builds every push to main but skips its deploy step until the
  `CLOUDFLARE_API_TOKEN` repo secret exists, so a green run does not mean the
  site changed. `npm run audit:publishing` lists merged blocks that are not
  live yet; run it before telling anyone a page is up.
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

## 3b. The cloud path: merge and deploy without the Mac

Added 2026-11-02 so publishing doesn't wait on anyone being at the iMac.

- **Merge.** `.github/workflows/ship.yml` merges a PR to main when it has what
  section "Merge to main" in AGENTS.md asks for: Codex's review and Mike's okay.
  - Codex review: the Codex GitHub reviewer (`chatgpt-codex-connector[bot]`)
    reviewed the exact head commit and flagged nothing at P0/P1, or commented
    that it found no major issues after that commit. Ask for one with a
    `@codex review` comment, or turn on automatic reviews in Codex.
  - Mike's okay: the `ship` label. Add it only when Mike has said to publish in
    his own words, and quote him in the PR body. `hold` (or `Publish: hold` in
    the body) keeps a PR open.
  - Every check on the head commit green. It merges that exact head with a
    merge commit, and sweeps PRs labeled `ship` every 30 minutes.
- **Deploy.** Every push to main, and every merge the ship workflow makes,
  runs "Deploy PointCast to Cloudflare Pages". It does what `scripts/deploy.sh`
  does: one deploy at a time, build retried once, the same dist gates, upload
  only if the commit is still the tip of main, then the same smoke test. It
  needs the `CLOUDFLARE_API_TOKEN` repo secret; until that exists it builds and
  says "Not deployed".
- `scripts/deploy.sh` still works as the manual fallback. Workers under
  `workers/` still deploy by hand.
- Check what merged but isn't live with `npm run audit:publishing`.

## 4. After the deploy

Walk the town and file the report in your next PR (see README, "After the
deploy: walk the town"): `npm run inspect:town -- --write`.

## 5. Disk

`~/bin/pointcast-disk-sweep.sh` runs daily at 03:30. It strips node_modules
and dist from idle `~/pc-*` worktrees and gzips old Codex transcripts. It is
a backstop, not permission to leave things behind. Before ending a task,
remove what you created.
