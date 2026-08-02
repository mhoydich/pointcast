#!/usr/bin/env node

import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const output = resolve('public/images/civic-packet-watch/og.png');
await mkdir(resolve('public/images/civic-packet-watch'), { recursive: true });

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#f2eddc"/>
  <rect width="1200" height="58" fill="#c9ff46"/>
  <text x="44" y="37" fill="#10251b" font-family="monospace" font-size="15" font-weight="700" letter-spacing="2">POINTCAST / FIELD EDITION 002 / EL SEGUNDO</text>
  <rect x="692" y="58" width="508" height="572" fill="#10251b"/>
  <g fill="none" stroke="#c9ff46" stroke-width="2" opacity="0.7">
    <circle cx="946" cy="336" r="84"/><circle cx="946" cy="336" r="160"/><circle cx="946" cy="336" r="238"/>
  </g>
  <g fill="#c9ff46"><circle cx="946" cy="336" r="14"/><circle cx="862" cy="255" r="7"/><circle cx="1044" cy="434" r="7"/><circle cx="812" cy="425" r="7"/><circle cx="1080" cy="210" r="7"/></g>
  <text x="734" y="594" fill="#c9ff46" font-family="monospace" font-size="16" font-weight="700" letter-spacing="3">6 SIGNALS / 1 CONFLICT</text>
  <text x="42" y="194" fill="#10251b" font-family="Arial, sans-serif" font-size="106" font-weight="900" letter-spacing="-8">CIVIC</text>
  <text x="42" y="306" fill="#10251b" font-family="Arial, sans-serif" font-size="106" font-weight="900" letter-spacing="-8">PACKET</text>
  <text x="42" y="418" fill="#ff5a3d" font-family="Arial, sans-serif" font-size="106" font-weight="900" letter-spacing="-8">WATCH.</text>
  <text x="47" y="492" fill="#10251b" font-family="Arial, sans-serif" font-size="28" font-weight="700">Agendas appear. Packets change.</text>
  <text x="47" y="530" fill="#10251b" font-family="Arial, sans-serif" font-size="28" font-weight="700">Deadlines disagree. Keep the source attached.</text>
  <rect x="44" y="565" width="444" height="36" fill="#10251b"/>
  <text x="59" y="589" fill="#fffdf6" font-family="monospace" font-size="14" font-weight="700" letter-spacing="1">PUBLIC RESOURCE / HUMAN + JSON + PDF</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(output);
console.log(`wrote ${output}`);
