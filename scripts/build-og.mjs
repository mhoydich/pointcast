#!/usr/bin/env node
/**
 * build-og — renders public/images/og-home-v2.svg to og-home-v2.png.
 *
 * Resvg (via @resvg/resvg-js) doesn't fetch remote hrefs at render time,
 * so any `<image href="https://noun.pics/…">` gets inlined first: we fetch
 * the Noun SVG, strip its outer <svg>, and nest it as a <g transform=…>
 * inside the OG SVG before rendering.
 *
 * Run after changing the OG design or bumping the identity Noun:
 *
 *   node scripts/build-og.mjs
 *
 * Output: public/images/og-home-v2.png (1200×630 PNG).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// List of OG cards to render — one per route that needs its own unfurl.
// Add a new entry + create the matching og-<name>.svg to extend.
const CARDS = [
  { svg: 'og-home-v3.svg', png: 'og-home-v3.png' }, // / (current; dark broadcast poster)
  { svg: 'og-home-v2.svg', png: 'og-home-v2.png' }, // legacy (keeps working for any stale shares)
  { svg: 'og-drum.svg',    png: 'og-drum.png'    }, // /drum
  { svg: 'og-collect.svg', png: 'og-collect.png' }, // /collect
  { svg: 'og-about.svg',   png: 'og-about.png'   }, // /about
  // Birthday Imprint — added 2026-04-29 PT for the drum-birthday family.
  { svg: 'og-drum-birthday.svg', png: 'og-drum-birthday.png' }, // /drum-birthday
  { svg: 'og-drum-cake.svg',     png: 'og-drum-cake.png'     }, // /drum-cake
  { svg: 'og-drum-card.svg',     png: 'og-drum-card.png'     }, // /drum-card
  { svg: 'og-drum-pinata.svg',   png: 'og-drum-pinata.png'   }, // /drum-pinata
];

/**
 * Inline any `<image href="https://…svg">` tags by fetching the remote SVG
 * and nesting its content under a `<g transform="translate(x,y) scale(…)">`.
 * Keeps the rest of the parent SVG intact.
 */
async function inlineRemoteImages(svg) {
  const imgRegex = /<image\s+href="([^"]+)"\s+x="([\d.-]+)"\s+y="([\d.-]+)"\s+width="([\d.-]+)"\s+height="([\d.-]+)"[^/]*\/>/g;
  const matches = [...svg.matchAll(imgRegex)];
  if (matches.length === 0) return svg;

  for (const match of matches) {
    const [full, href, x, y, w, h] = match;
    if (!/^https?:\/\//.test(href)) continue;
    console.log(`  inlining ${href} → (${x}, ${y}, ${w}×${h})`);
    const res = await fetch(href);
    if (!res.ok) throw new Error(`fetch ${href} failed: ${res.status}`);
    const remote = await res.text();

    // Pull out the viewBox / width / height from the remote SVG to compute
    // the scale factor so its content fits our target rect.
    const vbMatch = remote.match(/viewBox="([\d.\s-]+)"/);
    let vbW = 320, vbH = 320;
    if (vbMatch) {
      const parts = vbMatch[1].trim().split(/\s+/).map(Number);
      if (parts.length === 4) { vbW = parts[2]; vbH = parts[3]; }
    } else {
      const wM = remote.match(/\bwidth="([\d.]+)"/);
      const hM = remote.match(/\bheight="([\d.]+)"/);
      if (wM) vbW = Number(wM[1]);
      if (hM) vbH = Number(hM[1]);
    }

    // Strip the outer <svg …> wrapper; keep inner children.
    const inner = remote
      .replace(/<\?xml[^>]*\?>/, '')
      .replace(/<!DOCTYPE[^>]*>/, '')
      .replace(/<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '');

    const scaleX = Number(w) / vbW;
    const scaleY = Number(h) / vbH;
    const wrapped =
      `<g transform="translate(${x}, ${y}) scale(${scaleX}, ${scaleY})">${inner}</g>`;

    svg = svg.replace(full, wrapped);
  }
  return svg;
}

async function renderOne(svgName, pngName) {
  const svgIn = resolve(__dirname, '../public/images', svgName);
  const pngOut = resolve(__dirname, '../public/images', pngName);
  console.log(`\n--- ${svgName} → ${pngName} ---`);
  let svg;
  try {
    svg = readFileSync(svgIn, 'utf-8');
  } catch (err) {
    console.warn(`  ⚠ skip: ${svgName} not found`);
    return;
  }
  svg = await inlineRemoteImages(svg);
  const resvg = new Resvg(svg, {
    background: '#efe6d2',
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true },
  });
  const png = resvg.render().asPng();
  writeFileSync(pngOut, png);
  console.log(`  ✓ ${(png.length / 1024).toFixed(1)} KB`);
}

async function main() {
  for (const card of CARDS) {
    await renderOne(card.svg, card.png);
  }
  console.log('\n✓ all OG cards rendered');
}

main().catch((err) => { console.error(err); process.exit(1); });
