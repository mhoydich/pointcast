import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { PASSPORT_LENSES, PINTEREST_BOARDS, PINTEREST_PINS } from '../src/lib/radius25-passport.ts';

const outputDir = path.resolve('public/beach-commons/v18/passport/pins');
await mkdir(outputDir, { recursive: true });

const escapeXml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const wrap = (text, max = 27) => {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
};

const tspans = (lines, x, y, leading, attrs = '') => lines.map((line, index) =>
  `<tspan x="${x}" y="${y + index * leading}" ${attrs}>${escapeXml(line)}</tspan>`
).join('');

for (const pin of PINTEREST_PINS) {
  const board = PINTEREST_BOARDS.find((item) => item.id === pin.board);
  const lens = PASSPORT_LENSES.find((item) => item.id === pin.lensId);
  const resourceLines = wrap(pin.resource, 19).slice(0, 4);
  const promptLines = wrap(pin.prompt, 31).slice(0, 6);
  const index = Number(pin.id);
  const angle = index % 2 ? -7 : 8;
  const circleX = 650 + ((index * 37) % 190);
  const circleY = 260 + ((index * 53) % 190);
  const svg = `
    <svg width="1000" height="1500" viewBox="0 0 1000 1500" xmlns="http://www.w3.org/2000/svg">
      <rect width="1000" height="1500" fill="${board.color}"/>
      <path d="M0 1120 C220 980 420 1250 650 1100 S900 960 1000 1020 V1500 H0Z" fill="${board.accent}" opacity=".92"/>
      <circle cx="${circleX}" cy="${circleY}" r="250" fill="none" stroke="${board.accent}" stroke-width="4" opacity=".48"/>
      <circle cx="${circleX}" cy="${circleY}" r="145" fill="none" stroke="${board.accent}" stroke-width="3" opacity=".34"/>
      <path d="M70 95 H930" stroke="#172d39" stroke-width="3"/>
      <text x="70" y="72" fill="#172d39" font-family="Arial, sans-serif" font-size="24" font-weight="800" letter-spacing="3">POINTCAST · PASS/25 · ${pin.id}/50</text>
      <text x="70" y="150" fill="#172d39" font-family="Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="2">${escapeXml(board.season.toUpperCase())} · ${escapeXml(board.area.toUpperCase())}</text>
      <g transform="translate(750 500) rotate(${angle})">
        <circle cx="0" cy="0" r="122" fill="${lens.color}" stroke="#172d39" stroke-width="5"/>
        <circle cx="0" cy="0" r="99" fill="none" stroke="#172d39" stroke-width="3" stroke-dasharray="6 11"/>
        <text x="0" y="29" text-anchor="middle" fill="#fffaf0" font-family="Georgia, serif" font-size="92">${escapeXml(lens.mark)}</text>
        <text x="0" y="80" text-anchor="middle" fill="#fffaf0" font-family="Arial, sans-serif" font-size="15" font-weight="800" letter-spacing="2">${escapeXml(pin.lens.toUpperCase())} VIEW</text>
      </g>
      <text x="70" y="275" fill="#172d39" font-family="Arial, sans-serif" font-size="96" font-weight="900" letter-spacing="-5">${tspans(resourceLines, 70, 275, 92)}</text>
      <text x="74" y="${300 + resourceLines.length * 92}" fill="#172d39" font-family="Arial, sans-serif" font-size="24" font-weight="800" letter-spacing="2">${escapeXml(pin.city.toUpperCase())}</text>
      <rect x="70" y="${420 + resourceLines.length * 88}" width="600" height="3" fill="#172d39"/>
      <text x="70" y="${485 + resourceLines.length * 88}" fill="#172d39" font-family="Georgia, serif" font-size="39" font-style="italic">${tspans(promptLines, 70, 485 + resourceLines.length * 88, 50)}</text>
      <g transform="translate(70 1285)">
        <rect width="620" height="82" rx="41" fill="#fffaf0"/>
        <text x="35" y="52" fill="#172d39" font-family="Arial, sans-serif" font-size="24" font-weight="850" letter-spacing="1">STAMP: ${escapeXml(pin.stamp.toUpperCase())}</text>
      </g>
      <text x="70" y="1440" fill="#fffaf0" font-family="Arial, sans-serif" font-size="20" font-weight="750" letter-spacing="2">SAME PARK · MANY WORLDS · POINTCAST.XYZ</text>
    </svg>`;
  await sharp(Buffer.from(svg)).png({ quality: 94, compressionLevel: 9 }).toFile(path.join(outputDir, `pass-25-${pin.id}.png`));
}

await writeFile(path.join(outputDir, 'pins.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  destination: 'https://pointcast.xyz/beach-commons/v18/passport',
  boards: PINTEREST_BOARDS,
  pins: PINTEREST_PINS,
}, null, 2));

console.log(`Generated ${PINTEREST_PINS.length} PASS/25 Pinterest cards in ${outputDir}`);
