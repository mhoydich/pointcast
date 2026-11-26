/**
 * Office Noun picture for Loom share cards (OFF-31): a real Noun built from the
 * official CC0 trait data (src/lib/loom/noun-data.mjs, generated), drawn as
 * whole-pixel SVG rects at 10x on a 32x32 grid. Decode matches nouns-sdk
 * svg-builder (same as src/lib/nouns-parts.mjs). No network, no fetched images.
 */
import { NOUN_BACKGROUNDS, NOUN_PALETTE, NOUN_PARTS, NOUN_POOL } from './noun-data.mjs';
import { hashString } from '../unfurl/rooms.mjs';

const ORDER = ['body', 'accessory', 'head', 'glasses'];
export const NOUN_SCALE = 10;

/** Room recipes: address (lowercase) -> traits, cool/warm background, one dry line. */
export const ROOMS = {
  '#officenoun': { room: 'lobby', kicker: 'THE LOBBY', parts: ['body-teal-light', 'accessory-glasses-logo', 'head-calendar', 'glasses-square-black'], bg: 'cool', line: 'Say who you are and one thing you make.' },
  '#officenoun-tasks': { room: 'task board', kicker: 'THE TASK BOARD', parts: ['body-bluegrey', 'accessory-tie-red', 'head-chart-bars', 'glasses-square-red'], bg: 'cool', line: 'If it has no owner, it has no date.' },
  '#noon': { room: 'noon', kicker: 'ROOM AT NOON', parts: ['body-gold', 'accessory-sunset', 'head-watch', 'glasses-square-yellow-saturated'], bg: 'warm', line: 'Check the clock, then check each other.' },
  '#work': { room: 'work', kicker: 'THE WORK ROOM', parts: ['body-green', 'accessory-pocket-pencil', 'head-stapler', 'glasses-square-teal'], bg: 'cool', line: 'Post what you shipped, not what you meant to.' },
  '#best-practices': { room: 'best practices', kicker: 'BEST PRACTICES', parts: ['body-grayscale-1', 'accessory-tie-black-on-white', 'head-pencil-tip', 'glasses-square-fullblack'], bg: 'warm', line: 'Write it down once, in plain words.' },
  '#sports': { room: 'sports', kicker: 'THE SPORTS ROOM', parts: ['body-orange', 'accessory-stripes-blit', 'head-basketball', 'glasses-square-black'], bg: 'warm', line: 'Scores, rematches and honest trash talk.' },
};
const INBOX = { room: 'inbox', kicker: 'AN INBOX', parts: ['body-computerblue', 'accessory-id', 'head-mailbox', 'glasses-square-blue'], bg: 'cool', line: 'Counts only. Open the inbox to read.' };

/** Pick the Noun recipe for a summarized thread: a room, an inbox, or a face from the address. */
export function nounRecipe(summary) {
  const addr = String(summary?.address ?? '').toLowerCase();
  if (summary?.inbox) return INBOX;
  if (ROOMS[addr]) return ROOMS[addr];
  const h = hashString(`noun-card:${addr}`);
  const parts = ORDER.map((k, i) => NOUN_POOL[k][Math.floor(h / 16 ** i) % NOUN_POOL[k].length]);
  return { room: null, kicker: 'A LOOM THREAD', parts, bg: (h >>> 20) % 2 ? 'warm' : 'cool', line: '' };
}

/** Decode one part (RLE hex) into [{x,y,w,color}] in grid pixels. */
export function decodePart(hex) {
  const top = parseInt(hex.slice(2, 4), 16), right = parseInt(hex.slice(4, 6), 16), left = parseInt(hex.slice(8, 10), 16);
  let x = left, y = top;
  const out = [];
  for (let i = 10; i + 4 <= hex.length; i += 4) {
    let run = parseInt(hex.slice(i, i + 2), 16);
    const color = parseInt(hex.slice(i + 2, i + 4), 16);
    while (run > 0) {
      const len = Math.min(run, right - x);
      if (len <= 0) break;
      if (color !== 0) out.push({ x, y, w: len, color });
      x += len; run -= len;
      if (x === right) { x = left; y += 1; }
    }
  }
  return out;
}

/** The Noun's pixels (no background) as crisp SVG rects, 320x320 local coordinates. */
export function nounRects(partNames) {
  const rects = [];
  partNames.forEach((name, i) => {
    const hex = NOUN_PARTS[ORDER[i]]?.[name];
    if (!hex) throw new Error(`missing Noun trait ${name}`);
    for (const r of decodePart(hex)) rects.push(`<rect x="${r.x * NOUN_SCALE}" y="${r.y * NOUN_SCALE}" width="${r.w * NOUN_SCALE}" height="10" fill="#${NOUN_PALETTE[r.color]}"/>`);
  });
  return rects.join('');
}

export const nounBackground = (bg) => `#${NOUN_BACKGROUNDS[bg] ?? NOUN_BACKGROUNDS.cool}`;
