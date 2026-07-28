import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = path.resolve('public/images/pointcast-college-house/arrival.webp');
const outDir = path.resolve('public/images/pointcast-college-house');
const output = path.join(outDir, 'social-card.png');

const overlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="710" height="630" fill="#ede2cb"/>
  <rect width="22" height="630" fill="#8d2d26"/>
  <rect x="22" width="688" height="18" fill="#d49c3d"/>
  <text x="58" y="70" fill="#181310" font-family="Menlo, monospace" font-size="14" font-weight="700" letter-spacing="2">POINTCAST COLLEGE FOOTBALL · HOUSE DESK 001</text>
  <line x1="58" y1="94" x2="666" y2="94" stroke="#181310" stroke-width="3"/>
  <text x="50" y="224" fill="#181310" font-family="Arial Black, Helvetica, sans-serif" font-size="94" font-weight="900" letter-spacing="-6">THE HOUSE</text>
  <text x="49" y="314" fill="#8d2d26" font-family="Arial Black, Helvetica, sans-serif" font-size="74" font-weight="900" letter-spacing="-4">WE BORROWED.</text>
  <text x="58" y="387" fill="#181310" font-family="Georgia, serif" font-size="26" font-style="italic">An ode to college through the rooms</text>
  <text x="58" y="422" fill="#181310" font-family="Georgia, serif" font-size="26" font-style="italic">where friendship became a daily practice.</text>
  <rect x="58" y="474" width="568" height="64" fill="#181310"/>
  <text x="78" y="503" fill="#d49c3d" font-family="Menlo, monospace" font-size="13" font-weight="700" letter-spacing="1.2">FRATERNITY · BELONGING · MAINTENANCE · REPAIR</text>
  <text x="78" y="525" fill="#ede2cb" font-family="Menlo, monospace" font-size="12" font-weight="700">SIX MIDJOURNEY EDITORIAL PLATES</text>
  <text x="58" y="590" fill="#181310" font-family="Menlo, monospace" font-size="12" font-weight="700" letter-spacing="1">POINTCAST.XYZ/25/MAGAZINE/THE-HOUSE-WE-BORROWED</text>
  <rect x="695" width="15" height="630" fill="#181310"/>
  <g transform="translate(994 74) rotate(4)">
    <rect x="-92" y="-20" width="185" height="190" fill="#d49c3d" stroke="#181310" stroke-width="5"/>
    <text x="0" y="22" text-anchor="middle" fill="#181310" font-family="Menlo, monospace" font-size="13" font-weight="700">KEY / FOUR YEARS</text>
    <text x="0" y="116" text-anchor="middle" fill="#8d2d26" font-family="Arial Black, Helvetica, sans-serif" font-size="92" font-weight="900">4</text>
    <text x="0" y="145" text-anchor="middle" fill="#181310" font-family="Menlo, monospace" font-size="12" font-weight="700">ON LOAN</text>
  </g>
</svg>`;

await mkdir(outDir, { recursive: true });

const photo = await sharp(source)
  .resize(490, 630, { fit: 'cover', position: 'center' })
  .modulate({ saturation: 0.78, brightness: 0.82 })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: '#181310',
  },
})
  .composite([
    { input: photo, left: 710, top: 0 },
    { input: Buffer.from(overlay), left: 0, top: 0 },
  ])
  .png()
  .toFile(output);

process.stdout.write(`${output}\n`);
