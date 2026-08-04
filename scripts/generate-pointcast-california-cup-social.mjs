import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageDirectory = path.join(root, 'public/images/pointcast-california-football');
const heroPath = path.join(imageDirectory, 'california-signal-field.webp');
const outputPath = path.join(imageDirectory, 'california-cup-social.png');

const overlay = Buffer.from(`
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="veil" x1="0" x2="1">
        <stop offset="0" stop-color="#07131d" stop-opacity="0.98"/>
        <stop offset="0.58" stop-color="#07131d" stop-opacity="0.78"/>
        <stop offset="1" stop-color="#07131d" stop-opacity="0.18"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#veil)"/>
    <path d="M716 80 C 810 120, 800 205, 910 224 S 1040 340, 1115 402" fill="none" stroke="#d8fa48" stroke-width="3" opacity="0.75"/>
    <circle cx="716" cy="80" r="8" fill="#d8fa48"/><circle cx="910" cy="224" r="8" fill="#f1a63b"/><circle cx="1115" cy="402" r="8" fill="#f05a32"/>
    <text x="58" y="58" fill="#d8fa48" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" letter-spacing="2">POINTCAST · STATE DESK 002 · 2026</text>
    <text x="54" y="185" fill="#eee6d2" font-family="Arial, Helvetica, sans-serif" font-size="112" font-weight="900" letter-spacing="-7">THE</text>
    <text x="54" y="284" fill="#f1a63b" font-family="Arial, Helvetica, sans-serif" font-size="112" font-weight="900" letter-spacing="-7">CALIFORNIA</text>
    <text x="54" y="383" fill="#eee6d2" font-family="Arial, Helvetica, sans-serif" font-size="112" font-weight="900" letter-spacing="-7">CUP</text>
    <rect x="58" y="432" width="548" height="4" fill="#f05a32"/>
    <text x="58" y="485" fill="#eee6d2" font-family="Georgia, serif" font-size="33" font-style="italic">Seven games. Two trophies. One state table.</text>
    <text x="58" y="548" fill="#d8fa48" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700">BUILD A PRIVATE CIRCUIT CARD · NO ACCOUNT</text>
    <rect x="58" y="574" width="455" height="28" fill="#d8fa48"/>
    <text x="72" y="594" fill="#151915" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="900" letter-spacing="0.7">POINTCAST.XYZ/25/MAGAZINE/CALIFORNIA-CUP</text>
  </svg>
`);

await sharp(heroPath)
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .composite([{ input: overlay, left: 0, top: 0 }])
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

console.log(`Wrote ${path.relative(root, outputPath)}`);
