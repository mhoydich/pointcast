import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Lane Kiffin Temperature Check publishes eight sourced preseason readings', async () => {
  const [data, endpoint] = await Promise.all([
    read('src/lib/pointcast-lane-kiffin-temperature.ts'),
    read('src/pages/25/magazine/lane-kiffin-temperature.json.ts'),
  ]);

  assert.equal((data.match(/temperature: \d+,/g) ?? []).length, 8);
  assert.match(data, /overallTemperature: 96/);
  assert.match(data, /status: 'PRESEASON · ZERO GAMES PLAYED'/);
  assert.match(data, /40-player transfer haul/);
  assert.match(data, /seven-year, \$91 million/);
  assert.match(data, /SEP 19 · 2026/);
  assert.match(endpoint, /finebaumCloseIsQuotation: false/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
});

test('Finebaum close is explicitly PointCast synthesis, never presented as a quote', async () => {
  const [data, page, blockText] = await Promise.all([
    read('src/lib/pointcast-lane-kiffin-temperature.ts'),
    read('src/pages/25/magazine/lane-kiffin-temperature.astro'),
    read('src/content/blocks/0553.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /POINTCAST SYNTHESIS · NOT A QUOTATION/);
  assert.match(data, /These words are PointCast’s, not Finebaum’s/);
  assert.match(page, /finebaumBoundary/);
  assert.equal(block.author, 'codex');
  assert.ok(block.source.length > 0);
  assert.equal(block.meta.finebaumCloseIsQuotation, false);
  assert.equal(block.meta.finebaumCloseIsPointCastSynthesis, true);
});

test('Lane Kiffin feature is discoverable from magazine, homepage, apps, agents, and Block', async () => {
  const [departments, magazine, magazineJson, home, homeEdition, apps, llms, llmsFull] =
    await Promise.all([
      read('src/lib/pointcast-college-football-magazine.ts'),
      read('src/pages/25/magazine/index.astro'),
      read('src/pages/25/magazine.json.ts'),
      read('src/pages/index.astro'),
      read('src/components/HomeNewEdition.astro'),
      read('src/lib/pointcast-apps.ts'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
    ]);

  assert.match(departments, /name: 'Kiffin Check'/);
  assert.match(magazine, /href="\/25\/magazine\/lane-kiffin-temperature"/);
  assert.match(magazineJson, /laneKiffinTemperature/);
  assert.match(home, /Lane Kiffin Temperature Check/);
  assert.match(homeEdition, /id: '0553'/);
  assert.match(apps, /slug: 'lane-kiffin-temperature-2026'/);
  assert.match(llms, /Lane Kiffin Temperature Check — Coaches Desk 003/);
  assert.match(llmsFull, /`\/25\/magazine\/lane-kiffin-temperature`/);
});

test('Lane Kiffin social card is a checked-in 1200 by 630 PNG', async () => {
  const socialPath = new URL(
    '../public/images/pointcast-lane-kiffin-temperature/social-card.png',
    import.meta.url,
  );
  await access(socialPath);
  const metadata = await sharp(fileURLToPath(socialPath)).metadata();

  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 630);
  assert.equal(metadata.format, 'png');
});
