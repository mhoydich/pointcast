import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = Array.from(
  { length: 8 },
  (_, index) => `poster-${(index + 1).toString().padStart(2, '0')}.png`,
);

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('Ask the Beach builds popularity into eight explicit fair mechanics', async () => {
  const [page, data, endpoint] = await Promise.all([
    read('src/pages/beach-commons/v17.astro'),
    read('src/lib/beach-commons-v17.ts'),
    read('src/pages/beach-commons/v17.json.ts'),
  ]);

  for (const phrase of [
    'You understand it from the path',
    'Your hands enter in ninety seconds',
    'Something changes because you came',
    'The questions belong to the place',
    'There are many ways to be excellent',
    'Adults and children need each other',
    'The day has an ending worth staying for',
    'Next season can disagree',
  ]) {
    assert.match(data, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(page, /Popularity, built into the apparatus\./);
  assert.match(endpoint, /popularityEngine/);
  assert.match(endpoint, /Popularity is treated as a scientific design constraint/);
});

test('the fair contains seven avenues, twelve experiments, and a five-part booth protocol', async () => {
  const [page, data, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v17.astro'),
    read('src/lib/beach-commons-v17.ts'),
    read('src/pages/beach-commons/v17.json.ts'),
    read('src/content/blocks/0546.json'),
  ]);
  const block = JSON.parse(blockText);

  for (const avenue of [
    'Sun Avenue',
    'Wind Avenue',
    'Water Avenue',
    'Sand Avenue',
    'Sound Avenue',
    'Life Avenue',
    'Materials Avenue',
  ]) {
    assert.match(data, new RegExp(avenue));
  }

  for (const step of ['Question', 'Hook', 'Move', 'Measure', 'Use']) {
    assert.match(data, new RegExp(`step: '${step}'`));
  }

  assert.match(page, /Seven avenues\. Twelve proofs\./);
  assert.match(endpoint, /fairPlan/);
  assert.equal(block.meta.avenues, 7);
  assert.equal(block.meta.experiments, 12);
});

test('the browser-local route builder offers 21 voluntary routes without tracking or writes', async () => {
  const [page, data, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v17.astro'),
    read('src/lib/beach-commons-v17.ts'),
    read('src/pages/beach-commons/v17.json.ts'),
    read('src/content/blocks/0546.json'),
  ]);
  const block = JSON.parse(blockText);

  for (const motive of ['touch', 'build', 'coast', 'compete', 'family', 'beauty', 'blue-hour']) {
    assert.match(data, new RegExp(`(?:id: )?'${motive}'`));
  }

  for (const duration of ['15', '45', '120']) {
    assert.match(page, new RegExp(`data-duration="${duration}"`));
  }

  assert.match(page, /data-route-options/);
  assert.match(page, /aria-live="polite"/);
  assert.doesNotMatch(page, /localStorage|sessionStorage|\bfetch\(/);
  assert.match(endpoint, /networkWrites: false/);
  assert.match(endpoint, /identity: false/);
  assert.equal(block.meta.routeMotives, 7);
  assert.equal(block.meta.routeDurations, 3);
  assert.equal(block.meta.networkWrites, false);
});

test('competition keeps a 100-point evidence score separate from six public awards', async () => {
  const [page, data, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v17.astro'),
    read('src/lib/beach-commons-v17.ts'),
    read('src/pages/beach-commons/v17.json.ts'),
    read('src/content/blocks/0546.json'),
  ]);
  const block = JSON.parse(blockText);

  for (const criterion of ['Question', 'Method', 'Evidence', 'Imagination', 'Public explanation']) {
    assert.match(data, new RegExp(criterion));
  }

  for (const award of [
    'Best Explanation',
    'Most Borrowable',
    'Best Failure',
    'Smallest Big Effect',
    'Most Useful',
    'Audience Keeps',
  ]) {
    assert.match(data, new RegExp(award));
  }

  assert.match(page, /Rigor underneath\. Delight everywhere\./);
  assert.match(endpoint, /Public recognition does not replace method or evidence/);
  assert.equal(block.meta.projectScorePoints, 100);
  assert.equal(block.meta.publicAwards, 6);
});

test('the edition publishes a seven-line public proof and explicit beach, science, and affiliation boundaries', async () => {
  const [page, data, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v17.astro'),
    read('src/lib/beach-commons-v17.ts'),
    read('src/pages/beach-commons/v17.json.ts'),
    read('src/content/blocks/0546.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /The exact question we tested/);
  assert.match(data, /What packed out, and what trace remained/);
  assert.match(page, /This is the fair before the fair\./);
  assert.match(page, /No date, gathering, experiment, school\s+program, competition/);
  assert.match(endpoint, /this is not an ISEF-affiliated fair/);
  assert.match(endpoint, /No GLOBE project, team, data request, or observation campaign is announced/);
  assert.match(endpoint, /Any actual organized visit, tables, chairs, vendors, field trip/);
  assert.match(block.meta.activityBoundary, /no event, experiment, public data collection/);
});

test('V17 includes current official source doors and eight original vertical plates', async () => {
  const [page, data, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v17.astro'),
    read('src/lib/beach-commons-v17.ts'),
    read('src/pages/beach-commons/v17.json.ts'),
    read('src/content/blocks/0546.json'),
  ]);
  const block = JSON.parse(blockText);

  for (const source of [
    'Society for Science',
    'Exploratorium',
    'The GLOBE Program',
    'Los Angeles County Beaches & Harbors',
  ]) {
    assert.match(data, new RegExp(source));
  }

  assert.match(page, /Current source desk · Checked July 29, 2026/);
  assert.match(endpoint, /currentSources/);
  assert.equal(block.meta.visualPlates, 8);

  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/v17/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );
  assert.deepEqual(assets, assetNames.map(() => ({ width: 1024, height: 1536 })));
});

test('V17 has JSON, Block, series, homepage, and discovery twins', async () => {
  const [endpoint, blockText, series, sitemap, llms, llmsFull, homepage, homeEdition, indexPage] =
    await Promise.all([
      read('src/pages/beach-commons/v17.json.ts'),
      read('src/content/blocks/0546.json'),
      read('src/lib/beach-commons-series.ts'),
      read('src/pages/sitemap-discovery.xml.ts'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
      read('src/pages/index.astro'),
      read('src/components/HomeNewEdition.astro'),
      read('src/pages/beach-commons.astro'),
    ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal(block.id, '0546');
  assert.equal(block.author, 'codex');
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v17');
  assert.match(series, /currentEdition: 18/);
  assert.match(series, /blockId: '0546'/);
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v17'/);
  assert.match(llms, /PointCast Field Study 017/);
  assert.match(llmsFull, /ASK THE BEACH/);
  assert.match(series, /slug: 'v17'/);
  assert.match(homeEdition, /href: '\/beach-commons\/v18\/skills'/);
  assert.match(homeEdition, /id: '0548'/);
  assert.match(homeEdition, /id: '0549'/);
  assert.match(indexPage, /Foundation → room → proof → radius → skill\./);
});
