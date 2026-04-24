# Spec brief — Compute Lotto v0 (Base, x402 + USDC, humans win USDC, agents win compute credits)

**Filed:** 2026-04-21 PT
**Author:** cc
**Source:** Mike chat 2026-04-21 PT *"yah and then another lottery app, publish, tho this one connected to etherum"* → research memo `docs/research/2026-04-21-ethereum-lottery.md` §5 picked this as the v0. The research agent found three empty territories: Nouns-aesthetic lottery, Worldchain flagship, and x402-native agent-participant. Shape C combines #3 with #1 (Nouns visual layer comes free) and is the only one that answers "why publish this from PointCast specifically" with PointCast's existing primitives — compute ledger RFC v0, agent roster, x402 posture, Nouns art.
**Audience:** cc. Self-assigned build spec. ~7 cc-days for v0 (3 contract + VRF, 1 x402 facilitator, 1 page, 1 deploy, 1 buffer).

---

## Goal

Ship a weekly lottery on Base where:
1. Humans pay **$1 USDC** per ticket via the `/lotto` page (wagmi/viem connect).
2. AI agents pay via **x402** through the facilitator endpoint `pointcast.xyz/.well-known/x402/compute-lotto` — any tx routed through the facilitator gets tagged as an agent ticket.
3. Each 7-day epoch draws **two winners independently via Chainlink VRF**:
   - One **human-class winner** receives the pooled USDC (minus treasury cut).
   - One **agent-class winner** receives a **compute credit** on the contract's ledger, redeemable in a future on-chain surface.
4. Nouns-goggled ticket art renders identically for both prize classes.

**Distinct from Prize Cast** (Tezos, humans, no-loss savings): Compute Lotto is Ethereum, mixed species, speculative.

## v0 scope

### Contracts (single Solidity file)

`contracts/v2/compute_lotto.sol` (~250 lines, Solidity 0.8.24+, OpenZeppelin + Chainlink VRF v2.5):

```solidity
interface IComputeLotto {
    // ── Views ────────────────────────────────────────────────────
    function currentEpoch() external view returns (uint256);
    function epochEndsAt(uint256 epoch) external view returns (uint256);
    function ticketCount(uint256 epoch, TicketClass class) external view returns (uint256);
    function userTicketCount(uint256 epoch, address user) external view returns (uint256);
    function userClass(uint256 epoch, address user) external view returns (TicketClass);
    function computeCreditsOf(address holder) external view returns (uint256);
    function prizePoolHuman(uint256 epoch) external view returns (uint256);
    function prizePoolAgent(uint256 epoch) external view returns (uint256);

    // ── Entry ────────────────────────────────────────────────────
    /// Buy tickets as a human. USDC transferFrom. 1 USDC = 1 ticket.
    function buyTicket(uint256 count) external;

    /// Buy tickets on behalf of an agent. Called by the x402 facilitator
    /// after verifying the HTTP 402 payment receipt. Auth: onlyFacilitator.
    /// USDC has already been collected at the facilitator layer; this
    /// call just registers the tickets + accumulates the agent-pool USDC.
    function buyTicketForAgent(address agentAddr, uint256 count, uint256 usdcAmount) external;

    // ── Settlement ───────────────────────────────────────────────
    /// Request VRF after epochEndsAt(currentEpoch). Anyone can call.
    /// Caller receives a small keeper tip from the treasury cut.
    function settleEpoch() external;

    /// VRF callback — Chainlink-only. Picks two winners (one per class),
    /// routes human USDC prize, credits agent ledger balance.
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal;

    /// Compute-credit holders redeem via signed voucher (future work).
    /// v0: credits accumulate on-contract; redemption is off-chain via
    /// a separate RedemptionVoucher contract that lands with compute
    /// ledger v1.
}

enum TicketClass { HUMAN, AGENT }
```

**Storage:**
- `IERC20 immutable usdc` — Base USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`).
- `IVRFCoordinatorV2_5 immutable vrf` + `subscriptionId` + `keyHash`.
- `address facilitator` — x402 facilitator multisig address (admin-settable).
- `address treasury` — admin.
- `uint256 currentEpoch` — monotonic counter.
- `uint256 epochDurationSec` — 604800 (7d).
- `uint256 treasuryBps` — 500 (5% default, admin-settable, capped at 1000).
- `uint256 keeperTipBps` — 50 (0.5% default, capped at 200).
- `mapping(uint256 => EpochState) epochs` — per-epoch counters + ticket lists.
- `mapping(address => uint256) computeCredits` — agent ledger.

**Events:**
- `TicketBought(epoch, user, class, count, usdc)`
- `EpochSettled(epoch, humanWinner, humanPrize, agentWinner, agentCredits, settledBy)`
- `ComputeCreditsAwarded(epoch, agent, amount)`

### Frontend

- **`src/pages/lotto.astro`** (new) — the live page. Two modes: "not yet deployed" (placeholder linking memo/brief/source) and "live" (current epoch, time left, pool size per class, top entrants, bid button, past winners). Reuses `WalletConnect.astro` from the branch. wagmi + viem dynamic-imported on first interaction.
- **`src/lib/lotto.ts`** (new) — types + contract-read helpers (viem `readContract`), USDC approve + ticket-buy builder, VRF settle button.
- **`src/pages/lotto.json.ts`** (new) — agent manifest `pointcast-lotto-v0`. Works in both origination states.

### x402 facilitator

**`functions/api/x402/compute-lotto.ts`** (Pages Function):
- Accepts HTTP 402 payment headers per x402 spec.
- On valid payment: calls `buyTicketForAgent(agentAddr, count, usdcAmount)` on the lotto contract from a treasury-funded relayer key.
- Returns the receipt + epoch + ticket-count to the caller.
- CORS open for cross-origin agent access.

**`public/.well-known/x402/compute-lotto.json`** — static x402 manifest describing the endpoint's price, schema, and response shape. Enables Agentic.Market listing discovery.

### Config + deploy

- **`src/data/contracts.json`** — add `compute_lotto.base` entry (empty string until deployed).
- **`scripts/deploy-compute-lotto-base-sepolia.mjs`** — Foundry or viem deploy to Base Sepolia (testnet).
- **`scripts/deploy-compute-lotto-base-mainnet.mjs`** — mainnet deploy with mainnet USDC + VRF subscription.

## v0 NOT in scope

- **No cross-chain bridging.** Base only.
- **No Farcaster Mini App / Frame.** `/lotto` page only. Frame is v0.2.
- **No Worldchain version.** Separate product.
- **No yield-routing.** Prize pool starts sponsor-funded or treasury-seeded; yield is v0.3.
- **No cryptographic agent attestation in-contract.** x402 facilitator address marks agent tickets; any improvement is v1.
- **No compute-credit redemption UI.** Credits accumulate on-contract; redemption is future work.
- **No merkle-proven cross-site compute-ledger claims.** v0 credits are local; federation is v1.
- **No on-chain governance.** Admin is Mike's EOA in v0; multisig post-v0.

## cc's picks on the open questions

Same pattern as the Tezos Nouns Builder ship — cc picks defaults, Mike overrides at deploy time if needed.

1. **Chain: Base.** Research §3 confirmed Base is where lottery UX wins in 2026.
2. **Entry price: $1 USDC per ticket.** Matches Megapot's $1 norm and keeps fees negligible relative to entry.
3. **Epoch length: 7 days (weekly).** Daily is Megapot's territory; weekly is more defensible for a small-volume start and easier to keeper-settle.
4. **Facilitator: cc picks a fresh relayer key on deploy.** Mike rotates to his address via `setFacilitator()` after verifying the deploy.
5. **Compute credit redemption: deferred.** v0 accumulates credits on-contract as a simple uint; redemption interface ships with compute ledger v1.

## Files to ship (v0)

### New

- `contracts/v2/compute_lotto.sol` — the contract.
- `contracts/v2/compute_lotto.test.sol` — Foundry tests (or hardhat; pick whichever is already in repo — if neither, stub `forge test` suite).
- `src/pages/lotto.astro` — main page.
- `src/pages/lotto.json.ts` — agent manifest.
- `src/lib/lotto.ts` — TS helpers.
- `functions/api/x402/compute-lotto.ts` — x402 facilitator endpoint.
- `public/.well-known/x402/compute-lotto.json` — x402 manifest.
- `scripts/deploy-compute-lotto-base-sepolia.mjs`.
- `scripts/deploy-compute-lotto-base-mainnet.mjs`.

### Modified

- `src/data/contracts.json` — add `compute_lotto` entry.
- `src/content/blocks/0400.json` — editorial ship announcement (this session).

## Acceptance criteria (v0)

- [ ] `compute_lotto.sol` compiles on Solidity 0.8.24.
- [ ] Foundry/hardhat tests pass: human buy → agent buy → settle → VRF callback → human prize routed, agent credits awarded.
- [ ] Contract deploys cleanly to Base Sepolia.
- [ ] `/lotto` page renders live state from the testnet contract via viem.
- [ ] x402 facilitator endpoint accepts a mock payment + registers an agent ticket on-chain.
- [ ] Contract deploys to Base mainnet; first epoch receives ≥ 1 human ticket via Beacon-less wagmi flow.
- [ ] `/lotto.json` returns current epoch state with CORS open.
- [ ] Editorial block 0400 + ledger entry + sprint recap shipped alongside.

## Open questions for Mike

1. **USDC subscription / VRF funding.** Who pays the Chainlink subscription (admin LINK deposit on Base)?
2. **Relayer key for x402 facilitator.** OK to use a deploy-time throwaway, or does Mike want a Cloudflare secret from the start?
3. **Treasury cut — 5% default OK?** Or lower for launch-optics reasons?
4. **Compute credit exchange rate.** Each agent ticket accumulates X credits where X is the USDC price equivalent. 1:1 (credit = USDC equivalent) or a multiplier?
5. **Launch epoch start time.** First UTC Sunday after mainnet deploy, or specific date Mike picks?

## Build ordering (7 cc-days)

1. Read `src/components/WalletConnect.astro` + any existing viem/wagmi helpers on this branch. (0.5d)
2. `compute_lotto.sol` — storage + entry functions + VRF integration. (2d)
3. Foundry tests covering the full acceptance-criteria loop. (1d)
4. x402 facilitator Pages Function + .well-known manifest. (1d)
5. `/lotto.astro` + `/lotto.json.ts` + `src/lib/lotto.ts`. (1.5d)
6. Base Sepolia deploy + first-epoch live test. (0.5d)
7. Base mainnet deploy + monitoring. (0.5d)

**Total:** 7 cc-days.

## v0.2 and beyond

- Farcaster Mini App wrapping `/lotto`. ~2d.
- Compute-credit redemption UI + on-contract merkle claim. ~3d.
- Federated compute-ledger mirror of agent wins (per compute-ledger RFC v0). ~2d.
- Cross-chain (Optimism/Worldchain) mirrors via LayerZero or CCIP. Aspirational.
- Yield-routing on the USDC pool (Yearn v3 vault, routed back at settle). ~2d.

## Why this is the right v0

Three reasons:

1. **It's the lottery only PointCast can ship.** The agent-prize rail is unique — no other project has compute ledger + agent roster + x402 posture under one roof. The research agent confirmed that territory is empty.
2. **It complements rather than duplicates.** Prize Cast is Tezos humans no-loss. Compute Lotto is Ethereum humans+agents speculative. Different chain, different participant class, different mechanic. Three products form a clear grid.
3. **It makes two dormant primitives active.** x402 has been discussed + scaffolded but has no live product pulling on it. The compute ledger RFC v0 exists as a spec with no consumer surface. Compute Lotto gives both their first real demand.

---

— filed by cc, 2026-04-21 PT. Build starts when Mike says go. Sister research memo + editorial block 0400 ship alongside.
