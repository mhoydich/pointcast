# The next 20 layers

Ranked by usefulness to a person or a bot standing in the 25 miles, divided by how cheaply the
layer can be collected under the Atlas rules (public source per fact, no sign-ins, no personal
data, open license). Written 2026-11-08 by Fable as Cartography architect, after the inventory in
`INVENTORY.md`. Tiers: **A** = the data already sits in a repo and only needs an adapter
(`scripts/atlas/layers/*.mjs`, a Haiku-size job); **B** = one public source, a few hours of
Haiku/Sonnet collection with a human spot-check; **C** = several sources or a people process.

Collector: Haiku for A and simple B (copy fields, run the build, open a PR); Sonnet for B layers
that need matching across datasets; a person for anything that touches people.

| # | Layer | Type(s) | Why it is useful | Public source (license) | Tier | Site | Personal-data check |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | South Bay architecture landmarks | place | 65 buildings already geocoded with per-claim quotes; the richest ready place layer after OSM. Lets `atlas_near` answer "what is that building". | `public/architecture/buildings.json` (CC0; coordinates marked by `coordSource`, estimates become `precision: neighborhood`) | A | elsegundo.xyz | none; buildings only |
| 2 | Hand-checked local businesses | business | 21 records a person verified against the business's own page, Census-geocoded, with `sourceQuote`. The trusted counterpart to the 29k OSM rows. | `public/directory/businesses.json` (CC0; Census geocoder points are public domain) | A | elsegundo.xyz | public business phone only in summary |
| 3 | OPEN/25 outdoor places | place, quiet-place | 38 parks, beaches, piers and lawns with a City or county source each and a "quiet" mode; `same-as` to elsegundo places where ids match. | `src/lib/radius25-outdoors.ts` (CC0; needs coordinates from the sister places layer or a Census geocode) | A | pointcast.xyz | none |
| 4 | Pickleball venues outside El Segundo, courts per venue | court | Finish the court layer: every public court within 25 miles with a court count, fee and booking door. 21 venues exist; city parks pages list more (Torrance, Redondo, Hawthorne, Inglewood, LA RAP). | City Parks & Recreation facility pages (public), rec.us and playbypoint public listings (listing) | B | elsegundo.xyz | none |
| 5 | Geology field walks and tide-pool spots | quiet-place, route | Four sourced walks (El Porto sand layers, the Pleistocene dune, …) plus the shrine idea of "a place to stand"; cheap, distinctive, nobody else maps it. | `src/lib/geology.ts` (CC0) with places geocoded from the elsegundo places layer | A | pointcast.xyz | none |
| 6 | Breweries and taprooms | business | 8 PointCast taprooms plus elsegundo's 62-item breweries guide; merge, dedupe by name, link `sells` from paddle brands later. | `src/data/taproom.json`, `public/breweries/` (CC0 text; coordinates from OSM rows, ODbL) | A | both | none |
| 7 | Transit stops and stations | place | Metro K and C Line stations, Beach Cities Transit and LAX FlyAway stops; `near` queries for "how do I get there". | LA Metro GTFS static feed (open license; attribution), city transit pages | B | elsegundo.xyz | none |
| 8 | Libraries, community and senior centers | place | Quiet rooms, restrooms, water, meeting rooms; half of Here-card "sit" needs. | LA County Library and city library pages (public), LA County Services Locator (public) | B | elsegundo.xyz | none |
| 9 | Restrooms, drinking water, showers near beaches and courts | place | The question every court and beach visitor asks; OSM already holds the nodes. | OpenStreetMap `amenity=toilets`, `drinking_water`, `shower` (ODbL) from the existing 25-mile extract pipeline | B | elsegundo.xyz | none |
| 10 | Tide, buoy and weather stations | place, feed | NOAA 9410840 Santa Monica, NDBC 46221, KLAX/KHHR/KTOA; links the shrines, Field Reports and the Morning Edition to the instruments they read. | NOAA CO-OPS, NDBC and NWS station pages (US government, public domain) | B | pointcast.xyz | none |
| 11 | Farmers markets and recurring street markets | event, place | Weekly, cheap, high foot traffic; events.json already lists one-offs. | CDFA certified farmers' market list (public), city market pages | B | elsegundo.xyz | none |
| 12 | Bike paths and walking routes | route | Marvin Braude trail segments, Ballona Creek path, the Strand, Dominguez Channel; Here already has two routes. | OSM route relations (ODbL), LA County bike path open data (public) | B | elsegundo.xyz | none |
| 13 | Dog parks and off-leash hours | place | Frequent ask; "walking the dog" Here card exists; rules change, so date every fact. | City animal-services and parks pages (public) | B | elsegundo.xyz | none |
| 14 | Public art, murals and historic markers | place | Visible, photogenic, sourced from city registers; El Segundo Arts & Culture, Manhattan Beach public art, NPS National Register (public domain). | City public-art registers, NPS NRHP (public domain) | B | elsegundo.xyz | credit artists by their published names only |
| 15 | Public schools and campuses (no people) | place | Anchors for "where is X relative to a school" and for the UES campus metaphor; strictly addresses and district links. | California Department of Education public school directory (public) | B | elsegundo.xyz | none; never students or staff |
| 16 | Aerospace and industrial landmarks | place | LAX runways, Chevron refinery, Hyperion, Scattergood, SpaceX, Aerospace Corp; the skyline people ask about. 65-building layer covers some. | Operator public pages, FAA airport data (public domain) | B | both | none |
| 17 | Census places and tract centroids | area | Gives every record an `in` link to a legal place and makes the area layer honest (replaces dead-reckoned town points). | Census TIGER/Line 2024 places and tracts (public domain); the civic atlas already reproduces the tract selection | B | both | none |
| 18 | EV chargers and air-quality monitors | place, feed | Two small utility layers from keyless public APIs; cheap to refresh on a schedule. | US DOE AFDC station locator (public domain), AirNow / South Coast AQMD monitors (public); PurpleAir excluded (terms) | B | elsegundo.xyz | none |
| 19 | Leagues, ladders and clubs across the South Bay | league | Beyond The Squeeze and the player directory: city ladders, CAPA event series, Diamond League, club nights, with venue links. | Organizer and city pages (listing); the directory's banned-hosts rule applies | C | both | organizers' public names only; no rosters |
| 20 | Claimed player profiles | player | The only way people enter the Atlas: a verified claim with the fields they asked for (self rating, home courts, paddle). Zero today. | The directory's claim process (`content/pickleball/players/README.md`) | C | elsegundo.xyz | opt-in only; honor the do-not-list |

Worth doing but not in the twenty: block locations (112 PointCast blocks carry a free-text
`meta.location`; a cheap pass could link them `about` to places), the 7,369 El Segundo building
footprints and 5,084 parcels already in `public/architecture/` (too heavy for atlas.json; publish
as a reference layer with a GeoJSON door), the AI services directory (110 tools, not geographic),
elsegundo's 48-work art manifest (not geographic), and Salt Water Commons' "ten places that made it
work" (worldwide; the first "wider" layer once the 25 miles are dense).

Rules that apply to every layer above: the record shape and policies in `ATLAS.md`; a dated public
source on each fact; nothing collected behind a sign-in or from a site whose terms forbid reuse; no
coordinates from memory; people only as they published themselves.
