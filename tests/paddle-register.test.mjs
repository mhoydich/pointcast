import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { layerKind, paddlePlate, plateGeometry } from '../src/lib/paddle-drawing.mjs';
import { calendarCard, loadPaddles, paddleCard, registerCard } from '../scripts/og-paddle-cards.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const exists = (path) => existsSync(new URL(path, root));
const isUrl = (s) => typeof s === 'string' && /^https:\/\//.test(s);

test('The Paddle Register ships its pages, JSON twins, runbook, MCP tools, and discovery lines', async () => {
  for (const path of [
    'src/data/paddle-register.json',
    'src/lib/paddle-register.ts',
    'src/lib/paddle-drawing.mjs',
    'src/pages/paddles/index.astro',
    'src/pages/paddles/[id].astro',
    'src/pages/paddles/[id].json.ts',
    'src/pages/paddles/brand/[brand].astro',
    'src/pages/paddles.json.ts',
    'scripts/og-paddle-cards.mjs',
    'docs/runbooks/paddle-register-refresh.md',
    'src/pages/paddles/compare.astro',
    'src/pages/paddles/legal.astro',
    'src/pages/paddles/pros.astro',
    'src/pages/paddles/changes.astro',
    'src/pages/paddles/changes.xml.ts',
    'functions/api/paddles/wear.ts',
    'functions/_lib/paddle-wear.mjs',
    'docs/briefs/2026-09-21-paddle-register-v2.md',
  ]) assert.ok(exists(path), path);

  const [page, index, mcp, sitemap, llms, og] = await Promise.all([
    read('src/pages/paddles/[id].astro'),
    read('src/pages/paddles/index.astro'),
    read('functions/api/mcp.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('scripts/generate-og-images.mjs'),
  ]);

  // the register's honesty: drawings are labelled as drawings, labs keep their numbers
  assert.match(page, /An original drawing, not a product photo/);
  assert.match(page, /does not re-measure paddles or copy a lab's numbers wholesale/);
  assert.match(page, /confirm on the USAP and UPA-A lists before a tournament/);
  assert.match(index, /The labs measure paddles\. This keeps the record\./);

  assert.match(mcp, /name: 'paddle_lookup'/);
  assert.match(mcp, /case 'paddle_lookup': \{/);
  assert.match(mcp, /name: 'paddle_calendar'/);
  assert.match(og, /paddleCard\(paddle\)/);
  assert.match(sitemap, /pointcast\.xyz\/paddles'/);
  assert.match(llms, /pointcast\.xyz\/paddles\)/);
});

test('register data: every paddle is sourced, every enrichment points at a real paddle', async () => {
  const calendar = JSON.parse(await read('src/data/paddle-calendar.json'));
  const register = JSON.parse(await read('src/data/paddle-register.json'));
  const ids = new Set(calendar.releases.map((r) => r.id));

  for (const key of Object.keys(register.enrich)) assert.ok(ids.has(key), `enrich.${key} has no release`);

  const block = JSON.parse(await read('src/content/blocks/0598.json'));
  assert.equal(block.channel, 'CRT');
  assert.equal(block.external.url, 'https://pointcast.xyz/paddles');
  assert.equal(block.meta.paddles, calendar.releases.length + register.backfill.length, 'block 0598 paddle count matches the register');

  for (const p of register.backfill) {
    assert.ok(!ids.has(p.id), `duplicate id ${p.id}`);
    ids.add(p.id);
    assert.match(p.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, p.id);
    assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/, p.id);
    assert.ok(p.date < '2026-01-01', `${p.id} belongs on the 2026 calendar`);
    assert.ok(['day', 'month', 'quarter'].includes(p.precision), p.id);
    assert.ok(['high', 'medium', 'low'].includes(p.confidence), p.id);
    assert.ok(['foam', 'hybrid', 'poly', 'rib', 'unknown'].includes(p.build), p.id);
    assert.ok(p.sources.length > 0 && p.sources.every(isUrl), `${p.id} needs a source`);
    assert.ok(p.msrp === null || (p.msrp > 40 && p.msrp < 400), `${p.id} price`);
    assert.ok(p.take && p.tech, `${p.id} needs a take and a construction line`);
  }

  const enriched = [...Object.entries(register.enrich), ...register.backfill.map((p) => [p.id, p])];
  for (const [id, e] of enriched) {
    for (const lab of e.labs ?? []) assert.ok(isUrl(lab.url) && lab.lab, `${id} lab link`);
    for (const t of e.timeline ?? []) {
      assert.match(t.date, /^\d{4}-\d{2}-\d{2}$/, `${id} timeline date`);
      assert.ok(t.text, `${id} timeline text`);
      if (t.source) assert.ok(isUrl(t.source), `${id} timeline source`);
    }
    for (const v of e.variants ?? []) {
      if (typeof v.lengthIn === 'number') assert.ok(v.lengthIn >= 15 && v.lengthIn <= 17.1, `${id} length ${v.lengthIn}`);
      if (typeof v.widthIn === 'number') assert.ok(v.widthIn >= 7 && v.widthIn <= 8.6, `${id} width ${v.widthIn}`);
      if (typeof v.lengthIn === 'number' && typeof v.widthIn === 'number') assert.ok(v.lengthIn + v.widthIn <= 24.1, `${id} exceeds the 24 in rule (allowing for mm-to-inch rounding)`);
      if (typeof v.handleIn === 'number') assert.ok(v.handleIn >= 4 && v.handleIn <= 6.5, `${id} handle ${v.handleIn}`);
      if (typeof v.thicknessMm === 'number') assert.ok(v.thicknessMm >= 8 && v.thicknessMm <= 20, `${id} thickness ${v.thicknessMm}`);
      if (typeof v.sw === 'number') assert.ok(v.sw >= 85 && v.sw <= 140, `${id} swingweight ${v.sw}`);
      if (typeof v.tw === 'number') assert.ok(v.tw >= 4.5 && v.tw <= 9, `${id} twistweight ${v.tw}`);
    }
  }

  // every brand in the register has a company file somewhere
  // the changes feed: dated, sourced, and pointing at paddles that exist
  const known = new Set([...calendar.releases, ...register.backfill].map((p) => p.id));
  assert.ok(Array.isArray(register.changes) && register.changes.length > 0, 'changes feed is seeded');
  for (const c of register.changes) {
    assert.match(c.date, /^\d{4}-\d{2}-\d{2}$/, 'change date');
    assert.ok(['added', 'shipped', 'approved', 'delisted', 'price', 'corrected', 'signed'].includes(c.kind), `change kind ${c.kind}`);
    assert.ok(c.paddle === null || known.has(c.paddle), `change points at unknown paddle ${c.paddle}`);
    assert.ok(c.text && (!c.source || isUrl(c.source)), 'change text/source');
  }

  const filed = new Set([...calendar.companies, ...(register.companies ?? [])].map((c) => c.brand));
  for (const p of register.backfill) assert.ok(filed.has(p.brand), `no company file for ${p.brand}`);
});

test('the plate draws from published dimensions and says so when it cannot', () => {
  const own = paddlePlate({ variant: { shape: 'Elongated', lengthIn: 16.5, widthIn: 7.5, handleIn: 5.5, thicknessMm: 16 }, build: 'foam', layers: ['EPP center', 'EVA ring', 'EPP perimeter through the handle'], id: 'a' });
  assert.equal(own.geometry.own, true);
  assert.equal(own.layers.length, 3);
  assert.deepEqual(own.layers.map((l) => l.kind), ['foam', 'ring', 'ring']);
  assert.match(own.svg, /16 mm/);
  assert.doesNotMatch(own.svg, /nominal/);

  const nominal = paddlePlate({ variant: undefined, shapes: 'Widebody · Hybrid', build: 'poly', layers: [], id: 'b' });
  assert.equal(nominal.geometry.own, false);
  assert.equal(nominal.geometry.shape, 'hybrid', 'shape words resolve in a fixed priority: elongated, hybrid, widebody, standard');
  assert.match(nominal.svg, /nominal/);
  assert.equal(nominal.layers[0].kind, 'hex');

  assert.equal(plateGeometry({ shape: 'standard' }).widthIn, 8);
  assert.equal(layerKind('SST carbon ribs with EPP foam'), 'rib');
  assert.equal(layerKind('Polypropylene honeycomb'), 'hex');

  // untrusted-looking text cannot break out of the SVG
  const odd = paddlePlate({ variant: { shape: 'elongated', thicknessMm: '16"><script>' }, build: 'foam', id: 'c' });
  assert.doesNotMatch(odd.svg, /<script>/);
});

test('every paddle gets a share card, and the cards are valid SVG', () => {
  const { paddles, calendar } = loadPaddles(new URL('../', import.meta.url).pathname);
  assert.ok(paddles.length >= calendar.releases.length);
  for (const p of paddles) {
    const svg = paddleCard(p);
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="1200" height="630"/, p.id);
    assert.ok(svg.includes(`pointcast.xyz/paddles/${p.id}`), p.id);
    assert.doesNotMatch(svg, /undefined|NaN/, p.id);
  }
  assert.doesNotMatch(registerCard(paddles), /undefined|NaN/);
  assert.doesNotMatch(calendarCard(calendar), /undefined|NaN/);
});
