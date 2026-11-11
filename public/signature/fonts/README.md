# Signature fonts

Signature Studio draws from outline files in `/signature/paths/`, generated from the fonts in this folder. The page does not download a font in order to draw. The font files are here so you can install them, and so the license sits next to the bytes.

## The set

| Face | License | File |
| --- | --- | --- |
| PointCast Script | SIL Open Font License 1.1 | `pointcast-script/PointCastScript.ttf` |
| Dancing Script | OFL 1.1 | `dancing-script/DancingScript-wght.ttf` |
| Great Vibes | OFL 1.1 | `great-vibes/GreatVibes-Regular.ttf` |
| Allura | OFL 1.1 | `allura/Allura-Regular.ttf` |
| Sacramento | OFL 1.1 | `sacramento/Sacramento-Regular.ttf` |
| Mrs Saint Delafield | OFL 1.1 | `mrs-saint-delafield/MrsSaintDelafield-Regular.ttf` |
| Herr Von Muellerhoff | OFL 1.1 | `herr-von-muellerhoff/HerrVonMuellerhoff-Regular.ttf` |
| Homemade Apple | Apache License 2.0 | `homemade-apple/HomemadeApple-Regular.ttf` |

Dancing Script is a variable font. The extracted outlines are the regular master (weight 400). Homemade Apple is Apache 2.0, not OFL. Its `LICENSE.txt` is the grant. The others ship `OFL.txt` from the Google Fonts `ofl/` tree. Do not rename a face that reserved its name.

Sources: the OFL files are the copies in the [google/fonts](https://github.com/google/fonts) repository (`ofl/<family>/`). Homemade Apple is from `apache/homemadeapple/`.

## Add another open-licensed face

1. Confirm the license by reading the license file, not the specimen page. OFL and Apache-2.0 are the two this studio accepts.
2. Put the TTF and the license in `public/signature/fonts/<id>/`. Keep the reserved font name.
3. Add a row to `FACES` in `scripts/signature/extract-paths.mjs` and a row in `FONTS` in `src/data/signature-studio.ts`. The `id` must match.
4. Run `node scripts/signature/extract-paths.mjs`. It writes `public/signature/paths/<id>.json` for the character set a name needs (A–Z, a–z, digits, and `.,'-!?&`).
5. The select on `/signature` reads `FONTS`. A face with no path JSON will fail when chosen, and the test suite checks that every catalog row has a file.

## Add a glyph to PointCast Script

PointCast Script is original. The letterforms are centerlines in `scripts/signature/glyphs.mjs`, expanded into ribbons by `scripts/signature/pen.mjs`, then written as a TTF by `scripts/signature/build-font.mjs` (opentype.js).

1. Add a key to `GLYPHS`. Use the character itself (`é` is fine) or set `unicode`.
2. A stroke is a list of points the nib passes through, plus a width. `stroke([[x, y], ...], width)`. `closed: true` joins an oval. `dot(x, y, r)` is a filled circle. Coordinates are font units, y up, on a 1000-unit em. The build applies the slant.
3. Run `node scripts/signature/build-font.mjs`. It rewrites `PointCastScript.ttf` and `public/signature/paths/pointcast-script.json` together, so the file and the studio cannot drift.
4. Draw a specimen (any SVG renderer) of the new character beside its neighbors before you commit it. A signature face is judged by a name, not by a single letter.

The Reserved Font Name is “PointCast Script”. A modified version needs a different name. See `OFL.txt` in this folder.
