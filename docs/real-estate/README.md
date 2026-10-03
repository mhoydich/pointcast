# Groundwork · Real Estate Observatory v1

An educational PointCast study at `/real-estate/`: 18 representative anchors within a geodesic 25-mile circle from El Segundo City Hall, eight global jurisdiction comparisons, a field guide, and an editable hypothetical five-year acquisition model. Research checked 3 October 2026. This is a coherent first study, not an exhaustive global property database.

## Public surfaces

| Surface | Contract |
| --- | --- |
| `/real-estate/` | Original editorial map, local search/property filters, global search/region filters, accessible model table and evidence ledger |
| `/real-estate.json` | Versioned study, 87 source receipts, 11 data-access entries, model defaults/schema and explicitly dated snapshots |
| `/real-estate/methodology.json` | Geography, evidence standard, equations/timing, exclusions and educational project brief |
| `/real-estate/openapi.json` | OpenAPI 3.1 request contracts |
| `/api/real-estate/query` | Bounded read-only search; `q`, `type`, `region=all\|local\|global` |
| `/api/real-estate/scenario` | Strict finite numeric inputs; all three five-year scenarios; zero values preserved, invalid/duplicate/unknown inputs rejected |
| `/api/real-estate/feed?source=fhfa\|usgs` | Fixed official sources, bounded bodies/timeouts, derived edge cache, dated fallback |
| Existing `/api/mcp` and `/api/mcp-v2` | Three scoped tools: `real_estate_study`, `real_estate_scenario`, `real_estate_feed`; inherited read-only annotations |

No additional MCP server, hosting configuration, binding, secret, token, authentication change or transaction capability is introduced. Study/query/calculation are pure public-data operations. Feed requests accept no arbitrary URL.

The companion Business Feels dashboard and machine snapshot belong to [draft PR #1325](https://github.com/mhoydich/pointcast/pull/1325). Its publication must precede or accompany this route for the two companion links to resolve. This engine does not import a policy-rate benchmark as a mortgage offer or automatically convert currencies. Shared Home/Latest/Projects and the UES hub are untouched.

## Evidence and access

The center is a Census-interpolated street address at 350 Main Street, El Segundo: 33.91992025096, −118.415864992665. Haversine distance and a spherical destination formula define the radius. Anchor centers inside the circle do not imply complete municipal coverage. The coast, buildings and transit strokes are original schematic artwork; no parcel geometry, photographs, listings or commute times are fabricated.

The eight global comparisons are Los Angeles, London, Tokyo, Singapore, Dubai, Berlin, Mexico City and São Paulo. They cover ownership access, tax friction, currency/financing, operating rules and legal/political uncertainty. Their qualitative mechanisms are questions for study, not observed yield rankings or investment recommendations. Current London Phase 1 guidance is distinguished from its earlier rollout roadmap.

| Source | Verified behavior | Interpretation / limits |
| --- | --- | --- |
| FHFA quarterly metro CSV | Keyless HTTP 200, 4,186,906 bytes; no browser CORS header; server adapter | LA–Long Beach–Glendale division 31084, all-transactions NSA, 1995 Q1=100. Latest bundled observation 2026 Q2: 557.38; −0.27% quarter, +1.20% year. Metro geography extends beyond the circle. Quarterly delayed, revised; neither rent nor yield. |
| USGS past-week GeoJSON | Keyless HTTP 200, wildcard browser CORS, publisher max-age 60 seconds; browser and server adapters | Earthquake epicenters within the circle, including offshore events. Non-earthquake types excluded. Not parcel hazard scoring, a safety finding or an alert service. |
| Census ACS | Keyless query redirected to missing-key page | No fabricated rent/demographic payload. Annual/multiyear survey estimates and margins of error require separate authorized access. |
| HUD FMR | Token-required official API | Source link only; no account/token setup. Program benchmark differs from attainable property rent. |
| Metro / planning / hazards | Official source links and recorded portal limitations | No real-time transit credential, automatic zoning approval, parcel risk score or schedule ingestion claim. |
| Listings / closed comps | Not connected | Permissioned provider agreement needed. No restricted MLS scraping or republished portal photos. |

The initial FHFA payload was retrieved at `2026-10-03T17:33:26Z` (raw SHA-256 `07e3e98998806df830fd1ec141dbf234e66d66675258ecd705078028aafedee0`). Initial USGS generation/retrieval was `2026-10-03T17:32:23Z` (raw SHA-256 `f289caab3d4b1d5786146132d901e491854663f95672e6ee30c97a808e9241b7`). Only normalized public snapshots are bundled. USGS browser refresh in QA returned generation `2026-10-03T18:12:13Z`, retrieval `2026-10-03T18:12:26.156Z`.

Feeds run on explicit requests only. FHFA has a 6 MB cap and up to one-hour derived-response edge cache; USGS has a 4 MB cap and up to 60-second cache. Both use a fixed URL and 12-second timeout. Cache hits preserve retrieval time; failures preserve the stored snapshot’s generation/retrieval date. No timer, scheduler or background polling is installed. Full Cloudflare runtime and post-publication smoke checks remain a release step.

## Hypothetical portfolio

Twenty editable inputs govern capital, annual contributions, price/rent, down payment, fully amortizing debt, vacancy, property tax, insurance, repairs, management, capex, initial liquidity reserve, growth, sale cost and a chosen DSCR screen. Example values are invented; no private financial notes, actual bankroll, group allocation or individual commitments are used.

Contributions arrive at the beginning of each year, including year 1. At most one acquisition occurs per year when spendable cash, nonnegative NOI and the DSCR screen pass. Appreciation is not spendable cash. Negative cash flow draws liquid cash, then tracked reserves, then creates an explicit unfunded liability; later contributions/income repay that liability first. Capex is annual spending, separate from the liquidity reserve. Net yield uses NOI divided by price plus closing costs; cap rate uses price alone.

The invented default is $250,000 starting capital plus $30,000 annual contributions, $650,000 price, $5,200 monthly rent, 35% down and 6.5% interest. Default adverse acquires nothing because DSCR fails; ending cash is $400,000. Base acquires one property, ending accounting equity approximately $552,607 and after-sale-cost value $507,395. Upside acquires one property, ending equity approximately $678,698 and after-cost value $628,923. These are sensitivity calculations, not forecasts. Income, capital-gains/depreciation taxes, FX, refinancing and extraordinary/property-specific costs are excluded explicitly.

Calculate/share/download all read and validate the visible form. Assumptions are encoded in the URL; the interface warns users to share only values they want others to read. Results JSON includes assumptions, three cases and model exclusions. The browser engine and read-only API use the same implementation.

IndustryNext and University of El Segundo are proposed educational context. The earlier intern program is historical/closed. No partnership, endorsement, student participation, recruiting or outreach is claimed or initiated.

## Validation and release

- `node --test tests/real-estate-*.test.mjs`: 40/40 pass (25 engine, 10 study/API/feed/MCP, five DOM/client tests).
- Independent model review: 3,000 deterministic sensitivity cases, accounting errors below $4×10⁻⁹; payoff/funding-gap regressions covered.
- Independent source/code re-review: no remaining material findings after correcting the net-yield denominator, current London guidance, null/schema validation, share/download synchronization, caching and map focus/pressed state.
- Four-route scoped Astro production build with PointCast’s original integrations/layout: pass in 59.99 seconds. Original public directory/config preserved; scoped fixture disables bulk public copying and excludes unrelated routes. **This is not a full-repository build.**
- esbuild bundles the three Pages handlers and the existing MCP entrypoint: pass. Bundled MCP `tools/list`, study query, zero-capital calculation and invalid-null dispatch: pass. Three Pages wrappers type-check with the installed Cloudflare types. Bundled Node handlers fetched actual official FHFA and USGS responses at approximately 18:18 UTC; Cloudflare deployment remains untested.
- Chrome QA at 1440×1000 and 375×812, plus compiled production smoke at the normal 406-pixel viewport: no document-level horizontal overflow; local search, keyboard selection, global filtering, scenario switching, calculation, reset and explicit USGS refresh verified. Expected static-preview FHFA fallback retains dates. No application-script errors observed; a pre-existing wallet-extension injection error was separate from the page.
- `git diff --check`: pass. No dependency/config/shared navigation or wallet/auth changes.

Evidence files are in [`evidence/`](./evidence/), with desktop hero/lab and mobile lab screenshots. Source research notes: [`local-research.md`](./local-research.md), [`global-research.md`](./global-research.md).

The full repository build is deferred to the parent’s serialized shared-Mac release lane. Draft only: explicit Mike approval, companion release ordering, mandatory full build and Cloudflare API/MCP smoke checks are still required before merge/publication. Preserve this worktree and evidence through release.
