# Pantone case study — original visual provenance

Three original SVG illustrations authored by Codex for Michael Hoydich’s requested case study. These are explanatory vector artworks, not photographs, Pantone swatches, a Pantone database, or physical color matches. No image-generation API, new account, purchase, subscription, or runtime service was used.

All generic colors are declared original screen approximations in the artwork. The materials atlas is explicitly conceptual; no local material was sampled or measured.

| File | Size | SHA-256 |
| --- | ---: | --- |
| `public/pantone/assets/original-color-agreement.svg` | 2635 bytes | `c61d71500bbe40625d652b3f048d7ae8c335dcda33b7c5876f0712fd397381fe` |
| `public/pantone/assets/original-specification-loop.svg` | 3857 bytes | `8a7dbb1f9e6bf47c8d90b5da90aa05c685c2779f7f410c4bed15193fcdfc846e` |
| `public/pantone/assets/original-local-materials.svg` | 4489 bytes | `2e31d1fc6bacf023e55a266633c15e5608e6e87aeb510c4f7f3059d94f34aa93` |

## Private archive receipt

The three unchanged originals, authorship/brief metadata, and hash-verification receipt were archived in a new dedicated `codex-pantone-original-vectors-2026-10-25` batch in the existing private AI Image Library. The library’s AGENTS.md, START-HERE.md, and agent-index.json were read before import. Available disk space was approximately 37 GiB; this batch’s SVG payload is under 20 KiB. Existing private files, source archives, dashboard records, and catalogs were untouched. The batch is archived but not added to the pre-existing dashboard inventory.

No historical private imagery was reused or published. The public repository includes only the three newly authored SVG files and this provenance note; it contains no library catalog or private archive paths.

## Verification

- XML parse validation passed for all three SVGs.
- SVG width/height and viewBox are explicit, with title/description accessibility metadata.
- Archive bytes match worktree SHA-256 values for all three originals.
- All three SVGs were rasterized at 1,200 px wide with the existing sharp dependency and visually inspected: no clipped text or unintended overlaps.
- No script, foreignObject, event handler, external image/font, or external reference is embedded.
- These diagrams require surrounding accessible text at small viewport sizes; embedded text is supplementary to the case study, not its sole explanation.
