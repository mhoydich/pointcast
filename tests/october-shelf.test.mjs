import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const block = (id) => JSON.parse(read(`src/content/blocks/${id}.json`));

test('homepage leads with Tone Bloom, Tezos, and Standards', () => {
  const latest = JSON.parse(read('src/data/home-latest-projects.json'));
  assert.deepEqual(latest.slice(0, 3).map((item) => item.href), ['/tone-bloom/', '/tezos/', '/standards/']);
  for (const item of latest.slice(0, 3)) {
    assert.ok(existsSync(new URL(`public${item.image}`, root)), item.image);
  }
  const current = JSON.parse(read('src/data/home-current-projects.json'));
  assert.deepEqual(current.slice(0, 3).map((item) => item.href), ['/tone-bloom', '/tezos', '/standards']);
  assert.equal(current.filter((item) => item.id === 'tone-bloom').length, 1);
  assert.equal(current.find((item) => item.id === 'tone-bloom').href, '/tone-bloom');
  assert.match(read('src/components/HomeCurrentProjects.astro'), /October 2026/);
  assert.doesNotMatch(read('src/components/HomeCurrentProjects.astro'), /September 2026/);
});

test('desk claims use one honesty label and the pages share the module', () => {
  const source = read('src/lib/october-shelf.ts');
  const labels = [...source.matchAll(/label: '(fact|reported|speculation)'/g)].map((match) => match[1]);
  assert.equal(labels.length, 16);
  assert.ok(labels.includes('fact') && labels.includes('reported') && labels.includes('speculation'));
  for (const page of ['tone-bloom', 'tezos']) {
    assert.match(read(`src/pages/${page}.astro`), /october-shelf/);
    assert.match(read(`src/pages/${page}.json.ts`), /october-shelf/);
  }
  assert.match(source, /https:\/\/tonebloom\.xyz/);
  assert.match(source, /https:\/\/github\.com\/mhoydich\/tezos-dao-poc/);
  assert.match(source, /not Tezos/);
  assert.doesNotMatch(source, /\b[0-9](?:\.[0-9])?\s*out of\s*5\b|\$[0-9]/i);
});

test('Tone Bloom and Tezos are guest LINK receipts; Standards v2 stays block 0667', () => {
  for (const [id, url] of [
    ['0696', 'https://pointcast.xyz/tone-bloom/'],
    ['0697', 'https://pointcast.xyz/tezos/'],
  ]) {
    const entry = block(id);
    assert.equal(entry.channel, 'FD');
    assert.equal(entry.type, 'LINK');
    assert.equal(entry.author, 'guest');
    assert.match(entry.source, /New Bot/);
    assert.match(entry.source, /Mike Hoydich/);
    assert.match(entry.source, /guest/);
    assert.equal(entry.external.url, url);
    assert.match(entry.body, /not a resident/i);
    assert.equal(entry.meta.byline, 'guest');
  }
  const standards = block('0667');
  assert.match(standards.title, /Standards v2/);
  assert.equal(standards.external.url, 'https://pointcast.xyz/standards/check/');
  const titles = ['0696', '0697'].map((id) => block(id).title);
  assert.ok(titles.every((title) => !/Standards v2/.test(title)));
});

test('agents, llms, and the discovery sitemap name the three routes', () => {
  const agents = read('src/data/agent-surfaces.ts');
  const manifest = read('src/pages/agents.json.ts');
  const sitemap = read('src/pages/sitemap-discovery.xml.ts');
  const llms = read('public/llms.txt');
  for (const path of ['/tone-bloom/', '/tone-bloom.json', '/tezos/', '/tezos.json', '/standards/', '/standards.json']) {
    const url = `https://pointcast.xyz${path}`;
    assert.ok(agents.includes(url) || path.startsWith('/standards'), path);
    assert.ok(sitemap.includes(url), path);
    assert.ok(llms.includes(url), path);
  }
  assert.match(manifest, /octoberShelf/);
  assert.match(manifest, /b\/0667/);
  assert.match(manifest, /standards\.v2|v2:/);
  assert.match(read('src/lib/pointcast-standards.ts'), /b\/0667/);
  assert.doesNotMatch(read('src/data/scoreboard.json'), /"path": "\/tone-bloom"/);
  assert.doesNotMatch(read('src/data/scoreboard.json'), /"path": "\/tezos"/);
});
