import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Western Heat / Brains 25 publishes human, machine, Block, homepage, magazine, and discovery twins', async () => {
  const [page, json, block, home, homeEdition, magazine, apps, llms] = await Promise.all([
    read('src/pages/25/magazine/western-heat-brains.astro'),
    read('src/pages/25/magazine/western-heat-brains.json.ts'),
    read('src/content/blocks/0568.json'),
    read('src/pages/index.astro'),
    read('src/components/HomeNewEdition.astro'),
    read('src/pages/25/magazine/index.astro'),
    read('src/lib/pointcast-apps.ts'),
    read('public/llms.txt'),
  ]);

  assert.match(page, /WESTERN_HEAT_PROGRAMS\.map/);
  assert.match(page, /BRAINS_POWER_25\.map/);
  assert.match(page, /BRAINS_SCOREBOARD\.map/);
  assert.match(page, /application\/json/);
  assert.match(json, /status: 'published'/);
  assert.match(json, /live: true/);
  assert.match(json, /Access-Control-Allow-Origin/);
  assert.match(block, /"id": "0568"/);
  assert.match(block, /"footballHeatScoresAreEditorial": true/);
  assert.match(block, /"resourcesEqualResults": false/);
  assert.match(home, /href="\/25\/magazine\/western-heat-brains"/);
  assert.match(homeEdition, /id: '0568'/);
  assert.match(magazine, /sound-feature--double/);
  assert.match(apps, /slug: 'western-heat-brains-2026'/);
  assert.match(llms, /Western Heat \/ Brains 25 — Special Double Issue 002/);
});

test('the double issue keeps scoring and affiliation boundaries explicit', async () => {
  const [feature, page, block] = await Promise.all([
    read('src/lib/pointcast-western-heat-brains.ts'),
    read('src/pages/25/magazine/western-heat-brains.astro'),
    read('src/content/blocks/0568.json'),
  ]);

  assert.match(feature, /not weather forecasts, betting advice, or win projections/i);
  assert.match(feature, /money measures scale, not discovery quality/i);
  assert.match(feature, /Unlike student competitions remain separate results/i);
  assert.match(feature, /not documentary photography, literal campuses, or official school marks/i);
  assert.match(page, /money is not discovery/i);
  assert.match(block, /"bettingProduct": false/);
  assert.match(block, /"officialSchoolMarks": false/);
});

test('double-issue art ships at editorial and social dimensions', async () => {
  const expected = new Map([
    ['double-field.webp', [1731, 909]],
    ['western-field.webp', [1536, 1024]],
    ['brains-field.webp', [1536, 1024]],
    ['social-card.png', [1200, 630]],
  ]);

  for (const [filename, dimensions] of expected) {
    const metadata = await sharp(
      fileURLToPath(new URL(`public/images/pointcast-western-heat-brains/${filename}`, root)),
    ).metadata();
    assert.deepEqual([metadata.width, metadata.height], dimensions);
  }
});
