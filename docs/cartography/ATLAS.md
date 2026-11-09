# The Atlas — one open map of everything our sites know

Status: draft spec v1.0.0, written 2026-11-08 by Fable (Claude) as Cartography architect.
Applies to: elsegundo.xyz (`mhoydich/hello-token-reserve`), PointCast (`mhoydich/pointcast`),
Industry Next and the University of El Segundo (hosted inside those two sites).
JSON Schema: `/atlas/schema.json` on PointCast, mirrored as `/atlas.schema.json` on elsegundo.xyz.
Inventory of what already exists: `docs/cartography/INVENTORY.md`. Next layers: `docs/cartography/NEXT-20-LAYERS.md`.

## 1. What the Atlas is

Each site publishes one file, `atlas.json`, that lists every thing the site knows how to place:
places, courts, players, gear, events, leagues, businesses, quiet places and shrines, pings,
pages, bots and agents, and how they connect. PointCast also publishes a merged index of every
site's atlas. People read the map pages; bots read the JSON or call the read-only MCP tools.

The Atlas is a **projection of datasets that already exist**, not a new place to type facts in.
Every record points back to the dataset it was derived from (`layer`) and to the public source
that dataset cites (`source`). If a fact is wrong, fix it in the source dataset and rebuild.
Suggestions and new layers arrive as pull requests. There are no public write tools.

Scope: everything inside the shared 25-mile radius first (center: El Segundo City Hall,
350 Main Street; the same center the civic atlas and the dispensary atlas already use), then wider.

## 2. The record

Every record, on every site, has the same shape. Required fields are marked.

| field | req | type | meaning |
| --- | --- | --- | --- |
| `id` | yes | string | `{site}:{type}:{slug}`. Site prefix: `es` elsegundo.xyz, `pc` pointcast.xyz, `in` industrynext.xyz, `ues` University of El Segundo. Slugs are lowercase `a-z0-9._-`, taken from the source dataset's own id where it has one. Ids are stable: once published, never reused for something else. |
| `type` | yes | enum | `place` `court` `player` `gear` `event` `league` `business` `quiet-place` `shrine` `ping` `page` `bot` `agent` `route` `area` `dataset` `feed` `tool` |
| `name` | yes | string | Display name, as the source prints it. |
| `summary` | no | string ≤ 280 | One plain line. Our own words, never a copied paragraph. |
| `site` | yes | hostname | The site that publishes the record. |
| `url` | yes | https URL | The human page for the thing (may be a page section with `#fragment`). |
| `data` | no | https URL | The machine door: the JSON, CSV or API that holds the full record. |
| `location` | no | object | See §3. Omit it rather than invent one. Relational-only records (gear, agents, pages) have none. |
| `source` | yes | array ≥ 1 | `{ url, title?, checked (YYYY-MM-DD), label }`. `label` is the elsegundo.xyz vocabulary: `fact` (official), `listing` (organizer or venue), `reported` (single outlet), `estimate` (model output), `derived` (computed from other records, e.g. a distance). Every fact in the record is covered by at least one source link. |
| `updated` | yes | YYYY-MM-DD | The day the record's facts were last checked, copied from the source dataset's as-of field. Not the build time. |
| `links` | no | array | `{ rel, id, note? }`. `rel`: `near` `in` `part-of` `has-part` `same-as` `about` `plays-at` `hosted-at` `made-by` `sells` `reads` `answers` `see-also`. `id` is an Atlas id, possibly on another site. |
| `license` | yes | SPDX id, or `public-domain-us-government` | `CC0-1.0` for records the sites wrote. `ODbL-1.0` for anything derived from OpenStreetMap. `public-domain-us-government` (not an SPDX id; a named value in the schema enum) for US federal works such as NOAA and Census data. Others as the source requires. |
| `attribution` | no | string | Required when `license` is not CC0, e.g. `© OpenStreetMap contributors`. |
| `tags` | no | array | Short lowercase facets: `pickleball`, `ues`, `industry-next`, `do:sit`, `free:yes`. Reuse the Here-card tag vocabulary where it fits. |
| `layer` | yes | string | The id of the layer (source dataset) the record came from. |
| `status` | no | enum | `live` (default) `planned` `historical` `draft`. |
| `sensitive` | no | array | Editorial flags a sister site may need to honor, e.g. `cannabis`. elsegundo.xyz never publishes records carrying this flag. |

### 3. Location

```json
"location": {
  "lat": 33.9216674, "lon": -118.411307,
  "precision": "point",
  "address": "401 Sheldon St, El Segundo, CA 90245",
  "area": "el-segundo",
  "method": "published facility point",
  "source": "https://locator.lacounty.gov/lac/Location/3177269/el-segundo-city-hall",
  "license": "CC0-1.0"
}
```

- `lat`/`lon` WGS84 decimal degrees, at most 6 decimals. Required if `location` is present.
- `precision`: `point` (a surveyed or published facility point), `address` (geocoded street
  address), `block` (a street block or small site), `neighborhood` (a region of a town, e.g. a
  ping zone), `city`, `region`. A ping zone placed at its region's representative point is
  `neighborhood`; a thing known only to be in Torrance is `city`.
- `area`: a slug from the 18 South Bay region maps (`el-segundo`, `manhattan-beach`, …) or one of
  El Segundo's own zones (`main-street`, `smoky-hollow`, `tree-section`, `rec-park`, `beach`,
  `aerospace-alley`, `cubicle-country`, `the-point`, `lax`). Lets a map group without coordinates.
- `method` and `source`: where the coordinate came from. Coordinates taken from an OpenStreetMap
  record set `location.license` to `ODbL-1.0` and the record's `attribution`; the text of the
  record stays CC0.
- Distances anywhere in the Atlas are straight-line great-circle distances in miles, computed
  from these coordinates, never travel time. Say so where you show one.

## 4. The atlas file

```json
{
  "$schema": "https://pointcast.xyz/atlas/schema.json",
  "schemaVersion": "1.0.0",
  "kind": "site-atlas",
  "site": "elsegundo.xyz",
  "name": "elsegundo.xyz atlas",
  "description": "Every place, court, event, business, quiet place, ping zone, page, bot and tool elsegundo.xyz knows, in one file.",
  "generated": "2026-11-08T22:00:00Z",
  "license": "CC0-1.0",
  "licenseNote": "Records carry their own license when it differs; OpenStreetMap-derived records are ODbL-1.0.",
  "notOfficial": "Not an official City of El Segundo page.",
  "spec": "https://pointcast.xyz/cartography/atlas",
  "map": "https://elsegundo.xyz/cartography/",
  "center": { "lat": 33.9204497, "lon": -118.4153182, "name": "El Segundo City Hall", "source": "https://locator.lacounty.gov/lac/Location/3177269/el-segundo-city-hall" },
  "radiusMiles": 25,
  "layers": [ { "id": "places", "name": "Places", "types": ["place"], "count": 48, "inline": true, "data": "https://elsegundo.xyz/places/", "license": "CC0-1.0", "updated": "2026-10-29", "source": { "url": "...", "title": "..." }, "notes": "..." } ],
  "records": [ ... ],
  "counts": { "total": 0, "located": 0, "byType": { "place": 0 }, "byLayer": { "places": 0 } }
}
```

- `kind` is `site-atlas` or `merged-index`.
- `layers[]` describes each source dataset: what it is, how many records, whether its records
  are inline in this file (`inline: true`) or only referenced (`inline: false`, with `data` and
  `count`). Large or fast-moving datasets (the 29,000-row OpenStreetMap business directory, the
  live court-availability snapshot) are reference layers: the Atlas tells a reader where the
  data is and how many rows, and includes only the curated records that fit in a map.
- A site atlas should stay under about 1 MB so a phone can draw it. Split before you bloat.
- Generated means written by `scripts/atlas/build.mjs` in each repo from the source datasets, and
  committed. A test (`--check`) fails when the committed file is stale.

### The merged index

PointCast builds `/atlas/index.json` (`kind: merged-index`) from its own atlas plus a committed
snapshot of each sister atlas (`src/data/atlas/snapshots/{site}.json`). `node scripts/atlas/build.mjs
--fetch` refreshes the snapshots from the live `atlas.json` files; without `--fetch` it uses what
is committed, so builds are deterministic and work offline. The index adds:

```json
"sites": [ { "site": "elsegundo.xyz", "atlas": "https://elsegundo.xyz/atlas.json", "generated": "...", "snapshot": "2026-11-08", "records": 300, "ok": true } ],
"crossLinks": [ { "from": "pc:court:el-segundo", "rel": "same-as", "to": "es:court:recreation-park-courts" } ]
```

Records are merged by `id`; sites never share a prefix, so ids never collide. Records flagged
`sensitive` stay in the merged index with their flag; the elsegundo.xyz map page and MCP read only
elsegundo.xyz's own atlas and never render them.

## 5. Policies that shape every layer

1. **Every fact links a public source.** A record with no `source` fails the schema. A layer whose
   source dataset has no per-record sources gets dataset-level sources on every record and says so
   in `layers[].notes`.
2. **No scraping behind sign-ins, no app-only data.** Facts read from an app screen, a logged-in
   view or a page whose terms forbid reuse do not enter the Atlas. The pickleball directory's
   banned-hosts rule (pickleball.com, pickleballtournaments.com, pickleballbrackets.com, ppatour.com,
   usapickleball.org, dupr.com, pickleballden.com) applies to results, ratings and player data on every
   layer: nothing is extracted or republished from those hosts. Citing one of their public pages as the
   source link for a fact the Atlas states in its own words (for example the USA Pickleball approved-paddle
   listing behind a paddle's approval status) is a reference, not an extract, and is allowed.
3. **People appear only as they published themselves.** A `player` record exists only for a player
   whose directory entry carries a verified `claim` (fields they asked for: self rating, home courts,
   paddle, bio). Unclaimed names stay in the directory pages they already have; the Atlas carries the
   `league` record (the ladder, the method, the count) and links to the directory, not the names.
   No phones, emails, home addresses, ages, photos or employers anywhere. Public officials appear
   with office contact only (the representatives register already enforces this). The do-not-list
   is honored by every build.
4. **Open license.** Our records are CC0-1.0. Derived records keep the upstream license and
   attribution. Nothing enters the Atlas under a license that forbids republishing.
5. **Not official.** Every atlas file and map page carries the site's not-official line.
6. **Sister-site editorial rules travel with the data.** elsegundo.xyz never publishes cannabis
   records, candidate endorsements, AI art presented as photos, or invented hours. Records that
   would break a sister site's rules carry `sensitive`.
7. **Dates are the source's dates.** `updated` is when the facts were checked. The build time is
   `generated`. Never let one stand in for the other.

## 6. Read-only MCP tools

Both MCP servers (`https://pointcast.xyz/api/mcp`, `https://elsegundo.xyz/mcp`) add four tools.
They read `atlas.json` (and, on PointCast, the merged index). None writes anything.

| tool | input | returns |
| --- | --- | --- |
| `atlas_search` | `q?` words (all must match name, summary, tags, layer, type), `type?`, `layer?`, `site?` (PointCast only; `all` searches the merged index), `limit?` (default 10, max 50), `offset?` | `total`, `items` (compact records: id, type, name, summary, url, location, updated, layer), paging |
| `atlas_get` | `id` | the full record, with each link resolved to `{ rel, id, name, type, url }` where the target is known |
| `atlas_near` | `lat`, `lon`, `radiusMiles?` (default 1, max 25), `type?`, `limit?` | located records sorted by great-circle distance, each with `distanceMiles` and `bearing`; says straight-line, not travel |
| `atlas_links` | `id`, `rel?`, `depth?` (1 or 2) | outgoing links and incoming links (records that point at this id), as a small graph `{ nodes, edges }` |

Every result carries the atlas `generated` date, the record `updated` dates, the license line
and the not-official line, in the server's existing result envelope.

## 7. Map pages

One page per site draws its own atlas: PointCast at `/cartography/map`, elsegundo.xyz at
`/cartography/`. The cross-site view is PointCast `/cartography/map?site=all`, drawn from the
merged index. The renderer is one dependency-free script, `atlas-map.js`, kept identical in both
repos: a basemap-free geodesic plot (the house style of the civic and dispensary atlases: north up,
10-, 20- and 25-mile rings, no third-party tiles, no tracking), filters by type and layer, a search
box, a record list with every source link, deep links by `#id`, and a keyboard path through every
record. Records without coordinates are listed, grouped by `area`, not hidden.

## 8. Adding a layer

1. Put the facts in a dataset with per-record public sources and an as-of date (or point at the
   one that exists).
2. Write an adapter in `scripts/atlas/layers/{layer}.mjs` that maps each row to an Atlas record.
3. Run `node scripts/atlas/build.mjs`, then the repo's tests. The schema test and the staleness
   check must pass.
4. Open a pull request. Say where the coordinates came from and what personal-data check you ran.
