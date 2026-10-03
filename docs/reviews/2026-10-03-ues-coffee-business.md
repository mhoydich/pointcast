# Independent UES coffee/business review — 2026-10-03

**Outcome: PASS after fixes; no remaining concrete findings in the reviewed working draft.**

Scope: New coffee/business routes, data, CSS, helper/tests and two UES navigation edits in /Users/michaelhoydich/pc-ues-business-coffee/ (base origin/main 551bd6e6). Read only; no repository edits, commits, or remote comments. File fingerprints: /tmp/ues-coffee-review.sha256.

Four P2 findings were reported and verified corrected:
1. Map pin vertical positions originally included caption height. SVG/pins now occupy their own relative square .map-plot; caption is outside.
2. Boy & Bear's North PCH source/query originally accepted a South PCH Census result. The record now uses the official merchant-linked destination (33.8471144, -118.3875327), recomputes 5.275654 mi / 162.010689°, resorts, preserves the rejected match, and describes mixed coordinate sources accurately.
3. Brewing search originally omitted brewMethods. It now includes methods, type, summary, and accent/apostrophe normalization; drip returns Blue Butterfly and Verve.
4. Private worksheet export originally defaulted to GET submission without JavaScript. The export button is now non-submitting and disabled until JS initialization, with noscript guidance; JS also prevents form submission.

Verification:
- node --test tests/coffee-study.test.mjs: 4/4 pass, repeated after fixes.
- Independent WGS84 Vincenty recomputation of the saved coordinate set agrees to display precision; shared City Hall center is 33.91992025096, -118.415864992665 with 25-mile geometric radius and explicit approximation.
- Direct primary-source checks support all six displayed BLS/DIR/Census/USDA/ICO figures and period/geography limitations. Merchant source spot checks support the bounded catalog/menu claims. No actual shop sales, revenue, margin or live-stock inference found.
- Café and other channel arithmetic reconciles; labor is included in fixed cost, exclusions and teaching assumptions explicit.
- Isolated headless Chrome at 1280×900: business → coffee → business → coffee handlers initialize; drip + 2mi shows one card; keyboard Enter on pin sets aria-pressed and focuses list card; keyboard list selection works; reset restores 11; empty result hides cards/pins and clears selection; keyboard export yields ues-business-study.txt without query params; café type search works; zero page errors.
- Preview uses full-document navigation (window token is not retained), so same-document ClientRouter swaps were not exercised. Scoped guards and astro:page-load initialization are present.
- Requested changes do not modify auth/wallet code. Dispensary and planned IndustryNext companion links remain gated.

Remaining verification: Parent owns the full bare build, mobile/geometry/no-JS QA, committed-head matching, formal approval and release gate. This report does not authorize publication.

Primary evidence: [Black Store](https://theboyandthebear.com/pages/the-black-store), [BLS national](https://www.bls.gov/news.release/cpi.t02.htm), [BLS LA](https://www.bls.gov/regions/west/news-release/consumerpriceindex_losangeles.htm), [DIR](https://www.dir.ca.gov/dlse/FAQ_MinimumWage.htm), [Census](https://www.census.gov/quickfacts/fact/table/elsegundocitycalifornia/PST045224), [USDA](https://apps.fas.usda.gov/psdonline/circulars/coffee.pdf), [ICO](https://www.ico.org/documents/cy2025-26/cmr-0826-e.pdf).

## Final targeted registry review

PASS: src/data/ues-business-cases.json and business.astro rendering preserve the coffee route and present dispensary, real-estate and business-signals cards without links. New studies are clearly In preparation; null href/actionLabel are never rendered as anchors. No new evidence or finance claims are implied. Coffee access text now correctly distinguishes unknown wheelchair-accessible seating from source-listed outdoor seating. Updated tests pass 5/5, including unset pending destinations. Final fingerprints include the new registry and the revised page/test files. No new findings; no broad re-research or unrelated file edits.
