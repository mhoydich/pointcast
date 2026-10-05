import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import sharp from 'sharp';
import { JSDOM } from 'jsdom';
import { toPublicManifest } from '../src/lib/art-v2.mjs';

const repo = resolve(new URL('..', import.meta.url).pathname);
const input = JSON.parse(await readFile(resolve(repo, 'src/data/art-v2.json'), 'utf8'));
const manifest = toPublicManifest(input);
const allowPending = process.argv.includes('--allow-pending');
assert.equal(manifest.works.length, 50, 'Collection must contain exactly 50 source records');
const ids = new Set();
const hashes = { source: new Set(), v2: new Set() };
const masterHashes = new Set();
let generated = 0, totalBytes = 0;
for (const [index, work] of manifest.works.entries()) {
  assert.equal(work.id, `MJ-JUL18-${String(index + 1).padStart(2, '0')}`, 'Stable source ID/order changed');
  assert.equal(work.number, index + 1);
  assert(!ids.has(work.id)); ids.add(work.id);
  assert.equal(work.source.jobUrl, null, 'Historic sources have no recorded job URL');
  assert.equal(work.source.promptKind, 'fragment', 'Incomplete source prompts must be labelled');
  assert.match(work.source.catalogUrl, /^https:\/\/github\.com\/mhoydich\/pointcast\/blob\/[0-9a-f]{40}\/src\/content\/gallery\/[a-z0-9-]+\.json$/);
  assert.equal(work.commerce.status, 'unavailable');
  assert.equal(work.commerce.priceMutez, 1000000);
  for (const key of ['contract', 'network', 'tokenId', 'listingUrl']) assert.equal(work.commerce[key], null);
  if (work.v2?.asset) {
    generated++;
    assert(work.v2.title && work.v2.caption && work.v2.prompt);
    assert.equal(work.v2.generator, 'OpenAI built-in image generation');
    assert.equal(work.v2.generatedAt, '2026-10-03');
    assert.match(work.v2.masterSha256, /^[0-9a-f]{64}$/);
    assert(!masterHashes.has(work.v2.masterSha256), 'Duplicate original master hash');
    masterHashes.add(work.v2.masterSha256);
  }
  else assert(allowPending, `Missing generated V2 asset for ${work.id}`);
  for (const kind of ['source', 'v2']) {
    const image = work[kind];
    if (!image?.asset) continue;
    for (const [field, expectedWidth] of [['asset', image.width], ['thumbnail', image.thumbnailWidth]]) {
      const asset = image[field];
      assert(asset && asset.startsWith('/images/art-v2/'), `${work.id}: ${field} must be local`);
      const file = await realpath(resolve(repo, 'public', asset.slice(1)));
      assert(file.startsWith(resolve(repo, 'public/images/art-v2') + sep), 'Asset escapes collection directory');
      assert(file.includes(work.id), `${work.id}: asset filename does not preserve source ID`);
      const bytes = await readFile(file); totalBytes += bytes.length;
      const metadata = await sharp(bytes).metadata();
      await sharp(bytes).raw().toBuffer();
      assert.equal(metadata.format, 'webp');
      assert.equal(metadata.width, expectedWidth, `${work.id}: inaccurate image-width metadata`);
      assert(!metadata.exif && !metadata.xmp, 'Public image contains source metadata');
      if (field === 'asset') {
        assert.equal(metadata.height, image.height);
        const hash = createHash('sha256').update(bytes).digest('hex');
        if (kind === 'v2') assert.equal(hash, image.sha256, 'Generated web bytes do not match public digest');
        assert(!hashes[kind].has(hash), `Duplicate ${kind} image bytes`); hashes[kind].add(hash);
      }
    }
  }
}
assert(allowPending || generated === 50, 'All 50 V2 interpretations are required for release');
for (const hash of hashes.v2) assert(!hashes.source.has(hash), 'A source image was reused as generated V2 art');
const serialized = JSON.stringify(manifest);
assert(!serialized.includes('/Users/') && !serialized.includes('/workspace/') && !serialized.includes('libfile_'), 'Private file or Library metadata entered public manifest');
assert(!serialized.includes('ownerEvidence') && !serialized.includes('ownershipBasis'));
const page = await readFile(resolve(repo, 'src/pages/art/v2/index.astro'), 'utf8');
assert(!/<main(?:\s|>)/.test(page), 'Gallery must use the layout main landmark');
assert(page.includes('jsonLd={null}'), 'Shared layout must not serialize unescaped gallery JSON-LD');
assert(page.includes('type="application/ld+json"'), 'Safe local gallery JSON-LD is missing');
if (process.argv.includes('--compiled')) {
  const emitted = JSON.parse(await readFile(resolve(repo, 'dist/art/v2/manifest.json'), 'utf8'));
  assert.deepEqual(emitted, manifest, 'Compiled public endpoint differs from validated projection');
  const html = await readFile(resolve(repo, 'dist/art/v2/index.html'), 'utf8');
  const document = new JSDOM(html).window.document;
  assert.equal(document.querySelectorAll('main').length, 1);
  assert.equal(document.querySelectorAll('[data-work-id]').length, 50);
  assert.equal(document.querySelectorAll('[data-work-id] img').length, 100);
  assert.deepEqual(JSON.parse(document.querySelector('[data-gallery-data]').textContent), manifest);
  const galleries = [...document.querySelectorAll('script[type="application/ld+json"]')]
    .map((script) => JSON.parse(script.textContent)).filter((entry) => entry['@type'] === 'ImageGallery');
  assert.equal(galleries.length, 1, 'Exactly one gallery JSON-LD record is required');
  const ld = galleries[0];
  assert.equal(ld.associatedMedia.length, 100);
  assert(document.querySelector('button[disabled]').textContent.includes('Edition unavailable'));
  assert(!html.includes('/Users/') && !html.includes('libfile_'), 'Private identifiers reached compiled gallery');
}
console.log(JSON.stringify({ selectedSources: 50, generatedV2: generated, uniqueSourceAssets: hashes.source.size, uniqueV2Assets: hashes.v2.size, verifiedPublicBytes: totalBytes, pendingAllowed: allowPending }, null, 2));
