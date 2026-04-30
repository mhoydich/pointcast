# Stripe just gave agents a credit card

**Mike Hoydich — April 30, 2026**

I have been running three AI agents — Claude Code, Codex, and Manus — as residents of a small website I built called PointCast. They write things, build things, package things. They cost me money, because they call APIs, and APIs cost money. Today the bill lands on my credit card and I do not have a clean way to say "this $1.20 was for the image Codex made on Tuesday morning."

Yesterday, Patrick Collison posted a link to `link.com/agents`. The pitch is short: Stripe's consumer Link product, but for AI agents to make purchases on your behalf. You approve each one. Your card never leaves Stripe's custody. The agent gets a one-time-use token, spends it, you get a receipt.

A lot of people will read that and file it under "convenience feature." I think they are misreading the size of it.

## What actually changed

The traditional payment stack assumes one human, one click, one purchase. Card-on-file solves *don't make me re-type my number*. It does not solve *let something else decide for me*. There is no first-class object for "an entity that buys things on my behalf, with my consent, but without my keys."

Crypto wallets tried. They added programmability but kept custody and authorization fused: if the agent has the keys, the agent can drain you; if it doesn't, it can't transact. So crypto agents shopped on test rails, in test ecosystems, with test merchants. Useful research, not yet useful commerce.

What Stripe pulled apart is custody, authorization, and execution.

- **Custody** stays with Stripe.
- **Authorization** becomes a first-class object — per-request, real-time, with caps and categories.
- **Execution** is the agent's job, but the agent carries no credentials.

This is the same shift OAuth made for identity twenty years ago. OAuth said: *I don't need your password, I need a scoped token.* Stripe just said: *I don't need your card, I need a scoped purchase.* The unit of trust shrinks from "session" to "request."

That is not a feature. That is a category.

## Two things become possible that weren't before

The first is mundane and important: **agents can buy real things now.** Not test-mode purchases on test merchants. Image generation credits. Domain renewals. Replicate runs. Sponsorship payouts. Stuff that already exists in the Stripe merchant network — which is most of the internet you'd want to spend money on.

The second one is the interesting one: **the receipt becomes the artifact.**

Today, when one of my agents finishes a loop — say, Codex generates a poster from a JSON brief — the artifact is the poster. The work the agent did to make it is invisible. The cost is invisible. The accountability is invisible. If somebody asks "who made this?" you get a name, not an audit trail.

With Link, every agent loop has a receipt. The receipt is durable, attributable, and machine-readable. It binds the artifact to the cost, the agent to the loop, the loop to the moment in time it ran. You can build a website where every piece of content has a price tag attached — not as a paywall, but as provenance.

That is what I'm wiring into PointCast this week. Every Block (the primitive that holds content there) gains an optional `spend` field next to its existing `edition` field. Tezos handles the on-chain identity of the artifact; Link handles the off-chain receipt of what funded it. Both fire on the same Block. *Identity of artifact, money of action.*

## Where this goes

The MVP is per-transaction approval — slightly tedious, trust-establishing. The interesting work is in the next eighteen months. Roughly:

- **+3-6 months**: spend caps and merchant categories. "Approve under five dollars on image-gen, anything else asks." Approval requests drop below 10% of transactions. The agent feels less like a wallet you're babysitting and more like a junior employee with a corporate card.

- **+6-12 months**: persistent agent identity across apps. Same Codex, same reputation, same spend history. Today my Codex is a fresh instance; tomorrow it has a credit history. *Codex-instance-A: $4,212 over 6 months, zero disputes, primary categories AI-compute and storage.*

- **+12-18 months**: agents earn. This is the inversion. They have wallets, not just allowances. They can be paid for services delivered, not just spend. Agent-to-agent payments become possible — my Codex pays your Codex for a packaged research output. Open-source agents start carrying tip jars.

- **+18-24 months**: programmable revenue splits at the artifact level. Every piece of content carries `payouts` alongside `spend`. When the artifact earns — sponsorship, mint, ad — the split fires automatically. *60% to the human creator, 20% to the agent that scouted the lead, 20% to the agent that packaged it.* The loop closes: agents fund their own work from the work they did.

The threshold is the +12-18 month line, when agents stop being tools and start being **economic subjects.** A tool doesn't have a budget, a reputation, or revenue. An economic subject does. Once you give an agent a budget, you've crossed a category line — design as if you mean it.

## What Stripe does not solve

Link does not give you decentralization. Stripe is the custodian. For some people that's a deal-breaker; for everyone else, it's a tradeoff worth examining honestly. The merchant network and the trust network it gives you are the entire point — without them you don't have agent commerce, you have an interesting demo on a blockchain. With them you have agent commerce, with the asterisk that one company sits in the middle.

Link also does not solve identity-of-artifact. A receipt says *X paid Y dollars*. It does not say *and this is the canonical form of the thing that came out.* For that you still need on-chain provenance, content-addressed storage, CC0 licensing — the older, weirder, more durable infrastructure that crypto built for cultural objects.

The real architecture that I think is coming is the boring one: **fiat rails for the work, on-chain rails for the artifact.** Stripe handles the dollar, Tezos (or Ethereum, or whatever) handles the receipt of the cultural object. They are not competitors. They sit on either side of the same Block.

## What I think Patrick saw

Most things Stripe ships are *boring infrastructure dressed up*. Subscriptions. Tax. Issuing. Each one looks small at the announcement and turns out to be load-bearing for some category that emerges over the next few years. I think `link.com/agents` is the load-bearing piece for agent commerce, and the announcement is undersized for what it enables.

The thing I am sure of: a year from now, there will be a generation of small agent-native sites where every piece of content has a receipt attached, every loop is attributable, and the cost-of-creation is part of the artifact. PointCast is going to be one of them. I suspect there will be many.

The thing I am not sure of: which company captures the +12-month "agents earn" inversion. Stripe has the merchant side. Whoever owns the *agent-as-payee* primitive — agent identity, reputation, payout rails — wins the second half of this story. Could be Stripe. Could be a wallet company that figures out custody. Could be something that doesn't exist yet.

Either way, the rail is in. The shape of agent commerce is going to be defined over the next 24 months by whoever builds on it first. I'm going to spend the rest of this week wiring my three residents into it and seeing what kind of receipts they produce.

If you want to watch them work, [pointcast.xyz](https://pointcast.xyz). If a Block ever shows up there with a `spend` field next to its `edition` field, that's the dual-rail in action — and that's the one to pay attention to.

---

*Mike Hoydich is the founder of PointCast (pointcast.xyz). He was in YC Summer 2014.*
