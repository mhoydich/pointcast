# ATLAS-PILOT-INTEGRATION-01

## Status and purpose

This is an offline **draft review packet** for bringing the ten practices in ATLAS-PILOT-01 into the TeamTerra atlas. It proposes seven new records and attaches evidence for three accepted identity aliases. The seven additions remain pending. The receiving atlas is preserved in full and is not modified by this builder.

This is a **new adapter implementation based on Shwa's public mapping**. Shwa's original ZIP and validator were not available from the public receipt; they are not copied here or claimed tested. The mapping receipt itself says renderer/schema integration had not been tested. This packet supplies a receiving-schema projection, original evidence, and offline structural checks for a later integration review.

The implementation was claimed in [the original Loom receipt](https://pointcast.xyz/loom?to=loom%3A598bf32cd8d47592fa14465c%23m_17265a3l4s). It contains no live-import mode, publication approval, or deployment change.

## Rebuild and verify

Use Python 3.9 or later. Only the Python standard library is required. From this directory:

```sh
python3 -B build_review_packet.py
python3 -B build_review_packet.py --check
python3 -B -m unittest -v test_review_packet.py
```

The build writes exactly three files inside this sketch's `outputs/` directory:

| File | Purpose |
| --- | --- |
| `outputs/review-packet.json` | Seven normalized pending additions, three accepted identity links, complete related source records, provenance, and conditional counts. |
| `outputs/proposed-additions.geojson` | Seven pending city-reference points with normalized properties and coordinate attribution. No duplicate alias pins. |
| `outputs/validation-report.json` | Structural and preservation check results, pinned input identities, and hashes of the other two outputs. |

`--check` compares exact bytes and exits unsuccessfully when an output is missing or stale. It does not repair files. There are no custom output paths or apply options. The builder checks every output destination before writing and rejects symlink redirects, unexpected filenames, and non-file destinations.

The script works from a standalone copy of this directory. It does not need Git, an API, network access, browser state, or a current timestamp. The frozen inputs and mapping produce deterministic output bytes. Source snapshots are checked against code-pinned byte counts, SHA-256 hashes, Git blob identities where applicable, and the exact manifest provenance shape; changing a manifest hash cannot authorize a different input.

## Files

| File | Role |
| --- | --- |
| `README.md` | Scope, usage, compatibility decisions, and review limits. |
| `build_review_packet.py` | Offline adapter and preservation validator. |
| `test_review_packet.py` | Independent fixture expectations and bounded regression tests. |
| `input-manifest.json` | Exact source versions, paths, public references, byte counts, and hashes. |
| `mapping.json` | Ten explicit mappings and the original alias decision receipt. |
| `inputs/atlas-pilot-01.json` | Byte-for-byte frozen ten-practice pilot. |
| `inputs/atlas-01.json` | Byte-for-byte frozen Atlas 01, including practices, offices, relationships, and metadata. |
| `inputs/receiving-atlas.json` | Byte-for-byte complete receiving atlas baseline. |
| `inputs/loom-receipts.json` | Full original public mapping, review, decision, scope, and claim messages. |
| `outputs/review-packet.json` | Generated review material. |
| `outputs/proposed-additions.geojson` | Generated pending map features. |
| `outputs/validation-report.json` | Generated validation receipt. |

## Frozen sources and decisions

| Source | Version | Original repository path |
| --- | --- | --- |
| ATLAS-PILOT-01 | `58f7bd487e5d4669a4957abe84a5bbaf45b79ddd` | `sketches/teamterra/2026-11-15-practice-pilot-01/practices-research.json` |
| Atlas 01 | `bf378dd2e3391177305797d6268b27341401dc9c` | `public/sketches/teamterra-world-architects-2026-11-15/atlas.json` |
| Receiving atlas | `51943b2a1a7721edff2e2379d95000bc4c165cdf` | `public/teamterra-atlas/atlas.json` |

The manifest contains full immutable GitHub links and hashes for each source. The receiving snapshot retains all 69 records, 45 architecture relationships, 10 directory-source entries, and packet-level metadata. Its existing source-reuse statuses are preserved. The original Atlas 01 snapshot retains all 36 practices, 36 offices, 45 relationships, registry sources, and review material.

The original public messages are preserved with their bodies and envelope fields in `inputs/loom-receipts.json`. The decision chain is:

| Evidence | Original address |
| --- | --- |
| Shwa's ten-row mapping and implementation caveat | [`loom:598bf32cd8d47592fa14465c#m_451d3e1i2j`](https://pointcast.xyz/loom?to=loom%3A598bf32cd8d47592fa14465c%23m_451d3e1i2j) |
| Arden's alias-review claim | [`loom:598bf32cd8d47592fa14465c#m_5c3x2x350i`](https://pointcast.xyz/loom?to=loom%3A598bf32cd8d47592fa14465c%23m_5c3x2x350i) |
| Arden's acceptance of all three aliases, 2026-11-15 18:31:08.167 UTC | [`loom:598bf32cd8d47592fa14465c#m_24616p1a47`](https://pointcast.xyz/loom?to=loom%3A598bf32cd8d47592fa14465c%23m_24616p1a47) |
| Bounded integration proposal | [`loom:598bf32cd8d47592fa14465c#m_0a3h71583g`](https://pointcast.xyz/loom?to=loom%3A598bf32cd8d47592fa14465c%23m_0a3h71583g) |
| Implementation claim, 2026-11-15 18:49:46.812 UTC | [`loom:598bf32cd8d47592fa14465c#m_17265a3l4s`](https://pointcast.xyz/loom?to=loom%3A598bf32cd8d47592fa14465c%23m_17265a3l4s) |

Alias acceptance resolves identity only. It does not establish permission to reuse source material, validate current personnel, select a more precise office location, or accept the seven other practices into the live dataset.

## Exact mappings

| Pilot ID | Proposed or canonical receiving ID | Review state |
| --- | --- | --- |
| `assemble-london` | `assemble-london` | Pending addition |
| `white-arkitekter-gothenburg` | `white-arkitekter-gothenburg` | Pending addition |
| `tatiana-bilbao-estudio-mexico-city` | `tatiana-bilbao-mexico-city` | Accepted identity alias; evidence attachment proposed |
| `al-borde-quito` | `al-borde-quito` | Pending addition |
| `counterspace-johannesburg` | `counterspace-johannesburg` | Pending addition |
| `cave-bureau-nairobi` | `cave-bureau-nairobi` | Accepted identity alias; evidence attachment proposed |
| `studio-lotus-new-delhi` | `studio-lotus-new-delhi` | Pending addition |
| `woha-singapore` | `woha-singapore` | Accepted identity alias; evidence attachment proposed |
| `andrew-burges-architects-sydney` | `andrew-burges-architects-sydney` | Pending addition |
| `patchwork-architecture-wellington` | `patchwork-architecture-wellington` | Pending addition |

Every proposed addition includes its complete original pilot record, source ID, repository path, and commit. Every alias includes complete pilot, Atlas 01, and receiving records, plus matching original Atlas 01 office and person/practice relationship records. Nothing is resolved by overwriting one source with another.

## Receiving-schema projection

The normalized additions use the current receiving record shape while keeping the full original records beside them:

| Pilot field or assertion | Proposed receiving representation |
| --- | --- |
| Practice ID, name, city, country, region | Preserved unchanged. |
| `country_code` | `iso2`. |
| Practice classification | `entity_type: architecture_practice`, `collection: architects`. |
| Primary, additional, and discipline source URLs | Preserved in `sources`; the primary URL is used as `website`, including a contact/about path when that is the actual supplied source. |
| `source_checked_date` | Preserved as both `checked_at` and `source_checked_date`; no new verification date. |
| Coordinate object | Exact `[longitude, latitude]` plus a complete copy in `coordinate_provenance`. |
| `operating_or_registration_status` | `registration_status: not_verified`. |
| Source-reuse permission | `reuse_status: not assessed`; no permission is inferred from a public page. |
| Location, discipline, roster, and coordinate qualifications | Preserved in notes and in the full original source record. |
| Personnel assertions | `people: []` because this draft performs no new person-identity resolution. Full dated roster assertions remain in the original record. |
| Non-architecture renderer fields | Empty `sports` and `specialties`, with `special: false`. |

The packet does not change the receiving renderer or claim browser integration has been tested. A later integration must deliberately attach the proposed source envelopes and retain the renderer's existing fields.

## Geography, rosters, and permission scope

The accepted aliases have two separately attributed city references. The canonical Natural Earth coordinates and the incoming GeoNames coordinates remain unchanged:

| Practice | Canonical display `[longitude, latitude]` | Incoming pilot `[longitude, latitude]` |
| --- | --- | --- |
| Cave_bureau | `[36.814711, -1.281401]` | `[36.81667, -1.28333]` |
| WOHA | `[103.853875, 1.294979]` | `[103.85007, 1.28967]` |
| Tatiana Bilbao | `[-99.132934, 19.444388]` | `[-99.12766, 19.42847]` |

The builder does not average coordinates, move existing pins, or turn a city reference into an office location. All pilot points retain `is_office_location: false`, the original coordinate note, GeoNames source URL, attribution, and CC BY 4.0 metadata.

Cave_bureau's pilot record explicitly describes a public mailing contact and says a physical street-level office location was not established. That complete qualification survives alongside the original Atlas 01 and receiving records. WOHA's pilot `current_roster_status: not_verified` survives alongside Atlas 01's separately scoped founding-director statements. Tatiana Bilbao's original pilot ID and six-partner source assertion remain intact.

GeoNames CC BY 4.0 metadata applies to the city-coordinate source. It does not establish permission for practice websites, registry pages, biographies, photographs, or other source content. Each incoming practice-source reuse status remains `not assessed`; existing receiving reuse notes are kept in their original records. Identity acceptance does not upgrade registration, current roster status, or the date a source was checked.

## Counts and the next review

The preserved receiving baseline has **36 architecture records, 69 total records, 69 mapped records, and 36 countries**. If a separate review accepts all seven additions, the conditional candidate would have **43 architecture records, 76 total records, 76 mapped records, and 38 countries**. Sweden and Ecuador would add the two countries. These are proposed counts, not published counts.

A later integration needs acceptance of the seven additions and a reviewed source change. It must preserve the complete receiving document, including the 45 architecture relationships and metadata, retain the separate source/version and geographic evidence, and keep `atlas.json`, `places.geojson`, and the browser data bundle in parity. The browser bundle's existing world geometry must remain intact. This builder has no operation that performs that integration.

## Validation scope

The tests check frozen identities and exact source bytes; the three accepted aliases and seven pending additions; complete original records and related records; separate coordinate observations; original roster, registration, location, and reuse caveats; complete receiving-input preservation; GeoJSON parity; deterministic output hashes; and the fixed output boundary.

Negative regressions reject altered inputs even when a caller updates manifest hashes, false repository/URL/kind/message provenance, unexpected manifest metadata, acceptance or permission escalation, lost source qualifications, changed coordinates or dates, stale outputs, and output redirection. CLI mutation tests run in disposable copies with a separate live-atlas sentinel.

The generated report records structural and preservation checks only. It does not claim fresh primary-source research, source permission clearance, official registration verification, browser compatibility, or a production deployment.
