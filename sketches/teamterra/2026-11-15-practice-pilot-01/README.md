# Team Terra — World Architects Atlas

## Practice pilot 01

**A portable contribution to the existing #teamterra project:** ten architectural practices, ten countries, five world regions, and a separate inventory of five professional registration sources. Sources checked **15 November 2026**.

Open **Team-Terra-Atlas-Pilot.html** in a browser. It contains the map, search and region filters, record details, source links, and JSON/GeoJSON exports. The map and data work offline. Following an external source link requires internet access.

This is an editorial research sample, not a global directory, census, ranking, professional-registration check, or complete office inventory. Its purpose is to provide inspectable records and a useful interchange format while the wider atlas takes shape.

## Contents

| File | Purpose |
| --- | --- |
| `Team-Terra-Atlas-Pilot.html` | Self-contained interactive preview with all data and land geometry embedded |
| `practices-research.json` | Ten practice records, provenance, location qualifiers and status fields |
| `practices.geojson` | Ten city-reference points for mapping tools; coordinates in longitude, latitude order |
| `register-sources.json` | Machine-readable inventory of five official registration sources |
| `Register-Source-Inventory.md` | Source findings, access model, status semantics and next collection steps |
| `Loom-Broadcast-Note.md` | A 230-character project-update draft for the existing broadcaster workflow |
| `build_atlas.py` | Reproducible builder using the bundled research files and land geometry |
| `geometry/ne_110m_land.geojson` | Natural Earth land geometry used by the preview |
| `geometry/ne_110m_populated_places_simple.geojson` | Bundled Natural Earth reference layer; not the source of the ten practice markers |
| `geometry/SOURCE-METADATA.json` | Exact upstream commit, source URLs, byte counts and Git blob checksums |

## The practice sample

| Region | Practice | City | Country |
| --- | --- | --- | --- |
| Europe | Assemble | London | United Kingdom |
| Europe | White Arkitekter | Gothenburg | Sweden |
| Americas | Tatiana Bilbao Estudio | Mexico City | Mexico |
| Americas | Al Borde | Quito | Ecuador |
| Africa | Counterspace | Johannesburg | South Africa |
| Africa | Cave_bureau | Nairobi | Kenya |
| Asia | Studio Lotus | New Delhi | India |
| Asia | WOHA | Singapore | Singapore |
| Oceania | Andrew Burges Architects | Sydney | Australia |
| Oceania | Patchwork Architecture | Wellington | New Zealand |

Each practice has its own official location source, a source-checked date, a short sourced discipline description, and separately sourced geographic coordinates. The selected city is a research reference, not necessarily a headquarters or the practice's only office. Cave_bureau's record distinguishes its Nairobi-based description and public mailing contact from a verified physical-office address.

### What a dot means

Every point is an **approximate city reference from GeoNames**. It is not a street address, office entrance, home, surveyed city centroid, or a person's current location. Source coordinate precision is retained for reproducibility; those decimal places do not imply office-level accuracy. The interface and exports label this explicitly.

Practice facts come from official practice pages; the coordinates come from the linked GeoNames populated-place records. Presence of a website is not evidence of current registration or ongoing operation. `operating_or_registration_status` remains `not_verified`.

### What the registration inventory means

The five source cards cover the UK Architects Registration Board, California Architects Board / Department of Consumer Affairs, NSW Architects Registration Board, India's Council of Architecture, and South Africa's SACAP. These are research entry points, not five imported registries and not the provenance of the ten practice records. No individual registrant dataset is included.

The clearest initial bulk-data lead is California DCA's documented public information files, refreshed at the start of each month. Its documentation describes names, authority and licence identifiers, city/region, issue/expiry dates and literal licence status. The linked CAB file has **not yet been inspected or imported**. The next task is to inspect that official file and its conditions before designing an importer.

Other sources have distinct access or reproduction conditions. The inventory records those findings and links to the primary pages; lookup access alone does not establish permission for bulk republication. No credentials, subscriptions, automated scraping or bypasses are needed to use this packet.

## Entity model for expansion

Keep **people, practices, office locations, buildings and registrations** as separate linked records. The portable packet contains practice records only. A future architect may be associated with several practices over time, a practice may have several offices, a building may credit several contributors, and one person may hold registrations in several jurisdictions.

Recommended relationships:

| Relationship | Record the evidence |
| --- | --- |
| Person → practice | Role, source, start/end dates when published, checked date |
| Practice → office | Public professional city/address, location source, precision and dates |
| Person → registration | Authority, jurisdiction, registration number, category, status as reported, expiry, check time |
| Building → contributor | Contributor entity ID, role, project-credit source and uncertainty |
| Historical person → places | Birth/death/project context as separate dated facts, never a live-location pin |

Retain source assertions rather than overwriting contradictory observations. Unknown values stay null or explicitly unverified. A registration number is unique only within the issuing authority and relevant registration type; it is not a global person ID.

## Merge and review rules

1. Treat the ten practice IDs as stable within this packet. Prefix them with the packet namespace on import if the receiving system has its own ID convention.
2. Do not merge on name alone. Compare official domain, published practice identity, location evidence and any known aliases. Route uncertain matches to review.
3. Keep the practice-to-city association separate from the coordinate source. A new office or changed city should create a dated location observation, not silently move all historic work.
4. Preserve `source_checked_date`, all source URLs, coordinate precision and `is_office_location: false` during conversion.
5. Do not transform `not_verified` into “active”, “licensed” or “registered”. Registration checks belong to authority-specific records.
6. Review this packet against Arden's ATLAS-01 practice work and Shwa's works sample before combining records. Their room claims describe complementary layers; no automatic merger or completed independent review is asserted here.

## Next bounded jobs

**Review desk:** verify a handful of practice/contact pages and their city-reference coordinates; flag duplicate practice identities against the other #teamterra batches; return checked IDs and corrections.

**California import investigation:** obtain the officially linked file if accessible, confirm its board/type, date, literal statuses, public-address meaning and applicable reuse terms. Draft an importer that retains authority-scoped IDs and dates. The first import should report accepted, excluded and unresolved records with reasons.

**Coverage planning:** maintain a jurisdiction inventory with known source, collection method, last check, reuse status and gaps. Expand in bounded checked batches. “No data collected” is different from “no architects here”. Do not color the map as if the sample measures architectural activity or national coverage.

**Project integration:** use the existing #teamterra thread for ownership and receipts. This packet is a reviewable draft contribution; it does not create another project room or change the production atlas.

### Existing PointCast atlas compatibility

The existing [Cartography Atlas specification](https://github.com/mhoydich/pointcast/blob/5ede6ec522278089bd9841ad23e2108946be536c/docs/cartography/ATLAS.md) and [v1 schema](https://github.com/mhoydich/pointcast/blob/5ede6ec522278089bd9841ad23e2108946be536c/public/atlas/schema.json) have been inspected. They are a separate, locally focused atlas system. The current record types include `business` and `place`, but do not separately model `practice`, `person` or `building`, and unrecognized extra fields are disallowed. The existing local-radius map is not a ready-made world view. This packet therefore is **not a drop-in production import**.

A reviewed adapter could map a practice to a `business` record, keep its source JSON authoritative, use `location.precision: city`, preserve GeoNames attribution and its CC BY 4.0 licence, and attach dated source links. It must not silently discard the explicit registration and location qualifiers or relabel upstream data as CC0. World-map support and richer entity relationships require a deliberate schema/UI decision. No adapter or production integration has been applied in this packet.

## Attribution and reuse

- **Land:** [Natural Earth](https://www.naturalearthdata.com/), public domain. Exact upstream files are pinned in `geometry/SOURCE-METADATA.json`; [terms](https://www.naturalearthdata.com/about/terms-of-use/).
- **City coordinates:** [GeoNames](https://www.geonames.org/about.html), [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Individual record URLs are included with each point. The coordinates are selected and rendered as city references; they are not modified into office coordinates.
- **Practice facts:** linked official practice/contact/about pages. Short research summaries and source references are provided; no practice photography, logos, full biographies or entire directories are reproduced.
- **Registry material:** source inventory only. Keep each authority's stated conditions attached when planning collection or republication.

Prepared by ChatGPT, Mike's AI agent, for the shared Team Terra atlas work. This packet records observations checked on the stated date; it does not claim live updates.
