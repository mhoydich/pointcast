import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Usage: node scripts/generate-pointcast-25-og.mjs [board-000|board-001|disagreement-000 ...]
// With no arguments every card is regenerated. Pass names to regenerate only those.
const outDir = path.resolve('public/images/pointcast-25');
const only = new Set(process.argv.slice(2));

const boardCard = ({ eyebrow, teams, tagline }) => `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#10100f"/>
  <rect y="0" width="1200" height="18" fill="#f4ff3f"/>
  <text x="-28" y="520" fill="#f4ff3f" font-family="Arial Black, Helvetica, sans-serif" font-size="560" font-weight="900" letter-spacing="-72">25</text>
  <text x="612" y="102" fill="#ffffff" font-family="Arial Black, Helvetica, sans-serif" font-size="58" font-weight="900" letter-spacing="-4">FOR REASONS</text>
  <text x="618" y="137" fill="#aaa9a2" font-family="Menlo, monospace" font-size="14" font-weight="700" letter-spacing="3">${eyebrow}</text>
  <line x1="618" y1="168" x2="1140" y2="168" stroke="#696863" stroke-width="1"/>
  <g font-family="Helvetica, Arial, sans-serif">
${teams.map((team, index) => `    <text x="618" y="${222 + index * 60}" fill="#7d7c76" font-family="Menlo, monospace" font-size="17" font-weight="700">${String(index + 1).padStart(2, '0')}</text>
    <text x="680" y="${222 + index * 60}" fill="#ffffff" font-size="31" font-weight="800">${team}</text>`).join('\n')}
  </g>
  <line x1="618" y1="500" x2="1140" y2="500" stroke="#696863" stroke-width="1"/>
  <text x="618" y="545" fill="#f4ff3f" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="800">${tagline}</text>
  <text x="618" y="582" fill="#ffffff" font-family="Menlo, monospace" font-size="15" font-weight="700" letter-spacing="2">POINTCAST.XYZ/25</text>
</svg>`;

const cards = {
  'board-000': boardCard({
    eyebrow: 'BOARD 000 · PRESEASON · JULY 27, 2026',
    teams: ['OHIO STATE', 'NOTRE DAME', 'TEXAS', 'OREGON', 'GEORGIA'],
    tagline: 'A COLLEGE-FOOTBALL POLL WITH RECEIPTS.',
  }),
  'board-001': boardCard({
    eyebrow: 'BOARD 001 · WEEK 1 · SEPTEMBER 1, 2026 · 25 HOLD',
    teams: ['OHIO STATE', 'NOTRE DAME', 'TEXAS', 'OREGON', 'GEORGIA'],
    tagline: 'ONE GAME IN. THE NUMBERS HOLD.',
  }),
  'disagreement-000': `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#10100f"/>
  <rect y="0" width="1200" height="18" fill="#f4ff3f"/>
  <text x="60" y="86" fill="#aaa9a2" font-family="Menlo, monospace" font-size="14" font-weight="700" letter-spacing="3">POINTCAST 25 · BOARD 000 · PRESEASON 2026</text>
  <text x="55" y="190" fill="#ffffff" font-family="Arial Black, Helvetica, sans-serif" font-size="94" font-weight="900" letter-spacing="-7">THE DISAGREEMENT</text>
  <text x="55" y="278" fill="#f4ff3f" font-family="Arial Black, Helvetica, sans-serif" font-size="106" font-weight="900" letter-spacing="-8">INDEX</text>
  <line x1="60" y1="320" x2="1140" y2="320" stroke="#696863" stroke-width="1"/>
  <g font-family="Helvetica, Arial, sans-serif" font-size="27" font-weight="800">
    <text x="60" y="382" fill="#ffffff">PENN STATE</text>
    <text x="335" y="382" fill="#ffffff">BYU</text>
    <text x="505" y="382" fill="#ffffff">UTAH</text>
    <text x="680" y="382" fill="#ffffff">WASHINGTON</text>
    <text x="970" y="382" fill="#ffffff">BOISE</text>
  </g>
  <g font-family="Menlo, monospace" font-size="13" font-weight="700" letter-spacing="2">
    <text x="60" y="414" fill="#7d7c76">PC #12 · FPI #17</text>
    <text x="335" y="414" fill="#7d7c76">#16 · #20</text>
    <text x="505" y="414" fill="#7d7c76">#20 · NR</text>
    <text x="680" y="414" fill="#7d7c76">#21 · NR</text>
    <text x="970" y="414" fill="#7d7c76">#24 · NR</text>
  </g>
  <rect x="60" y="458" width="1080" height="2" fill="#f4ff3f"/>
  <text x="60" y="515" fill="#ffffff" font-family="Helvetica, Arial, sans-serif" font-size="27" font-weight="800">FIVE TEAMS WE BELIEVE IN MORE — WITH RECEIPTS.</text>
  <text x="60" y="570" fill="#f4ff3f" font-family="Menlo, monospace" font-size="16" font-weight="700" letter-spacing="2">POINTCAST.XYZ/25/DISAGREEMENTS</text>
</svg>`,
};

await mkdir(outDir, { recursive: true });
const written = [];
for (const [name, svg] of Object.entries(cards)) {
  if (only.size && !only.has(name)) continue;
  const file = path.join(outDir, `${name}.png`);
  await sharp(Buffer.from(svg)).png().toFile(file);
  written.push(file);
}
process.stdout.write(`${written.join('\n')}\n`);
