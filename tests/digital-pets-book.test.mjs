import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function loadBookData() {
  const script = `
    import { BOOK_CHAPTERS, BOOK_SOURCES } from './src/lib/digital-pets-book.ts';
    process.stdout.write(JSON.stringify({ chapters: BOOK_CHAPTERS, sources: BOOK_SOURCES }));
  `;
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--input-type=module', '-e', script],
    { cwd: new URL('.', root), encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('Future Book 001 publishes twelve position-length chapters with valid sources', () => {
  const { chapters, sources } = loadBookData();
  const sourceIds = new Set(sources.map((source) => source.id));

  assert.equal(chapters.length, 12);
  assert.equal(new Set(chapters.map((chapter) => chapter.slug)).size, 12);
  assert.equal(new Set(chapters.map((chapter) => chapter.title)).size, 12);

  for (const [index, chapter] of chapters.entries()) {
    const words = chapter.paragraphs.join(' ').trim().split(/\s+/).length;
    assert.equal(chapter.number, index + 1);
    assert.ok(words >= 600 && words <= 900, `chapter ${chapter.number} has ${words} words`);
    assert.ok(chapter.pullQuote.length > 30);
    assert.ok(chapter.sources.length >= 1);
    chapter.sources.forEach((sourceId) => assert.ok(sourceIds.has(sourceId), `missing source ${sourceId}`));
  }
});

test('Future Book 001 has complete human, machine, Block, homepage, and discovery surfaces', async () => {
  const [page, json, block, home, sitemap, agents, llms, llmsFull] = await Promise.all([
    read('src/pages/digital-pets.astro'),
    read('src/pages/digital-pets.json.ts'),
    read('src/content/blocks/0514.json'),
    read('src/pages/index.astro'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('src/pages/agents.json.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);

  assert.match(page, /BOOK_CHAPTERS\.map/);
  assert.match(page, /Primary-source ledger/);
  assert.match(page, /A deliberately over-honest colophon/);
  assert.match(page, /data-pet-progress/);
  assert.match(json, /pointcast\.future-book\/v1/);
  assert.match(block, /"id": "0514"/);
  assert.match(block, /"author": "codex"/);
  assert.match(home, /href="\/digital-pets"/);
  assert.match(sitemap, /pointcast\.xyz\/digital-pets\.json/);
  assert.match(agents, /digitalPets: 'https:\/\/pointcast\.xyz\/digital-pets\.json'/);
  assert.match(llms, /PointCast Future Book 001/);
  assert.match(llmsFull, /The Animal After the Internet/);
});

test('the six generated creature plates are compact portrait WebP assets', async () => {
  for (let index = 1; index <= 6; index += 1) {
    const suffix = [
      'cover',
      'body',
      'memory',
      'refusal',
      'graveyard',
      'editions',
    ][index - 1];
    const path = new URL(
      `public/images/digital-pets/plate-${String(index).padStart(2, '0')}-${suffix}.webp`,
      root,
    );
    const pathName = fileURLToPath(path);
    const [file, metadata] = await Promise.all([stat(path), sharp(pathName).metadata()]);
    assert.ok(file.size < 350_000, `${path.pathname} is too large`);
    assert.equal(metadata.width, 1024);
    assert.equal(metadata.height, 1536);
    assert.equal(metadata.format, 'webp');
  }
});
