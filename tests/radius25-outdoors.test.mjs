import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('OPEN/25 publishes 25 official doors across eight human outdoor modes', async () => {
  const [data, blockText] = await Promise.all([
    read('src/lib/radius25-outdoors.ts'),
    read('src/content/blocks/0554.json'),
  ]);
  const block = JSON.parse(blockText);
  const resourceSection = data.split('export const OUTDOOR_RESOURCES')[1].split('export const OUTDOOR_GAMES')[0];
  const modeSection = data.split('export const OUTDOOR_MODES')[1].split('export const OUTDOOR_ARCS')[0];

  assert.equal((resourceSection.match(/number: '\d{2}'/g) || []).length, 25);
  assert.equal((modeSection.match(/number: '\d{2}'/g) || []).length, 8);
  assert.equal(block.meta.publicDoors, 25);
  assert.equal(block.meta.modes, 8);
  assert.equal(block.meta.officialSourceLinks, 25);
  for (const mode of ['Flow', 'Court', 'Field', 'Stretch', 'Art', 'Nature', 'Social', 'Quiet']) {
    assert.match(modeSection, new RegExp(`label: '${mode}'`));
  }
});

test('the directory spans civic parks, courts, paths, gardens, habitat, and coast', async () => {
  const data = await read('src/lib/radius25-outdoors.ts');
  for (const door of [
    'Recreation Park', 'Library Park', 'Campus El Segundo Athletic Fields', 'Dockweiler State Beach',
    'Polliwog Park', 'Manhattan Heights Park', "Bruce's Beach", 'Hermosa Beach', 'Valley Park',
    'Hopkins Wilderness Park', 'Burton W. Chace Park', 'Ballona Creek Bike Path',
    'Venice Beach Recreation Center', 'Culver City Park', 'Baldwin Hills Scenic Overlook',
    'Kenneth Hahn State Recreation Area', 'Cheviot Hills Recreation Center', 'Palisades Park',
    'Tongva Park', 'Charles H. Wilson Park', 'Madrona Marsh Preserve', 'South Coast Botanic Garden',
    'George F Canyon Preserve', 'White Point Nature Preserve', 'Abalone Cove Park / Reserve',
  ]) assert.match(data, new RegExp(door.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

  for (const officialDomain of [
    'elsegundorecparks.gov', 'beaches.lacounty.gov', 'manhattanbeach.gov', 'hermosabeach.gov',
    'redondo.org', 'culvercity.org', 'laparks.org', 'parks.ca.gov', 'parks.lacounty.gov',
    'santamonica.gov', 'torranceca.gov', 'pvplc.org', 'rpvca.gov',
  ]) assert.match(data, new RegExp(officialDomain.replace('.', '\\.')));
});

test('OPEN/25 includes twelve clean-ending games and six bounded movement resets', async () => {
  const data = await read('src/lib/radius25-outdoors.ts');
  const gameSection = data.split('export const OUTDOOR_GAMES')[1].split('export const OUTDOOR_RESETS')[0];
  const resetSection = data.split('export const OUTDOOR_RESETS')[1].split('export const DAY_RECIPES')[0];
  const recipeSection = data.split('export const DAY_RECIPES')[1].split('export const FIELD_ETIQUETTE')[0];

  assert.equal((gameSection.match(/number: '\d{2}'/g) || []).length, 12);
  assert.equal((gameSection.match(/close:/g) || []).length, 12);
  assert.equal((resetSection.match(/duration:/g) || []).length, 6);
  assert.equal((resetSection.match(/option:/g) || []).length, 6);
  assert.equal((recipeSection.match(/title:/g) || []).length, 6);
  assert.match(data, /not medical advice/);
  assert.match(data, /never collect tide life/);
});

test('directory filters and day composer remain browser-local and user controlled', async () => {
  const [page, endpoint] = await Promise.all([
    read('src/pages/beach-commons/v18/outdoors.astro'),
    read('src/pages/beach-commons/v18/outdoors.json.ts'),
  ]);

  for (const hook of ['data-resource-search', 'data-arc-filter', 'data-mode-filter', 'data-maker-form', 'data-copy-day']) {
    assert.match(page, new RegExp(hook));
  }
  assert.match(page, /navigator\.clipboard/);
  assert.doesNotMatch(page, /localStorage|sessionStorage|navigator\.geolocation|\bfetch\(/);
  assert.match(endpoint, /liveAvailabilityLookup: false/);
  assert.match(endpoint, /reservation: false/);
  assert.match(endpoint, /geolocation: false/);
  assert.match(endpoint, /networkWrites: false/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
});

test('OPEN/25 has human, JSON, Block, parent, homepage, sitemap, and LLM twins', async () => {
  const [page, endpoint, blockText, parent, parentJson, home, sitemap, llms, llmsFull, series] = await Promise.all([
    read('src/pages/beach-commons/v18/outdoors.astro'),
    read('src/pages/beach-commons/v18/outdoors.json.ts'),
    read('src/content/blocks/0554.json'),
    read('src/pages/beach-commons/v18.astro'),
    read('src/pages/beach-commons/v18.json.ts'),
    read('src/components/HomeNewEdition.astro'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/pages/beach-commons.astro'),
  ]);
  const block = JSON.parse(blockText);

  assert.equal(block.id, '0554');
  assert.equal(block.author, 'codex');
  assert.equal(block.external.url, 'https://pointcast.xyz/beach-commons/v18/outdoors');
  assert.match(page, /OPEN\/25/);
  assert.match(endpoint, /OPEN_AIR_COMMONS/);
  assert.match(parent, /Open the open-air commons/);
  assert.match(parentJson, /outdoorCompanion/);
  assert.match(home, /id: '0554'/);
  assert.match(home, /href: '\/beach-commons\/v18\/outdoors'/);
  assert.match(sitemap, /beach-commons\/v18\/outdoors\.json/);
  assert.match(llms, /PointCast Field Companion 018\.C/);
  assert.match(llmsFull, /OPEN\/25/);
  assert.match(series, /radius → skill → engineering → outside/);
});

test('OPEN/25 keeps public, nature, radius, and live-condition boundaries explicit', async () => {
  const [data, page, endpoint, blockText] = await Promise.all([
    read('src/lib/radius25-outdoors.ts'),
    read('src/pages/beach-commons/v18/outdoors.astro'),
    read('src/pages/beach-commons/v18/outdoors.json.ts'),
    read('src/content/blocks/0554.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /A public door is not an empty door/);
  assert.match(data, /do not collect shells, rocks, plants, animals, artifacts, or tide-pool life/);
  assert.match(page, /Every door returns to its official steward/);
  assert.match(endpoint, /not measured distance, drive time, jurisdiction, service area, legal boundary, or geofence/);
  assert.match(endpoint, /does not confirm real-time access/);
  assert.equal(block.meta.liveAvailability, false);
  assert.equal(block.meta.medicalAdvice, false);
  assert.equal(block.meta.official, false);
});
