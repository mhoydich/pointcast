/**
 * One-off: custom OG cards for blocks 0464-0466 (2026-07-18 Fable sprint).
 *
 * Rasterizes each block's hand-authored SVG art to its unfurl slot at
 * /images/og/b/{id}.png (1200x630, cover). Run once, commit the PNGs,
 * deploy with build:bare — a full `npm run build` reruns the generic OG
 * generator and clobbers these (per block-authoring playbook).
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const CARDS = [
  ['public/images/blue/el-segundo-blue.svg', 'public/images/og/b/0464.png'],
  ['public/images/fable/every-door.svg', 'public/images/og/b/0465.png'],
  ['public/images/fable/first-pass.svg', 'public/images/og/b/0466.png'],
  ['public/images/fable/meadow.svg', 'public/images/og/b/0467.png'],
  ['public/images/fable/door-of-the-day.svg', 'public/images/og/b/0468.png'],
  ['public/images/fable/v1-wing.svg', 'public/images/og/b/0469.png'],
  ['public/images/fable/passport-desk.svg', 'public/images/og/b/0470.png'],
];

for (const [src, out] of CARDS) {
  const svg = await fs.readFile(path.join(ROOT, src));
  await fs.mkdir(path.dirname(path.join(ROOT, out)), { recursive: true });
  await sharp(svg, { density: 160 })
    .resize(1200, 630, { fit: 'cover' })
    .png()
    .toFile(path.join(ROOT, out));
  console.log(`✓ ${out}`);
}
