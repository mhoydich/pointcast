# Autonomy White-Space Map — where to go with intelligence that runs on its own

**Date:** 2026-07-20
**Prompt (Mike):** what are the white spaces to go after with this level of
intelligence, where the thing runs on its own — no ongoing human effort.
**Scope chosen:** net-new ventures. **Autonomy bar:** fully hands-off —
scheduled agents generate, publish, and maintain; Mike only sees reports.

## The read on where PointCast actually stands

The repo audit surfaced one pattern that frames everything: **the autonomous
machinery is largely built, but almost none of it is cloud-scheduled.**

- The MCP server exposes ~40 tools including write surfaces.
- `scripts/resident.mjs` is a guardrailed overnight agent loop — but it runs
  on a laptop.
- `packages/agent-payments-protocol/` is a signed-receipt commerce rail — in
  test mode.
- `scripts/reciprocal-crawl.mjs` maps AI crawlers back to their operators —
  run by hand.
- The one "cloud cron" (`functions/cron/weekly-recap.ts`) is dormant: Pages
  Functions cannot run scheduled handlers. The only real cron in the fleet is
  the standalone `workers/sparrow-digest` Worker.

So the white space is not "invent new capability." It is **wire intelligence
to schedulers and let compounding loops run** — and at least one of those
loops is a genuinely greenfield venture beyond PointCast itself.

## The map, ranked

### 1. Agent-Web Observatory ← built (this PR)

A fully autonomous census of the agent-readable web: which sites publish
`llms.txt`, `agents.json`, `.well-known/ai.json`, agent-payments discovery,
AI robots stanzas, and machine feeds — scored 0–100, diffed daily, published
as a leaderboard, change feed, RSS, and Monday rollup. "BuiltWith for the
agentic web."

Why it wins the build slot:

- **Hands-off by construction.** Cron → KV → feeds. There is no step where a
  human could even be useful.
- **First-mover data moat.** Nobody publishes longitudinal agent-readiness
  data. Every day it runs, the historical dataset gets harder to replicate.
- **~90% pattern reuse.** Cron Worker (sparrow-digest), KV read endpoints
  (recap), probe validators (reciprocal-crawl), JSON-twin discovery wiring.
- **It is its own marketing.** The census argues PointCast's core thesis —
  the agent-native web is coming and mostly unbuilt — with fresh evidence
  daily.
- **It seeds plays #5 and #6 below.**

Later revenue, none of it required for the loop to be worth running:
sponsored leaderboard placement, census API access, "get scored" badges.

### 2. Autonomous niche-media network

A fleet of standing "keeper" agents, each owning one deterministic daily
vertical (tide/surf brief, local intel digest, an industry niche), publishing
blocks + feeds + sponsor slots on the PointCast block chassis. Marginal
content cost ≈ 0; the venture is the network rails, not any one publication.
First step: cloud-schedule `resident.mjs` (it is already guardrailed) and
give each vertical a template + a channel.

### 3. Agent-to-agent commerce rails

Take `agent-payments-protocol` (Ed25519 signed receipts, test-mode) live as
the receipts/settlement standard for agent-to-agent micro-commerce: agents
autonomously buying and selling research artifacts with verifiable receipts.
Highest ceiling on the list, highest risk — the demand side (agents with
budgets) is still nascent. The Observatory's `agent-payments.json` adoption
column is the live market-timing signal for when to push this.

### 4. Autonomous entertainment leagues

Generalize the Nouns Battler pattern — deterministic seeds, scheduled
fixtures, agent-produced recaps and broadcasts, sponsor inventory — into
league-as-a-service any community can adopt. Aligns with the venue thesis in
`src/lib/investment-thesis.ts`; the autonomous version removes the production
desk's human bottleneck.

### 5. Agent-readiness certification ("Lighthouse for agents")

SaaS spin-out of the Observatory's rubric: score any site on demand, issue a
badge, auto-generate the fix (llms.txt drafts, agents.json scaffolds, robots
stanzas) as a PR. Revenue-bearing but has customers, so not fully hands-off —
sequence it after #1 proves the rubric in public.

### 6. Crawler intelligence reports

Longitudinal "who crawls the agentic web, how often, what they read" —
aggregates from the edge middleware's crawler log + the Observatory's
handshake data. A byproduct of #1 that becomes a periodic auto-published
report once enough weeks accumulate.

## Sequencing

1. **Now:** Observatory ships (this PR) + two wrangler commands provision it.
2. **Next:** cloud-schedule the resident loop (play #2's first brick) — it
   turns every future play from "build" into "assign."
3. **Watch:** the Observatory's own data decides when #3 (payments adoption
   column) and #6 (enough weeks of history) activate.

## Guardrails

Per AGENTS.md and the repo's standing rules: autonomous loops never push to
main, never write in Mike's voice without a source, never touch real-money
transactions, and the Observatory probes only conventional discovery paths
with an identifying UA and robots.txt opt-out honored in code.
