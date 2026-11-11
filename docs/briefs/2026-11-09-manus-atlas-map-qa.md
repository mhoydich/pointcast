# Manus brief: real-device QA of the Atlas map pages (2026-11-09)

Owner: Claude (Fable), Cartography architect. Tracks TASKS.md "Cartography: the Atlas". Run after both pull requests deploy: PointCast #1608 and elsegundo.xyz #288 (deploy #288 first; see the TASKS row on deploy order).

## Open these URLs

1. https://pointcast.xyz/cartography/map (PointCast's own atlas)
2. https://pointcast.xyz/cartography/map?site=all (the cross-site view from the merged index)
3. https://pointcast.xyz/cartography/map#pc:court:el-segundo (a deep link that should select the Recreation Park courts)
4. https://pointcast.xyz/cartography/atlas (the spec page)
5. https://pointcast.xyz/atlas.json and https://pointcast.xyz/atlas/index.json (should download as JSON with `Access-Control-Allow-Origin: *`)
6. https://elsegundo.xyz/cartography/ and https://elsegundo.xyz/atlas.json

## Accounts and tools

None. Every page is public; nothing to sign in to. Use a phone (iOS Safari and Android Chrome if both are at hand) and one desktop browser.

## What to check and capture

- Desktop (about 1200 px wide): the geodesic plot draws the 25-mile ring with pins; the legend chips filter by type; the search box narrows the list; clicking a pin opens the detail panel with the record's sources (each a link with a label and a checked date), license line and "Open page" button. Screenshot the whole page and one open detail.
- Phone (375 px wide): the layout stacks (controls, stats, map, detail, list); pinch or the + and − buttons zoom; the list scrolls inside its box; tapping a row selects it and the pin highlights. Screenshot the first screen and one selected record.
- `?site=all`: the stats line reports two sites and more records than the default view; the site selector shows "All sites"; at least one elsegundo.xyz record (for example "Recreation Park Courts", site elsegundo.xyz) appears in the list and its detail panel shows a `same-as` link to a PointCast court. Screenshot.
- Deep link (URL 3): the page opens with that record selected. Note whether the list scrolled to it.
- Keyboard only (desktop): Tab reaches the search box, selects, chips, pins and list rows; Enter on a pin or row selects it.
- With JavaScript disabled (desktop): PointCast's page shows the plain record list grouped by type with source links; elsegundo.xyz's page shows the no-script line pointing at /atlas.json.
- elsegundo.xyz page: the site header and the "Not an official City of El Segundo page" line are present; the map draws; the layer list shows 15 layers.
- Console: note any errors (open the browser console on desktop).

## Where to write the result

`docs/manus-logs/2026-11-09-atlas-map.md` in mhoydich/pointcast: one section per URL with what you saw, the screenshots embedded or linked, device and browser names, and any console errors verbatim. If a page is not live yet, say so and stop; do not deploy anything.

## Approvals

No action in this brief needs Mike's approval: it is read-only QA. Do not post results on X or anywhere public; the log in the repo is the deliverable.
