import path from 'node:path';
import sharp from 'sharp';

const source = path.resolve(
  'public/images/pointcast-fan-clique-rally/the-room-is-open.png',
);
const output = path.resolve(
  'public/images/pointcast-fan-clique-rally/social-card.png',
);

const overlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="veil" x1="0" x2="1">
      <stop offset="0%" stop-color="#111713" stop-opacity=".98"/>
      <stop offset="58%" stop-color="#111713" stop-opacity=".82"/>
      <stop offset="82%" stop-color="#111713" stop-opacity=".12"/>
      <stop offset="100%" stop-color="#111713" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="835" height="630" fill="url(#veil)"/>
  <rect x="0" y="0" width="17" height="630" fill="#d8ff3e"/>
  <text x="52" y="58" fill="#d8ff3e" font-family="Menlo, monospace" font-size="15" font-weight="700" letter-spacing="2.4">POINTCAST · FAN CLIQUE · RALLY KIT 001</text>
  <line x1="52" y1="85" x2="650" y2="85" stroke="#f3eddb" stroke-width="2"/>
  <text x="48" y="196" fill="#f3eddb" font-family="Arial Black, Helvetica, sans-serif" font-size="91" font-weight="900" letter-spacing="-5">MAKE YOUR</text>
  <text x="48" y="286" fill="#f3eddb" font-family="Arial Black, Helvetica, sans-serif" font-size="91" font-weight="900" letter-spacing="-5">SCHOOL</text>
  <text x="48" y="376" fill="#d8ff3e" font-family="Arial Black, Helvetica, sans-serif" font-size="82" font-weight="900" letter-spacing="-5">IMPOSSIBLE</text>
  <text x="48" y="466" fill="#d8ff3e" font-family="Arial Black, Helvetica, sans-serif" font-size="91" font-weight="900" letter-spacing="-5">TO IGNORE.</text>
  <rect x="52" y="514" width="520" height="47" fill="#ff5b35"/>
  <text x="71" y="545" fill="#111713" font-family="Menlo, monospace" font-size="14" font-weight="700" letter-spacing="1">35 SCHOOLS · ONE CLICK · LIVE BOARD</text>
  <text x="52" y="600" fill="#f3eddb" font-family="Menlo, monospace" font-size="13" font-weight="700" letter-spacing="2">POINTCAST.XYZ/25/FAN-CLIQUE/RALLY</text>
</svg>`;

const plate = await sharp(source)
  .resize(1200, 630, { fit: 'cover', position: 'center' })
  .png()
  .toBuffer();

await sharp(plate)
  .composite([{ input: Buffer.from(overlay), left: 0, top: 0 }])
  .png()
  .toFile(output);

process.stdout.write(`${output}\n`);
