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

test('Saturday Commons defines the complete 12-plate field world', async () => {
  const data = await read('src/lib/pointcast-2029-field-kit.ts');
  const plates = data.split('export const FIELD_KIT_PLATES')[1].split('export const FIELD_KIT_PATTERN_RECIPES')[0];

  assert.equal((plates.match(/^\s{4}id: /gm) || []).length, 12);
  assert.equal((plates.match(/kind: 'stadium'/g) || []).length, 4);
  assert.equal((plates.match(/kind: 'fan'/g) || []).length, 3);
  assert.equal((plates.match(/kind: 'third-space'/g) || []).length, 3);
  assert.equal((plates.match(/kind: 'accessory'/g) || []).length, 2);
  assert.equal((data.match(/^\s{2}\{ id: '[^']+', name: /gm) || []).length, 8);
  assert.match(data, /pointcast\.saturday-commons\.field-kit\/v1/);
  assert.match(data, /Unofficial speculative editorial design/);
});

test('the field kit is a browser-local design instrument', async () => {
  const page = await read('src/pages/25/2029/field-kit/index.astro');

  assert.match(page, /data-pattern-canvas/);
  assert.match(page, /new Path2D/);
  assert.match(page, /data-download-background/);
  assert.match(page, /data-download-stamp/);
  assert.match(page, /pointcast:25-2029:field-kit-stamps/);
  assert.match(page, /const maxStamps = 8/);
  assert.match(page, /data-generate-language/);
  assert.match(page, /data-add-language/);
  assert.match(page, /No upload, account, or telemetry/);
  assert.match(page, /prefers-reduced-motion/);
  assert.doesNotMatch(page, /\bfetch\s*\(/);
});

test('all twelve field-kit plates are checked in at 1024 by 1536', async () => {
  const names = [
    'stadium-transit-porch',
    'stadium-student-end',
    'stadium-band-terrace',
    'stadium-monday-market',
    'fan-arrival-relay',
    'fan-section-radio',
    'fan-afterglow-table',
    'third-space-print-hall',
    'third-space-river-room',
    'third-space-weather-club',
    'accessory-pocket-saturday',
    'accessory-common-carry',
  ];

  for (const name of names) {
    const path = new URL(`../public/images/pointcast-2029-field-kit/${name}.png`, import.meta.url);
    await access(path);
    const buffer = await readFile(path);
    assert.deepEqual(pngSize(buffer), { width: 1024, height: 1536 });
    const info = await stat(path);
    assert.ok(info.size > 1_000_000, `${name} should retain visual detail`);
    assert.ok(info.size < 4_000_000, `${name} should remain web-manageable`);
  }
});

test('the CORS-open JSON twin publishes all tools and all 25 stamps', async () => {
  const [json, identities] = await Promise.all([
    read('src/pages/25/2029/field-kit.json.ts'),
    read('src/lib/pointcast-2029.ts'),
  ]);

  assert.match(json, /Access-Control-Allow-Origin/);
  assert.match(json, /generatedBackgroundPng: true/);
  assert.match(json, /generatedStampPng: true/);
  assert.match(json, /serverUpload: false/);
  assert.match(json, /telemetryAdded: false/);
  assert.match(json, /POINTCAST_2029_IDENTITIES\.map/);
  assert.equal((identities.split('const identityDirections = [')[1].split('] as const;')[0].match(/^\s{4}markName: /gm) || []).length, 25);
});

test('Saturday Commons is discoverable across PointCast surfaces', async () => {
  const [home, apps, sitemap, agents, forAgents, llms, llmsFull, parent, blockText] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/lib/pointcast-2029.ts'),
    read('src/content/blocks/0525.json'),
  ]);
  const block = JSON.parse(blockText);

  for (const surface of [home, apps, sitemap, agents, forAgents, llms, llmsFull, parent]) {
    assert.match(surface, /25\/2029\/field-kit/);
  }
  assert.equal(block.id, '0525');
  assert.equal(block.channel, 'BTL');
  assert.equal(block.type, 'VISIT');
  assert.equal(block.meta.visualPlates, 12);
  assert.equal(block.meta.identityStamps, 25);
  assert.equal(block.meta.patternRecipes, 8);
  assert.equal(block.meta.serverUpload, false);
  assert.equal(block.meta.official, false);
});

test('the field-kit social card is a 1200 by 630 PNG', async () => {
  const path = new URL('../public/images/pointcast-2029-field-kit/social-card.png', import.meta.url);
  await access(path);
  assert.deepEqual(pngSize(await readFile(path)), { width: 1200, height: 630 });
});
