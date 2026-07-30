import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = path.resolve(
  'public/images/pointcast-coaches-50/poster-05.webp',
);
const outDir = path.resolve('public/images/pointcast-coach-weather');
const output = path.join(outDir, 'social-card.png');

const overlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="radar" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#151712" stop-opacity=".12"/>
      <stop offset="100%" stop-color="#151712" stop-opacity=".94"/>
    </radialGradient>
  </defs>
  <rect width="742" height="630" fill="#151712"/>
  <rect width="22" height="630" fill="#7ca8ff"/>
  <rect x="22" width="720" height="18" fill="#b9ff45"/>
  <text x="58" y="67" fill="#b9ff45" font-family="Menlo, monospace" font-size="14" font-weight="700" letter-spacing="2">POINTCAST COLLEGE FOOTBALL · PRESEASON 000</text>
  <line x1="58" y1="91" x2="698" y2="91" stroke="#f2f1e8" stroke-width="2"/>
  <text x="49" y="231" fill="#f2f1e8" font-family="Arial Black, Helvetica, sans-serif" font-size="112" font-weight="900" letter-spacing="-8">COACH</text>
  <text x="47" y="343" fill="#b9ff45" font-family="Georgia, serif" font-size="113" font-style="italic" font-weight="700" letter-spacing="-7">WEATHER</text>
  <text x="58" y="407" fill="#f2f1e8" font-family="Helvetica, Arial, sans-serif" font-size="23" font-weight="700">PRESSURE MOVES BEFORE RANKINGS DO.</text>
  <rect x="58" y="448" width="626" height="48" fill="#ff6843"/>
  <text x="76" y="478" fill="#151712" font-family="Menlo, monospace" font-size="14" font-weight="700">5 HEATING · 5 CLEARING · 2 STORM CELLS</text>
  <text x="58" y="535" fill="#aeb1a7" font-family="Menlo, monospace" font-size="12" font-weight="700">BUILD YOUR PROGRAM · 100 POINTS · 50 COACH PROFILES</text>
  <text x="58" y="577" fill="#f2f1e8" font-family="Menlo, monospace" font-size="13" font-weight="700">MOVEMENT ±00 · THE HONEST BASELINE</text>
  <rect x="726" width="16" height="630" fill="#f2f1e8"/>
  <g transform="translate(970 314)">
    <circle r="242" fill="url(#radar)" stroke="#b9ff45" stroke-width="3"/>
    <circle r="175" fill="none" stroke="#b9ff45" stroke-opacity=".5" stroke-width="2"/>
    <circle r="108" fill="none" stroke="#b9ff45" stroke-opacity=".55" stroke-width="2"/>
    <circle r="40" fill="none" stroke="#b9ff45" stroke-width="2"/>
    <path d="M0-240V240M-240 0H240M-170-170L170 170M170-170L-170 170" stroke="#b9ff45" stroke-opacity=".25" stroke-width="2"/>
    <path d="M0 0L129-173A216 216 0 0 1 211-43Z" fill="#b9ff45" fill-opacity=".2"/>
    <circle cx="126" cy="-176" r="12" fill="#ff6843"/>
    <circle cx="211" cy="-42" r="8" fill="#ff6843"/>
    <circle cx="-150" cy="106" r="10" fill="#7ca8ff"/>
    <circle cx="-52" cy="-111" r="7" fill="#b9ff45"/>
    <circle cx="63" cy="92" r="8" fill="#b9ff45"/>
    <text x="0" y="5" text-anchor="middle" fill="#f2f1e8" font-family="Menlo, monospace" font-size="13" font-weight="700">12 ROOMS</text>
    <text x="0" y="25" text-anchor="middle" fill="#b9ff45" font-family="Menlo, monospace" font-size="11">ON THE MAP</text>
  </g>
</svg>`;

await mkdir(outDir, { recursive: true });

const photo = await sharp(source)
  .resize(458, 630, { fit: 'cover', position: 'center' })
  .modulate({ saturation: 0.35, brightness: 0.56 })
  .tint('#5d6651')
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: '#151712',
  },
})
  .composite([
    { input: photo, left: 742, top: 0 },
    { input: Buffer.from(overlay), left: 0, top: 0 },
  ])
  .png()
  .toFile(output);

process.stdout.write(`${output}\n`);
