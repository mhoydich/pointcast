# Kennel Club — The December Sitting

Date: 2026-09-02
Owner: X (Codex)
Branch: `codex/kennel-club-plates-20260902`
Status: blocked before generation; restyle and handoff prepared

## Completed

- Restyled the visual system and all 31 composed prompts from the former dark society-oil register to the approved flat acrylic-and-screenprint portrait register.
- The new style base names David Hockney and Andy Warhol only in the generation prompts and briefing copy; TZIP-21 token metadata contains neither artist name.
- Retained the single named dog, distinct breed, heritage menswear, eyes-on-viewer, slightly amused expression, asymmetrical ikebana framing, and full no-text/no-mark/no-human boundary for every sitting.
- Added an explicit single-dog/four-leg constraint to each composed prompt to reduce the known anatomy failure mode.
- Confirmed December 2026 and the 31-token Tezos sequence (token id = day − 1) in the brief and task queue.
- Logged the later project-owned wallet/multisig idea in `TASKS.md`; it is explicitly not built.

## Plate-generation block

The required local engine path exists, but the files are not readable on this machine. A direct read of `poster-image-engine/README.md` was given a 15-second alarm and timed out at 2026-09-02 06:10 PDT. The file reports zero allocated data blocks, consistent with unavailable local content. The required project directory therefore could not be inspected, planned, or generated.

No image-generation model was invoked. No PNG or WebP plate was created, imported, or verified. All 31 `image.status` values intentionally remain `pending`; no unverified asset is represented as ready.

Engine: `poster-image-engine` local workflow requested, unavailable before plan
Model: not invoked
Cost: $0
Generation time: 0 minutes
Regenerations: 0

## Validation

- `node --test tests/kennel-club-series.test.mjs`: passed, 2 / 2.
- Prompt audit: 31 / 31 prompts recomposed from `styleBase + subject + scene + composition + antiPrompt`; minimum prompt length 1,434 characters.
- Metadata audit: 0 artist-name occurrences in token metadata; no prohibited brand terms in the visual system or composed prompts.
- `npm test`: blocked by an existing incomplete dependency tree (`ERR_MODULE_NOT_FOUND: sharp` in `tests/western-heat-brains.test.mjs`), followed by expected missing-`dist` failures; 671 passed, 22 failed, 4 skipped.
- `npm run build:bare`: blocked because `node_modules/astro/bin/astro.mjs` is absent.

## Next move

Restore or hydrate the poster-image-engine files, then rerun this same project through `plan`, generate/import, and verify. Only then should the 62 public assets be added and statuses changed to `verified`.
