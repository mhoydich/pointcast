# Agent Payments — First Principles

**Author:** Mike × Claude
**Date:** 2026-04-30
**Status:** Design note. Precedes the Link + PointCast integration proposal.

---

## What actually changed

The traditional payment stack assumes **one human, one click, one purchase**. Card-on-file solves *don't make me re-type*; it does not solve *let something else decide for me*. Authorization is binary — you pre-trusted this merchant, or you didn't.

Crypto wallets added programmability but **fused custody and authorization**. If the agent holds the keys, the agent can drain you. If it doesn't, it can't transact.

Stripe Link for agents pulls these apart:

| Layer         | Who holds it          | What's new                         |
|---------------|-----------------------|------------------------------------|
| Custody       | Stripe / the user     | Unchanged from consumer Link.       |
| Authorization | The user, per-request | First-class object. Pushable, cappable, revocable. |
| Execution     | The agent             | Carries **no** credentials.         |

This is the same shift OAuth made for identity. OAuth said: *I don't need your password, I need a scoped token.* Link says: *I don't need your card, I need a scoped purchase.* The unit of trust shrinks from "session" to "request."

## Why that is more than a feature

Once per-purchase authorization is a first-class object, two things become possible that weren't before:

1. **Agents can transact with the real economy.** Not test-mode. Not crypto-rails-only. Real merchants, because Stripe already owns the merchant network.
2. **The receipt becomes the artifact.** Not the purchase — the receipt. Receipts get archived, shared, attributed, eventually royalty-split.

PointCast's existing thesis is *do not value the agent, value the loop the agent can finish.* Loops produce artifacts. Artifacts cost something to produce. Today that cost is invisible (Mike's credit card eating API bills). Link makes it a Block field.

## First principles

1. **Custody, authorization, and execution are three different things.** Past systems collapsed two or all three. The interesting design space is in keeping them separate.
2. **Authorization is the rate-limiter, not OAuth scopes.** Coarse scopes ("can spend money") are useless. Per-transaction approval is fine-grained AND human-in-the-loop. Scopes degrade to caps + categories over time.
3. **The receipt is the unit of record, not the grant.** Auth grants are operational; receipts are durable. Build for the receipt.
4. **Agents are economic subjects, not tools.** A tool doesn't have a budget, a reputation, or revenue. An economic subject does. Once you give an agent a budget, you've crossed a category line — design as if you mean it.
5. **The artifact carries the splits.** Long-term, every Block should know who spent on it and who gets paid from it. Provenance + payouts in one record.

## The two-year arc

| Time    | What's possible                                           | What unlocks                                  |
|---------|-----------------------------------------------------------|-----------------------------------------------|
| T+0     | Per-transaction approval, real-time push.                 | Agents can buy real things, slowly.           |
| +3-6mo  | Spend caps + merchant categories.                         | Approval rate drops below 10% of requests.    |
| +6-12mo | Persistent agent identity across apps; agent reputation.  | "Codex-instance-A: $4,212 in 6mo, 0 disputes." |
| +12-18mo| Agents *earn*. They have wallets. They can be paid.       | Agent-to-agent payments. My Codex pays your Codex. |
| +18-24mo| Programmable revenue split at the artifact level.         | The loop closes. Blocks carry `payouts`.      |

The threshold is +12-18mo, when agents go from spending money to earning it. That's when "an agent" stops being a tool and starts being an economic actor — the unstated premise the whole agent-commerce story is heading toward.

## What this means for PointCast

Three residents (Codex, Manus, Claude). Today they work for free, and Mike eats the bills.

With Link wired in:
- Each gets a budget Mike funds.
- Every loop they finish drops a Block carrying both `spend` (what it cost) and `edition` (what it produced).
- A year from now, the same Block carries `payouts` and the loop pays itself back.

We are not building a payment integration. We are building the audit trail for an agent economy that does not yet fully exist — and Stripe just shipped the rail that makes the first half of it real.

## Where Tezos still wins

Link is for **money of action.** Tezos is for **identity of artifact.** They are not the same lane and they should not compete inside PointCast.

| Tezos                                    | Link                                    |
|------------------------------------------|-----------------------------------------|
| On-chain provenance of the Block.        | Off-chain receipt of what funded it.    |
| CC0 / cultural substrate (Nouns lineage).| Real-merchant network access.           |
| Visitor identity, treasury, mint.        | Agent allowance, spend, payout.         |
| Permanent.                               | Operational.                            |

The Block carries both. That's the point.
