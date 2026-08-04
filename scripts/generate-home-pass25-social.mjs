import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pinPath = (number) => path.join(
  root,
  'public',
  'beach-commons',
  'v18',
  'passport',
  'pins',
  `pass-25-${number}.png`,
);
const dataUrl = async (number) => `data:image/png;base64,${(await readFile(pinPath(number))).toString('base64')}`;

const [pinOne, pinTwo, pinThree] = await Promise.all([
  dataUrl('01'),
  dataUrl('18'),
  dataUrl('34'),
]);

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#19323e" stroke-opacity=".14" stroke-width="1"/>
    </pattern>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="10" dy="12" stdDeviation="0" flood-color="#132d39" flood-opacity=".22"/>
    </filter>
  </defs>
  <rect width="1200" height="630" fill="#d8e8e4"/>
  <path d="M780 0H1200V630H660Z" fill="#f2ad3d"/>
  <rect width="1200" height="630" fill="url(#grid)"/>
  <rect x="36" y="34" width="1128" height="562" fill="none" stroke="#19323e" stroke-width="3"/>
  <g fill="#19323e" font-family="Arial, Helvetica, sans-serif">
    <text x="73" y="83" font-size="15" font-weight="800" letter-spacing="4">POINTCAST · MONDAY FIELD PAPER · BLOCK 0558</text>
    <text x="68" y="242" font-size="108" font-weight="900" letter-spacing="-7">SAME PARK.</text>
    <text x="67" y="344" font-family="Georgia, serif" font-size="105" font-style="italic" font-weight="700" letter-spacing="-5">Many worlds.</text>
    <text x="72" y="417" font-size="21" font-weight="700">25 public doors · 6 ways of looking · 24 stamps</text>
    <text x="72" y="459" font-size="18">Choose the door. Change the view. Keep the place shared.</text>
    <text x="72" y="550" font-size="13" font-weight="800" letter-spacing="3">PASS/25 · EL SEGUNDO · AUGUST 3, 2026</text>
  </g>
  <g filter="url(#shadow)">
    <image href="${pinOne}" x="792" y="95" width="250" height="375" transform="rotate(-11 917 282)"/>
    <image href="${pinTwo}" x="906" y="105" width="250" height="375" transform="rotate(4 1031 292)"/>
    <image href="${pinThree}" x="1010" y="128" width="250" height="375" transform="rotate(15 1135 315)"/>
  </g>
  <g transform="translate(785 432) rotate(-7)">
    <circle cx="67" cy="67" r="64" fill="#e85d3f" stroke="#19323e" stroke-width="4"/>
    <circle cx="67" cy="67" r="53" fill="none" stroke="#fffef4" stroke-width="2" stroke-dasharray="5 5"/>
    <text x="67" y="63" fill="#fffef4" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="900" text-anchor="middle">PASS/25</text>
    <text x="67" y="83" fill="#fffef4" font-family="Arial, Helvetica, sans-serif" font-size="8" font-weight="800" letter-spacing="1.3" text-anchor="middle">NO LOCATION TRAIL</text>
  </g>
</svg>`;

const outputDir = path.join(root, 'public', 'images', 'home');
await mkdir(outputDir, { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(outputDir, 'pass25-field-paper.png'));
console.log('Generated public/images/home/pass25-field-paper.png');
