import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const outDir = path.resolve('public/images/pointcast-25');
const outFile = path.join(outDir, 'board-000.png');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#10100f"/>
  <rect y="0" width="1200" height="18" fill="#f4ff3f"/>
  <text x="-28" y="520" fill="#f4ff3f" font-family="Arial Black, Helvetica, sans-serif" font-size="560" font-weight="900" letter-spacing="-72">25</text>
  <text x="612" y="102" fill="#ffffff" font-family="Arial Black, Helvetica, sans-serif" font-size="58" font-weight="900" letter-spacing="-4">FOR REASONS</text>
  <text x="618" y="137" fill="#aaa9a2" font-family="Menlo, monospace" font-size="14" font-weight="700" letter-spacing="3">BOARD 000 · PRESEASON · JULY 27, 2026</text>
  <line x1="618" y1="168" x2="1140" y2="168" stroke="#696863" stroke-width="1"/>
  <g font-family="Helvetica, Arial, sans-serif">
    <text x="618" y="222" fill="#7d7c76" font-family="Menlo, monospace" font-size="17" font-weight="700">01</text>
    <text x="680" y="222" fill="#ffffff" font-size="31" font-weight="800">OHIO STATE</text>
    <text x="618" y="282" fill="#7d7c76" font-family="Menlo, monospace" font-size="17" font-weight="700">02</text>
    <text x="680" y="282" fill="#ffffff" font-size="31" font-weight="800">NOTRE DAME</text>
    <text x="618" y="342" fill="#7d7c76" font-family="Menlo, monospace" font-size="17" font-weight="700">03</text>
    <text x="680" y="342" fill="#ffffff" font-size="31" font-weight="800">TEXAS</text>
    <text x="618" y="402" fill="#7d7c76" font-family="Menlo, monospace" font-size="17" font-weight="700">04</text>
    <text x="680" y="402" fill="#ffffff" font-size="31" font-weight="800">OREGON</text>
    <text x="618" y="462" fill="#7d7c76" font-family="Menlo, monospace" font-size="17" font-weight="700">05</text>
    <text x="680" y="462" fill="#ffffff" font-size="31" font-weight="800">GEORGIA</text>
  </g>
  <line x1="618" y1="500" x2="1140" y2="500" stroke="#696863" stroke-width="1"/>
  <text x="618" y="545" fill="#f4ff3f" font-family="Helvetica, Arial, sans-serif" font-size="24" font-weight="800">A COLLEGE-FOOTBALL POLL WITH RECEIPTS.</text>
  <text x="618" y="582" fill="#ffffff" font-family="Menlo, monospace" font-size="15" font-weight="700" letter-spacing="2">POINTCAST.XYZ/25</text>
</svg>`;

await mkdir(outDir, { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(outFile);
process.stdout.write(`${outFile}\n`);
