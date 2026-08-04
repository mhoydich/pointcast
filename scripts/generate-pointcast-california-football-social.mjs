import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageDirectory = path.join(
  root,
  'public/images/pointcast-california-football',
);
const heroPath = path.join(imageDirectory, 'california-signal-field.webp');
const outputPath = path.join(imageDirectory, 'social-card.png');

const overlay = Buffer.from(`
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="veil" x1="0" x2="1">
        <stop offset="0" stop-color="#07131d" stop-opacity="0.98"/>
        <stop offset="0.46" stop-color="#07131d" stop-opacity="0.9"/>
        <stop offset="0.72" stop-color="#07131d" stop-opacity="0.24"/>
        <stop offset="1" stop-color="#07131d" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#veil)"/>
    <text x="58" y="58" fill="#d8fa48" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" letter-spacing="2">POINTCAST · STATE DESK 001 · 2026</text>
    <text x="55" y="183" fill="#f1ead9" font-family="Arial, Helvetica, sans-serif" font-size="83" font-weight="900" letter-spacing="-5">CALIFORNIA</text>
    <text x="55" y="258" fill="#f1ead9" font-family="Arial, Helvetica, sans-serif" font-size="83" font-weight="900" letter-spacing="-5">FOOTBALL</text>
    <text x="55" y="333" fill="#f3a33b" font-family="Arial, Helvetica, sans-serif" font-size="83" font-weight="900" letter-spacing="-5">IS NOT DEAD.</text>
    <text x="58" y="395" fill="#d8e0dc" font-family="Georgia, serif" font-size="38" font-style="italic">It is disconnected.</text>
    <line x1="58" y1="452" x2="568" y2="452" stroke="#ef5a31" stroke-width="5"/>
    <text x="58" y="500" fill="#f1ead9" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700">EIGHT FBS PROGRAMS · FIVE CONFERENCES</text>
    <text x="58" y="535" fill="#d8fa48" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700">ONE MISSING SATURDAY</text>
    <rect x="58" y="574" width="222" height="28" fill="#d8fa48"/>
    <text x="72" y="594" fill="#151915" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="900" letter-spacing="1">POINTCAST.XYZ/25</text>
  </svg>
`);

await sharp(heroPath)
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .composite([{ input: overlay, left: 0, top: 0 }])
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

console.log(`Wrote ${path.relative(root, outputPath)}`);
