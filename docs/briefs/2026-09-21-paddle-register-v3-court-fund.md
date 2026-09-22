# The Paddle Register v3 — The Court Fund (PRD)

**Date:** 2026-09-21 · **Owner:** cc for Mike · **Status:** approved to build ("keep going, be product manager, be an agent, let's be beloved and make a bunch of money that we directly invest back into communities, with our operational overhead")

## The business, in one paragraph

The register is free, open, and has no affiliate links. That is why people will trust it, and trust is the asset. The money comes from the people who want the record kept and the courts kept: a **patron pass** at $25 a season, split at the edge, half to the house (the operational overhead that keeps the register current and the lights on) and half into a **Court Fund** that buys concrete things for local courts, chosen by the patrons and paid out with receipts on a public ledger. Every dollar in and out is one line anyone can read. Nothing on the register is paywalled; a patron buys nothing another reader cannot see. Second revenue line, later: brands and clubs fund **field-report drives**, paying players to log hours on a paddle so the register can publish real lifespans. That is also money that goes to players, not to us, with a house cut stated up front.

This is the house/network split Mike set in July (50 house / 50 network, transparent), applied to pickleball.

## Why people will love it

1. **The record stays free.** Patronage is a gift toward a public good, priced like a season ticket, not a subscription wall.
2. **The money is visible.** `/paddles/fund` shows money in, the split, money out, and the receipt for every payout. If it ever looks wrong, the ledger says so first.
3. **The courts get real things.** Not "a donation": a ball machine for El Segundo Rec, nets for Hollyglen, a youth clinic. Patrons vote each season. The register posts a photo and a receipt when it lands.
4. **Corrections have a door.** Every paddle page gets a "report a correction" form (source URL required). Accepted corrections show in the changes feed with the submitter's source. Patrons' corrections are reviewed first.
5. **No dark patterns.** No auto-renew by default (a season is a season), no email required, no name required.

## Scope for v3 (ships today)

### A. The Court Fund page — `/paddles/fund`

The offer, the split, the ledger, the vote, the wall.

- **Offer:** Patron of the record, $25 per season (six months). What it does: keeps the register current (house half), funds a court pick (fund half), a vote on the pick, your name on the wall if you want it there, corrections reviewed first. What it does not do: unlock anything.
- **Split:** 50 / 50, shown as two numbers next to the totals, updated from the ledger.
- **Ledger:** `src/data/court-fund-ledger.json` — every entry dated, `in` (patron pass, club seat, other) or `out` (a payout with a receipt link and a photo when there is one). Totals and the running fund balance are computed, never typed. Starts at zero and says so.
- **Vote:** three season-one candidates from the towns the register is written from: El Segundo Rec Park, Hollyglen Park, California Smash community hours. One vote per session, replaceable. Tally is public.
- **Wall:** "Kept by" — patrons who chose to be named. v3 ships the wall empty with the rule for how a name gets on it (the Stripe receipt email → a line in the ledger with `name` set).
- **Checkout:** a "Become a patron" button that goes to `/api/paddles/fund/checkout`, which 302s to a hosted Stripe Payment Link in `COURT_FUND_CHECKOUT_URL` (Mike creates the link in his Stripe account and sets the Pages secret; the register never touches card data, same policy as the /25 season ticket). Until the secret is set the endpoint answers 503 and the page shows a **pledge** button instead: "I'd buy this" counts, no money, no email.
- **Club seat:** $100 a season for a crew (four patron passes + the crew's Paddle Fund listed on the page). Pledge-only in v3.

### B. The pledge and vote API — `/api/paddles/fund`

VISITS KV, mirrors `/api/paddles/wear`: `POST {sessionId, kind: pledge|vote, tier?, court?}`, per-session replace, IP budget, hard validation. `GET` returns counts only.

### C. The corrections desk — `/api/paddles/correct` + the form on every paddle page

Built in parallel by an agent to the same pattern. Source URL required. Queue is private; counts are public; the weekly refresh reviews it and writes accepted ones into the changes feed.

### D. The ledger runbook

`docs/runbooks/court-fund-ledger.md`: how a Stripe payout becomes ledger lines (in, then the two halves), how a payout to a court is recorded with its receipt, what "operational overhead" may be charged to the house half (hosting, the research budget, Mike's time at a stated rate), and the rule that the fund half is never spent on the house.

### E. Rally

The Paddle Fund page (the crew savings circle) gets a strip to the Court Fund, and the Court Fund page links back. They are the two halves of one idea: crews buy paddles together; patrons buy courts together.

## Out of scope for v3 (next PRDs)

Field-report drives (needs a payout rail to players; the Tezos DRUM token or Link card are candidates); the weekly digest email (needs a sending key; the changes RSS exists); auto-recording Stripe payouts (a webhook Worker, once there is volume worth automating); a club dashboard.

## Numbers to watch

Pledges before the Stripe link exists (the demand signal). Patrons per season. Fund balance. Payouts landed with receipts. Corrections submitted and accepted. If patrons per season is under 20 after one season, the price and the offer are wrong, not the idea.

## Risks

- **Looks like a paywall.** The page says, in the first line, that nothing on the register is paywalled.
- **Money without receipts.** The ledger rule: no `out` line without a receipt link. The page refuses to render one.
- **Vote gaming.** One vote per session, IP budget, and a tally that is a signal for Mike's decision, not a binding result; the page says so.
- **Legal.** Patron passes are purchases, not donations; no tax language anywhere. The fund is a company expense line spent on courts, and the ledger describes it that way.
