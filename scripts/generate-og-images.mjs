#!/usr/bin/env node
/**
 * Generate Open Graph unfurl cards — default site card + one per Block.
 *
 * Output: public/images/og/
 *   ├── og-home-v2.png     (1200×630 default, used by / and /for-agents)
 *   └── b/{id}.png         (per-block card with channel color + title + Noun)
 *
 * We hand-roll SVG templates and let sharp rasterize to PNG. Satori would
 * work too but sharp is already a transitive dep of Astro, so no new
 * toolchain. The design mirrors BLOCKS.md: white background, mono code
 * header, sans title, channel-colored accent bar.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const OUT_DIR = path.resolve(process.cwd(), 'public/images/og');
const BLOCKS_DIR = path.resolve(process.cwd(), 'src/content/blocks');
const W = 1200, H = 630;

// Channel color table — must match src/lib/channels.ts. Duplicated here
// so this script can run without Astro's module graph.
const CHANNELS = {
  FD:  { name: 'Front Door', color600: '#185FA5', color800: '#0B3E73' },
  CRT: { name: 'Court',      color600: '#3B6D11', color800: '#24460A' },
  SPN: { name: 'Spinning',   color600: '#993C1D', color800: '#6A2810' },
  GF:  { name: 'Good Feels', color600: '#993556', color800: '#6B2139' },
  GDN: { name: 'Garden',     color600: '#0F6E56', color800: '#074638' },
  ESC: { name: 'El Segundo', color600: '#534AB7', color800: '#332C7C' },
  FCT: { name: 'Faucet',     color600: '#BA7517', color800: '#834F0A' },
  VST: { name: 'Visit',      color600: '#5F5E5A', color800: '#38373A' },
  BTL: { name: 'Battler',    color600: '#8A2432', color800: '#551620' },
};

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Simple word-wrap for SVG <tspan> runs. Returns array of lines. */
function wrapText(str, maxChars, maxLines) {
  const words = str.split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if (line.length + w.length + 1 <= maxChars) {
      line = line ? line + ' ' + w : w;
    } else {
      if (line) lines.push(line);
      line = w;
      if (lines.length >= maxLines - 1) {
        // last line gets everything remaining + ellipsis if it overflows
        const rest = words.slice(words.indexOf(w)).join(' ');
        lines.push(rest.length > maxChars ? rest.slice(0, maxChars - 1) + '…' : rest);
        return lines;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

function defaultCard() {
  // PointCast wordmark + 9-channel color bar + tagline. White bg, hard corners.
  const channelBar = Object.entries(CHANNELS)
    .map(([code, ch], i) => {
      const x = 60 + i * 130;
      return `<g>
        <rect x="${x}" y="${H - 140}" width="110" height="10" fill="${ch.color600}" />
        <text x="${x}" y="${H - 108}" font-family="JetBrains Mono, ui-monospace, monospace" font-size="14" font-weight="500" letter-spacing="2" fill="#38373A">CH.${code}</text>
      </g>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#FFFFFF" />
    <text x="60" y="140" font-family="JetBrains Mono, ui-monospace, monospace" font-size="18" font-weight="500" letter-spacing="3" fill="#5F5E5A">/ POINTCAST / V2</text>
    <text x="60" y="265" font-family="JetBrains Mono, ui-monospace, monospace" font-size="92" font-weight="500" letter-spacing="18" fill="#12110E">POINTCAST</text>
    <text x="60" y="325" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="400" fill="#38373A">A living broadcast from El Segundo.</text>
    <text x="60" y="365" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="400" fill="#38373A">Every piece of content is a Block.</text>
    <line x1="60" y1="${H - 170}" x2="${W - 60}" y2="${H - 170}" stroke="#12110E" stroke-width="2" />
    ${channelBar}
    <text x="60" y="${H - 40}" font-family="JetBrains Mono, ui-monospace, monospace" font-size="14" font-weight="500" letter-spacing="2.5" fill="#5F5E5A">POINTCAST.XYZ · /FOR-AGENTS · /BLOCKS.JSON · TEZOS</text>
  </svg>`;
}

function blockCard(block) {
  const ch = CHANNELS[block.channel] ?? CHANNELS.FD;
  const titleLines = wrapText(block.title || '', 36, 3);
  const titleText = titleLines.map((l, i) =>
    `<text x="80" y="${260 + i * 58}" font-family="Inter, system-ui, sans-serif" font-size="46" font-weight="500" fill="#12110E">${xmlEscape(l)}</text>`
  ).join('');
  const dekLines = block.dek ? wrapText(block.dek, 50, 2) : [];
  const dekText = dekLines.map((l, i) =>
    `<text x="80" y="${450 + i * 32}" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="400" fill="#38373A">${xmlEscape(l)}</text>`
  ).join('');

  const ts = new Date(block.timestamp);
  const dateStr = new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).format(ts).replace(/\//g, '.');

  // Noun portrait (right column). We embed as an <image> and let the browser
  // fetch noun.pics — which is fine for unfurl rendering downstream.
  const nounUrl = block.noun !== undefined ? `https://noun.pics/${block.noun}.svg` : null;
  const nounBlock = nounUrl
    ? `<image x="${W - 260}" y="170" width="200" height="200" href="${nounUrl}" />`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#FFFFFF" />
    <!-- Channel color left accent bar -->
    <rect x="0" y="0" width="24" height="${H}" fill="${ch.color600}" />
    <!-- Top bar: channel code + type + id + timestamp -->
    <text x="80" y="100" font-family="JetBrains Mono, ui-monospace, monospace" font-size="22" font-weight="500" letter-spacing="3.2" fill="${ch.color800}">CH.${block.channel} · № ${xmlEscape(block.id)} · ${xmlEscape(block.type)}</text>
    <text x="80" y="138" font-family="JetBrains Mono, ui-monospace, monospace" font-size="16" font-weight="400" letter-spacing="2.5" fill="#5F5E5A">${dateStr} · ${xmlEscape(ch.name.toUpperCase())}</text>
    ${titleText}
    ${dekText}
    ${nounBlock}
    <!-- Footer -->
    <line x1="80" y1="${H - 70}" x2="${W - 80}" y2="${H - 70}" stroke="#C4C2BC" stroke-width="1" />
    <text x="80" y="${H - 35}" font-family="JetBrains Mono, ui-monospace, monospace" font-size="14" font-weight="500" letter-spacing="2.5" fill="#5F5E5A">POINTCAST.XYZ/B/${xmlEscape(block.id)}</text>
  </svg>`;
}

async function svgToPng(svg, outPath) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, quality: 90 })
    .toFile(outPath);
}

async function main() {
  console.log('[og] generating default card...');
  await svgToPng(defaultCard(), path.join(OUT_DIR, 'og-home-v2.png'));
  console.log('  ✓ /images/og/og-home-v2.png');

  const blockFiles = (await fs.readdir(BLOCKS_DIR)).filter((f) => f.endsWith('.json'));
  console.log('[og] generating', blockFiles.length, 'block cards...');

  let done = 0;
  for (const file of blockFiles) {
    const raw = await fs.readFile(path.join(BLOCKS_DIR, file), 'utf8');
    const block = JSON.parse(raw);
    const svg = blockCard(block);
    await svgToPng(svg, path.join(OUT_DIR, 'b', `${block.id}.png`));
    done++;
  }
  console.log(`  ✓ ${done} per-block cards at /images/og/b/*.png`);
}

main().catch((err) => {
  console.error('[og] FAILED:', err?.message || err);
  process.exit(1);
});
