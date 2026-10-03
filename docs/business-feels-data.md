# Business Feels data interface

`/business-feels` uses a shared read-only economic reference set. Other PointCast pages, including a future property study, can consume the same public interface independently.

- `GET /business-feels.json`: bundled official evidence only. Astro builds make no upstream requests. Its `generatedAt` is build time.
- `GET /api/business-feels`: bounded request-time ECB FX and Treasury reads, with best-effort cache and dated snapshot fallback.
- `HEAD /api/business-feels`: the same read path without a response body.
- `OPTIONS /api/business-feels`: public CORS for GET, HEAD and OPTIONS. All other methods return 405.
- `GET /business-feels/openapi.json`: OpenAPI 3.1 schema with no authentication, orders or account operations. An existing MCP reader can wrap the GET without adding write tools.

The endpoint accepts no query controls. `url`, `refresh`, dates, provider names and arbitrary headers cannot change upstream URLs, bypass source intervals, or create cache variants. Nothing here changes accounts, permissions, bindings, scheduled work, wallets or credentials.

## Contract

The stable schema identifier is `pointcast.business-feels/v1`. Top-level fields are `schemaVersion`, `generatedAt`, `verifiedAt`, `mode` (`snapshot` or `mixed`), `series`, `fx`, `yieldCurve`, `sourceHealth`, and `disclosures`. The runtime response also includes `cache`. `verifiedAt` refers to the committed evidence bundle; `generatedAt` describes this response and does not make the observations current.

Each `series` has `id`, `title`, `category`, human-readable `unit`, `frequency`, `sourceId`, `sourceUrl`, nullable `value`, nullable `observationDate`, `history: [{date,value,preliminary?}]`, `status`, `fetchedAt`, `lastSuccessAt`, `staleAfterDays`, `delivery`, `drivers`, `matters`, and `context`. Historical rows are sorted oldest to newest. `releaseDate` and `dateMeaning` appear when supported by the source. Monthly reference periods use their first day as a machine-sortable date; that is not the publication date.

| IDs | Meaning / unit | Source |
| --- | --- | --- |
| `fed-target-lower`, `fed-target-upper` | FOMC target range, % | Federal Reserve |
| `ecb-deposit` | Deposit facility, % | ECB |
| `boe-bank-rate` | Bank Rate, % | Bank of England |
| `boj-policy` | Disabled link-out pending reproduction permission | Bank of Japan |
| `treasury-3m`, `treasury-2y`, `treasury-5y`, `treasury-10y`, `treasury-30y` | Daily U.S. Treasury par yields, % | U.S. Treasury |
| `us-cpi-yoy` | PointCast-derived CPI year-over-year growth, % YoY | BLS `CUUR0000SA0`, NSA index |
| `us-unemployment` | Seasonally adjusted unemployment, % | BLS `LNS14000000` |
| `us-payroll-change` | PointCast-derived consecutive-month payroll change, thousand jobs | BLS `CES0000000001`, SA level |
| `mortgage-30y` | Disabled benchmark pending permitted use | Freddie Mac |
| `commodities` | Disabled coverage pending benchmark and rights selection | No enabled feed |

`fx` is nullable; when present it has `base: "EUR"`, `date`, `rates` (currency units per EUR), actual `history: [{date,rates}]`, `sourceId: "ecb-fx"`, `sourceUrl`, `status`, retrieval times, and a reference-rate disclaimer. Every current currency belongs to one observation date. Cross-rates are `toRate / fromRate` from that table. No weekend rows are invented and unsupported currencies, including suspended RUB reference coverage, are not filled.

`yieldCurve` is nullable; when present it has one `date`, `points: [{tenor,years,value}]`, source attribution and status. A missing maturity is omitted. The plotted curve does not borrow another day's missing point. Individual tenor histories retain their own dates.

Each `sourceHealth` entry has `id`, `title`, `sourceUrl`, `frequency`, `licenseUrl`, `status`, `fetchedAt`, `lastSuccessAt`, `lastAttemptAt`, `lastError` (`null` or `{at,message}`), `reason`, `cacheSeconds`, `runtimeEnabled`, and `delivery`. A failed read changes `lastAttemptAt` and `lastError`; it does not advance `lastSuccessAt` or replace the good observation with a guessed value.

## Freshness and fallback

- `snapshot`: credited evidence bundled at a manual verification time.
- `fresh`: a runtime-enabled official source was successfully retrieved, its observation is within the feed's documented threshold, and no partial or failed refresh is outstanding. It does not mean a real-time market quote.
- `stale`: the observation or policy verification exceeds the threshold, or the latest attempted refresh failed. Existing observations remain readable with their original dates.
- `unavailable`: no usable observation is present.
- `setup-required`: source integration is deliberately disabled pending a key, quota arrangement, rights review or permission.

FX and Treasury use a five-calendar-day observation threshold to tolerate ordinary weekends and holidays while exposing a prolonged gap. Monthly BLS series use 75 calendar days from the represented reference month. Policy snapshots use 14 days since manual verification, rather than treating the last change date as a forecast of future decisions. These are PointCast display thresholds, not source promises of timeliness.

The runtime stores the normalized public set in the existing Cloudflare Cache API for up to 30 days. Its cache generation is keyed by the committed bundle’s `verifiedAt`, and a cached set is accepted only when that version matches. Updating the reviewed bundle’s verification time starts a new generation, so warm legacy entries cannot hide new manual BLS or policy evidence. Stored last-attempt times provide best-effort retry intervals of one hour for ECB and six hours for Treasury in a given data center; failures use the same interval. Concurrent cold cache misses and eviction can duplicate upstream reads. There is no hard per-data-center or global request cap without a coordinator. Successful values, original observation dates, and last-success times stay in the retained set. Cache failures are separately reported in `cache.error`. Eviction, a different data center, or local preview can revert to the committed bundle. This is best-effort public caching, not durable storage and not a global rate limiter. Cloudflare documents that [Cache API entries do not replicate across data centers](https://developers.cloudflare.com/workers/runtime-apis/cache/).

All runtime reads are fixed GETs with redirects rejected, a five-second timeout per upstream request, and a streamed two-megabyte byte limit. The whole normalized cache read is limited to one megabyte. At the start of January, an empty current-year Treasury feed may be replaced by one bounded previous-year read. No all-history pagination or caller-supplied URLs are fetched.

## Official sources, update frequency and reuse

Verified 3 October 2026. Source availability and terms may change; `sourceHealth` is part of the public response so consumers can expose those differences.

| Source | Enabled behavior | Timing and reuse |
| --- | --- | --- |
| [ECB FX reference rates](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html) | Fixed [daily XML](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml) and [last-90-days XML](https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist-90d.xml), server-side | Around 16:00 CET on working days excluding TARGET closing days. ECB says these are information references and discourages transaction use. [ECB reuse terms](https://www.ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html) require accurate reproduction, attribution, and identification of changes. No numeric request quota was found; one-hour retry intervals are a best-effort PointCast cache policy. |
| [Treasury daily par yields](https://home.treasury.gov/resource-center-data-chart-center/interest-rates/TextView?type=daily_treasury_yield_curve&field_tdr_date_value=2026) | Fixed [current-year Atom XML](https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value=2026); year follows UTC server date | Daily U.S. business-day observations. [Official developer notice](https://home.treasury.gov/developer-notice-xml-changes) documents the API and omitted missing fields. These are U.S. government-produced data; [17 USC 105](https://www.copyright.gov/title17/92chap1.html#105) is the statutory public-domain basis, not a claim that Treasury published a CC0 license. Attribution remains attached. No numeric API quota was found; six-hour retry intervals are a best-effort PointCast cache policy. |
| [BLS public API](https://www.bls.gov/developers/) | Verified monthly snapshots; tested parser for a manual unregistered v1 three-series batch. No public runtime query. | CPI and employment are separate monthly releases; payroll can be preliminary and revised. [v1 limits](https://www.bls.gov/developers/api_faqs.htm): 25 queries/day, 25 series/query, 10 years/query. A per-data-center cache cannot guarantee a global 25/day ceiling, so runtime reads remain disabled. [BLS material is public domain; attribution is requested](https://www.bls.gov/opub/copyright-information.htm). |
| [Fed target table](https://www.federalreserve.gov/monetarypolicy/openmarket.htm) | Manual policy range snapshot | Effective-date and verification-date fields are separate. [Fed terms](https://www.federalreserve.gov/disclaimer.htm) allow reuse of unmarked Board material; attribution is included. |
| [ECB key policy rates](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html) | Manual deposit-rate snapshot and actual historical changes | Current snapshot effective 16 September 2026, following the [10 September decision](https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.mp260910~314e508016.en.html). ECB reuse terms apply. |
| [BoE Bank Rate table](https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp) | Manual snapshot; last change date is explicit | Last change 18 December 2025, current level separately verified. Bank-produced data are reusable under the [UK Open Government Licence, subject to BoE exceptions](https://www.bankofengland.co.uk/legal). Third-party exchange-rate datasets are not used. |
| [BoJ decision](https://www.boj.or.jp/en/mopo/mpmdeci/mpr_2026/k260918a.pdf) | Disabled link-out | [BoJ terms](https://www.boj.or.jp/en/about/copyright.htm) require permission for commercial reproduction. This public business dashboard does not redistribute the policy value. |
| [Freddie Mac PMMS](https://www.freddiemac.com/pmms) | Disabled link-out | Weekly Thursdays at noon Eastern. [Terms](https://www.freddiemac.com/terms) restrict direct automated collection, caching and redistribution without authorization; a separate syndication exception needs verification. No numeric mortgage rate is copied into this bundle. |
| [FRED API](https://fred.stlouisfed.org/docs/api/api_key.html) | Disabled integration placeholder | Requires an API key, and underlying series rights can vary. No key is requested, stored or inferred. |
| Commodities / BEA / World Bank / IMF | Deferred coverage | No commodity feed or GDP forecast is guessed. A specific source, units, revision rules and dataset-specific license must be selected before enabling an adapter. |

ECB and Treasury probes did not expose CORS headers, so the browser reads the same-origin PointCast endpoint. BLS did expose public CORS, but its quota still makes uncontrolled browser polling inappropriate. Saturday 3 October 2026 is not turned into a new market observation: FX and Treasury retain Friday 2 October dates.

The bundled evidence includes 65 actual ECB daily tables from 6 July through 2 October and 65 actual recent Treasury curves through 2 October. CPI YoY is calculated from matching months exactly 12 months apart; payroll changes require actual adjacent months. No interpolation fills a missing period. The October 2 employment release labels the recent payroll series preliminary. August CPI was released September 11; September employment was released October 2. `provenance.files` records byte lengths and SHA-256 hashes of the official response evidence used to derive the bundle.

## Reuse in a property study or agent reader

```js
const response = await fetch('/api/business-feels');
const signals = await response.json();
if (signals.schemaVersion !== 'pointcast.business-feels/v1') throw new Error('Unsupported public schema');
const treasury10y = signals.series.find(s => s.id === 'treasury-10y');
// Show treasury10y.observationDate and status with its value.
// Treasury yields are context, not a mortgage quote or a property's financing terms.
```

Consumers should preserve source links, units, observation dates, statuses and disclosure text in downloads or quotations. A source's failure cannot be summarized as a successful refresh merely because an older value still exists. Watchboard selections persist in browser local storage. Scenario inputs stay in the page and are never sent to the API; the API does not receive financial details.

`src/lib/business-feels.mjs` exports:

- `getSnapshot(now?)`: an independent copy evaluated for display staleness, with no network.
- `refreshSignals(snapshot, {fetch?, now?, timeoutMs?})`: the fixed public adapters; injected fetch/time support deterministic tests. BLS and disabled sources are never read by this function.
- `parseEcbXml(xml)`, `parseTreasuryXml(xml)`, `parseBls(object)`: bounded parsing and exact period derivations.
- `convertFx(fx, amount, from, to)`: `{amount,from,to,convertedAmount,rate,observationDate,sourceId,disclaimer}`. Cross-rate arithmetic uses one dated table; it excludes fees and spreads.
- `rateScenario({principal,annualRatePercent,years})`: `{monthlyPayment,totalPaid,totalInterest,principal,annualRatePercent,years,assumptions}` for fixed equal monthly payments. A zero-rate input is supported; tax, insurance, fees, points and early repayment are excluded.
- `handleBusinessFeels(request, {fetch?,now?,cache?,timeoutMs?})`: the read-only handler, also exercised by deterministic tests.

Manual snapshot refresh is deliberately a reviewed source update, not an automation. Fetch only the fixed official feeds with bounded timeout/size, keep the retrieved files and source dates for review, run the exported parsers, then update the corresponding credited histories and verification times. Advance the top-level `verifiedAt` whenever committed evidence changes; it is also the runtime cache generation identifier. A BLS manual refresh is one three-series POST query to `https://api.bls.gov/publicAPI/v1/timeseries/data/` (a read-only query), with `{ "seriesid": ["CUUR0000SA0", "LNS14000000", "CES0000000001"] }`. Do not attach this quota-limited operation to the public route or a distributed timer. Run `node --test tests/business-feels.test.mjs` after a change and verify the actual release dates independently.
