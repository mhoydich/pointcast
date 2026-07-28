import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const assetNames = [
  '01-commons-brewhouse.png',
  '02-four-waters-table.png',
  '03-bread-honey-hall.png',
  '04-fermentation-relay.png',
  '05-regional-cup.png',
  '06-two-site-circuit.png',
  '07-local-games-field.png',
  '08-nothing-wins-alone.png',
];

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('The Fermentation League publishes a complete eight-plate civic system', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/beach-commons/v13.astro'),
    read('src/lib/beach-commons-v13.ts'),
  ]);

  for (const title of [
    'The Commons Brewhouse',
    'The Four Waters Recipe Table',
    'Bread + Honey Hall',
    'The Fermentation Relay',
    'Coast v Basin v Valley v Foothill',
    'The Two-Site Festival Circuit',
    'The Local Games Field',
    'Nothing Wins Alone',
  ]) {
    assert.match(data, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.match(page, /A brewery can be shared civic equipment/);
  assert.match(page, /Four regions\. One brewhouse\. Nothing wins alone\./);
  assert.match(page, /Brew inland\./);
  assert.match(page, /Play at the coast\./);
  assert.match(page, /aria-label="Fermentation League full image viewer"/);
  assert.match(page, /prefers-reduced-motion/);
});

test('four regional style arguments share a 100-point whole-commons score', async () => {
  const data = await read('src/lib/beach-commons-v13.ts');

  for (const style of [
    'Hop-bright West Coast-style pilsener',
    'Rice lager',
    'Dry honey saison',
    'Rye beer',
  ]) {
    assert.match(data, new RegExp(style));
  }

  const points = [...data.matchAll(/points: (\d+)/g)].map((match) => Number(match[1]));
  assert.equal(points.reduce((sum, point) => sum + point, 0), 100);
  assert.match(data, /Flavor \+ stated intent', points: 25/);
  assert.match(data, /Honey is highly fermentable/);
});

test('the Festival Draft Board is local, private, and not an event registration', async () => {
  const [page, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v13.astro'),
    read('src/pages/beach-commons/v13.json.ts'),
    read('src/content/blocks/0536.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(page, /Festival Draft Board/);
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.match(page, /fields\.team\.textContent = activeTeam\.title/);
  assert.doesNotMatch(page, /localStorage|sessionStorage/);
  assert.doesNotMatch(page, /\bfetch\(/);
  assert.match(endpoint, /storage: false/);
  assert.match(endpoint, /networkWrites: false/);
  assert.match(endpoint, /realRecipe: false/);
  assert.match(endpoint, /realEventRegistration: false/);
  assert.equal(block.meta.localDraftBoard, true);
  assert.equal(block.meta.networkWrites, false);
});

test('production, food, judging, and Dockweiler boundaries stay explicit', async () => {
  const [page, data, endpoint, blockText] = await Promise.all([
    read('src/pages/beach-commons/v13.astro'),
    read('src/lib/beach-commons-v13.ts'),
    read('src/pages/beach-commons/v13.json.ts'),
    read('src/content/blocks/0536.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(page, /no alcohol permits are issued for Dockweiler State Beach/i);
  assert.match(data, /No alcohol, brewing, open container, sale, glass, or drinking game/);
  assert.match(data, /qualified and licensed operation/);
  assert.match(data, /Public bread, honey, beverages, and other food service/);
  assert.match(data, /Beer judging is adults-only/);
  assert.match(endpoint, /No brewery, club, nonprofit, team, batch, recipe/);
  assert.equal(block.meta.alcoholAtDockweiler, false);
  assert.match(block.meta.eventBoundary, /no brewery, batch, club/);
});

test('The Fermentation League has JSON, Block, homepage, and discovery twins', async () => {
  const [endpoint, blockText, sitemap, llms, llmsFull, homepage, homeEdition] =
    await Promise.all([
      read('src/pages/beach-commons/v13.json.ts'),
      read('src/content/blocks/0536.json'),
      read('src/pages/sitemap-discovery.xml.ts'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
      read('src/pages/index.astro'),
      read('src/components/HomeNewEdition.astro'),
    ]);
  const block = JSON.parse(blockText);

  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal(block.id, '0536');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.visualPlates, 8);
  assert.equal(block.meta.regionalTeams, 4);
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v13');
  assert.match(sitemap, /pointcast\.xyz\/beach-commons\/v13'/);
  assert.match(llms, /PointCast Field Study 013/);
  assert.match(llmsFull, /THE FERMENTATION LEAGUE/);
  assert.match(homepage, /href="\/beach-commons\/v13"/);
  assert.match(homepage, /Block 0536/);
  assert.match(homeEdition, /href="\/beach-commons\/v13"/);
  assert.match(homeEdition, /New<br \/>0536/);
});

test('Fermentation League images have intended edition and social dimensions', async () => {
  const assets = await Promise.all(
    assetNames.map(async (name) => {
      const url = new URL(`../public/beach-commons/v13/assets/${name}`, import.meta.url);
      await access(url);
      return pngSize(await readFile(url));
    }),
  );
  assert.deepEqual(assets, assetNames.map(() => ({ width: 1536, height: 1024 })));

  const socialUrl = new URL('../public/images/og/b/0536.png', import.meta.url);
  await access(socialUrl);
  assert.deepEqual(pngSize(await readFile(socialUrl)), { width: 1200, height: 630 });
});
