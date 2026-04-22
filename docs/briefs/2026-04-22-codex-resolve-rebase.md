# Codex · codex-01 · Resolve in-flight rebase on feat/collab-clock

**Priority:** blocking. Nothing else on this branch can merge cleanly until this finishes.

## State right now

Interactive rebase in progress on `manus/collab-paths-2026-04-21`:

```
onto 1284328 (feat(manus): ship all seven collab paths)
Last command done: pick 016dc8b # feat(sparrow): v0.3 — PWA + offline
Next commands: 32 remaining (cac163b v0.4 → a139e59 v0.32, plus a v0.33 bundle)

Unmerged paths:
  deleted by us: src/layouts/SparrowLayout.astro
  deleted by us: src/pages/sparrow.json.ts
  deleted by us: src/pages/sparrow/about.astro

Staged (from the base):
  new file: public/sparrow/manifest.webmanifest
  new file: public/sparrow/sw.js
```

The "deleted by us" state means the base (`1284328`) has these three files in a shape that conflicts with the `016dc8b` sparrow-v0.3 diff. They exist in both, just differ.

The v0.4 → v0.33 sparrow work (33 commits) is queued to replay after this.

## What to do

You have three clean paths. Pick one and execute:

### Path A (recommended) — resolve in favor of the sparrow commits, continue

The sparrow commits are newer and the base's three files are from earlier. Accept the sparrow version for each conflict, stage, continue. Every subsequent sparrow commit should apply cleanly because they stack on top of v0.3.

```bash
# For each of the three conflicts:
git checkout --theirs src/layouts/SparrowLayout.astro
git checkout --theirs src/pages/sparrow.json.ts
git checkout --theirs src/pages/sparrow/about.astro
git add src/layouts/SparrowLayout.astro src/pages/sparrow.json.ts src/pages/sparrow/about.astro
git rebase --continue
```

Expect: most of the remaining 32 picks go through. Some may conflict on these same three files as later sparrow commits modify them; resolve consistently by preferring the later (sparrow) version each time.

### Path B — abort, then fast-forward squash

If path A hits too many cascading conflicts:

```bash
git rebase --abort
# You're back at the tip of manus/collab-paths-2026-04-21 before the rebase.
# Confirm the 33 sparrow commits are present: git log --oneline | head -40
# Then squash them into one commit:
git reset --soft <commit before first sparrow commit>
git commit -m "feat(sparrow): v0.4 → v0.33 · federation layer"
# Now rebase the single squashed commit onto 1284328:
git rebase 1284328
```

### Path C — cherry-pick individually

Slowest but surest. After `git rebase --abort`, cherry-pick each sparrow commit one by one onto `1284328`. Use this only if A and B both fail.

## Deliverables

1. Linear history from `1284328` through v0.33 at tip.
2. `git status` clean.
3. `npm run build` green (preserve the `DISABLE_V8_COMPILE_CACHE=1` workaround from session memory if the @tailwindcss/node prerender flake returns).
4. Push to `origin/feat/collab-clock`. Do **not** push to main.

## Appendix — what was in the 33 commits

Full list: `git log --all --oneline | grep "feat(sparrow): v0\."`. Key surfaces you'll see conflicts on:

- `src/layouts/SparrowLayout.astro` (every sprint touches this — wordmark bumps, HUD additions, script growth)
- `src/pages/sparrow.json.ts` (every sprint bumps version + adds sub-blocks)
- `src/pages/sparrow/about.astro` (kickers + feature cards + roadmap array)
- `public/sparrow/sw.js` (SW_VERSION + SHELL_URLS)

For every conflict on these four, prefer `--theirs` (the incoming sparrow commit). The base's versions are older.

## Done when

- `git log --oneline 1284328..HEAD` shows 33 sparrow commits in order.
- `git status` is clean.
- Build passes.
- Pushed to `origin/feat/collab-clock`.
- Update `docs/plans/2026-04-22-10-assignments.md` row for codex-01 to `shipped` with commit SHA.
