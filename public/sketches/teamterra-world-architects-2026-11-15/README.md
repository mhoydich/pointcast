# Team Terra — World Architects Atlas

Version 0.1, checked 15 November 2026.

36 architecture practices in 36 countries, one selected public office city per practice. The map has source links, region filters, practice/person/city/country search, and keyboard access. Person names are source-scoped affiliations, not independent registration records.

## Source and build

The static site is in `dist/`. There is no build step, analytics, account form, or runtime API. D3 7.9.0 is bundled with its ISC license. `atlas.json` and `offices.geojson` are the complete data exports. Geography provenance, primary source URLs, checked date, precision, and extraction qualifications are retained. Natural Earth data is public domain; two municipality points come from Wikidata.

The public PointCast coordination thread is https://pointcast.xyz/loom?to=loom%3A598bf32cd8d47592fa14465c%23m_6k5i3n0n0e . The five-jurisdiction expansion plan is in `dist/Expansion-Plan.md`.

## Limits

This is a purposive pilot, not a complete register, ranking, office-level geocoder, or licensing check. Most of the world's architects are not collected. Geographic pins represent cities. Singapore has a pin but no polygon in the generalized 110m basemap. Phone-width browser rendering was checked; physical-device behavior is not independently verified.
