import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('The Saturday Atlas contains the complete current NCAA Division I football field', async () => {
  const programs = JSON.parse(await read('src/data/division-one-football-programs.json'));
  assert.equal(programs.length, 266);
  assert.equal(programs.filter((program) => program.subdivision === 'FBS').length, 138);
  assert.equal(programs.filter((program) => program.subdivision === 'FCS').length, 128);
  assert.equal(programs.filter((program) => program.hbcu).length, 21);
  assert.equal(new Set(programs.map((program) => program.ncaaId)).size, 266);
  assert.equal(new Set(programs.map((program) => program.officialName)).size, 266);
  assert.ok(programs.every((program) => program.institutionUrl?.startsWith('https://')));
  assert.ok(programs.every((program) => program.athleticsUrl?.startsWith('https://')));
});

test('the human directory keeps ranking and browse order visibly separate', async () => {
  const [feature, page, json, block] = await Promise.all([
    read('src/lib/pointcast-division-one-directory.ts'),
    read('src/pages/25/directory.astro'),
    read('src/pages/25/directory.json.ts'),
    read('src/content/blocks/0570.json'),
  ]);

  assert.match(feature, /Only the first 25 programs carry a PointCast football rank/);
  assert.match(feature, /Positions 26–266 are browse order/);
  assert.match(page, /THE TOP 25 IS A RANKING/);
  assert.match(page, /THE OTHER 241 ARE A DIRECTORY/);
  assert.match(page, /DIVISION_ONE_PROGRAMS\.map/);
  assert.match(page, /data-atlas-search/);
  assert.match(page, /data-atlas-sort/);
  assert.match(page, /pointcast:d1-shortlist:v1/);
  assert.match(json, /Access-Control-Allow-Origin/);
  assert.match(block, /"id": "0570"/);
});

test('the directory is integrated across PointCast discovery and current home surfaces', async () => {
  const surfaces = await Promise.all([
    read('src/pages/index.astro'),
    read('src/components/HomeNewEdition.astro'),
    read('src/pages/25/index.astro'),
    read('src/pages/25/magazine/index.astro'),
    read('src/pages/25/magazine.json.ts'),
    read('src/lib/pointcast-apps.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/data/press-releases.json'),
  ]);

  for (const surface of surfaces) {
    assert.match(surface, /25\/directory|DIVISION_ONE_DIRECTORY\.(canonical|machineEdition)/);
  }
});

test('directory artwork ships as SVG and a 1200 by 630 PNG', async () => {
  const [svg, png] = await Promise.all([
    read('public/images/pointcast-d1-directory/social-card.svg'),
    readFile(new URL('public/images/pointcast-d1-directory/social-card.png', root)),
  ]);
  assert.match(svg, /viewBox="0 0 1200 630"/);
  assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
});
