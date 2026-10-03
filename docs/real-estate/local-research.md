# Local real-estate study: source and method receipt

Checked 2026-10-03. This file supports `src/lib/real-estate-local.mjs`; it is an educational research brief, not a broker listing service, parcel report, underwriting opinion, or partnership announcement. The historical intern program is closed. IndustryNext and University of El Segundo references elsewhere in the project must describe a proposed educational case; no institution, student, or worker has been engaged by this study.

## Geographic method

The starting address is El Segundo City Hall, **350 Main Street, El Segundo, CA 90245**. Its [published City Code overview](https://codelibrary.amlegal.com/codes/elsegundoca/latest/overview) gives that address. The [official Census current-benchmark geocoder query](https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=350%20Main%20Street%2C%20El%20Segundo%2C%20CA&benchmark=Public_AR_Current&format=json) returned HTTP 200 JSON with **33.91992025096, -118.415864992665**. Census describes the benchmark as “Public Address Ranges - Current Benchmark”; the match is street-range interpolation, not a surveyed rooftop or parcel centroid.

Every distance and the circle use that same point and a mean Earth radius of 3,958.7613 miles. Haversine calculates great-circle distance; the boundary uses the spherical destination-point equations for bearings 0–360 degrees. This is a geodesic approximation, not a cadastral survey or an ellipsoidal boundary determination. It is a **25-mile radius**, not 25 miles of driving and not a commute area. Water and portions of jurisdictions can lie inside the circle. Only representative anchor points are included; inclusion does not imply an entire city is inside. Nothing here measures a school catchment, parcel boundary, or listing location.

The other coordinates are approximate editorial study anchors chosen near civic or central districts. Labels combine a practical study lens with a city/area name; they are not a data provider’s proprietary submarket polygons. Property types identify comparisons worth investigating, not verified inventories or development permissions.

| Anchor | Great-circle miles | Comparative lens |
| --- | ---: | --- |
| El Segundo Main Street | 0.00 | Main-street housing, rentals, and stores |
| El Segundo eastside | 1.63 | Office, industrial, and adaptive-use costs |
| Manhattan Beach downtown | 2.40 | Coastal housing and retail |
| Hawthorne civic/aviation | 3.64 | Inland rentals and employment space |
| Playa Vista/Westchester | 3.89 | Apartment and office operations |
| Hermosa Beach civic/pier | 4.10 | Coastal rentals and visitor businesses |
| Inglewood civic/K Line | 4.61 | Durable leases versus event demand |
| Marina del Rey/Del Rey | 4.65 | Jurisdiction, leasehold, and coastal diligence |
| Redondo Beach civic/waterfront | 5.13 | Waterfront versus inland costs |
| Gardena civic/commerce | 6.63 | Housing and small-business space |
| Culver City downtown | 7.08 | Employment and transit comparisons |
| Torrance civic/business corridors | 7.24 | Multiple asset types in one city |
| Santa Monica downtown | 7.85 | Rent rules and repair reserves |
| Carson civic/logistics | 11.19 | Logistics versus residential operations |
| Downtown Los Angeles | 13.13 | Tower systems, office vacancy, conversion costs |
| Long Beach downtown/waterfront | 16.62 | Port-city and urban-waterfront distinctions |
| Burbank downtown | 19.03 | Employer concentration and leasing costs |
| Pasadena civic/central districts | 22.12 | Historic buildings and repair obligations |

## Planning evidence and limits

The module contains 36 dated source receipts with access status. Planning content is an original research checklist, not a paraphrased permission decision. A property can be subject to zoning, general/specific plans, overlays, coastal jurisdiction, recorded conditions, building code, legal occupancy, tenant rules, and pending ordinances simultaneously. Verify the operative documents and the building itself before a decision.

The [El Segundo published zoning title](https://codelibrary.amlegal.com/codes/elsegundoca/latest/elsegundo_ca/0-0-0-10322) distinguishes residential, commercial, office, industrial, and overlay categories. Its index marks the old Smoky Hollow chapter repealed; the current operative specific plan must be obtained rather than applying that old chapter. The publisher says its code may omit more recently adopted legislation. The official city planning page returned 403, and no bypass was attempted.

Useful accessible primary entry points include [Inglewood’s GIS gallery](https://www.cityofinglewood.org/836/Map-Gallery), [Gardena Planning and Zoning](https://cityofgardena.org/planning-and-zoning/), [Carson Planning](https://www.carsonca.gov/services/community___economic_development/plannings), [Redondo Beach Community Development](https://www.redondo.org/departments/community_development/index.php), [LA County maps/jurisdiction resources](https://planning.lacounty.gov/maps-and-gis/), [Pasadena Planning](https://www.cityofpasadena.net/planning/), and [Burbank Planning](https://www.burbankca.gov/web/community-development/planning). The [LA Community Plans](https://planning.lacity.gov/plans-policies/community-plans) and [Long Beach Planning Bureau](https://www.longbeach.gov/lbcd/planning/) returned 200 with ordinary HTTPS requests even though the research browser timed out. Their plan and zoning links were read from the official HTML.

The official El Segundo, Manhattan Beach, Hermosa Beach, Hawthorne, Torrance, and Culver City portals either blocked automated fetching or yielded only search metadata in this session. They are retained as **human research links** with explicit access labels. No zoning designation, entitlement, rent law, current inventory, vacancy rate, asking price, or local yield is asserted from those unavailable pages.

Santa Monica provides [GIS resources](https://www.santamonica.gov/topic-explainers/maps-and-gis), [Rent Control guidance](https://www.santamonica.gov/departments/rent-control), and a [Seismic Retrofit Program](https://www.santamonica.gov/programs/seismic-retrofit-program). Building-list inclusion is a screening step, not a final structural diagnosis. Other cities’ rules must be researched separately; the [California Attorney General’s tenant guidance](https://oag.ca.gov/tenants) is a statewide starting point, not a complete local rule engine.

Risk bullets are **questions**, not parcel scores. [FEMA’s official flood map service](https://msc.fema.gov/portal/home), [CGS ground-failure screening guidance](https://www.conservation.ca.gov/cgs/geohazards/eq-zapp), and [CAL FIRE hazard-zone guidance](https://osfm.fire.ca.gov/what-we-do/community-wildfire-preparedness-and-mitigation/fire-hazard-severity-zones) have distinct purposes and limitations. CAL FIRE maps hazard rather than individual property risk. CGS zones do not capture every shaking or ground-failure exposure and do not replace geotechnical work. GeoTracker and EnviroStor are research links only; no environmental parcel records were downloaded. Earthquake event counts cannot establish a property’s safety.

## Feed feasibility receipt

No accounts, API keys, credentials, loan applications, transactions, broker contacts, or restricted MLS scraping occurred. No listing photos or purported available properties were synthesized.

| Source | Observed access and cadence | Delivery / reuse implication |
| --- | --- | --- |
| [FHFA metro HPI CSV](https://www.fhfa.gov/hpi/download/quarterly_datasets/hpi_at_metro.csv) | Keyless HTTP 200; 4,186,906 bytes. Latest LA–Long Beach–Glendale MSAD code 31084 was 2026 Q2, index 557.38; Q1 558.88. Quarterly all-transactions, not seasonally adjusted. | No `Access-Control-Allow-Origin` header with PointCast Origin. Use bounded cached server read or a dated snapshot. Attribute FHFA. Not rent, NOI, cap rate, yield, current listing, or individual valuation. |
| [Census ACS 2024 5-year API](https://api.census.gov/data/2024/acs/acs5.html) | Catalog accessible, but the data query redirected to `missing_key.html` with `X-DataWebAPI-KeyError: 1`. | Wildcard CORS on error HTML does not establish data access. No key obtained and no ACS figures invented. Annual multi-year estimates would require survey period and margins of error, not “realtime” labels. |
| Census Geocoder | Keyless study-center JSON verified. `Vary: Origin` seen; browser CORS not separately tested. | A single fixed lookup supports the center snapshot. No recurring geocoding or parcel precision promised. |
| [Metro GTFS schedules](https://developer.metro.net/gtfs-schedule-data/) | Documentation says bus weekly-updated-service updates weekly; rail generally daily Tuesday–Saturday. | Download ingestion/CORS not tested. Schedule data describes planned service; it is not live arrival data. GTFS format’s Apache license is not a blanket Metro-data license. |
| [Metro Swiftly realtime](https://developer.metro.net/api/) | Vehicle positions about 5 seconds, trip updates about 10 seconds; API key required. | Not connected. No registration or credentials created. |
| Metro scheduled cancellation beta | Documentation says roughly 5 minutes, scheduled cancellations only, excluding contracted lines such as 125/232. Endpoint response not probed here. | Candidate only. Never a complete bus reliability feed. [Metro developer terms](https://developer.metro.net/terms-conditions/) require attribution, accurate presentation, and review of redistribution/advertising limits. |
| LA historical permit resource `yv23-pmwf` | Data and metadata GET both returned HTTP 403 requiring login; wildcard CORS on error. | Unavailable as a working keyless feed. No owner/permit records ingested; use the public portal as a research entry. |
| Municipal/county planning, FEMA, CGS, environmental layers | Human pages/maps with source-specific revisions; individual APIs/reuse metadata not validated. | Source-linked screening only. No automated parcel risk scoring, owner-data ingestion, cadastral layer publication, or promise of refresh. |

The parent implementation owns the USGS event feed and read-only endpoint integration. This module provides inventory and sourced fixed research; it does not create a refresh scheduler. FHFA’s current-change JSON at `https://www.fhfa.gov/hpi-city/json` is accessible but omits the observation period, so the dated CSV is preferable for transparent series history. The [FHFA datasets page](https://www.fhfa.gov/data/hpi/datasets) identifies quarterly/monthly/annual series definitions. HPI growth must not be converted into a forecast or local yield.

## Validation

`node --check` passes. Data validation confirms 18 unique market IDs, finite points/distances, every anchor at or below 25 miles, seven recognized typologies, and valid source references. The 120-segment closed boundary preserves a 25-mile distance with numerical deviation below `3e-12` miles using the same spherical formula. Cross-jurisdiction local law, parcel geometry, actual listing rights, exact zoning, private underwriting inputs, and building conditions remain outside this v1’s evidence.
