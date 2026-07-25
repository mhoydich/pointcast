import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const pagePath = new URL('../src/pages/reviews/tone-bloom.astro', import.meta.url);
const jsonPath = new URL('../src/pages/reviews/tone-bloom.json.ts', import.meta.url);
const blockPath = new URL('../src/content/blocks/0493.json', import.meta.url);
const desktopPath = new URL('../public/images/tone-bloom/tone-bloom-desktop.jpg', import.meta.url);
const mobilePath = new URL('../public/images/tone-bloom/tone-bloom-mobile-spark.jpg', import.meta.url);
const ogPath = new URL('../public/images/tone-bloom/tone-bloom-review-og.png', import.meta.url);

test('Tone Bloom review page carries the product facts, screenshots, and destination links', async () => {
  const page = await readFile(pagePath, 'utf8');

  assert.match(page, /POINTCAST REVIEW LAB/);
  assert.match(page, /TONEBLOOM\.XYZ/);
  assert.match(page, /tone-bloom-desktop\.jpg/);
  assert.match(page, /tone-bloom-mobile-spark\.jpg/);
  assert.match(page, /12 voices/i);
  assert.match(page, /four pace modes/i);
  assert.match(page, /38-image core/i);
  assert.match(page, /Midjourney V8\.2/);
  assert.match(page, /The Listening Grove/);
  assert.match(page, /Saturday, July 18/);
  assert.match(page, /Fifty from 2025/);
});

test('Tone Bloom review has machine-readable JSON and a sourced PointCast block', async () => {
  const endpoint = await readFile(jsonPath, 'utf8');
  const block = JSON.parse(await readFile(blockPath, 'utf8'));

  assert.match(endpoint, /pointcast\.review\/v1/);
  assert.match(endpoint, /tonebloom\.xyz/);
  assert.equal(block.id, '0493');
  assert.equal(block.author, 'codex');
  assert.equal(block.meta.rating, 4.5);
  assert.equal(block.meta.voices, 12);
  assert.equal(block.meta.paces, 4);
  assert.equal(block.meta.coreImages, 38);
  assert.match(block.source, /Mike Hoydich chat directive/);
  assert.equal(block.external.url, 'https://pointcast.xyz/reviews/tone-bloom');
});

test('Tone Bloom review image assets are present', async () => {
  await Promise.all([access(desktopPath), access(mobilePath), access(ogPath)]);
});
