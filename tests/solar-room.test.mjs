import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const exists = (path) => existsSync(new URL(path, root));

test('Small Solar ships its room, dataset, JSON twin, block, and discovery lines', async () => {
  for (const path of [
    'src/data/solar-ladder.json',
    'src/lib/solar-ladder.ts',
    'src/pages/solar.astro',
    'src/pages/solar.json.ts',
    'src/content/blocks/0602.json',
  ]) assert.ok(exists(path), path);

  const [raw, lib, room, block, sitemap, llms] = await Promise.all([
    read('src/data/solar-ladder.json'),
    read('src/lib/solar-ladder.ts'),
    read('src/pages/solar.astro'),
    read('src/content/blocks/0602.json'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
  ]);
  const data = JSON.parse(raw);

  // the ladder: four rungs, budgets and panel sizes climb, every part names a real shelf
  assert.equal(data.rungs.length, 4);
  const shelfIds = new Set(data.sources.shelves.map((s) => s.id));
  for (let i = 0; i < data.rungs.length; i += 1) {
    const r = data.rungs[i];
    assert.ok(r.budget[0] < r.budget[1], `${r.id} budget`);
    assert.ok(r.panelsW[0] < r.panelsW[1], `${r.id} panels`);
    assert.ok(r.storage.kwh[0] < r.storage.kwh[1], `${r.id} storage`);
    if (i > 0) {
      assert.ok(r.budget[0] >= data.rungs[i - 1].budget[1] * 0.4, `${r.id} climbs in budget`);
      assert.ok(r.panelsW[0] >= data.rungs[i - 1].panelsW[1] * 0.5, `${r.id} climbs in panels`);
    }
    for (const p of r.parts) assert.ok(shelfIds.has(p.shelf), `${r.id}: part "${p.item}" names unknown shelf ${p.shelf}`);
    assert.ok(r.permit && r.climb, `${r.id} says what the permit is and what carries up`);
  }

  // the shelves: every place is a seller or an agency, https, with a region and the day we saw it
  const seen = new Set();
  let count = 0;
  for (const shelf of data.sources.shelves) {
    assert.ok(shelf.items.length >= 3, `${shelf.id} has at least three places`);
    for (const it of shelf.items) {
      count += 1;
      assert.ok(!seen.has(it.url), `duplicate url ${it.url}`);
      seen.add(it.url);
      assert.ok(it.url.startsWith('https://'), `${it.name} url`);
      assert.ok(['national', 'socal', 'california', 'online', 'international'].includes(it.region), `${it.name} region ${it.region}`);
      assert.match(it.verified, /^\d{4}-\d{2}-\d{2}$/, `${it.name} verified`);
      assert.ok(it.sells.length > 10, `${it.name} says what it sells`);
    }
  }
  assert.ok(count >= 30, `at least thirty places on the shelves, got ${count}`);
  assert.ok(data.sources.shelves.length >= 6, 'at least six shelves');

  // rules and learning carry a source and a day
  assert.ok(data.rules.length >= 6, 'at least six rules');
  for (const r of data.rules) {
    assert.ok(r.url.startsWith('https://'), r.name);
    assert.match(r.verified, /^\d{4}-\d{2}-\d{2}$/, r.name);
    assert.ok(['el segundo', 'california', 'federal', 'utility', 'elsewhere'].includes(r.scope), `${r.name} scope`);
  }
  assert.ok(data.learn.length >= 4, 'at least four places to learn');
  for (const l of data.learn) assert.ok(l.url.startsWith('https://'), l.name);

  // sizing arithmetic matches the lib: panels = load / (sun × eff), battery = night × days / depth
  const s = data.sizing;
  assert.ok(s.peakSunHours > 4 && s.peakSunHours < 6.5, 'El Segundo sun');
  assert.ok(s.systemEfficiency > 0.7 && s.systemEfficiency <= 0.9);
  assert.ok(s.loads.length >= 6);
  assert.match(lib, /Nothing here is electrical advice/);
  assert.match(room, /WE POINT\. THE VENDOR SELLS\.|We point\. The vendor sells\./);
  assert.match(room, /id="sizer"/);
  assert.match(room, /data-source/);

  const parsed = JSON.parse(block);
  assert.equal(parsed.channel, 'ESC');
  assert.equal(parsed.external.url, 'https://pointcast.xyz/solar');
  assert.equal(parsed.meta.rungs, data.rungs.length);
  assert.equal(data.meta.block, parsed.id);
  assert.match(sitemap, /pointcast\.xyz\/solar'/);
  assert.match(llms, /pointcast\.xyz\/solar\)/);
});
