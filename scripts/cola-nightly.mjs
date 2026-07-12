#!/usr/bin/env node
import { deflateSync } from 'node:zlib';
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

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (~crc) >>> 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([length, typeBytes, data, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (stride + 1);
    raw[row] = 0;
    rgba.copy(raw, row + 1, y * stride, y * stride + stride);
  }
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function hexToRgba(hex) {
  const clean = hex.replace('#', '');
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
    255,
  ];
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function fillRect(rgba, width, height, x, y, w, h, color) {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(width, Math.ceil(x + w));
  const y1 = Math.min(height, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy += 1) {
    for (let xx = x0; xx < x1; xx += 1) {
      const off = (yy * width + xx) * 4;
      rgba[off] = color[0];
      rgba[off + 1] = color[1];
      rgba[off + 2] = color[2];
      rgba[off + 3] = color[3] ?? 255;
    }
  }
}

function fillCircle(rgba, width, height, cx, cy, radius, color, alpha = 255) {
  const x0 = Math.max(0, Math.floor(cx - radius));
  const x1 = Math.min(width, Math.ceil(cx + radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const y1 = Math.min(height, Math.ceil(cy + radius));
  const r2 = radius * radius;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) {
        const off = (y * width + x) * 4;
        rgba[off] = color[0];
        rgba[off + 1] = color[1];
        rgba[off + 2] = color[2];
        rgba[off + 3] = alpha;
      }
    }
  }
}

const GLYPHS = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  A: ['00100', '01010', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  '/': ['00001', '00010', '00100', '01000', '10000', '00000', '00000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
};

function drawGlyph(rgba, width, height, x, y, glyph, scale, color) {
  const pattern = GLYPHS[glyph] || GLYPHS[' '];
  for (let row = 0; row < pattern.length; row += 1) {
    for (let col = 0; col < pattern[row].length; col += 1) {
      if (pattern[row][col] === '1') {
        fillRect(rgba, width, height, x + col * scale, y + row * scale, scale, scale, color);
      }
    }
  }
}

function drawText(rgba, width, height, x, y, text, scale, color, options = {}) {
  let cursor = x;
  const upper = options.uppercase === false ? text : text.toUpperCase();
  for (const ch of upper) {
    drawGlyph(rgba, width, height, cursor, y, ch, scale, color);
    cursor += scale * 6;
  }
}

async function writeFallbackPoster(date, prompt, outPath) {
  const seed = Number.parseInt(stableHash(`${date}:${prompt}`).slice(0, 8), 16);
  const palette = [
    ['#f6e7c8', '#b51f2f', '#1b3b6f', '#f5ba2f'],
    ['#10131c', '#e23d3d', '#f5f0d8', '#3da56a'],
    ['#f9d76e', '#ef476f', '#26547c', '#ffffff'],
    ['#efe8d8', '#7c1d2d', '#0e6157', '#d9a21b'],
  ][seed % 4].map(hexToRgba);

  const width = 1024;
  const height = 1536;
  const rgba = Buffer.alloc(width * height * 4);
  const circleX = 160 + (seed % 540);
  const circleY = 220 + (seed % 180);
  fillRect(rgba, width, height, 0, 0, width, height, palette[0]);
  fillRect(rgba, width, height, 0, 0, width, Math.floor(height * 0.46), palette[1]);
  fillRect(rgba, width, height, 0, Math.floor(height * 0.38), width, Math.floor(height * 0.24), palette[2].map((v) => v));
  for (let band = 0; band < 5; band += 1) {
    const x = -120 + band * 270 + (seed % 90);
    fillRect(rgba, width, height, x, 0, 160, height, [255, 255, 255, 14]);
  }

  fillCircle(rgba, width, height, circleX, circleY, 220, palette[3], 56);
  fillRect(rgba, width, height, 86, 108, 852, 18, palette[3]);
  fillRect(rgba, width, height, 86, 1410, 852, 18, palette[3]);
  fillRect(rgba, width, height, 86, 108, 18, 1320, palette[3]);
  fillRect(rgba, width, height, 920, 108, 18, 1320, palette[3]);
  fillRect(rgba, width, height, 104, 126, 816, 18, [255, 255, 255, 32]);

  drawText(rgba, width, height, 98, 1316, 'NOUNS COLA', 11, palette[3]);
  drawText(rgba, width, height, 98, 1402, `${date} / POINTCAST`, 4, palette[3]);
  drawText(rgba, width, height, 98, 1460, prompt.slice(0, 40), 3, palette[3]);

  await writeFile(outPath, encodePng(width, height, rgba));
  return { ok: true, engine: 'procedural-png', source: 'pure-js-fallback' };
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
  return writeFallbackPoster(date, prompt, outPath);
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
