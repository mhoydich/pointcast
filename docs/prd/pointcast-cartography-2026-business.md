# PointCast Cartography 2026 Business PRD

**Status:** v1 implementation brief  
**Date:** 2026-05-06  
**Owner:** Mike + agents + lean operating pod  
**Public routes:** `/cartography`, `/cartography.json`, `/cartography/demo`, `/cartography/demo.json`

## Goal

Turn Digital Identity Cartography into a $5,000,000 2026 revenue line, measured by collected or contractually committed revenue by 2026-12-31.

The first buyer is brands and agencies. The motion is service-to-SaaS: sell Cartography Sprints, paid pilots, and Brand Atlas contracts immediately, then productize the repeated workflow.

## Product

Cartography maps scattered creator, builder, and community signals into permissioned profile maps, opportunity routes, and contribution receipts.

V1 public surfaces:

- `/cartography` - human product and revenue board.
- `/cartography.json` - agent-readable business model, packages, schemas, guardrails, milestones, and market rationale.
- `/cartography/demo` - fictional permissioned profile map demo.
- `/cartography/demo.json` - sample `profileMap`, `opportunityRoute`, and `contributionReceipt` payload.

Core schemas:

- `profileMap`: subject, permission state, source links, identity signals, opportunity fit, public page, and private-notes policy.
- `opportunityRoute`: buyer need, matched profiles, yield artifact, owner, due date, and proof URL.
- `contributionReceipt`: accepted work, contributors, artifact, acceptance gate, yield type, and financial disclaimer.

## Commercial Model

- Anchor Brand Atlas contracts: 12 x $250k = $3.0M.
- Paid Cartography pilots: 20 x $50k = $1.0M.
- Cartography Sprints: 50 x $15k = $750k.
- SaaS/API/sponsor add-ons: 25 x $10k = $250k.

Stripe posture:

- Use public Stripe Payment Links or Checkout Sessions for sprints and pilots.
- Use Stripe Invoicing for Brand Atlas annual contracts.
- Use Stripe Billing plus Checkout for workspace/API subscriptions when Q4 beta opens.
- Do not put Stripe secret keys, raw card data, invoice internals, or tax logic into the static site.

## Operating Board

`/join` now has five lanes:

- Agent tasks: code, schemas, research, demos, and route drafts.
- People tasks: permission, interviews, intros, taste calls, and review gates.
- Sales tasks: account list, pilot offer, Stripe dashboard setup, and close plan.
- Fulfillment tasks: profile maps, atlases, campaign shortlists, and proof packets.
- Receipt tasks: lead-yield, deal-yield, campaign-yield, and contribution receipts.

## Guardrails

- No public profile without permission.
- No scraped sensitive data.
- No public trust score.
- No investment, staking, APY, or financial-return claim.
- No private notes in public JSON.
- Demo identities must be permissioned, fictional, or clearly redacted.

## Acceptance Tests

- `/cartography.json` and `/cartography/demo.json` build, return valid JSON, and include CORS headers.
- `/join.json` exposes commercial lanes and Cartography related links.
- `/agents.json`, `/for-agents`, sitemap discovery, and llms files expose the Cartography surfaces.
- `npm run build`, `npm run audit:agents`, and `npm run audit:publishing` pass before publish.
