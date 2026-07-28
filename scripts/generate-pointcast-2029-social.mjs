import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = path.resolve('public/images/pointcast-2029/stadium-mountain-rain.png');
const outDir = path.resolve('public/images/pointcast-2029');
const output = path.join(outDir, 'social-card.png');

const text = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="none"/>
  <rect x="0" y="0" width="670" height="630" fill="#e7dec8"/>
  <rect x="0" y="0" width="670" height="16" fill="#df4b2f"/>
  <circle cx="72" cy="84" r="25" fill="#df4b2f"/>
  <text x="111" y="92" fill="#171816" font-family="Menlo, monospace" font-size="16" font-weight="700" letter-spacing="3">POINTCAST 25 · YEAR 2029</text>
  <text x="52" y="248" fill="#171816" font-family="Arial Black, Helvetica, sans-serif" font-size="88" font-weight="900" letter-spacing="-7">SATURDAY,</text>
  <text x="50" y="340" fill="#df4b2f" font-family="Arial Black, Helvetica, sans-serif" font-size="82" font-weight="900" letter-spacing="-7">REBRANDED.</text>
  <line x1="55" y1="394" x2="615" y2="394" stroke="#171816" stroke-width="3"/>
  <text x="55" y="445" fill="#171816" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="800">25 ORIGINAL MARKS · FUTURE STADIUMS</text>
  <text x="55" y="480" fill="#171816" font-family="Helvetica, Arial, sans-serif" font-size="26" font-weight="800">NEW CAMPUS · STUDENT-MADE GEAR</text>
  <rect x="55" y="526" width="420" height="50" fill="#171816"/>
  <text x="77" y="559" fill="#e7dec8" font-family="Menlo, monospace" font-size="16" font-weight="700" letter-spacing="2">POINTCAST.XYZ/25/2029</text>
  <rect x="651" y="0" width="19" height="630" fill="#244d95"/>
</svg>`;

await mkdir(outDir, { recursive: true });
const photo = await sharp(source)
  .resize(530, 630, { fit: 'cover', position: 'center' })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: '#171816',
  },
})
  .composite([
    { input: photo, left: 670, top: 0 },
    { input: Buffer.from(text), left: 0, top: 0 },
  ])
  .png()
  .toFile(output);

process.stdout.write(`${output}\n`);
