# Tezos Nouns Builder — research pass + v0 scope

**Filed by:** cc, 2026-04-21 PT (branch: `manus/collab-paths-2026-04-21`)
**Trigger:** Mike chat 2026-04-21 PT: *"tezos nouns builder"*
**Purpose:** Scan the 2026 landscape for Nouns Builder–class tooling on Tezos, identify the missing primitives, and scope a v0 shippable in one week by a two-person team (Mike + cc). Dispatched a live-web research agent (10 topical queries, 25 tool uses, ~3.5 minutes). Sister document: build brief at `docs/briefs/2026-04-21-daily-auction-spec.md`.

---

## 1. The reference architecture

**Nouns Builder is the category standard.** Now maintained by **BuilderOSS** (spun out of Zora to BuilderDAO). Monorepo at `github.com/BuilderOSS/nouns-builder`. Deployed on Ethereum L1 + Base L2 — `nouns.build/dao/base/...` routes confirm live Base deployments. Last public dashboard stat: 66 DAOs / 207 ETH auctioned as of Jan 2023; 2026 count is probably in the low-to-mid hundreds, no public dashboard surfaces it [verify]. The Nouns-pattern — Token / Auction / Governor / Treasury / Metadata-Renderer, proxied behind a Manager — remains the canonical stack. MIT license; Solidity.

Sources: [github.com/BuilderOSS/nouns-builder](https://github.com/BuilderOSS/nouns-builder) · [nouns.build](https://nouns.build/) · [builderdao.substack.com](https://builderdao.substack.com/p/nouns-builder-recap-136)

## 2. The empty primitive on Tezos

**The daily-auction contract does not exist on Tezos.** Closest adjacent: objkt's English Auction at `KT18iSHoRW1iogamADWwQSDoZa3QkN4izkqj` (per-asset auctions, not daily, not self-rolling) and `byteblock-labs/tezos-english-auction` (SmartPy reference, single-lot). **Neither implements "when auction N settles, auto-mint token N+1 and start auction N+1."** That self-perpetuating loop is the Nouns primitive — and on Tezos it is unclaimed. **This is the single highest-leverage contract to ship.**

Sources: [tzkt.io objkt auction](https://tzkt.io/KT18iSHoRW1iogamADWwQSDoZa3QkN4izkqj/operations/) · [github.com/byteblock-labs/tezos-english-auction](https://github.com/byteblock-labs/tezos-english-auction)

## 3. Adjacent Tezos surface

**fxhash** remains the canonical generative-art stack on Tezos; uses transaction-hash as deterministic seed (same pattern as Nouns' `keccak(blockhash, nounId)`). In 2025-26 fxhash expanded multichain to Ethereum + Base, weakening Tezos-native gravity for generative. On-chain-SVG collections remain rare on Tezos; most fxhash pieces ship the render script on IPFS. FA2.1's on-chain views make a Nouns-style contract-rendered `tokenURI` feasible but storage pricing requires discipline.

**Homebase** is the Tezos DAO tooling reference (no-code DAO creation, tez-voting or FA2-voting, treasury, proposals). **Lambda DAOs** (arbitrary-action proposals via Michelson lambdas) landed in 2024. Homebase does not ship an auction-funded treasury — DAOs are typically seeded or token-distributed.

**FA2.1 (TZIP-26)** is in draft — as of April 2026, not finalized [verify]. Adds events, on-chain views, tickets, finite allowance. FA2 is sufficient for a Nouns clone today.

**No one is building a Tezos Nouns Builder.** Searched GitHub, Agora forum, Reddit `r/tezos` — no public prior port, no stalled fork, no abandoned repo. **Genuine empty slot, not a graveyard.**

Sources: [fxhash.xyz](https://www.fxhash.xyz/) · [tezos-homebase.io](https://tezos-homebase.io/) · [forum.tezosagora.org FA2.1](https://forum.tezosagora.org/t/fa2-1-fa3-its-time/3704) · [forum.tezosagora.org](https://forum.tezosagora.org/)

## 4. Etherlink — the leverage alt

**Etherlink is Tezos's EVM-compatible L2** — mainnet beta May 2024, 8.6M+ transactions, Ledger-native since Jan 2026. BuilderOSS Solidity contracts likely deploy with minimal changes [verify]. A direct Etherlink deployment is a "fork it, rebrand, ship" path that skips 80% of a SmartPy rewrite. Two honest framings:

- **L1 SmartPy path:** culturally on-brand with Tezos purists, objkt/teia community, CC0-generative-art audience. Ships from scratch.
- **Etherlink path:** faster to ship (3-4 days via Solidity fork), brings EVM composability (x402 agent bidders, Base-ecosystem bridging, Ledger-standard wallet) but lives in a different cultural slot.

**Recommendation:** L1 SmartPy for v0. Compounds with Visit Nouns FA2 already live on mainnet + Prize Cast scaffold (SmartPy) + the CC0-generative-art audience that already lives on objkt/teia. Etherlink is a credible v1 alt if Mike wants EVM composability fast.

Sources: [docs.etherlink.com](https://docs.etherlink.com/) · [etherlink.com](https://www.etherlink.com/) · [chainwire Etherlink Ledger](https://chainwire.org/2026/01/29/native-support-for-tezos-evm-compatibility-layer-etherlink-now-available-with-ledger/)

## 5. PointCast's existing inventory

What's already in the repo relevant to a Tezos Nouns Builder ship:

- **`contracts/visit_nouns_fa2.py`** — live FA2 on Tezos mainnet at `KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh` (originated 2026-04-17). Open-supply 0-1199 tokenIds, gas-only mint, 20% royalty, TZIP-compliant.
- **`contracts/drum_token.py`** — FA1.2 DRUM scaffolded, ghostnet origination pending (branch-dependent).
- **`contracts/v2/prize_cast.py`** — prize-linked savings primitive (branch-dependent; check current branch).
- **`src/pages/battle.astro`** — Nouns Battler deterministic fighter (Noun seed → HP/ATK/DEF/SPD via hash). Proves PointCast's seed-derivation pipeline.
- **`src/pages/dao.astro`** — DAO landing page already exists.
- **Beacon + Taquito 24.2 + SmartPy 0.24** — full toolchain.
- **`src/lib/nouns.mjs`** — existing Noun-trait library (branch-dependent; check).

A Tezos Nouns Builder v0 does not start from zero. Two-thirds of the ingredients are already shipped.

## 6. The speculative angles PointCast-native

Five directions that are only available to PointCast because of primitives we've built that no Solidity-fork team has:

- **Agent-as-bidder auctions via x402.** x402 processed 75M+ transactions / $10M+ volume in 2025-26; agents routinely bid on API endpoints. A Tezos Nouns auction with an x402 bid endpoint — agents bid USDC→XTZ via a gateway — is 2026-native. First Tezos DAO with agent-first bidding. Zero competition.
- **Prize Cast × Nouns.** Daily-auction losers automatically enter a weekly no-loss prize draw funded by auction yield. Winner gets a DAO-minted collectible. Genuinely novel; only possible for a team that has both PLSA + daily-auction primitives under one repo.
- **`/compute.json` federation as vote oracle.** DAO votes recorded as federated compute-ledger entries (PointCast primitive, RFC v0 of the compute ledger exists as prior work). Off-chain signal, on-chain settlement.
- **DRUM as auction bid token.** DRUM (FA1.2, pending) becomes the bid-unit for PointCast-branded DAOs — earned via engagement, not bought on exchanges. Inverts the "pay to play" economy.
- **Agent-caretaker DAOs.** Each daily Noun spawns with a named Claude agent as on-chain caretaker (metadata field). Caretaker writes CC0 lore; lore federates downstream.

Sources: [x402.org](https://www.x402.org/) · [aws agentic commerce](https://aws.amazon.com/blogs/industries/x402-and-agentic-commerce-redefining-autonomous-payments-in-financial-services/)

## 7. What to build in 1 week (v0)

**Scope.** Not yet a builder. One hard-coded daily auction wrapping Visit Nouns FA2. Every 24h the current auction settles, proceeds flow to a 2-of-3 multisig treasury, and a new auction opens for the next sequential Noun seed. Treasury is seed-funded initially; governance is multisig. No on-chain governor contract in v0 (that's v0.2). No no-code builder UI (that's v0.2). No Etherlink (that's v1 alt).

**Contracts.** `contracts/v2/daily_auction.py` SmartPy ~200 lines: `bid`, `settle_and_create_next`, extend-on-late-bid, admin knobs (reserve, min-increment, duration, pause). Full spec at `docs/briefs/2026-04-21-daily-auction-spec.md`.

**Integration with Visit Nouns FA2.** Two options: (A) add a minter-whitelist + `mint_for` entrypoint to Visit Nouns, auction contract is whitelisted; (B) auction holds a small tez float and calls existing `mint_noun` + FA2 `transfer`. cc leans A if upgrade path exists, B otherwise.

**Frontend.** `src/pages/auction.astro` with live countdown, Beacon bid flow, TzKT history. `src/lib/auction.ts` shared helpers. Three new WebMCP tools: `pointcast_auction_observe`, `pointcast_auction_history`, `pointcast_auction_bid_preview` (observe-only in v0; no agent-bidding until x402 lands in v1).

**Estimate.** 7 cc-days. Full breakdown in the brief.

## 8. v0.2 — one month

Graduate to a spawn-UI at `pointcast.xyz/builder`. Mike (or any user) picks DAO name + trait library + auction duration + multisig signers. Frontend originates three contracts in a Beacon batched op: FA2 token, daily-auction, treasury. Optional Homebase Lambda DAO wire for full on-chain governance. Directory of spawned DAOs at `/builder`. **This is the actual answer to "Tezos Nouns Builder."**

## 9. v1 — horizon

Full stack: v0 + v0.2 + Etherlink parallel (BuilderOSS Solidity fork) + x402 agent-bid endpoint + Agentic.Market listing + Prize Cast integration (1% yield → weekly PLS pool) + DRUM bid token for PointCast-branded DAOs + `/compute.json` mirrors vote events + agent-caretaker DAOs.

## 10. Honest uncertainty

- [verify] Exact current count of Nouns Builder DAOs in 2026.
- [verify] FA2.1 / TZIP-26 finalization status as of April 2026.
- [verify] Whether BuilderOSS Solidity contracts deploy cleanly on Etherlink.
- [verify] No other Nouns-aesthetic Tezos collection exists (search was not exhaustive).
- [verify] Cleanest Visit Nouns FA2 integration path (minter-whitelist upgrade feasibility).

## 11. Recommendation

**Ship Tezos L1 daily-auction v0 in one week.** Reasons: (a) empty slot with no competitors, (b) compounds with Visit Nouns FA2 already live, (c) cleanest cultural fit with Tezos purists + objkt/teia CC0 audience, (d) every downstream bet (Prize Cast integration, x402 agent bidders, DRUM bid token, no-code builder) requires this contract to exist first, (e) one-week scope fits a two-person team with no budget. Etherlink is a credible v1 alt.

---

## Source bibliography

All accessed 2026-04-21:

- https://github.com/BuilderOSS/nouns-builder
- https://nouns.build/
- https://builderdao.substack.com/p/nouns-builder-recap-136
- https://tzkt.io/KT18iSHoRW1iogamADWwQSDoZa3QkN4izkqj/operations/
- https://github.com/byteblock-labs/tezos-english-auction
- https://docs.objkt.com/product/legacy/faq
- https://www.fxhash.xyz/
- https://decrypt.co/147375/generative-tezos-art-platform-fxhash-adds-ethereum-multichain-push
- https://tezos-homebase.io/
- https://github.com/dOrgTech/homebase-app
- https://spotlight.tezos.com/tezos-dao-creation-and-management-tool-homebase-introduces-lambda-daos/
- https://forum.tezosagora.org/t/fa2-1-fa3-its-time/3704
- https://docs.tezos.com/architecture/tokens
- https://opentezos.com/defi/token-standards/
- https://teia.art/dao
- https://spotlight.tezos.com/art-markets-on-tezos/
- https://objkt.com/
- https://docs.etherlink.com/
- https://www.etherlink.com/
- https://chainwire.org/2026/01/29/native-support-for-tezos-evm-compatibility-layer-etherlink-now-available-with-ledger/
- https://forum.tezosagora.org/
- https://github.com/topics/tezos
- https://www.x402.org/
- https://aws.amazon.com/blogs/industries/x402-and-agentic-commerce-redefining-autonomous-payments-in-financial-services/

---

— filed by cc, 2026-04-21 PT on branch `manus/collab-paths-2026-04-21`. Sister artifact: `docs/briefs/2026-04-21-daily-auction-spec.md`. Editorial block: next available id (0330). Recommended action: Mike picks an answer to the five open questions in the brief (or says "cc picks") and cc starts the 7-day build.
