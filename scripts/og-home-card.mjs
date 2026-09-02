/**
 * The homepage unfurl card (og-home-v4) — the whole-town front door.
 *
 * Mirrors block 0580's front-door card (/images/front-door/front-door-card.svg)
 * as a still: register grammar from src/styles/home-shelf.css — white ground,
 * 2px ink borders, a channel-colour offset shadow — with the twelve shelves
 * of src/pages/index.astro laid out as chips. Rasterised by
 * scripts/generate-og-images.mjs into public/images/og/og-home-v4.png.
 *
 * Bump the version suffix (v4 → v5) whenever the art changes: X, iMessage
 * and Slack cache unfurl images by URL for days, and a new filename is the
 * only reliable bust.
 */

const W = 1200;
const H = 630;

const INK = '#12110E';
const BLUE = '#185FA5';   // CH.FD
const RED = '#E53F47';    // the "Still on." red from the front-door card
const BODY = '#38373A';
const FAINT = '#5F5E5A';

// One chip per homepage shelf, top to bottom, in the order index.astro renders
// them. Fill tints and shadow colours follow the channel table in
// src/lib/channels.ts (FD blue, FCT amber, VST grey, SPN rust, BTL wine, GDN
// green, ESC violet, GF plum, CRT leaf).
const SHELVES = [
  { label: 'PLAY FIRST',        tint: '#EEF4FA', shadow: '#185FA5' },
  { label: 'START HERE',        tint: '#FBF3E4', shadow: '#BA7517' },
  { label: 'AT A GLANCE',       tint: '#F3F3F1', shadow: '#5F5E5A' },
  { label: 'THE MAGAZINE RACK', tint: '#FBEEE9', shadow: '#993C1D' },
  { label: 'THE DRUM HOUSE',    tint: '#F6ECEF', shadow: '#8A2432' },
  { label: 'ROOMS & RITUALS',   tint: '#EEF6EF', shadow: '#0F6E56' },
  { label: 'THE CONSTELLATION', tint: '#EFEDF8', shadow: '#534AB7' },
  { label: 'THE AGENT DESK',    tint: '#EEF4FA', shadow: '#185FA5' },
  { label: 'THE SHIP LOG',      tint: '#F6ECEF', shadow: '#993556' },
  { label: 'THE REGISTER',      tint: '#F3F3F1', shadow: '#38373A' },
  { label: 'THE WIRE',          tint: '#EEF6EF', shadow: '#3B6D11' },
  { label: 'TEN CHANNELS',      tint: '#FBF3E4', shadow: '#BA7517' },
];

const MONO = 'JetBrains Mono, ui-monospace, Menlo, monospace';
const SANS = 'Inter, system-ui, sans-serif';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * @param {object} opts
 * @param {number} opts.blockCount  published (non-draft) blocks, computed at build
 * @param {number} [opts.doors]     curated doors on the front door (FEATURES + rooms), hand-counted
 * @param {number} [opts.satellites]
 * @param {number} [opts.mcpTools]
 */
export function homeCard({ blockCount, doors = 395, satellites = 22, mcpTools = 50 }) {
  const chipW = 256;
  const chipH = 52;
  const colGap = 16;
  const rowGap = 14;
  const gridX = 64;
  const gridY = 366;

  const chips = SHELVES.map((s, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = gridX + col * (chipW + colGap);
    const y = gridY + row * (chipH + rowGap);
    return `<g>
      <rect x="${x + 5}" y="${y + 5}" width="${chipW}" height="${chipH}" fill="${s.shadow}" />
      <rect x="${x}" y="${y}" width="${chipW}" height="${chipH}" fill="${s.tint}" stroke="${INK}" stroke-width="2" />
      <text x="${x + 16}" y="${y + 33}" font-family="${MONO}" font-size="15" font-weight="700" letter-spacing="2" fill="${INK}">${esc(s.label)}</text>
    </g>`;
  }).join('\n');

  const footer = [
    `${blockCount} BLOCKS`,
    `${doors} DOORS`,
    `${satellites} SATELLITES`,
    `${mcpTools} MCP TOOLS`,
    'POINTCAST.XYZ',
  ].join(' · ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="PointCast, the whole town on one page. Still experimental. Still on.">
    <rect width="${W}" height="${H}" fill="#FFFFFF" />
    <!-- register card: ink border with the Front Door blue offset shadow -->
    <rect x="34" y="34" width="1142" height="572" fill="${BLUE}" />
    <rect x="24" y="24" width="1142" height="572" fill="#FFFFFF" stroke="${INK}" stroke-width="3" />

    <text x="64" y="88" font-family="${MONO}" font-size="17" font-weight="700" letter-spacing="3" fill="${BLUE}">POINTCAST · CH.FD · THE FRONT DOOR · EL SEGUNDO, CALIFORNIA</text>

    <text x="60" y="184" font-family="${SANS}" font-size="92" font-weight="800" letter-spacing="-4" fill="${INK}">Still experimental.</text>
    <text x="60" y="278" font-family="${SANS}" font-size="92" font-weight="800" letter-spacing="-4" fill="${RED}">Still on.</text>
    <text x="64" y="326" font-family="${SANS}" font-size="25" font-weight="400" fill="${BODY}">A small internet town, broadcasting from El Segundo. The whole town on one page.</text>

    ${chips}

    <circle cx="76" cy="577" r="6" fill="#1F7A3A" />
    <text x="94" y="583" font-family="${MONO}" font-size="15" font-weight="700" letter-spacing="2" fill="${FAINT}">${esc(footer)}</text>
  </svg>`;
}
