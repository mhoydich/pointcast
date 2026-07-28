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

test('House Desk 001 publishes six complete rooms and the editorial refusal', async () => {
  const [data, page] = await Promise.all([
    read('src/lib/pointcast-college-house.ts'),
    read('src/pages/25/magazine/the-house-we-borrowed.astro'),
  ]);

  for (const section of [
    'YOU ARE EIGHTEEN AND THE MAP IS WRONG',
    'BROTHERHOOD IS MOSTLY CLEANUP',
    'A ROOM IS ONLY AS GOOD AS WHO CAN USE IT',
    'THE GAME BEGINS BEFORE THE STADIUM',
    'THE HOUSE KEEPS THE SOUND',
    'LEAVE THE PORCH BETTER',
  ]) assert.match(data, new RegExp(section));

  assert.equal((data.match(/^\s{6}id: /gm) || []).length, 6);
  assert.equal((data.match(/^\s{6}midjourneyJobId: '[^']+'/gm) || []).length, 6);
  assert.match(data, /NO ROMANCE FOR HAZING/);
  assert.match(data, /NO NOSTALGIA FOR LOCKED DOORS/);
  assert.match(data, /NO BROTHERHOOD WITHOUT ACCOUNTABILITY/);
  assert.match(page, /data-house-light-button/);
  assert.match(page, /prefers-reduced-motion/);
});

test('all six Midjourney plates are local, web-manageable, and credited', async () => {
  const names = [
    'arrival',
    'kitchen',
    'useful-room',
    'walk-to-the-bowl',
    'morning-after',
    'repair-day',
  ];

  for (const name of names) {
    const path = new URL(`../public/images/pointcast-college-house/${name}.webp`, import.meta.url);
    await access(path);
    const buffer = await readFile(path);
    assert.equal(buffer.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(buffer.subarray(8, 12).toString('ascii'), 'WEBP');
    const info = await stat(path);
    assert.ok(info.size > 100_000, `${name} should retain visual detail`);
    assert.ok(info.size < 1_800_000, `${name} should remain web-manageable`);
  }
});

test('the machine edition carries per-image provenance and a clear editorial boundary', async () => {
  const [data, endpoint, headers, page, blockText] = await Promise.all([
    read('src/lib/pointcast-college-house.ts'),
    read('src/pages/25/magazine/the-house-we-borrowed.json.ts'),
    read('public/_headers'),
    read('src/pages/25/magazine/the-house-we-borrowed.astro'),
    read('src/content/blocks/0533.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /Midjourney V8\.1/g);
  assert.match(endpoint, /visualProvenance/);
  assert.match(endpoint, /jobId: plate\.midjourneyJobId/);
  assert.match(endpoint, /imaginedScene: true/);
  assert.match(endpoint, /documentaryPhotograph: false/);
  assert.match(endpoint, /representsSpecificChapter: false/);
  assert.match(endpoint, /endorsesHazing: false/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.match(headers, /\/25\/magazine\/the-house-we-borrowed\.json[\s\S]*?Access-Control-Allow-Origin: \*/);
  assert.match(page, /VISUALS MADE WITH MIDJOURNEY/);
  assert.equal(block.id, '0533');
  assert.equal(block.channel, 'SPN');
  assert.equal(block.type, 'READ');
  assert.equal(block.meta.visualPlates, 6);
  assert.equal(block.meta.documentaryPhotographs, false);
  assert.equal(block.meta.endorsesHazing, false);
});

test('The House We Borrowed is discoverable throughout PointCast', async () => {
  const surfaces = await Promise.all([
    read('src/pages/25/magazine/index.astro'),
    read('src/pages/25/magazine.json.ts'),
    read('src/lib/pointcast-college-football-magazine.ts'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  for (const surface of surfaces) {
    assert.match(surface, /the-house-we-borrowed|HOUSE_WE_BORROWED/);
  }
});

test('House Desk 001 has a 1200 by 630 social card', async () => {
  const path = new URL('../public/images/pointcast-college-house/social-card.png', import.meta.url);
  await access(path);
  assert.deepEqual(pngSize(await readFile(path)), { width: 1200, height: 630 });
});
