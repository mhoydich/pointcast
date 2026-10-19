# Codex image brief: Security Edition photography (2026-10-11)

Mike asked for raster images through the ChatGPT image generator, not Krea. The cloud Claude Code session that built the Security Edition can't reach OpenAI: its network policy denies `chatgpt.com`, `auth.openai.com` and `api.openai.com`, and the `codex` CLI isn't installed there. Run these from a local Claude Code session on Mike's machine. There, Codex 0.153.3 is signed in with the ChatGPT Pro plan and `image_generation` is enabled.

The notes themselves stay vector. The 280 SVG faces at `/currency-builder/security/{commons|barter}/{front|back}/{slug}.svg` are the print files: their Noun pixels come from on-chain seeds and their type is outlined. These images are photographic mockups of those notes. They don't replace the notes.

## 1. Make reference PNGs from the real faces

From the repo root (needs `npm install`):

```sh
mkdir -p ~/codex-images/refs && node --input-type=module -e "
import sharp from 'sharp';
import { securityEntries, securitySVG } from './src/lib/currency-builder/security-edition.mjs';
for (const slug of ['porch-note', 'jonbeel-fair', 'microgrid', 'slice']) {
  const hit = securityEntries().find((e) => e.entry.slug === slug);
  for (const face of ['front', 'back']) {
    const svg = securitySVG(hit.collection, hit.entry, face).replace('width=\"150mm\" height=\"75mm\"', 'width=\"2400\" height=\"1200\"');
    await sharp(Buffer.from(svg)).png().toFile(process.env.HOME + '/codex-images/refs/' + slug + '-' + face + '.png');
  }
}"
```

## 2. Generate

Every prompt keeps the note artwork from the reference image unchanged, shows full Nouns (never cropped), includes no people or third-party brands, and keeps "ART NOTE · NOT LEGAL TENDER" legible where the note shows it. Each command saves to an explicit path. Check that the file exists before reporting success.

```sh
mkdir -p public/images/currency-builder/v2/photos

codex exec -i ~/codex-images/refs/porch-note-front.png '$imagegen Macro product photograph of the attached collectible art banknote lying on natural linen, raking morning light that reveals the fine engraved lines and guilloche, a brass loupe resting near the portrait, shallow depth of field. Keep the note artwork exactly as in the reference, including the full pixel-art character. No people, no logos. Landscape 3:2. Save to public/images/currency-builder/v2/photos/porch-note-macro.png'

codex exec -i ~/codex-images/refs/jonbeel-fair-front.png '$imagegen Photograph of the attached art banknote held up against a bright window by an unseen hand out of frame (no hand visible), backlit so the watermark window glows and the paper fibers show. Keep the artwork exactly as in the reference. Warm, quiet, documentary. No people, no logos. Landscape 3:2. Save to public/images/currency-builder/v2/photos/jonbeel-fair-backlit.png'

codex exec -i ~/codex-images/refs/microgrid-front.png -i ~/codex-images/refs/porch-note-front.png -i ~/codex-images/refs/slice-front.png '$imagegen Overhead photograph of an uncut press sheet printed with the three attached art banknotes in a repeating grid, crop marks and color bars in the margins, on a print-shop table with a steel ruler and a linen tester. Keep each note artwork exactly as in its reference. No people, no logos. Landscape 3:2. Save to public/images/currency-builder/v2/photos/press-sheet.png'

codex exec -i ~/codex-images/refs/porch-note-front.png -i ~/codex-images/refs/jonbeel-fair-back.png '$imagegen A collector album page with archival sleeves holding the two attached art banknotes, one front and one back, small typed collector labels reading "SECURITY EDITION · ART NOTE", soft gallery light. Keep the artwork exactly as in the references. No people, no logos. Portrait 4:5. Save to public/images/currency-builder/v2/photos/album-page.png'

codex exec -i ~/codex-images/refs/microgrid-front.png '$imagegen Extreme close-up of the holographic stripe and color-shift numeral on the attached art banknote, tilted so the rainbow foil catches the light, shallow depth of field. Keep the artwork exactly as in the reference. No people, no logos. Landscape 3:2. Save to public/images/currency-builder/v2/photos/foil-closeup.png'
```

## 3. Hand back

- Inspect each PNG at full size: the Noun must match the reference pixel for pixel, with nothing cropped, and the note must not read as a real currency.
- Commit the keepers on a branch, add them to `/currency-builder/security/` if wanted, and note any rejects in this file.
- No Mike approval is needed to generate. Publishing the images on the site goes through a normal PR.
