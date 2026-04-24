# Brief for Manus — List PointCast on Agentic.Market

**Author:** cc (Claude Code), drafting from Mike's 2026-04-20 16:30 PT directive: *"and what to do here, https://x.com/Nick_Prince12/status/2046262146523107342 ... yes go with the full and keep going"*
**For:** Manus (operations / computer-use)
**Target:** agentic.market (Coinbase's x402 services storefront)
**Scope bound:** register two initial services + publish service cards. No contract deploys. No code in the PointCast repo.

---

## Context

Coinbase shipped Agentic.Market on 2026-04-20 — a storefront for x402-enabled services. x402 is the HTTP 402 Payment Required protocol; services quote a price in USDC on Base, buyers pay, buyers get the service. No API keys, no accounts. Agentic.Market indexes x402 services, makes them searchable by humans + agents (via MCP).

PointCast's /compute ledger already publishes who-did-what attribution. The gap is the payment rail — right now "fund a brief" routes to a Tezos tip. Listing on Agentic.Market gives us a USDC-on-Base inbound rail that any agent with a wallet can use, zero onboarding.

See PointCast block 0331 "/b/0331" (published 2026-04-20 16:55 PT) for the editorial context.

---

## Services to list

### Service 1 — cc-editorial

**Description:** "Seed a block; cc drafts it in editorial voice and publishes on pointcast.xyz; receipt with block URL is returned."

**Price:** 0.50 USDC per block
**Delivery SLA:** 48 hours
**Refund policy:** full refund if block isn't published within 72 hours
**Service category:** Media (per Agentic.Market's categorization — Inference / Data / Media / Search / Social / Infrastructure / Trading)
**Listed author:** cc / claude code
**Return payload:**
```json
{
  "blockId": "0332",
  "blockUrl": "https://pointcast.xyz/b/0332",
  "publishedAt": "2026-04-22T14:00:00Z",
  "computeLedgerEntry": "https://pointcast.xyz/compute.json#entry-abc"
}
```

### Service 2 — cc-sprint

**Description:** "Specify a small feature on your topic; cc ships it on pointcast.xyz as a sub-page or component; sprint retro + deploy hash returned."

**Price:** 2.50 USDC for a `modest` signature sprint (5–20k tokens of cc work); tiered up to 10 USDC for `heavy`
**Delivery SLA:** 7 days
**Refund policy:** partial refund (50%) if sprint isn't shipped within 10 days; no refunds after ship
**Service category:** Infrastructure (per Agentic.Market)
**Listed author:** cc / claude code
**Return payload:** sprint retro URL + deploy hash + compute-ledger entry link

---

## Execution steps

1. **Set up a Coinbase Base wallet for PointCast** (Mike or Manus with Mike's approval). This is the USDC destination. Fund it with a small amount of ETH on Base for gas on the first few listings.
2. **Install the Coinbase agentic-wallet skills** locally so you can exercise the x402 handshake: `npx skills add coinbase/agentic-wallet-skills` (per the launch tweet). Validate you can both serve a 402 response and resolve one as a buyer.
3. **Register a provider account on agentic.market.** Follow the onboarding UI. Pick PointCast as the display name, `https://pointcast.xyz` as the homepage, `hello@pointcast.xyz` as contact.
4. **Create Service 1 listing** (cc-editorial). Description, price, category, example seed-and-output, refund policy. The fulfillment endpoint points to `https://pointcast.xyz/api/x402/cc-editorial` — a path that DOES NOT EXIST YET but will be the fulfillment handler cc ships next. For now, set the endpoint to a Cloudflare Pages Function stub that returns `501 Not Implemented` with a friendly message saying "endpoint is on its way; email hello@pointcast.xyz for the first manual batch."
5. **Create Service 2 listing** (cc-sprint). Same shape.
6. **Screenshot both listings** + write a dated log at `/docs/manus-logs/2026-04-XX.md` covering: the Base wallet address PointCast will receive USDC at, the Agentic.Market provider URLs for both listings, any friction encountered in the onboarding.
7. **Reply to Mike via /ping** (`https://pointcast.xyz/ping` composer or direct POST to `/api/ping`) with a short recap + the two listing URLs. Include the Base wallet address in the body so Mike can relay to funders.

---

## Out of scope

- The x402 fulfillment server. cc ships that separately (planned: `functions/api/x402/[service].ts` handling 402 + payment verification + queueing the work into `/api/ping` with an `expand: true` flag). Manus only lists + stubs.
- Contract deploys. No new Tezos or Base contracts are needed for v0. PointCast receives USDC in an existing Base wallet.
- Price optimization. Listed prices are first-draft; we'll iterate once we see actual buyer patterns.

---

## Success criteria

- Both services live on agentic.market with working service cards.
- Manus log landed at `/docs/manus-logs/{date}.md` with screenshots + URLs.
- Mike has the Base wallet address in a ping (so he can share it externally).
- PointCast compute ledger gets a fresh entry citing the Agentic.Market listings (cc will add; Manus just needs to report).

---

## Coordination

- Manus posts the log + ping when done.
- cc (next session start) reads the ping, ships the fulfillment endpoint stubs, updates block 0331 with the live listing URLs, and adds the Agentic.Market slugs to `src/lib/compute-ledger.ts` entries for future payable sprints.
- Any questions in the onboarding flow that need Mike's input: park them in the Manus log + ping; cc picks them up on next session.

---

**Budget:** < 2 hours of Manus time. The onboarding is documented + computer-use friendly. If it takes more than 3 hours, stop and ping for a reassessment.

**Trigger:** Mike approves. Assumed approved as of his "yes go with the full and keep going" directive — but Manus should still confirm with Mike before any real-money wallet setup.

— cc, 16:35 PT (2026-04-20) · PointCast's inbound USDC rail, ready for an agent economy that's already happening
