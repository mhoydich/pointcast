# Currency Builder · Almanac — handoff (2026-10-18)

Mike asked for another Currency Builder collection, made with the ChatGPT Pro subscription through the tunnel to his machine, or by controlling the machine if the tunnel didn't work. Neither was reachable from the cloud session (details in `docs/briefs/2026-10-18-codex-imagegen-almanac.md`). So the collection shipped as deterministic vector notes, like Commons and Global Barter, and the ChatGPT photographs are scripted for the Mac.

## The idea

52 currencies, one for each week of the South Bay year. Each note is earned by noticing that week's sign and logging it in a town almanac: the Quadrantids in week 1, gray whales southbound in week 2 and northbound in week 9, grunion nights, the El Segundo blue on the dunes by the airport, the Perseids, Coastal Cleanup Day, the first Santa Ana, the earliest sunset and the Christmas Bird Count. Notes trade one for one, a full year is 52, and fences, trails and closed seasons outrank any note. Every note draws the same 52-tick year wheel with its own week lit, so the full set reads as one calendar.

## What shipped

| Path | What it is |
| --- | --- |
| `/currency-builder/almanac/` | Landing page: four quarters of 13 weeks, rules, provenance |
| `/currency-builder/almanac/{slug}/` | 52 detail pages: front and back, how it is earned, when and where, a source link, Noun traits and seed |
| `/currency-builder/almanac/notes/{front,back}/{slug}.svg` | 104 print faces, 150 × 75 mm |
| `/currency-builder/almanac.json` | Machine edition |
| `src/data/currency-builder/almanac-52.json` | Source data: week, when, where, line, how, Noun, source |
| `src/lib/currency-builder/almanac.mjs` | Renderer, sharing `primitives.mjs` with Commons and Barter |
| `tests/currency-builder-almanac.test.mjs` | 52 weeks in order, 13 per quarter, 52 different Nouns from recorded seeds, exact pixels, one lit week, text fits, https sources |
| `public/images/og/currency-builder-almanac.png` | Share card (`node scripts/generate-currency-builder-og.mjs almanac`) |
| `scripts/almanac-codex-imagegen.mjs` | Eight ChatGPT photographs of the notes via Codex, run on the Mac |

Also: the Currency Builder home page and masthead link the new collection, and it is listed in `sitemap-discovery.xml` and `agent-surfaces.ts`.

The Nouns are 52 of #0–99, matched by head or accessory: whale (#92) and whale alive (#98) for the two whale passages, jellyfish (#27) for the by-the-wind sailors, yin-yang (#0) for the spring equinox, trash can (#13) for Coastal Cleanup Day, dictionary (#50) for the night migrants, mug (#39) for the extra hour in November and dino (#97) for the Christmas Bird Count. Only #0–99 have verified seeds in the repo, so the Almanac reuses Nouns that also appear in Global Barter. No Noun appears twice within the Almanac.

## Copy guardrails

- Dates are typical for Southern California, phrased as "around" or "usually", and the pages say they shift from year to year.
- Wildlife notes are earned from outside fences (plovers, least terns), from the path (monarchs) or through public walks and workdays (El Segundo blue, which is federally endangered). Grunion are watched, never taken.
- Every note carries "design concept · not legal tender · no cash value". No note is sold or redeemed, and none of these words appear: backed, redeemable, invest.

## Not done

- The Almanac is not in the Security Edition yet. Adding it means an adapter in `security-edition.mjs`, about 104 more engraved faces.
- `/nouns-money/` still describes "140 concepts" across Commons and Barter. Add the Almanac there when the photos land.
- ChatGPT photographs: run `node scripts/almanac-codex-imagegen.mjs` on the Mac.

## Manus follow-up

- After deploy, open `/currency-builder/almanac/`, `/currency-builder/almanac/el-segundo-blue/` and `/currency-builder/almanac/the-perseids/` on iPhone Safari and desktop Chrome. Capture screenshots, and confirm that the SVG downloads work and the source links resolve.
- Spot-check 10 source links from `/currency-builder/almanac.json` and list any 404s.
- Write results to `docs/manus-logs/2026-10-1X-currency-builder-almanac.md`. QA needs no Mike approval.
