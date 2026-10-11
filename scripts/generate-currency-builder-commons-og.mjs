#!/usr/bin/env node
// Writes public/images/og/currency-builder-commons.png (1200 × 630) from three
// Commons note fronts. Run once after changing the hero notes.
import sharp from 'sharp';
import { COMMONS, noteFrontSVG } from '../src/lib/currency-builder/commons.mjs';

const OUT = new URL('../public/images/og/currency-builder-commons.png', import.meta.url);
const pick = (slug) => COMMONS.currencies.find((entry) => entry.slug === slug);
const notes = ['slice', 'microgrid', 'porch-note'].map(pick);

const rendered = await Promise.all(notes.map(async (entry, i) => {
  // Notes declare 150 × 75 mm for print; rasterize them at their 1200 × 600 user size.
  const svg = noteFrontSVG(entry).replace('width="150mm" height="75mm"', 'width="1200" height="600"');
  const png = await sharp(Buffer.from(svg)).resize(560, 280).png().toBuffer();
  return sharp(png).rotate([5, -4, 2][i], { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}));

const title = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#f6f1e6"/>
  <rect x="0" y="0" width="1200" height="8" fill="#1c1a17"/>
  <text x="56" y="92" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="800" font-size="22" letter-spacing="5" fill="#1c1a17">CURRENCY <tspan fill="#d2462e">BUILDER</tspan></text>
  <text x="52" y="230" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="800" font-size="104" letter-spacing="-5" fill="#1c1a17">Commons.</text>
  <text x="56" y="292" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" fill="#1c1a17">40 currencies for renting,</text>
  <text x="56" y="332" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" fill="#1c1a17">meshing, sharing and bartering.</text>
  <text x="56" y="392" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="24" fill="#d2462e">40 different actual Nouns.</text>
  <text x="56" y="580" font-family="ui-monospace, Menlo, monospace" font-size="15" letter-spacing="2" fill="#5d574d">DESIGN CONCEPTS · NOT LEGAL TENDER</text>
</svg>`;

await sharp(Buffer.from(title))
  .composite([
    { input: rendered[0], left: 640, top: 34 },
    { input: rendered[1], left: 680, top: 186 },
    { input: rendered[2], left: 624, top: 340 },
  ])
  .png()
  .toFile(OUT.pathname);
console.log(`wrote ${OUT.pathname}`);
