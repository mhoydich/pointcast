# Gamgee Release Inventory

Date: 2026-04-23

This is the first-pass inventory for the dirty release train at
`/Users/michaelhoydich/pointcast` on `cc/sprints-1-6-publish`.

This file is not an approval to merge the train. It is a sorting map for
turning a large local sprint pile into small Gamgee pull requests.

## Source State

- Clean release base: `origin/main`, via the Gamgee RC0 docs merged in PR #10.
- Dirty release train: `cc/sprints-1-6-publish`.
- Commit distance: 66 commits ahead of `main`.
- Branch diff scale: 638 files, roughly +85,069 / -837.
- Uncommitted train state: 61 tracked files modified plus about 313 untracked
  paths, for 374 `git status --short` lines.
- Working-tree diff scale: roughly +4,331 / -1,190 staged or unstaged.

Inventory rule: do not import from the dirty train by commit. Split by surface,
then choose the smallest product-safe slice.

## Gamgee Now

These items fit the Gamgee thesis: a public, agent-native PointCast release with
human pages, machine-readable surfaces, and a visible build ledger.

### Agent And Machine Surfaces

- `/agents.json`, `/for-agents`, `/llms.txt`, `/llms-full.txt`, feeds, editions,
  local JSON, AI stack JSON, and sitemap-like surfaces.
- The dirty train has a known duplicate `share` key in
  `src/pages/agents.json.ts` around the human and JSON endpoint arrays. That
  should be fixed only when the agent-surface slice is ported.
- The dirty train contains `scripts/audit-publishing.mjs`, while the clean
  Gamgee worktree does not. Since `CLAUDE.md` references the audit script, this
  should either be ported or the reference should be corrected.

### Public Front Door

- Homepage path tightening, `/now`, Show HN draft, press kit material, and the
  clearest "what PointCast is" pages.
- Keep this narrow: ship one coherent public path before importing the larger
  page set.

### Launch Content

- Selected content blocks that directly explain the release story, such as
  houseplant field school, homepage ping block, ramen/STRAND, and sprint
  primitive blocks.
- New block ranges around `0331` through `0400` should be treated as a content
  bundle, not mixed into infrastructure PRs.

### Build Ledger

- Existing Gamgee docs, agent bridge docs, sprint notes, Manus logs, and Claude
  logs.
- Keep the release ledger in docs so Mike can see what agents did and what is
  still undecided.

## Later

These look valuable, but they are too large or too cross-cutting for the first
Gamgee release candidate.

### Sparrow Federation

- Sparrow v0.2 through v0.35, Nostr client, Magpie bridge, peer-node mirror,
  digest worker, friends/profiles, HMAC unsubscribe, and `/magpie`.
- This looks like a serious product direction. It should become Gamgee 1.1 or a
  dedicated RFC track unless Mike explicitly pulls it into RC1.

### New Public Page Families

- `agent-native`, `analytics`, `bath`, `blocks`, `cadence`, `cards`,
  `commercials`, `compute`, `cos`, `decks`, `drum`, `el-segundo`,
  `ethereum-vs-tezos`, `federate`, `federated`, `kowloon`, `lab`,
  `leaderboards`, `lotto`, `magpie`, `noundrum`, `nouns`, `passport`, `play`,
  `press`, `research`, `resources`, `rfc`, `show-hn`, `social`, `sports`,
  `tonight`, `tv/shows`, and `contributor`.
- These need product grouping before merge. Do not land them as one broad route
  dump.

### Experiments And Labs

- Sky clock, `/clock/{id}`, planetary drawer, sky ribbon, astronomical helper.
- `/here`, `/for-nodes`, `/workbench`, `/start`, presence Durable Object, and
  CoNavigator footer.
- Sprint primitives, zeitgeist map, pairings, federation, and `/moment/editor`.

## Needs Mike

These require product, legal, security, billing, or taste decisions before
Codex/Claude should merge them.

### Contracts And Wallets

- `contracts/v2/compute_lotto.sol`
- `contracts/v2/passport_stamps_fa2.py`
- `contracts/v2/DEPLOY_NOTES_PASSPORT_STAMPS.md`
- Passport stamp shadownet deploy/mint/readiness scripts.

Questions:

- Is Passport part of Gamgee, or a later Tezos-focused release?
- Should compute lotto ship publicly, stay in lab, or remain private?
- Who owns final chain/security review?

### Auth, OAuth, And Payments

- `functions/api/auth/google/`
- `.well-known/oauth-*`
- `.well-known/openid-configuration`
- `functions/api/x402/`
- static `/.well-known/x402/`
- wallet and tank APIs.

Questions:

- Is any production auth change expected in RC1?
- Should x402 appear as a public signal, or remain experimental?
- Which environment secrets and billing dependencies are real?

### Release Story

- Show HN, press, front-door copy, El Segundo pages, Tezos positioning, and
  Sparrow positioning.

Questions:

- Is Gamgee primarily "agent-native publishing," "local broadcast," or
  "federated Sparrow" in the first public sentence?
- What is the one page Mike wants a new visitor to land on?

## Drop Or Quarantine

These should not enter Gamgee without explicit re-selection.

- Nightly auto-push commit `44b9b8c`: mixed surface dump across about 70 files.
  Classify individual files instead of trusting the commit boundary.
- Generated image bursts and poster sets unless tied to a named launch page.
- Backup artifacts like `public/favicon.ico.bak-antrope-a`.
- Route deletions, including the Farcaster and auth/presence function deletions,
  until there is a route audit explaining the replacement behavior.
- Large docs/outreach/research trees unless a specific page or release note
  links to them.

## Surface Map

Use these groups for split PRs.

- Agent surfaces: `src/pages/agents.json.ts`, `/for-agents`, feed surfaces,
  `llms` surfaces, `ai-stack`, local/edition JSON, sitemap-style additions.
- Public pages: launch pages, lab pages, local pages, game pages, Tezos pages,
  TV/show pages, and editorial pages.
- Functions/workers: Cloudflare functions, middleware, auth, schedule, wallet,
  tank, x402, Sparrow digest, and Durable Objects.
- Contracts/payments: Tezos contracts, deploy scripts, passport stamps, lotto,
  wallet, and payment docs.
- Content/data: blocks, market data, contracts data, glossary/collaborators,
  channel data.
- Assets: OG images, generated block images, favicon set, posters, decks,
  videos, service worker, `.well-known` static assets.
- Docs/scripts/config: AGENTS, README, CLAUDE references, audit scripts,
  wrangler, Astro config, redirects, robots, package scripts.

## Next PR Candidates

1. Agent surface smoke PR

   Scope: compare clean `main` with the dirty train's agent surfaces, then port
   only the smallest safe fixes: duplicate `share` cleanup if the relevant
   surface is brought over, plus either port or remove the
   `scripts/audit-publishing.mjs` reference mismatch.

   Acceptance: `npm run build:bare` or the closest available repo build, plus
   direct checks for `/agents.json`, `/for-agents`, `/llms.txt`, and feeds.

2. Gamgee front-door PR

   Scope: one coherent visitor path for the release: homepage tighten, `/now`
   freshness, Show HN/press copy, and one clear agent-native explanation page.

   Acceptance: visual check, route check, and no unrelated route family imports.

3. Sparrow deferral/RFC PR

   Scope: preserve the Sparrow/Magpie/federation work as a later track by
   adding a short RFC or release note that names what is ready, what is risky,
   and what Mike needs to decide.

   Acceptance: docs-only, no worker/function/contract merge, clear owner for
   Gamgee 1.1.

## Working Agreement

- Codex owns clean branch structure, docs, PR hygiene, and final diffs.
- Claude Code can do deep local inspections and propose slices, but should be
  given narrow, file-bounded tasks before editing.
- Manus stays on browser/login/ops tasks.
- Mike decides product story, contract/payment readiness, and anything public
  with brand weight.
