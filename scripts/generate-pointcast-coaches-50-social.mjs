import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = path.resolve('public/images/pointcast-coaches-50/poster-01.webp');
const outDir = path.resolve('public/images/pointcast-coaches-50');
const output = path.join(outDir, 'social-card.png');

const overlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="745" height="630" fill="#171815"/>
  <rect width="745" height="18" fill="#dcff3f"/>
  <rect x="0" width="20" height="630" fill="#ff5d2d"/>
  <text x="56" y="70" fill="#dcff3f" font-family="Menlo, monospace" font-size="14" font-weight="700" letter-spacing="2">POINTCAST COLLEGE FOOTBALL · COACHES DESK 001</text>
  <line x1="56" y1="96" x2="700" y2="96" stroke="#efeee5" stroke-width="2"/>
  <text x="50" y="225" fill="#efeee5" font-family="Arial Black, Helvetica, sans-serif" font-size="104" font-weight="900" letter-spacing="-7">THE</text>
  <text x="47" y="330" fill="#dcff3f" font-family="Georgia, serif" font-size="107" font-style="italic" letter-spacing="-5">COACHES'</text>
  <text x="49" y="431" fill="#efeee5" font-family="Arial Black, Helvetica, sans-serif" font-size="105" font-weight="900" letter-spacing="-7">ROOM</text>
  <text x="58" y="490" fill="#efeee5" font-family="Helvetica, Arial, sans-serif" font-size="21" font-weight="700">THE POINTCAST 50 FOR 2026</text>
  <text x="58" y="526" fill="#aeb0a6" font-family="Menlo, monospace" font-size="12" font-weight="700">PROGRAM · CAPITAL · PLAYERS · REGION · FANS · FACILITIES · AURA</text>
  <rect x="56" y="558" width="634" height="42" fill="#ff5d2d"/>
  <text x="74" y="585" fill="#171815" font-family="Menlo, monospace" font-size="13" font-weight="700">50 COACHES · 7 ROOMS · 1 TIMESTAMPED ARGUMENT</text>
  <rect x="729" width="16" height="630" fill="#efeee5"/>
  <g transform="translate(993 97) rotate(4)">
    <rect x="-104" y="-40" width="208" height="205" fill="#dcff3f" stroke="#171815" stroke-width="5"/>
    <text x="0" y="1" text-anchor="middle" fill="#171815" font-family="Menlo, monospace" font-size="13" font-weight="700">THE ROOM INDEX</text>
    <text x="0" y="112" text-anchor="middle" fill="#ff5d2d" font-family="Arial Black, Helvetica, sans-serif" font-size="104" font-weight="900">50</text>
    <text x="0" y="142" text-anchor="middle" fill="#171815" font-family="Menlo, monospace" font-size="12" font-weight="700">CURRENT FBS COACHES</text>
  </g>
</svg>`;

await mkdir(outDir, { recursive: true });

const photo = await sharp(source)
  .resize(455, 630, { fit: 'cover', position: 'center' })
  .modulate({ saturation: 0.72, brightness: 0.77 })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: '#171815',
  },
})
  .composite([
    { input: photo, left: 745, top: 0 },
    { input: Buffer.from(overlay), left: 0, top: 0 },
  ])
  .png()
  .toFile(output);

process.stdout.write(`${output}\n`);
