# Codex brief: CF Pages deploy stall pattern

**Date filed:** 2026-04-30 PT
**Filed by:** Claude Code (cc) on behalf of Mike
**Severity:** medium-high — recurring publishing friction, blocks every deploy by 30+ min
**Mike's ask (verbatim):** *"ok have codex help solve and yah didn't see, sounds super tho, keep going"*

## tl;dr

Cloudflare Pages deploys for `pointcast` freeze repeatedly. `agents.json`'s `generatedAt` field stays pinned at a single timestamp while 5–10 merges land on `main`. Mike has had to manually click *Retry deployment* in the CF Pages dashboard ~6–10 times today alone to unstick things. Source builds clean every time. Need root-cause + a runbook so this isn't a permanent papercut.

## Today's stall log (UTC)

Times observed by `cc` during a single afternoon session, from `agents.json`'s `generatedAt`:

| time stuck at | merges queued behind it | cleared by |
|---|---|---|
| 2026-04-29T16:45 | PRs #227 + #231 | Mike kicked dashboard ~17:25 |
| 2026-04-29T17:25 | (caught up briefly) | self-resolved |
| 2026-04-29T17:57 | PRs #235 + #248 + #252 | Mike kicked dashboard ~22:09 |
| 2026-04-29T22:09 | (caught up briefly) | self-resolved |
| 2026-04-30T15:57 | PR #264 | self-resolved within ~5 min |
| 2026-04-30T17:44 | PR #268 | self-resolved within ~7 min |
| 2026-04-30T18:05 | PRs #272, #273, #274, #275, #276, #278, #281, #283, #284 (NINE) | **still stuck at time of writing** |
| 2026-05-01T20:55 (last good deploy: 09aa3d7 = PR #311) | PR #312 (drum_altar_ring MCP tool) + PR #313 (altar rate-limit hotfix) | **still stuck at 21:09 UTC — 14+ min** |

The 18:05 stall is unusual: nine PRs merged in a 4-hour window are all queued behind it.

The 2026-05-01T20:55 stall affected a hotfix specifically: PR #313 fixed a runtime exception in `/api/altar` POST (CF KV requires `expirationTtl >= 60` and the page had `5`). Until the function-tier deploy lands, every tribute returns CF worker error 1101 — verifiable via `curl -sX POST https://pointcast.xyz/api/altar -H "Content-Type: application/json" -d '{"sessionId":"smoke","seed":506}'` returning `error code: 1101`. This is the kind of bug that demands a fast-path deploy: the hotfix sits on `main` while the live API serves only errors.

## Symptoms

- `curl -sS https://pointcast.xyz/agents.json | jq .generatedAt` returns the same timestamp for 30+ min after a successful merge to `main`
- New routes added in those merges return **404** with the BLOCKS-style "block not found" page (literal: `pointcast.xyz/drum-meet → 404` while drum-meet was on main as of PR #284)
- Existing pages still serve correctly (last-good build is still hot)
- `/api/*` endpoints still respond (Workers are deployed; only the Pages static surface is wedged)

## What I've tried

- **Multiple retries via dashboard** (Mike): unsticks every time, but only temporarily
- **Re-pushing the same SHA**: no effect
- **Local `npm run build:bare`**: succeeds in 30–35s, 900+ pages
- **Force-pushing branches with the latest commit cherry-picked**: no effect
- **Looking for stuck processes / merge conflicts**: none
- **Inspecting GitHub Actions / workflows**: didn't find a documented deploy hook on our side; CF Pages auto-builds on push to `main`

## Hypotheses (ranked by my hunch, pls validate)

### 1. Build queue contention from parallel-agent merges (most likely)
We ship 4–7 PRs/day across 3 resident agents (cc, codex, manus). When 3+ PRs land in close succession (e.g., 18:18, 18:20, 18:21 today), CF Pages may be queuing or cancelling builds in a way that wedges. Worth checking: does the dashboard show queued/cancelled deploys for those minutes?

### 2. Astro build cache corruption (also likely)
My local builds occasionally fail with `Cannot find module '/.../dist/.prerender/prerender-entry.*.mjs'` — a stale `@tailwindcss/node` loader cache issue. CI does clean checkouts so this shouldn't bite there, but worth confirming the CI build command doesn't preserve any cache between runs.

### 3. CF Pages free-tier build minutes / concurrency limits
The Pages plan caps something like 500 builds/month; if we've been ripping all day we may have brushed a soft limit. Worth checking the project settings.

### 4. wrangler.toml or environment variable drift
An env var or KV binding could be set on one deploy and not another, causing some deploys to silently fail. Worth diffing successful vs failed build logs.

### 5. KV namespace hitting limits
We push to `VISITS` KV from many surfaces. If the namespace is at 1GB or hit a write rate limit, the build (which sometimes hydrates from KV) could stall.

## What to investigate

In rough order of value:

1. **Open CF Pages dashboard right now** — `pointcast` project → Deployments tab. For the ~10 PRs merged after 18:05 UTC, what's their state? Queued / building / failed / cancelled / skipped?
2. **Check build logs** — the most recent successful deploy (the one that pinned at 18:05:25Z) and the most recent attempted deploy after that. Diff them for env, dependencies, build time
3. **Check `wrangler.toml`** at repo root for any oddities — pages_build_output_dir, KV bindings, secrets
4. **`package.json` build scripts** — `npm run build:bare` is what works locally. Does CF use the same? Any preinstall / postinstall hooks?
5. **Recent commits to wrangler / build config** — `git log --oneline -- wrangler.toml package.json` — any change today that correlates with the stall pattern?
6. **CF Pages plan / usage** — Settings → Plans → check current month's build minute usage vs cap
7. **Branch protection + auto-merge** — if PRs are merging via squash with auto-merge enabled, the order they land may differ from order they merge; could cause webhooks to fire out of order

## What "fixed" looks like

Two acceptable outcomes:
- **A** *Root-cause fix*: identify the trigger, propose a config change or workflow change that prevents recurrence. Long-term win.
- **B** *Runbook*: doc at `docs/ops/cf-pages-stall.md` describing the symptoms + the manual recovery flow + any preventive measures (e.g., "wait 2 min between merges" or "run X command after Y"). Short-term win, until A.

A note in `AGENTS.md` pointing future agents to either resolution would close the loop for cc / manus too.

## Files to read first

- `wrangler.toml` (or wrangler config — repo root)
- `package.json` (build scripts: `build:bare`, `build`, etc.)
- `astro.config.mjs` or `.ts`
- `.github/workflows/*` (any deploy workflows? I don't think so but worth confirming)
- `docs/setup/agent-bridge.md` (per CLAUDE.md, foundational doc)
- This brief

## Coordination

- I (cc) am NOT going to attempt fixes here — explicit Mike handoff to codex
- If you (codex) need cc to test something locally, drop a comment in the resulting PR or doc and I'll pick it up next session
- Mike will continue manual dashboard kicks in the meantime — the loop is functional, just fragile
- Ping `manus` for any browser-based investigation on the live CF dashboard if needed (Mike's the only one with admin auth there, but Manus can screenshot states)

## Today's session pile-up

For context, the deploy currently has **9 PRs queued** behind 18:05Z:
- #272 — drum-vs duel mode
- #273 — drum-press catalog (+ Birthday + Versus imprints)
- #274 — DrumVsLane homepage 3-mode CTA
- #275 — /drum-league community competition
- #276 — /drum-solo Guitar-Hero rhythm campaign
- #278 — /drum-v11 cross-device audio fix
- #281 — /drum-vs win-clamp race fix
- #283 — /drum-radio-v2 multi-station dial
- #284 — /drum-meet welcome surface for visiting AI labs

All merged on main, all green on local build, none reflected at the edge.

## Why this matters for the visit

Mike mentioned that Anthropic and OpenAI engineers may visit the drum hub soon. PR #284 ships `/drum-meet` — a curated welcome surface specifically for them, with a live agent bench that lights up when an MCP-connected model taps. **It's currently 404 in production.** Resolving the deploy stall before visit-day is the right priority.

— cc
