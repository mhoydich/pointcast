#!/usr/bin/env node
// Writes the Currency Builder share cards (1200 × 630) from note fronts:
//   public/images/og/currency-builder-commons.png
//   public/images/og/currency-builder-barter.png
//   public/images/og/currency-builder-almanac.png
//   public/images/og/currency-builder-security.png
// Run after changing either collection's hero notes.
import sharp from 'sharp';
import * as commons from '../src/lib/currency-builder/commons.mjs';
import * as barter from '../src/lib/currency-builder/barter.mjs';
import * as almanac from '../src/lib/currency-builder/almanac.mjs';
import * as security from '../src/lib/currency-builder/security-edition.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function card({ out, notes, render, title, lines, accentLine, only = process.argv[2] }) {
  if (only && !out.includes(only)) return;
  const rendered = await Promise.all(notes.map(async (entry, i) => {
    // Notes declare 150 × 75 mm for print; rasterize them at their 1200 × 600 user size.
    const svg = render(entry).replace('width="150mm" height="75mm"', 'width="1200" height="600"');
    const png = await sharp(Buffer.from(svg)).resize(560, 280).png().toBuffer();
    return sharp(png).rotate([5, -4, 2][i], { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  }));
  const text = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#f6f1e6"/>
  <rect x="0" y="0" width="1200" height="8" fill="#1c1a17"/>
  <text x="56" y="92" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="800" font-size="22" letter-spacing="5" fill="#1c1a17">CURRENCY <tspan fill="#b23a24">BUILDER</tspan></text>
  <text x="52" y="230" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="800" font-size="${title.length > 9 ? 70 : 104}" letter-spacing="-5" fill="#1c1a17">${esc(title)}</text>
  ${lines.map((line, i) => `<text x="56" y="${292 + i * 40}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" fill="#1c1a17">${esc(line)}</text>`).join('\n  ')}
  <text x="56" y="${292 + lines.length * 40 + 20}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="24" fill="#b23a24">${esc(accentLine)}</text>
  <text x="56" y="580" font-family="ui-monospace, Menlo, monospace" font-size="15" letter-spacing="2" fill="#5d574d">DESIGN CONCEPTS · NOT LEGAL TENDER</text>
</svg>`;
  await sharp(Buffer.from(text))
    .composite([
      { input: rendered[0], left: 640, top: 34 },
      { input: rendered[1], left: 680, top: 186 },
      { input: rendered[2], left: 624, top: 340 },
    ])
    .png()
    .toFile(new URL(`../public/images/og/${out}`, import.meta.url).pathname);
  console.log(`wrote public/images/og/${out}`);
}

const pickCommons = (slug) => commons.COMMONS.currencies.find((entry) => entry.slug === slug);
await card({
  out: 'currency-builder-commons.png',
  notes: ['slice', 'microgrid', 'porch-note'].map(pickCommons),
  render: commons.noteFrontSVG,
  title: 'Commons.',
  lines: ['40 currencies for renting,', 'meshing, sharing and bartering.'],
  accentLine: '40 different actual Nouns.',
});

if (barter.BARTER.currencies.length >= 3) {
  const regions = [...new Set(barter.BARTER.currencies.map((entry) => entry.region))];
  const notes = regions.slice(0, 3).map((id) => barter.BARTER.currencies.find((entry) => entry.region === id));
  const n = barter.BARTER.currencies.length;
  await card({
    out: 'currency-builder-barter.png',
    notes,
    render: barter.noteFrontSVG,
    title: 'Global Barter.',
    lines: [`${n} currencies inspired by`, 'barter traditions worldwide.'],
    accentLine: `${new Set(barter.BARTER.currencies.map((entry) => entry.nounId)).size} different actual Nouns.`,
  });
}

{
  const pickAlmanac = (slug) => almanac.ALMANAC.currencies.find((entry) => entry.slug === slug);
  await card({
    out: 'currency-builder-almanac.png',
    notes: ['the-perseids', 'el-segundo-blue', 'southbound'].map(pickAlmanac),
    render: almanac.noteFrontSVG,
    title: 'Almanac.',
    lines: ['52 currencies, one for each', 'week of the South Bay year.'],
    accentLine: '52 different actual Nouns.',
  });
}

{
  const pick = (collection, slug) => ({ collection, entry: security.COLLECTIONS[collection].data.currencies.find((e) => e.slug === slug) });
  await card({
    out: 'currency-builder-security.png',
    notes: [pick('commons', 'porch-note'), pick('barter', 'jonbeel-fair'), pick('commons', 'microgrid')],
    render: ({ collection, entry }) => security.securitySVG(collection, entry, 'front'),
    title: 'Security Edition.',
    lines: ['Every note, printed like money:', 'engraved Nouns, guilloche, foil.'],
    accentLine: 'Full actual Nouns. All printed art.',
  });
}
