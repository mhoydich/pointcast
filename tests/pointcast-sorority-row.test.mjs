import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('House Desk 002 reports the row through architecture, governance, and 2030 playbooks', async () => {
  const [data, page] = await Promise.all([
    read('src/lib/pointcast-sorority-row.ts'),
    read('src/pages/25/magazine/sorority-row.astro'),
  ]);

  for (const phrase of [
    'SEC / BIG TEN — THE ROW SHOWDOWN',
    'THE OPEN LEDGER',
    'THE COMMONS COMPACT',
    'THE LOCAL FACE / NATIONAL BACK OFFICE',
    'national',
    'local',
    'federated',
  ]) assert.match(`${data}\n${page}`, new RegExp(phrase, 'i'));

  assert.equal((data.match(/^\s{6}midjourneyJobId: '[0-9a-f-]{36}'/gm) || []).length, 8);
  assert.doesNotMatch(data, /PENDING/);
  assert.match(page, /data-architect-button/);
  assert.match(page, /data-conference-button/);
  assert.match(page, /prefers-reduced-motion/);
});

test('all eight Midjourney architecture plates are local and web-manageable', async () => {
  const names = [
    'southern-row',
    'northern-row',
    'architect-cut',
    'threshold',
    'saturday-south',
    'saturday-north',
    'missing-house',
    'row-2030',
  ];

  for (const name of names) {
    const path = new URL(`../public/images/pointcast-sorority-row/${name}.webp`, import.meta.url);
    await access(path);
    const buffer = await readFile(path);
    assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WEBP');
    const info = await stat(path);
    assert.ok(info.size > 100_000, `${name} should retain visual detail`);
    assert.ok(info.size < 1_800_000, `${name} should remain web-manageable`);
  }
});

test('the machine edition publishes sources, provenance, and explicit boundaries', async () => {
  const [data, endpoint, headers, blockText] = await Promise.all([
    read('src/lib/pointcast-sorority-row.ts'),
    read('src/pages/25/magazine/sorority-row.json.ts'),
    read('public/_headers'),
    read('src/content/blocks/0534.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /ROW_BY_ROW_SOURCES/);
  assert.match(data, /Stop Campus Hazing Act/);
  assert.match(data, /National Pan-Hellenic Council/);
  assert.match(endpoint, /visualProvenance/);
  assert.match(endpoint, /jobId: plate\.midjourneyJobId/);
  assert.match(endpoint, /conferenceComparisonIsCensus: false/);
  assert.match(endpoint, /representsSpecificChapter: false/);
  assert.match(endpoint, /endorsesHazing: false/);
  assert.match(headers, /\/25\/magazine\/sorority-row\.json[\s\S]*?Access-Control-Allow-Origin: \*/);
  assert.equal(block.id, '0534');
  assert.equal(block.channel, 'SPN');
  assert.equal(block.type, 'READ');
  assert.equal(block.meta.visualPlates, 8);
  assert.equal(block.meta.documentaryPhotographs, false);
});

test('ROW / ROW is discoverable throughout PointCast', async () => {
  const surfaces = await Promise.all([
    read('src/pages/25/magazine/index.astro'),
    read('src/pages/25/magazine.json.ts'),
    read('src/lib/pointcast-college-football-magazine.ts'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('src/pages/index.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  for (const surface of surfaces) {
    assert.match(surface, /sorority-row|ROW_BY_ROW/);
  }
});

test('House Desk 002 has a 1200 by 630 social card', async () => {
  const path = new URL('../public/images/pointcast-sorority-row/social-card.png', import.meta.url);
  await access(path);
  assert.deepEqual(pngSize(await readFile(path)), { width: 1200, height: 630 });
});
