# Currency Builder · Commons — handoff (2026-10-11)

Mike asked for 40 currencies on rental, mesh, sharing and barter themes, each using a different actual Noun, built as part of currencybuilder.xyz (which Codex owns). This branch adds them as a self-contained section of PointCast that currencybuilder.xyz can serve or lift.

## What shipped on this branch

| Path | What it is |
| --- | --- |
| `/currency-builder/commons/` | Landing page: 40 notes in four systems, rules, provenance and builder notes |
| `/currency-builder/commons/{slug}/` | 40 detail pages: front and back, how it would work, Noun traits and seed, downloads |
| `/currency-builder/commons/notes/{front,back}/{slug}.svg` | 80 print faces, 1200 × 600 (150 × 75 mm at 2:1) |
| `/currency-builder/commons.json` | Machine edition: currencies, serials, files and Noun provenance |
| `src/data/currency-builder/commons-40.json` | Source data (names, units, mechanisms, palettes) |
| `src/lib/currency-builder/commons.mjs` | Deterministic SVG renderer |
| `src/lib/nouns-parts.mjs` | New `renderSeed(seed)` export: renders an actual Noun from its on-chain seed with the existing official decoder |
| `tests/currency-builder-commons.test.mjs` | 40 distinct Nouns, seeds match provenance, the exact pixels are embedded, disclaimer present |
| `scripts/generate-currency-builder-commons-og.mjs` | Regenerates `public/images/og/currency-builder-commons.png` |

The Nouns are #2, 3, 5, 8, 11, 14, 18, 19, 24–28, 30, 32, 34, 36, 37, 39, 44, 45, 50, 51, 55, 57, 58, 61, 64–66, 68, 75, 76, 80–82, 87, 89, 95 and 96. Each was chosen for its head trait (a house for the Porch Note, a lightning bolt for the Microgrid, a pizza for the Slice, an oyster for the Shell). Seeds come from `public/images/nouns-money/source-100/provenance.json`, which is verified against the official RLE data and nouns.wtf. Only Nouns #0–99 have verified seeds in the repo, and this container could not reach a chain or subgraph to add more.

## For Codex: wiring it into currencybuilder.xyz

No Currency Builder branch, PR or repo was visible from this session, so nothing here assumes Codex's structure. Two clean options:

1. **Serve from PointCast.** Attach `currencybuilder.xyz` to the Pages project and add a host block to `functions/_middleware.ts`, modeled on the `shop.pointcast.xyz` and `catan.pointcast.xyz` blocks: map `/` and `/commons/` to `/currency-builder/commons/`, pass through `/currency-builder/`, `/_astro/` and `/images/`, and 301 everything else to the apex. DNS and custom-domain changes need Mike's approval.
2. **Lift into Codex's site.** Copy the data JSON, the renderer and `renderSeed` (plus the provenance and official image data files it imports). The renderer has no PointCast dependencies beyond those.

Wording guardrails used throughout, consistent with existing Nouns Money copy: "design concept", "not legal tender", "no cash value", credit "earned by contributing, spent on the shared thing, never bought, never cashed out". Avoid "backed", "redeemable", "invest" and "shares" in any copy built on this.

## Generated media (Krea, ChatGPT image model, 2026-10-11)

The cloud container's network policy blocks `app-uploads.krea.ai`, so none of these are committed. They have not been reviewed, so check them before use. Download them from the links:

- Swiss-style floral note (gpt-image-2): https://app-uploads.krea.ai/72a5cc98-0c79-4e14-bdbd-fe768d87a59d/22b747ae-7b4f-4742-8c76-3b1622874240-image.png
- Secession-style floral note: https://app-uploads.krea.ai/72a5cc98-0c79-4e14-bdbd-fe768d87a59d/13e98aba-4b5c-4289-82ca-17cd1546e48f-image.png
- Floral art-stamp sheet: https://app-uploads.krea.ai/72a5cc98-0c79-4e14-bdbd-fe768d87a59d/a87528e3-6975-4a84-a889-5de2463ba239-image.png
- Floral art medal: https://app-uploads.krea.ai/72a5cc98-0c79-4e14-bdbd-fe768d87a59d/30ff4d2c-c320-411c-a221-9695c222d59c-image.png
- Currency Builder poster: https://app-uploads.krea.ai/72a5cc98-0c79-4e14-bdbd-fe768d87a59d/c80ad81e-cceb-4a3e-9c63-0d40d7d4983f-image.png
- 1974 long-copy ad: https://app-uploads.krea.ai/72a5cc98-0c79-4e14-bdbd-fe768d87a59d/dce75c95-add1-4d1d-9ca3-2970de1d48d4-image.png
- Trailer 1, CURRENCY BUILDER (Kling 3.0, 15 s, audio): https://app-uploads.krea.ai/public/78f0be57-e238-4351-9742-d753eb2be92f-video.mp4
- Trailer 2, NOUNS MONEY teaser (Kling 3.0, 15 s, audio, opens on the Noun #0 Nordic note): https://app-uploads.krea.ai/public/3f3a7836-4fed-4863-b16e-5bb0f782fbaf-video.mp4

## Eight trailers waiting on Krea credit

Each 15-second Kling 3.0 trailer (std mode, audio) costs about 1,400 Krea units; the account had about 1,068 left. Seedance 2.5 needs a higher Krea plan. All eight use `kling/kling-3.0`, `aspect_ratio: 16:9`, `duration: 15`, `generate_audio: true`, `mode: std` and a five- or six-shot `multi_prompt`. No people, no brand names and one short title card per trailer.

1. **THE MEDAL**: a blank brass disc drops into a die, a hydraulic press strikes it, the pixel-glasses relief emerges, and the medal spins and flips on slate. VO: "Some things are made to be held."
2. **NOUNS MONEY WORLD EDITION**: an art stamp blows past an alpine meadow, a Viennese gold-mosaic hall, Nordic harbor rooftops, a tiled courtyard and an Andean textile market, then lands in a California beach town. VO: "One small stamp. A whole wide world."
3. **CURRENCY FLIGHT**: a black cube workstation boots up, then a coastal hangar, a rocket launch and a brass medal turning in orbit. VO: "From the aerospace towns... art takes flight."
4. **SHARE MORE**: voxel Nouns-style characters on a palm-lined main street trade a surfboard, ladder, bike and guitar for art notes, and notes flutter onto a plaza. VO: "What if the best things in town were shared?"
5. **THE MESH**: notes taped in night windows link up with light threads; voxel characters pass lanterns along them; a drone pulls back over the glowing town. VO: "Every note connects."
6. **THE APOTHECARY EDITION**: walnut cabinets, amber jars, botanical brown and sage notes tied with twine, a brass scale, a drawer of notes on linen. VO: "Printed with patience." No medical claims.
7. **NOUNS MONEY TV**: a 1983-style beige computer boots up with a rainbow stripe; pixel notes cycle on the CRT; a floppy goes in; a cozy den. VO: "Tonight, on your screen."
8. **THE BANKS**: a copper-roofed kiosk, a cantilevered drive-in, a white spiral gallery ramp and a bougainvillea courtyard workshop at golden hour. VO: "Every great idea needs a place to live."

## Manus follow-up

- Open `/currency-builder/commons/` and three detail pages on iPhone Safari and desktop Chrome after deploy. Capture screenshots and confirm the 80 SVG links download.
- Print one front/back pair at 100% on Letter. Confirm the 150 mm width with a ruler and check that the pixel art stays crisp.
- Write results to `docs/manus-logs/2026-10-1X-currency-builder-commons.md`. No Mike approval is needed for QA. Domain and DNS work needs his approval.
