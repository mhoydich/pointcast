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

test('Saturday, Rebranded defines exactly 25 original identity directions', async () => {
  const data = await read('src/lib/pointcast-2029.ts');
  const directions = data.split('const identityDirections = [')[1].split('] as const;')[0];

  assert.equal((directions.match(/^\s{4}markName: /gm) || []).length, 25);
  assert.equal((directions.match(/^\s{4}thesis: /gm) || []).length, 25);
  assert.equal((directions.match(/^\s{4}stadium: /gm) || []).length, 25);
  assert.equal((directions.match(/^\s{4}campus: /gm) || []).length, 25);
  assert.equal((directions.match(/^\s{4}gear: /gm) || []).length, 25);
  assert.match(data, /pointcast\.saturday-rebranded\/v1/);
  assert.match(data, /Unofficial speculative editorial design/);
  assert.match(data, /do not replace official identities/);
});

test('the 2029 signal wall is interactive, local-first, and visibly unofficial', async () => {
  const page = await read('src/pages/25/2029/index.astro');

  assert.match(page, /POINTCAST_2029_IDENTITIES\.map/);
  assert.match(page, /data-view-button="stadium"/);
  assert.match(page, /data-view-button="campus"/);
  assert.match(page, /data-view-button="gear"/);
  assert.match(page, /data-conference="saved"/);
  assert.match(page, /pointcast:25-2029:kept/);
  assert.match(page, /Nothing is transmitted/);
  assert.match(page, /UNOFFICIAL VISUAL EXPANSION DRAFT/);
  assert.match(page, /prefers-reduced-motion/);
});

test('all ten 2029 visual plates are checked in at 1024 by 1536', async () => {
  const names = [
    'mark-house-01', 'mark-house-02', 'mark-house-03', 'mark-house-04', 'mark-house-05',
    'stadium-great-lakes', 'stadium-river-night', 'stadium-mountain-rain',
    'gear-transit-kit', 'gear-night-shift',
  ];

  for (const name of names) {
    const path = new URL(`../public/images/pointcast-2029/${name}.png`, import.meta.url);
    await access(path);
    const buffer = await readFile(path);
    assert.deepEqual(pngSize(buffer), { width: 1024, height: 1536 });
    const info = await stat(path);
    assert.ok(info.size > 1_000_000, `${name} should retain visual detail`);
    assert.ok(info.size < 4_000_000, `${name} should remain web-manageable`);
  }
});

test('every 2029 identity has permanent human and CORS-open JSON route templates', async () => {
  const [page, json, identityPage, identityJson] = await Promise.all([
    read('src/pages/25/2029/index.astro'),
    read('src/pages/25/2029.json.ts'),
    read('src/pages/25/2029/[slug].astro'),
    read('src/pages/25/2029/[slug].json.ts'),
  ]);

  assert.match(page, /\/25\/2029\/\$\{identity\.slug\}/);
  assert.match(json, /Access-Control-Allow-Origin/);
  assert.match(json, /POINTCAST_2029_IDENTITIES/);
  assert.match(identityPage, /getStaticPaths/);
  assert.match(identityPage, /PLACE INPUT/);
  assert.match(identityJson, /pointcast\.saturday-rebranded\.identity\/v1/);
  assert.match(identityJson, /approvedPlan: false/);
  assert.match(identityJson, /Access-Control-Allow-Origin/);
});

test('Saturday, Rebranded is discoverable across human and machine PointCast surfaces', async () => {
  const [home, apps, sitemap, agents, forAgents, llms, llmsFull, blockText] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/content/blocks/0524.json'),
  ]);
  const block = JSON.parse(blockText);

  for (const surface of [home, apps, sitemap, agents, forAgents, llms, llmsFull]) {
    assert.match(surface, /25\/2029/);
  }
  assert.match(sitemap, /25\/2029\/\$\{identity\.slug\}/);
  assert.equal(block.id, '0524');
  assert.equal(block.channel, 'BTL');
  assert.equal(block.type, 'READ');
  assert.equal(block.meta.identitySystems, 25);
  assert.equal(block.meta.visualPlates, 10);
  assert.equal(block.meta.official, false);
});

test('the main 2029 social card is a 1200 by 630 PNG', async () => {
  const path = new URL('../public/images/pointcast-2029/social-card.png', import.meta.url);
  await access(path);
  assert.deepEqual(pngSize(await readFile(path)), { width: 1200, height: 630 });
});
