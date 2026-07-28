import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function loadCommonsData() {
  const script = `
    import {
      CREATURE_COMMONS_ARTICLE,
      CREATURE_COMMONS_BOUNDARY,
      CREATURE_COMMONS_DECISIONS,
      CREATURE_COMMONS_GATES,
      CREATURE_COMMONS_META,
      CREATURE_COMMONS_PILOT,
      CREATURE_COMMONS_ROOMS,
      CREATURE_COMMONS_SOURCES,
      CREATURE_COMMONS_SUPPLY_LADDER,
    } from './src/lib/digital-pets-commons.ts';
    process.stdout.write(JSON.stringify({
      article: CREATURE_COMMONS_ARTICLE,
      boundary: CREATURE_COMMONS_BOUNDARY,
      decisions: CREATURE_COMMONS_DECISIONS,
      gates: CREATURE_COMMONS_GATES,
      meta: CREATURE_COMMONS_META,
      pilot: CREATURE_COMMONS_PILOT,
      rooms: CREATURE_COMMONS_ROOMS,
      sources: CREATURE_COMMONS_SOURCES,
      suppliers: CREATURE_COMMONS_SUPPLY_LADDER,
    }));
  `;
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--input-type=module', '-e', script],
    { cwd: new URL('.', root), encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('Creature Commons publishes a position-length essay and bounded charter', () => {
  const commons = loadCommonsData();
  const words = commons.article.paragraphs.join(' ').trim().split(/\s+/).length;
  const sourceIds = new Set(commons.sources.map((source) => source.id));

  assert.ok(words >= 600 && words <= 900, `companion essay has ${words} words`);
  assert.equal(commons.meta.status, 'working proposal');
  assert.match(commons.meta.boundary, /Not incorporated/);
  assert.match(commons.meta.boundary, /No charitable status/);
  assert.equal(commons.decisions.length, 3);
  assert.equal(commons.decisions[0].value, 'Adults first');
  assert.equal(commons.boundary.length, 2);
  assert.equal(commons.rooms.length, 5);
  assert.equal(commons.pilot.length, 4);
  assert.equal(commons.suppliers.length, 5);
  assert.equal(commons.gates.length, 3);
  commons.article.sourceIds.forEach((id) =>
    assert.ok(sourceIds.has(id), `missing essay source ${id}`),
  );
  commons.suppliers.forEach((supplier) =>
    assert.ok(sourceIds.has(supplier.sourceId), `missing supplier source ${supplier.sourceId}`),
  );
});

test('Creature Commons is published across human, JSON, book, office, and discovery surfaces', async () => {
  const [
    page,
    json,
    book,
    bookJson,
    office,
    share,
    sitemap,
    agents,
    forAgents,
    llms,
    llmsFull,
    tasks,
  ] = await Promise.all([
    read('src/pages/digital-pets/commons.astro'),
    read('src/pages/digital-pets/commons.json.ts'),
    read('src/pages/digital-pets.astro'),
    read('src/pages/digital-pets.json.ts'),
    read('src/pages/digital-pets/office.astro'),
    read('src/pages/digital-pets/share.astro'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('TASKS.md'),
  ]);

  assert.match(page, /CREATURE_COMMONS_ARTICLE\.paragraphs\.map/);
  assert.match(page, /WORKING PROPOSAL/);
  assert.match(page, /RESEARCH LIST, NOT ENDORSEMENTS/);
  assert.match(page, /not legal advice/);
  assert.match(json, /\.\.\.CREATURE_COMMONS_META/);
  assert.match(json, /wordCount/);
  assert.match(book, /href="\/digital-pets\/commons"/);
  assert.match(bookJson, /creatureCommons:/);
  assert.match(office, /href="\/digital-pets\/commons"/);
  assert.match(share, /href="\/digital-pets\/commons"/);
  assert.match(share, /Five posts for the days after launch/);
  assert.match(sitemap, /pointcast\.xyz\/digital-pets\/commons\.json/);
  assert.match(agents, /creatureCommons: 'https:\/\/pointcast\.xyz\/digital-pets\/commons\.json'/);
  assert.match(forAgents, /pre-incorporation Creature Commons LA/);
  assert.match(llms, /Companion 01 to Future Book 001/);
  assert.match(llmsFull, /three non-sale reference creatures/);
  assert.match(tasks, /Creature Commons LA — Future Book 001 Companion 01/);
});

test('Plate 07 is a compact portrait WebP project asset', async () => {
  const path = new URL(
    'public/images/digital-pets/plate-07-commons.webp',
    root,
  );
  const pathName = fileURLToPath(path);
  const [file, metadata] = await Promise.all([stat(path), sharp(pathName).metadata()]);

  assert.ok(file.size < 350_000, `${path.pathname} is too large`);
  assert.equal(metadata.width, 1024);
  assert.equal(metadata.height, 1536);
  assert.equal(metadata.format, 'webp');
});
