#!/usr/bin/env node
/**
 * Writes public/images/stretch/stretch-card.svg (1200 x 630) from the same
 * pixel figure /stretch draws on canvas, so the card and the room match.
 * The OG PNG at public/images/og/stretch.png is a screenshot of this SVG.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { frameAt, getPose, moodColor, rasterize } from '../src/lib/stretch.mjs';

const out = resolve(import.meta.dirname, '../public/images/stretch/stretch-card.svg');
const W = 1200;
const H = 630;
const rects = [];

function figure(poseId, mood, x0, y0, px) {
  const p = getPose(poseId);
  rects.push(`<rect x="${x0}" y="${y0}" width="${48 * px}" height="${48 * px}" fill="#140f33"/>`);
  for (const [k, layer] of rasterize(frameAt(p, 1), p.setting)) {
    const [x, y] = k.split(',').map(Number);
    const fill = layer === 'prop' ? '#5a4bb0' : layer === 'head' ? '#F2F0FF' : moodColor(mood);
    rects.push(`<rect x="${x0 + x * px}" y="${y0 + y * px}" width="${px}" height="${px}" fill="${fill}"/>`);
  }
}

const px = 6;
const size = 48 * px;
const gap = 24;
const left = (W - (size * 3 + gap * 2)) / 2;
figure('neck-tilt', 'calm', left, 236, px);
figure('chest-opener', 'sunny', left + size + gap, 236, px);
figure('childs-pose', 'salty', left + 2 * (size + gap), 236, px);

const stripes = ['#E8453C', '#F28C28', '#F5D142', '#58B947', '#2F86D8', '#7E57B5']
  .map((c, i) => `<rect x="84" y="${78 + i * 10}" width="44" height="7" fill="${c}"/>`)
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="crispEdges">
<rect width="${W}" height="${H}" fill="#7869C4"/>
<rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="#40318D"/>
${stripes}
<text x="146" y="128" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="56" font-weight="800" fill="#F2F0FF" letter-spacing="2">STRETCH WITH CLAUDE</text>
<text x="146" y="178" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="26" fill="#BDB4F0" letter-spacing="3">2 · 5 · 8 MIN BREAKS FOR PHONE NECKS AND DESK BACKS</text>
${rects.join('\n')}
<text x="${W - 84}" y="${H - 58}" text-anchor="end" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="22" fill="#BDB4F0" letter-spacing="3">POINTCAST.XYZ/STRETCH</text>
</svg>
`;

mkdirSync(resolve(out, '..'), { recursive: true });
writeFileSync(out, svg);
console.log(`wrote ${out}`);
