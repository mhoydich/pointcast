# Ethereum lottery landscape — research + PointCast v0

**Filed by:** cc, 2026-04-21 PT (branch: `manus/collab-paths-2026-04-21`)
**Trigger:** Mike chat 2026-04-21 PT: *"yah and then another lottery app, publish, tho this one connected to etherum"*
**Purpose:** Scan the 2026 Ethereum-ecosystem lottery landscape. Identify empty territory. Scope a v0 lottery that is distinguishable from PointCast's existing **Prize Cast** (Tezos, no-loss, SmartPy) and from every currently-shipped Ethereum competitor. Sister artifact: `docs/briefs/2026-04-21-compute-lotto-spec.md`. Dispatched a live-web research agent (10 topical queries, 18 tool uses, ~3 minutes).

---

## 1. The category shape in 2026

**PoolTogether v5** is the architecture reference. Live on Ethereum mainnet + Optimism + Arbitrum + Base. ZkSync + Scroll underway. ~88k wallets, $15–18M TVL (plateaued, not compounding). V5 innovations: **per-depositor prize hooks** (callback on win), **Vault Booster** (third-party prize juicing), **PrizeVaultFactory** (any ERC4626 yield source becomes a prize vault in one tx). The no-loss narrative is mature.

Sources: [defillama](https://defillama.com/protocol/pooltogether-v5) · [PoolTogether v5 docs](https://dev.pooltogether.com/protocol/design/) · [crypto-adventure review](https://cryptoadventure.com/pooltogether-review-2026-prize-savings-v5-vaults-yield-sources-and-risks/)

**Megapot** is the new consumer-grade lottery that actually works on Base. Daily ~$1M jackpot in USDC, $1 tickets, 1-in-4 consolation-tier odds, players from 124 countries. March 2026: raised **$5M pre-seed led by Dragonfly**. LP-backed prize pool (depositors = house). The first Ethereum lottery a non-crypto user could plausibly use.

Sources: [megapot.io](https://megapot.io) · [Fortune on $5M raise](https://fortune.com/2026/03/26/exclusive-megapot-raises-5-million-to-create-a-crypto-powered-global-lottery/) · [Megapot docs](https://docs.megapot.io/)

**Azuro** is prediction-market infrastructure (~$250M lifetime bet volume, 30+ apps). The line between prediction markets and lotteries blurs under thin liquidity, but Azuro itself is plumbing — Polymarket + Kalshi own the consumer surface. Prediction markets crossed **$75B volume in 2026** as a category.

Sources: [azuro.org](https://azuro.org/) · [Messari Azuro profile](https://messari.io/project/azuro-protocol)

**Chainlink VRF v2.5** is the default randomness in 2026. Every major EVM. Cross-chain composition via Chainlink **CCIP v1.5** (mainnet 2026, supports EVM zkRollups). LiquidLottery on Hyperliquid sources VRF on Base via CCIP relay — the template for cross-chain lottery composition. Do not roll your own randomness.

Sources: [chainlink VRF docs](https://docs.chain.link/vrf) · [chainlink VRF](https://chain.link/vrf)

## 2. Three empty territories

Direct from the scan:

**2.1 — Nouns-aesthetic lottery on Ethereum does not exist.** Searches for "nounish lottery" / "CC0 raffle" return state-lottery pages and nothing in the Nouns ecosystem running a prize pool as a first-class product. Lil Nouns, Builder subforks, governance experiments — none ship Nouns-goggled lottery UI. Genuinely open lane for anyone with the visual system already built.

**2.2 — Worldchain + World ID lottery does not exist.** World Chain is live, 15M+ verified humans across 160 countries, 300+ Mini Apps (Kalshi, Worldle, concert ticketing) — **no flagship lottery has shipped despite the World Developer Program paying retroactive funding ($300K program + $1M WLD retro pool)**. A one-ticket-per-human lottery is the most defensible honest-lottery shape possible. Bots can't farm it.

Sources: [World blog](https://world.org/blog/announcements/the-new-world-app-secure-chat-global-payments-and-mini-apps-for-everyone) · [world.org/retro](https://world.org/retro) · [World ID v2026 upgrade](https://www.crowdfundinsider.com/2026/04/274114-world-network-rolls-out-upgraded-world-id-protocol-and-expands-proof-of-human-partnerships-across-ai-business-ecosystems/)

**2.3 — x402-native / agent-participant lottery does not exist.** x402 (Coinbase-born, Linux Foundation April 2026, Google+Visa+Stripe+AWS+Circle backing) has processed 100M+ payments since May 2025; agentic commerce at **$8B transaction volume in 2026**. No lottery lets agents legitimately play with differentiated prize rails. LiquidLottery has cross-chain VRF but no agent layer.

Sources: [x402.org](https://www.x402.org/) · [Invezz on Agentic.Market](https://invezz.com/news/2026/04/21/coinbase-backed-x402-launches-agentic-market-to-power-ai-agent-services/)

## 3. Base is the active chain

Megapot ($1M daily), Internet Token (~$2.4M in prizes since March 22, weekly grand prize ~$32K ETH+INT + $106K NFT prizes), PoolTogether v5 Base deployment, constellation of Farcaster Mini App micro-raffles. Throughput + low fees + Coinbase onramp + Farcaster distribution = right chain for lottery UX. **Optimism is second. Mainnet only for prestige.**

Sources: [DL News on INT](https://www.dlnews.com/articles/defi/internet-token-pays-24-million-in-prizes-since-march-22/) · [Base getting-started Frames](https://blog.base.org/getting-started-with-farcaster-frames-on-base)

## 4. Three concrete v0 shapes for PointCast

Each shippable in 1 week. Distinct from Prize Cast (Tezos, humans, no-loss savings).

### Shape A — **Nounscast** · Nouns-aesthetic weekly raffle on Base, Farcaster-Frame native
- **Chain:** Base.
- **Pitch:** A Nouns-goggled $1 weekly raffle that lives as a Farcaster Mini App.
- **Gap filled:** §2.1 (Nouns-aesthetic lottery on Ethereum doesn't exist).
- **Contracts:** `NouncastRaffle.sol` (VRF-drawn, ~200 lines) + a minimal winner-trophy ERC721. Yearn USDC vault for yield during the week.
- **Reuses:** Nouns CC0 art library, blue-hour OKLCH design system, presence DO live counter.
- **~5 build-days.** Safest hit.

### Shape B — **Human Draw** · One-ticket-per-human on World Chain
- **Chain:** World Chain.
- **Pitch:** Verified human → one free weekly ticket. Funded by yield on a shared USDC pot. Bot-proof by construction.
- **Gap filled:** §2.2 (Worldchain flagship lottery empty despite retro funding).
- **Contracts:** `HumanDraw.sol` with World ID nullifier-gated entry + VRF draw.
- **Reuses:** Presence DO (tracks verified humans viewing draw), compute ledger (logs the draw as a ledger entry for provenance), agent tools (conspicuously excluded — this is the human-only side).
- **~6 build-days.** Most eligible for external funding (World retro pool).

### Shape C — **Compute Lotto** · x402-native human + agent pool on Base (RECOMMENDED)
- **Chain:** Base.
- **Pitch:** First lottery where AI agents pay to play via x402 and can only win compute credits, not cash. Humans + agents in one pool with different prize rails.
- **Gap filled:** §2.3 (x402-native lottery doesn't exist). Plus §2.1 (Nouns visual layer comes along for free).
- **Contracts:** `ComputeLotto.sol` on Base — accepts 402 payments + direct USDC entries, tags tickets human/agent based on caller attestation, VRF draws two parallel winners per epoch. x402 facilitator endpoint at `pointcast.xyz/.well-known/x402/compute-lotto`.
- **Reuses:** compute ledger RFC v0 (gives agent prizes a redemption surface), presence DO agent roster, x402 awareness, Nouns goggles as shared ticket art across both prize classes.
- **~7 build-days.** **The lottery only PointCast can ship** — no other project has compute ledger + agent roster + Nouns visual layer + x402 posture simultaneously.

## 5. Recommendation: Shape C

Three reasons Compute Lotto is the v0 pick:

1. **Only PointCast-native option.** Shape A is a generic-polished hit anyone with Nouns art could ship. Shape B could be built by any World Ecosystem team with a wallet and a weekend. Shape C is the one that answers "why publish this from PointCast specifically" in one sentence — because it activates the compute ledger + agent layer that are otherwise sitting idle.
2. **Complements, doesn't duplicate.** Prize Cast is Tezos humans no-loss; Compute Lotto is Ethereum humans+agents speculative. Clear triad with the Daily Auction (Tezos humans on-chain). Three products, three corners of the chain × participant × mechanic grid.
3. **Builds the demand surface for two other PointCast primitives** — x402 and the compute ledger. Both have been discussed + scaffolded but neither has a live product pulling on them. Compute Lotto makes agent-prize redemption the first real reason to settle a ledger credit.

The build brief is at `docs/briefs/2026-04-21-compute-lotto-spec.md`. v0 spec covers: `contracts/v2/compute_lotto.sol` Solidity contract (~250 lines, Chainlink VRF draw, USDC entries + 402 agent entries, dual human/agent winner rails), `/lotto` page scaffold, x402 facilitator endpoint, agent-manifest, Base deploy script. Seven cc-days.

## 6. What v0 does NOT do

- **No cross-chain federation.** Single-chain Base. LayerZero/CCIP v1 alt; not v0.
- **No Farcaster Mini App.** `/lotto` page only in v0. Mini App is v0.2.
- **No Farcaster Frame-as-ticket.** Farcaster Frame distribution is v0.2.
- **No Worldchain version.** Separate product if ever shipped.
- **No yield-routing.** Prize pool starts sponsor-funded or treasury-seeded in v0; yield-routing is v0.3.
- **No in-contract agent attestation.** v0 uses the x402 gateway address as the agent marker (any tx routed through the facilitator = agent ticket). v1 can add cryptographic attestation.
- **No redemption of compute credits to a token or Nouns NFT.** v0 ledger credits are numeric entries; redemption surface is future work.
- **No on-chain compute-ledger merkle proof.** Credits live in a simple `mapping(address => uint256)` on the contract. v1 can add merkle verification for cross-site claims.

## 7. Honest uncertainty

- **[verify]** PoolTogether v5 TVL numbers are most-recent-available; April 2026 precision unverified.
- **[verify]** Megapot's "124 countries" is from the March 2026 raise coverage; current scale likely higher.
- **[verify]** INT weekly prize amounts (the $2.4M claim) are March 2026 vintage; confirm before citing in public copy.
- **[verify]** No Worldchain lottery exists — absence-of-evidence after four search queries; re-check the World Ecosystem directory before claiming empty territory publicly.
- **[verify]** x402's "100M+ payments since May 2025" is Coinbase + Linux Foundation marketing — triangulate against an independent source.

## 8. PointCast's existing inventory (relevant to Shape C)

On the current working branch:

- **`src/lib/auth/client.ts`** — existing auth helpers.
- **`src/components/WalletConnect.astro`** — wallet connect UI already scaffolded.
- **`src/pages/eth-legacy.astro`** — Ethereum-side page already exists. Implies at least some prior wagmi/viem thinking.
- **`contracts/v2/prize_cast.py`** — Tezos PLSA primitive, scaffold pending.
- **`contracts/v2/daily_auction.py`** — Tezos daily auction (just landed this session).
- **`src/data/contracts.json`** — contract registry; new `compute_lotto` entry lands in this ship.

A v0 Compute Lotto does not start from zero. The Ethereum wallet primitives exist. The compute-ledger concept is live. The x402 posture is already discussed. The Nouns visual system is site-wide.

## Source bibliography

All accessed 2026-04-21:

- https://defillama.com/protocol/pooltogether-v5
- https://dev.pooltogether.com/protocol/design/
- https://dev.pooltogether.com/protocol/reference/prize-vault/hookmanager/
- https://cryptoadventure.com/pooltogether-review-2026-prize-savings-v5-vaults-yield-sources-and-risks/
- https://megapot.io
- https://fortune.com/2026/03/26/exclusive-megapot-raises-5-million-to-create-a-crypto-powered-global-lottery/
- https://docs.megapot.io/
- https://azuro.org/
- https://messari.io/project/azuro-protocol
- https://zebpay.com/blog/top-10-crypto-prediction-markets-in-2026
- https://docs.chain.link/vrf
- https://chain.link/vrf
- https://hypepool.app/
- https://nouns.wtf/
- https://nftnow.com/guides/an-nft-every-day-a-guide-to-the-nouns-nft-project-dao-and-ecosystem/
- https://opensea.io/collection/first-nft-lottery
- https://theinternettoken.com/
- https://www.dlnews.com/articles/defi/internet-token-pays-24-million-in-prizes-since-march-22/
- https://blog.base.org/getting-started-with-farcaster-frames-on-base
- https://www.freezerverse.com/post/the-best-apps-on-base-in-2026
- https://world.org/blog/announcements/the-new-world-app-secure-chat-global-payments-and-mini-apps-for-everyone
- https://world.org/retro
- https://docs.world.org/world-chain
- https://www.crowdfundinsider.com/2026/04/274114-world-network-rolls-out-upgraded-world-id-protocol-and-expands-proof-of-human-partnerships-across-ai-business-ecosystems/
- https://defillama.com/protocol/frax-ether
- https://docs.frax.finance/frax-ether/overview
- https://www.x402.org/
- https://invezz.com/news/2026/04/21/coinbase-backed-x402-launches-agentic-market-to-power-ai-agent-services/

---

— filed by cc, 2026-04-21 PT. Fifth research memo of the session (earlier: frontier scan, agent-games, tank, Tezos Nouns Builder). Sister build brief: `docs/briefs/2026-04-21-compute-lotto-spec.md`. Editorial block: 0400.
