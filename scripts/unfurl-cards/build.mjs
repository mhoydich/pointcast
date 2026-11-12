#!/usr/bin/env node
// Unfurl cards (link-preview images) for Baby Bonfire, Coast Commons and House Channel.
//   node scripts/unfurl-cards/build.mjs             draw every card.png and put its tags in the pages
//   node scripts/unfurl-cards/build.mjs --check     exit 1 if a card or a page's tags are out of step
//   node scripts/unfurl-cards/build.mjs --svg=DIR   also write each card's SVG into DIR, to look at
// Each card is a static 1200x630 PNG beside its page (public/<area>/.../card.png), like
// /light/card.png. It is drawn with resvg and the Inter and JetBrains Mono subsets already in
// functions/og/kennel-club/, the way scripts/og-motion.mjs draws its frames, so the same input
// gives the same file on any machine. The page list and the words are in cards.mjs, the
// drawings in draw.mjs. After a change here: run it, look at the PNGs, commit them.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { CARDS, GENERATED, H, ROOT, TWINS, W, pageFile, pngFile, scenesWithoutCard, stale, stampHead, withPageIndex } from './cards.mjs';

const args = process.argv.slice(2);
const check = args.includes('--check');
const svgDir = args.find((a) => a.startsWith('--svg='))?.slice(6);

// Not an error: a scene that joined the street after its neighbours keeps the request-time card.
const waiting = scenesWithoutCard();
const note = waiting.length ? `\nnote: ${waiting.length} Baby Bonfire scene${waiting.length > 1 ? 's have' : ' has'} no card yet (${waiting.join(', ')}). Add a row to SCENES in cards.mjs and run this again.` : '';

if (check) {
  const out = stale();
  for (const line of out) console.error(`stale: ${line}`);
  if (out.length) process.exit(1);
  console.log(`unfurl cards: ${CARDS.length} cards and their pages are in step${note}`);
  process.exit(0);
}

const { Resvg, initWasm } = await import('@resvg/resvg-wasm');
const { cardSvg, type } = await import('./draw.mjs');
await initWasm(readFileSync(createRequire(import.meta.url).resolve('@resvg/resvg-wasm/index_bg.wasm')));
const fonts = ['inter-latin.bin', 'jetbrains-mono-latin.bin'].map((f) => new Uint8Array(readFileSync(resolve(ROOT, 'functions/og/kennel-club', f))));
const font = { loadSystemFonts: false, fontBuffers: fonts, defaultFontFamily: 'Inter', sansSerifFamily: 'Inter', monospaceFamily: 'JetBrains Mono Variable' };

const widths = new Map();
/** The drawn width of one line of type, in card pixels. */
function measure(line) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="400" viewBox="0 0 4000 400">${type({ ...line, x: 200, y: 250, anchor: 'start' })}</svg>`;
  if (!widths.has(svg)) {
    const r = new Resvg(svg, { font });
    widths.set(svg, r.getBBox()?.width ?? 0);
    r.free();
  }
  return widths.get(svg);
}

let drawn = 0;
for (const card of CARDS) {
  const { svg, lines, column, photo } = cardSvg(card, measure);
  // Nothing may run past its column, and the two ends of the foot may not meet.
  for (const line of lines.filter((l) => l.anchor !== 'end')) {
    if (line.x + measure(line) > column[1] + 1) throw new Error(`unfurl cards: "${line.text}" on ${card.path} is ${Math.round(measure(line))} wide; the column is ${column[1] - column[0]}`);
  }
  const [mark, status] = lines.slice(-2);
  if (mark.x + measure(mark) + 48 > status.x - measure(status)) throw new Error(`unfurl cards: the foot of ${card.path} is too crowded`);
  const r = new Resvg(svg, { font, fitTo: { mode: 'width', value: W } });
  const image = r.render();
  if (image.width !== W || image.height !== H) throw new Error(`unfurl cards: ${card.path} drew at ${image.width}x${image.height}`);
  let png = Buffer.from(image.asPng());
  // A photograph does not fit a plain PNG in a link preview's size budget: reduce it to a palette (sharp, already a dependency).
  if (photo) png = await (await import('sharp')).default(png).png({ palette: true, colours: 96, dither: 0.6, effort: 10 }).toBuffer();
  r.free();
  const file = resolve(ROOT, pngFile(card));
  if (!existsSync(file) || !readFileSync(file).equals(png)) { writeFileSync(file, png); drawn += 1; }
  if (svgDir) {
    mkdirSync(svgDir, { recursive: true });
    writeFileSync(resolve(svgDir, `${card.path.replace(/^\/|\/$/g, '').replace(/\//g, '--')}.svg`), svg);
  }
}

// Hand-written pages get their tags here. Coast Commons pages come from their own generators,
// which read the same card list, so run those after the PNGs are in place.
let stamped = 0;
for (const card of CARDS.filter((c) => !GENERATED(c))) {
  const file = resolve(ROOT, pageFile(card));
  const html = readFileSync(file, 'utf8');
  const next = stampHead(html, card);
  if (next !== html) { writeFileSync(file, next); stamped += 1; }
}
// The hand-written JSON twins list every public page of their area.
for (const area of TWINS) {
  const file = resolve(ROOT, `public/${area}.json`);
  const text = readFileSync(file, 'utf8');
  const next = withPageIndex(text, area);
  if (next !== text) { writeFileSync(file, next); stamped += 1; }
}
for (const script of ['scripts/coast-commons-studies/build.mjs', 'scripts/coast-commons/build.mjs']) {
  execFileSync(process.execPath, [resolve(ROOT, script)], { cwd: ROOT, stdio: 'pipe' });
}
const left = stale();
if (left.length) throw new Error(`unfurl cards: still out of step after a build:\n${left.join('\n')}`);
console.log(`unfurl cards: ${CARDS.length} cards (${drawn} redrawn), ${stamped} pages restamped, Coast Commons pages regenerated${note}`);
