#!/usr/bin/env node
// Photographs of the Almanac notes, made with the ChatGPT image model through
// the Codex CLI. Run on a machine where `codex` is signed in to ChatGPT with
// image generation enabled (the cloud Claude Code container can't reach OpenAI).
//
//   node scripts/almanac-codex-imagegen.mjs            # every shot not yet on disk
//   node scripts/almanac-codex-imagegen.mjs perseids   # shots whose id contains "perseids"
//
// Reference PNGs are rendered from the real SVG faces so the model copies the
// note artwork instead of inventing it. Output lands in
// public/images/currency-builder/almanac/photos/. Brief:
// docs/briefs/2026-10-18-codex-imagegen-almanac.md
import { existsSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { ALMANAC, noteFrontSVG, noteBackSVG } from '../src/lib/currency-builder/almanac.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = 'public/images/currency-builder/almanac/photos';
const REFS = join(tmpdir(), 'almanac-refs');
const KEEP = 'Keep the note artwork exactly as in the reference image, including the full pixel-art character, the year wheel and the words "NOT LEGAL TENDER". No people, no hands, no logos, no other text.';

const SHOTS = [
  { id: 'perseids-blanket', refs: ['the-perseids:front'], aspect: 'Landscape 3:2',
    prompt: 'Night photograph of the attached art note lying on a wool beach blanket on the sand, lit by a dim red flashlight, a thermos and a paper star chart beside it, faint meteor streaks in the dark sky at the top of the frame.' },
  { id: 'southbound-bluff', refs: ['southbound:front'], aspect: 'Landscape 3:2',
    prompt: 'The attached art note resting on a weathered wooden bench rail on a coastal bluff at golden hour, a pair of binoculars beside it, the Pacific behind it out of focus with a faint whale blow on the horizon.' },
  { id: 'el-segundo-blue-notebook', refs: ['el-segundo-blue:front'], aspect: 'Landscape 3:2',
    prompt: 'Overhead photograph of the attached art note tucked into an open field notebook with pencil sketches of coastal dune plants, a sprig of buckwheat flowers and a hand lens beside it, soft morning light on pale sand.' },
  { id: 'grunion-night', refs: ['grunion-watch:front'], aspect: 'Landscape 3:2',
    prompt: 'Low-angle night photograph of the attached art note in a clear waterproof sleeve propped on dry sand above the wet shoreline, moonlight on the foam behind it, a small lantern glowing to one side.' },
  { id: 'king-tide-binder', refs: ['king-tide:front', 'king-tide:back'], aspect: 'Landscape 3:2',
    prompt: 'The front and back of the attached art note in archival sleeves on a page of a tide-chart binder, printed tide tables partly visible, a brass tide clock on the desk, cool winter window light.' },
  { id: 'quarter-board', refs: ['southbound:front', 'grunion-watch:front', 'the-perseids:front', 'santa-ana:front'], aspect: 'Landscape 3:2',
    prompt: 'Four attached art notes pinned in a row to a cork board labeled with small hand-lettered cards for the four quarters, string connecting them, pressed leaves and a shell pinned between them, warm studio light.' },
  { id: 'press-sheet', refs: ['the-perseids:front', 'el-segundo-blue:front', 'southbound:front'], aspect: 'Landscape 3:2',
    prompt: 'Overhead photograph of an uncut press sheet printed with the three attached art notes in a repeating grid, crop marks and color bars in the margins, on a print-shop table with a steel ruler and a linen tester.' },
  { id: 'album-page', refs: ['early-dark:front', 'christmas-count:back'], aspect: 'Portrait 4:5',
    prompt: 'A collector album page with archival sleeves holding the two attached art notes, one front and one back, small typed labels reading "ALMANAC · WEEK 49" and "ALMANAC · WEEK 52", soft gallery light.' },
];

const bySlug = new Map(ALMANAC.currencies.map((entry) => [entry.slug, entry]));

async function ref(spec) {
  const [slug, face] = spec.split(':');
  const entry = bySlug.get(slug);
  if (!entry) throw new Error(`no Almanac note with slug ${slug}`);
  const file = join(REFS, `${slug}-${face}.png`);
  if (!existsSync(file)) {
    const svg = (face === 'back' ? noteBackSVG : noteFrontSVG)(entry).replace('width="150mm" height="75mm"', 'width="2400" height="1200"');
    await sharp(Buffer.from(svg)).png().toFile(file);
  }
  return file;
}

const only = process.argv[2];
const which = spawnSync('codex', ['--version'], { encoding: 'utf8' });
if (which.status !== 0) {
  console.error('codex CLI not found. Install it (npm i -g @openai/codex), sign in with ChatGPT, then rerun.');
  process.exit(1);
}
mkdirSync(REFS, { recursive: true });
mkdirSync(join(ROOT, OUT), { recursive: true });

const results = [];
for (const shot of SHOTS) {
  if (only && !shot.id.includes(only)) continue;
  const out = `${OUT}/${shot.id}.png`;
  if (existsSync(join(ROOT, out))) { results.push([shot.id, 'exists']); continue; }
  const images = (await Promise.all(shot.refs.map(ref))).flatMap((file) => ['-i', file]);
  const prompt = `$imagegen ${shot.prompt} ${KEEP} ${shot.aspect}. Save to ${out}`;
  console.log(`→ ${shot.id}`);
  const run = spawnSync('codex', ['exec', '--cd', ROOT, ...images, prompt], { stdio: 'inherit' });
  results.push([shot.id, existsSync(join(ROOT, out)) ? 'saved' : `missing (codex exit ${run.status})`]);
}
for (const [id, status] of results) console.log(`${status.padEnd(10)} ${id}`);
if (results.some(([, status]) => status.startsWith('missing'))) process.exit(1);
