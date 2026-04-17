# Prize Cast — no-loss prize savings on Tezos

**PM:** Claude (Code)
**Date:** 2026-04-17
**Working title:** Prize Cast *(named for "the cast" — your cadence of deposits is your rhythm of entries)*
**Inspiration:** PoolTogether v4/v5 (open-sourced on Ethereum)

---

## Thesis

PoolTogether invented **prize-linked savings** on-chain: deposit funds, keep your principal, and the aggregate *yield* across all depositors becomes a periodic prize awarded to one holder at random, weighted by deposit × time. Nobody loses money; one winner per draw takes the whole yield.

PoolTogether shipped on Ethereum + L2s (Aave-backed) and peaked at **$250M+ TVL** in 2021. The v4 contracts are open-source and widely forked.

**Tezos has all the pieces but no serious equivalent:**
- Native baking yields ~5.5% APR (via delegation to any baker, no smart-contract risk beyond slashing — and Tezos baking has no slashing)
- Deterministic block production (30s blocks), so cadence windows are calendar-clean
- Randomness via block VDF output (post-Oxford protocol amendment) or simple commit-reveal
- A cheap, low-fee environment ($0.01-0.05/op) that makes micro-deposits economically sensible — you can deposit 1 ꜩ and the gas doesn't eat the yield

PointCast ships it. Frames it as a broadcast mechanic — **your deposits are entries in the weekly cast; the prize is the week's aggregate baking yield.** Ties to the BLOCKS.md "faucet" channel conceptually, but earns its own CAST channel if it warrants one.

---

## Core mechanics

### 1. Deposit
- User deposits any amount of tez (min 1 ꜩ, no max) via Beacon wallet
- Their deposit is minted as **tickets** at 1 ticket per micro-tez (mutez): 1 ꜩ = 1,000,000 tickets
- Principal stays in the contract vault; never loses value

### 2. Yield accrual
- Contract delegates the full vault balance to a curated baker (`tz1…` of Mike's choice — Good, Nautilus, Tezos Foundation, etc.)
- Baking rewards (~0.1%/week on principal) accumulate in the contract balance
- No yield-farming, no Aave-style lending — just native Tezos staking

### 3. Ticket weight (time × amount)
- Classic PoolTogether math: `weight = deposit_amount * seconds_since_deposit`
- Implemented as a lazy accumulator: on each deposit/withdraw, compute the delta `deposit_amount * (now - last_update)` and add to the user's `accumulated_weight`
- Storage cost: one record per depositor with `{amount, last_update, weight_accrued}`

### 4. Weekly draw
- Fixed cadence: every Sunday 18:00 UTC (Monday 02:00 JST, 14:00 ET, 11:00 PT)
- Anyone can call `draw()` after the deadline — incentive fee (0.5% of prize) to the caller
- Winner selection: weighted random from all tickets
  - **Randomness source:** Tezos block hash `level % 7` blocks in the future from the `draw()` call. Commit-reveal is a stronger primitive; use it if VDF gating doesn't ship in time.
- Prize = accumulated baking rewards since last draw
- Winner receives prize directly (auto-transfer)

### 5. Withdraw
- Users can withdraw principal anytime (no lock)
- Withdrawing forfeits any tickets still accumulating for the next draw (prorate: tickets earned up to withdraw time still count in the current draw)

### 6. Governance (v0: minimal)
- Admin (Mike) sets: baker delegate, draw cadence, fee %, minimum deposit
- No DAO token at launch — Prize Cast is a primitive, not a governance layer

---

## Why this fits PointCast

1. **Aesthetic:** Weekly cadence matches the broadcast rhythm. Draws happen on a public schedule; results are a Block. Each prize becomes a `CAST` (or `FCT` / new channel) NOTE block: "Week 17 prize: 12.4 ꜩ → tz1abc…xyz9." Natural agent-legible feed.
2. **On-chain narrative:** The throwaway origination + the 10 starter Nouns + Prize Cast becomes a three-act on-ramp: "PointCast is a publication, but here are some toys that reward you for paying attention to the cadence."
3. **No token games:** No new token at launch → no speculation layer → no regulatory theater. Just the native asset, native yield, native randomness.
4. **Bakes compliance-adjacent:** Prize-linked savings has a regulatory history (PLSAs in US banking). Doing this with opt-in participation + on-chain transparency + no investment contract framing keeps it cleaner than most DeFi drops.

---

## Technical stack

- **Contract:** SmartPy v0.24+. Single contract `prize_cast.py`. Inherits FA1.2 for optional ticket tokenization (defer — v0 uses a simple `big_map<address, record>` ledger).
- **Delegation:** `SET_DELEGATE` opcode. One baker at a time; admin can rotate.
- **Randomness:**
  - *v0:* use block hash at `draw_level + 7` (7-block finality window). Weak, but fine for an MVP with $100s of tez in the pool.
  - *v1:* commit-reveal with a 24-hour reveal window and a 5% slashing penalty for withheld reveals. Stronger.
  - *v2:* Tezos VDF output if it's live via Rio protocol amendment (check ahead of ship).
- **Frontend:** New route `/cast` on pointcast.xyz. Shows: current pool TVL, current prize, next draw time, your tickets, your odds. Deposit/withdraw buttons. Past winners feed.
- **Indexer reads:** TzKT for TVL, deposits, draws, winners. No custom backend needed — all state is on-chain.

---

## Deliverables (split across two Codex sessions)

### Session 1 — Contract + math (4-6 hrs)
- `contracts/v2/prize_cast.py` — full SmartPy source with test scenario
- Entrypoints: `deposit`, `withdraw`, `draw`, `set_delegate`, `set_admin`, `default` (baking-reward receiver)
- Test scenarios: basic deposit/draw, multi-depositor weighting, withdraw before draw, zero-tickets edge case, baker rotation
- `scripts/deploy-prize-cast-ghostnet.mjs` — ghost / test-net origination for smoke test
- README.md in `contracts/v2/` covering the design + randomness tradeoffs

### Session 2 — Frontend + data (3-4 hrs)
- `src/pages/cast.astro` — main Prize Cast surface. Mobile-first, v2 BlockLayout.
- `src/components/PrizeCastPanel.astro` — deposit/withdraw UI with Beacon wallet integration
- `src/pages/cast.json.ts` — agent feed: TVL, next draw, last 10 winners
- TzKT integration for live state reads (cached 30s at the CDN layer)
- One Block per historical winner, auto-generated at build time from on-chain data

---

## Product questions for MH (blocking before ship)

1. **Channel**: new `CAST` channel for Prize Cast entries + winners, or fold into `FCT` (Faucet)? New channel = BLOCKS.md schema change (MH decision per AGENTS.md).
2. **Fee %**: PoolTogether took 5-10% of prize to fund ops. PointCast equivalent? Suggest 2% to caller-of-draw + 3% to Mike's main wallet = 5% total. Or zero fees for launch?
3. **Baker choice**: who delegates to? Good baker in EU, Tezos Foundation baker, or a Nouns-aligned baker if one exists?
4. **Launch TVL strategy**: Mike seeds with 100 ꜩ → first prize is bootstrapped? Or cold-start at 0 and let depositors bootstrap organically?
5. **Branding**: "Prize Cast" works? Or "Pool Cast" to echo PoolTogether? Or something more specific to the cadence aesthetic?

---

## Prior art worth reading

- PoolTogether v4 contracts: https://github.com/pooltogether/v4-core (MIT licensed)
- PoolTogether v5 docs: https://dev.pooltogether.com/
- Tezos baking economics: https://opentezos.com/baking/
- TZIP-7 (fungible tokens) and TZIP-12 (multi-asset) — reference for ticket accounting if we later tokenize
- Nomadic Labs randomness VDF proposal: https://gitlab.com/tezos/tzip/-/blob/master/drafts/current/draft-random.md

---

## Risk register

| Risk | Mitigation |
|------|-----------|
| Baker slashing | Tezos doesn't slash; worst case is missed endorsements (loss < 1% of yield). Monitor via TzKT. |
| Random manipulation at v0 | Limit v0 pool size (cap TVL at 1000 ꜩ); move to commit-reveal before lifting cap. |
| Winner can't claim | Contract auto-transfers; no claim step. If recipient is a contract that fails to receive, prize rolls forward to next draw (gas-safe fallback). |
| Front-running draw | Draw is incentivized (0.5% fee) but anyone can call; first-caller race is fine — outcome is deterministic once called. |
| Regulatory (US) | Prize-linked savings has a US statutory framework (Prize-Linked Savings Accounts, enacted federally in 2014 for credit unions + banks). Structured correctly this is cleaner than most DeFi. Still — no marketing to US retail without legal review. |

---

## Why this is a good next build

- **Ships fast** — one SmartPy contract + one frontend page. Two Codex sessions, properly scoped.
- **Self-contained** — no token gated dependencies, no waiting on Good Feels infrastructure, no IPFS pinning, no wallet social-recovery debates.
- **Flagship demo** — "PointCast has a working prize pool on Tezos" is a much stronger story than "PointCast is a publication with drops". Brings a mechanic that rewards daily attention.
- **PoolTogether prior art** — well-understood primitive, deep literature, clean audit trail. Not inventing new crypto.

*Prepared for Mike, 2026-04-17 late PT. Codex session 1 to run concurrent with this doc committing.*
