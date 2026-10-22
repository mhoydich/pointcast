# Launchpad case study: build plan v2

**Date:** 2026-10-19 · **Status:** plan; Stage A merged as PRs #1452–#1455 (§8.2); A1 built (§8.8, updated 2026-10-20) · **Replaces:** the 2026-10-11 plan (a session draft, not kept in the repo) · **Checked against:** `origin/main` at `5754e498` (2026-10-19 15:55 PT, #1444); Stage A was re-tested merged onto `00129fd2` (2026-10-20, #1457), which touches no launchpad path

## 0. Summary

- **What.** A simulated coin launchpad in the Pump.fun pattern, written up as a UES business case study (case 06), separate from Currency Builder and Nouns Money. Anyone in the simulation can launch a coin in one step. The coin trades on a constant-product bonding curve over virtual liquidity. When the curve sells out, the coin graduates: its liquidity moves into a constant-product pool and the LP is burned. Around the curve sit a screener, a portfolio view, a creator view and a console for bots that trade only through a policy gate. Everything runs on play credits: no value, may reset.
- **Where.** `/case-studies/launchpad/` with a `/case-studies/launchpad.json` twin, listed as case 06 in `src/data/ues-business-cases.json` once the route ships. The code goes in `src/lib/launchpad/`. The page is not under `/currency-builder/` and not linked from the Currency Builder masthead unless Mike decides otherwise (§2, §10).
- **Stages.** Stage A is an in-browser deterministic simulator with no backend; it can ship first. Stage B is an optional shared play market on devnet-2 and waits on Mike's yes. Stage C is described as teaching material and is not scheduled.
- **Build status.** Stage A merged to `main` on 2026-10-20 as four PRs: this plan (#1452), then 1a.1 engine (#1453), 1a.2 simulation (#1454) and 1b page (#1455). A1, the full board, follows in its own PR (§8.8). A merge alone does not put anything on pointcast.xyz; that takes a `scripts/deploy.sh` run (`docs/OPERATIONS.md`). §8.2 and §8.8 record what changed from this plan while building it.
- **Main changes from v1:**
  1. PR 1 branches from a fresh `origin/main`. Currency Builder, the Security Edition (creative v2) and `nounArt(id, { layers })` have been on main since #1416 (2026-10-14). The `gracious-fermi` branch is superseded.
  2. The page leaves the Nouns Money brand. Coins show plain Noun portraits marked SIMULATED, not Nouns Money note faces (they are the same 100 Nouns as the Nouns Money designs, so Mike decides that overlap, §2.3, open question 3). There is no graduation certificate by default. Public copy passes the Nouns Money "Never use" list.
  3. The `town` migration fee scales to 0.15 ATTN, so price continuity at graduation passes (−0.0244% instead of −0.1244%).
  4. The ATTN cap limits issuance, not spending. One account can graduate a `town` coin, at 860.68 ATTN including fees, so at least 861 whole ATTN.
  5. Fee lines get a remainder rule (the house takes it), so they sum exactly to the total fee.
  6. Trending maps the z-scored base to a positive strength before multiplying, so trust, age and boosts can no longer invert the ranking.
  7. The gate defaults are fixed: `NEEDS_APPROVAL` can now fire, and the Sniper has its own policy so the defense A/B can measure it.
  8. The Stage B kill switch is `set_mandate` with `kinds = 0`, never `clear_mandate`. Mandate caps only bind `spend_allowance`, so bot buys use it.
  9. The A1 performance criterion is rewritten (the old one could not be met), and Stage C's effort estimate is corrected and kept only as a research estimate in §5.3, with no roadmap row.
  10. The D1 cache becomes `0033_launchpad.sql`, or whatever number is free at merge time.

## 1. What we're building

A launchpad simulation, explained as a case study. A person or a scripted actor launches a coin with a name, a symbol, an actual CC0 Noun (#0–99, through `nounArt`) and a rule set. The coin trades on a curve whose shape copies Pump's published constants, scaled to play credits. When the curve sells out, the remaining tokens and the credits raised seed a constant-product pool whose LP is burned. The screener ranks coins and explains every rank. Bots propose trades, and a gate decides which run.

**Framing.**
- The unit is the play credit (`cr`, 6 decimals). The page line is "Play credits only. No value, may reset. No real funds. Credits never leave this page."
- "No value, may reset" is the house devnet phrasing (`VOICE.md:46`; `tests/chain-bots-files.test.mjs:154` enforces "a devnet: no value, may reset."). "Play credits" exists on main only in Sunset Downs, since 2026-10-19 (#1438): "free nontransferable play credits; no cash value" (`functions/_lib/sunset-downs.ts:137`). The combined line is this plan's wording, not an existing house string.
- Stage B uses play ATTN, worded the way the repo already words it: "bids would be play ATTN, which has no value" (`src/pages/chain/mints.astro:178`), and `DEVNET.terms` "no value is promised · may reset" (`src/data/chain-home.ts:157`).
- The Nouns line on the page is "Noun art is CC0. Not a Nouns token. Not a claim on the Nouns treasury. No Nouns DAO endorsement." It covers all of constraint 5 ($NOUNS, the treasury and endorsement), which matters more for Noun-faced coins that trade than for art notes. It passes `scanText` and the §2.4 extra list (checked). Never write "$NOUNS": it trips `dollar-ticker`. The Currency Builder form ("not … endorsed by Nouns DAO") would trip the `endorsed` pattern.
- This plan does no legal analysis. The page stays plain about what the credits are and are not.

**What going live would change** (case-study material, not planned work; the page's version names no real quote asset or payout and says plainly that none of it is planned, §2.4 item 8):
- SOL or USDC as the quote asset.
- An audited program in place of the JS engine.
- Real ordering races (Jito bundles, priority fees) in place of the modelled tick ordering.
- An indexer that handles chain reorgs.
- Custodial or policy-engine wallets.
- Moderation operations and real creator payouts.

None of this is on the roadmap. Current house direction rules it out: Enjoy. Money's first rule is "No way out to money, swaps or goods gets built" (`src/data/enjoy-money.ts:21`), and the Nouns Money README says "real payment, redemption, issuance, backing assets and merchant settlement remain disabled" (`docs/nouns-money/README.md:5`). The math, the screener and the gate are what would carry over.

## 2. Fit with current Nouns Money direction

### 2.1 What main says now

- **Nouns Money notes are art, never priced or traded.** The standard line (`src/lib/nouns-money/chain-copy.mjs:13`): "Art on a test chain. No value, no redemption, may reset. Not $NOUNS. Not a claim on the Nouns treasury. No Nouns DAO endorsement. CC0." The chain edition (`src/data/nouns-money-chain.ts`) is non-transferable with 0 royalty, and `NM_CHAIN_ENABLED = false` (`:34`). PR #1413 says Phase B waits on decisions from Mike about supply, transferability, portraits and royalty.
- **Nouns Money disclosure** (`src/lib/nouns-money.ts:9`): "Paper artworks for voluntary art trades, never cash. No bank, deposits, cash redemption, financial offer, NFT ownership or Nouns DAO endorsement."
- **Currency Builder presents itself as Nouns Money.** Its kicker is "Nouns Money · El Segundo" (`src/pages/currency-builder/index.astro:52`), and its disclosure reads "Design concepts. Not legal tender, not for sale, no cash value, no redemption and no investment rights." (`:55`). Commons says "Never sold, never cashed out" (`src/pages/currency-builder/commons/index.astro:82`).
- **Enjoy. Money** (`src/data/enjoy-money.ts`, "Published plan · nothing on chain yet", `:14`): closed loop (`:21`), Tezos and the existing toolchain (`:22`), testnet first with a gate per phase, and a bot relay with a per-payment max, a daily max, an approved-payee list and every call logged (`:82`). Its copy was reworded to the Nouns Money rules on main in `94e23056` (2026-10-19).
- **`/bot-money` lab**: "valueless demo credits", with `realFunds: false` and `protocolComplianceClaim: false` in its manifest (`src/lib/bot-money.mjs:44`, `:46`). Its state machine voids stale proposals (`src/lib/bot-money-demo.mjs`; `tests/bot-money-demo.test.mjs:80`, `:103`).
- **The copy scanner.** `src/lib/nouns-money/honest-copy.mjs` exports `BANNED` (39 patterns in 8 groups), `scanText`, `extractCopy` and `scanSource`. `scripts/nm-honest-copy.mjs` applies it to 11 STRICT files (`:29-41`) and to LEGACY patterns (`:44-54`). No pattern covers `src/pages/case-studies/**`, `src/pages/currency-builder/**` or `src/lib/launchpad/**`. On `5754e498` the ratchet passes (`node scripts/nm-honest-copy.mjs` exits 0; `tests/nouns-money-chain-copy.test.mjs` passes 13/13), but no CI workflow runs that test.

### 2.2 Constraints the case study keeps

| # | Constraint | Source |
|---|---|---|
| 1 | Credits have no value and may reset. No real asset is the quote unit: not SOL, USDC, tez or BOT, and ATTN only as "play ATTN" in Stage B. | `chain-copy.mjs:13`; `chain-home.ts:157`, `:304` |
| 2 | No way out. Nothing leaves the simulation, and there is no cash-out, swap or redemption path. | `enjoy-money.ts:21` |
| 3 | Nouns Money notes are never priced or traded, and no tradable coin wears a note face or a Nouns Money serial. | `nouns-money-chain.ts`; `nouns-money.ts:9` |
| 4 | The launchpad never mints or claims Nouns Money editions or certificates. | `nouns-money-chain.ts:34`; PR #1413 |
| 5 | No link to $NOUNS, the Nouns treasury or Nouns DAO endorsement. | `chain-copy.mjs:13` |
| 6 | Public copy passes the "Never use" list even though the scanner's scope doesn't reach the page, plus the Currency Builder offer words (invest, shares, backed, redeemable, returns, profit, yield, guaranteed) and the chain words (worth, mainnet or "main net"). | `honest-copy.mjs`; `tests/currency-builder-security.test.mjs:8`; `tests/chain-bots-files.test.mjs:155` |
| 7 | Bots follow the house shape: no raw keys in Stage B, caps per trade and per window, permitted coins, every decision logged, a person approves above a threshold, stale proposals are void, records are marked as simulated. Resets and run switches clear the queue and the human log; approvals bind to a run key (scenario, seed, rules, `configHash`) plus the intent id, so a seeded id that repeats in a new run is never approved by an old record (§6.3). | `enjoy-money.ts:82`; `tests/bot-money-demo.test.mjs` (`:135`: a reset never reuses proposal IDs) |
| 8 | Stage A runs locally: no account, wallet, payment, storage of record or server submission. That includes the layout: the page renders BlockLayout in `isolated` mode, so no beacon, wallet bridge, cursor room or freshness widget loads, and the Pages middleware lists the route as a paper room, so the edge adds no session bridge either (§8.5). | `src/lib/bot-money.mjs:44`; `src/layouts/BlockLayout.astro:282-298` |
| 9 | Testnet first, with a gate after each stage. Any on-ramp would need its own review. | `enjoy-money.ts` |
| 10 | The JSON twin stays out of `agents.json` until `audit:agents` passes and Codex has reviewed it. Its manifest carries explicit flags in the `bot-money.mjs` style. | `CLAUDE.md`; `bot-money.mjs:44-46` |
| 11 | Nothing is written in Mike's voice. | `CLAUDE.md` |
| 12 | Work starts from a fresh `origin/main` worktree, never in `~/pointcast`. | `docs/OPERATIONS.md:9-14` |

### 2.3 Where v1 conflicted, and what v2 does

| v1 said | Conflict | v2 decision |
|---|---|---|
| "Nouns Money Launchpad … inside Currency Builder, at `/currency-builder/launchpad/`" | Currency Builder presents itself as Nouns Money and says "never cashed out"; "pump" is a banned word; a buy/sell venue there contradicts its copy and the scanner would not catch it | Name it "Launchpad case study". Host it at `/case-studies/launchpad/` beside `a-bots-visit`. Moving it is open question 1. |
| "Each coin's face is a Nouns Money note" | A priced, tradable coin wearing a note face contradicts "No price … Not transferable" | Coins show a plain Noun portrait from `nounArt(id)`, marked SIMULATED. The Security Edition renderer is on main and works, but v2 does not use it for coins (open question 3). **Overlap Mike must see:** `nounArt` covers only #0–99 and draws them from the Nouns Money provenance file (`primitives.mjs:7`, `public/images/nouns-money/source-100/provenance.json`, titled "Nouns Money Nordic series 2027 — actual Nouns #0–99"). Those are exactly the 100 Nouns Money designs (`docs/nouns-money/README.md:5`: "100 verified source designs using Nouns #0–99", `nm100-000` to `nm100-099`), and design d's house specimen is serial NM27-(d+1) (`public/nouns-money/chain/nm-recipe.js:116-117`). So coin Noun N wears the same portrait as Nouns Money design `nm100-N` / NM27-(N+1), a note that is never priced. PR #1413 lists portraits among the decisions Phase B waits on Mike for, so a CC0 default could quietly pre-empt that decision (options in open question 3). |
| "Holders may mint an `open_edition` note certificate" | `open_edition` is admin-only, and the Nouns Money edition is frozen until Mike decides | No certificate by default. A separate shared edition is open question 6. |
| Stage C: SOL/USDC, Turnkey/Privy/CDP, "real creator payouts" | Closed loop; "real payment … remain disabled" | Stage C is described as teaching material, not scheduled (§5.3). |
| "Legal review is out of scope." | Not a conflict, but the line invited a shrug | Replaced by "this plan does no legal analysis" plus honest page copy (§1). |
| House phrasing "play credits, no value, may reset" | That string never existed in the repo | The framing stays; it is attributed correctly (§1). |
| Honesty test bans only `invest\|guaranteed\|redeemable\|cash out\|legal tender` | Far narrower than the 39-pattern list | The test uses `scanText` plus the Currency Builder and chain lists (§8.6). |
| "Fee shares", "P/L", "Gainers", "takes profit", "virtual reserves", "tips", "spend caps", "allowlist", "DexScreener-style" | Banned or evasive under the lists | Replaced in all public copy and in code names that can reach the UI (§2.5). |
| A "Launchpad" link in `src/components/currency-builder/Top.astro` | Nouns Money leads the front page (#1436) and links to Currency Builder, so this would put a coin venue two clicks from that lead | No masthead link. Case 06 links to the page once it ships. Leaving out links does not keep the page unlisted: `@astrojs/sitemap` lists every HTML route not filtered out (`astro.config.mjs:55-61`), and the draft build already lists `https://pointcast.xyz/case-studies/launchpad/` in `dist/sitemap-0.xml`. Noindex takes two separate switches on main. `NOINDEX_PATHS` (`src/lib/seo-rules.mjs:4`) only feeds `isNoindexPath()`, which filters the sitemaps (`astro.config.mjs:60`; `src/pages/sitemap-discovery.xml.ts:684`). The robots meta comes only from BlockLayout's own `noindex` prop (`BlockLayout.astro:54`, `:98` default `false`, `:146-151`), which renders `index, follow` unless the page passes it; BlockLayout never calls `isNoindexPath`, and `src/lib/seo-build.mjs` never touches robots. Every page now in `NOINDEX_PATHS` also passes the prop (`catan/flyer.astro:9`, `desk.astro:10`, `court.astro:23`, `r/me.astro:20`, `r/assign.astro:24`, `r/board.astro:14`). The draft build ships `<meta name="robots" content="index, follow, …">`. So by default PR 1b does both, as `/catan/flyer/` does: it adds `/case-studies/launchpad/` to `NOINDEX_PATHS` (sitemap) and passes `noindex` to BlockLayout (robots meta), and it keeps `/case-studies/launchpad.json` out of `sitemap-discovery.xml.ts`. A2 removes both switches, unless Mike wants the page indexed from the start (§7). The Manus brief also stays out of `docs/briefs/` until A2: `src/lib/briefs.ts` globs that folder at build time, and `/briefs` (indexed, not in `NOINDEX_PATHS`) renders each brief's title and lede; for the draft brief the lede is "1. https://pointcast.xyz/case-studies/launchpad/ on iPhone Safari …". Task A goes to Manus as a PR comment instead (§9.2). |
| Channel `NMLAUNCH` | "NM" reads as Nouns Money | Channel `LAUNCHPAD` (also a valid `[A-Z0-9]{1,16}` code). |

### 2.4 How the public page passes the copy rules

1. The page and its JSON twin live outside the Nouns Money scanner's scope, so the ratchet stays untouched. Nothing goes under `src/pages/nouns-money/**`, and no file name contains `nouns-money`.
2. `tests/launchpad-honesty.test.mjs` opts in anyway. It imports `scanText` and `extractCopy` from `honest-copy.mjs`, and `NM_STANDARD_LINE` and `NM_REPLACEMENT_LINE` from `src/lib/nouns-money/chain-copy.mjs` (`:13`, `:17`) only to assert that neither appears in any launchpad output. Its scope grows with the PRs (§8, §8.6), so no PR's CI reads a file that PR doesn't ship. PR 1a.1 ships only the purity check. PR 1a.2 adds every scenario and strategy string. PR 1b adds the page source, the JSON twin, the coin SVG route's `aria-label` and `<title>` text, `exhibits.mjs` (the machine edition and `SOURCES`), the coin-art checks and, when `dist/` exists, the page's own content region in the built HTML: the `<article class="lp">` element (or a `data-launchpad-copy` root), excluding BlockLayout chrome. From PR 1b the test fails if that root is missing from a built page. A2 adds the case-06 entry in `src/data/ues-business-cases.json`. A whole-page scan would fail on layout copy the launchpad doesn't control: on the draft's build, "A few doors worth opening", "return here" and "This task shares only the text below" all come from BlockLayout widgets. The Sources list sits outside `<article class="lp">` or carries `data-launchpad-sources`, so the built-page scan can find and exclude it.
3. The only text excused is the exact citation strings (source titles and URLs), and only where they are cited. Page, twin, SVG, scenario and strategy copy are scanned with `approved: []` (`scanText`'s `approved` option replaces the default list). The `SOURCES` array and the built Sources list are scanned separately, with their own titles and URLs excused, because `stripApproved` removes an approved string wherever it occurs and would otherwise excuse a Pump page title anywhere in body copy. `NM_APPROVED_LINES` is not excused: those are the Nouns Money chain-surface lines (`chain-copy.mjs:12-20`, "On every chain surface, verbatim"), and excusing them would let the coin page carry "Art on a test chain … Not $NOUNS …" or "A free devnet art record … Not transferable yet", branding tradable coins as Nouns Money records. Built HTML is entity-decoded (e.g. `&amp;`, `&#39;`) before approved strings are cut out (as `stripApproved` does) and before the extra list in item 4 runs.
4. The same test adds the Currency Builder offer words, the chain words and the evasive variants a regex misses, as one case-insensitive, word-bounded pattern: `/\b(invest\w*|shares?|backed|redeemable|returns?|profit\w*|yield\w*|guaranteed|worth|main\s*net|cash(?:es|ing)? out)\b/i`. `main\s*net` matches the chain-bot ban (`tests/chain-bots-files.test.mjs:155`), which also catches "main net".
5. The page names Pump.fun and DEX Screener only in that Sources list. Mechanics are described in plain words.
6. There are no Nouns Money serials (`NM27-…`, `nm100-…`), no "$NOUNS" or "official", "Nouns treasury" only inside the Nouns line (§1), and no SOL, USDC, tez, BOT or ATTN as units in the Stage A interface.
7. "Not legal tender" is not needed and not used. Coins are not notes, so there is no clash with the Currency Builder disclosure.
8. The page's Stage C summary (§5.3) names no real quote asset (SOL, USDC, tez or any other) and no payout, and says plainly that none of it is planned. Neither SOL nor USDC trips `scanText`, so the honesty test checks the Stage C text against the item 6 unit list as well.

### 2.5 Vocabulary for public copy

Every "use" term below passes `scanText` and the §2.4 extra list (both lists re-run over every term in this section).

- **Framing:** play credits, simulation, case study, replay, seed.
- **Mechanics:** bonding curve, price curve, quote, buy, sell, trade, coin, token, pool, liquidity, virtual liquidity, curve depth, pool depth, market cap, progress, graduation, graduates, moves to a pool, LP burned, "graduated · LP burned", pro-rata fill, solvency check.
- **Fees and holdings:** creator fee, house fee, priority fee, credits held, holdings, holders, top-10 concentration, top-10 holders' %, fee split, creator payout split.
- **Bots and risk:** per-window cap, limit, policy, kill switch, approval queue, ledger, record, risk, concentration, sniper, bundle, screener, trending, permitted coins, rounded down.

| Instead of | Use |
|---|---|
| virtual reserves | virtual liquidity, curve depth |
| priority tip | priority fee |
| balance(s) | credits held, holdings |
| spend caps / spend window | per-window cap |
| allowlist | permitted coins |
| floor() in prose | rounded down |
| fee shares | fee split |
| top-10 share | top-10 concentration, top-10 holders' % |
| snipers' share of first-minute supply | % of first-minute supply bought by snipers |
| allocation, share (auction) | pro-rata fill |
| goes to press, to press | graduates, moves to a pool |
| P/L, profit, gains, returns | change in credits, net credits |
| Gainers | Movers |
| "a billion" | 1,000,000,000 |
| Pump.fun-style, DexScreener-style | a plain description, with the products named only in Sources |

**Keep out:** the whole "Never use" list; shares, returns, profit, yield, guaranteed; worth, mainnet, "main net"; rephrasings that dodge a regex ("cashes out", "no transfer of value"); printing imagery the `print` pattern misses ("goes to press").

## 3. Product surfaces

| Surface | Spec | Done when |
|---|---|---|
| **Create / launch** | Name up to 32 characters and symbol up to 13 ([Pump limits](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/COIN_CREATION.md)). Noun picker with a live preview of the SIMULATED portrait. Preset (`classic-x100` / `town`). Rule set (`naked` / `auction` / `sniper-fee` / `fair`, §4.7). Optional dev buy, disclosed and flagged `DEV`, with limits by rule set (§4.7). Preview of the price path. Viewer text is filtered in Stage A too, not only in Stage B: the name and symbol pass `scanText`, the §2.4 extra list and the item 6 checks (Nouns Money serials, "Nouns treasury", which `scanText` misses) before the coin is created, and a hit is refused with the reason shown (a coin called "PUMP" or "official Nouns" never renders; both trip `scanText`). Names and symbols render with `textContent` only, never with a `$` prefix (`dollar-ticker`), and viewer-made coins are labelled as such. A launch enters the human action log as a `launch` record (§8.4), so replay links reproduce it and a pasted replay passes the same filter. In the A1 Codex scope (§9.1). | A `CREATE` event fires and the coin shows in "New" in the same tick; a filtered name is refused |
| **Coin page** | Hand-drawn SVG candles at 1s/1m/5m/1h (new code, §5.1). Trade tape with `BOT`/`DEV`/`SNIPER`/`BUNDLE` badges. Buy/sell panel with quote, price impact, fee lines and minimum out. Two progress bars, the credits bar clamped at 100%. Holders with clusters. Risk panel. Coin portrait. | The quote equals the fill exactly, because both use the shared engine |
| **Screener / trending** | Tabs: Trending 5m/1h/6h/24h, New, About to graduate (credits progress at least 70%), Graduated, Movers, Most holders, Bot favorites (bots over 50% of volume). Columns: age, price, market cap, liquidity, volume, buys/sells, makers, holders, Δ%, progress, risk. Watchlist in `localStorage`, wrapped in try/catch, from A1; the code lives in the page script, since the purity test bans storage in `src/lib/launchpad/`. A1 changes the twin's storage flag and the brief's reload step to match (§8.5). | Ranking is the same for the same seed, and every rank can be explained from logged inputs |
| **Portfolio** | Positions, average cost, net credits (realized and unrealized), creator fees, history, season rank | Net credits match the ledger to within 1 µcr |
| **Bot console** | Roster showing strategy, parameters, policy, net credits, and intents/fills/refusals with reason codes. Approval queue. Kill switch per bot and a global one. Policy editor. Paper/live toggle (live only in Stage B). | Fuzz test: no bot exceeds its policy |
| **Creator view** | Fees accrued and swept. Creator payout split (distinct from the creator/house/LP fee split of §4.3): up to 10 recipients summing to 10,000 bps, editable once and then locked, like [`update_fee_shares_v2`](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/CREATOR_FEE_SHARING.md). A sweep pays each recipient `floor(swept·bps/10000)` and the remainder to the first recipient. Holders, clusters, risk badge. | Sweeps are idempotent, the payout split is validated, and each sweep's payouts sum exactly to the swept amount |

## 4. Mechanics

### 4.1 Units

All amounts are BigInt integers. Credits and tokens both use 6 decimals (µcr for credits; Pump tokens also use 6). Rounding always favors the pool. In Stage B, ATTN moves in whole units on chain, and the reducer tracks µATTN internally.

### 4.2 Curve and presets

The curve is constant product over virtual liquidity (Pump's term is "virtual reserves", which fails `scanText` on the page), `k = Q·B`, as in the [Pump program](https://github.com/pump-fun/pump-public-docs/blob/main/docs/PUMP_PROGRAM_README.md). Each preset multiplies Pump's 30-SOL virtual quote by a factor `s`. Every quote amount, including the migration fee and the fee-tier thresholds, scales by `s`, and token percentages stay the same. All figures below were recomputed with BigInt at 6 dp.

| Parameter | Pump (SOL) | `classic-x100` (Stage A, s=100) | `town` (Stage B, ATTN, s=10) |
|---|---|---|---|
| Virtual quote `Q0` | 30 | 3,000 cr | 300 |
| Virtual base `B0` / real base `R0` / supply | 1.073B / 793.1M / 1B | same | same |
| Migration fee | 0.015 (15,000,001 lamports) | 1.5 cr | **0.15** (v1: 1) |
| Start market cap | 27.958993 | 2,795.899347 cr | 279.589934 |
| **Raise at graduation** (`Qgrad`, before fees) | 85.005360 | **8,500.535906 cr** | 850.053591 |
| One buy to graduate, with the 125 bps fee | 86.067927 | 8,606.792605 cr | 860.679261 (at least 861 whole ATTN) |
| End market cap | 410.880171 | 41,088.016813 cr | 4,108.801682 |
| First buy of `Q0/30`, tokens out before fees | 34,612,903.225806 | 100 cr → same | 10 → same |
| First buy of `Q0/3`, tokens out before fees | 268,250,000 (26.825%) | 1,000 cr → same | 100 → same |
| Fee-tier thresholds | 420 / 1,470 SOL | 42,000 / 147,000 cr | 4,200 / 14,700 |

**Minimum trade in Stage B.** Whole-ATTN transfers make 1 ATTN the smallest buy. On `town` at curve start, 1 ATTN buys 3,520,917.645346 tokens after fees (0.352% of supply). A smaller `s` would need fewer ATTN to graduate but coarsens that step: at `s = 1`, one ATTN buys 3.42% of supply.

**ATTN supply for `town`.** Each account can mint (earn) at most 500 ATTN per epoch (`account_epoch_cap`, enforced in `State::issue`, `src/data/chain-docs/design.md:279-293`). An epoch is 28,800 blocks: one day at 3 s blocks, but the devnet seals blocks only under traffic or on a 5-minute heartbeat (`src/pages/chain/bots.astro:220`). At devnet-1's idle rate of 12.3 blocks an hour (`chain-home.ts:103`), an epoch would last about 98 days. Epoch boundaries are fixed, so one key can mint up to 1,000 ATTN in a day-long window by straddling a boundary (`findings.md:94-98`). The cap limits issuance only. It does not cap holdings, transfers or spending (`design.md:89`). So one account can graduate a `town` coin by saving across epochs, straddling a boundary, receiving transfers, or being the treasury (default premine 100,000,000 ATTN, `readme.md:55`). Earning is the real limit. On devnet-1, ATTN can be earned by taps (`tap_reward` 1, 5 per 20-block window) or by drum sessions (up to 100 ATTN per session for the sender under the `cosign` policy, which takes at least 500 s of non-overlapping session time, `design.md:86`, `:119-120`; `drum_attest_policy` "cosign", `drum_reward_per_10s` 2, `drum_session_cap_per_player` 100 in `public/chain/yard/devnet-1/snapshot.json`). So 861 ATTN takes anywhere from about 9 to 861 signed transactions, depending on how it is earned: between 0.2% and 17% of the network's 5,000-a-day budget. Devnet-2's values are not in the repo (unverified). B0 re-sizes `town` from devnet-2's real `/params` (§7). If graduation should need several holders, the launchpad needs its own per-wallet cap that lasts until graduation.

### 4.3 Formulas

```
D            = 1,000,000; every fee rate r is in millionths (1 bps = 100; the 125 bps curve fee = 12,500)
price        p = Q/B                            mcap = floor(Q·supply/B)   (= FDV)
buy rate     r = rTier + rSniper(t) + rPriority   rSniper(t) = 100·f(t) (§4.7); rPriority = 100·priorityFeeBps
buy exact-in gross = quoteIn; net = floor(gross·D/(D+r)); fee = gross − net; out = floor(net·B/(Q+net))
buy exact-out net = ceil(Q·out/(B−out));        fee = ceil(net·r/D); gross = net + fee
sell         r = rTier + rPriority; grossOut = floor(in·Q/(B+in)); fee = ceil(grossOut·r/D); net = grossOut − fee
curve buy    then Q += net, B −= out, R −= out, realQuote += net      (curve rTier is the flat 125 bps)
curve sell   then Q −= grossOut, B += in, R += in, realQuote −= grossOut
fee lines    sniper = floor(net·rSniper/D); priority = floor(x·rPriority/D) (x = net on buys, grossOut on sells)
             tierFee = fee − sniper − priority
fee split    creator = floor(tierFee·rCreator/rTier); lp = floor(tierFee·rLp/rTier); house = tierFee − creator − lp
impact       buy: (net/out)/p − 1  (≈ net/Q);   sell: 1 − (grossOut/in)/p     (both before fees)
minOut       floor(quotedOut·(10000 − slipBps)/10000)
progress     tok = (R0−R)/R0;   credits = min(1, realQuote/Qgrad),   Qgrad = ceil(k/(B0−R0)) − Q0
liquidity    curve = realQuote;  pool = 2·quoteReserve
pool buy     the buy lines above on (Q, B) = (quoteReserve, baseReserve); then quoteReserve += net + lp, baseReserve −= out
pool sell    the sell line above on the same reserves; then baseReserve += in, quoteReserve −= grossOut − lp
poolMcap     floor(quoteReserve·supply/baseReserve)   (the only fee-tier key; rTier is looked up before each pool trade)
```

- **One gross.** `quoteIn` is the buy's gross: the curve or pool fee, any sniper fee and any priority fee are all inside it. The gate values a buy at this gross (§6.2). The sniper fee applies to buys only; sells pay the tier fee plus any priority fee.
- **Fee lines sum exactly.** Rounding each line up gives 1 µcr more than the total: on a 100 cr buy, ceil(30 bps) + ceil(95 bps) = 1,234,569 µcr against a total fee of 1,234,568. With the house taking the remainder, the lines are creator 0.296296, house 0.938272 and LP 0 cr, summing to 1.234568. Sniper and priority fees are their own lines, split off before the tier split, and go to the house sink. On the curve, `lp` is 0; on the pool, the LP line stays in the reserves.
- **Rates in millionths.** For whole-bps rates, dividing by `D` gives exactly the same results as dividing by 10,000, so every test value in this plan holds. The millionths are there for the half-bps pool tiers (§4.5).
- **Default slippage** is 500 bps, with a maximum of 5,000. Price impact above 5% shows a warning.
- **Two progress bars.** Pump's single bar counts tokens sold. It reads 50% when only 20.7% of the credits have been raised (1,758.666569 of 8,500.535906 cr).
- **"Raise" excludes the 125 bps fee.** The fee adds 106.256699 cr for a single graduating buy in `classic-x100`.
- **Not a µ-level copy of Pump.** Pump's v3 SDK computes exact-in output as `floor((net−1)·B/(Q+net−1))` and exact-out cost as `floor(…)+1`. On a 100 cr buy after fees, this engine gives 34,199,203.154141 tokens and Pump's rounding gives 34,199,202.483680. Headline numbers match exactly; individual fills differ by fractions of a token.

### 4.4 Graduation

A coin is complete when `R == 0` after a buy. The buy that crosses the line follows Pump's [synthetic migration](https://github.com/pump-fun/pump-public-docs/blob/main/docs/SYNTHETIC_MIGRATION.md):

1. It fills what is left on the curve at curve prices, using the exact-out line for the remaining `R`: `net_c = ceil(Q·R/(B−R))`, `gross_c = net_c + ceil(net_c·r/D)`.
2. The rest of its gross is the overflow: `gross_o = gross − gross_c`, `net_o = floor(gross_o·D/(D+r))`. It buys from the reserved 206.9M tokens at the pool's opening depth, defined as `(quote, base) = (realQuote − migrationFee, 206.9M)`, where `realQuote` already includes `net_c`: `out = floor((net_o−1)·base/(quote+net_o−1))`, Pump's synthetic-migration form, and `out = 0` when `net_o ≤ 1` (the draft's `overflowOut` does this, `pool.mjs`). Later pool trades use the §4.3 pool lines, without the −1. The overflow pays the same rate `r` as the curve leg, as Pump charges on both legs, and each leg's fee lines follow §4.3. The overflow leg's tier fee splits like the curve's (creator 30 / house 95 / LP 0), not like pool tier 1, so it adds no LP fee to the reserves and the seed formula below holds.
3. It emits `TRADE`, then `COMPLETE`, then `MIGRATE`, then `POST_COMPLETE_BUY`.

`migrate()` runs immediately after the crossing buy's curve leg, in the same engine call, as the draft does (`engine.mjs:5`, "migrate (same call)"). So in the sim no trade ever meets a `complete` coin: `CURVE_COMPLETE` covers only a direct engine call on a coin left `complete` (a test can force that by calling `buy()` between `COMPLETE` and `migrate()`). `migrate()` seeds the pool with base `206.9M − overflowOut` and quote `realQuote − migrationFee + overflowNet`, and sets `lpBurned = lpSupply`. The overflow counts in the pool seed, not in `realQuote`. The migration fee goes to the house sink.

- **Continuity test.** The pool's opening price, measured on its reserves before any overflow, is within 0.1% of the curve's final price. Recomputed: −0.0244% for `classic-x100`, for `town` with the 0.15 ATTN fee, and for Pump. The 206.9M versus 279.9M base mismatch alone accounts for −0.0067%. With v1's 1 ATTN fee, `town` came out at −0.1244% and failed. An overflow of 100 cr net (`net_o`) moves the opening price 2.342% above the curve's final price (100 cr gross: 2.313%); that is the buy moving the price, not a gap at migration.
- **Credits bar.** `Qgrad` is the single-path minimum. Floor rounding makes `k` creep upward, so `realQuote` at `R = 0` can exceed `Qgrad`: by 40 to 1,050 µcr on random paths, and by 38,335 µcr after 10,000 round trips. The bar is clamped at 100%.
- **Settlement units.** Settling in whole ATTN cannot represent the 0.15 fee: rounding it to 1 ATTN gives −0.0953% (passes only by rounding) and to 0 gives +0.0223%. So `town` keeps 6 dp internally.

### 4.5 Fees

Fees are a versioned config, like Pump's `FeeConfig`. The tiers come from Pump's [fee image](https://github.com/pump-fun/pump-public-docs/blob/main/docs/fees.png), with thresholds multiplied by `s` (100 for `classic-x100`, 10 for `town`).

Rates are in bps; a tier applies from its threshold (pool market cap, `poolMcap` in §4.3) up to the next one. Transcribed from `fees.png` (pump-public-docs `639b87f`), whose totals for the half-bps tiers are rounded in the picture (0.53% for 52.5 bps, and so on).

| Venue | From (SOL) | `classic-x100` from (cr) | `town` from (ATTN) | Creator | House | LP | Total (bps) |
|---|---|---|---|---|---|---|---|
| Curve | – | – | – | 30 | 95 | 0 | 125 |
| Pool tier 1 | 0 | 0 | 0 | 30 | 93 | 2 | 125 |
| Pool tier 2 | 420 | 42,000 | 4,200 | 95 | 5 | 20 | 120 |
| Pool tier 3 | 1,470 | 147,000 | 14,700 | 90 | 5 | 20 | 115 |
| Pool tier 4 | 2,460 | 246,000 | 24,600 | 85 | 5 | 20 | 110 |
| Pool tier 5 | 3,440 | 344,000 | 34,400 | 80 | 5 | 20 | 105 |
| Pool tier 6 | 4,420 | 442,000 | 44,200 | 75 | 5 | 20 | 100 |
| Pool tier 7 | 9,820 | 982,000 | 98,200 | 70 | 5 | 20 | 95 |
| Pool tier 8 | 14,740 | 1,474,000 | 147,400 | 65 | 5 | 20 | 90 |
| Pool tier 9 | 19,650 | 1,965,000 | 196,500 | 60 | 5 | 20 | 85 |
| Pool tier 10 | 24,560 | 2,456,000 | 245,600 | 55 | 5 | 20 | 80 |
| Pool tier 11 | 29,470 | 2,947,000 | 294,700 | 50 | 5 | 20 | 75 |
| Pool tier 12 | 34,380 | 3,438,000 | 343,800 | 45 | 5 | 20 | 70 |
| Pool tier 13 | 39,300 | 3,930,000 | 393,000 | 40 | 5 | 20 | 65 |
| Pool tier 14 | 44,210 | 4,421,000 | 442,100 | 35 | 5 | 20 | 60 |
| Pool tier 15 | 49,120 | 4,912,000 | 491,200 | 30 | 5 | 20 | 55 |
| Pool tier 16 | 54,030 | 5,403,000 | 540,300 | 27.5 | 5 | 20 | 52.5 |
| Pool tier 17 | 58,940 | 5,894,000 | 589,400 | 25 | 5 | 20 | 50 |
| Pool tier 18 | 63,860 | 6,386,000 | 638,600 | 22.5 | 5 | 20 | 47.5 |
| Pool tier 19 | 68,770 | 6,877,000 | 687,700 | 20 | 5 | 20 | 45 |
| Pool tier 20 | 73,681 | 7,368,100 | 736,810 | 17.5 | 5 | 20 | 42.5 |
| Pool tier 21 | 78,590 | 7,859,000 | 785,900 | 15 | 5 | 20 | 40 |
| Pool tier 22 | 83,500 | 8,350,000 | 835,000 | 12.5 | 5 | 20 | 37.5 |
| Pool tier 23 | 88,400 | 8,840,000 | 884,000 | 10 | 5 | 20 | 35 |
| Pool tier 24 | 93,330 | 9,333,000 | 933,300 | 7.5 | 5 | 20 | 32.5 |
| Pool tier 25 | 98,240 | 9,824,000 | 982,400 | 5 | 5 | 20 | 30 |

- The last tier starts at 9,824,000 cr (98,240 SOL × 100). The picture's 73,681 SOL threshold (not 73,680) is copied as printed.
- The end-of-curve market cap (41,088.02 cr) is under 42,000, so a new pool opens in the first pool tier, as on Pump (410.88 < 420 SOL).
- Five creator tiers in `fees.png` are half-bps (0.275%, 0.225%, 0.175%, 0.125%, 0.075%). Pump stores whole bps on chain, so the on-chain values must differ from the picture. The on-chain `FeeConfig` was not queried (no Solana RPC). Decision for PR 1: rates are stored in millionths (denominator `D = 1,000,000`; 27.5 bps = 2,750), and §4.3's formulas use `D`. This represents the picture exactly and gives identical results for whole-bps rates. `D` and the full table go into `configHash()`.
- Creator fees are held on the coin and paid out by a `sweep` that anyone can call. House fees go to a visible sink. LP fees stay in the pool and deepen it, since the LP is burned.

### 4.6 Trending

The score draws on most of the inputs DEX Screener lists for its [Trending Score](https://docs.dexscreener.com/trending): volume, unique makers, transactions, holders, liquidity and reactions. It applies its own transforms and weights; DEX Screener publishes no weights. It adds price change, which DEX Screener does not list. It leaves out page visitors and DEX Screener's trust inputs (verified or Enhanced Token Info, security checks), and uses its own concentration heuristics instead. The official page itself is unverified as of 2026-10-19; this rests on search-indexed text of it.

```
z(x)     = (x − mean)/sd across live coins;  z = 0 when fewer than 2 coins are live or sd = 0
breadth  = Σ_cluster sqrt(quoteVol)          organic = uniqueMakers_clustered·(1−washShare)
base     = .30z(log1p breadth) + .25z(log1p organic) + .15z(txns) + .10z(clip(Δp,−50%,200%))
         + .10z(Δholders/max(holders₀,10)) + .05z(log1p liq) + .05z(reactions)
strength = softplus(base) = ln(1 + e^base)            // > 0 for every coin
trust    = max(.1, 1 − .3[dev>10%] − .3[bundle>20%] − .5[top10>60%])
boost    = min(1 + .15·log2(1+boosts), 2)              // 1 in Stage A: no boost purchases
score    = boost·trust·strength·min(1, age/120s)·0.5^(age/6h)
```

- **Why `strength`.** v1 multiplied `base` directly. A z-scored base has mean 0, so about half the coins have `base < 0`, and for those coins the multipliers inverted. A flagged coin outranked an identical clean one (−0.1091 vs −1.0911). A 24-hour-old coin outranked a 1-hour-old one. Seven boosts lowered a coin from −0.8909 to −1.2918. A flagged coin could become king of the hill. With `strength > 0`, trust and the age factors can only lower a score and a boost can only raise it. A percentile rank in (0, 1] would also work.
- Windows `w` are 5m, 1h, 6h and 24h, in sim seconds (ticks, §5.1). These are floats (log, sqrt, z), not money, so they stay outside the BigInt ledger. The same seed still gives the same ranking.
- **Inputs.** Live coins are those with status `auction` or `curve`. Migrated (pool) coins are left out of the z-score set and are listed under Graduated. `reactions = 0` in Stage A, which has no reaction source. Credit amounts enter `log1p` and `sqrt` as floats in whole cr (`Number(µcr)/1e6`). `sd` is the population standard deviation. `age` is in ticks since trading opened (§5.1).
- **Age factor.** `min(1, age/120)` is a warm-up ramp, so rank is not monotonic in age below 120 ticks: for identical activity a 30-tick coin (factor 0.2498) scores below a 1-hour coin (0.8909), and a 5-tick coin (0.0417) below a 24-hour coin (0.0625). Past the warm-up, the older coin always scores lower.
- **King of the hill** is the highest-scoring coin that has not graduated and has credits progress of at least 50%. Every input is logged, so the page can answer "why is this #1?".

### 4.7 Rule sets, sniper and bundle defenses

| Rule set | Opening auction | Decaying sniper fee | Early wallet cap | Dev lock |
|---|---|---|---|---|
| `naked` (Pump today) | – | – | – | – |
| `auction` | yes | – | – | – |
| `sniper-fee` | – | yes | – | – |
| `fair` | yes | yes | yes | yes |

| Defense | Default |
|---|---|
| Opening batch auction | Orders collect for 10 ticks (the creation tick through creation + 9). The cap is 30 cr gross per wallet across all of its orders; any priority fee an order carries is inside the 30 cr and goes to the house, and whatever is over the cap is refused and refunded at once. Accepted credits leave the wallet when the order is placed (escrow). As the tick advances to creation + 10, a single curve buy of `C = Σ min(q_i, cap)` (less any priority fees) runs at the curve fee only and its tokens are split pro-rata (on the page: "pro-rata fill"), so everyone pays the same average price. Each order's share is rounded down, and the leftover µtokens go one at a time to the earliest orders, as the draft's `clearAuction` does. One capped bidder with no priority fee gets about 1.05% of supply after fees (1.06% before). With 10 capped bidders each gets about 0.96%, and with 50 about 0.7%. **Gate valuation:** an auction order is valued at the capped amount it can still place, `min(quoteIn, cap − already ordered)`, for `PER_TRADE`, `WINDOW_CAP` and `CREDITS`, and `POSITION` uses that amount's quote at the current curve price, an upper bound on the fill (the draft's `estimateOut`). The fill counts as a fill for `COOLDOWN` and `RATE` at the clearing tick, so under the default 5-tick cooldown a Sniper whose order filled cannot buy again in ticks 0–4 after trading opens. |
| Decaying sniper fee | `f(t) = floor(5000·(60−t)²/3600)` bps on top of the 125 bps curve fee, for `0 ≤ t < 60` ticks after continuous trading opens (after the auction clears, where there is one). The auction's clearing buy pays only the curve fee. Charged on top of net, the t=0 total of 5,125 bps takes 33.9% of the buyer's gross, not 50%. At t=10 the total is 3,597 bps. Modelled on Clanker's decaying fee (its example starts at 66.68% and decays over 15 s, with a maximum of 80% and 2 minutes): same shape, different numbers ([guide](https://www.typingmind.com/skills/bankrbot-clanker)). Clanker v4.0.0 also offers an optional MEV module that blocks trading for the first 2 blocks, chosen per pool (`specs/v4_0_0.md`: "introduces the ability to use MEV modules during a pool's first few swaps"; [announcement](https://paragraph.xyz/@dish/introducing-clanker-v4)). |
| Early wallet cap | No wallet, including the creator's, holds more than 2% of supply for the first 120 ticks after trading opens |
| Dev lock | The creator wallet cannot sell before graduation (`DEV_LOCKED`) |
| Ordering model (all rule sets) | Within a tick, orders sort by priority fee, then by a seeded shuffle. Priority fees go to the house. This models the race for the first slot that Jito bundles win. |

**Dev buy by rule set** (`classic-x100`, 125 bps; no creator exemptions):

| Rule set | How it runs | Maximum | Cost of the maximum |
|---|---|---|---|
| `naked` | First curve trade at creation, flagged `DEV` | 5% of supply (50M tokens) | 146.627566 cr net / 148.460411 cr gross |
| `sniper-fee` | Same, and it pays the t=0 sniper fee | 5% | 221.774194 cr gross |
| `auction` | An ordinary auction order | the 30 cr cap, about 1.05% at most | 30 cr |
| `fair` | An ordinary auction order, then locked until graduation | the 30 cr cap, about 1.05% at most (under the 2% early cap) | 30 cr |

### 4.8 Concentration and rug heuristics

Curve and pool accounts are left out of all measures. Wallets merge into clusters by `fundedBy` (in Stage B, the ATTN funding graph). Funding from the faucet, the house or a scenario's starting credits creates no cluster, so ordinary wallets stay singletons. There is no general same-tick merge: it would fold every auction participant into one cluster (the clearing buy runs in a single tick) and merge unrelated wallets in busy ticks. The only same-tick rule is `bundle%`'s creation-tick buys by creator-funded wallets, and auction fills never count toward it. The measures, each with its denominator (`supply` is total supply, 1,000,000,000 tokens, the same base as `maxPositionBps`; `circ` is the tokens held outside the curve and pool; the creator's set is the creator wallet plus every wallet it funded):
- `top10% = Σ holdings of the 10 largest clusters / supply`
- `HHI = Σ_clusters (held/circ)²`
- `dev% = creator wallet's holdings / supply` (the creator wallet only; creator-funded wallets count in `bundle%`, not here)
- `bundle% = Σ tokens bought in the creation tick by creator-funded wallets / supply`, not counting the creator wallet (whose dev buy `dev%` covers)
- `sniper% = Σ tokens bought by other wallets in continuous trading during the first 5 ticks after trading opens / supply`, where "other wallets" means every wallet outside the creator's set, and auction fills are excluded (as the draft does)
- `devSold% = tokens the creator wallet has sold / its peak holdings`
- `washShare = credits volume of trades whose cluster traded the other way within 60 ticks / the coin's total credits volume since creation`

```
risk = 25·c(dev/20%) + 20·c(bundle/40%) + 20·c(sniper/40%) + 20·c((top10−30%)/50%) + 15·c(devSold)
c(x) = clamp(x, 0, 1); badge: <25 low · 25–55 caution · >55 high
```

Hard flags:
- `DEV_DUMP`: the creator wallet sells more than 50% of its peak holdings within 300 ticks of the coin's creation.
- `BUNDLED`: `bundle%` above 5% (the local draft's value; tune it on the scenarios).
- `WHALE`: one cluster holds more than 10% of `supply`.
- `WASH`: wash share above 30%.

The `dev-dump` scenario includes the Bundler actor, and both `DEV_DUMP` and `BUNDLED` must fire on it under `naked`. The case study should say this plainly: the curve and the burned LP rule out a "pull the liquidity" rug. The remaining risk is a concentrated supply being dumped.

## 5. Architecture by stage

### 5.1 Stage A: in-browser deterministic simulator (no backend; can ship first)

```
scenario.json + seed + config ─► sim.mjs ─tick─► strategies (proposals) ─► gate.mjs ─► engine.mjs
human action log (launches, trades, approvals, kills) ─┘                      │ events
                       screener.mjs (windows, candles, trending, risk) ◄──────┘
   static .astro markup rendered at build time; a client <script> runs sim.mjs and updates the DOM;
   the URL hash (#/c/<id>, #/replay/<b64>) holds the view
```

State shapes:
- `World{tick, seed, configHash, coins, wallets, events}`
- `Coin{id, symbol, nounId, creator, preset, rules, status: auction|curve|complete|migrated, curve{Q,B,R,realQuote}, pool?, feesHeld, holders}`
- `Event{seq, tick, type, …}`

**Time model.** One tick is one simulated second. Inside a tick the phases run in this order (the draft's `sim.mjs` step, except where §8.2 lists a change):
1. Launches due this tick (scenario launches and human `launch` records), with their dev buys and bundle buys. These execute at once, ungated and outside the ordering.
2. Human action log records for this tick, in log order: approvals and declines, kills and unkills, policy edits. Human trades from the log are queued here as proposals and join phase 4's ordering with priority fee 0, competing with everyone else, as the draft does (`sim.mjs:134-138`).
3. Proposals. Bots propose intents, and each bot intent passes the gate as it is proposed, so a kill from phase 2 refuses it in the same tick; approved intents re-enter here and are re-gated (§6.3). Only bots are gated. Scenario actors propose ungated: the Dev's dump at `launch.tick + dump.after`; copy-traders, repeating their leader's fills from `delay` ticks earlier; retail, with Poisson(`rate`) arrivals per tick.
4. All proposals are ordered: priority fee, highest first, then a seeded shuffle.
5. The engine executes them in that order. A buy that completes a curve runs `migrate()` in the same call (§4.4).
6. Sweeps: when `tick > 0` and `tick mod 600 = 0`, every coin's held creator fees are swept (the draft's `SWEEP_EVERY`, `sim.mjs:20`, `:209`).
7. The screener ingests the tick's events (windows, candles, trending, risk).
8. The tick advances. As it does, any opening auction whose 10 ticks are up clears, before phase 1 of tick creation + 10 (the draft's `tick()`, `engine.mjs:469-474`).

Clocks: the Sniper's 60-tick window, the early wallet cap, the sniper fee, `sniper%` and trending `age` count from trading open (creation, or creation + 10 ticks when there is an opening auction). `bundle%` and `DEV_DUMP` count from creation.

**Determinism.** The same seed, config and human action log always produce the same `logHash`. Launches, approvals and kills from the viewer enter through the human action log, so replays reproduce them. A human log belongs to one run key (scenario, seed, rules, `configHash`); a reset or a switch of scenario, seed, rules or config starts an empty log (§6.3).
- **Serialization.** The hash input is canonical: one event per line, keys in a fixed order (`seq`, `tick`, `type`, then the type's fields in a per-type order declared once in `engine.mjs`), BigInt as a decimal string, no floats in events. The draft hashes `JSON.stringify(events)` in insertion order (`config.mjs:81`, `engine.mjs:499`) and puts a float `priceAfter` in its events; both change (§8.2). Hashed event types and their field order:
  - `WALLET {wallet, role, credits, fundedBy}`; `CREATE {coin, symbol, name, nounId, creator, preset, rules, openTick, viewerMade}`
  - `TRADE {coin, wallet, side, venue, quote, net, fee, sniperFee, priorityFee, base, heldAfter, reason}`; `COMPLETE {coin, raised}`; `MIGRATE {coin, quote, base, lpBurned}`; `POST_COMPLETE_BUY {coin, wallet, quote, net, fee, base, heldAfter}`
  - `AUCTION_ORDER {coin, wallet, quote, refused, priorityFee, reason}`; `AUCTION_CANCEL {coin, wallet, quote, priorityFee}`; `AUCTION_FILL {coin, wallet, quote, refund, base, orderTick, heldAfter}`; `AUCTION_CLEAR {coin, quote, base, bidders}`
  - `FEE_SPLIT {coin, split}`; `SWEEP {coin, quote, recipients}`
  - `GATE_REFUSE {bot, intent, coin, side, reason}`; `ENGINE_REFUSE {actor, wallet, intent, coin, side, reason}` (`intent` is null for non-bot actors)
  - `QUEUED {bot, intent, coin, side, amount}`; `APPROVED {intent}`; `DECLINED {intent}`; `VOID {intent, reason}`
  - `KILL {bot, on}` (bot id or `*`); `POLICY {bot, rev, patch}`

  Gate and engine refusals are hashed events, so the pinned hashes cover denied approvals (§6.3). The draft keeps gate refusals in a separate `gateLog` (`sim.mjs:157`) outside `logHash`; that changes.
- **Hash.** `logHash` and `configHash` are a non-cryptographic 64-bit hash (`cyrb128`'s first two lanes, as the draft's `hashString` does). It pins regressions and replays; it is not an integrity proof. `sim.mjs` must run in the browser and return synchronously, and `node:crypto` is not available there while SubtleCrypto is async. Stage B, where integrity matters, pins sha256 on the worker side (§5.2).

**Purity.** `src/lib/launchpad/` uses no `fetch(`, `WebSocket`, `XMLHttpRequest`, `Date.now`, `new Date(`, `Math.random`, `localStorage` or `sessionStorage`. A test enforces this, following the no-network test in `tests/bot-money-demo.test.mjs:175`.

**Rendering.** Main has no Astro islands: no UI-framework integration in `astro.config.mjs` and no `client:*` directives in `src/`. Pages render static markup and add behaviour with client `<script>` modules. The one React page, `src/pages/shwa.astro`, mounts with `createRoot` inside a `<script>`. The launchpad follows the `<script>` pattern.

**Charts are new code.** The site has no chart library (`recharts` appears only in the separate `designs/share-card` subproject). Do not follow `src/lib/chartmaker.ts`: it holds chart metadata and sample datasets, and `/chartmaker` and `/chart` draw CSS bars. Follow the hand-rolled SVG in two files:
- `src/scripts/real-estate.mjs`: the `createElementNS` helper at `:23`, `chart()` at `:46-51` and `hpiChart()` at `:69`, with markup in `src/pages/real-estate.astro:32-33`.
- `src/scripts/business-feels.mjs`: `svgEl` at `:47`, `sparkline()` at `:63` and `renderCurve()` at `:113`. These pair each SVG with a `<title>` and a data table.

Candlestick/OHLC drawing does not exist anywhere in the repo.

### 5.2 Stage B: devnet-2 shared play market (worker-backed; needs Mike's yes)

Stage B runs on devnet-2, the planned home of the Nouns Money edition (not yet open: `NM_CHAIN_ENABLED` is false, `nouns-money-chain.ts:34`, and Phase B waits on Mike, PR #1413). It must never mint or claim Nouns Money editions. It reuses devnet-2, play ATTN, signed `publish_block`, `transfer` and `spend_allowance`, passkey signing, `public/chain/net/pointcast-chain.js` and the pins in `src/data/chain-home.ts`. Daily Mint's `chain_bid` ("a play-ATTN transfer plus a bid post") is a pattern only. Its code lives in the node-side devnet Worker, not this repo, and `/chain/mints` says no play auction runs yet (`src/pages/chain/mints.astro:176-179`).

| Action | On devnet-2 |
|---|---|
| Launch | Signed `publish_block` in channel `LAUNCHPAD`, with body `pointcast.launch/v1` (at most 8 KiB). Titles are capped at 120 characters and 200 bytes, and a small word filter returns 422 (`bots.astro:215-219`). That filter is not enough: the adapter runs the same filter as Stage A's Create surface (§3: `scanText`, the §2.4 extra list and the item 6 checks) over the name, symbol and title before anything is signed, and refuses a hit (a coin called "PUMP" trips `pump`). Symbols are never rendered with a `$` prefix (`dollar-ticker`). |
| Buy (person) | ATTN `transfer` (whole ATTN, more than 0) to the coin's vault, plus an optional `{op:"buy", txRef, minOut}` post. If `minOut` is missed, the buy is owed a refund. |
| Buy (bot) | `spend_allowance` from the owner to the vault, so the mandate's caps and payees bind (§6.5). The reducer counts both `transfer` and `spend_allowance` into a vault as buys. |
| Sell | Signed `{op:"sell", coin, baseIn, minOut}` post. The house pays out with a `transfer` from the vault: to the seller, or, for a bot, to its owner (the agent holds no transfer bit, so ATTN must not pile up in it). |
| Graduation | The reducer switches the coin to the pool venue. There is no op to withdraw LP, so the LP is effectively burned. No certificate by default (open question 6). |
| Fair launch | `seal_capsule` / `open_capsule` (tags 14 and 15) commit-reveal for auction orders. The capsule hides the post, not the ATTN transfer that pays for it, and `open_at` is a block height while block times are irregular. Mandated bots can take part only if the mandate's kinds mask includes tags 14 and 15 (§6.5). |

**Channel and station.** Signed `publish_block` accepts any `[A-Z0-9]{1,16}` channel (`bots.astro:217`). Stations are live on devnet-2 (launch record 13, `chain-home.ts:49-51`). Anyone can `claim_station LAUNCHPAD` in crew mode. After that, only the owner and their crew can post or seal there, and "A claim itself can't be undone" (`pointcast-chain.js:2996`, `:3610`, `:3615`). The published profile lists the house stations as ART, FD, GDN, GF, ORC and RLY (`chain-home.ts:100`), and `LAUNCHPAD` is not one of them. B0 claims `LAUNCHPAD` in open mode from a non-agent house account. That uses one of the account's 4 station slots (`chain-home.ts:99`). Otherwise the adapter must handle `NotCrew` rejections. Whether the code is free on devnet-2 is unverified as of 2026-10-19.

**Components in `workers/launchpad-house/`:**
- **Follower:** reads `/raw/blocks?from=` and uses `/stream` only as a wake signal, as `public/chain/yard/verifier/verify-worker.js` does (`:282`, `:53-56`). It keeps its cursor in the Durable Object. The SDK has no feed helper, so the follower uses raw fetch.
- **Chain wiring:** imports `DEVNET` from `chain-home.ts` and calls `assertDevnetLaunchPinned()` (`:131`). It signs and submits through the genesis-pinned `connect()`, and renders chain text with `textContent` only, as `src/lib/chain-strip.mjs` does.
- **`chain-adapter.mjs`:** turns chain transactions into engine events. The reducer is the *same* `engine.mjs` that Stage A uses.
- **Vault signer:** each coin's vault is a tz1 address from an ed25519 seed derived with `HKDF(VAULT_SECRET, coinId)`. A `transfer` may target only a tz1/tz2 address or a registered pca1 agent (`design.md:89`; `pointcast-chain.js` `KIND_FIELDS.transfer`), and agents are capped at 16 per owner. So vaults are not agents.
- **`CoinRoom` Durable Object:** a trade tape on the `DrumRoomV2` pattern (`workers/pointcast-drum/src/index.ts:224`): SQLite storage, hibernating WebSockets with attachments, an origin allowlist, a `script_name` binding and the load harness `scripts/load-drum-room.mjs`. Its limits are inbound: 8 messages a second per socket (`:9`), 512-byte frames (`:8`), 125 connections (`:6`) and 300 messages a second per room (`:14`). Clients send only small subscribe frames, and the house batches the outbound fan-out itself.
- **Cron:** writes a trending snapshot to KV.
- **D1 `0033_launchpad.sql`:** an optional projection cache that can be rebuilt from the chain. 0030 is taken by open PR #1287, main has 0031 and 0032, and open PR #1434 also uses 0032. Take the next free number at merge time, after re-scanning every `origin/*` branch with `git ls-tree`, as `docs/plans/2026-10-18-field-reports-v2-paper-spec.md:29` requires.
- **Off-chain records and bot APIs:** copy Sunset Downs: idempotent D1 receipts with `idempotency_key` and `request_hash` (`migrations/auth/0032_sunset_downs.sql`), plus `pointcast.agent-request/v1` signed requests (`functions/_lib/agent-identity.ts:8`). Not agent-payments v1 (§5.3).
- **Integrity:**
  - Every coin page shows a solvency check: the vault's on-chain ATTN must be at least what the reducer says is owed.
  - The reducer's sha256 is pinned, the same way the verifier's is.

**Stage B constraints:**
- **Whole-unit amounts.** `transfer` amounts are whole-unit u64, "ATTN, > 0". The reducer tracks µATTN, rounds payouts down to whole ATTN, and leaves the remainder in the vault as visible dust. `transfer` has no memo field, hence one vault per coin.
- **Transaction budget.** 5,000 signed transactions per UTC day, shared by the whole devnet (`bots.astro:213`). Each IP may send 60 signed transactions a minute (`:214`), and each block carries at most 64 passkey transactions by default (`DEFAULT_MAX_WEBAUTHN_TXS_PER_BLOCK`, `pointcast-chain.js`).
  - Bot swarms stay in Stage A.
  - Live bots get 300 transactions a day in total, at most 10 per bot.
- **Passkeys.** The rp id is `pointcast.xyz` and the only origin is `https://pointcast.xyz` (`chain-home.ts:97-98`). Device passes may never sign value moves, so every buy is a Face ID or Touch ID prompt. Nothing signs on localhost or Pages previews.
- **Resets.** `PRESENCE_FLIP = 'reset'` (`chain-home.ts:85`) means devnet-2 will be reset again when presence moves to Ticketed. The reducer must replay from a new genesis, and the page must show the reset notice. The station claim does not survive a reset. After a reset the house must re-claim `LAUNCHPAD` (open mode) before re-enabling posts, and on the Ticketed chain that claim needs the house account's bound presence pid (`pointcast-chain.js:2997`: "a ticketed chain: your bound presence pid; empty elsewhere and for house codes"). The claim is irreversible and open to anyone right after a reset. Until the house holds it again, the adapter treats the channel as unclaimed and handles `NotCrew`.

### 5.3 Stage C: what a full system would need (described, not scheduled)

This section stays only as the case study's comparison with a real launchpad: a research estimate, not a plan. It has no row in the §7 roadmap. The page's Stage C comparison is a reworded summary of it that must pass the honesty test (§2.4). It names no real quote asset (SOL, USDC, tez or any other) and no payout, and it says plainly that none of it is planned (§2.4 item 8). It uses no dollar figures, "credits held" for the holdings table, "virtual liquidity" and "pool depth" for reserves, and "a receipt type priced in a real currency" for the agent-payments receipt. Text lifted verbatim from this section would fail `scanText`. If any of it were ever pursued, house direction points to a closed loop and to Tezos with the existing toolchain (`enjoy-money.ts:21-22`). Any on-ramp would need its own review. That is a decision for Mike, not part of this plan.

| Component | Choice |
|---|---|
| Program | **C1:** native `curve_*` transaction kinds in the pointcast-chain Rust repo (not in this repo). They always need a node, kernel and wasm upgrade plus a verifier re-pin (`chain-home.ts:162-164`). They also need a devnet reset if their parameters go into a new launch record, as happened with every kind family so far (records 2, 6, 8 and 13), because Params hash into the genesis (`design.md:53`). v2.md planned stations without a re-genesis, but stations shipped with launch record 13 and a reset. So a reset is the likely path, not a hard requirement. **C2:** Solana devnet. A [Meteora DBC](https://github.com/MeteoraAg/dynamic-bonding-curve) spike graduates into a DAMM v2 (cp-amm) pool. Its LP is split between partner and creator into claimable and locked shares, with at least 10% locked (`MIN_LOCKED_LIQUIDITY_BPS = 1000`). Locked LP keeps earning claimable fees, so it is locked, not burned. DBC's fee scheduler covers the sniper fee, and it also has a rate limiter. It has no built-in opening batch auction. The alternative is a custom Anchor program, `pc_curve`, covering create, v3-style buy/sell, auction, sniper fee, held fees and sweeps, and `migrate` into a CPMM with the LP burned. Only the custom program delivers "auction" and "LP burned" exactly. |
| Indexer | Helius webhooks or Yellowstone gRPC feed a decoder. Upserts are idempotent on `(sig, ix)`, with a slot cursor and rollback between confirmed and finalized. |
| Bus and state | Cloudflare Queues; one `CoinDO` per coin; a sharded `FirehoseDO`; a D1 ledger with projections (Postgres or ClickHouse at scale); R2 for coin art |
| Realtime | WebSocket gateway; candles rolled up from 1s to 1d |
| Wallet policy service | [Turnkey](https://docs.turnkey.com/concepts/policies/examples/solana), [Privy](https://docs.privy.io/controls/policies/example-policies/solana) or [CDP](https://docs.cdp.coinbase.com/wallet-api/v2/using-the-wallet-api/policies) server wallets for house bots; Swig or session keys for bots that users delegate (these links are carried from the 2026-10-11 research and were not re-opened) |
| Bot runner | Isolated workers driven by Durable Object alarms, using the same SDK and gate. Signing goes through the policy engine. |
| Data model | The tables from research §4.4 (with `balances` renamed `credits_held`): `coins, curves, pools, trades, credits_held, candles, auction_orders, creator_fee_shares, fee_sweeps, bots, wallet_policies, bot_intents, receipts, risk_flags, wallet_clusters, trending_snapshots, indexer_cursors` |
| Receipts | `pointcast.agent-payments/v1` is a receipt type priced in a real currency (`amount_usd`; `packages/agent-payments-protocol/SPEC.md:32`, `:168`), and its signer uses `node:crypto` and `fs` (`packages/agent-payments-protocol/src/signing.mjs:28-29`). A play-credit fill fits it only as a mode `test` receipt with `amount_usd` 0, leaving the credit and token amounts outside the signed manifest. Use a separate fill-receipt type that reuses the Ed25519 manifest scheme, or a v2 with multi-currency amounts. |
| Flow | Transaction → program → decoder → Queue (`CREATE`, `TRADE`, `COMPLETE`, `MIGRATE`, `SWEEP`) → ledger, candles, risk and trending → KV and WebSocket. Bot intents go through the policy service before signing. |

**Effort (research estimate, not a plan), from research §4.8.** C's scope is the research's Phase 2: a DBC spike (option A, 2 weeks), a custom program (option B, about 2 more weeks), an indexer and policy server wallets. That phase is estimated at 2–3 engineers for 6–8 weeks. Its exit criteria are 10,000-trade parity, indexer lag under 2 slots at p95, and external testers. "5–8 people, 3–6 months" is the research's Phase 3 estimate: two-firm audits, MEV protections, a sharded firehose and analytics stores, a 1k trades/s load test and incident runbooks. It applies only if C's scope grows to include those.

## 6. Bot policy and the gate

### 6.1 Policy

A versioned JSON object, frozen once loaded. Field names follow §2.5 because they can reach the policy editor.

```js
{ v:1, rev:0, maxPerTrade:"50", windowCap:{amount:"500", ticks:3600}, maxTradesPerWindow:120,
  cooldownTicks:5, maxPositionBps:200, maxSlippageBps:800, maxPriorityFeeBps:50,
  permittedCoins:null, blockedCoins:[], permittedCreators:null, expiresAtTick:86400,
  approvalAbove:"25", killed:false }
// The Sniper ships with { ...defaults, maxPerTrade:"100", maxPositionBps:350, maxSlippageBps:3000, approvalAbove:"100" }
```

- `v` is the schema version and does not change when a policy is edited. `rev` counts edits: every accepted edit bumps it, and §6.3 voids approvals on a `rev` change.
- `maxPositionBps` is measured against total supply (1,000,000,000 tokens).
- `approvalAbove` is now below `maxPerTrade`. In v1 it was 200 against a `maxPerTrade` of 50, and `PER_TRADE` runs first, so no trade could ever need approval. The Desk sets its limits the same way round: approval above $15 under a $20 position cap.
- **The Sniper's own policy.** Under the defaults, its 100 cr buy fails `PER_TRADE`. It would also break a 2% position cap: 3.41% of supply at curve start (34,101,382.389096 tokens, with the 125 bps curve fee and its 30 bps priority fee inside the 100 cr gross), or 3.10% even after a 5% dev buy. The smallest `maxPositionBps` that admits it is 342. Because the gate values a buy at its gross, priority fee included (§4.3, §6.2), the 100 cr buy sits exactly at its `maxPerTrade` and `approvalAbove` of 100, not above them, so it passes `PER_TRADE` and approval never fires for it. The A/B needs it to trade unattended. It also needs `maxSlippageBps` 3000, which its buy intents ask for (`strategies.mjs:82`). On `classic-x100`, after `snipe-war`'s 20 cr dev buy, six 100 cr buys in one tick (30 bps priority fee inside) fill 0, 612, 1,169, 1,679, 2,145 and 2,574 bps below the pre-tick quote (BigInt recompute, rounded down). Under the default 800, four of the six would miss `minOut`, gutting the `naked` baseline that `fair ≤ 0.5 × naked` compares against. Lowering the intents to 800 is not an option for the same reason. The Sniper's 1500 bps sells (`strategies.mjs:75`) pass under 3000.

### 6.2 Gate order

The gate returns the first check that fails:

`KILLED → EXPIRED → BLOCKED_COIN / NOT_PERMITTED → COOLDOWN → RATE → PER_TRADE → WINDOW_CAP → POSITION → SLIPPAGE → PRIORITY_FEE → CREDITS → NEEDS_APPROVAL`

- `PER_TRADE`, `WINDOW_CAP`, `POSITION`, `CREDITS` and `NEEDS_APPROVAL` apply to buys. The credit checks value a buy at its gross, `quoteIn`, which already contains the curve or pool fee, any sniper fee and any priority fee (§4.3). `POSITION` is measured in tokens. "Above" means strictly greater.
- **Grants are reserved.** The gate runs at proposal time (phase 3) but fills happen in phase 5, so counting only fills would let two intents from one bot in the same tick both pass. Each grant is recorded when the gate passes it and undone if the engine refuses the intent, as the draft does (`record()` at grant time, undo on engine refusal, `sim.mjs:160-161`). Below, "pending grants" are grants made earlier in the current tick that have not yet executed.
- One rule per reason code (windows are rolling: the last `windowCap.ticks` ticks, `(tick − windowCap.ticks, tick]`):
  - `KILLED`: `policy.killed`, the bot's kill toggle or the global kill is on.
  - `EXPIRED`: `tick ≥ expiresAtTick`.
  - `BLOCKED_COIN`: the coin is in `blockedCoins`. Checked before `NOT_PERMITTED`.
  - `NOT_PERMITTED`: `permittedCoins` is a list without the coin, or `permittedCreators` is a list without the coin's creator.
  - `COOLDOWN`: `tick − lastFillTick < cooldownTicks`, where `lastFillTick` is the tick of the bot's last fill or pending grant on any coin (an auction fill counts at its clearing tick, §4.7). A grant the engine then refuses is undone, so it does not count.
  - `RATE`: fills plus pending grants (buys and sells) in the window `≥ maxTradesPerWindow`. Refused intents don't count.
  - `PER_TRADE`: `gross > maxPerTrade`.
  - `WINDOW_CAP`: `(Σ gross of buys filled in the window) + (Σ gross of pending buy grants) + gross > windowCap.amount`.
  - `POSITION`: `(held + quotedOut)·10000 > supply·maxPositionBps`, in tokens. `quotedOut` is the quote at proposal time; ordering can make the actual fill larger, so the engine also refuses a bot buy whose actual output would take its holdings past `maxPositionBps`, with reason code `POSITION` (the draft passes this as `maxBase`, `sim.mjs:162`, refused at `engine.mjs:203`).
  - `SLIPPAGE`: `intent.maxSlippageBps > policy.maxSlippageBps`.
  - `PRIORITY_FEE`: `priorityFeeBps` is not a whole number `≥ 0`, or `> maxPriorityFeeBps`.
  - `CREDITS`: `gross > credits held − Σ gross of pending buy grants`.
  - `NEEDS_APPROVAL`: `gross > approvalAbove`.
- Sells pass through the other checks. The engine separately refuses a sell above holdings (the equivalent of The Desk's no-shorting check) and a creator sell under the dev lock.
- **Arithmetic of the defaults.** 500 / 50 = 10 maximum-size buys per window. The cooldown alone would allow 720 trades per window, so `maxTradesPerWindow` (120) is the binding count. `RATE` binds before `WINDOW_CAP` only for trades under 4.166666 cr.

### 6.3 Approvals

- `runScenario` takes `approvals: 'deny' | 'queue'`, default `'deny'`. Under `'deny'` (headless runs, pinned scenario hashes), `NEEDS_APPROVAL` means deny: the refusal is a hashed `GATE_REFUSE` event (§5.1), so the pinned hashes cover it. Under the defaults Momentum's 30 cr buys need approval (§6.6), so a scenario that needs Momentum to trade headless raises its `approvalAbove` in the scenario file.
- Under `'queue'` (the live page, from A1), the intent goes to the console's approval queue as a `QUEUED` event. The viewer approves or declines it, and the decision enters the human action log. The PR 1b board runs `'deny'`; the queue UI ships in A1.
- **Intent and coin ids.** An intent's id is `${botId}:${tick}:${n}`, where `n` counts that bot's intents in that tick from 0. A coin's id is `c<n>`, numbered in launch order within the run (the draft's `c${world.coins.size + 1}`); `permittedCoins` lists these ids.
- **Run key.** Approvals bind to a run key (scenario, seed, rules, `configHash`) plus the intent id. Seeded intent ids repeat on every run with the same seed, so a reset, a switch of scenario, seed, rules or config, or a pasted replay from another run key clears the queue and the human action log, and an `approve` record whose run key differs is refused. This keeps `/bot-money`'s rule that a reset never reuses proposal IDs (`tests/bot-money-demo.test.mjs:135`).
- A queued intent is void after 30 ticks, or as soon as the bot's policy `rev` or its credits change (a `VOID` event). This matches `/bot-money`, where any policy change invalidates a pending approval and stale proposals can't run (`tests/bot-money-demo.test.mjs:80`, `:103`).
- An approved intent is re-gated and re-quoted when it runs: a fresh quote sets `minOut` with the intent's original `maxSlippageBps`. If the gate now refuses it, the approval is void and the refusal is logged.

### 6.4 What comes from The Desk, and what doesn't

The gate borrows only the outline of The Desk's Risk Gate: kill first, a denylist, position before cash, approval last, and the first refusal wins. The Desk's gate is `functions/_lib/the-desk/gate.mjs` on the unmerged branch `claude/desk-venues-2026-10-03` (`8bd546e9`, open PR #1322), not on main. The frozen `REFUSALS` list idea (`gate.mjs:17-21`) is reused.
- `EXPIRED`, `COOLDOWN`, `RATE`, `PER_TRADE`, `WINDOW_CAP`, `SLIPPAGE` and `PRIORITY_FEE` are new launchpad checks. `RATE` is only loosely like the Desk's per-tick order budget (`maxOrdersPerTick`), which trims proposals rather than refusing them.
- The Desk's daily-loss halt, venue bankroll cap, fail-closed seal and post-seal kill re-check have no counterpart. The engine's event hash covers integrity in the sim, and a kill takes effect in the same tick (tested). A daily-loss halt on net credits per window is a possible later addition.
- The Desk's gate is async, backed by D1, priced in floating-point USD and reads `Date.now`. The launchpad gate is a pure, tick-based BigInt function, so it is a new design, not a port.

### 6.5 Stage B mapping onto `set_mandate`

Only part of the policy maps. Everything else stays in the off-chain gate.

| Policy | `set_mandate` | Notes |
|---|---|---|
| `windowCap.amount` / `.ticks` | `spend_per_period` / `period_blocks` | Approximate. Periods are fixed and height-aligned (`height / period_blocks`, `design.md:166`), not rolling, so 500 at the end of one period plus 500 at the start of the next can land within a few blocks. Block time varies. Amounts are whole ATTN. |
| (derived) | `spend_total` (required) | `ceil(expiresAtTick / windowCap.ticks) × windowCap.amount` = 24 × 500 = 12,000 under the defaults |
| `permittedCoins` → their vaults | `payees` (at most 16) | Fences buys only if bots buy with `spend_allowance`, the kinds mask leaves out `transfer`, the reducer counts `spend_allowance` into a vault as a buy, and at most 16 coins are permitted. Adding a coin means a re-grant, which also zeroes the counters. `permittedCoins: null` maps to `payees: []`, which allows any receivable address for signed spends and refuses custodial ones (`design.md:175-176`). |
| `expiresAtTick` | `expires_at` | Converted to a block height. Exclusive, and fails closed. |
| `killed` | `set_mandate` with `kinds = 0` | A re-grant: it pauses the agent, fails closed and zeroes the counters (`design.md:163-164`). This is the only kill switch the plan relies on. **Never `clear_mandate`**: it "returns the agent to legacy unscoped behaviour" (`design.md:181-182`), removing every on-chain limit. |
| (new) | `kinds` | `publish_block` (tag 1) and `spend_allowance` (tag 10). Not `transfer` (tag 5): an agent's own `transfer` is uncapped (`design.md:167-169`). The base delegable set is tags 1–7 and 10 (`design.md:156`). Launch records can add more (editions 22/23 per `pointcast-chain.js:3217-3218`, and per `v2.md:137` capsules 14/15); devnet-2's actual set is unverified. For coins whose rule set is `auction` or `fair`, add `seal_capsule` (14) and `open_capsule` (15) to the mask if B0 confirms devnet-2 delegates them; otherwise mandated bots stay out of Stage B auctions. |
| (new) | `channels` | `[LAUNCHPAD]` |
| `maxPerTrade`, `maxTradesPerWindow`, `cooldownTicks`, `maxPositionBps`, `maxSlippageBps`, `maxPriorityFeeBps`, `blockedCoins`, `permittedCreators`, `approvalAbove` | none | Off-chain gate only |

Each bot must be a pca1 agent registered by a human owner (`design.md:59`: "Only humans may register agents"). `wallets.md:46` says only tz1/tz2 owners can register agents and that a passkey user cannot own one; this is unconfirmed (the Rust source is not in this repo). An owner gets at most 16 agents over its lifetime, because there is no deregister (`wallets.md:260`, `:262`).

### 6.6 Strategy interface

```js
export const strategy = {
  id, label, description, defaults,
  init(params) → state,
  onTick(view, state, params, rng) → Intent[],  // view is read-only, deep-frozen
};
// Intent = { side:'buy'|'sell', coin, quoteIn? | baseIn?, maxSlippageBps, priorityFeeBps?, reason }
```

The draft's signatures stand (`strategies.mjs:6`; called at `sim.mjs:38` and `:148`). v1's `init({ params, wallet, rng })`, `onTick(view, state, rng)` and `onEvent` are dropped. Strategies only *propose* trades. The runner orders, gates and executes the intents. Each bot gets its own random stream through `rng.fork(botId)`.

| Built-in | Rule (defaults) |
|---|---|
| Market maker | On the busiest live coin (most trades in the last 300 ticks), keeps a band of ±4% around EMA(60). Sells 2% of its holdings above the band and buys 20 cr below it. No inventory target. |
| Momentum | Buys 30 cr when the 30-tick price change is above 8% and the buy/sell ratio is above 1.5. Uses a 12% trailing stop. At 30 cr it is the one built-in bot whose buys exceed the default `approvalAbove` of 25, so its buys fill the approval queue under the defaults. |
| Sniper | Buys 100 cr gross (its 30 bps priority fee inside) once per coin: as an auction order while the coin is in its opening auction, or else within 60 ticks after trading opens and only while any sniper fee is at most 10% (`maxFeeBps` 1000, `window` 60 in the draft). Under `naked` that is tick 0 after open; under `sniper-fee` the guard holds it back until tick 34 (`f(34)` = 938 bps), which keeps it out of the fee window. Runs under its own policy (§6.1). Sells at 2.5× or after 300 ticks. The defense A/B measures this bot. |
| Dip buyer | Buys 20 cr when the price is 20% under its 300-tick high and holders are still rising. Sells at +30%. |
| Holder | Buys 20 cr of coins with a risk score under 25 and holds them to graduation. Sells half after migration. |

Scenario actors make runs more realistic:
- **Dev:** makes the dev buy and may dump.
- **Bundler:** wallets funded by the creator that buy in the creation tick. Part of `dev-dump`.
- **Retail noise:** arrivals per tick drawn from Poisson(`rate`); each arrival picks a wallet and a coin (weighted by recent trades), and buy sizes are uniform in [`minSize`, `maxSize`] cr (the draft, `sim.mjs:175-193`).
- **Copy-trader:** follows a leader wallet with a delay.

## 7. Roadmap

| Phase | Scope | Effort | Acceptance |
|---|---|---|---|
| **A0 (PRs 0, 1a.1, 1a.2, 1b)** | PR 0: this plan as a repo doc. PR 1a.1: units, PRNG, config, curve, pool and engine, with their tests and CI. PR 1a.2: gate, strategies, screener, simulator and scenarios, with their tests. Neither has routes. PR 1b: the case-study page at `/case-studies/launchpad/` with a small live board, the JSON twin, the coin SVG route, `coin-art.mjs`, `exhibits.mjs` and CSS; Task A's brief goes to Manus as a PR comment (§8, §9.2) | 4–5 days | Each PR, on its own: the `tests/launchpad-*.test.mjs` it ships pass, and `build:bare` and `audit:agents` pass. PR 1a.1: the §4 numbers reproduce. PR 1a.2: scenario hashes are pinned; the A/B assertion passes (§8.6, owned here); the honesty test passes on scenario and strategy strings. PR 1b: the honesty test passes on the page source, twin, SVG route and the built page's own content region; the built page is `noindex, nofollow` and out of `dist/sitemap-0.xml`; the §8.5 page criteria hold; `tests/seo-discoverability.test.mjs` passes |
| **A1** | All six surfaces in the browser, including the Create surface with its name filter and `launch` log records (§3), the approval queue (`approvals: 'queue'`, §6.3) and the `localStorage` watchlist (twin flag and brief updated, §8.5); replay links; 1×/10×/100× speed (1× is optional for long scenarios: `graduation-run` takes 40 minutes at 1×) | 2 weeks | (a) **Compute:** a headless 1-hour sim (3,600 ticks, 20 bots) finishes in under 5 s on a mid-range phone, which is more than 720× real time and under about 1.39 ms per tick. (b) **Playback:** at 100× the page keeps up for the whole 36 s, each tick (sim plus render) stays under 10 ms, and no ticks are dropped. No ledger drift. Works at 375 px width. (v1's "1-hour sim in under 5 s at 100×" was impossible: 3,600 s / 100 = 36 s.) |
| **A2** | A graduation animation with a "graduated · LP burned" seal on the coin card; case 06 in `src/data/ues-business-cases.json`, with its link set only when the route ships (`releaseRule`, `:3`); both noindex switches removed, the `NOINDEX_PATHS` entry and the BlockLayout `noindex` prop, and `/case-studies/launchpad.json` may join `sitemap-discovery.xml.ts` (§2.3); the Manus brief may move into `docs/briefs/`, its title and extracted lede then joining the honesty scan | 1 week | Every string field of case 06 that `/ues/business` renders (`name`, `title`, `summary`, `actionLabel`, `state`, `note`; `src/pages/ues/business.astro:31`) passes `launchpad-honesty` and Codex review (§9.1); the built page carries `index, follow` and `dist/sitemap-0.xml` lists the route. The A/B assertion lives in A0 (§8.6), not here |
| **B0 (gate)** | Mike's yes on Stage B; Manus reads devnet-2 `/params`, `/status` and `/station/LAUNCHPAD`; `town` is re-sized from the real `tap_reward`, drum rules, `epoch_blocks`, block rate and budget; the `claim_station LAUNCHPAD` (open mode) is signed from the non-agent house account by Mike, or by Manus with Mike's explicit yes. Claude Code does not sign it. The claim is irreversible and is logged in `docs/manus-logs/` | 1–2 days after the yes | A written sizing note; the station is claimed and the claim is logged; `town` constants are final |
| **B1** | Read-only devnet adapter, `LAUNCHPAD` posts, reducer pin, replay script | 1.5 weeks | Replaying the devnet feed gives byte-for-byte the same state as the worker |
| **B2** | House worker (vaults, sells, refunds, tape Durable Object, bots under mandates buying with `spend_allowance`); Manus QA. Runbook: Mike, or Manus with Mike's yes, deploys `workers/launchpad-house` with `npx wrangler deploy` in that folder (`docs/OPERATIONS.md:63-64`) and sets `VAULT_SECRET` as a Cloudflare secret that is never committed, before the Pages deploy. After any devnet reset, the house re-claims `LAUNCHPAD` (open mode, bound presence pid on the Ticketed chain) before posts are re-enabled (§5.2) | 2–3 weeks | Solvency check passes; a `set_mandate kinds=0` kill stops a bot on chain; Manus completes passkey trades on `pointcast.xyz` and logs them in `docs/manus-logs/`; Codex review done |

Stage C has no row: it is not planned work. §5.3 keeps it only as the case study's comparison, labelled as a research estimate, not a plan.

**PR 1 merge defaults.** PR 1 (1a.1, 1a.2 and 1b) builds in answers to open questions 1–3 and 8. It merges after Mike answers them, or ships on these stated defaults:
- Q1: the route is `/case-studies/launchpad/`.
- Q2: the "Never use" list binds the page, with exact citations excused.
- Q3: plain Noun portraits marked SIMULATED (option (a) of open question 3), and Mike's approval of PR 1b approves the overlap explicitly, not just CC0 reuse: coin Noun N is the same portrait as Nouns Money design `nm100-N` / NM27-(N+1) (§2.3). No coin wears a note frame.
- Q8: "play credits", kept in one exported constant that the page, the JSON twin and the honesty test all import, so a switch to "demo credits" is a one-line change.
- Indexing: noindex until A2, through both switches: the `NOINDEX_PATHS` entry (sitemap) and BlockLayout's `noindex` prop (robots meta) (§2.3).
- The Nouns line is "Noun art is CC0. Not a Nouns token. Not a claim on the Nouns treasury. No Nouns DAO endorsement." (§1).

Every launchpad PR, docs-only PR 0 included, merges only after Codex review and Mike's approval (`AGENTS.md:161`, §9.1).

## 8. Stage A, PRs 0, 1a.1, 1a.2 and 1b: exact contents

The draft is 27 files and about 3,270 lines, too much for one review (`CLAUDE.md`: "small, reviewable pull requests"). Even `src/lib/launchpad/` plus the scenarios and tests is about 2,580 lines (`engine.mjs` 500, `sim.mjs` 300, `screener.mjs` 267, …) before the 25-tier table and the screener test are added, against about 650 for the page side. The work ships as four PRs, each from its own worktree and branch:
- **PR 0 (docs only):** this plan at `docs/plans/2026-10-19-launchpad-case-study.md`, the path the draft page, JSON twin and brief already link to (`exhibits.mjs:20`, `:156`; `launchpad.astro:240`). The repo is public and the page links this doc, so before PR 0 the doc was scrubbed of session-local material: home-directory paths became repo paths or are marked "local session, not preserved", notes about what the build session could not reach became "unverified as of 2026-10-19", and Appendix B's list of scratch scripts moved into the PR 0 description.
- **PR 1a.1 (engine):** `units`, `prng`, `config`, `curve`, `pool` and `engine` in `src/lib/launchpad/`, with `launchpad-curve` and `launchpad-engine`, `launchpad-honesty` with only the purity check, and `launchpad-check.yml` without the post-build step. No routes. The workflow ships here, not in 1a.2, because no repo-wide workflow runs `node --test`, so 1a.1's tests would otherwise never run in CI.
- **PR 1a.2 (simulation):** `gate`, `strategies`, `screener` and `sim`, the four scenarios, `launchpad-gate`, `launchpad-screener` and `launchpad-sim`, and the honesty test's scenario and strategy strings. No routes.
- **PR 1b (page):** the page, the JSON twin, the coin SVG route, `coin-art.mjs` and `exhibits.mjs` (where their output is first used), the CSS, the `seo-rules.mjs` entry, the rest of the honesty test (page source, twin, SVG, `SOURCES`, coin art, built page) and the workflow's post-build step. Task A's brief goes to Manus as a PR comment, not a `docs/briefs/` file (§2.3, §9.2). The Codex review of the agent-readable twin then sits in a small PR.

**Sequencing.** Each PR builds on the one before it: 1a.2 imports 1a.1's engine, and 1b imports `src/lib/launchpad/`. So each is either stacked on the previous PR's branch (and retargeted to `main` when that merges) or cut from a fresh `origin/main` only after the previous PR merges. No PR's CI reads a file the PR doesn't ship (§8.6).

"PR 1a" below means 1a.1 and 1a.2 together, and "PR 1" means 1a.1, 1a.2 and 1b, unless one is named.

### 8.1 Base

**Build machine.** PR 1 was built in a cloud session that held the draft (local session, not preserved). On Mike's iMac, where `~/pointcast` exists, the draft does not; rebuilding there means checking out the PR branches. Each PR gets its own worktree and branch, as `docs/OPERATIONS.md:9-10` says (for 1a.2 and 1b, based on the previous PR's branch until that PR merges, per "Sequencing" above):

```
git -C ~/pointcast fetch origin
git -C ~/pointcast worktree add -b <branch> ~/pc-launchpad-pr origin/main
cd ~/pc-launchpad-pr && npm ci
```

The `cp -c` node_modules step in `docs/OPERATIONS.md` is a macOS APFS clone; a Linux build uses `npm ci`.

**Cleanup after each merge** (`docs/OPERATIONS.md` §1, §2, §5): remove that PR's worktree (`git -C ~/pointcast worktree remove ~/pc-launchpad-pr`) and delete any `dist/` it built. Each PR checklist carries this step.

- Main already has all of Currency Builder (via #1416, `a816fd57`, 2026-10-14) and Almanac (#1424, 2026-10-19). Main is now `7efd2faa` (#1446), and `claude/gracious-fermi-ghq2kl` adds nothing and is 29 commits behind it. #1446 touches no launchpad path. Never work in the main checkout (`~/pointcast` on the iMac).
- The creative v2 files (`security.mjs`, `type.mjs`, `glyphs.json`, the glyph script, `src/assets/currency-builder/`) are committed on main. PR 1 doesn't touch them.
- `nounArt(id)` with no options draws all four layers. The `layers` option is committed (`src/lib/currency-builder/primitives.mjs:48-51`, `src/lib/nouns-parts.mjs:96`). Ids outside #0–99 throw (`primitives.mjs:50`).
- `src/components/currency-builder/Top.astro` is not edited.

### 8.2 The local draft, and what was built

The Stage A draft was this build session's own work in progress (local session, not preserved). Before the PRs it was reconciled with this plan: every item in "To change or check" below is done, each in the PR that ships the file. None of the draft's pinned hashes carried over: every pinned `logHash` and the dev-buy and Sniper test values were regenerated after the reconciliation and pinned on purpose. Each PR description lists its files with their sha256.

**As built (2026-10-20).**
- PR 1a.1 (`claude/launchpad-engine`): `units`, `prng`, `config`, `curve`, `pool` and `engine`; `launchpad-curve` (7 tests) and `launchpad-engine` (17 tests); `launchpad-honesty` with the purity check only; `launchpad-check.yml` without the post-build step.
- PR 1a.2 (`claude/launchpad-sim`, stacked on 1a.1): `gate`, `strategies`, `screener`, `sim` and `copy-rules`, the four scenarios; `launchpad-gate` (14), `launchpad-screener` (8, new) and `launchpad-sim` (6, with 16 pinned hashes: four scenarios under each of the four rule sets); the honesty test adds scenario and strategy copy.
- PR 1b (`claude/launchpad-page`, stacked on 1a.2): the page, the JSON twin, the coin SVG route, `coin-art.mjs`, `exhibits.mjs`, the CSS and the `NOINDEX_PATHS` entry; the `/case-studies/launchpad/` entry in `functions/_middleware.ts` `paperRooms` (its slash-less, `.html`, `/index` and `/index.html` aliases 301 to the page), with its case in `tests/nouns-money-workshop-middleware.test.mjs`; the rest of the honesty test and the workflow's post-build step. Task A's brief is a PR comment.

**Decisions made while building** (each is a choice this plan left open, or a small extension of it):
- **Auction-order priority fee.** The curve fee on an order is only known when the auction clears, so an order's priority fee is measured on the order itself: `priority = g − floor(g·D/(D + rPriority))` for an accepted gross `g`, and the rest is escrowed. It stays inside the 30 cr cap and goes to the house when the order is placed; a cancel (a kill) refunds both.
- **Dev-buy cap.** A dev buy may spend at most the exact-out cost of 5% of supply (net at most `ceil(Q·cap/(B−cap))`). An exact-in buy at that cost receives the cap plus rounding: at the plan's 148.460411 cr (`naked`) or 221.774194 cr (`sniper-fee`) it gets 50,000,000.005720 tokens. One cent more is refused (`DEV_BUY_CAP`).
- **Sells and priority fees.** `sell()` takes `priorityFeeBps` per §4.3; a sell whose fee would exceed its gross (a priority fee near 100%) is refused with `BAD_AMOUNT`.
- **Engine refusals.** `ENGINE_REFUSE` is emitted for every refused proposal, scenario actors included (`intent` null), and for a refused viewer `launch` record with `side: 'launch'` and reason `FILTERED` (the copy rules) or the engine's reason.
- **Control-record refusals.** A control record that cannot apply (another run key, an intent no longer queued, a bad policy edit, a viewer record naming a scenario wallet) changes nothing and is reported in the sim's `humanRejects`, not hashed. The record itself is in the log, so a replay reproduces the same no-op.
- **Viewer wallets** appear (with `humanCredits`) when their first record runs, so a live run and its replay create them in the same tick. `quoteConserved` compares against the credits every `WALLET` event started with.
- **Kill presses** call `sim.kill()`, which appends a `kill`/`unkill` record for the next tick to run; it applies in that tick's phase 2, before proposals. The board shows the pressed state until then. A bot still stopped after the tick's control records has its open auction orders withdrawn and their gate grants undone, so a kill undone in the same tick leaves its orders alone.
- **Position cap.** The gate's `POSITION` check counts the tokens the bot's earlier grants in the same tick are expected to take, and the engine-side cap (`maxBase`) is computed when the intent fills, from the holdings at that moment.
- **Policy amounts** (`maxPerTrade`, `approvalAbove`, `windowCap.amount`) must be decimal strings, so no float reaches a hashed `POLICY` event. Record amounts and `slippageBps` are validated when a record enters the log.
- **"Raised"** in run summaries is the curve raise (`realQuote`, the `COMPLETE` event's `raised`), also for graduated coins, not the pool's depth.
- **Viewer text filter** lives in `src/lib/launchpad/copy-rules.mjs` (not in §8.3's list): `scanText` with nothing excused, the §2.4 extra list, the item 6 marks, and for viewer text any real unit word. The honesty test pins the extra list's pattern to §2.4 item 4.
- **Trending** is split into `trending()` (inputs from the index) and a pure `scoreTrending()` that the screener test drives with synthetic rows.
- **Pool tier lookup** takes the last tier whose scaled threshold the pool's market cap has reached (`mcap ≥ from·s`).
- **Speeds.** The board keeps 10, 100 and 1,000 ticks/s (§8.5's criterion is 10× and 100×).

Already in line with v2 (read in source, not re-run):
- route `/case-studies/launchpad/`
- `town` migration fee 150,000 µATTN (`config.mjs`)
- the house takes fee rounding (`engine.mjs`)
- softplus strength in trending (`screener.mjs`)
- the `BUNDLED` threshold of 5% (`config.mjs:73`); its counting window differs, below
- grants reserved at gate time and undone on engine refusal, plus the engine-side `POSITION` refusal (`sim.mjs:160-162`, `engine.mjs:203`; §6.2)
- purity test banning network, clock, storage and unseeded randomness
- `launchpad-check.yml` without the puzzles audit step

To change or check (all done; kept as the record of the reconciliation):
- `approvalAbove: '200'` in `gate.mjs` must become `'25'`.
- Gate valuation: the draft's `spendOf` adds the priority fee on top of `quoteIn` (`gate.mjs:70`), so the Sniper's buy would cost 100.3 cr and fail `PER_TRADE` at 100. Adopt §4.3/§6.2: `quoteIn` is the gross, fees inside, and the gate values a buy at `quoteIn`.
- Engine fees, to match §4.3 and §4.4 (three more places than `gate.mjs:70`):
  - the engine charges the priority fee on top of `quoteIn` (`engine.mjs:206`, and the pool buy at `:297`: `wallet.credits -= quoteIn + priorityFee`); take it from inside the gross, `priority = floor(net·rPriority/D)`;
  - it splits the sniper fee off proportionally (`engine.mjs:208`); use `sniper = floor(net·rSniper/D)`;
  - on a crossing buy it splits the gross between the legs by net proportions (`engine.mjs:215`); use §4.4's `gross_c = net_c + ceil(net_c·r/D)` and `gross_o = gross − gross_c`.
- Sniper policy: `snipe-war.json` gives every sniper `maxPerTrade` "150", `maxPositionBps` 500 and `maxSlippageBps` 3000. Use §6.1's Sniper line, `{ ...defaults, maxPerTrade:"100", maxPositionBps:350, maxSlippageBps:3000, approvalAbove:"100" }`. The 3000 is decided, not optional: the draft's Sniper intents ask for 3000 (`strategies.mjs:82`), and lowering them to 800 would make four of six snipers miss `minOut` under `naked` and gut the A/B baseline (§6.1). The Sniper's 1500 bps sells (`strategies.mjs:75`) pass under 3000.
- Bundle window: the draft counts `bundle%` buys with `t.orderTick < coin.createdTick + Math.max(1, cfg.sniperTicks)` (`screener.mjs:130`), and `config.mjs:70` sets `sniperTicks` to 5, so it counts five ticks and overlaps the `sniper%` window. Limit it to the creation tick, as §4.8 says, then re-tune the 5% `BUNDLED` threshold on `dev-dump`.
- Approvals and the human log (none of this is in the draft): `loadPolicy` refuses `rev` as an unknown key (`gate.mjs:41`); accept it and bump it on each accepted edit. Add the `approvals: 'deny' | 'queue'` option to `runScenario` (default `'deny'`), deterministic intent ids `${botId}:${tick}:${n}`, the run key (§6.3), and the `launch`, `kill`/`unkill`, `approve`/`decline` and `policy` human-log records (§8.4). Kills are `sim.kill()` and `sim.killAll()` calls outside `humanLog` (`sim.mjs:227-234`), so replays would not reproduce them; route them through the log. The queue UI itself is A1.
- Momentum's default size is `'25'` (`strategies.mjs:42`); §6.6 makes it 30.
- Add `tests/launchpad-screener.test.mjs`, which does not exist yet.
- The page says "Demo credits only" while this plan says "play credits". The PR 1 default is "play credits" in one constant (§7 merge defaults, open question 8).
- Hashes: the draft's `logHash`/`eventsHash` and `configHash` use a 64-bit cyrb128 hash (`prng.mjs` `hashString`). Decision: keep the hash function (non-cryptographic, §5.1), but replace `toJSON(events)` (`config.mjs:81`, `engine.mjs:499`), which serializes in insertion order, with §5.1's canonical serializer; hash gate and engine refusals as events instead of keeping them in the separate `gateLog` (`sim.mjs:157`); and drop the float `priceAfter` from hashed events.
- Strategy interface and run shape: the draft's `init(params)`, `onTick(view, state, params, rng)` and `runScenario`'s `{ sim, summary }` return stand (§6.6, §8.3). Add the Sniper's fee guard and 60-tick window to its description, as §6.6 now has them.
- Fee tiers: `config.mjs` `POOL_TIERS` has 3 tiers. Decision: ship the full 25-tier table in millionths (§4.5).
- Clustering: `screener.mjs` clusters only by `fundedBy`, which matches the narrowed §4.8 rule. But its `dev` measure counts the creator's whole funded cluster (`screener.mjs:121-128`), while §4.8 makes `dev%` the creator wallet only. Change `dev`. Its `devSold` is sold/bought (`screener.mjs`), while §4.8 divides by peak holdings; change that too.
- Coin SVG route: the draft adds `src/pages/case-studies/launchpad/coins/[slug].svg.ts`. Decision: keep it, listed in §8.5 and scanned by the honesty test.
- Plan link: the draft links `docs/plans/2026-10-19-launchpad-case-study.md`. Decision: PR 0 commits the plan there, so the link resolves.
- Layout: the draft passes only `hideAds` (`launchpad.astro:54`), so its build loads the pageview beacon, wallet bridge, cursor room, freshness chip and `pc-layers.js`, and carries `<meta name="author" content="Mike Hoydich">`. Apply §8.5's `isolated`, `includeManifest` and byline props.
- Honesty test: the draft runs `OFFER_WORDS` on unstripped text, does not fail when `<article class="lp">` is missing (`launchpad-honesty.test.mjs:16`, `:64`), and reads `src/pages/case-studies/launchpad.astro` unconditionally, so it cannot ship in a PR without routes. It also excuses `NM_APPROVED_LINES` (`:14`), and its offer pattern has `mainnet` where §2.4 item 4 has `main\s*net`. Split it by PR (§8, §8.6); scan page, twin, SVG, scenario and strategy copy with `approved: []` and `SOURCES` separately; assert that neither `NM_STANDARD_LINE` nor `NM_REPLACEMENT_LINE` appears; entity-decode and strip the citation strings before the extra list; and fail on a missing root once the page exists (§2.4).
- Nouns line: replace the draft's footer "not affiliated with Nouns DAO" (`launchpad.astro:251`) with the §1 line.
- Speeds: the draft's speed control offers 10, 100 and 1,000 ticks/s with 100 selected (`launchpad.astro:181`), and has no 1×. PR 1b's criterion is 10× and 100× (§8.5), which the draft and the brief already meet; 1× arrives with A1.
- The brief (draft file `docs/briefs/2026-10-19-manus-launchpad-case-study.md`) has the timing right ("after the PR merges and `scripts/deploy.sh` has run"), and §9.2 Task A now matches it. It is delivered as a PR 1b comment, not committed under `docs/briefs/`, until A2 (§2.3). Keep its "no login, wallet or network calls" line only once §8.5's `isolated` flags hold; until then scope it to "the simulation makes no network calls". Its steps run "Snipe war" at 10× and "Graduation run" at 100×, which matches PR 1b's 10× and 100× criterion. The approval queue and the performance trace stay out of it until A1.

### 8.3 Library: `src/lib/launchpad/` (pure `.mjs`)

- `units.mjs`: `ceilDiv`, `mulDiv`, basis-point helpers, and parsing and formatting of credit amounts.
- `prng.mjs`: sfc32 with `fork` and `shuffle`.
- `config.mjs`: frozen presets (`town` fee 0.15), the full 25-tier pool table (§4.5) in millionths with thresholds scaled by `s`, the credit-word constant (§7), rule sets, limits (dev buy 5%, early cap 2%, auction cap 30 cr), trending and risk weights, and `configHash()`.
- `curve.mjs`: quotes, applying buys and sells, market cap, both progress measures (credits clamped at 100%), and `Qgrad`.
- Fees: tier lookup, the split with the house remainder, and the integer sniper-fee schedule. These go in `fees.mjs`, or in `config.mjs` and `engine.mjs` as the draft does.
- `pool.mjs`: the CPMM with burned LP.
- `engine.mjs`: the coin state machine, auction clearing, dev-buy rules, migration overflow, `migrate`, `sweep`, fee split, the ledger and net credits, and events.
- `screener.mjs`: rolling windows, candles, metrics, trending (with the §4.6 fix), risk and clusters.
- `gate.mjs`: policy validation (unknown keys refused; `rev` is a known key), the check order, grant reservation and a frozen reason list.
- `strategies.mjs`: the 5 built-in strategies and 4 scenario actors.
- `sim.mjs`: `runScenario({seed, scenario, rules?, preset?, config, humanLog, approvals = 'deny'})` returns `{ sim, summary }`, the draft's shape; `summary` holds the §8.4 metrics and `logHash`. `rules` and `preset` override the scenario file's values, which is how `snipe-war` runs under both `naked` and `fair` (§8.4). `approvals` is `'deny'` or `'queue'` (§6.3).
- `coin-art.mjs` (PR 1b): `coinSVG(coin)` via `nounArt(id)`, marked SIMULATED, with an aria-label that says play credits and no value. It does not import `security.mjs` or `security-edition.mjs`.
- `exhibits.mjs` (PR 1b): build-time scenario summaries, the machine edition for the JSON twin, and `SOURCES` (the only strings excused in the honesty test, and only where cited, §2.4 item 3).

### 8.4 Data

`src/data/launchpad/scenarios/{quiet-launch,snipe-war,dev-dump,graduation-run}.json`. `dev-dump` includes Bundler actors. The schema follows the draft's files:

```
{ id, title, summary,             // title and summary are page copy; the honesty test scans them
  seed, ticks, preset, rules,     // rules is the default; runScenario({ rules }) overrides it
  humanCredits?,                  // starting credits for wallets that appear in the human log (default "1000")
  launches: [{ tick, symbol, name, nounId, devBuy, devCredits?, bundlers?, bundleSize?, dump?: { after, share } }],
  bots: [{ id, strategy, credits, params?, policy? }],  // policy keys override §6.1; unknown keys throw
  copyTraders?: [{ id, leader, delay, size, credits }],
  retail?: { wallets, credits, rate, minSize, maxSize, buyBias, attention, minHoldTicks? } }
```

Credit amounts are decimal strings in cr. Wallets start with their stated credits and nothing else funds them, so the only `fundedBy` links are a creator's bundlers.

| Scenario | Coins | Rule set | Actors | Bots | Ticks | Must show |
|---|---|---|---|---|---|---|
| `quiet-launch` | 1 (PORCH) | `naked` | dev, 30 retail | 3 (holder, dip buyer, market maker) | 1,800 | Nothing graduates; credits are conserved |
| `snipe-war` | 1 (BOLT) | `naked`, and again with `rules: 'fair'` | dev, 40 retail | 7 (6 snipers on the §6.1 Sniper policy, `{ ...defaults, maxPerTrade:"100", maxPositionBps:350, maxSlippageBps:3000, approvalAbove:"100" }`, 1 momentum) | 900 | The A/B: `fair` cuts the sniper metric by at least 50% |
| `dev-dump` | 1 (SLICE) | `naked` | dev buy near the 5% cap, 4 bundlers, a full dump 240 ticks in, 40 retail | 4 (2 momentum on the defaults, holder, dip buyer) | 1,200 | `DEV_DUMP` and `BUNDLED` fire; Momentum's buys record `NEEDS_APPROVAL` refusals (headless runs deny, §6.3) |
| `graduation-run` | 2 (MOON at tick 5, GRID at tick 1,500) | `naked` | dev, 1 copy-trader following `momentum-1`, 160 retail | 6 | 2,400 | MOON graduates, migrates with the LP burned and keeps trading in the pool; `momentum-1` raises its `approvalAbove` so its copy-trader has something to follow |

**Human action log.** One log per run key (scenario, seed, rules, `configHash`); a reset or a run switch starts an empty one (§6.3). One record per action, in log order: `launch` records run in phase 1 of their tick, the other control records in phase 2, and `trade` records are queued in phase 2 and join phase 4's ordering (§5.1):

```
{ tick, type:'launch', wallet, symbol, name, nounId, preset, rules, devBuy? }  // filtered as in §3; CREATE marks it viewerMade
{ tick, type:'trade', wallet, side:'buy'|'sell', coin, quote? | base?, slippageBps? }
{ tick, type:'approve'|'decline', intent }       // the queued intent's id, ${botId}:${tick}:${n}; refused under another run key
{ tick, type:'kill'|'unkill', bot }              // a bot id, or '*' for the global switch
{ tick, type:'policy', bot, patch }              // a validated edit; bumps the bot's rev
```

**Metrics.** Per run: `scenario, seed, rules, preset, ticks, events, logHash, configHash, quoteConserved`. `quoteConserved` checks this invariant, which every scenario's "credits are conserved" criterion uses: Σ wallet credits + Σ escrowed auction orders + Σ curve `realQuote` (coins still on the curve) + Σ pool `quoteReserve` (migrated coins) + Σ `feesHeld` + house sinks (tier fees, sniper fees, priority fees, migration fees) = total starting credits. Swept creator fees are already back in wallet credits; LP fees sit inside `quoteReserve`. Per coin: `id, symbol, status, completeTick, raised, mcap, price, holders, trades, volume, creatorFees, risk {score, badge, flags, parts}, sniperShare`. Per bot: `id, strategy, fills, rejects` (by reason code), `engineRejects, credits, netCredits`. House sink totals.

**The A/B metric (`sniperShare`).** Tokens bought by Sniper-strategy wallets in the coin's first 60 ticks after trading opens, auction fills included, divided by all tokens bought in those ticks (the draft's `sim.mjs:241`). `snipe-war` runs twice with the same seed, `rules: 'naked'` and `rules: 'fair'`; the assertion is `fair ≤ 0.5 × naked`. It lives in `launchpad-sim` (A0) only.

### 8.5 UI

- `src/pages/case-studies/launchpad.astro` (route `/case-studies/launchpad/`) contains:
  - the explainer, with the plain-words framing line and the Nouns line (§1);
  - the curve chart;
  - scenario exhibits rendered at build time;
  - a client `<script>` that runs `sim.mjs` live, with the screener, a coin drawer and the bot roster with kill toggles;
  - a Sources list, the only place the products are named.
- **Layout props.** The page renders `<BlockLayout … isolated includeManifest={false} noindex author="Claude Code for PointCast" creator="Claude Code for PointCast">`, following `src/pages/bot-money.astro:17` (`immersive isolated includeManifest={false}`, `author="Codex for PointCast"`) and, for `noindex`, `src/pages/catan/flyer.astro:9`. `noindex` is what sets `<meta name="robots" content="noindex, nofollow">` (`BlockLayout.astro:146-151`); the `NOINDEX_PATHS` entry only keeps the route out of the sitemaps (§2.3). A2 removes both. Without `isolated`, BlockLayout loads PageviewBeacon (POSTs to `/api/analytics`), TezosSessionBridge (wallet session), CursorRoom (WebSocket to `/api/room`), FreshnessChip (fetches `/api/wire-events`) and `pc-layers.js` (`BlockLayout.astro:282-298`), which breaks constraint 8. `isolated` covers only the layout: the Pages middleware adds its own TezosSessionBridge to every HTML response (`functions/_middleware.ts`, `injectTezosSessionBridge`), so the route is also in that file's `paperRooms`, as `/ues/currency-lab/` is, which skips the bridge, visit logging and global HTML transforms; `tests/nouns-money-workshop-middleware.test.mjs` covers it. Without `author`/`creator`, BlockLayout emits Mike's name (`:89-90`, `:153-154`), which `VOICE.md` allows only with a source pointing to Mike's words. The page's Article JSON-LD and the JSON twin carry the same `author`.
- `src/pages/case-studies/launchpad.json.ts`: presets, `configHash`, scenario summaries, `author`, and explicit flags in the `bot-money.mjs` style (`realFunds: false`, `paymentProcessing: false`, `protocolComplianceClaim: false`, storage in-memory). It is not added to `agents.json`, `/for-agents` or `llms*`, nor to `sitemap-discovery.xml.ts` until A2. When A1 adds the `localStorage` watchlist, the storage flag (copied from `bot-money.mjs:44`, "in-memory in this page; reset or reload clears it") becomes "simulation in memory; watchlist only in this browser's localStorage", and the brief's "Reload mid-run … nothing persists" step changes to match.
- `src/pages/case-studies/launchpad/coins/[slug].svg.ts`: the per-coin portraits at `/case-studies/launchpad/coins/{scenario}-{symbol}.svg`, built from `coinSVG()` with an `aria-label` that says play credits and no value. Its `aria-label` and `<title>` text are in the honesty scan (§8.6), and it is in the PR 1b Codex scope (§9.1).
- Chart and table pieces, as components under `src/components/launchpad/` or page-local, plus `src/styles/launchpad.css`.
- No Currency Builder masthead link. No case 06 entry until A2. By default until A2, `/case-studies/launchpad/` goes into `NOINDEX_PATHS` (sitemap) and the page passes `noindex` (robots meta) (§2.3).

**Page done when (PR 1b):**
- the static exhibits render with JavaScript off;
- the live board can run each scenario at 10× and 100× (the draft's 10 and 100 ticks/s, which the brief uses; `graduation-run` is 2,400 ticks), with `approvals: 'deny'`; a run with no viewer actions (empty human log) ends showing a log hash equal to the pinned hash for the selected scenario and rule set (every scenario is pinned under each rule set the board offers; the draft's board offers all four, `exhibits.mjs` `rulesTable()`, but pins only `naked` and `fair`, `launchpad-sim.test.mjs:13-18`, so PR 1a.2 adds `auction` and `sniper-fee` pins). A kill enters the human log and changes the hash, as it should;
- kill toggles stop a bot's fills;
- no console errors;
- no horizontal scroll at 375 px, and text stays readable in dark mode;
- each SVG chart has a `<title>` and a data table.

There are no previews (§9.2), so before merge PR 1b checks the browser criteria above (JavaScript off, console errors, 375 px, dark mode) with a local headless-browser run against `build:bare`, and attaches the screenshots to the PR labelled as headless. Real-device QA is Manus Task A, after the deploy (§9.2).

### 8.6 Tests (`node --test`)

Each test file ships in the PR that ships the code it reads (§8): `launchpad-curve` and `launchpad-engine` in 1a.1; `launchpad-gate`, `launchpad-screener` and `launchpad-sim` in 1a.2; `launchpad-honesty` grows across 1a.1, 1a.2, 1b and A2 as listed below. No PR's test reads a file that PR doesn't have.

- **`launchpad-curve`**
  - Exact values: 2,795.899347, 8,500.535906 and 41,088.016813 cr. The `town` equivalents are 279.589934, 850.053591 and 4,108.801682.
  - A first buy of 100 cr gives raw `34612903225806` before fees and `34199203154141` after the 125 bps fee.
  - `town` against `classic-x100` divided by 10, at fresh or proportional states (`Q_classic = 10·Q_town`, same `B`): pre-fee quotes (buy exact-out net, sell grossOut, mcap) within 1 µcr, and fee-inclusive quotes (buy gross, sell net) within 2 µcr. Exact-in token outputs are equal before fees only. Don't compare along independently rounded paths.
  - Over 10,000 seeded trades: `k` never decreases, the quote equals the fill, a round trip loses at least the fees, and `R ≥ 0`.
  - The Appendix B recompute checks live here and in `launchpad-engine` (migration continuity, `town` one-holder graduation at 860.679261, `town` against `classic-x100`, dev-buy costs), so they outlive the session that ran them.
- **`launchpad-engine`**
  - Graduation overflow: the crossing buy splits into curve and overflow legs per §4.4, the overflow pays the same fee rate (split like the curve's) and its quote goes into the pool seed, an overflow with `net_o ≤ 1` buys 0 tokens, and the migration fee lands in the house sink. `CURVE_COMPLETE` on a direct engine call against a coin left `complete` (§4.4). Price continuity within 0.1% for `classic-x100` and `town`, measured on pool reserves before overflow (expect −0.0244%). The credits bar is clamped at 100%.
  - Auction pro-rata at an equal price, with refunds.
  - Fee lines sum exactly to the total (100 cr: 296,296 + 938,272 + 0 = 1,234,568 µcr), including buys that carry sniper and priority fees. Sweeps are idempotent. The creator payout split sums to 10,000 bps, and each sweep's payouts sum exactly to the swept amount.
  - Dev-buy rules by rule set (§4.7): 50M tokens cost 148.460411 cr gross under `naked` and 221.774194 cr under `sniper-fee`; the dev buy is an auction order under `auction` and `fair`; the dev lock and the early cap apply to the creator.
- **`launchpad-gate`:** every reason code fires under some policy. Under the defaults, `NEEDS_APPROVAL` fires for a 30 cr buy. The Sniper's policy as §6.1 states it (`maxSlippageBps:3000` included) admits its 100 cr buy (gross, its 30 bps priority fee inside) with the intent's 3000 bps slippage. A 5,000-tick fuzz never exceeds a cap, counting pending grants in the same tick. A kill takes effect in the same tick. With `approvals: 'queue'`, a queued approval is void after a policy `rev` change, an approved intent is re-gated and re-quoted when it runs, and an approval carrying another run key is refused.
- **`launchpad-screener`** (new): OHLC matches the trades. Trending is deterministic, and `z = 0` with one live coin. A flagged coin never outranks an otherwise identical clean coin. For ages a < b, both at least 120 ticks (past the warm-up), the older coin never outranks the younger one with the same activity; at any age, the age factor only lowers a score (score ≤ boost·trust·strength). Boosts never lower a rank. `DEV_DUMP` and `BUNDLED` fire on `dev-dump` under `naked`.
- **`launchpad-sim`:** a pinned `logHash` for each scenario under each rule set the board offers (all four, §8.5), regenerated after the §8.2 reconciliation; the A/B assertion on `sniperShare` (§8.4), `snipe-war` under `rules: 'naked'` and `rules: 'fair'`; at least one scenario records a `NEEDS_APPROVAL` refusal under the defaults (headless `'deny'`); `quoteConserved` holds for every run (§8.4).
- **`launchpad-honesty`** (§2.4), by PR:
  - *1a.1:* `src/lib/launchpad/` passes the purity list in §5.1.
  - *1a.2:* `scanText` with `approved: []` finds nothing in the scenario and strategy strings, and the §2.4 extra list finds nothing either.
  - *1b:* The page says "play credits" (or the chosen word, from the one constant) and "No value, may reset". `scanText` with `approved: []` finds nothing in the page copy, the JSON twin, the coin SVG route's `aria-label` and `<title>` text, or `exhibits.mjs`'s machine edition; `SOURCES` is scanned on its own with only its exact titles and URLs excused. The §2.4 extra list, run after the citation strings are cut out, finds nothing either, and the Stage C summary names no §2.4 item 6 unit (item 8). Neither `NM_STANDARD_LINE` nor `NM_REPLACEMENT_LINE` appears in any launchpad output. Coin art does not use the note renderer.
  - *1b, when `dist/` exists:* the built page's own content region (`<article class="lp">` or a `data-launchpad-copy` root, BlockLayout chrome excluded) is entity-decoded and scanned, and the test fails if that root is missing. The Sources list (outside the article, or marked `data-launchpad-sources`) is scanned on its own with its citation strings excused. The built page has no TezosSessionBridge, PageviewBeacon, CursorRoom or FreshnessChip markup and no `pc-layers.js` (no `data-pointcast-tezos-session-bridge`, `/api/auth/session`, `/api/analytics`, `/api/room` or `/api/wire-events` strings), and its `<meta name="author">` is not Mike's. Until A2 it carries `<meta name="robots" content="noindex, nofollow">`, and `dist/sitemap-0.xml` does not list `/case-studies/launchpad/`.
  - *A2:* every string field of the case-06 entry that `/ues/business` renders (`name`, `title`, `summary`, `actionLabel`, `state`, `note`; `business.astro:31`) is scanned; if the Manus brief moves into `docs/briefs/`, its title and extracted lede (what `/briefs` renders) are scanned too. The robots and sitemap assertions flip to `index, follow` and listed.

### 8.7 CI and checks

- `.github/workflows/launchpad-check.yml`, copied from `puzzles-check.yml` with its `audit-puzzles` step (`:37`) dropped, ships in PR 1a.1. Its `paths:` filter, written out:

  ```yaml
  paths:
    - 'src/lib/launchpad/**'
    - 'src/data/launchpad/**'
    - 'src/pages/case-studies/launchpad.astro'
    - 'src/pages/case-studies/launchpad.json.ts'
    - 'src/pages/case-studies/launchpad/**'
    - 'src/components/launchpad/**'
    - 'src/styles/launchpad.css'
    - 'src/styles/launchpad/**'                         # added in A1
    - 'src/scripts/launchpad/**'                        # added in A1
    - 'src/lib/nouns-money/honest-copy.mjs'
    - 'src/lib/nouns-money/chain-copy.mjs'        # NM_STANDARD_LINE / NM_REPLACEMENT_LINE
    - 'src/lib/currency-builder/primitives.mjs'   # coin art: nounArt
    - 'src/lib/currency-builder/type.mjs'         # coin art: text (coin-art.mjs:8)
    - 'src/data/currency-builder/glyphs.json'     # loaded by type.mjs:7
    - 'src/lib/nouns-parts.mjs'
    - 'public/images/nouns-money/source-100/provenance.json'                   # primitives.mjs:7
    - 'public/images/nouns-money/source-100/sources/official-image-data.json'  # nouns-parts.mjs:11
    - 'src/lib/seo-rules.mjs'
    - 'src/layouts/BlockLayout.astro'
    - 'tests/launchpad-*.test.mjs'
    - 'tests/seo-discoverability.test.mjs'
    - 'functions/_middleware.ts'                         # added in 1b
    - 'tests/nouns-money-workshop-middleware.test.mjs'   # added in 1b
    - '.github/workflows/launchpad-check.yml'
    # from A2: 'src/data/ues-business-cases.json'
  ```

  Steps: `npm ci`, `node --test tests/launchpad-*.test.mjs`, `npm run build:bare`, then `npm run audit:agents`. PR 1b adds, after `build:bare`, the honesty test again on the built page's own content region (§2.4 item 2) and `node --test tests/seo-discoverability.test.mjs`, because 1b edits `seo-rules.mjs`, and, before `build:bare`, `node --test tests/nouns-money-workshop-middleware.test.mjs`, because 1b adds the page to the middleware's paper rooms. In 1a.1 and 1a.2 the post-build honesty step is absent, so their CI never looks for a page they don't ship.
- Run `npm run build:bare` and `npm run audit:agents` locally before opening each PR. Run `npm run audit:publishing` before recommending any publish path; deploys go only through `scripts/deploy.sh` (`docs/OPERATIONS.md`).
- **Deploy owner.** `scripts/deploy.sh` deploys from `~/pc-deploy` and logs to `~/Library/Logs/` (macOS paths, `scripts/deploy.sh:42-44`), so Mike, or Claude Code on the iMac, runs it after each merge; it is not run from a cloud session. After the deploy that publishes the page, the same person walks the town with `npm run inspect:town -- --write` and files the report in the next PR (`docs/OPERATIONS.md` §4).
- **Each PR checklist:** files changed, build and test results, remaining risk and any Manus follow-up, as `CLAUDE.md` asks; and after merge, remove the PR's worktree and delete its `dist/` (§8.1).

### 8.8 A1 as built (2026-10-20)

The full board replaces PR 1b's live board. The exhibits above it do not change.

- **Shell** (`src/scripts/launchpad/app.mjs`):
  - Owns one run, its clock and its settings. The settings are run, rules, approvals and speed (1×, 10×, 100× or 1,000×). The defaults are Snipe war, naked rules, Ask me and 10×.
  - Repaints every 150 ms while playing.
  - Routes `#/c/<coin>` and `#/replay/<payload>`, including a link pasted into an open tab.
  - Mounts six views, each with its own module and stylesheet: screener, coin drawer with trade panel, Create, Portfolio, Bots & approvals, and Creator.
  - Every viewer action goes through `ctx.actions.record` into the human action log (§8.4) and applies at the next tick. A pending line names what the next Step applies.
- **Records** (§8.4):
  - `trade` gains an optional `priorityFeeBps`: whole bps, up to `LIMITS.maxPriorityFeeBps`.
  - `split` sets a coin's creator payout split once: up to 10 recipients, summing to 10,000 bps.
  - `checkRecord` accepts a `policy` patch only with primitive values and only with the keys the console edits: `maxPerTrade`, `approvalAbove`, `maxPositionBps`, `cooldownTicks`, `maxSlippageBps` and `windowCap.amount`/`ticks`.
  - It accepts a `launch` preset or rules only as an own key of the config.
- **Replay links** (`src/lib/launchpad/replay.mjs`):
  - The payload is base64url JSON `{ v: 1, scenario, seed, rules, approvals, configHash, log }`, at most 120,000 characters and 2,000 records. The log is stable-sorted by tick.
  - Decoding refuses with a code: `BAD_LINK`, `TOO_LONG`, `VERSION`, `SCENARIO`, `RULES`, `APPROVALS`, `CONFIG` or `RECORD`.
  - Each record is checked against the scenario: bot ids, and the intent id shape `${botId}:${tick}:${n}`.
  - A replayed run ends on the original's event hash. Play at the end of a replay runs it again.
- **Approvals** (§6.3): the live page runs `'queue'`. The console lists the oldest 8 queued intents with the full count, and refuses a decision on an intent's void tick.
- **Watchlist:**
  - Kept in `localStorage`, wrapped in try/catch, in the shell only.
  - Scenario coins are saved by symbol, because coin ids are reused across runs. Coins launched on the board are starred for the run only.
  - The twin's storage flag reads "simulation in memory; watchlist only in this browser's local storage".
- **Viewer text:**
  - Names and symbols pass `copyProblems` after NFKC, with invisible characters (format and default-ignorable) dropped, and control characters and underscores read as spaces.
  - Launch refuses control and text-direction characters outright, and the Create form says why.
- **Library:**
  - `previewBuy` and `previewSell` equal the fill in every venue: curve, sniper-fee window, opening auction, crossing, and pool.
  - `src/lib/launchpad/portfolio.mjs` checks `credits + Σcost + escrow = started + realized + feesReceived` to the micro-credit for every wallet.
  - Candles include the opening-auction clear and open at the launch price.
  - A net-zero auction order is refused.
  - `risk()` is computed once per coin per tick.
- **Accessibility:**
  - The tabs follow the APG pattern.
  - A control that a run's end or a fill makes unavailable stays focusable (`aria-disabled`). A control the run's end disables hands focus to the clock, never to Play.
  - The approval queue keeps focus when a row leaves.
  - Scrolling tables are named, focusable regions.
  - Trade inputs are tied to their error text.
  - Input borders meet 3:1.
- **Performance** (A1 criterion b, graduation-run at 100×, headless Chromium with a frame probe):
  - At CPU ×1, every paint's script time is under 10 ms: Bots panel p50 3.4 ms, max 9.2 ms. A full paint is p50 11 ms.
  - Under a ×4 CPU throttle, a paint covers about 15 ticks. It takes 10 to 17 ms of script at p50 and 31 to 57 ms including style, layout and paint. That is about 2 to 4 ms per tick.
  - Playback kept time, about 800 ticks in 8 s, with no ticks dropped.
  - On a slow phone the Bots panel therefore repaints less smoothly than a per-tick reading of the criterion suggests. Real-device numbers come from Manus.
- **Tests:**
  - `launchpad-board` (13 tests) covers previews, screener tabs, holders, candles under every rule set, the ledger identity, splits, replay round trips (acting during a replay included), replay refusals, priority-fee trades, invisible-character names and the compute budget.
  - The honesty test scans `src/scripts/launchpad/*.mjs`, and bans `innerHTML` everywhere and network calls and storage outside the shell.
  - `launchpad-check.yml` also watches `src/scripts/launchpad/**` and `src/styles/launchpad/**`.
- **Review:** a five-area review (library, replay and untrusted input, browser end to end, accessibility, copy and performance) had a skeptic check every finding. It confirmed 25 of 34, and all 25 were fixed. Separate verifiers then checked each fix.
- **Not done in A1:**
  - Codex review: the Codex CLI was not available to the building session.
  - Real-device QA: Manus, after deploy.
  - A practical 1× for long scenarios: graduation-run takes 40 minutes at 1×.

## 9. Reviews and handoffs

### 9.1 Codex review

`CLAUDE.md` asks for Codex review on agent-readable endpoints and wallet code, and `AGENTS.md`'s escalation table requires "X review + MH approval" for every merge to `main` (`AGENTS.md:161`). So every launchpad PR (0, 1a.1, 1a.2, 1b, A1, A2, B1, B2) merges only after Codex review and Mike's approval. Ask on the GitHub PR:
- **PR 0:** direction fit of the plan against §2.2 and the copy rules, since the page links this doc and the repo is public; and that the session-local scrub (§8) is complete.
- **PR 1a.1:** the engine's fee lines, rounding and graduation against §4.3–§4.4.
- **PR 1a.2:** the honesty test's scope, and whether the gate's reason list, grant reservation and approval voiding match the `/bot-money` invariants (§2.2 constraint 7).
- **PR 1b:** the JSON twin (`/case-studies/launchpad.json`) and its flags, before it goes into `agents.json`, `/for-agents` or `llms*`; the coin SVG route (`/case-studies/launchpad/coins/*.svg`) and its `aria-label` text; the layout props, `noindex` included (§8.5); the `src/lib/seo-rules.mjs` `NOINDEX_PATHS` entry, which is a publishing surface; and the text of Task A's brief, posted as a PR comment (§9.2).
- **A1:** approval-queue voiding and reset behaviour (run keys, §6.3), the Create surface's name filter and rendering (§3), the `localStorage` watchlist, and the twin's storage flag (§8.5).
- **A2:** every string field of the case-06 entry in `src/data/ues-business-cases.json` (`name`, `title`, `summary`, `actionLabel`, `state`, `note`), which feeds `/ues/business`, a publishing surface; the removal of both noindex switches; and the brief file if it moves into `docs/briefs/`.
- **B1/B2 (required):** the house worker, which is wallet code: vault key derivation, the solvency check, refunds on missed `minOut`, the sell payout path, the mandate mapping (§6.5) and the `kinds = 0` kill switch. Also the reducer pin and the replay script.

### 9.2 Manus handoffs

No browser or passkey step is faked here. Briefs go in `docs/briefs/YYYY-MM-DD-manus-launchpad-*.md` or a PR or issue comment (`CLAUDE.md` allows either). Task A's brief is a PR 1b comment until A2, because `/briefs` would list a `docs/briefs/` file publicly (§2.3). Results go in `docs/manus-logs/YYYY-MM-DD-launchpad-*.md`.

| Task | URLs | Accounts and tools | Capture | Mike approval |
|---|---|---|---|---|
| **A: real-device QA** | `https://pointcast.xyz/case-studies/launchpad/`, `https://pointcast.xyz/case-studies/launchpad.json` and the coin SVGs under `https://pointcast.xyz/case-studies/launchpad/coins/` (e.g. `snipe-war-bolt.svg`). Runs only after PR 1b merges, `scripts/deploy.sh` has run (Mike, or Claude Code on the iMac, runs it; §8.7), and `npm run audit:publishing` confirms the page is live. There are no per-PR Pages previews: the Pages project is Direct Upload with no Git connection, and it deploys only main with `--branch=main` (`.github/workflows/cloudflare-pages.yml:3-6`, `:12-15`, `:75-79`; `scripts/deploy.sh:130`), and `docs/OPERATIONS.md:65-66` forbids a hand-run `wrangler pages deploy`. Before merge, checks happen only on a local `build:bare`, with a headless-browser run whose screenshots are labelled as headless (§8.5). The page is public before QA happens (indexable and in the sitemap too, unless the noindex default holds, §2.3). If the deploy log shows a per-deploy `https://<hash>.pointcast.pages.dev` URL (the pattern `README.md:183` uses for a Pages preview), it may be used for the same checks. | None; a mid-range phone and a desktop browser | Screenshots at 375 px and desktop of the explainer, the static exhibits, the live board (screener, coin drawer, bot roster with a kill toggled), a coin SVG and a graduation; the page with JavaScript off; dark mode; any console errors. The approval queue and the 100× performance trace wait for A1. | Not needed: play credits, no chain |
| **B0: devnet read** | `https://pointcast-devnet.mhoydich.workers.dev/params`, `/status`, `/station/LAUNCHPAD` and `/stations` (plain HTTP reads, `src/pages/chain/bots.astro:318`); `/mcp` (`station_get`) as the alternative (`src/data/chain-home.ts:152`) | None (reads) | `tap_reward`, `taps_per_window`, `tap_window_blocks`, the drum rules (`drum_attest_policy`, `drum_reward_per_10s`, `drum_session_cap_per_player`), `epoch_blocks`, `account_epoch_cap`, `max_agents_per_owner`, the delegable kinds (are 14 and 15 delegable?), the recent block rate, and whether `LAUNCHPAD` is claimed. Reads from that host are unverified as of 2026-10-19. The brief also covers the claim procedure after any reset: re-claim `LAUNCHPAD` in open mode, with the house account's bound presence pid on the Ticketed chain (§5.2). | Not for reading. Claiming or re-claiming the station is an irreversible signed transaction from the non-agent house account: Mike signs it, or Manus does with Mike's explicit yes. Claude Code does not sign it. The claim is logged in `docs/manus-logs/`. |
| **B2: passkey trades** | `https://pointcast.xyz` (the only passkey origin) | A test passkey account with play ATTN; a tz1/tz2 owner for one bot | Transaction hashes, the Face ID / Touch ID prompts, solvency-panel screenshots before and after a buy, a sell and a refund, and a bot kill via `set_mandate kinds=0` | Yes: it posts to the shared devnet-2 and uses the 5,000-a-day budget |

## 10. Open questions for Mike

PR 1's defaults for questions 1–3 and 8 are in §7 ("PR 1 merge defaults").

1. Should the case study stay at `/case-studies/launchpad/`, or move under `/currency-builder/`? If it moves, should it still drop "Nouns Money" from its name and stay out of the masthead until reviewed?
2. Does the Nouns Money "Never use" list bind this page even though it sits outside the Nouns Money paths? This plan assumes yes, with exact citations excused.
3. May the case study use Noun art at all, as simulated portraits? `nounArt` covers only #0–99, the same 100 Nouns as the Nouns Money designs, so coin Noun N would wear the same portrait as Nouns Money design `nm100-N` / NM27-(N+1), drawn from the Nouns Money provenance file (§2.3), while PR #1413 holds portraits among the Phase B decisions. Options: (a) Noun portraits as planned (the PR 1 default, §7); (b) partial layers through `nounArt`'s `layers` option, so no coin shows a whole note's Noun; (c) non-Noun coin art until the Phase B portrait decision is made. Should any coin ever wear a Security Edition note frame?
4. Should Stage B run on devnet-2, which it would share with the Nouns Money edition and the 5,000-a-day budget?
5. Is a custodial house vault acceptable for Stage B sells?
6. Should graduation open a separate shared edition (not Nouns Money)? It would need the editions admin, a house attestor and `per_account = 1`, with holders minting through `edition_mint` against house approvals.
7. Should the reserved `fill_order` kind be raised in the chain repo?
8. Should the page say "play credits" (as Sunset Downs does) or "demo credits" (as `/bot-money` does)?

## Appendix A. Sources

**Checked in this review cycle (2026-10-19):**
- Pump: [pump-public-docs](https://github.com/pump-fun/pump-public-docs) (clone at `639b87f`, equal to live HEAD): [Pump program](https://github.com/pump-fun/pump-public-docs/blob/main/docs/PUMP_PROGRAM_README.md) · [Synthetic migration](https://github.com/pump-fun/pump-public-docs/blob/main/docs/SYNTHETIC_MIGRATION.md) · [Fee tiers image](https://github.com/pump-fun/pump-public-docs/blob/main/docs/fees.png) · [Coin creation](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/COIN_CREATION.md) · [Creator fee sharing](https://github.com/pump-fun/pump-public-docs/blob/main/docs/instructions/CREATOR_FEE_SHARING.md). The `@pump-fun/pump-sdk` 4.1.0 `src/bondingCurve.ts` came from the npm registry.
- Meteora DBC: [README](https://github.com/MeteoraAg/dynamic-bonding-curve) and `programs/dynamic-bonding-curve/src/constants.rs`, fetched from raw.githubusercontent.com.
- Clanker: the BankrBot Clanker skill (mirrored by the [guide](https://www.typingmind.com/skills/bankrbot-clanker)) and the Clanker v4 contracts spec `specs/v4_0_0.md` (optional MEV modules, the only one a 2-block delay; re-fetched 2026-10-20 from raw.githubusercontent.com), matching the [v4 announcement](https://paragraph.xyz/@dish/introducing-clanker-v4).
- DEX Screener [Trending](https://docs.dexscreener.com/trending): through search-indexed text only; the page itself is unverified as of 2026-10-19.

**Not re-opened (unverified):** the Turnkey, Privy and CDP policy docs; `docs.meteora.ag` (unreachable; replaced by the GitHub README); Pump's on-chain `FeeConfig`; devnet-2 `/params` and `/status`.

## Appendix B. Verification

**How the plan was checked.**
- **Claim check.** 207 claims from the 2026-10-11 plan were checked against `origin/main`, the plan's sources and independent scripts: 173 confirmed, 26 corrected, 7 refuted, 1 unverifiable.
- **Math recompute.** Every headline number in §4 was recomputed independently with BigInt (the scratch scripts are listed in the PR 0 description). Those scripts sit in a session scratchpad, which `docs/OPERATIONS.md:12-13` says "is wiped when the session ends", so they are not preserved. PR 1a.1 folds their key checks into `tests/launchpad-curve.test.mjs` and `tests/launchpad-engine.test.mjs` (§8.6), and PR 0 commits this plan at `docs/plans/2026-10-19-launchpad-case-study.md`. All headline numbers reproduced. Three things were wrong: the `town` fee, the ATTN cap reading and the missing fee remainder rule. Several formulas were underspecified.
- **Direction and reuse reviews.** Two reviews read main for the current Nouns Money direction and copy rules, and for what Stage A and B can reuse.
- **This pass (2026-10-19).**
  - Re-checked every kept file path on `5754e498`.
  - Re-ran the Nouns Money ratchet on an extract of `5754e498`: it now passes, because Enjoy was reworded in `94e23056`.
  - Counted `BANNED` at 39 patterns.
  - Confirmed that the proposed vocabulary passes `scanText`. A later review found "top-10 share" and "snipers' share" caught by the §2.4 extra list; the vocabulary was swapped and all 73 terms now pass both lists.
  - Read the published house-station list (`chain-home.ts:100`).
  - Observed the untracked local draft (local session, not preserved).
  - Applied a 46-finding review against `7efd2faa` and the draft: the devnet-1 drum path for earning ATTN, the age warm-up in trending, priority fees inside the gross, per-PR preview URLs that don't exist, BlockLayout's `isolated` and byline props, sitemap listing, the PR split, the full fee-tier table, and the time, hash, scenario and gate rules a builder needs.
  - Applied a 44-finding review (2026-10-20), each re-checked against `7efd2faa` and the draft first: noindex needs BlockLayout's `noindex` prop as well as `NOINDEX_PATHS`; the Sniper's `maxSlippageBps` 3000 is decided (fill slippage recomputed); the PR split becomes 1a.1, 1a.2 and 1b with the honesty test split so each PR's CI passes on its own; the coin-face overlap with the Nouns Money designs goes to Mike; `NM_APPROVED_LINES` are no longer excused; run keys for approvals; the Stage A name filter; the Stage C roadmap row removed; event types, phase order, grant reservation, auction, graduation, risk-measure and conservation rules written out; CI `paths:` listed; deploy owner, cleanup and claim signer named. Unchanged-claim checks: the Clanker v4 spec was re-fetched; the overflow price move was recomputed (2.342% net, 2.313% gross).

**Corrections made (claim ID → what v2 does):**

| ID | Status | v1 claim | v2 |
|---|---|---|---|
| 1k | refuted | House phrasing is "play credits, no value, may reset" | The framing stays, correctly attributed: "no value, may reset" is the devnet phrasing; "play credits" is Sunset Downs only (§1) |
| 2f | refuted | Follow `src/lib/chartmaker.ts` for SVG candles | Follow `real-estate.mjs` and `business-feels.mjs`; candles are new code (§5.1) |
| 2o | corrected | Dev buy up to 5% fits all presets, locked under `fair` | Limits by rule set, with costs; no creator exemption; the sniper fee applies (§4.7) |
| 3aa | corrected | ATTN capped at 500 per account per day | 500 per epoch of 28,800 blocks, issuance only, and boundary straddling is possible (§4.2) |
| 3ac | refuted | 850 ATTN must come from several holders | One account can graduate a coin (860.68 gross); a per-wallet cap is needed if several holders are wanted (§4.2) |
| 3ap | corrected | Price continuous within 0.1% | Passes for `classic-x100` and Pump (−0.0244%); `town` fee scaled to 0.15; measured before overflow (§4.4) |
| 3aw | corrected | Trending uses DexScreener's published inputs | Most listed inputs, our own weights, adds price change, leaves out visitors and trust inputs; search-indexed source (§4.6) |
| 3ba | corrected | Trust and age factors lower flagged or stale coins | True only for base > 0; fixed with softplus strength and z = 0 rules (§4.6) |
| 4a | corrected | Stage A "ships now" | Can ship first; not shipped; untracked draft only (§0, §8.2) |
| 4b | corrected | Astro islands render | No islands on main; client `<script>` modules (§5.1) |
| 4j | corrected | Custom channel `NMLAUNCH` is fine | Valid code, but the station can be claimed irreversibly; renamed `LAUNCHPAD`, claimed in open mode at B0 (§5.2) |
| 4n | corrected | Holders mint an `open_edition` certificate | Admin-only; dropped by default; the shared-edition mechanics are in open question 6 |
| 4r | corrected | Migration `0030_launchpad.sql` | 0033 or the next free number after a full branch scan (§5.2) |
| 4z | corrected | Native kinds need a devnet reset | Upgrade plus re-pin always; reset likely if Params change (§5.3) |
| 4ac | corrected | DBC graduates into a CPMM with LP burned | DAMM v2 with LP locked (≥10%), not burned; fee scheduler and rate limiter; no auction (§5.3) |
| 4ao | corrected | Each fill gets an agent-payments v1 receipt | v1 is USD-only and node-only; use a separate fill-receipt type, or Sunset Downs receipts in Stage B (§5.2, §5.3) |
| 5c | corrected | Gate order follows The Desk's `gate.mjs` | Borrows the outline only; new checks listed; Desk checks not adopted listed (§6.4) |
| 5i | corrected | All three mandate spend fields come from the policy | Only the window maps, approximately; `spend_total` derived; caps bind only `spend_allowance` (§6.5) |
| 5k | corrected | Payee list of vaults restricts coins | Only with `spend_allowance` buys, no transfer bit, reducer support and ≤16 coins (§6.5) |
| 5m | refuted | Kill switch is `clear_mandate` | `set_mandate kinds = 0`; never `clear_mandate` (§6.5) |
| 5n | corrected | The policy as a whole maps onto `set_mandate` | Partial map, plus the kinds mask and channels; the rest stays off chain; agent registration limits (§6.5) |
| 5o | refuted | The Sniper's default buy passes the default policy | It fails `PER_TRADE` and the 2% cap; the Sniper gets its own policy (§6.1) |
| 5p | refuted | `NEEDS_APPROVAL` can fire | It couldn't; `approvalAbove` lowered to 25; buy-only (§6.1, §6.2) |
| 6d | refuted | 1-hour sim under 5 s at 100× | Split into a compute criterion and a playback criterion (§7) |
| 6e | corrected | A2's v2 faces wait on the creative v2 merge | Merged on 2026-10-14; v2 still doesn't use note faces, by policy (§2.3) |
| 6q | corrected | Phase C effort "2-week spike, then 3–6 months with 5–8 people" | Phase 2 scope: 2–3 engineers, 6–8 weeks (+~2); the Phase 3 figure only with Phase 3 scope; a research estimate in §5.3 only, with no roadmap row (§5.3) |
| 7a | corrected | Currency Builder is not on main | On main since #1416; Almanac #1424 (§8.1) |
| 7b | corrected | Branch from `gracious-fermi` | Fresh `origin/main` worktree (§8.1) |
| 7c | corrected | Creative v2 files are uncommitted | Committed in `a816fd57` (§8.1) |
| 7e | corrected | The `layers` option is a local edit | Committed; `nounArt(id)` draws all four layers (§8.1) |
| 7f | corrected | `art.mjs` leaves a slot for the v2 renderer | The renderer is available (needs an adapter; ids #0–99), but coin art doesn't use it (§2.3, §8.3) |
| 7q | corrected | `town` = classic/10 within 1 µcr | 1 µcr pre-fee and 2 µcr fee-inclusive, at proportional states only (§8.6) |
| 7x | unverifiable | `DEV_DUMP` and `BUNDLED` each have a triggering scenario | `BUNDLED` given a 5% threshold; `dev-dump` includes Bundlers and must fire both (§4.8, §8.6) |
| 7y | corrected | "play credits" and "no value" follow house phrasing | Attributed correctly; "legal tender" ban kept, since coins aren't note faces (§1, §2.4) |

**From the math recompute (not in the claim list):**
- Fee lines rounded up separately overshoot by 1 µcr → house-remainder rule (§4.3).
- The overflow leg's fees and its place in `realQuote` were unspecified → it pays the curve fee and goes into the pool seed (§4.4).
- `Qgrad` is a single-path minimum → credits bar clamped (§4.4).
- Fee-tier scaling for `town` is ×10, not ×100 (§4.2).
- Half-bps tiers need a rounding choice (§4.5).
- Impact defined for sells, `minOut` rounding, sniper fee as a share of gross, and raise excluding fees (§4.3, §4.7).
- Rounding differs from Pump v3 at µ level (§4.3).
- Auction "about 1%" holds only for small batches (§4.7).

**From this pass's own checks:**
- The direction review said the Nouns Money ratchet fails on main. That was true at `6c26d2d0` but not at `5754e498`: `94e23056` reworded Enjoy, and the ratchet now passes 13/13.
- The same review counted 43 banned patterns; `BANNED.length` is 39.
- Its Enjoy quotes ("The Bank", "GET /balance", "Nothing redeems for dollars") are now "The Ledger", "GET /holdings" and "Nothing turns back into money, USDC or goods".
- The house-station list is in the repo (`chain-home.ts:100`), although whether `LAUNCHPAD` is claimed on devnet-2 is not.

**Still unverified:**
- devnet-2's `tap_reward`, drum rules, epoch length in practice, `max_agents_per_owner`, delegable kinds (14/15) and station claims;
- Pump's on-chain `FeeConfig`;
- Alpha Vault support for DBC;
- the Turnkey, Privy and CDP pages;
- the code behind Daily Mint's `chain_bid`;
- anything in the pointcast-chain Rust source.
