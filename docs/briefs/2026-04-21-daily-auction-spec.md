# Spec brief — Tezos Nouns Builder v0 (daily-auction contract wrapping Visit Nouns FA2)

**Filed:** 2026-04-21 PT
**Author:** cc
**Source:** Mike chat 2026-04-21 PT *"tezos nouns builder"* → research memo `docs/research/2026-04-21-tezos-nouns-builder.md` §7 picked this as the v0. The missing primitive on Tezos is a **self-perpetuating daily-auction contract** — no other implementation exists anywhere on the chain. PointCast already has Visit Nouns FA2 live on mainnet, so the contract just needs to settle + mint + restart.
**Audience:** cc. Self-assigned build spec. ~7 cc-days for v0 (3 contracts, 2 frontend, 1 deploy, 1 buffer).

---

## Goal

Ship a self-perpetuating daily-auction contract on Tezos mainnet that:
1. Runs a 24-hour English auction for the next Noun seed from Visit Nouns FA2.
2. On settlement, auto-mints the winning bidder a Visit Nouns token + sends proceeds to a 2-of-3 multisig treasury.
3. Starts the next day's auction automatically.
4. Matches Nouns DAO's cultural pattern as close as SmartPy 0.24 permits.

No on-chain governor contract in v0. No no-code builder UI in v0 (that's v0.2). No Etherlink deployment in v0 (that's v1 alt).

## Contracts

### `contracts/v2/daily_auction.py` (new, ~200 lines SmartPy)

**Storage:**
```python
@sp.record
class AuctionState:
  current_noun_id: sp.nat         # 0-1199, the Noun seed for the active auction
  highest_bidder: sp.address      # tz or KT address of current top bid
  highest_bid_mutez: sp.mutez     # current top bid
  starts_at: sp.timestamp         # unix ts of auction start
  ends_at: sp.timestamp           # unix ts of scheduled end
  reserve_price_mutez: sp.mutez   # minimum first bid; admin-settable, default 0
  min_increment_bps: sp.nat       # 500 = 5% over current top bid, admin-settable
  extend_window_sec: sp.nat       # 600 = 10min; if bid lands in last 10min, extend
  extend_by_sec: sp.nat           # 900 = 15min; extend auction by this much on late bid
  duration_sec: sp.nat            # 86400 = 24h default
  settled: sp.bool                # true after settle_and_create_next fires

  visit_nouns_fa2: sp.address     # Visit Nouns FA2 contract address
  treasury: sp.address            # multisig that receives proceeds
  keeper_tip_bps: sp.nat          # 50 = 0.5% paid to whoever settles (mimics Nouns keeper)

  admin: sp.address               # Mike
  paused: sp.bool                 # admin-only kill-switch
```

**Entrypoints:**

- **`bid()` payable** — places a bid. Must be at least `max(reserve_price, current_highest + min_increment_bps%)`. If accepted: refund previous highest bidder (send their mutez back), update highest_bidder + highest_bid. If bid lands inside `extend_window_sec` of `ends_at`, push `ends_at += extend_by_sec` (soft-close). Reverts if `settled` or `paused`.
- **`settle_and_create_next()` public, no payment** — callable by anyone after `ends_at`. Transfers `highest_bid_mutez × (1 - keeper_tip_bps/10000)` to `treasury`; sends `keeper_tip_bps/10000` of the bid to `sp.sender` as reward. Calls `visit_nouns_fa2.mint_noun(current_noun_id)` targeted at `highest_bidder` (requires Visit Nouns FA2 to expose a `mint_for(noun_id, to)` admin entrypoint OR auction contract is whitelisted as a minter — **see §Integration note below**). Marks current auction `settled = true`. Immediately creates the next auction: `current_noun_id = (current_noun_id + 1) mod 1200`, resets `highest_bidder = NULL`, `highest_bid_mutez = 0`, `starts_at = now`, `ends_at = now + duration_sec`, `settled = false`. Emits an event.
- **`set_reserve_price(mutez)`** — admin only.
- **`set_min_increment(bps)`** — admin only. Capped at 2000 (20%).
- **`set_duration(secs)`** — admin only. Capped to [1h, 7d].
- **`set_extend_window(secs, by_secs)`** — admin only. Both capped to duration/2.
- **`set_treasury(addr)`** — admin only.
- **`set_admin(addr)`** — admin only.
- **`set_paused(bool)`** — admin only. While paused, `bid()` reverts. `settle_and_create_next()` still works (so no one's bid is stuck).
- **`sweep_stuck_bid(to)`** — admin only, only if `paused` for > 30 days. Recovery path.

**Integration with Visit Nouns FA2:**

The research memo flagged this as the load-bearing unknown. Two cleanest options:

**Option A (preferred): Add a `mint_for(noun_id, to)` admin entrypoint to `visit_nouns_fa2.py`.** Only callable by addresses in a `minters: sp.big_map(sp.address, sp.bool)` whitelist. Auction contract is added to the whitelist on origination. On settlement, auction calls `mint_for(current_noun_id, highest_bidder)`.

**Option B:** Auction contract holds a small tez float, calls the existing public `mint_noun(noun_id)` while the *contract itself* is `sp.sender`, then `transfer(auction_addr → highest_bidder)` via FA2 standard transfer. Requires auction contract to have FA2-transfer permissions and to pay mint gas from float.

**Recommendation: Option A.** Cleaner, avoids the float, lets auction cleanly remain bidder-agnostic. Requires a small edit to Visit Nouns FA2 + a `set_minter(addr, enabled)` admin entrypoint + re-origination? **[verify: can we upgrade Visit Nouns in place?]** If upgrade isn't possible, Option B is the clean fallback — about 20 more lines of SmartPy but no Visit Nouns changes.

### Treasury multisig

Reuse an existing Tezos 2-of-3 multisig if available in the repo; else originate a fresh one. Signers in v0: Mike (tz2), a trusted party (tz2), cc-infrastructure address (tz2). 2-of-3 required for any outflow.

No new SmartPy file unless needed. **[verify: grep `contracts/` for existing multisig.py]**

## Frontend

### `src/pages/auction.astro` (new)

Layout:
- **Hero row:** current Noun SVG (from `noun.pics/{current_noun_id}.svg`), tokenId label, auction countdown, top bid + bidder address truncated.
- **Bid row:** input (mutez + conversion preview to XTZ), bid button, "Connect wallet" if no Beacon session, "Place bid" if connected.
- **History:** last 20 auctions — seed, winner, settled bid, tx link to tzkt.io. Reads from TzKT API.
- **Settle button:** appears when `now > ends_at && !settled`. Anyone can click it; explains the keeper tip.
- **Explainer sidebar:** short text on what daily auction + Visit Nouns integration means + link to `/nouns` + link to research memo + RFC.

State:
- Polls auction contract storage every 15s via `TEZOS_RPC` or TzKT.
- Beacon wallet via `@taquito/beacon-wallet`.
- Bid amount stored in localStorage for draft preservation.

### `src/lib/auction.ts` (new)

- Types: `AuctionState`, `AuctionEvent`.
- `connectBeacon()` — wraps the existing Taquito pattern from `/beacon` or `/profile`.
- `fetchAuctionState(contractAddr)` — TzKT-first, RPC fallback.
- `fetchAuctionHistory(contractAddr, limit=20)` — parses tzkt events.
- `placeBid(amountMutez)` — Beacon → sign → send. Returns op hash.
- `settleAuction()` — public settle call. Returns op hash.

### Update `src/pages/nouns.astro`

Add a top section linking to `/auction` as the flagship primitive. Update the FAQ with one more entry: "Does Visit Nouns have a daily auction?" → "Yes, as of [ship date]. One auction runs continuously at /auction. Proceeds flow to a 2-of-3 multisig treasury."

### Optional: `src/pages/auction.json.ts`

Agent manifest — schema `pointcast-auction-v0`. Returns current state + history + tool list. Enables future x402 agent-bidder endpoint (v1 scope, not v0).

## WebMCP tools (v0 adds 3)

Added to `src/components/WebMCPTools.astro`:

- **`pointcast_auction_observe()`** — returns current auction state: noun_id, top bid, bidder, time left, history. Read-only.
- **`pointcast_auction_history(limit=10)`** — returns last N settled auctions.
- **`pointcast_auction_bid_preview(amount_mutez)`** — returns the minimum-valid bid at this moment (given reserve + min_increment) + estimated gas. **Does NOT actually bid** (v0 keeps agent-bidding out of scope; v1 wires x402). Agent returns the preview and the human visits /auction to place the bid manually.

## Files shipped (v0)

### New
- `contracts/v2/daily_auction.py` — the contract.
- `contracts/v2/daily_auction_test.py` — SmartPy unit tests (at minimum: valid bid, outbid refund, soft-close, settlement, next-auction-start, reserve enforcement, pause behavior).
- `src/pages/auction.astro` — the live UI.
- `src/pages/auction.json.ts` — agent manifest.
- `src/lib/auction.ts` — shared helpers.
- `scripts/deploy-daily-auction-ghostnet.mjs` — ghostnet deploy script (match existing `scripts/deploy-*-ghostnet.mjs` pattern).
- `scripts/deploy-daily-auction-mainnet.mjs` — mainnet deploy script.
- `docs/sprints/2026-04-XX-daily-auction-v0.md` — sprint recap when shipped.

### Modified
- `contracts/visit_nouns_fa2.py` — if Option A integration is chosen: add `minters` whitelist + `set_minter` + `mint_for` entrypoint. **[verify upgrade path first.]**
- `src/pages/nouns.astro` — hero link + FAQ update.
- `src/pages/play.astro` — optional card linking /auction (not a game per se, but discoverable).
- `src/components/WebMCPTools.astro` — add 3 auction tools.
- `src/lib/compute-ledger.ts` — entry for the v0 ship (signature: heavy).

## Acceptance criteria (v0)

- [ ] `daily_auction.py` compiles cleanly in SmartPy 0.24.
- [ ] SmartPy unit tests pass for bid / outbid / soft-close / settle / pause / reserve.
- [ ] Contract originates successfully to ghostnet; first auction receives a test bid; settlement mints a Visit Nouns token + transfers proceeds to a ghostnet multisig.
- [ ] Contract originates to **mainnet**; first auction accepts ≥ 1 human bid via the `/auction` page.
- [ ] Settlement mints the winning Visit Nouns token to the bidder's wallet (visible on tzkt.io).
- [ ] New auction auto-starts for the next Noun seed.
- [ ] `/auction` page renders live state; countdown works; bid submits via Beacon; settle works.
- [ ] `pointcast_auction_observe` WebMCP tool returns live state in Chrome Canary.
- [ ] Compute-ledger entry recorded; cc-voice editorial block announces the ship.

## Non-goals (v0)

- **No on-chain governor.** Treasury is a 2-of-3 multisig for v0. Governor contract is v0.2.
- **No no-code builder UI.** Just one hard-coded auction wrapping Visit Nouns. A spawn form is v0.2.
- **No x402 agent-bidder endpoint.** Observation tools only; v1 wires agent bidding.
- **No DRUM bid token.** XTZ only in v0. DRUM is a v1 extension for PointCast-branded DAOs.
- **No Etherlink deployment.** L1 SmartPy only. Etherlink is v1 alt.
- **No Prize Cast integration.** Auction proceeds flow 100% to multisig in v0. v1 skims 1% to Prize Cast.
- **No trait editor.** Reuse noun.pics SVGs; same visual identity as Visit Nouns.
- **No secondary-market extensions.** objkt/teia pick up Visit Nouns natively; no changes needed.

## Risks + mitigations

- **Auction griefing with tiny bids.** Mitigation: admin-settable `reserve_price_mutez`; 5% minimum increment. Starts at 0 for gas-only vibes; admin can bump if griefing surfaces.
- **Keeper-tip arbitrage.** Keeper tip is bounded by `keeper_tip_bps` cap (cap at 100 = 1% default; admin can tune). Not a value-extraction vector at these sizes.
- **Settlement doesn't fire.** No one is incentivized to call `settle_and_create_next`. Mitigation: keeper tip. If still unfired after 24h past `ends_at`, admin can call.
- **Refund griefing.** Outbid refunds go via contract op; if the previous bidder's address doesn't accept (contract with no default entrypoint), the op fails. Mitigation: keep refunds as direct mutez transfer (standard Tezos behavior). A malicious contract-bidder could lock the auction by rejecting its own refund. Mitigation option: queue refunds in storage; bidder withdraws on their own time. **Choose before v0 ship.**
- **Visit Nouns upgrade path.** If Option A requires re-originating Visit Nouns FA2, holders of existing Visit Nouns would need to be aware (but open-supply nature means no "sold out" concept; original contract keeps working, new one is the auction-integrated one). **[verify: is there an upgrade proxy path for Visit Nouns FA2 that preserves state?]**
- **SmartPy 0.24 quirks.** Treat SmartPy as the bottleneck: expect 1 day of "why is the compiler saying X" debugging. Build in the 1-day buffer.

## Open questions for Mike (5)

1. **Option A or B for Visit Nouns integration?** A is cleaner but needs a Visit Nouns FA2 edit + possibly re-origination. B is self-contained in the auction contract but has minor FA2-transfer + gas-float complexity. cc leans A if upgrade is possible, B otherwise.
2. **What's the 24h cycle time?** UTC midnight (clean, same as Ethereum Nouns)? Or something PointCast-flavored like 12:00 PT ("noon in El Segundo")? cc leans UTC midnight for legibility.
3. **First Noun seed to auction** — start at 0 (next seed in sequence) or jump to a specific noggle-glasses-bearing one for aesthetic launch? cc leans 0.
4. **Multisig signers** — Mike + ? + ?. Need to pick two other tz2 addresses. (cc-infrastructure is a possible signer if we stand one up on Cloudflare-hosted signing, but a human signer is probably better.)
5. **Do we call it "Visit Nouns Auction" or ship it with a new brand name?** (e.g. "PointCast DAO" or "Tezos Nouns DAO"). cc leans *"Visit Nouns Auction"* for v0 — keep continuity with the live contract — and reserve new branding for v0.2 when the spawner lets anyone stand up their own DAO.

## Build ordering (7 cc-days)

1. Read `contracts/visit_nouns_fa2.py` end-to-end. Confirm upgrade path for Option A or B feasibility. (0.5 day)
2. `contracts/v2/daily_auction.py` SmartPy — storage + bid + settle. (1.5 days)
3. SmartPy unit tests for all entrypoints. (1 day)
4. Ghostnet origination + live-bid test against Visit Nouns ghostnet deployment. (0.5 day)
5. `src/pages/auction.astro` + `src/lib/auction.ts` + Beacon integration + TzKT history. (1.5 days)
6. `/auction.json.ts` agent manifest + 3 WebMCP tools. (0.5 day)
7. Mainnet origination + first-day auction monitoring. (0.5 day)
8. Editorial block + ledger entry + sprint recap. (0.5 day)
9. Buffer. (0.5 day)

**Total: 7 cc-days.**

## v0.2 follow-up — one month

No-code spawner UI. Mike picks DAO name + trait library + auction duration + multisig signers in a form. Frontend originates three contracts in a single Beacon batched op: FA2 token, daily-auction, treasury. Homebase Lambda DAO wired as optional governance layer. Directory of spawned DAOs at `pointcast.xyz/builder`.

## v1 — horizon

- Etherlink parallel deployment (fork BuilderOSS Solidity).
- x402 agent-bid endpoint + Agentic.Market listing.
- Prize Cast integration (1% yield → weekly PLS pool).
- DRUM bid token for PointCast-branded DAOs.
- `/compute.json` mirrors vote events (requires on-chain governor in v0.2 first).
- Agent-caretaker DAOs.

---

— filed by cc, 2026-04-21 PT. Build starts when Mike answers the 5 open questions (or says "cc picks"). Ships alongside the research memo + editorial block.
