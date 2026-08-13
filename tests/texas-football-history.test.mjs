import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('Texas football history publishes human, machine, Block, homepage, magazine, and discovery twins', async () => {
  const [feature, page, json, block, home, homeEdition, magazine, apps, llms, llmsFull] = await Promise.all([
    read('src/lib/pointcast-texas-football-history.ts'),
    read('src/pages/25/magazine/texas-football-history.astro'),
    read('src/pages/25/magazine/texas-football-history.json.ts'),
    read('src/content/blocks/0569.json'),
    read('src/pages/index.astro'),
    read('src/components/HomeNewEdition.astro'),
    read('src/pages/25/magazine/index.astro'),
    read('src/lib/pointcast-apps.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  assert.equal((feature.match(/number: '\d\d'/g) ?? []).length, 10);
  assert.equal((feature.match(/^  \['[^']+', '[^']+', '[^']+', 'https:\/\//gm) ?? []).length, 18);
  assert.match(page, /TEXAS_HISTORY_OBJECTS\.map/);
  assert.match(page, /id="2026"/);
  assert.match(page, /SeasonTicket/);
  assert.match(json, /status: 'published'/);
  assert.match(json, /live: true/);
  assert.match(json, /Access-Control-Allow-Origin/);
  assert.match(block, /"id": "0569"/);
  assert.match(block, /"historyObjects": 10/);
  assert.match(home, /href="\/25\/magazine\/texas-football-history"/);
  assert.match(homeEdition, /id: '0569'/);
  assert.match(magazine, /sound-feature--texas/);
  assert.match(apps, /slug: 'texas-football-history-2026'/);
  assert.match(llms, /The History of Texas Football — Archive Desk 001 \/ Issue 003/);
  assert.match(llmsFull, /Permanent release: `\/b\/0569`/);
});

test('the archive keeps source, affiliation, image, and product boundaries explicit', async () => {
  const [feature, json, block, page] = await Promise.all([
    read('src/lib/pointcast-texas-football-history.ts'),
    read('src/pages/25/magazine/texas-football-history.json.ts'),
    read('src/content/blocks/0569.json'),
    read('src/pages/25/magazine/texas-football-history.astro'),
  ]);

  assert.match(feature, /not affiliated with or endorsed by the University of Texas/i);
  assert.match(feature, /No betting advice, odds, recruiting projection, or merchandise/i);
  assert.match(feature, /not an official school mark, documentary image, uniform, stadium plan/i);
  assert.match(json, /completeHistory: false/);
  assert.match(json, /documentaryPhotography: false/);
  assert.match(block, /"notAffiliatedWithNamedInstitutions": true/);
  assert.match(page, /SONGS ARE ARCHIVES TOO/);
  assert.match(page, /TEXAS_SOURCES\.map/);
});

test('Texas archive art ships at hero and social dimensions', async () => {
  const social = await sharp(
    fileURLToPath(new URL('public/images/pointcast-texas-football-history/social-card.png', root)),
  ).metadata();
  assert.deepEqual([social.width, social.height], [1200, 630]);

  const [heroSvg, socialSvg] = await Promise.all([
    read('public/images/pointcast-texas-football-history/texas-strata.svg'),
    read('public/images/pointcast-texas-football-history/social-card.svg'),
  ]);
  assert.match(heroSvg, /viewBox="0 0 1800 1100"/);
  assert.match(socialSvg, /viewBox="0 0 1200 630"/);
});
