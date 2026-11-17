# Team Terra World Atlas — expansion plan

Checked 15 November 2026. Edition 002 follows Mike’s requests for architects, accountants, public sports courts worldwide with special places highlighted, and global cheesemakers.

## Delivered scope

The curated starter collection contains **69 records in 36 countries**: 36 architecture practices, 10 accounting practices, 13 sports venues, and 10 cheesemakers. All 69 have a sourced map point. Ten sports venues are editorial highlights; three ordinary South Bay venues provide a local starting point. A venue can contain several courts or shared layouts; 13 venues does not mean 13 physical courts.

The map supports collection, region, text, sport and special-court filters. Each record carries primary sources, a check date and location precision. Two sports venues have operator-sourced facility reference points; the remaining new places use municipality references. A city point does not locate an entrance.

The court discovery interface searches a bounded area anywhere within the map’s supported latitude range. It offers a 7,350-entry city reference index, map panning, coordinate entry, 1/2/5 km search radii, sport filters and GeoJSON export. City references are navigation aids, not a complete city gazetteer.

## What “all the courts” requires

The goal is a growing global inventory, with a measurable coverage ledger. OpenStreetMap provides a useful worldwide base, but missing courts, missing sport tags and missing access tags are common. A map feature can describe an individual court, a hall or an entire sports centre. Those entities must remain distinct.

The current finder selects named court sports on `leisure=pitch`, `sports_hall` or `sports_centre`. It supports basketball, pickleball, tennis and nineteen additional named court sports. Generic `sport=multi` alone is excluded because it does not establish a court sport. Individual physical courts must not be inferred from feature counts.

Default results have `access=yes` or `access=permissive`. The optional unestablished-access layer includes missing, conditional and permit-required access, with their qualifications visible. Explicitly nonpublic or inactive records remain excluded. Fees and reservation requirements do not automatically turn a public venue into a private one. Parent-area access, live opening hours and eligibility conditions are not computed.

The interactive service is [Private.coffee Overpass](https://overpass.private.coffee/). Queries run only after a user action, with one request in flight, a ten-second cooldown, a 35-second timeout and a 500-candidate cap. Results are cached on the device for 24 hours, up to eight areas. A capped response or service warning is marked incomplete. The third-party service can be slow or unavailable; the curated directory remains available independently.

For a global inventory, use [regional extracts](https://download.geofabrik.de/) or a dedicated data service rather than a planet-wide query on a shared public API. Retain [OpenStreetMap attribution and ODbL lineage](https://www.openstreetmap.org/copyright) with the derived data.

## Next bounded deliveries

| Work packet | Deliverable | Acceptance check |
|---|---|---|
| COURTS-01 — South Bay | Municipal venue inventory for El Segundo, Manhattan Beach, Hermosa Beach, Redondo Beach and Torrance, joined to mapped court features | Every venue has an official source, sport list, access/fee/booking fields and a date; unresolved court counts remain unresolved. |
| COURTS-02 — regional import | One reproducible regional OSM extract, initially California, with original typed IDs, snapshot time, licence and geometry | Counts by sport and access class, explicit candidate limits, reproducible transformation and a sampled comparison with municipal records. |
| COURTS-03 — special places | Ten additional sourced highlights across current regional gaps | A concrete reason for each highlight, public-use evidence, current availability caveats and a source for any precise venue point. |
| ACCOUNTANTS-01 | Twenty additional practices, including more local and regional firms; a separate ten-record credential verification sample where permitted | Distinguish firms, networks, people and memberships. Verify professional status only against the relevant authority and preserve its exact scope. |
| CHEESE-01 | Twenty additional producers across Latin America, Africa, Asia and underrepresented European regions | Evidence that the entity makes cheese; distinguish factories, retail shops, affineurs and brands. Record milk/type and visit rules only when supported. |
| ARCHITECTS-02 | Reconcile the existing 36-practice packet, ATLAS-PILOT-01 and Shwa’s works seed | Merge only reviewed identities; keep practices, people, buildings, offices and registrations separate. Preserve conflicting evidence. |

These are proposed packets, not accepted ownership assignments or scheduled jobs. Claims and completed artifacts belong in the [existing Team Terra Loom thread](https://pointcast.xyz/loom?to=loom%3A598bf32cd8d47592fa14465c%23m_4f2m5z6e6g).

## Accountants: stronger evidence than a directory label

The current ten entries describe accounting practices and their published services. No individual licence or firm registration has been independently verified. The five accounting authority entry points are the California Board of Accountancy, ICAEW, SAICA, ICAI and CA ANZ. Their scopes differ: professional membership, public practice and statutory licensing are not interchangeable.

SAICA’s member-verification source restricts marketing use; it must not become a lead-harvesting source. CA ANZ explicitly describes opt-in coverage. Store a source-specific access and reuse decision before any import. The source inventory and qualifications are in `sources/accountants_seed.json` and `sources/Accountants-Source-Notes.md`.

## Cheesemakers: production and visiting are different facts

Every seed maker has evidence of production. Public visits are a separate field. La Latteria’s FAQ says its premises are not open to the public; Dalewood’s shop says it does not offer tastings. A maker with an online shop is not automatically a visitor attraction. Preserve production municipality, retail locality, tour operator and public-access evidence independently.

## Source and identity rules

Use stable, typed identifiers. A person, practice, office, producer, factory, sports venue and individual court are separate entities joined by sourced relationships. One firm can have several offices; one site can host several sports; one physical court can have multiple line layouts. Names alone are insufficient for merging.

For each new record retain source URL, checked date, short evidence, geographic source and precision, operational qualifications and reuse status. Do not convert unknown fees to “free”, unknown access to “public”, or a missing coordinate into a guessed pin. A source check confirms what the source says on that date; it is not a booking or a physical inspection.

## Review and operational limits

The original architecture packet received a six-record independent source review. The new court logic passed eight independently executed scenario checks, including geometry preservation, access distinctions, lifecycle exclusions, sport token handling and radius limits. Three highlighted venues received a second source check. Those bounded checks are recorded in the supplied review files; they do not establish exhaustive accuracy.

Browser and deployment results are reported in the release receipt on Loom. Future releases should publish exact counts, geographic gaps, stale-source counts, unpinned records, unresolved identities and review coverage. Public URLs should be verified after the normal PointCast deployment finishes.
