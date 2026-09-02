# Kennel Club — The September Sitting

Date: 2026-09-02
Owner: X (Codex)
Branch: `codex/kennel-club-plates-20260902`
Status: complete — all 30 plates verified and pushed; PR #1003 remains open

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

## Plate generation

The engine project hydrated successfully. I generated the set with the built-in `gpt-image` image model (provenance version 2.0), in six five-sitting batches. Each batch was imported and verified through `poster-image-engine`; the final manifest verification reported `30/30` at `1024×1280`.

- Output: 30 PNGs plus 30 WebP twins under `public/images/kennel-club/september-sitting/`
- Data: all 30 `image.status` values are `verified`; no pending sittings
- Generation attempts: 34 total for 30 accepted plates
- Regenerations: 4 — Hartley (rendered book-spine text), Barnaby (humanlike pose), Wilhelmina (ambiguous extra boots), Percival (extra-leg artifact)
- Time: approximately 40 minutes, completed 2026-09-02 08:09 PDT
- Cost: not exposed by the image-generation tool

## Validation

- `npm run verify -- projects/kennel-club-september-sitting-2026/generated/manifest.json`: `Verified 30/30 posters at 1024x1280`.
- Asset inventory: 60 public files (30 PNG + 30 WebP), all `1024×1280`.
- `node --test tests/kennel-club-series.test.mjs`: 2 passed, 0 failed after every five-plate batch and at completion.
- Visual review: each accepted plate was screened for extra legs, floating clothing, rendered text, human hands, brand-looking marks, and dead-center framing.

## Handoff

The committed branch is ready for cc’s metadata/page work. No merge or contract deployment was performed.
