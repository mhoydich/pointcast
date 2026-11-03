# The Desk — Phase 0 Venue Audit

Status: **for Mike's review. No code has been written.** Nothing below is legal or
tax advice. It is a research pass by Claude Code on 2026-10-03.

Scope: Mike's own capped bankroll, Mike's own accounts, traded by Mike's agents
from a California-based US account. No visitor funds, no deposits from others, no
copy-trading for others.

## How to read this

Each claim carries a confidence mark:

- **[verified]**: from the venue's own docs or terms, as quoted in search results
- **[secondary]**: from third-party guides; plausible, not checked against the source
- **[confirm]**: unknown or conflicting. Mike (or Manus, logged in) needs to check it
  before that venue goes live

This container's network policy blocked direct fetches of `docs.polymarket.us`,
`jup.ag` and `developers.jup.ag`. Their findings come through search results, so
anything that decides go or no-go is marked for a first-hand check.

## Summary

| Venue | Can an agent trade it from CA? | Paper path | Recommendation |
|---|---|---|---|
| **Kalshi** | **Yes.** Official API; the Developer Agreement allows automating your own trading. | Kalshi **demo** environment, plus our own simulator | **Go.** First live venue. |
| **Polymarket US** | **Yes, it looks like it.** A Retail API exists for KYC'd US accounts. CA is listed as available. | Our simulator on live US order books ([confirm] whether a sandbox exists) | **Go, after the [confirm] items.** Second live venue. |
| **Alpaca (US stocks/ETFs)** | **Yes.** Built for algorithmic trading; $0 commission. | Alpaca **paper** account (free, separate keys) | **Go.** Lowest regulatory risk. |
| **Solana via Jupiter** | **No, under Jupiter's current terms.** Jupiter lists the United States as a prohibited jurisdiction. | Read-only prices from a source other than Jupiter | **No-go on Jupiter.** Mike picks an alternative (below). |
| **Solana perps** | **No** on Jupiter Perps (same terms). Drift is [confirm], probably also US-restricted. | — | **No-go** unless Mike picks a US-regulated derivative. |

Old Polymarket (`polymarket.com`, the international CLOB on Polygon) stays off
the table for a US account. Only **Polymarket US** is in scope.

---

## 1. Kalshi

| | |
|---|---|
| Regulator | CFTC-designated contract market (DCM) [verified] |
| California | Available to CA residents 18+. No CA enforcement action as of 2026 [secondary]. Sports contracts are being litigated in other states (NV, MA, NJ, TN…). That isn't CA's issue today, but it can change. |
| Account / KYC | Individual account, full KYC (ID, SSN). API keys are created in account settings. |
| API | REST + WebSocket. Requests are signed with **RSA-PSS (SHA-256)** using a private key you download once [secondary]. Official SDKs exist. |
| Demo | A separate **demo** environment with `kalshi_demo_` keys, functionally the same as prod but with simulated liquidity [secondary] |
| Rate limits | Token bucket. **Basic: 200 read / 100 write tokens per second.** Higher tiers (Advanced → Prestige) are granted by 30-day volume [secondary]. Basic is plenty for us. |
| Fees | Taker ≈ `0.07 × contracts × p × (1−p)`, rounded up, with a per-series multiplier. Peaks around 1.75¢/contract at 50¢. Maker fees are lower or zero on most series [secondary]. |
| Automation terms | **Developer Agreement v1.1 allows API use to facilitate a member's own trading** [secondary, the §3 "permitted use"]. That fits The Desk exactly. Kalshi can throttle or end API access at its discretion (§5). |
| Withdrawal on keys | [confirm] My understanding is the trading API has no withdrawal endpoint. Mike should confirm in the key settings whether keys can be scoped (read vs. trade). |
| Tax | 1099 reporting from Kalshi [secondary] |

**Risks to name**
- Market-integrity rules: no trading on events Mike or his agents can influence,
  or where Mike has material non-public information. The strategy configs should
  exclude event categories tied to Mike's businesses (e.g. cannabis policy) unless
  Mike clears them.
- Wide spreads on thin markets. The paper simulator must fill against the real
  book (walk the depth), not the midpoint.

## 2. Polymarket US

| | |
|---|---|
| Regulator | CFTC-regulated US entity, separate from the international Polymarket [secondary] |
| California | **Listed as available** [secondary: SI.com, TheLines, Oct 2026]. Unavailable states include NV, AZ, IL, MD, MI, MT, OH, but lists conflict, so Mike should check in-app. |
| Account / KYC | **App-intermediated.** Signup and KYC only through the **Polymarket US iOS app** (photo ID, liveness, SSN, residency). The trading account is provisioned when KYC passes [verified, docs.polymarket.us accounts overview]. |
| API | **Yes. A "Retail API" exists for KYC'd US users**: about 23 REST + 2 WebSocket endpoints (market data, create/cancel orders, portfolio, account). Keys come from the developer portal after KYC. Requests are signed with **Ed25519** [verified, via search of docs.polymarket.us]. |
| Rate limits | **20 req/s per API key** across all endpoints; 20 req/s per IP for public endpoints; 429 when exceeded. WebSocket: up to 10 instruments per subscription [verified, rate-limits page] |
| Fees | Taker `0.06 × C × p × (1−p)` (max $1.50 per 100 contracts at 50¢). **Makers pay nothing and get a rebate** of `0.0125 × C × p × (1−p)` [verified, fee schedule] |
| Order types | MARKET and LIMIT [secondary] |
| Automation terms | [confirm] I couldn't read the Retail API / developer terms directly. Mike should read them for an automation clause, a "personal use only" clause, and anything on publishing trade data. |
| Sandbox | [confirm] I found no evidence of a demo environment. If none exists, paper mode is our own simulator against the live book. |
| Withdrawal on keys | [confirm] Whether keys can be scoped to trade-only. If the portal can't create a key without withdrawal rights, this venue stays read-only until it can. |

**Answer to the brief's question:** an API does exist for US accounts, so we
don't need a read-only fallback, assuming the [confirm] items clear. Until they
do, The Desk treats Polymarket US as **read-only market data** (public endpoints
need no key).

## 3. US stocks & ETFs: Alpaca

| | |
|---|---|
| Regulator | FINRA/SEC broker-dealer; SIPC [secondary] |
| California | No state-specific restriction on equities [secondary]. Crypto on Alpaca is a separate product with its own state list ([confirm] CA, especially now that California's DFAL licensing has started). We don't need it. |
| Account / KYC | Individual brokerage account, standard KYC. Paper and live accounts have **separate key pairs**. |
| API | REST + WebSocket Trading API and Market Data API. Keys can be **permission-restricted** (e.g. data-only vs. trading) [secondary, Alpaca docs]. Money movement is **not** in the retail Trading API; it lives in the dashboard / Broker API [confirm on Mike's account]. |
| Paper | **Free paper trading** on real-time data, resettable [verified] |
| Rate limits | **200 requests/min** on the free plan; up to 1,000/min on request; 10,000/min on Algo Trader Plus [secondary] |
| Fees | **$0 commission.** Regulatory pass-through fees on sells (SEC/FINRA TAF, cents). Market data: free IEX feed, or a paid SIP feed (~$10–100/mo) [secondary] |
| PDT rule | **Gone.** FINRA replaced the Pattern Day Trader rule with an intraday margin framework, effective **2026-06-04**, and Alpaca removed PDT fields from the API by 2026-07-06 [verified, Alpaca blog]. Small accounts can now day-trade, which makes our own Risk Gate the only thing slowing the agents down. |
| Automation terms | Built for algorithmic retail trading; automation is the product. |

**Recommendation:** cash account, not margin (no leverage, no short selling) for
the whole experiment. Long-only equities/ETFs, fractional shares allowed.

## 4. Solana: Jupiter swaps (and perps)

| | |
|---|---|
| Custody | A dedicated hot wallet owned by Mike. No KYC. |
| API | Jupiter **Swap V2** (Ultra is deprecated). A free API key is required; fixed tiers: Free 1 RPS, Developer 10, Launch 50, Pro 150 [verified, developers.jup.ag] |
| Fees | Swap fee 5–10 bps plus Solana network/priority fees [verified] |
| **Terms** | **Jupiter's Terms of Use state that it "does not interact with digital wallets located in, established in, or a resident of the United States"**, listing the US next to sanctioned jurisdictions [verified, via search of developers.jup.ag/docs/legal/terms-of-use]. |
| Perps | Jupiter Perps falls under the same terms, so it's **out**. Drift and other Solana perp DEXs: [confirm], but most bar US persons, and leveraged retail crypto derivatives outside a CFTC venue are a real regulatory problem for a US person. |

**Verdict:** an agent can technically call Jupiter from a California hot wallet,
but **doing so breaks Jupiter's terms**. A project that broadcasts every trade
publicly shouldn't build on a ToS violation. **No-go on Jupiter as written.**

**Alternatives for the "crypto / Solana" seat, for Mike to pick:**

1. **Coinbase Advanced Trade API** (recommended). A US-regulated exchange that
   trades SOL and major Solana tokens. API keys come with separate **View / Trade /
   Transfer** permissions, so we create View+Trade only. The cost: intro-tier fees
   are high (0.60% maker / 1.20% taker under $1K 30-day volume) [secondary], which
   will eat small trades. Not a Solana hot wallet, but it's the honest version.
2. **A Solana DEX whose terms allow US users.** I haven't found one I'd stand
   behind. Every candidate's terms need a [confirm] before use.
3. **Drop the crypto seat for v1.** Run three strategies across Kalshi, Polymarket
   US and Alpaca, and add crypto after paper mode proves the Risk Gate.
4. **Perps, opt-in only:** if Mike wants leverage later, the US route is a
   CFTC-regulated venue (e.g. Coinbase's US perpetual-style futures) [confirm API
   availability and CA eligibility]. Not Solana DEX perps.

For paper mode, SOL prices can come from a neutral read-only source (Coinbase's
public market data or the Pyth on-chain oracle), not from Jupiter.

---

## Cross-venue notes that shape the architecture

**Secrets & keys**
- Each venue gets its own key, trade-scoped, **withdrawal/transfer off**. Where a
  venue can't create a key without withdrawal rights, that venue stays read-only.
- Keys go in a secrets manager (Cloudflare Workers secrets or 1Password Connect,
  since the site already runs on Cloudflare). Only the **Risk Gate** worker can read
  them. Agents never see keys, and agents never get a route to the adapters.
- Kalshi uses an RSA private key, Polymarket US Ed25519, Alpaca a key/secret pair,
  Coinbase an ECDSA key. The adapter interface hides all four.

**Kill switch, per venue**

| Venue | Flatten | Disable keys |
|---|---|---|
| Kalshi | cancel all resting orders; sell positions at market (thin books mean slippage) | revoke key in settings [confirm whether this is possible via API] |
| Polymarket US | cancel all; sell positions | revoke in developer portal [confirm] |
| Alpaca | `DELETE /v2/positions` (close all) + `DELETE /v2/orders` | regenerate keys in dashboard (manual) |
| Coinbase | cancel all; sell to USD | delete key in settings (manual) |

Revoking keys is **manual on most venues**. The kill switch should (1) flip a gate
flag that refuses every order immediately, (2) flatten, and (3) page Mike with
one-tap links to each venue's key page. "Disables keys" means the gate stops using
them right away; revoking them at the venue is a human step.

**Daily-loss and settlement timing**
- Event contracts can sit open for weeks. "Daily loss" has to be **mark-to-market**
  (unrealized + realized), not just closed P&L, or the limit won't trip when it
  should.
- Equities settle T+1, so the cash account can't reuse sale proceeds the same day
  without a good-faith violation. The gate should track settled cash.

**Witness stones**
- In the repo, a witness stone is The Wild's **$0.01 x402 hash-chained commitment**
  (`src/lib/wild-mcp.ts`). Sealing every order before it executes puts The Wild in
  the order path. The gate must **fail closed** (no seal, no trade), and paper mode
  should seal too, so we measure that latency and cost before going live. Two weeks
  of paper trading at ~50 trades/day is ~$7 in seals.

**Broadcast**
- Publishing Mike's own trades with the "not investment advice, one person's
  experiment" banner is fine. Pitfalls: anything that looks like a signal service
  (alerts telling visitors to "follow" a trade, or paid access to calls) moves
  toward investment-adviser territory. `/desk` should show trades **after** they
  fill, never before.
- Check each venue's terms on publishing its market data. Kalshi and Polymarket US
  data shown on a public page may need attribution, and redistributing Alpaca's SIP
  feed is restricted by exchange licensing (the free IEX feed is easier).

**Tax**
- Kalshi, Polymarket US, Alpaca and Coinbase each issue their own 1099s. Event
  contracts' tax treatment is unsettled. Every fill goes into a per-venue CSV export
  from day one.

---

## What I need from Mike before Phase 1

1. **Solana seat:** pick option 1 (Coinbase), 3 (drop for v1), or point me at a
   US-permitted Solana venue to audit.
2. **Polymarket US:** after KYC in the app, check (a) whether the developer portal
   offers trade-only keys without withdrawal, (b) the API terms' automation and
   personal-use clauses, (c) whether a sandbox exists. This is a Manus-shaped task
   if Mike wants it delegated (it needs Mike's logged-in app).
3. **Kalshi:** confirm a key can be created without withdrawal rights, and whether
   demo keys are available on Mike's account.
4. **Bankroll numbers:** per-venue cap, the $X human-approval threshold, the daily
   loss limit. These go in gate config, not here.
5. **Excluded categories:** markets the agents must never touch (anything tied to
   Good Feels, cannabis regulation, El Segundo local politics, or people Mike knows).

## Sources

- Polymarket US API overview: https://docs.polymarket.us/trader-guide/api-overview
- Polymarket US accounts: https://docs.polymarket.us/institutional/accounts/overview
- Polymarket US rate limits: https://docs.polymarket.us/api-reference/rate-limits
- Polymarket US fees: https://docs.polymarket.us/fees
- Polymarket in California (Oct 2026): https://www.si.com/prediction-markets/reviews/polymarket-california
- Polymarket state list: https://www.thelines.com/prediction-markets/polymarket/california/
- Polymarket US API availability: https://www.quantvps.com/blog/polymarket-us-api-available
- Kalshi changelog: https://docs.kalshi.com/changelog
- Kalshi automation rules: https://www.traadence.com/blog/kalshi-automated-trading-bot-rules
- Kalshi fees: https://www.botforkalshi.com/blog/kalshi-fees-explained
- Kalshi in California: https://www.strafe.com/esports-betting/reviews/kalshi/california/
- Kalshi litigation overview: https://pm.wiki/de/learn/is-kalshi-legal
- Jupiter Terms of Use: https://developers.jup.ag/docs/legal/terms-of-use
- Jupiter rate limits: https://developers.jup.ag/docs/ultra/rate-limit
- Alpaca PDT retirement: https://alpaca.markets/blog/finra-retires-the-pdt-rule-introducing-alpacas-new-intraday-margin-framework/
- Alpaca Trading API: https://docs.alpaca.markets/us/docs/trading-api
- Alpaca rate limits: https://alpaca.markets/support/increase-api-rate-limit
- Alpaca OAuth scopes: https://docs.alpaca.markets/us/docs/using-oauth2-and-trading-api
- Coinbase Advanced Trade auth: https://docs.cdp.coinbase.com/advanced-trade/docs/auth/
