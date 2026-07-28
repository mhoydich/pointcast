import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const outputDirectory = path.resolve('public/beach-commons/v8/products');
const images = [
  ['ikea-throw.webp', 'https://www.ikea.com/us/en/images/products/soluppgang-throw-double-sided-blue-off-white__1450500_pe990339_s5.jpg'],
  ['matador-pocket.webp', 'https://www.matadorequipment.com/cdn/shop/files/MATL5001BL_Matador_PocketBlanket_slate_1_cropped_d6e57a88-c633-449c-af38-4cec78e10a03.jpg?v=1759512821'],
  ['ikea-picnic.webp', 'https://www.ikea.com/us/en/images/products/soluppgang-picnic-blanket-brown__1501620_pe1007384_s5.jpg'],
  ['kelty-biggie.webp', 'https://kelty.com/cdn/shop/files/582772_source_1737160196.jpg?v=1743617583&width=1200'],
  ['cgear-original.webp', 'https://www.cgear-sandfree.com/cdn/shop/files/1_CompactCGearSand-FreeMatinblueandgreen_shownrolledwithcarrybag_perfectforcampingandcaravans_jpg.webp?v=1760155162'],
  ['nomadix-festival.webp', 'https://www.nomadix.co/cdn/shop/files/festival-blanket-hula-multi-1087810.jpg?v=1761341738'],
  ['nemo-victory.webp', 'https://cdn.shopify.com/s/files/1/0582/1136/9133/files/a9oynk28hlxzdyznxo1i.jpg?v=1751900715'],
  ['slowtide-koko.webp', 'https://slowtide.co/cdn/shop/files/KOKO_TURKISHBLANKET_CREAM_CORNERFLIP_FLAT.jpg?v=1770401594'],
  ['rumpl-everywhere.webp', 'https://www.rumpl.com/cdn/shop/files/rumpl-everywhere-mat-one-size-everywhere-mat-coast-retro-rays-tnsm-crr-o-1146110630.webp?v=1756299322'],
  ['parks-shadows.webp', 'https://www.parksproject.us/cdn/shop/files/PP402092_BLKWHT_ParkShadowsWovenBlanket_001_e1e70305-5d82-446a-982c-4742d677050b.jpg?v=1767746131'],
  ['business-pleasure.webp', 'https://businessandpleasureco.com/cdn/shop/files/the-beach-blanket-2115048.jpg?v=1780479323'],
  ['yeti-lowlands.webp', 'https://yeti-webmedia.imgix.net/asset/fc543cd0-76a6-464e-a039-9568be80e381/W/site_studio_outdoor_Lowlands_Cape_Taupe_3QTER_Folded_081_V2_Primary_B_2400x2400.png?bg=0fff&auto=format,compress&w=1200&h=1200'],
];

await mkdir(outputDirectory, { recursive: true });

for (const [filename, url] of images) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'PointCast editorial image reference builder/1.0' },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  const source = Buffer.from(await response.arrayBuffer());
  await sharp(source)
    .rotate()
    .resize(960, 960, { fit: 'cover', position: 'attention' })
    .webp({ quality: 80, effort: 5 })
    .toFile(path.join(outputDirectory, filename));
  console.log(filename);
}
