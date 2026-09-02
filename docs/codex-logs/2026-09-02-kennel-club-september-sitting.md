# Kennel Club — The September Sitting

Date: 2026-09-02
Owner: X (Codex)
Branch: `codex/kennel-club-plates-20260902`
Status: Part 1 complete and pushed; plate generation pending local engine hydration

## Completed

- Corrected the series calendar from December to September at Mike's direction. The series now has 30 sittings, September 1–30, with token ids 0–29; Sitting 31 (Maximilian) is dropped.
- Rewrote every explicitly wintry scene for late-summer / early-autumn El Segundo: marine-layer mornings, sun-washed afternoons, first cool evenings, poolside, and beach-town interiors. Winter-only titles were retitled accordingly.
- Today is 2026-09-02, so Sittings 01 and 02 mint late. The calendar stays calendar-true.
- Restyled the visual system and all 30 composed prompts from the former dark society-oil register to the approved flat acrylic-and-screenprint portrait register.
- The new style base names David Hockney and Andy Warhol only in the generation prompts and briefing copy; TZIP-21 token metadata contains neither artist name.
- Retained the single named dog, distinct breed, heritage menswear, eyes-on-viewer, slightly amused expression, asymmetrical ikebana framing, and full no-text/no-mark/no-human boundary for every sitting.
- Added an explicit single-dog/four-leg constraint to each composed prompt to reduce the known anatomy failure mode.
- Confirmed September 2026 and the 30-token Tezos sequence (token id = day − 1) in the brief and task queue.
- Logged the later project-owned wallet/multisig idea in `TASKS.md`; it is explicitly not built.

## Plate-generation block

The required local engine path exists in iCloud Drive, but its files were evicted. A `brctl download` is already running in the background. Per the safe hydration procedure, do not read an evicted file: poll its allocated blocks with `stat -f '%b %N'` until local content is available.

No image-generation model has been invoked for this September series. No PNG or WebP plate has been created, imported, or verified. All 30 `image.status` values intentionally remain `pending`; no unverified asset is represented as ready.

Engine: `poster-image-engine` local workflow requested, unavailable before plan
Model: not invoked
Cost: $0
Generation time: 0 minutes
Regenerations: 0

## Validation

- `node --test tests/kennel-club-series.test.mjs`: pending the September test update validation.
- Prompt audit: 30 / 30 prompts recomposed from `styleBase + subject + scene + composition + antiPrompt`.
- Metadata audit: 0 artist-name occurrences in token metadata; no prohibited brand terms in the visual system or composed prompts.
- `npm test`: blocked by an existing incomplete dependency tree (`ERR_MODULE_NOT_FOUND: sharp` in `tests/western-heat-brains.test.mjs`), followed by expected missing-`dist` failures; 671 passed, 22 failed, 4 skipped.
- `npm run build:bare`: blocked because `node_modules/astro/bin/astro.mjs` is absent.

## Next move

Once hydration succeeds, run the September project through `plan`, generate/import, and verify. Only then should the 60 public assets be added and statuses changed to `verified`.
