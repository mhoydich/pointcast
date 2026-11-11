#!/usr/bin/env node
/**
 * Morning Route cover art: a stretch of the 6:45 AM street drawn from the
 * game's own palette, sprites and pixel font, rasterized to a 1200x630 PNG
 * with sharp (already an Astro dependency).
 *
 *   node scripts/generate-morning-route-og.mjs
 *
 * Writes public/images/morning-route/og.png, cover.svg and cover-c64.svg.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { MACHINES } from '../src/lib/breakwater/waves.mjs';
import { eachPixel, textWidth } from '../src/lib/breakwater/font.mjs';
import { ROAD, CURB, WALK, LAWN, HOUSE, PORCH } from '../src/lib/morning-route/route.mjs';
import { paletteFor, eachRect, RIDER_SPRITE, PAPER_SPRITE, BUNDLE_SPRITE, DOG_SPRITES, SPRINKLER_SPRITE, BIN_SPRITE, CAR_SPRITE, SKATER_SPRITE, mailboxSprite } from '../src/lib/morning-route/sprites.mjs';

const OUT = path.resolve(process.cwd(), 'public/images/morning-route');
const W = 1200;
const H = 630;

function pixelText(text, x, y, scale, color) {
  const rects = [];
  eachPixel(text, x, y, scale, (px, py, s) => rects.push(`<rect x="${px}" y="${py}" width="${s}" height="${s}" fill="${color}"/>`));
  return rects.join('');
}

/** The street in game coordinates (288 wide, 290 tall): a lit house with its mailbox, a dark one, a dog, a sprinkler, a paper in flight. */
function street(p) {
  const r = [];
  const add = (x, y, w, h, c) => r.push([x, y, w, h, c]);
  const sp = (sprite, x, y) => eachRect(sprite, x, y, p, (a, b, c, d, col) => add(a, b, c, d, col));
  const FH = 290;
  add(0, 0, ROAD.l, FH, p.gutter);
  add(ROAD.l, 0, ROAD.r - ROAD.l, FH, p.road);
  add(CURB.l, 0, CURB.r - CURB.l, FH, p.curb);
  add(WALK.l, 0, WALK.r - WALK.l, FH, p.walk);
  add(LAWN.l, 0, 288 - LAWN.l, FH, p.lawn);
  for (let y = -6; y < FH; y += 28) add(ROAD.mid - 1, y, 2, 14, p.lane);
  for (let y = 4; y < FH; y += 22) add(WALK.l, y, WALK.r - WALK.l, 1, p.joint);
  // two lots: the upper house is dark, the lower one takes the paper
  const lot = (top, lit, roof) => {
    add(LAWN.l + 16, top - 4, HOUSE.l - 4 - LAWN.l - 16, 6, p.hedge);
    add(HOUSE.l + 8, top + 18, HOUSE.r - HOUSE.l - 8, 96, roof);
    add(HOUSE.l + 8 + 31, top + 18, 2, 96, p.ink);
    add(HOUSE.l, top + 18, 8, 96, lit ? p.wall : p.wallDark);
    for (const wy of [top + 26, top + 40, top + 98]) add(HOUSE.l + 2, wy, 4, 8, lit ? p.lit : p.unlit);
    add(HOUSE.l + 1, top + 66, 6, 14, p.ink);
    add(WALK.r, top + 68, PORCH.l - WALK.r, 10, p.drive);
    add(PORCH.l, top + 60, PORCH.r - PORCH.l, 26, lit ? p.porch : p.porchDark);
    add(WALK.r, top + 110, HOUSE.l - WALK.r, 26, p.drive);
    if (lit) { add(PORCH.r - 4, top + 62, 3, 3, p.lit); sp(mailboxSprite(false), LAWN.l + 3, top + 96); }
  };
  lot(-30, false, p.roofC);
  lot(120, true, p.roofA);
  sp(CAR_SPRITE, LAWN.r - 52, 86);
  sp(SKATER_SPRITE, ROAD.l + 30, 70);
  sp(DOG_SPRITES[0], WALK.l + 4, 132);
  sp(BIN_SPRITE, CURB.l - 8, 48);
  sp(SPRINKLER_SPRITE, LAWN.l + 6, 266);
  for (let i = 1; i <= 6; i += 1) for (const dy of [-3, 0, 3]) add(LAWN.l + 8 - i * 4, 268 + Math.round(dy * (i / 6)) - 1, 2, 2, p.water);
  sp(BUNDLE_SPRITE, ROAD.mid + 16, 236);
  // the paper on its way to the lit porch, with its shadow
  add(170, 202, 6, 2, p.ink);
  sp(PAPER_SPRITE, 170, 192);
  sp(RIDER_SPRITE, 131, 214);
  // HUD
  add(0, 0, 288, 32, p.panel);
  add(0, 31, 288, 1, p.text);
  return r;
}

export function coverSvg(machineId = 'xl') {
  const m = MACHINES[machineId];
  const other = MACHINES[machineId === 'xl' ? 'c64' : 'xl'];
  const p = paletteFor(machineId);
  const fieldX = 70, fieldY = 60, S = 1.75;
  const rects = street(p).map(([x, y, w, h, c]) => {
    const y0 = Math.max(0, y), y1 = Math.min(290, y + h);
    if (y1 <= y0) return '';
    return `<rect x="${(fieldX + x * S).toFixed(2)}" y="${(fieldY + y0 * S).toFixed(2)}" width="${(w * S).toFixed(2)}" height="${((y1 - y0) * S).toFixed(2)}" fill="${c}"/>`;
  }).join('');
  const hud = [
    pixelText('002350', fieldX + 12, fieldY + 10, 4, m.bright),
    pixelText('FLOW', fieldX + Math.round(288 * S / 2) - Math.round(textWidth('FLOW', 4) / 2), fieldY + 10, 4, m.bands.yellow),
  ].join('');
  const rasterBars = m.raster.map((c, i) => `<rect x="0" y="${H - 44 + i * 6}" width="${W}" height="6" fill="${c}" opacity="0.9"/>`).join('');
  const right = 640;
  const soft = machineId === 'xl' ? '#a9b9f5' : '#ffffff';
  const quiet = machineId === 'xl' ? '#6a7fd6' : '#dcd8ff';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
  <rect width="${W}" height="${H}" fill="${m.border === '#000000' ? '#0b0d1a' : m.border}"/>
  ${rects}
  ${hud}
  ${pixelText('MORNING', right, 78, 9, '#ffffff')}
  ${pixelText('ROUTE', right, 138, 9, m.bands.yellow)}
  ${pixelText('DELIVER THE', right, 214, 4, soft)}
  ${pixelText('MORNING EDITION', right, 240, 4, soft)}
  ${pixelText('6:45 AM  EL SEGUNDO', right, 290, 3, '#ffffff')}
  ${pixelText(`${m.name} / ${m.chip}`, right, 330, 3, m.bands.yellow)}
  ${pixelText(`${other.name} / ${other.chip}`, right, 354, 3, quiet)}
  ${pixelText('MOOD  DAWN FLOW RUSH DRIFT', right, 396, 3, soft)}
  ${pixelText('DRAG TO STEER  TAP TO THROW', right, 438, 3, m.paddle)}
  ${pixelText('POINTCAST.XYZ/MORNING-ROUTE', right, 494, 3, '#ffffff')}
  ${pixelText('DIRECTED BY MICHAEL HOYDICH', right, 520, 3, quiet)}
  ${rasterBars}
</svg>`;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const svg = coverSvg('xl');
  await fs.writeFile(path.join(OUT, 'cover.svg'), svg);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(path.join(OUT, 'og.png'));
  await fs.writeFile(path.join(OUT, 'cover-c64.svg'), coverSvg('c64'));
  console.log('wrote', path.relative(process.cwd(), OUT));
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) await main();
