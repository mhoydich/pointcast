import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageDirectory = path.join(
  root,
  'public/images/pointcast-western-heat-brains',
);

const overlay = Buffer.from(`
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="veil" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="#07101c" stop-opacity="0.08"/>
        <stop offset="0.58" stop-color="#07101c" stop-opacity="0.2"/>
        <stop offset="1" stop-color="#07101c" stop-opacity="0.92"/>
      </linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-opacity="0.45"/></filter>
    </defs>
    <rect width="1200" height="630" fill="url(#veil)"/>
    <rect x="35" y="34" width="1130" height="562" fill="none" stroke="#fffdf5" stroke-width="2"/>
    <text x="60" y="74" fill="#fffdf5" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="800" letter-spacing="2">POINTCAST MAGAZINE · SPECIAL DOUBLE ISSUE 002 · 2026</text>
    <g filter="url(#shadow)">
      <text x="56" y="420" fill="#fffdf5" font-family="Arial, Helvetica, sans-serif" font-size="93" font-weight="900" letter-spacing="-6">WESTERN HEAT</text>
      <text x="57" y="505" fill="#b7ff4a" font-family="Arial, Helvetica, sans-serif" font-size="93" font-weight="900" letter-spacing="-6">/ BRAINS 25</text>
    </g>
    <text x="61" y="553" fill="#fffdf5" font-family="Georgia, serif" font-size="27" font-style="italic">Three kinds of pressure. One Saturday scoreboard for brains.</text>
    <rect x="988" y="45" width="160" height="48" fill="#b7ff4a"/>
    <text x="1010" y="77" fill="#09101e" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="900" letter-spacing="1">POINTCAST.XYZ</text>
  </svg>
`);

await sharp(path.join(imageDirectory, 'double-field.webp'))
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .composite([{ input: overlay, left: 0, top: 0 }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(imageDirectory, 'social-card.png'));

console.log('Wrote public/images/pointcast-western-heat-brains/social-card.png');
