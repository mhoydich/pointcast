import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const gameUrl = 'https://el-segundo-2026-atlas.mhoydich.chatgpt.site/second-shift';
const source = 'Michael Hoydich chat directive, 2026-08-12: create a list of things that should be manufactured locally; create an interesting El Segundo Cookie Clicker-like game around this concept; yep public and put on PointCast as well.';

test('Second Shift is immediately playable on its authored PointCast route', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/second-shift.astro'),
    read('src/lib/second-shift.ts'),
  ]);

  assert.match(page, /data-second-shift-frame/);
  assert.match(page, /loading="eager"/);
  assert.match(page, /allow="autoplay; clipboard-write; fullscreen"/);
  assert.match(page, /allowfullscreen/);
  assert.match(page, /data-fullscreen/);
  assert.match(page, /Open direct/);
  assert.match(page, /href: '\/second-shift\.json'/);
  assert.match(page, /\/images\/second-shift\/social-card\.png/);
  assert.match(data, new RegExp(gameUrl.replaceAll('.', '\\.')));
});

test('Second Shift publishes the exact orders, upgrades, boundaries, and provenance', async () => {
  const [data, packet, headers] = await Promise.all([
    read('src/lib/second-shift.ts'),
    read('src/pages/second-shift.json.ts'),
    read('public/_headers'),
  ]);

  for (const order of [
    'Window latches',
    'Water filter bodies',
    'School desk brackets',
    'Cargo bike racks',
    'Clinic cart casters',
    'Solar mounting rails',
  ]) assert.match(data, new RegExp(order));

  for (const upgrade of [
    'Cut a jig',
    'Share the CAD',
    'Teach the shift',
    'Sort the offcuts',
    'Rooftop microgrid',
  ]) assert.match(data, new RegExp(upgrade));

  assert.match(data, /nominalShiftSeconds: 420/);
  assert.match(data, /The clock continues into overtime/);
  assert.match(data, /productionCapacityAudit: false/);
  assert.match(data, /telemetryAddedForThisGame: false/);
  assert.match(data, /412 truck miles avoided on the dawn receipt/);
  assert.match(data, /source: SECOND_SHIFT_SOURCE/);
  assert.match(packet, /SECOND_SHIFT_ORDERS\.length/);
  assert.match(packet, /SECOND_SHIFT_UPGRADES\.length/);
  assert.match(packet, /SECOND_SHIFT_EVENTS\.length/);
  assert.match(packet, /Access-Control-Allow-Origin/);
  assert.match(headers, /\/second-shift\.json[\s\S]*Access-Control-Allow-Origin: \*/);
});

test('Block 0571 is a truthful CH.ESC app record with the approved directive', async () => {
  const block = JSON.parse(await read('src/content/blocks/0571.json'));

  assert.equal(block.id, '0571');
  assert.equal(block.channel, 'ESC');
  assert.equal(block.type, 'LINK');
  assert.equal(block.title, 'SECOND SHIFT');
  assert.equal(block.author, 'codex');
  assert.equal(block.source, source);
  assert.equal(block.external.url, 'https://pointcast.xyz/second-shift');
  assert.equal(block.media.src, 'https://pointcast.xyz/images/second-shift/social-card.png');
  assert.equal(block.meta.surfaceType, 'APP');
  assert.equal(block.meta.localOrders, 6);
  assert.equal(block.meta.capabilities, 5);
  assert.equal(block.meta.decisionEvents, 3);
  assert.equal(block.meta.logisticsOutputsAreSimulated, true);
  assert.equal(block.meta.productionCapacityAudit, false);
});

test('Second Shift is wired into home, apps, play, sitemap, and agent text', async () => {
  const [home, module, edition, apps, play, playJson, sitemap, llms, llmsFull] = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeSecondShift.astro'),
    read('src/components/HomeNewEdition.astro'),
    read('src/lib/pointcast-apps.ts'),
    read('src/lib/play-layer.ts'),
    read('src/pages/play.json.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  assert.match(home, /<HomeSecondShift \/>/);
  assert.ok(home.indexOf('<HomeSecondShift />') < home.indexOf('<HomeOceanDrum />'));
  assert.match(module, /href="\/second-shift"/);
  assert.match(module, /SIMULATED RECEIPT/);
  assert.match(edition, /id: '0571'[\s\S]*href: '\/second-shift'/);
  assert.match(apps, /slug: 'second-shift'/);
  assert.match(apps, new RegExp(gameUrl.replaceAll('.', '\\.')));
  assert.match(play, /id: 'second-shift'/);
  assert.match(playJson, /secondShift: 'https:\/\/pointcast\.xyz\/second-shift'/);
  assert.match(sitemap, /pointcast\.xyz\/second-shift\.json/);
  assert.match(llms, /## Second Shift/);
  assert.match(llms, /simulated game\s+outputs/);
  assert.match(llmsFull, /\/b\/0571/);
});

test('Second Shift social card is checked in at unfurl dimensions', async () => {
  const image = new URL('public/images/second-shift/social-card.png', root);
  await access(image);
  const metadata = await sharp(fileURLToPath(image)).metadata();

  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
  assert.equal(metadata.format, 'png');
});
