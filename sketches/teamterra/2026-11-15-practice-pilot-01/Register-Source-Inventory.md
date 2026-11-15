# Team Terra — Register Source Inventory

Checked: **15 November 2026**.

This is an inventory of five authoritative lookup sources for a mapping pilot. It is not an ingested register, a global census, or a certification of any sample practice or person. Official lookup interfaces, documentation, status semantics and access/reuse routes were checked. No individual registrations were verified and no register records were bulk-downloaded.

## JSON schema

The companion file `register-sources.json` has exactly two top-level keys: `metadata` and `sources`.

| Field | Type | Meaning |
|---|---|---|
| `metadata` | object | Title, schema version, check date, scope, policies and enumerated bulk-state meanings. |
| `sources` | array of objects | One record for each authority/jurisdiction source. |
| `id` | string | Stable authority identifier scoped to this pilot. |
| `name` | string | Official authority and register name. |
| `jurisdiction` | string | Geographic registration coverage, not office location or nationality. |
| `region` | string | Broad editorial map region. |
| `official_url` | HTTPS URL string | Authority page explaining or linking to its public register. |
| `lookup_urls` | array of HTTPS URL strings | Verified public lookup entry points. |
| `status_semantics` | string | Entity categories and status distinctions to preserve. |
| `bulk_reuse_summary` | string | Documented access/reuse situation, with unknowns explicit. |
| `recommended_next_step` | string | Practical research/import action; not an assertion of permission. |
| `checked_date` | ISO date string | Date this source documentation was checked. |
| `evidence_urls` | array of HTTPS URL strings | Primary documentation supporting the record. Includes California's linked but uninspected Box destination. |
| `bulk_state` | enum string | One of the four values defined in `metadata.bulk_state_values`. |

## 1. United Kingdom — ARB

**Coverage and lookup.** The Architects Registration Board maintains the official individual Architects Register. The search supports registration number, name, company, address and advanced country/postcode-distance fields. A company-name search is a route to individuals; it does not establish a firm licence.

**Access and reuse.** ARB documents online access and PDF download, but its terms restrict copying to personal, noncommercial use and require written permission for wider reproduction/distribution. No open bulk API or republication licence was verified.

**Pilot action.** Link to the official register and keep broader register-derived republication pending a documented permission route. A source card is distinct from a checked registration record.

Sources: [ARB register explanation](https://arb.org.uk/about-arb/architects-register/), [public search](https://architects-register.org.uk/), [register details and PDF availability](https://cms.architects-register.org.uk/your-register-details), [terms and conditions](https://cms.architects-register.org.uk/terms-and-conditions).

## 2. California, United States — CAB / DCA

**Coverage and lookup.** The California Architects Board licenses individual architects, not firms or corporations. CAB documents name, city, county and licence-number searches. DCA reports current/expired and disciplinary states; preserve the literal status and dates.

**Access and reuse.** DCA documents an agency-by-agency monthly public-information-file route, refreshed at the start of each month. Its schema includes licence identity, name, public address, city/region, issue and expiry dates, and status. CAB is not among listed exclusions. The linked Box folder was inaccessible to the web retrieval tool, so **the CAB file is uninspected and has not been downloaded or ingested**. No separate reuse licence was established.

**Pilot action.** This is the strongest first candidate for investigating a formal scalable import. Inspect the CAB file and applicable reuse conditions before importing, retaining dated snapshot and live-check provenance.

Sources: [CAB licence-search explanation](https://cab.ca.gov/cons/archs/lic_search.shtml), [DCA live search](https://search.dca.ca.gov/), [DCA data portal](https://www.dca.ca.gov/data/index.html), [official monthly route and schema](https://www.dca.ca.gov/consumers/public_info/index.html), [linked Box destination — not inspected](https://dca.box.com/s/oss6hf8jys2bmgxqd2gdz7w4oepm2il9).

## 3. New South Wales, Australia — NSW ARB

**Coverage and lookup.** NSW maintains an individual register and a separate corporation/firm list. Individual search uses name, registration number and suburb/postcode. Businesses nominate responsible architects. Preserve practising versus non-practising: a non-practising registrant retains the title but may not provide architectural services. Discipline is separately searchable.

**Access and reuse.** No bulk/API route was verified. The copyright page permits personal reproduction and asks for Registrar permission for other reproduction, alteration, storage or transmission.

**Pilot action.** Use linked manual checks and establish a data/republication route before ingestion. Keep people, firms and nominated-architect relationships separate.

Sources: [individual register](https://www.architects.nsw.gov.au/architects-register/architects), [firm list](https://www.architects.nsw.gov.au/architects-register/firms), [checking registration](https://www.architects.nsw.gov.au/using-an-architect/check-your-architect-s-registration-status), [non-practising meaning](https://www.architects.nsw.gov.au/maintaining-registration/transfer-to-non-practising), [copyright conditions](https://www.architects.nsw.gov.au/copyright).

## 4. India — Council of Architecture

**Coverage and lookup.** CoA maintains the national individual Register of Architects. Verification uses a CA registration number plus a security code. Directory filters include name, registration year/number, state, city and pincode. Preserve validity and reported disciplinary findings; a historical registration number alone is insufficient evidence of current standing.

**Access and reuse.** The directory permits three free searches per day per IP. Unlimited directory access requires subscription. No bulk export or republication licence was verified, and subscription must not be interpreted as republication permission.

**Pilot action.** Use limited manual checks within published access conditions and establish a documented route before scaling. Do not copy residential or personal-contact fields into the map.

Sources: [public information hub](https://coa.gov.in/info_for_general_public.php), [registration-number verification](https://coa.gov.in/ver_arch.php?lang=1), [directory and access limit](https://coa.gov.in/search_arch.php?lang=1), [official Act text on the register, renewal, removal and discipline](https://coa.gov.in/index1.php?lang=1&level=2&lid=133&sublinkid=119).

## 5. South Africa — SACAP

**Coverage and lookup.** SACAP's linked search offers name/surname, registration type and province. Categories include Professional Architect, Senior Architectural Technologist, Architectural Technologist and Architectural Draughtsperson, with candidate and other specified categories. Preserve the category and current standing. Candidate registration does not mean independent professional practice.

**Access and reuse.** No bulk download or reuse permission was verified. A May 2026 SACAP notice advises municipalities to direct people to the live register instead of republishing names/contact lists, citing changing registration statuses and personal-information concerns.

**Pilot action.** Link to current verification and seek a documented republication route before creating register-derived listings. Do not count all SACAP categories as Professional Architects.

Sources: [public guidance](https://www.sacapsa.com/for-public), [official directory entry](https://www.sacapsa.com/directory/custom-pr-search), [linked current search](https://search.mymembership.co.za/Search/?Id=4f3f0fde-d5dc-4af0-97cd-0a192a56830e), [registration categories](https://www.sacapsa.com/registration/categories), [May 2026 notice](https://www.sacapsa.com/news/article/notice-to-all-local-authorities).

## Mapping and evidence rules

Keep people, registrations, practices, offices and buildings as separate entities. A person can have more than one registration; the authority plus registration number identifies that registration. Registration jurisdiction and office geography are different attributes.

For a city-level practice pilot, use an official practice/contact source for the professional city, retain the geographic point's own provenance, and label the point as a city reference rather than an office. Do not infer current professional registration or current staffing solely from a practice website. Preserve `not_verified` where no register entry was checked.

The five-register inventory and the ten-practice editorial sample have different geographic scopes. The sample does not establish coverage of these five registers, and the registers do not certify the sample.

## Basemap provenance

The accompanying geometry files come from Natural Earth, repository `nvkelso/natural-earth-vector`, pinned commit `ca96624a56bd078437bca8184e78163e5039ad19`:

- `ne_110m_land.geojson`: 127 features; 138,160 bytes.
- `ne_110m_populated_places_simple.geojson`: 243 city points; 166,071 bytes.

Both local files match their upstream Git blob SHA. Source URLs and hashes are in `geometry/SOURCE-METADATA.json`. Natural Earth explicitly places its raster/vector data in the public domain: [official terms](https://www.naturalearthdata.com/about/terms-of-use/). Coordinates use longitude, latitude order (CRS84).

Natural Earth's coarse city points are one available geographic source. The separate practices JSON uses GeoNames city points, explicitly attributed to GeoNames and licensed CC BY 4.0, with record-level licence links. Keep those coordinates distinct from Natural Earth. GeoNames' [official terms](https://www.geonames.org/export/) describe attribution and commercial use; the [official extract README](https://download.geonames.org/export/dump/readme.txt) identifies [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
