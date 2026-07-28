import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = path.resolve('public/images/pointcast-2029-field-kit/stadium-transit-porch.png');
const outDir = path.resolve('public/images/pointcast-2029-field-kit');
const output = path.join(outDir, 'social-card.png');

const text = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect x="0" y="0" width="690" height="630" fill="#ebe2ca"/>
  <rect x="0" y="0" width="690" height="18" fill="#c94a31"/>
  <circle cx="67" cy="81" r="25" fill="#c94a31"/>
  <rect x="103" y="56" width="23" height="50" fill="#244b8f"/>
  <text x="147" y="88" fill="#171715" font-family="Menlo, monospace" font-size="15" font-weight="700" letter-spacing="2">POINTCAST 25 · FIELD KIT · 2029</text>
  <text x="48" y="234" fill="#171715" font-family="Arial Black, Helvetica, sans-serif" font-size="81" font-weight="900" letter-spacing="-6">SATURDAY</text>
  <text x="47" y="323" fill="#c94a31" font-family="Arial Black, Helvetica, sans-serif" font-size="81" font-weight="900" letter-spacing="-6">COMMONS.</text>
  <line x1="51" y1="368" x2="635" y2="368" stroke="#171715" stroke-width="3"/>
  <text x="52" y="420" fill="#171715" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="800">STADIUM VIEWS · FAN RITUALS · THIRD SPACES</text>
  <text x="52" y="455" fill="#171715" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="800">LO-FI CARRY · 25 STAMPS · 8 BACKGROUNDS</text>
  <rect x="52" y="510" width="532" height="52" fill="#171715"/>
  <text x="73" y="544" fill="#ebe2ca" font-family="Menlo, monospace" font-size="15" font-weight="700" letter-spacing="1.5">POINTCAST.XYZ/25/2029/FIELD-KIT</text>
  <rect x="674" y="0" width="16" height="630" fill="#e2b437"/>
</svg>`;

await mkdir(outDir, { recursive: true });

const photo = await sharp(source)
  .resize(510, 630, { fit: 'cover', position: 'center' })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: '#171715',
  },
})
  .composite([
    { input: photo, left: 690, top: 0 },
    { input: Buffer.from(text), left: 0, top: 0 },
  ])
  .png()
  .toFile(output);

process.stdout.write(`${output}\n`);
