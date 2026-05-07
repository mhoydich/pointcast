#!/usr/bin/env node
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { REPO_ROOT, loadBlocks, stableHash } from './lib/oracle-blocks.mjs';

const DATA_DIR = join(REPO_ROOT, 'src/data/first-pour');
const IMAGE_DIR = join(REPO_ROOT, 'public/first-pour');

const WING_SURFACES = [
  '/drum-quintet', '/drum-altars', '/drum-altars-tv',
  '/drum-bell-fall', '/drum-bell-jar', '/drum-pendulum', '/drum-vespers', '/drum-saint',
  '/drum-shrine', '/drum-rosary', '/drum-koan', '/drum-prayer-flag', '/drum-mantra',
  '/drum-aurora', '/drum-lantern', '/drum-bath', '/drum-meditate',
  '/drum-zen', '/drum-tide', '/drum-tape', '/drum-room',
];

function ptDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

async function marketOne(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2d&interval=1d`;
  const response = await fetch(url, { headers: { 'User-Agent': 'pointcast-first-pour/1.0' } });
  if (!response.ok) throw new Error(`${symbol}: ${response.status}`);
  const json = await response.json();
  const result = json.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const closes = (quote?.close || []).filter((n) => typeof n === 'number');
  const last = closes.at(-1);
  const prev = closes.at(-2) || last;
  return { symbol, last, changePct: prev ? ((last - prev) / prev) * 100 : 0 };
}

async function marketsPulse() {
  if (process.env.FIRST_POUR_MARKETS_JSON) {
    try {
      const parsed = JSON.parse(process.env.FIRST_POUR_MARKETS_JSON);
      if (Array.isArray(parsed)) return parsed.slice(0, 4);
    } catch {}
  }

  const symbols = [
    ['SPX', '^GSPC'],
    ['Nasdaq', '^IXIC'],
    ['Bitcoin', 'BTC-USD'],
    ['Oil', 'CL=F'],
    ['Gold', 'GC=F'],
  ];
  try {
    const rows = await Promise.all(symbols.map(async ([label, symbol]) => ({ label, ...(await marketOne(symbol)) })));
    const lineFor = (row) => {
      const dir = row.changePct >= 0 ? 'green' : 'red';
      return `${row.label}: ${Number(row.last).toLocaleString(undefined, { maximumFractionDigits: row.label === 'Bitcoin' ? 0 : 2 })}, ${dir} ${row.changePct.toFixed(2)}%.`;
    };
    const byLabel = Object.fromEntries(rows.map((row) => [row.label, lineFor(row)]));
    return [
      `${byLabel.SPX} Nasdaq follows: ${byLabel.Nasdaq.replace(/^Nasdaq:\s*/, '')}`,
      byLabel.Bitcoin,
      byLabel.Oil,
      byLabel.Gold,
    ];
  } catch (error) {
    return [
      `Tape delayed: ${error.message}.`,
      'SPX/Nasdaq/BTC/oil/gold pull will retry on next pour.',
      'No paid market API is required.',
      'If Yahoo blocks the read, set FIRST_POUR_MARKETS_JSON.',
    ];
  }
}

async function goodFeelsGut(date) {
  const env = process.env.FIRST_POUR_GOOD_FEELS_JSON;
  if (env) {
    try {
      const parsed = JSON.parse(env);
      return [
        `Revenue: ${parsed.revenue ?? 'n/a'}`,
        `Orders: ${parsed.orders ?? 'n/a'}`,
        `AOV: ${parsed.aov ?? 'n/a'}`,
        parsed.read || 'Gut read pending.',
      ];
    } catch {}
  }
  const local = join(REPO_ROOT, 'data/good-feels/daily.json');
  if (existsSync(local)) {
    const parsed = JSON.parse(await readFile(local, 'utf8'));
    const row = parsed[date] || parsed.default || {};
    return [
      `Revenue: ${row.revenue ?? 'n/a'}`,
      `Orders: ${row.orders ?? 'n/a'}`,
      `AOV: ${row.aov ?? 'n/a'}`,
      row.read || 'Local Good Feels feed present, daily row not filled yet.',
    ];
  }
  return ['Revenue: not wired.', 'Orders: not wired.', 'AOV: not wired.', 'Read: connect Shopify/Good Feels daily export when ready.'];
}

async function pointcastDelta() {
  const since = Date.now() - 24 * 3600 * 1000;
  const blocks = (await loadBlocks()).filter((block) => new Date(block.timestamp || 0).getTime() >= since);
  if (blocks.length === 0) return ['No new blocks in the last 24h. Quiet tape.'];
  const byChannel = new Map();
  for (const block of blocks) {
    const list = byChannel.get(block.channel) || [];
    list.push(block);
    byChannel.set(block.channel, list);
  }
  return [...byChannel.entries()].map(([channel, list]) => `CH.${channel}: ${list.length} shipped - ${list.slice(0, 3).map((b) => `${b.id} ${b.title}`).join('; ')}`);
}

function chamberDraw(date) {
  const n = Number.parseInt(stableHash(date).slice(0, 8), 16) % WING_SURFACES.length;
  return WING_SURFACES[n];
}

async function generateHero(date) {
  await mkdir(IMAGE_DIR, { recursive: true });
  const out = join(IMAGE_DIR, `${date}.png`);
  if (existsSync(out)) return out;
  const svg = `
  <svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f9dfb5"/>
        <stop offset="0.48" stop-color="#d88d57"/>
        <stop offset="1" stop-color="#315f66"/>
      </linearGradient>
      <filter id="grain">
        <feTurbulence baseFrequency="0.75" numOctaves="2"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="table" tableValues="0 0.10"/></feComponentTransfer>
      </filter>
    </defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    <rect width="1600" height="900" filter="url(#grain)" opacity="0.55"/>
    <ellipse cx="760" cy="720" rx="360" ry="54" fill="#62341f" opacity="0.22"/>
    <path d="M650 570 C590 370 650 300 755 300 C860 300 930 370 860 570 Z" fill="#f6ead4" stroke="#6f3d28" stroke-width="12"/>
    <path d="M706 285 C690 210 735 180 720 120 C785 174 756 225 785 285" fill="none" stroke="#fff6df" stroke-width="18" stroke-linecap="round" opacity="0.75"/>
    <path d="M800 285 C790 230 835 200 820 150 C885 205 855 245 885 292" fill="none" stroke="#fff6df" stroke-width="16" stroke-linecap="round" opacity="0.55"/>
    <circle cx="760" cy="432" r="86" fill="#d0a06a" opacity="0.28"/>
    <text x="96" y="760" font-family="Arial, sans-serif" font-size="48" fill="#fff8e6" opacity="0.86">FIRST POUR / ${date}</text>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(out);
  return out;
}

const date = process.argv.find((arg) => /^\d{4}-\d{2}-\d{2}$/.test(arg)) || ptDate();
await mkdir(DATA_DIR, { recursive: true });
const hero = await generateHero(date);
const payload = {
  id: `fp-${date}`,
  date,
  generatedAt: new Date().toISOString(),
  permalink: `/first-pour/${date}`,
  heroImage: hero.replace(join(REPO_ROOT, 'public'), ''),
  panels: {
    marketsPulse: await marketsPulse(),
    goodFeelsGut: await goodFeelsGut(date),
    pointcastDelta: await pointcastDelta(),
    chamberDraw: chamberDraw(date),
  },
};

await writeFile(join(DATA_DIR, `${date}.json`), `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify(payload, null, 2));
