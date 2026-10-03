# Independent review — UES prediction-markets study

Reviewed on 2026-10-03. Source staging: `/tmp/ues-prediction-stage`. Integration layout inspected in `/Users/michaelhoydich/pc-ues-prediction-markets`, based on fresh main `2a3e3532`. This review did not edit course source or use a native browser, live venue APIs, credentials, accounts, wallets, orders or money.

Reviewed source fingerprints are saved in `/tmp/ues-prediction-reviewed.sha256` for the nine actual course files. Every staging file matched its isolated-worktree counterpart when the manifest was written. The shared layout is an inspected dependency, not a modified course file.

Final CSS amendment reviewed: `html:has(.prediction-study)` now declares `font-size:100%`. This restores the browser's default font size as the basis for the course's relative typography instead of retaining a smaller sitewide root size. The addition is syntactically valid, preserves the existing reduced-motion override, and changes no content, arithmetic, input validation or network behavior. Only `src/styles/prediction-study.css` changed from the previous reviewed manifest; staging and worktree still match. All nine SHA-256 entries were regenerated after this amendment. Root separately reports 16 px prose / 14 px labels and no horizontal overflow at 390 px, plus passing browser keyboard, stress, invalid-input, no-JS and download checks; those are root's integration observations, not independently repeated browser tests.

## Findings

1. **Resolved: nested main landmarks.** The original page wrapper at `src/pages/ues/prediction-markets.astro:12` was a `main` inside `BlockLayout.astro:267`'s `main`. Root changed the study wrapper to `article`; staging now shows it at line 13. This preserves one primary landmark.
2. **Resolved: overly absolute notes-retention claim.** Original client feedback at `src/scripts/prediction-study-client.ts:74` claimed notes were not retained after leaving. Browser back/forward caching and form restoration can preserve textarea memory. Root replaced it with the accurate statement that the course does not upload or save notes. The source never sent or persisted notes.
3. **Resolved: four-versus-six scenario mismatch.** Original lesson 12 named four scenarios whereas the landscape displayed six. Current curriculum describes the same six named conditional cases at `src/data/prediction-curriculum.json:513–519`.
4. **Resolved: scenario falsification label.** At `src/data/prediction-curriculum.json:524`, the worked example originally called itself “access-fragmentation” but treated a stay, contrary restriction or exclusion of intended users as disconfirming evidence. Those could instead support fragmentation. Root renamed it “broader regulated distribution,” which fits the current trigger/disconfirmation logic. The correction was reread in staging.

No outstanding code, math, safety or data-rights findings in the reviewed source. Four review findings were corrected and the corrections were reread.

## Independently checked arithmetic

| Exercise | Independent result |
| --- | --- |
| Bayes default | `0.2×0.8 / (0.2×0.8 + 0.8×0.3) = 0.40` |
| Bayes lesson | With 10% false signal, `0.16/(0.16+0.08) = 2/3` |
| Brier default | `(0.09+0.36+0.04+0.01)/4 = 0.125` |
| Brier lesson | `(0.09+0.04+0.16+0.64)/4 = 0.2325` |
| EV default | 100 units, `p=.60,c=.55,f=.02`: expected net `$3`, YES net `$43`, NO net `−$57` |
| Depth default | 20×.50 + 30×.54 + 10×.60 = `$32.20`; average `.536666…` over 60; spread `.50−.48=.02` |
| Drawdown default | `1−.9^10 = .6513215599`, or 65.1% rounded |
| Kelly lesson | `b=(1−c)/c`; optimum `(p−c)/(1−c)`. With `p=.60,c=.50`, 20%; with `p=.51`, 2%. Correctly described as analytical, not recommended sizing. |
| Common shock | Three simultaneous 10% starting allocations lose 30%; three sequential 10% remaining-capital losses lose `1−.9³=27.1%` |
| Perps funding | Initial notional `$6,100`; 10 bps × 3 on entry notional = `$18.30` |
| Perps −5% | Equity `$676.70`; assumed maintenance `$289.75` |
| Perps −10% | Equity `$371.70`; assumed maintenance `$274.50` |
| Perps −12% | Equity `$249.70`; maintenance `$268.40`; breach with positive equity |
| Perps −15% | Equity `$66.70`; maintenance `$259.25` |
| Perps −20% | Equity `−$238.30`; hypothetical deficit `$238.30` beyond initial collateral |

All quantities, signs, percentage/basis-point conversions and static default outputs matched. The long perp is a linear terminal stress, explicitly ignores earlier liquidation, uses an invented maintenance threshold and warns that actual deficit obligations are product-specific. No real liquidation price or loss cap is inferred.

## Checks executed

- `node --test /tmp/ues-prediction-stage/tests/prediction-study.test.mjs`: **17/17 pass**. Covers invalid and nonfinite inputs, impossible evidence, extreme rare likelihoods, negative EV, numeric overflow, incomplete/unsorted books, compounded losses, maintenance breaches and deficits.
- Independent JSDOM interaction harness using actual lab markup and transpiled client: **pass** for all six calculator defaults, blank quantity rejection, nonbinary Brier rejection, lesson hash opening, unanswered/correct quiz feedback, and inert plain-text note export. A network trap observed no course requests. This is DOM execution evidence, not a claim of native browser keyboard/visual testing.
- Packet invariants: **12 modules, 625 planned minutes, 34 unique source IDs, five comparison rows, six scenarios**. All advertised source IDs resolve internally; source URLs are HTTPS; learning-path module IDs match; checkpoint answer indexes are valid.
- Static accessibility: controls have text labels; quizzes use fieldset/legend and native radio inputs; details/summary remains usable without JavaScript; outputs/status regions announce changes; no-JS defaults and answers are present; focus indicators are defined; mobile stacks to one column; tables have captions and scoped headers; reduced-motion disables smooth scrolling. Native keyboard, screenshot and viewport checks belong to root's integration validation.

## Coverage and security

The 12 lessons cover probabilities/base rates, Bayes and dependent evidence, calibration and scoring limits, contract wording and source revisions, settlement/oracles/disputes/finality, spread/depth/slippage/fees/EV, correlated exposure and capital locks, drawdown and ruin limits, Kelly assumptions, falsifiable hypotheses and backtest leakage/multiple testing, manipulation and insider/conflict restrictions, data provenance/AI/reuse rights, simulated order-state/idempotency/reconciliation concepts, honest paper limits, funding/liquidation/path risks and six conditional 2027 cases.

The course client imports only local arithmetic and updates DOM text. No fetch, WebSocket, storage, account, credential, wallet, signature or order path exists. Notes are a `text/plain` Blob with an object URL that is revoked; untrusted note text remains inert. Static JSON/TXT endpoints return source packets only. Astro interpolation escapes authored text. Current isolated layout excludes pageview beacon, auth/session bridge, networked chrome and global layer script; chrome initialization exits before account/state/network setup. The shared layout still reads an existing mood preference, which does not collect the notebook.

No certification, profits, real product access, legal clearance, historical US-first status or 2027 outcome is promised. The private screenshot and private desk/account plans are absent.

## Independent primary-source spot checks

- [CFTC BTCPERP approval](https://www.cftc.gov/PressRoom/PressReleases/9240-26): May 29, 2026 approval of KalshiEX bitcoin perpetual as futures is supported. It does not establish a historical first or personal access.
- [Kalshi learn page](https://kalshi.com/perpetuals/learn) and [liquidation help](https://help.kalshi.com/en/articles/15357646-understanding-liquidation): customer-liability warning and isolated risk-waterfall wording both exist. The course accurately keeps their unresolved scope difference visible.
- [Ninth Circuit 25-7504](https://cdn.ca9.uscourts.gov/datastore/opinions/2026/09/16/25-7504.pdf): September 16 preliminary-injunction appeal contains an IGRA likelihood finding and remand; the course does not turn it into statewide final clearance. Later docket actions remain an explicit source gap.
- [Polymarket US introduction](https://docs.polymarket.us/api-reference/introduction) and [authentication](https://docs.polymarket.us/api-reference/authentication): public read API exists without keys; authenticated retail access is separately documented. [Data onboarding](https://docs.polymarket.us/data-guide/onboarding) separately describes agreement and reviewed credentials.
- [Polymarket App terms](https://polymarket.us/tos), via its official embedded published document: personal noncommercial trading-related data use and express licensing restrictions are supported. The course does not invent an AI-specific ban. [US rulebook](https://polymarketexchange.com/files/legal/latest/rulebook) resolves with September 30, 2026 cover.
- [International geoblock policy](https://docs.polymarket.com/api-reference/geoblock): US is in the close-only frontend/API category. US and international rows remain distinct; no workaround is offered.
- [Jupiter prediction docs](https://developers.jup.ag/docs/prediction), [API/SDK license](https://developers.jup.ag/docs/legal/sdk-api-license-agreement) and [Terms of Use](https://developers.jup.ag/docs/legal/terms-of-use): product-specific US/Korea IP restriction, API-content sharing restrictions and incorporated US/locality conditions are supported. The course correctly distinguishes contractual restrictions from a blanket statutory spot-swap ban.
- [Alpaca paper docs](https://docs.alpaca.markets/us/docs/paper-trading): simulation omissions, IEX entitlement and unchecked displayed-liquidity quantity are supported. It is explicitly adjacent paper infrastructure, not a verified event-contract venue.

The review confirms these selected primary-source claims; it does not independently certify all 34 source pages or resolve the course's deliberately listed permission and legal gaps. Publication remains outside this review and subject to the requested human review and serialized release lane.
