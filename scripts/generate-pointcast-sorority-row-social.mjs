import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = path.resolve('public/images/pointcast-sorority-row/southern-row.webp');
const outDir = path.resolve('public/images/pointcast-sorority-row');
const output = path.join(outDir, 'social-card.png');

const overlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="690" height="630" fill="#e6ddc8"/>
  <rect width="24" height="630" fill="#ed4a36"/>
  <rect x="24" width="666" height="18" fill="#b9d630"/>
  <text x="62" y="70" fill="#17242d" font-family="Menlo, monospace" font-size="14" font-weight="700" letter-spacing="2">POINTCAST COLLEGE FOOTBALL · HOUSE DESK 002</text>
  <line x1="62" y1="94" x2="646" y2="94" stroke="#17242d" stroke-width="3"/>
  <text x="54" y="245" fill="#17242d" font-family="Arial Black, Helvetica, sans-serif" font-size="144" font-weight="900" letter-spacing="-10">ROW</text>
  <text x="342" y="245" fill="#ed4a36" font-family="Arial Black, Helvetica, sans-serif" font-size="144" font-weight="900" letter-spacing="-10">/</text>
  <text x="390" y="245" fill="#17242d" font-family="Arial Black, Helvetica, sans-serif" font-size="144" font-weight="900" letter-spacing="-10">ROW</text>
  <text x="62" y="315" fill="#17242d" font-family="Georgia, serif" font-size="27" font-style="italic">Sorority Row, college football,</text>
  <text x="62" y="352" fill="#17242d" font-family="Georgia, serif" font-size="27" font-style="italic">and the social architecture of 2030.</text>
  <rect x="62" y="410" width="560" height="72" fill="#17242d"/>
  <text x="82" y="440" fill="#b9d630" font-family="Menlo, monospace" font-size="13" font-weight="700" letter-spacing="1">SEC / BIG TEN · NATIONAL / LOCAL</text>
  <text x="82" y="466" fill="#e6ddc8" font-family="Menlo, monospace" font-size="13" font-weight="700">EIGHT MIDJOURNEY ARCHITECTURE PLATES</text>
  <text x="62" y="578" fill="#17242d" font-family="Menlo, monospace" font-size="12" font-weight="700" letter-spacing="1">POINTCAST.XYZ/25/MAGAZINE/SORORITY-ROW</text>
  <rect x="675" width="15" height="630" fill="#17242d"/>
  <g transform="translate(1030 92) rotate(5)">
    <rect x="-92" y="-34" width="184" height="174" fill="#b9d630" stroke="#17242d" stroke-width="5"/>
    <text x="0" y="4" text-anchor="middle" fill="#17242d" font-family="Menlo, monospace" font-size="12" font-weight="700">THE ROW SHOWDOWN</text>
    <text x="0" y="81" text-anchor="middle" fill="#ed4a36" font-family="Arial Black, Helvetica, sans-serif" font-size="58" font-weight="900">2030</text>
    <text x="0" y="111" text-anchor="middle" fill="#17242d" font-family="Menlo, monospace" font-size="12" font-weight="700">KEEP / CHANGE / BUILD</text>
  </g>
</svg>`;

await mkdir(outDir, { recursive: true });

const photo = await sharp(source)
  .resize(510, 630, { fit: 'cover', position: 'center' })
  .modulate({ saturation: 0.8, brightness: 0.84 })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: '#17242d',
  },
})
  .composite([
    { input: photo, left: 690, top: 0 },
    { input: Buffer.from(overlay), left: 0, top: 0 },
  ])
  .png()
  .toFile(output);

process.stdout.write(`${output}\n`);
