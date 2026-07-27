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

test('Issue 01 is a complete magazine feature with an interactive civic stack', async () => {
  const [page, data] = await Promise.all([
    read('src/pages/noticing/the-future-of-the-library.astro'),
    read('src/lib/noticing-library.ts'),
  ]);

  assert.match(page, /A protocol<br \/>with a roof/);
  assert.match(page, /data-library-issue/);
  assert.match(page, /role="tablist"/);
  assert.match(page, /data-protocol-tab/);
  assert.match(page, /data-protocol-panel/);
  assert.match(page, /data-copy-issue/);
  assert.match(page, /data-print-field-sheet/);
  assert.match(page, /@media print/);
  assert.match(page, /prefers-reduced-motion/);

  for (const protocol of ['memory', 'access', 'room', 'practice', 'voice']) {
    assert.match(data, new RegExp(`id: '${protocol}'`));
  }
  assert.match(data, /The future of the library is not fewer books/);
  assert.match(data, /The Borrowable Town Shelf/);
  assert.match(data, /Town Memory Saturdays/);
  assert.match(data, /Public Capability Hours/);
  assert.match(data, /Why LaCroix/);
});

test('current services, proposals, and reporting limits are separated truthfully', async () => {
  const [page, data, endpoint] = await Promise.all([
    read('src/pages/noticing/the-future-of-the-library.astro'),
    read('src/lib/noticing-library.ts'),
    read('src/pages/noticing/the-future-of-the-library.json.ts'),
  ]);

  assert.match(page, /THE PRESENT TENSE/);
  assert.match(page, /SMALL PUBLIC FUTURES/);
  assert.match(data, /not announced library programs/i);
  assert.match(data, /Direct interviews and room-by-room observation belong to the next dispatch/);
  assert.match(endpoint, /direct interviews and in-person observation are not represented as completed/);
  assert.match(endpoint, /Access-Control-Allow-Origin/);
  assert.equal((data.match(/id: 'S\d\d'/g) ?? []).length, 8);
});

test('Issue 01 has a Block and complete human and machine discovery', async () => {
  const [blockText, home, sitemap, agents, forAgents, llms, llmsFull] = await Promise.all([
    read('src/content/blocks/0515.json'),
    read('src/pages/index.astro'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('src/pages/for-agents.astro'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);
  const block = JSON.parse(blockText);

  assert.equal(block.id, '0515');
  assert.equal(block.type, 'READ');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.publicationStatus, 'published');
  assert.equal(block.meta.visualPlates, 3);
  assert.equal(block.meta.researchSources, 8);
  assert.match(home, /href="\/noticing\/the-future-of-the-library"/);
  assert.match(sitemap, /pointcast\.xyz\/noticing\/the-future-of-the-library'/);
  assert.match(sitemap, /pointcast\.xyz\/noticing\/the-future-of-the-library\.json'/);
  assert.match(agents, /noticingLibrary: 'https:\/\/pointcast\.xyz\/noticing\/the-future-of-the-library'/);
  assert.match(agents, /noticingLibrary: 'https:\/\/pointcast\.xyz\/noticing\/the-future-of-the-library\.json'/);
  assert.match(forAgents, /eight-source major study/);
  assert.match(llms, /Block 0515/);
  assert.match(llmsFull, /What I Keep Noticing — Issue 01/);
});

test('three original plates and both social cards have exact production dimensions', async () => {
  const plates = [
    'sunroom-commons.webp',
    'town-memory-table.webp',
    'borrowable-town.webp',
  ];

  for (const filename of plates) {
    const file = new URL(`../public/images/noticing/library-issue-01/${filename}`, import.meta.url);
    await access(file);
    const metadata = await sharp(fileURLToPath(file)).metadata();
    assert.deepEqual(
      { width: metadata.width, height: metadata.height, format: metadata.format },
      { width: 1536, height: 1024, format: 'webp' },
    );
  }

  for (const path of [
    '../public/images/noticing/library-issue-01-og.png',
    '../public/images/og/b/0515.png',
  ]) {
    const file = new URL(path, import.meta.url);
    await access(file);
    assert.deepEqual(pngSize(await readFile(file)), { width: 1200, height: 630 });
  }
});
