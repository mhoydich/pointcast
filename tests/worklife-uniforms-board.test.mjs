import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

function pngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('Uniforms is a standalone WORK/LIFE post with truthful visual labeling', async () => {
  const [data, page, endpoint] = await Promise.all([
    read('src/lib/worklife-publication.ts'),
    read('src/pages/worklife/uniforms.astro'),
    read('src/pages/worklife/uniforms.json.ts'),
  ]);

  assert.match(data, /title: 'THE CLOTHES HAVE CLOCKED IN'/);
  assert.equal((data.match(/garment: '/g) ?? []).length, 6);
  for (const mode of ['signal', 'protect', 'belong', 'disappear']) {
    assert.match(page, new RegExp(`data-uniform-mode="${mode}"`));
  }
  assert.match(page, /MIDJOURNEY ARCHIVE \/ AFTER SHIFT/);
  assert.match(page, /not\s+documentary pictures of work/i);
  assert.match(endpoint, /documentaryEvidence: false/);
  assert.match(endpoint, /generatedImagesLabeled: true/);
  assert.doesNotMatch(page, /\bfetch\(/);
  assert.doesNotMatch(page, /localStorage/);
  assert.match(page, /prefers-reduced-motion/);
  assert.match(page, /@media\(max-width:620px\)/);
});

test('OPEN TO WORK keeps Bosslist clarity while requiring consent', async () => {
  const [data, page, endpoint] = await Promise.all([
    read('src/lib/worklife-publication.ts'),
    read('src/pages/worklife/open-to-work.astro'),
    read('src/pages/worklife/open-to-work.json.ts'),
  ]);

  assert.match(data, /concept: 'Bosslist'/);
  for (const retired of [
    'silent indexing', 'contact importing', 'automatic profile crawling',
    'up\/down voting on people', 'opaque human ranking',
  ]) assert.match(data, new RegExp(retired));
  assert.match(page, /Bosslist, without ranking the humans/);
  assert.match(page, /PUBLIC CARDS/);
  assert.match(page, /ADD TO THIS DEVICE/);
  assert.match(page, /COPY CARD JSON/);
  assert.match(page, /REMOVE LOCAL CARD/);
  assert.match(page, /pointcast\.worklife\.open-to-work\.v1/);
  assert.match(page, /localStorage/);
  assert.match(page, /window\.confirm/);
  assert.doesNotMatch(page, /\bfetch\(/);
  assert.doesNotMatch(page, /action=/);
  assert.match(endpoint, /publicPeopleIndexed: 0/);
  assert.match(endpoint, /optInRequired: true/);
  assert.match(endpoint, /copyingIsNotPublication: true/);
  assert.match(endpoint, /automaticCrawling: false/);
  assert.match(endpoint, /ranking: false/);
  assert.match(endpoint, /voting: false/);
});

test('Block 0556 records both surfaces and their boundaries', async () => {
  const block = JSON.parse(await read('src/content/blocks/0556.json'));
  assert.equal(block.id, '0556');
  assert.equal(block.channel, 'FD');
  assert.equal(block.type, 'READ');
  assert.equal(block.meta.uniformObservations, 6);
  assert.equal(block.meta.midjourneyArchiveStudies, 2);
  assert.equal(block.meta.generatedImagesLabeled, true);
  assert.equal(block.meta.generatedImagesAreDocumentaryEvidence, false);
  assert.equal(block.meta.publicCards, 0);
  assert.equal(block.meta.contactImport, false);
  assert.equal(block.meta.automaticCrawling, false);
  assert.equal(block.meta.humanRanking, false);
  assert.equal(block.meta.automaticPublishing, false);
  assert.equal(block.meta.networkWrites, false);
});

test('the new post and board travel through publication and discovery surfaces', async () => {
  const surfaces = await Promise.all([
    read('src/pages/worklife/index.astro'),
    read('src/pages/worklife.json.ts'),
    read('src/components/HomeWorklifeOpener.astro'),
    read('src/pages/index.astro'),
    read('src/pages/agents.json.ts'),
    read('src/pages/sitemap-discovery.xml.ts'),
    read('public/llms.txt'),
    read('public/llms-full.txt'),
  ]);
  for (const surface of surfaces) {
    assert.match(surface, /uniforms|Uniforms|UNIFORMS/);
    assert.match(surface, /open-to-work|OPEN TO WORK|OpenToWork/);
  }
  assert.match(surfaces[0], /BOSSLIST, PRIVACY-REWRITTEN/);
  assert.match(surfaces[2], /THE PLAYLIST IS STILL THE OPENER/);
  assert.match(surfaces[3], /CollectionPage/);
});

test('Uniforms, board, archive, and Block artwork have expected dimensions', async () => {
  const files = {
    uniforms: new URL('../public/images/worklife/uniforms-cover.png', import.meta.url),
    board: new URL('../public/images/worklife/open-to-work-board.png', import.meta.url),
    social: new URL('../public/images/og/b/0556.png', import.meta.url),
    office: new URL('../public/images/worklife/midjourney-empty-desk.png', import.meta.url),
    flowerOffice: new URL('../public/images/worklife/midjourney-flower-office.png', import.meta.url),
  };
  await Promise.all(Object.values(files).map((path) => access(path)));
  assert.deepEqual(pngSize(await readFile(files.uniforms)), { width: 1536, height: 1536 });
  assert.deepEqual(pngSize(await readFile(files.board)), { width: 1536, height: 1536 });
  assert.deepEqual(pngSize(await readFile(files.social)), { width: 1200, height: 630 });
  assert.deepEqual(pngSize(await readFile(files.office)), { width: 1024, height: 1024 });
  assert.deepEqual(pngSize(await readFile(files.flowerOffice)), { width: 1024, height: 1024 });
});
