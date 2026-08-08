import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Georgia Ground Zero publishes a sourced five-input operating-system read', async () => {
  const [data, page, endpoint] = await Promise.all([
    read('src/lib/pointcast-georgia-ground-zero.ts'),
    read('src/pages/25/magazine/georgia-ground-zero.astro'),
    read('src/pages/25/magazine/georgia-ground-zero.json.ts'),
  ]);

  assert.equal((data.match(/name: 'THE [A-Z]+'/g) ?? []).length, 5);
  assert.equal((data.match(/kind: '(?:primary|official-data|reported)'/g) ?? []).length, 17);
  assert.match(page, /Ground zero<br \/>starts in the/);
  assert.match(page, /THE MACHINE WORKS/);
  assert.match(page, /The Hedges/);
  assert.match(endpoint, /machineInputs: GEORGIA_MACHINE_INPUTS\.length/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
});

test('Georgia financial, student, and art claims keep explicit boundaries', async () => {
  const [data, endpoint, blockText] = await Promise.all([
    read('src/lib/pointcast-georgia-ground-zero.ts'),
    read('src/pages/25/magazine/georgia-ground-zero.json.ts'),
    read('src/content/blocks/0566.json'),
  ]);
  const block = JSON.parse(blockText);

  assert.match(data, /reporting categories, not a simple profit statement/);
  assert.match(data, /visualCredit/);
  assert.match(endpoint, /documentaryPhotography: false/);
  assert.match(endpoint, /auditedFinancialAnalysis: false/);
  assert.equal(block.id, '0566');
  assert.equal(block.author, 'codex');
  assert.ok(block.source.length > 0);
  assert.equal(block.meta.machineInputs, 5);
  assert.equal(block.meta.hedgesTestQuestions, 7);
  assert.equal(block.meta.sources, 17);
  assert.equal(block.meta.generatedImageIsDocumentaryPhotography, false);
});

test('Georgia Ground Zero is discoverable from magazine, homepage, app, agents, and Block', async () => {
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

  assert.match(departments, /name: 'Georgia, Ground Zero'/);
  assert.match(magazine, /href="\/25\/magazine\/georgia-ground-zero"/);
  assert.match(magazineJson, /georgiaGroundZeroJson/);
  assert.match(home, /Georgia, Ground Zero/);
  assert.match(homeEdition, /id: '0566'/);
  assert.match(apps, /slug: 'georgia-ground-zero-2026'/);
  assert.match(llms, /Georgia, Ground Zero — Program Desk 001/);
  assert.match(llmsFull, /`\/25\/magazine\/georgia-ground-zero`/);
});

test('Georgia editorial art and social card are checked in at production dimensions', async () => {
  const heroPath = new URL(
    '../public/images/pointcast-georgia-ground-zero/the-machine-and-the-bell.webp',
    import.meta.url,
  );
  const socialPath = new URL(
    '../public/images/pointcast-georgia-ground-zero/social-card.png',
    import.meta.url,
  );
  await Promise.all([access(heroPath), access(socialPath)]);
  const [hero, social] = await Promise.all([
    sharp(fileURLToPath(heroPath)).metadata(),
    sharp(fileURLToPath(socialPath)).metadata(),
  ]);

  assert.equal(hero.width, 1536);
  assert.equal(hero.height, 1024);
  assert.equal(hero.format, 'webp');
  assert.equal(social.width, 1200);
  assert.equal(social.height, 630);
  assert.equal(social.format, 'png');
});
