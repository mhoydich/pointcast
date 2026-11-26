# Team Terra World Atlas — edition 002

A self-contained static directory of architects, accountants, court venues and cheesemakers, plus a bounded worldwide court-discovery interface.

## Public route

The intended canonical route is `/teamterra-atlas/`. Existing `/atlas` and `/world-atlas` are unrelated PointCast experiences and are preserved.

## Contents

- `index.html`, bundled styles and browser scripts: collection map, directory and court discovery.
- `atlas.json`: 69 normalized curated records, source notes and professional-directory inventory.
- `places.geojson`: the 69 sourced map points with precision and evidence.
- `sources/`: original research packets and independent review.
- `Provenance.json`: geography sources, versions, query scope and attribution.
- `Expansion-Plan.md`: bounded next imports and acceptance criteria.

The curated page loads from local files and does not require an account, backend key or runtime geocoder. Court-discovery tiles load only when its panel is opened; area queries run only on a button press. See the on-page provider and privacy note. Browser storage caches up to eight query results for 24 hours; it contains public area-query results, not authentication data.

## Data distinctions

Practice and producer points are municipality references. Two court venues have operator-sourced facility reference points. Other venue points are city references. The OpenStreetMap finder uses mapped nodes or feature bounding-box centres and reports map features, not a court census.

No collection is globally complete. No individual professional registrations are independently verified. Public access, booking, fees and current availability are separate facts.

Every curated record carries `reuse_status`. The value `not assessed` means source-specific reuse has not been assessed; it grants no permission and does not imply that reuse is prohibited. Existing architecture compilation notes retain their original wording. Keep this field identical by record ID in `atlas.json`, the browser's `assets/atlas-data.js`, and `places.geojson` feature properties. The separate OpenStreetMap court-discovery export retains its own ODbL attribution and licence.

## Third-party code and data

D3 7.9.0 and Leaflet 1.9.4 are bundled with their BSD licences. Natural Earth data are public domain, pinned to the documented repository commit; its version file reports 5.2.0-pre. Wikidata city coordinates are CC0. The St-Albert, Ontario point comes from the official Canadian gazetteer. Court-discovery data are © OpenStreetMap contributors under ODbL 1.0; that attribution and licence accompany exports. Primary websites remain the authority for their own statements; their content is not relicensed by this directory.

## Publishing

Use the repository’s normal reviewed PR, merge-to-main and Cloudflare deployment workflow. A source commit or successful build alone is not a live release. Verify the public HTML and assets after deployment, allowing for existing PointCast middleware transformations to HTML. Do not include preview fixtures, private workspace configuration or credentials.

## Verification and current limitation

Run `node --test tests/teamterra-atlas-data.test.mjs` from the repository root after changing the curated dataset or either derived copy. The focused checks require a nonblank reuse status, complete browser-data parity, and matching IDs, coordinates and reuse notes in the GeoJSON export.

See `Browser-QA.json` for browser observations and the independent court-filtering review in `sources/`. Curated filters, keyboard selection, narrow-screen layout and map tiles passed. The live Overpass area query timed out for a 1 km El Segundo search in the shared browser. The page handled the timeout and retained the curated directory; successful live retrieval has not been verified here. This external-service limitation must remain visible in release reporting.
