# Planning + Cleanup Sprint · 2026-05-03 → 2026-05-05

**Owner:** X · **Status:** proposed · **Trigger:** Mike asked for a planning, cleanup sprint after the PointCast / Claude / GitHub status review.

## Premise

PointCast has the right energy right now: Blocks, Tezos paths, agent surfaces, rooms, local-first collectibles, Cabinet, Observatory, Signal Garden, Morning Ocean, Zen Cats, and a growing app registry.

The problem is no longer idea supply. The problem is shape.

This sprint turns the current local worktree into a publishable, reviewable, coherent release plan. It favors inventory, sorting, verification, and small commits over new surface area.

## North Star

Make PointCast easier to operate.

By the end of the sprint, Mike should be able to answer three questions quickly:

1. What is safe to publish now?
2. What should stay local until cleaned up?
3. What work belongs in the next creative sprint?

## Constraints

- No five-app expansion during this sprint.
- No new wallet, referral, mint, or custody claims.
- Do not delete or revert unknown local work without an explicit Mike approval.
- Treat the dirty worktree as shared agent output until proven otherwise.
- Publish only from a complete build artifact and a deliberate commit.
- Keep the live `pointcast.xyz` marketplace and agent surfaces stable.

## Current Worktree Snapshot

As of this plan, local `main` has a large mixed worktree:

- Modified core files: README, BLOCKS, Astro config, package scripts, headers, robots, feeds, agent endpoints, SEO, styles.
- Modified surfaces: home, marketplace, wallet, mesh, pace, federation preview, Sparrow pages, bath recent.
- New local-first app layer: Cabinet, Observatory, Gallery Wall, Ritual Clock, Exchange Table, Provenance Ledger, World Atlas, Cat Passport, Signal Garden.
- New collectible paths: Morning Ocean, Zen Cats, Mint Studio, Harbor Log, Referral Garden, Sats Path.
- New money/runtime path: `/money`, `/money.json`, Link spend request scripts, tests.
- New Farcaster manifest route.
- New Sit worker/API path.
- Generated artifacts and build outputs present locally.

This is too much to publish as one blind push. It needs sorting.

## First Route Incident

Mike reported that `/cabinet` and related URLs were not working in the in-app browser.

Immediate finding on 2026-05-03:

- `http://127.0.0.1:4323/` was not serving the active repo.
- An older Astro dev process was running on port `4331` from `/private/tmp/pointcast-nouns-production-v38`.
- After starting the active repo on `4323`, the RC-A route smoke checks returned `200`.
- The active dev server also began watching generated `dist-cabinet-check/` files, confirming generated artifacts need to be moved out of the watched tree or ignored/cleaned.

This incident upgrades generated-artifact cleanup from nice-to-have to Day 1 priority.

## Release Candidates

### RC-A · Local Collection Layer

The most coherent publish bundle.

Includes:

- `/apps`
- `/cabinet`
- `/observatory`
- `/gallery-wall`
- `/ritual-clock`
- `/exchange-table`
- `/provenance-ledger`
- `/world-atlas`
- `/cat-passport`
- `/signal-garden`
- shared `MicroAppShell`
- shared collection/app registry updates
- home launch strip integration

Why it should lead:

- Local-only.
- No chain risk.
- Fits current PointCast thesis.
- Adds a navigable system around the recent creative work.

### RC-B · Art + Mintable Metadata Layer

Good candidate after RC-A.

Includes:

- `/zen-cats`
- `/zen-cats.json`
- `/morning-ocean`
- `/morning-ocean.json`
- `/mint-studio`
- `/harbor-log`
- image and metadata cleanup

Conditions:

- Images must load reliably in local and built HTML.
- Copy must say Tezos-ready or mint-pending unless a KT1 is actually live.
- Metadata should be exportable and stable.

### RC-C · Agent + Money Infrastructure

Powerful, but needs a careful review.

Includes:

- `/money`
- `/money.json`
- Link spend request scripts
- MCP function updates
- money runtime tests
- agent endpoint updates

Conditions:

- No implied investment returns.
- No spend automation without explicit user approval boundaries.
- Tests pass.
- Docs explain what is live versus experimental.

### RC-D · Sit / Presence Worker Layer

Keep separate.

Includes:

- `/sit`
- `functions/api/sit*`
- `workers/sit`
- durable object changes

Conditions:

- Worker config is reviewed.
- Cloudflare bindings are understood.
- Build and deploy path is clear.

## Day 1 · Inventory + Classification

### D1-1 · Create this cleanup plan

Outcome: `docs/plans/2026-05-03-planning-cleanup-sprint.md`.

### D1-2 · Worktree ownership table

Create `docs/notes/2026-05-03-worktree-inventory.md`.

For every modified or untracked path, classify:

- `ship-now`
- `hold`
- `generated`
- `needs-review`
- `unknown-owner`

Also assign likely bundle:

- `collection-layer`
- `art-metadata`
- `agent-money`
- `sit-worker`
- `core-site`
- `generated`

### D1-3 · Ignore generated noise

Review generated local artifacts:

- `.wrangler/`
- `_worker.bundle`
- `dist-cabinet-check/`
- `dist-release/`
- build outputs

Do not delete yet. Decide whether `.gitignore` should cover them, then make the smallest ignore-only patch.

### D1-4 · Confirm baseline checks

Run:

```sh
npm test
npm run build
```

Record:

- page count
- output directory
- warnings
- failures
- whether failures are unrelated to RC-A

## Day 2 · RC-A Hardening

### D2-1 · Route smoke checks

Dev-server 200 checks:

- `/apps/`
- `/cabinet/`
- `/observatory/`
- `/gallery-wall/`
- `/ritual-clock/`
- `/exchange-table/`
- `/provenance-ledger/`
- `/world-atlas/`
- `/cat-passport/`
- `/signal-garden/`

Content checks:

- `/apps/` contains `Signal Garden`
- `/cabinet/` contains `Signal Garden`
- `/observatory/` contains `Signal Garden`
- `/signal-garden/` contains `data-signal-garden`

### D2-2 · Browser pass

Use the in-app browser for:

- Empty localStorage state.
- One manual `Plant today` action in Signal Garden.
- Cabinet refresh after Signal Garden receipt.
- Observatory lens after Signal Garden receipt.
- Mobile-width visual sanity pass.

### D2-3 · Copy safety pass

Search RC-A pages for:

- ownership claims
- mint claims
- financial claims
- referral language
- wording that implies server persistence

Local-only surfaces should say local or browser-local where needed.

### D2-4 · Prepare RC-A commit candidate

Stage only RC-A files after inspection. Leave RC-B/C/D and unrelated core changes untouched unless required for RC-A.

Candidate commit:

```text
feat(apps): add local collection layer
```

## Day 3 · Publish Decision + Next Queue

### D3-1 · Publish gate

Publish only if all are true:

- `npm test` passes.
- `npm run build` completes.
- RC-A files are staged intentionally.
- Generated artifacts are excluded.
- No unrelated high-risk contract, worker, or money files are included.

If true:

```sh
npm run publish:live -- "feat(apps): add local collection layer"
```

If false, write a release note and stop before pushing.

### D3-2 · Next queue doc

Create `docs/notes/2026-05-05-next-creative-sprint-menu.md` with three ranked options:

1. Art Metadata Release: Morning Ocean + Zen Cats + Mint Studio.
2. Agent Money Review: Link spend receipts + `/money`.
3. Presence/Sit Worker Release: `/sit` plus worker bindings.

### D3-3 · GitHub cleanup pass

Recheck open PRs and update the April 28 triage with current status.

Do not close PRs automatically. Produce recommendations only.

## Definition Of Done

- Worktree inventory exists.
- Generated artifact policy is clear.
- RC-A is either published or explicitly held with reasons.
- Test/build status is recorded.
- Next creative sprint menu exists.
- Mike can see the difference between publishable product, experimental threads, and generated noise.

## What This Sprint Is Not

- Not a new app sprint.
- Not a Tezos origination sprint.
- Not a referral economics sprint.
- Not a full PR cleanup sprint.
- Not a rewrite of the homepage.

This sprint is the breath between ships: collect the threads, tie the ones that belong together, and leave the rest visible instead of tangled.
