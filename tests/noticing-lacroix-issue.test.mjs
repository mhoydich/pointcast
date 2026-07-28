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

test('Issue 02 is a complete visual ritual essay with two working instruments', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/noticing/why-lacroix.astro'),
    read('src/lib/noticing-lacroix.ts'),
  ]);

  assert.match(page, /data-lacroix-issue/);
  assert.match(page, /data-crack/);
  assert.match(page, /createBuffer/);
  assert.match(page, /data-flavor-lab/);
  assert.match(page, /data-choice="temperature"/);
  assert.match(page, /data-print-field-sheet/);
  assert.match(page, /data-copy-issue/);
  assert.match(page, /@media print/);
  assert.match(page, /prefers-reduced-motion/);

  assert.match(data, /LaCroix works because it turns almost nothing into an occasion/);
  assert.match(data, /Almost nothing\. But not nothing\. An occasion/);
  for (const signal of ['cold', 'crack', 'bubble', 'aroma', 'color']) {
    assert.match(data, new RegExp(`id: '${signal}'`));
  }
});

test('company claims, evidence, editorial reading, and useful limits stay separated', async () => {
  const [page, data, endpoint] = await Promise.all([
    read('src/pages/noticing/why-lacroix.astro'),
    read('src/lib/noticing-lacroix.ts'),
    read('src/pages/noticing/why-lacroix.json.ts'),
  ]);

  for (const label of [
    'Confirmed product claim',
    'Sensory evidence',
    'Editorial reading',
    'Useful limit',
  ]) {
    assert.match(data, new RegExp(label));
  }
  assert.match(page, /Claim, evidence, reading, limit/);
  assert.match(data, /not a nutrition recommendation or a laboratory analysis/);
  assert.match(endpoint, /not medical or nutrition advice/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal((data.match(/id: 'S\d\d'/g) ?? []).length, 8);
});

test('Issue 02 has a permanent Block and complete discovery companions', async () => {
  const [blockText, home, sitemap, agents, forAgents, llms, llmsFull, calendar] = await Promise.all([
    read('src/content/blocks/0519.json'),
    read('src/components/HomeNewEdition.astro'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
    read('src/lib/noticing.ts'),
  ]);
  const block = JSON.parse(blockText);

  assert.equal(block.id, '0519');
  assert.equal(block.type, 'READ');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.publicationStatus, 'published');
  assert.equal(block.meta.visualPlates, 3);
  assert.equal(block.meta.researchSources, 8);
  assert.equal(block.meta.interactiveInstruments, 2);
  assert.match(home, /href="\/noticing\/why-lacroix"/);
  assert.match(sitemap, /pointcast\.xyz\/noticing\/why-lacroix'/);
  assert.match(sitemap, /pointcast\.xyz\/noticing\/why-lacroix\.json'/);
  assert.match(agents, /noticingLacroix: 'https:\/\/pointcast\.xyz\/noticing\/why-lacroix'/);
  assert.match(agents, /noticingLacroix: 'https:\/\/pointcast\.xyz\/noticing\/why-lacroix\.json'/);
  assert.match(forAgents, /Block <code>0519<\/code>/);
  assert.match(llms, /Block 0519/);
  assert.match(llmsFull, /What I Keep Noticing — Issue 02/);
  assert.match(calendar, /relatedUrl: '\/noticing\/why-lacroix'/);
});

test('three original plates and both social cards have exact production dimensions', async () => {
  const plates = [
    'cold-open.webp',
    'aroma-without-fruit.webp',
    'shelf-chooses-you.webp',
  ];

  for (const filename of plates) {
    const file = new URL(`../public/images/noticing/lacroix-issue-02/${filename}`, import.meta.url);
    await access(file);
    const metadata = await sharp(fileURLToPath(file)).metadata();
    assert.deepEqual(
      { width: metadata.width, height: metadata.height, format: metadata.format },
      { width: 1536, height: 1024, format: 'webp' },
    );
  }

  for (const path of [
    '../public/images/noticing/lacroix-issue-02-og.png',
    '../public/images/og/b/0519.png',
  ]) {
    const file = new URL(path, import.meta.url);
    await access(file);
    assert.deepEqual(pngSize(await readFile(file)), { width: 1200, height: 630 });
  }
});
