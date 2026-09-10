// Pool Together social card → /images/og/b/0585.png (also the page's og:image).
// Run after `npm run build` regenerates block cards, then copy into dist/ before deploy.
import path from 'node:path'; import sharp from 'sharp';
const source = path.resolve('public/pool-together/og-source.png');
const output = path.resolve('public/images/og/b/0585.png');
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect x="0" y="548" width="1200" height="82" fill="#4b3621"/>
  <rect x="0" y="544" width="1200" height="4" fill="#f28c28"/>
  <text x="40" y="582" fill="#f3e3b3" font-family="Menlo" font-size="15" font-weight="700" letter-spacing="2">POINTCAST · POOL TOGETHER · LOT 000 OPEN · ALL OR NOTHING</text>
  <text x="40" y="611" fill="#f3e3b3" font-family="Helvetica" font-size="20" font-weight="700">Buy land inside the ring. Make it public. Miss the goal and every dollar goes back.</text>
  <text x="1160" y="611" text-anchor="end" fill="#f28c28" font-family="Menlo" font-size="14" font-weight="700">POINTCAST.XYZ/POOL-TOGETHER</text>
</svg>`;
const plate = await sharp(source).resize(1200, 630, { fit: 'cover', position: 'centre' }).png().toBuffer();
await sharp(plate).composite([{ input: Buffer.from(overlay) }]).png().toFile(output);
console.log(output);
