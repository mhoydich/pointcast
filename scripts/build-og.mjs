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
  // SEO pillar cards — dedicated unfurls so shares of these pages don't
  // fall back to the home OG. Added 2026-04-21 alongside the pillars.
  { svg: 'og-el-segundo.svg',   png: 'og-el-segundo.png'   }, // /el-segundo · 1200×630
  { svg: 'og-agent-native.svg', png: 'og-agent-native.png' }, // /agent-native · 1200×630
  { svg: 'og-nouns.svg',        png: 'og-nouns.png'        }, // /nouns · 1200×630
  // Square 1080×1080 pillar cards for Instagram + Threads + Farcaster
  // grid previews. Paired alt to the 1200×630 versions above.
  { svg: 'og-el-segundo-square.svg',   png: 'og-el-segundo-square.png'   },
  { svg: 'og-agent-native-square.svg', png: 'og-agent-native-square.png' },
  { svg: 'og-nouns-square.svg',        png: 'og-nouns-square.png'        },
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
