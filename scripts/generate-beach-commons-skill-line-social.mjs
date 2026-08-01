import path from 'node:path';
import sharp from 'sharp';

const source = path.resolve('public/beach-commons/v18/assets/poster-07.png');
const output = path.resolve('public/images/og/b/0549.png');
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="shade"><stop stop-color="#061a29"/><stop offset=".72" stop-color="#061a29" stop-opacity=".78"/><stop offset="1" stop-color="#061a29" stop-opacity=".12"/></linearGradient></defs>
  <rect width="880" height="630" fill="url(#shade)"/><rect width="18" height="630" fill="#f0b52e"/>
  <text x="54" y="56" fill="#f0b52e" font-family="Menlo" font-size="14" font-weight="700">POINTCAST · RADIUS 25 · FIELD COMPANION 018.A</text>
  <text x="50" y="196" fill="#fffdf5" font-family="Arial Black" font-size="105" font-weight="900">THE SKILL</text>
  <text x="50" y="296" fill="#fffdf5" font-family="Arial Black" font-size="105" font-weight="900">LINE</text>
  <text x="56" y="365" fill="#f0b52e" font-family="Georgia" font-size="50" font-style="italic">Declare what you can bring.</text>
  <text x="56" y="440" fill="#fffdf5" font-family="Helvetica" font-size="26" font-weight="700">One skill. One counterpart. One line.</text>
  <rect x="54" y="480" width="653" height="46" fill="#df6242"/><text x="72" y="510" fill="#061a29" font-family="Menlo" font-size="14" font-weight="700">8 LANES · 6 BRIEFS · 0 AUTOMATIC POSTS</text>
  <text x="54" y="590" fill="#fffdf5" font-family="Menlo" font-size="13" font-weight="700">POINTCAST.XYZ/BEACH-COMMONS/V18/SKILLS</text>
</svg>`;

await sharp(source)
  .resize(1200, 630, { fit: 'cover', position: 'attention' })
  .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(output);
