# Codex, GitHub, and Publishing Framework

Filed: 2026-04-22 PT
Scope: PointCast local workspace, GitHub repository, Codex app root, and live publishing path

## Current Audit

The correct active PointCast repo on this machine is:

```sh
/Users/michaelhoydich/pointcast
```

`/Users/michaelhoydich/Documents/join us yee` is Codex's older playground/scratch parent. It contains prototypes, package tarballs, independent repos, and extra PointCast worktrees. It is useful as an archive and prototype source, but it should not be the default project root for production PointCast work.

The active repo points at:

```sh
https://github.com/mhoydich/pointcast.git
```

At the time of this audit, the active checkout is on `cc/sprints-1-6-publish`, tracking `origin/cc/sprints-1-6-publish`. `origin/main` is the GitHub default branch, but it is behind the active sprint branch. Treat `main` as the production base and `cc/sprints-1-6-publish` as the current release train until Mike explicitly changes that.

## Known Roots

Use `npm run audit:publishing` for the live version of this inventory.

| Path | Role | Current meaning |
| --- | --- | --- |
| `/Users/michaelhoydich/pointcast` | Active repo | Main working repo for PointCast. Current branch: `cc/sprints-1-6-publish`. |
| `/Users/michaelhoydich/Documents/join us yee` | Scratch parent | Older Codex desktop playground. Do not use as the production project root. |
| `/Users/michaelhoydich/Documents/join us yee/pointcast` | Older checkout/worktree | Points to the same GitHub repo but is not the current active root. |
| `/Users/michaelhoydich/Documents/join us yee/pointcast-gandalf-push` | Feature worktree | `codex/sitting-with-gandalf`; connected to PR #4. |
| `/Users/michaelhoydich/Documents/join us yee/pointcast-houseplants` | Feature worktree | `houseplants-learning`; behind `origin/main`; has local changes. |
| `/Users/michaelhoydich/Documents/join us yee/pointcast-xyz` | Separate repo | Remote is `mhoydich/pointcast-xyz`; not the live `pointcast.xyz` source repo. |

## Authority Model

Codex can inspect, edit, test, and propose. Codex can commit, push, or publish only when Mike explicitly asks for that action in the current task or when a repo-owned automation states that action clearly.

Default behavior:

- Start in `/Users/michaelhoydich/pointcast`.
- Run `npm run audit:publishing` before GitHub or publishing work.
- Use branches and PRs for reviewable product changes.
- Use direct publish/push scripts only for explicit live publishes.
- Never publish from `join us yee`.
- Never publish from a dirty worktree whose changes are not understood.
- Never overwrite another agent's local changes to get a clean tree.

## Start-of-Session Checklist

Run these before PointCast GitHub or publishing work:

```sh
cd /Users/michaelhoydich/pointcast
npm run audit:publishing
git status --short --branch
```

Then read:

```sh
AGENTS.md
TASKS.md
docs/setup/codex-github-publishing.md
```

If the audit says the current root is not `/Users/michaelhoydich/pointcast`, stop and move to the active repo.

## Branch and Worktree Rules

Use this naming pattern for new Codex work:

```sh
codex/<short-feature-name>
```

Preferred local worktree root:

```sh
/Users/michaelhoydich/pointcast-worktrees/<short-feature-name>
```

Before creating a new worktree, check the current list:

```sh
git worktree list
```

After a branch is merged or abandoned:

```sh
git worktree remove <path>
git branch -d <branch>
git worktree prune
```

Do not remove a worktree with local changes unless Mike explicitly says those changes are disposable.

## Publishing Gate

A live publish requires all of these:

1. The intended checkout is `/Users/michaelhoydich/pointcast` or a clearly named release worktree.
2. `git status --short --branch` is understood.
3. `npm run audit:publishing` has no blocking `CHECK` items, except a known dirty tree that Mike has explicitly asked to publish.
4. The current HEAD includes `origin/main`.
5. `npm run build` passes.
6. Mike has explicitly approved pushing to GitHub or publishing live.

For Cloudflare-only Workers under `workers/`, follow the worker-specific `wrangler.toml` comments. The main Pages deploy does not automatically deploy every standalone Worker.

## PR Gate

Use a PR when any of these are true:

- The change spans multiple routes, content collections, workers, contracts, or publishing infrastructure.
- The change affects agent-readable endpoints, feeds, JSON-LD, SEO, wallet flows, or Tezos contracts.
- Another agent has touched the same surface recently.
- There is already an open PR in the same product lane.

PRs should name the authoring lane in plain language, include validation commands, and call out deployment steps that are not handled by Cloudflare Pages.

## Cleanup Plan

Near-term cleanup, in order:

1. Keep `/Users/michaelhoydich/pointcast` as the active repo.
2. Repoint saved Codex app workspace roots to `/Users/michaelhoydich/pointcast`.
3. Treat `join us yee` as prototype/archive space.
4. Review `pointcast-gandalf-push` against PR #4, then merge, close, or leave it as the active Gandalf branch.
5. Review `pointcast-houseplants`; it is behind and should not publish until rebased.
6. Remove stale `/private/tmp/pointcast-*` worktrees only after confirming they are clean or disposable.
