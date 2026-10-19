# Nouns framework verification

Verified 19 October 2026 at 22:09 UTC against the public `nounsDAO/nouns-monorepo` repository.

The current `master` commit was `2213eea1c15f331f786784c2621d53bdecf907e2`, dated 5 October 2026. It matches the small pinned asset snapshot already used by the Nouns Money engine. The artwork, renderer, trait utility, seed type and art-license documentation all match their recorded SHA-256 hashes. **No snapshot discrepancy was found.** This is a source-repository verification; it is not an independent audit of the currently deployed on-chain descriptor inventory.

## The framework used here

| Property | Verified specification |
| --- | --- |
| Native character canvas | 32 × 32 pixel cells |
| Canonical SVG canvas | 320 × 320; each native cell spans 10 SVG units |
| Seed fields | `background`, `body`, `accessory`, `head`, `glasses` |
| Seed values | Zero-based integer indices in the pinned trait arrays |
| Character layer order | Body → accessory → head → glasses |
| Background | Separate solid backdrop; removed in transparent editions |
| Trait inventory | 2 backgrounds; 30 bodies; 143 accessories; 254 heads; 23 glasses |
| Palette | 239 entries; encoded colour index zero is transparent |
| Encoding | Five-byte RLE header: palette index, top, right, bottom, left; then run-length/colour-index pairs |
| Run handling | Runs crossing the right bound continue at the left bound of the next row |
| Empty accessory | The canonical `accessory-none` has the all-zero five-byte empty header |
| This edition's PNGs | 640 × 640, exactly 20 output pixels per native cell; no smoothing |

The collection uses 100 different existing canonical heads. Bodies, accessories, glasses and background indices are selected reproducibly with SHA-256 from the fixed series, cohort and ordinal. The head index is curated in `cohorts.json`. The original rectangles, layer order and palette remain intact. These are **100 new local character combinations**, not 100 newly drawn trait assets. They are not represented as official minted Noun IDs, owned tokens, rare traits, official Nouns endorsements or globally unseen combinations.

The official chain-seed helper uses the token ID and a block hash with a different pseudorandom selection procedure. This collection's local SHA-256 selection is deliberately identified as a local art-production method. It does not emulate a mint or assert chain provenance.

## What was checked

- All 100 five-field seeds are in bounds and use integer indices.
- All 100 transparent SVGs are **byte-for-byte identical** to the official `buildSVG` output for their chosen parts and palette.
- A separately written linear-buffer RLE decoder produces the same final 32 × 32 RGBA pixels as every SVG and both PNG editions.
- All 100 final transparent pixel grids have distinct SHA-256 hashes. Changing a hidden background cannot satisfy this check.
- Every SVG rectangle sits on the native grid and uses a canonical palette colour. All 100 SVGs parse successfully.
- Every transparent and opaque PNG is 640 × 640 RGBA and exactly equals the nearest-neighbour 20× expansion of the independent 32 × 32 decode.
- All ten cohorts contain exactly ten characters, with names, a one-line companion concept and a short fictional biography.
- The all-100 contact sheet and two larger cohort sheets were visually inspected for readable labels, clipping and variety. All 100 cohort-card labels also fit their available width in a measured typography check.

`validation.json` contains the individual geometry checks. `official-sdk-validation.json` contains the 100 official-renderer comparison results. `live-framework-check.json` records the live source URLs, commit, timestamps, byte sizes and hashes. No monorepo clone or dependency tree was created.

## Primary sources

- [Live repository commit endpoint](https://api.github.com/repos/nounsDAO/nouns-monorepo/commits/master)
- [Pinned original image data](https://github.com/nounsDAO/nouns-monorepo/blob/2213eea1c15f331f786784c2621d53bdecf907e2/packages/nouns-assets/src/image-data.json)
- [Official SVG renderer](https://github.com/nounsDAO/nouns-monorepo/blob/2213eea1c15f331f786784c2621d53bdecf907e2/packages/nouns-sdk/src/image/svg-builder.ts)
- [Official trait and seed utility](https://github.com/nounsDAO/nouns-monorepo/blob/2213eea1c15f331f786784c2621d53bdecf907e2/packages/nouns-assets/src/utils.ts)
- [Official seed type](https://github.com/nounsDAO/nouns-monorepo/blob/2213eea1c15f331f786784c2621d53bdecf907e2/packages/nouns-assets/src/types.ts)
- [Official artwork documentation and CC0 statement](https://github.com/nounsDAO/nouns-monorepo/blob/2213eea1c15f331f786784c2621d53bdecf907e2/packages/nouns-webapp/src/components/Documentation/index.tsx)
- [Repository GPL-3.0 license](https://github.com/nounsDAO/nouns-monorepo/blob/2213eea1c15f331f786784c2621d53bdecf907e2/LICENSE)

Artwork licensing and code licensing are distinct. Original Nouns artwork is public-domain/CC0 per the official documentation. The included renderer code and source retain GPL-3.0 attribution and the accompanying `LICENSE`.

The portrait identity remains the exact vector or pixel-grid artifact. A later generative image treatment is an interpretation unless the canonical portrait is composited intact and checked separately.
