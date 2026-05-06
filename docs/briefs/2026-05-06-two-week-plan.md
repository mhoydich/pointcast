# Two-week plan · 2026-05-06 → 2026-05-19

**Date filed:** 2026-05-06 PT
**Filed by:** cc + codex (co-authored via mcp__codex; codex returned the spine, cc verified against repo state and stitched the deltas)
**Mike's brief:** _"create a current and best practices for pointcast, etc, work with codex on our plan for next two weeks"_
**Companion doc:** [docs/standards/2026-05-06-current-best-practices.md](../standards/2026-05-06-current-best-practices.md)

## Thesis

The wing exploded — **145+ commits since 2026-05-01**, four themed sprints landed, a 4-hour pulse sprint mid-flight. Another 25 surfaces will make the town **bigger but not more real**. The next two weeks should be about making it **legible and dependable**: stabilize the deploy pipe, consolidate three "show this to someone" doors, clear the Mike-side Tezos and RFC 0003 backlog, and let `/drum-scorebook` carry the long tail. Coffee stays on. The pipes get fixed.

## Week 1 — Make the wing hold (2026-05-06 → 05-12)

| item | owner | shape |
|---|---|---|
| Finish or cleanly close the 4-hour pulse sprint | cc | Ship `/drum-relay-2` + closer if they still matter; otherwise receipt the sprint and stop. No half-shipped ghosts. |
| Kill or contain the CF Pages deploy stall | codex | Stale-deploy detector, manual `wrangler pages deploy` runbook hardened, recommendation on whether auto-deploy stays trusted at all. Manus captures dashboard evidence if Mike grants browser time. |
| Freeze DrumNav churn | cc → codex review | Stable nav registry for Drum surfaces — no more parallel hand-edits to `DrumNav.astro`. Atomic source of truth, generated. |
| Promote `/drum-scorebook` into the canonical map | cc | Copy + data polish so the scorebook becomes the way you understand the 30+ wing surfaces. Codex reviews agent-readable shape. |
| Codex review pass on agent-readable surfaces | codex | `/explore`, `/agents.json`, `/for-agents`, `/wire`, `/briefs` — payload stability + "will agents know what to do here?" cc fixes findings. |
| Codex audits new-wing bus pressure | codex | Scope: `/api/chamber`, `/api/sounds`, `/api/altar`, `/api/quintet`, `/drum-scorebook`, and the highest-traffic new Drum surfaces. Output: one short `docs/reviews/...` note + any tiny follow-up PR if there's an obvious TTL/rate/cache bug. Fits the actual problem — 30+ surfaces leaning on fragile function-tier pipes. |
| Mike clears one Tezos action | mh | Coffee Mugs FA2 origination is the cleanest first call. cc wires the post-origination address; codex spot-checks the contract + read path. |

## Week 2 — Three doors, one chain thread (2026-05-13 → 05-19)

| item | owner | shape |
|---|---|---|
| Pick the public trio | cc + codex + manus | Recommendation: `/drum-room` (presence), `/coffee` (collectibles), `/agent-derby` or `/battle` (play). cc polishes; codex reviews behavior; Manus QAs like a visitor. |
| Make `/coffee` real or explicitly staged | cc, post-origination | If Mike originated Coffee Mugs FA2 in Week 1: wire claim-to-mint + TzKT links. If not: label `/coffee` as banked/off-chain until contract day. Don't fake it. |
| Visit Nouns admin transfer | mh executes | Codex reviews preflight + rollback; Manus verifies TzKT/objkt state after. Runbook at [docs/plans/2026-04-24-admin-transfer.md](../plans/2026-04-24-admin-transfer.md). |
| Show HN draft gets a decision | mh | cc updates [docs/gtm/2026-04-25-show-hn-draft.md](../gtm/2026-04-25-show-hn-draft.md) to current state; Mike decides Show HN week or one more quiet week. |
| Codex hardens one real lane, doesn't expand | codex | Recommendation: `/chartmaker` v3 remix desk + `/chartmaker.json` — recent, real, agent-readable, adjacent to the "make the town legible" thesis. Alternate if Mike wants game energy: `/nouns-wood-chop` polish. Not both. |
| Durable Object WebSocket spike (gated on deploys being calm) | codex | Additive fast lane from the [comms architecture brief](2026-04-30-codex-comms-architecture.md). Pilot on one non-critical Drum surface; no rewrite of `/api/sounds`. |
| Manus visitor sweep | manus | Real browser, prod URL, mobile + desktop: `/`, `/drum-room`, `/coffee`, `/window`, `/briefs`, `/wire`, `/residents`, `/battle`, `/agent-derby`, `/yee`, `/nouns-cola-crush`. Log to `docs/manus-logs/`. |

## Lanes

**codex:** CF Pages stall + runbook, comms architecture / WebSocket spike, new-wing bus-pressure audit, harden one existing lane (chartmaker or nouns-wood-chop), tezos bakery + contract review, review pass on agent-readable PRs.

**cc:** consolidate Drum navigation, close the pulse sprint, polish `/drum-scorebook`, wire Tezos addresses after Mike signs, keep `/for-agents` and receipts current, brief cadence.

**manus:** Cloudflare dashboard evidence, production deploy verification, real-user QA, screenshots/logs, objkt + TzKT verification after Mike-side chain actions.

**mh:** Coffee Mugs origination, Visit Nouns admin transfer, RFC 0003 three decisions, Show HN go/no-go.

## Three Mike decisions, named

1. **Coffee Mugs FA2 — originate now, defer two weeks, or keep off-chain?**
   Recommendation: **originate now** with conservative caps. Waiting keeps `/coffee` charming but unserious — and Week 2's wiring depends on it.

2. **Public launch posture — Show HN this window, seed list only, or no external push until deploys are fixed?**
   Recommendation: **seed list first, Show HN only after deploy automation is no longer fragile.** Waiting costs momentum, but a broken deploy on launch day costs trust.

3. **Wing shape — keep shipping surfaces, consolidate around three doors, or split Drum into sub-hubs?**
   Recommendation: **consolidate around three doors and let `/drum-scorebook` carry the rest.** Waiting means the wing keeps growing faster than visitors can understand it.

## What we explicitly don't do

- No new surface sprint unless it **replaces** a weaker planned item. The wing is full.
- No Tezos origination by cc, codex, or manus. Mike signs.
- No rewrite of the comms stack before the deploy pipe is stable.
- No onboarding more agents (Kimi, Gemini) until RFC 0003 decisions land.
- No Show HN while fresh merges still require manual `wrangler pages deploy`.

## Receipts

A short receipt block at the close of each week — what shipped, what slipped, what Mike unblocked. Block ids float (velocity is ~10/day; latest is 0438).

— cc + codex, 2026-05-06 PT, El Segundo
