#!/usr/bin/env node
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { REPO_ROOT, loadBlocks, nextBlockId, stableHash } from './lib/oracle-blocks.mjs';

const COLA_DIR = join(REPO_ROOT, 'public/cola');
const STATE_DIR = join(REPO_ROOT, '.pointcast/cola');
const PROMPTS_PATH = join(REPO_ROOT, 'data/cola/prompts.txt');
const LORA_PATH = join(STATE_DIR, 'lora.safetensors');
const TRAINING_SET = [
  join(REPO_ROOT, 'public/images/nouns-cola/ads-generated-v2/poster-01-hero.png'),
  join(REPO_ROOT, 'public/images/nouns-cola/ads-generated-v2/poster-02-night.png'),
  join(REPO_ROOT, 'public/images/nouns-cola/ads-generated-v2/poster-03-pop.png'),
  join(REPO_ROOT, 'public/images/nouns-cola/ads-generated-v2/poster-04-mural.png'),
];

function isoDate(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

function promptFor(date, prompts) {
  const seed = Number.parseInt(stableHash(date).slice(0, 8), 16);
  return prompts[seed % prompts.length];
}

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    timeout: options.timeout || 30 * 60 * 1000,
    maxBuffer: 30 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function trainLoraIfMissing() {
  await mkdir(STATE_DIR, { recursive: true });
  if (existsSync(LORA_PATH)) return { ok: true, trained: false, path: LORA_PATH };
  if (process.env.KOHYA_TRAIN_COMMAND) {
    const cmd = process.env.KOHYA_TRAIN_COMMAND
      .replaceAll('{images}', TRAINING_SET.map((p) => JSON.stringify(p)).join(' '))
      .replaceAll('{out}', JSON.stringify(LORA_PATH));
    const result = run('sh', ['-lc', cmd], { timeout: 3 * 60 * 60 * 1000 });
    return { ok: result.status === 0 && existsSync(LORA_PATH), trained: result.status === 0, path: LORA_PATH, stderr: result.stderr?.slice(0, 500) };
  }
  await writeFile(join(STATE_DIR, 'LORA_REQUIRED.md'), [
    '# Nouns Cola LoRA hook',
    '',
    'Set KOHYA_TRAIN_COMMAND with `{images}` and `{out}` placeholders to train the 4-poster set into `.pointcast/cola/lora.safetensors`.',
    '',
    'The nightly generator uses a deterministic local poster fallback until that command is configured.',
  ].join('\n'));
  return { ok: false, trained: false, path: LORA_PATH, warning: 'KOHYA_TRAIN_COMMAND not set' };
}

async function generateWithLocalModel(date, prompt, outPath) {
  const command = process.env.COLA_IMAGE_COMMAND;
  if (!command) return { ok: false, engine: 'procedural-sharp' };
  const shell = command
    .replaceAll('{prompt}', JSON.stringify(prompt))
    .replaceAll('{date}', JSON.stringify(date))
    .replaceAll('{lora}', JSON.stringify(LORA_PATH))
    .replaceAll('{out}', JSON.stringify(outPath));
  const result = run('sh', ['-lc', shell], { timeout: 45 * 60 * 1000 });
  return { ok: result.status === 0 && existsSync(outPath), engine: 'local-diffusion', stderr: result.stderr?.slice(0, 500) };
}

async function generateFallbackPoster(date, prompt, outPath) {
  const seed = Number.parseInt(stableHash(`${date}:${prompt}`).slice(0, 8), 16);
  const base = TRAINING_SET[seed % TRAINING_SET.length];
  const palette = [
    ['#f6e7c8', '#b51f2f', '#1b3b6f', '#f5ba2f'],
    ['#10131c', '#e23d3d', '#f5f0d8', '#3da56a'],
    ['#f9d76e', '#ef476f', '#26547c', '#ffffff'],
    ['#efe8d8', '#7c1d2d', '#0e6157', '#d9a21b'],
  ][seed % 4];

  const svg = `
  <svg width="1024" height="1536" viewBox="0 0 1024 1536" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${palette[0]}"/>
        <stop offset="0.55" stop-color="${palette[1]}"/>
        <stop offset="1" stop-color="${palette[2]}"/>
      </linearGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="table" tableValues="0 0.13"/></feComponentTransfer>
      </filter>
    </defs>
    <rect width="1024" height="1536" fill="url(#bg)"/>
    <rect width="1024" height="1536" filter="url(#grain)" opacity="0.5"/>
    <circle cx="${160 + (seed % 540)}" cy="${220 + (seed % 180)}" r="220" fill="${palette[3]}" opacity="0.22"/>
    <rect x="86" y="108" width="852" height="1320" rx="42" fill="none" stroke="${palette[3]}" stroke-width="18" opacity="0.9"/>
    <text x="96" y="1360" font-family="Arial Black, Impact, sans-serif" font-size="76" fill="${palette[3]}" letter-spacing="3">NOUNS COLA</text>
    <text x="96" y="1440" font-family="JetBrains Mono, monospace" font-size="24" fill="${palette[3]}">${date} / POINTCAST</text>
  </svg>`;

  const baseLayer = await sharp(base)
    .resize(760, 1060, { fit: 'cover' })
    .modulate({ saturation: 1.18, brightness: 1.02 })
    .png()
    .toBuffer();

  await sharp(Buffer.from(svg))
    .composite([
      { input: baseLayer, left: 132, top: 210, blend: 'over' },
      { input: Buffer.from(`<svg width="760" height="1060"><rect width="760" height="1060" fill="none" stroke="${palette[3]}" stroke-width="14"/></svg>`), left: 132, top: 210 },
    ])
    .png()
    .toFile(outPath);
  return { ok: true, engine: 'procedural-sharp', source: base };
}

async function writePosterBlock(date, prompt, imagePath, engine) {
  const blocks = await loadBlocks({ includeDrafts: true });
  const existing = blocks.find((block) => block.meta?.series === 'nouns-cola-nightly' && block.meta?.date === date);
  if (existing) return { id: existing.id, skipped: true };
  const id = await nextBlockId();
  const publicPath = imagePath.replace(join(REPO_ROOT, 'public'), '');
  const block = {
    id,
    channel: 'GF',
    type: 'READ',
    title: `Nouns Cola poster · ${date}`,
    dek: prompt,
    timestamp: new Date(`${date}T03:00:00Z`).toISOString(),
    size: '2x2',
    noun: Number(id),
    readingTime: '1 min',
    body: `Nightly Nouns Cola poster generated for ${date}.\n\nPrompt: ${prompt}\n\nEngine: ${engine}. The wall keeps the running sequence at /nouns-cola/wall.`,
    media: { kind: 'image', src: publicPath },
    external: { label: 'Open Nouns Cola wall', url: 'https://pointcast.xyz/nouns-cola/wall' },
    author: 'codex',
    source: 'scripts/cola-nightly.mjs local nightly poster pipeline',
    mood: 'cola-wall',
    meta: {
      series: 'nouns-cola-nightly',
      date,
      prompt,
      image: publicPath,
      engine,
      lora: existsSync(LORA_PATH) ? LORA_PATH.replace(`${REPO_ROOT}/`, '') : null,
    },
  };
  await writeFile(join(REPO_ROOT, `src/content/blocks/${id}.json`), `${JSON.stringify(block, null, 2)}\n`);
  return { id, skipped: false };
}

const dateArg = process.argv.find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg));
const date = dateArg || isoDate();
await mkdir(COLA_DIR, { recursive: true });
await mkdir(STATE_DIR, { recursive: true });

const prompts = (await readFile(PROMPTS_PATH, 'utf8')).split('\n').map((line) => line.trim()).filter(Boolean);
const prompt = promptFor(date, prompts);
const outPath = join(COLA_DIR, `${date}.png`);
const lora = await trainLoraIfMissing();

let image = existsSync(outPath) ? { ok: true, engine: 'existing' } : await generateWithLocalModel(date, prompt, outPath);
if (!image.ok) image = await generateFallbackPoster(date, prompt, outPath);
const block = await writePosterBlock(date, prompt, outPath, image.engine);

console.log(JSON.stringify({
  ok: true,
  date,
  prompt,
  image: outPath.replace(`${REPO_ROOT}/`, ''),
  lora,
  engine: image.engine,
  block,
}, null, 2));
