# Manus brief — Nouns Money publish QA (2026-10-19)

PRs: https://github.com/mhoydich/pointcast/pull/1436 (Enjoy. Money plan, Nouns Money leads the front page, merged 2026-10-19) and https://github.com/mhoydich/pointcast/pull/1424 (Currency Builder Almanac, plus the `/nouns-money/` count and nav fix). QA production on pointcast.xyz after both have deployed. If the Almanac isn't live yet, run checks 1–2 and come back for the rest.

## URLs to open
- `/` (front page)
- `/nouns-money/enjoy/` and `/nouns-money/enjoy.json`
- `/nouns-money/`
- `/currency-builder/almanac/`, then `/currency-builder/almanac.json`
- Three Almanac detail pages: open week 1, week 9 and week 52 from the index

## Accounts and tools
None. Only a browser: desktop Chrome plus a real phone (iOS Safari if possible).

## Checks
1. `/`: the Nouns Money block sits directly under the masthead, above the October Desk, and includes the Enjoy. Money strip. Every link in that block opens a real page (no 404s).
2. `/nouns-money/enjoy/`: the page says "Published plan · nothing on chain yet" near the top, and the closed-loop rule is stated (nothing redeems for dollars, USDC or goods). `/nouns-money/enjoy.json` returns JSON.
3. `/nouns-money/`: the room nav shows six doors (01 Explore through 06 Enjoy. Money) in one row on desktop and two rows of three on the phone. The numbers strip reads **192** exchange concepts. "What could we share?" shows four cards, two by two on desktop and stacked on the phone: Commons / 40, Global Barter / 100, Almanac / 52 and Engraved variations / 140. Each card's image loads and its link opens.
4. `/currency-builder/almanac/`: all 52 weeks are listed. Each detail page shows a note with a Noun and the year wheel with one week lit. The front and back SVG links open.
5. Spot-check five Almanac source links (any weeks). Each should load and support the week's claim. List any that are dead or don't match.
6. No horizontal scrolling at phone width on any page above.

## Capture
Desktop and phone screenshots of `/` (first screen), `/nouns-money/enjoy/`, the `/nouns-money/` nav plus the "What could we share?" section, and one Almanac detail page. Log any console errors and any broken links or source URLs.

## Write results to
`docs/manus-logs/2026-10-19-nouns-money-publish-qa.md`

## Mike approval needed
No, not for QA. Any on-chain step in the Enjoy. Money plan (contract, minting, claim codes) needs Mike, and nothing here starts one.
