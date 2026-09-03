/**
 * Shared Kennel Club social-card SVGs.
 *
 * This module deliberately only turns supplied data into SVG strings. The
 * build script supplies a locally resized data URI and Sharp writes the PNG;
 * the Pages Function supplies the current plate at request time and Resvg
 * writes the PNG. Keeping those concerns outside this file keeps the cards
 * visually identical without putting Node APIs in the edge bundle.
 */

export const KENNEL_OG_WIDTH = 1200;
export const KENNEL_OG_HEIGHT = 630;

const INK = '#12110E';
const OXBLOOD = '#8A2432';
const OXBLOOD_DARK = '#551620';
const PAPER = '#FFFDF8';
const FAINT = '#5F5E5A';
const MONO = 'JetBrains Mono, ui-monospace, Menlo, monospace';
const SANS = 'Inter, system-ui, sans-serif';

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrap(text, width, maxLines) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= width) line = next;
    else if (lines.length < maxLines - 1) {
      lines.push(line);
      line = word;
    } else {
      lines.push(`${line} ${word}`.slice(0, width - 1).trimEnd() + '…');
      return lines;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function calendarStrip(sittings, todayDay) {
  const tileW = 58;
  const tileH = 52;
  const gap = 8;
  const startX = 724;
  const startY = 210;
  return sittings.map((sitting, index) => {
    const col = index % 6;
    const row = Math.floor(index / 6);
    const x = startX + col * (tileW + gap);
    const y = startY + row * (tileH + gap);
    const active = sitting.day === todayDay;
    const tint = active ? '#FBEAEE' : '#FFFFFF';
    const fill = active ? OXBLOOD : '#C4C2BC';
    return `<g>
      <rect x="${x + 3}" y="${y + 3}" width="${tileW}" height="${tileH}" fill="${fill}" />
      <rect x="${x}" y="${y}" width="${tileW}" height="${tileH}" fill="${tint}" stroke="${INK}" stroke-width="1.5" />
      <text x="${x + 8}" y="${y + 22}" font-family="${MONO}" font-size="12" font-weight="700" letter-spacing="1" fill="${active ? OXBLOOD_DARK : FAINT}">${String(sitting.day).padStart(2, '0')}</text>
      <circle cx="${x + 14}" cy="${y + 36}" r="5" fill="${sitting.accentPalette[0]?.hex ?? OXBLOOD}" />
      <text x="${x + 24}" y="${y + 40}" font-family="${MONO}" font-size="7" font-weight="700" fill="${INK}">${esc(sitting.name.slice(0, 7).toUpperCase())}</text>
    </g>`;
  }).join('\n');
}

export function buildKennelClubCollectionCard({ sittings, today, plateHref }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${KENNEL_OG_WIDTH}" height="${KENNEL_OG_HEIGHT}" viewBox="0 0 ${KENNEL_OG_WIDTH} ${KENNEL_OG_HEIGHT}" role="img" aria-label="Kennel Club, The September Sitting: 30 daily dog portraits.">
    <rect width="${KENNEL_OG_WIDTH}" height="${KENNEL_OG_HEIGHT}" fill="${PAPER}" />
    <rect x="32" y="32" width="1134" height="566" fill="${OXBLOOD}" />
    <rect x="22" y="22" width="1134" height="566" fill="${PAPER}" stroke="${INK}" stroke-width="3" />
    <text x="58" y="74" font-family="${MONO}" font-size="16" font-weight="700" letter-spacing="2.5" fill="${OXBLOOD_DARK}">POINTCAST · KENNEL CLUB · SEPTEMBER 2026</text>
    <rect x="58" y="104" width="510" height="420" fill="#FFFFFF" stroke="${INK}" stroke-width="2" />
    <image x="58" y="104" width="510" height="420" preserveAspectRatio="xMidYMid slice" href="${esc(plateHref)}" />
    <rect x="58" y="460" width="510" height="64" fill="#FFFFFF" opacity="0.92" />
    <text x="76" y="490" font-family="${MONO}" font-size="15" font-weight="700" letter-spacing="1.8" fill="${OXBLOOD_DARK}">TODAY · ${String(today.day).padStart(2, '0')} · ${esc(today.name.toUpperCase())}</text>
    <text x="76" y="512" font-family="${SANS}" font-size="16" fill="${INK}">${esc(today.title)}</text>
    <text x="620" y="146" font-family="${SANS}" font-size="56" font-weight="500" letter-spacing="-2" fill="${INK}">The September Sitting.</text>
    <text x="622" y="174" font-family="${MONO}" font-size="13" font-weight="700" letter-spacing="2" fill="${FAINT}">30 DAILY DOG PORTRAITS · ONE CALENDAR</text>
    ${calendarStrip(sittings, today.day)}
    <line x1="620" y1="554" x2="1116" y2="554" stroke="#C4C2BC" stroke-width="1" />
    <text x="620" y="579" font-family="${MONO}" font-size="13" font-weight="700" letter-spacing="1.8" fill="${FAINT}">POINTCAST.XYZ/KENNEL-CLUB</text>
  </svg>`;
}

export function buildKennelClubSittingCard({ sitting, plateHref }) {
  const title = wrap(sitting.title, 20, 2);
  const titleText = title.map((line, index) => `<text x="650" y="${236 + index * 62}" font-family="${SANS}" font-size="54" font-weight="500" letter-spacing="-1.8" fill="${INK}">${esc(line)}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${KENNEL_OG_WIDTH}" height="${KENNEL_OG_HEIGHT}" viewBox="0 0 ${KENNEL_OG_WIDTH} ${KENNEL_OG_HEIGHT}" role="img" aria-label="Kennel Club Sitting ${String(sitting.day).padStart(2, '0')}, ${esc(sitting.name)}.">
    <rect width="${KENNEL_OG_WIDTH}" height="${KENNEL_OG_HEIGHT}" fill="${PAPER}" />
    <rect x="0" y="0" width="24" height="${KENNEL_OG_HEIGHT}" fill="${OXBLOOD}" />
    <image x="24" y="0" width="520" height="630" preserveAspectRatio="xMidYMid slice" href="${esc(plateHref)}" />
    <rect x="544" y="0" width="656" height="630" fill="${PAPER}" />
    <text x="650" y="96" font-family="${MONO}" font-size="16" font-weight="700" letter-spacing="2.4" fill="${OXBLOOD_DARK}">KENNEL CLUB · SITTING ${String(sitting.day).padStart(2, '0')}</text>
    <text x="650" y="132" font-family="${MONO}" font-size="14" font-weight="700" letter-spacing="1.8" fill="${FAINT}">${esc(sitting.mintDate)} · TOKEN ${sitting.tokenId}</text>
    ${titleText}
    <text x="650" y="390" font-family="${SANS}" font-size="30" font-weight="500" fill="${OXBLOOD_DARK}">${esc(sitting.name)}</text>
    <text x="650" y="425" font-family="${SANS}" font-size="20" fill="${FAINT}">${esc(sitting.breed)}</text>
    <line x1="650" y1="520" x2="1120" y2="520" stroke="#C4C2BC" stroke-width="1" />
    <text x="650" y="554" font-family="${MONO}" font-size="13" font-weight="700" letter-spacing="1.6" fill="${FAINT}">POINTCAST.XYZ/KENNEL-CLUB/${esc(sitting.slug.toUpperCase())}</text>
    <text x="650" y="582" font-family="${MONO}" font-size="12" font-weight="700" letter-spacing="1.5" fill="${OXBLOOD_DARK}">ONE DOG · ONE DATE · SEPTEMBER 2026</text>
  </svg>`;
}
