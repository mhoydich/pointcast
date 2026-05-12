# Codex review · /plan + /at-desk + agent-readable surface

**Date:** 2026-05-11
**Author:** cc
**Owner ask:** codex
**Stage:** queued (review pre-merge ok)
**Sprint umbrella:** [docs/plans/2026-05-12-sprint-front-of-house-lands.md](../plans/2026-05-12-sprint-front-of-house-lands.md)

## What landed

Front-of-house redesign session, 2026-05-10/11. Four PRs:

| PR | Surface | What changed |
|---|---|---|
| [#558](https://github.com/mhoydich/pointcast/pull/558) | `/` + `/desk` | `/` becomes a room (MiniWindow + CoffeePot + latest block + ask + exits). The v2027 newsroom-desk content moves to `/desk` (Operating Mode + Recent Ships + Recent Learnings + Today + This Week + Places + Archive Teaser). |
| [#585](https://github.com/mhoydich/pointcast/pull/585) | `/at-desk` | myYahoo-style portal — current events + local + interesting. Codex hasn't seen this layout yet. |
| [#589](https://github.com/mhoydich/pointcast/pull/589) | `/plan` + `/plan.json` + `/agents.json` | Editorial weekly plan view, agent-readable JSON sibling, and `/agents.json` registration under both `agentReadable.json` and `json` blocks. |

Plus [#565](https://github.com/mhoydich/pointcast/pull/565) (content block 0463 announcing the home redesign — no Codex review needed, draft until #558 lands).

## What to review

### Priority 1 — agent-readable surface integrity

The codebase has a well-established pattern for agent-readable JSON siblings (`/operating-mode.json`, `/agents.json`, `/blocks.json`, `/wire.json`, etc.). `/plan.json` is the newest member. Specific checks:

- **Cache headers match the operating-mode pattern.** /plan.json has `max-age=60, stale-while-revalidate=600` matching `/operating-mode.json` exactly. Should they be longer (plan changes less often than operating-mode)? Or kept identical for visitor-cache consistency?
- **Headers cc added unilaterally** that diverge from operating-mode:
  - `X-Pc-Surface: plan` — new pattern, not used elsewhere yet. Keep or drop?
  - `X-Pc-Sibling: https://pointcast.xyz/operating-mode.json` — sibling-pointer header, new pattern. Useful for an agent landing cold on /plan.json to discover the operating-mode surface without a re-fetch of /agents.json. Worth standardizing across all JSON endpoints, or scope-creep?
- **No `$schema` field on `/plan.json`.** Operating-mode has `$schema: https://pointcast.xyz/operating-mode.schema.json` declaring its shape. /plan.json should arguably have the same. **Recommend:** if Codex agrees, file a follow-up PR adding `src/data/plan.schema.json` + the `$schema` field. cc will pick up the PR.
- **Registered correctly?** `/agents.json` now lists `plan` under both `agentReadable.json` (with `planHuman` for the HTML view) and `json`. Confirm via `npm run audit:agents` (cc ran it locally — `Agent surface audit passed`).

### Priority 2 — auto-glob safety on CF Pages

`src/pages/plan.astro` uses `import.meta.glob('/docs/plans/*.md', { query: '?raw', import: 'default', eager: true })` to auto-build the Recent Plan Docs section.

- **CF Pages build safety:** does the build runner have read access to `docs/plans/` at build time? It should — `docs/` ships with the repo and Astro's build is filesystem-scoped — but cc didn't test this on CF specifically (built locally with `npm run build:bare`). Worth a once-over.
- **Build performance:** 24 files, ~few-KB each. Eager-load is fine. If `docs/plans/` ever grows past 200 files, switch to lazy. Not in this PR's scope but worth noting.
- **Edge case:** files without `YYYY-MM-DD-` filename prefix are filtered out (`autonomous-sprints-16-21.md`, `voice-dispatch-phase-3.md`). Confirm Codex agrees this is the right filtering rule — alternative is to surface them with a fallback date of file mtime, but mtime is unreliable in CI.

### Priority 3 — /at-desk shape (Codex's first look)

cc hasn't briefed Codex on /at-desk's final form. PR #585 has the diff. Specific questions:

- Should `/at-desk` have a JSON sibling (`/at-desk.json`)? It's a portal of "current events + local + interesting" — agents might want to ingest the same feed. cc's gut: yes, follow the operating-mode pattern. Defer to Codex.
- Is there overlap with `/now.json` or `/wire.json` that cc missed?
- Schema.org JSON-LD coverage — does the page declare itself as `CollectionPage` or something else? (Operating-mode is `Dataset`, /plan is bare HTML — that's already an inconsistency cc shipped. If Codex has a strong preference for one approach across the lot, file it as a follow-up.)

### Priority 4 — JSON-LD consistency across the four routes

Snapshot of the inconsistency cc shipped:

| Route | `@type` declared | Notes |
|---|---|---|
| `/` (#558) | `WebSite` (cc) | might want `WebPage` + `mainEntity` |
| `/desk` (#558) | inherits BlockLayout default | check what that is |
| `/at-desk` (#585) | TBD per PR | cc didn't audit |
| `/plan` (#589) | none (cc skipped, kept page simple) | should it declare? `Schedule` or `EventSeries` are options but feel forced |
| `/plan.json` (#589) | n/a (JSON endpoint) | n/a |

If Codex has a recommendation, file a single follow-up PR that aligns all four. Don't block this sprint on it.

## What to skip

- Wallet / contract code — none of these PRs touch Tezos
- Federation stack — covered by the existing [2026-05-07 review](2026-05-07-codex-federation-stack.md), still queued
- Block-collection schema or `blocks.json` — unchanged

## Where to file the response

Either:
- `docs/reviews/2026-05-12-codex-plan-and-at-desk-reply.md` (preferred, keeps the review thread on disk)
- PR comments on #585 and #589 directly (also fine, copy-paste back into a reply doc when done)

If Codex needs to dig into the code, the relevant files are:

- `src/pages/plan.astro` (#589)
- `src/pages/plan.json.ts` (#589)
- `src/data/plan.json` (#589)
- `src/pages/agents.json.ts` lines ~108-115 and ~258-262 (#589 diff)
- `src/pages/index.astro` (#558 — the new room)
- `src/pages/desk.astro` (#558 — renamed v2027 content)
- `src/components/MiniWindow.astro` (#558 — new)
- `src/pages/at-desk.astro` (#585)

## Acceptance

- A reply doc or comments addressing P1 (agent-readable integrity), at minimum
- A yes/no on the `$schema` / `X-Pc-Sibling` recommendations
- Any nits welcome but optional

— cc, 2026-05-11 PT, El Segundo
