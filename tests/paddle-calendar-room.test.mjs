import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const exists = (path) => existsSync(new URL(path, root));

test('The Paddle Calendar ships its room, dataset, JSON twin, block, and discovery lines', async () => {
  for (const path of [
    'src/data/paddle-calendar.json',
    'src/lib/paddle-calendar.ts',
    'src/pages/paddle-calendar.astro',
    'src/pages/paddle-calendar.json.ts',
    'src/content/blocks/0596.json',
  ]) assert.ok(exists(path), path);

  const [raw, lib, room, block, sitemap, llms] = await Promise.all([
    read('src/data/paddle-calendar.json'),
    read('src/lib/paddle-calendar.ts'),
    read('src/pages/paddle-calendar.astro'),
    read('src/content/blocks/0596.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
  ]);
  const data = JSON.parse(raw);

  // the contract of the page: nothing on the calendar without a source,
  // a confidence mark, and a stated date precision
  const ids = new Set();
  for (const r of data.releases) {
    assert.ok(!ids.has(r.id), `duplicate id ${r.id}`);
    ids.add(r.id);
    assert.match(r.date, /^\d{4}-\d{2}-\d{2}$/, r.id);
    assert.ok(['day', 'month', 'quarter'].includes(r.precision), r.id);
    assert.ok(['high', 'medium', 'low'].includes(r.confidence), r.id);
    assert.ok(['foam', 'hybrid', 'poly', 'rib', 'unknown'].includes(r.build), r.id);
    assert.ok(r.sources.length > 0 && r.sources.every((s) => s.startsWith('https://')), `${r.id} needs a source`);
    assert.ok(r.msrp === null || (r.msrp > 40 && r.msrp < 400), `${r.id} price`);
  }
  assert.deepEqual(data.releases.map((r) => r.date), data.releases.map((r) => r.date).sort(), 'releases are chronological');
  assert.equal(data.meta.counts.releases, data.releases.length);

  // upcoming means upcoming: nothing marked released sits after the as-of date
  for (const r of data.releases) {
    if (r.status === 'upcoming') assert.ok(r.date > data.meta.asOf, r.id);
    else assert.ok(r.date <= data.meta.asOf, `${r.id} is dated after asOf but not marked upcoming`);
  }

  // every forecast says what it rests on; every anchor and trend has a source
  for (const f of data.forecasts) assert.ok(['rule', 'pattern', 'inference', 'legal', 'open'].includes(f.basis), f.call);
  for (const a of data.anchors) assert.ok(a.source.startsWith('https://'), a.title);
  for (const t of data.trends) assert.ok(t.source.startsWith('https://'), t.title);

  // every release's brand has a company file
  const filed = new Set(data.companies.map((c) => c.brand));
  for (const r of data.releases) assert.ok(filed.has(r.brand), `no company file for ${r.brand}`);

  assert.match(lib, /Nothing here is inside information/);
  assert.match(room, /EACH CALL SAYS WHAT IT RESTS ON/);
  assert.match(room, /data-release/);

  const parsed = JSON.parse(block);
  assert.equal(parsed.channel, 'CRT');
  assert.equal(parsed.external.url, 'https://pointcast.xyz/paddle-calendar');
  assert.equal(parsed.meta.releases, data.releases.length);
  assert.match(sitemap, /pointcast\.xyz\/paddle-calendar'/);
  assert.match(llms, /pointcast\.xyz\/paddle-calendar\)/);
});
