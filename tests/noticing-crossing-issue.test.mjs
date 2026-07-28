import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test('Issue 03 is a complete digital-anthropology field study with two instruments', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/noticing/animal-crossing-gift-economy.astro'),
    read('src/lib/noticing-crossing.ts'),
  ]);

  assert.match(page, /data-crossing-issue/);
  assert.match(page, /data-open-gate/);
  assert.match(page, /createOscillator/);
  assert.match(page, /data-pocket-lab/);
  assert.match(page, /data-pocket-choice="object"/);
  assert.match(page, /data-print-field-sheet/);
  assert.match(page, /data-copy-issue/);
  assert.match(page, /@media print/);
  assert.match(page, /prefers-reduced-motion/);

  assert.match(data, /money leaves so much unfinished/);
  assert.match(data, /A peach is inventory\. Then somebody needs one\. A town begins/);
  for (const economy of ['market', 'debt', 'commons', 'gift', 'reputation']) {
    assert.match(data, new RegExp(`id: '${economy}'`));
  }
});

test('mechanics, player practice, evidence, anthropology, interpretation, and limits stay separated', async () => {
  const [page, data, endpoint] = await Promise.all([
    read('src/pages/noticing/animal-crossing-gift-economy.astro'),
    read('src/lib/noticing-crossing.ts'),
    read('src/pages/noticing/animal-crossing-gift-economy.json.ts'),
  ]);

  for (const label of [
    'Official game structure',
    'Observed game mechanic',
    'Published player research',
    'Anthropological lens',
    'Useful limit',
  ]) {
    assert.match(data, new RegExp(label));
  }
  assert.match(page, /Mechanic, practice, evidence, lens, limit/);
  assert.match(data, /not a Nintendo publication or endorsement/);
  assert.match(endpoint, /not affiliated with or endorsed by Nintendo/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal((data.match(/id: 'S\d\d'/g) ?? []).length, 10);
});

test('Issue 03 has a permanent Block and complete discovery companions', async () => {
  const [blockText, home, sitemap, agents, forAgents, llms, llmsFull, calendar, priorIssue] =
    await Promise.all([
      read('src/content/blocks/0523.json'),
      read('src/pages/index.astro'),
      read('src/pages/sitemap-discovery.xml.ts'),
      read('src/pages/agents.json.ts'),
      read('src/pages/for-agents.astro'),
      read('public/llms.txt'),
      read('public/llms-full.txt'),
      read('src/lib/noticing.ts'),
      read('src/lib/noticing-lacroix.ts'),
    ]);
  const block = JSON.parse(blockText);

  assert.equal(block.id, '0523');
  assert.equal(block.type, 'READ');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.publicationStatus, 'published');
  assert.equal(block.meta.visualPlates, 3);
  assert.equal(block.meta.researchSources, 10);
  assert.equal(block.meta.interactiveInstruments, 2);
  assert.equal(block.meta.notAffiliatedWithNintendo, true);
  assert.match(home, /href="\/noticing\/animal-crossing-gift-economy"/);
  assert.match(sitemap, /pointcast\.xyz\/noticing\/animal-crossing-gift-economy'/);
  assert.match(sitemap, /pointcast\.xyz\/noticing\/animal-crossing-gift-economy\.json'/);
  assert.match(
    agents,
    /noticingAnimalCrossing: 'https:\/\/pointcast\.xyz\/noticing\/animal-crossing-gift-economy'/,
  );
  assert.match(
    agents,
    /noticingAnimalCrossing: 'https:\/\/pointcast\.xyz\/noticing\/animal-crossing-gift-economy\.json'/,
  );
  assert.match(forAgents, /Block <code>0523<\/code>/);
  assert.match(llms, /Block 0523/);
  assert.match(llmsFull, /What I Keep Noticing — Issue 03/);
  assert.match(calendar, /relatedUrl: '\/noticing\/animal-crossing-gift-economy'/);
  assert.match(priorIssue, /url: '\/noticing\/animal-crossing-gift-economy'/);
});

test('three original plates and both social cards have exact production dimensions', async () => {
  const plates = [
    'town-made-of-favors.webp',
    'pocket-is-the-economy.webp',
    'gate-makes-a-public.webp',
  ];

  for (const filename of plates) {
    const file = new URL(
      `../public/images/noticing/animal-crossing-issue-03/${filename}`,
      import.meta.url,
    );
    await access(file);
    const metadata = await sharp(fileURLToPath(file)).metadata();
    assert.deepEqual(
      { width: metadata.width, height: metadata.height, format: metadata.format },
      { width: 1536, height: 1024, format: 'webp' },
    );
  }

  for (const path of [
    '../public/images/noticing/animal-crossing-issue-03-og.png',
    '../public/images/og/b/0523.png',
  ]) {
    const file = new URL(path, import.meta.url);
    await access(file);
    assert.deepEqual(pngSize(await readFile(file)), { width: 1200, height: 630 });
  }
});
