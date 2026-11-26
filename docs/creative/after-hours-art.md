# After Hours art — OFF-62

Sid, an AI agent for Mike. 14 November 2026 PT. Draft assets only.

Brief: [Saturday Night Build](https://pointcast.xyz/loom?to=%23daos#m_42575x0g0b),
including Loom desk’s jobs reply. Tess owns the page built on draft #1725; Shwa
provided the track list; Ada owns the sourced contribution line for each seat.
This branch changes assets only, not `/after-hours/` or those words.

The sleeve is a warm 1980s cassette label with mid-century geometric forms:
cream stock, rust title, gold case, forest-green ink and a sage arc. Big type,
two reels and generous margins. No brand marks or image generation. The flag
is a warm edition of the existing six-path open-map interview motif, credited
in the manifest; the dotted open route is a visual motif, not a new seat award.
Both carry the exact line **take nothing, leave maps**.

## Stable handoff paths

All files are under `public/images/after-hours-art/` (URL prefix
`/images/after-hours-art/`). Every image has an SVG and PNG fallback.

| Asset | File stem | Native size |
| --- | --- | --- |
| Cassette sleeve | `cassette-sleeve` | 1600 × 1600 |
| Flag | `flag` | 1600 × 1000 |
| Individual whole Nouns | `portraits/mike`, `loom-desk`, `ada`, `sid`, `tess`, `lou` | 320 × 320 |
| Crew contact sheet | `crew-sheet` | 1200 × 840 |

`manifest.json` has exact recipes, numeric official-trait indices, source and
output SHA-256s, dimensions, alt text and source links. Use its `seats[].alt`
with `<img>`; use `width="320" height="320"` and `height:auto`. Never use
`object-fit:cover` or crop the canvas. Keep names, human/AI labels and Ada’s
words in live HTML, rather than shrinking the six-across image into phone text.
The crew sheet is a contact sheet, not a replacement for responsive tribute
cards. `proof.html` is a no-script, noindex asset-review sheet, not a second
After Hours page or a deployed preview.

## Whole-Noun provenance

Six unchanged seat recipes from `src/data/ufogp-seats.json`: Mike (human), Loom
desk, Ada, Sid, Tess and Lou (AI agents). The renderer decodes the bundled
**official Nouns assets package image data**, CC0, through the existing
`src/lib/nouns-parts.mjs`. No generated faces, palette edits, clipping, isolated
heads or substituted traits. Each new native SVG is byte-identical to the
existing `/images/ufogp/SLUG.svg`; PNG pixels also match. These combinations
are not claims to numbered on-chain Nouns or proof of identity/ownership.

## Rebuild and checks

```
node scripts/build-after-hours-art.mjs
python scripts/check-after-hours-art.py
```

Uses the existing dev dependency `@resvg/resvg-js` and DejaVu Sans for PNGs;
no dependency manifests or runtime dependencies change. The optional
`UFOGP_RESVG_MODULE` points at an isolated installed renderer. With committed
PNGs present, `AFTER_HOURS_SVG_ONLY=1` rebuilds SVG/HTML/manifest using only Node
and the official source files. PNG typography can vary with font/renderer
versions; committed PNG hashes identify the reviewed version.

The read-only Python check (Pillow 13) parses every SVG as XML, checks all nine
SVG/PNG hashes and dimensions, rejects external images/scripts/filters/clips,
compares six native SVGs and PNGs with the charter assets, and compares all six
320 × 320 crew-sheet crops pixel for pixel. Generator also cross-checks each
named recipe against its numeric official seed. Art inspection covers sleeve,
flag and crew sheet. Local Chromium proof-sheet checks cover phone/desktop
layout, all nine SVGs loading, no horizontal overflow, no script execution or
page errors, and GET-only requests. This does not test Tess’s finished page,
physical devices, publisher print output, or production. No full-site build in
this small cloud sandbox, per OPERATIONS. No merge/deploy/mint/spend/social post.
