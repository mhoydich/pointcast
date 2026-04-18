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

/**
 * Per-page unfurl card. Used for first-class routes that aren't Blocks
 * themselves (/cast, /editions, /archive, /battle, /collection). Each
 * gets its own identity bar, kicker, and big-display title so unfurls
 * in Slack/Farcaster/Twitter don't all fall back to the generic home
 * card.
 */
function pageCard(page) {
  const titleLines = wrapText(page.title || '', page.titleChars ?? 18, 2);
  const titleFontSize = page.titleFontSize ?? 108;
  const lineHeight = Math.round(titleFontSize * 1.08);
  const titleText = titleLines.map((l, i) =>
    `<text x="80" y="${260 + i * lineHeight}" font-family="Inter, system-ui, sans-serif" font-size="${titleFontSize}" font-weight="500" letter-spacing="-2" fill="#12110E">${xmlEscape(l)}</text>`
  ).join('');

  const dekLines = page.dek ? wrapText(page.dek, 54, 3) : [];
  // dek Y begins after the title block
  const dekBaseY = 260 + titleLines.length * lineHeight + 60;
  const dekText = dekLines.map((l, i) =>
    `<text x="80" y="${dekBaseY + i * 36}" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="400" fill="#38373A">${xmlEscape(l)}</text>`
  ).join('');

  // Right-column glyph (optional) — for the pages that have a natural icon
  const glyph = page.glyph
    ? `<text x="${W - 80}" y="280" font-family="JetBrains Mono, ui-monospace, monospace" font-size="${page.glyphSize ?? 240}" font-weight="500" fill="${page.color600}" text-anchor="end" opacity="0.18">${xmlEscape(page.glyph)}</text>`
    : '';

  // Bottom metadata — url, kind, sibling surfaces
  const siblings = (page.siblings ?? []).slice(0, 3).join(' · ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="#FFFFFF" />
    <!-- Left accent bar — page color -->
    <rect x="0" y="0" width="24" height="${H}" fill="${page.color600}" />
    ${glyph}
    <!-- Kicker line -->
    <text x="80" y="110" font-family="JetBrains Mono, ui-monospace, monospace" font-size="22" font-weight="500" letter-spacing="3.6" fill="${page.color800}">${xmlEscape(page.kicker)}</text>
    <text x="80" y="148" font-family="JetBrains Mono, ui-monospace, monospace" font-size="16" font-weight="400" letter-spacing="2.5" fill="#5F5E5A">POINTCAST · ${xmlEscape(page.kind.toUpperCase())}</text>
    ${titleText}
    ${dekText}
    <!-- Footer rule + URL + siblings -->
    <line x1="80" y1="${H - 70}" x2="${W - 80}" y2="${H - 70}" stroke="#C4C2BC" stroke-width="1" />
    <text x="80" y="${H - 35}" font-family="JetBrains Mono, ui-monospace, monospace" font-size="14" font-weight="500" letter-spacing="2.5" fill="#5F5E5A">POINTCAST.XYZ${xmlEscape(page.url)}${siblings ? ' · ' + xmlEscape(siblings) : ''}</text>
  </svg>`;
}

// Manifest of first-class pages to OG-card. Add new entries here; each
// produces /images/og/{slug}.png consumed by the page via image prop.
const PAGES = [
  {
    slug: 'cast',
    url: '/cast',
    kind: 'prize pool',
    kicker: 'CH.CST · PRIZE CAST',
    title: 'No-loss prize savings.',
    dek: 'Deposit tez, keep your principal, win the weekly yield. Sunday 18:00 UTC.',
    color600: '#0F6E56',
    color800: '#074638',
    glyph: 'ꜩ',
    glyphSize: 280,
    siblings: ['/cast.json', '/for-agents'],
  },
  {
    slug: 'editions',
    url: '/editions',
    kind: 'mint dashboard',
    kicker: 'EDITIONS · MINT · CLAIM',
    title: 'Everything mintable.',
    dek: 'On-chain live, listed on objkt, daily faucets, contracts incoming — one page.',
    color600: '#185FA5',
    color800: '#0B3E73',
    glyph: '◆',
    siblings: ['/editions.json', '/collect', '/for-agents'],
  },
  {
    slug: 'archive',
    url: '/archive',
    kind: 'archive',
    kicker: 'ARCHIVE · EVERY BLOCK',
    title: 'Every block, chronologically.',
    dek: 'The homepage is the feed. This is the record. Filter by channel, type, search.',
    color600: '#5F5E5A',
    color800: '#38373A',
    glyph: '/',
    siblings: ['/archive.json', '/blocks.json', '/for-agents'],
  },
  {
    slug: 'battle',
    url: '/battle',
    kind: 'nouns battler',
    kicker: 'CH.BTL · NOUNS BATTLER',
    title: 'Every seed is a fighter.',
    dek: 'Deterministic duels. No RNG. Same seed, same stats, forever. Best-of-3.',
    color600: '#8A2432',
    color800: '#551620',
    glyph: 'VS',
    glyphSize: 200,
    siblings: ['/battle.json', '/c/battler'],
  },
  {
    slug: 'collection',
    url: '/collection',
    kind: 'holdings',
    kicker: 'COLLECTION · TEZOS',
    title: "Mike's Tezos NFTs.",
    dek: 'Every token held across every contract, live from TzKT at build time.',
    color600: '#993C1D',
    color800: '#6A2810',
    glyph: '⧉',
    siblings: ['/collection/visit-nouns', '/collect'],
  },
  {
    slug: 'drum',
    url: '/drum',
    kind: 'drum room',
    kicker: 'CH.SPN · DRUM ROOM',
    title: 'Tap together.',
    dek: 'Cookie-clicker drums. Every hit persists. DRUM tokens on Tezos, soon.',
    color600: '#993C1D',
    color800: '#6A2810',
    glyph: '♩',
    glyphSize: 280,
    siblings: ['/c/spinning', '/for-agents'],
  },
  {
    slug: 'now',
    url: '/now',
    kind: 'live snapshot',
    kicker: 'NOW · RIGHT NOW',
    title: 'Right now on PointCast.',
    dek: 'Card of the Day, Prize Cast countdown, latest blocks, contract state — one screen.',
    color600: '#185FA5',
    color800: '#0B3E73',
    glyph: '●',
    glyphSize: 240,
    siblings: ['/now.json', '/status', '/for-agents'],
  },
  {
    slug: 'search',
    url: '/search',
    kind: 'search',
    kicker: 'SEARCH · EVERY BLOCK',
    title: 'Find any block.',
    dek: 'Client-side search over every title, channel, type, and id. No network, no limits.',
    color600: '#185FA5',
    color800: '#0B3E73',
    glyph: '?',
    glyphSize: 260,
    siblings: ['/archive', '/blocks.json'],
  },
  {
    slug: 'timeline',
    url: '/timeline',
    kind: 'cadence',
    kicker: 'TIMELINE · CADENCE',
    title: 'The shape of the broadcast.',
    dek: 'Blocks-per-week per channel, heatmap, type distribution. Build-time computed.',
    color600: '#12110E',
    color800: '#12110E',
    glyph: '▌▌',
    glyphSize: 200,
    siblings: ['/timeline.json', '/archive', '/for-agents'],
  },
  {
    slug: 'stack',
    url: '/stack',
    kind: 'tech disclosure',
    kicker: 'STACK · TECH DISCLOSURE',
    title: 'How this is built.',
    dek: 'Astro, Cloudflare Pages, SmartPy, Taquito, Beacon, TzKT, noun.pics — and what we skipped.',
    color600: '#185FA5',
    color800: '#0B3E73',
    glyph: '{}',
    glyphSize: 220,
    siblings: ['/stack.json', '/agents.json'],
  },
  {
    slug: 'manifesto',
    url: '/manifesto',
    kind: 'canonical',
    kicker: 'MANIFESTO · CANONICAL',
    title: 'What is PointCast.',
    dek: 'Twelve questions, twelve answers. FAQPage + DefinedTerm schema for LLM citation.',
    color600: '#12110E',
    color800: '#12110E',
    glyph: '¶',
    glyphSize: 240,
    siblings: ['/llms.txt', '/llms-full.txt', '/agents.json'],
  },
  {
    slug: 'glossary',
    url: '/glossary',
    kind: 'terms',
    kicker: 'GLOSSARY · TERMS',
    title: 'What the words mean.',
    dek: 'Every PointCast-specific term with a stable anchor URL. DefinedTermSet schema for citation.',
    color600: '#185FA5',
    color800: '#0B3E73',
    glyph: 'A–Z',
    glyphSize: 180,
    siblings: ['/manifesto', '/for-agents'],
  },
  {
    slug: 'changelog',
    url: '/changelog',
    kind: 'version history',
    kicker: 'CHANGELOG · RELEASES',
    title: 'How we got here.',
    dek: 'Hand-curated version history. Each release landed with a theme.',
    color600: '#5F5E5A',
    color800: '#38373A',
    glyph: 'v',
    glyphSize: 260,
    siblings: ['/stack', '/manifesto'],
  },
  {
    slug: 'subscribe',
    url: '/subscribe',
    kind: 'follow',
    kicker: 'SUBSCRIBE · FEEDS',
    title: "Follow, don't sign up.",
    dek: 'RSS, JSON Feed, per-channel streams, Farcaster, X, GitHub. No email lists, no cookies.',
    color600: '#185FA5',
    color800: '#0B3E73',
    glyph: '♦',
    glyphSize: 220,
    siblings: ['/feed.xml', '/feed.json', '/for-agents'],
  },
  {
    slug: 'dao',
    url: '/dao',
    kind: 'governance',
    kicker: 'DAO · v1',
    title: 'Decide together.',
    dek: 'Predefined proposals. Beacon-signed votes. No comments, no threads, no moderation.',
    color600: '#12110E',
    color800: '#12110E',
    glyph: '✓/✗',
    glyphSize: 180,
    siblings: ['/dao.json', '/manifesto', '/for-agents'],
  },
  {
    slug: 'yield',
    url: '/yield',
    kind: 'experiments',
    kicker: 'YIELD · EXPERIMENTS',
    title: 'Five models. No commitments.',
    dek: 'Candidate token mechanics side-by-side. Tune the sliders, see monthly payouts, read the tradeoffs.',
    color600: '#0F6E56',
    color800: '#074638',
    glyph: '∑',
    glyphSize: 240,
    siblings: ['/yield.json', '/dao', '/cast'],
  },
];

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

  console.log('[og] generating', PAGES.length, 'page cards...');
  for (const page of PAGES) {
    const svg = pageCard(page);
    await svgToPng(svg, path.join(OUT_DIR, `${page.slug}.png`));
    console.log(`  ✓ /images/og/${page.slug}.png`);
  }

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
