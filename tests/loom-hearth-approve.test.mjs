import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { verifyArt } from '../public/sketches/hearth-approve/approve.mjs';

const publicRoot = new URL('../public/', import.meta.url);
const html = readFileSync(new URL('sketches/hearth-approve/index.html', publicRoot), 'utf8');
const source = html.match(/id="art" src="(data:image\/webp;base64,[^"]+)"/)?.[1];

function artwork(src, overrides = {}) {
  return {
    currentSrc: src,
    getAttribute: (name) => name === 'src' ? src : null,
    naturalWidth: 384,
    async decode() {},
    ...overrides,
  };
}

test('the inline WebP is the pinned Hearth kit sample and verifies after decode', async () => {
  assert.ok(source);
  const inlineBytes = Buffer.from(source.split(',')[1], 'base64');
  const originalBytes = readFileSync(new URL('sketches/loom-kit/cards/hearth-poster.webp', publicRoot));
  assert.deepEqual(inlineBytes, originalBytes);
  assert.equal(createHash('sha256').update(inlineBytes).digest('hex'),
    'd895c36bf6948e74f507048663409a4fbfce84be4e02092f4128a886f516ee1b');

  let decoded = false;
  const image = artwork(source, { async decode() { decoded = true; } });
  const subtle = {
    async digest(algorithm, bytes) {
      assert.equal(decoded, true);
      return webcrypto.subtle.digest(algorithm, bytes);
    },
  };
  assert.equal(await verifyArt(image, subtle), 'verified');
});

test('a changed but decodable WebP fails the pinned SHA-256 check', async () => {
  const differentBytes = readFileSync(new URL('sketches/loom-kit/cards/hearth-unlit.webp', publicRoot));
  const differentSource = `data:image/webp;base64,${differentBytes.toString('base64')}`;
  assert.equal(await verifyArt(artwork(differentSource), webcrypto.subtle), 'failed');
});

test('invalid and substituted image sources fail closed', async () => {
  const corrupt = artwork('data:image/webp;base64,broken', {
    async decode() { throw new Error('Could not decode'); },
  });
  const wrongSource = artwork(source, { currentSrc: 'data:image/webp;base64,AA==' });
  const nonData = artwork('https://example.com/art.webp');
  for (const image of [corrupt, wrongSource, nonData]) {
    assert.equal(await verifyArt(image, webcrypto.subtle), 'failed');
  }
});

test('unavailable verification stays closed', async () => {
  assert.equal(await verifyArt(artwork(source), null), 'unavailable');
  assert.equal(await verifyArt(artwork(source, { decode: null }), webcrypto.subtle), 'unavailable');
  assert.match(html, /<fieldset id="decision-actions" disabled>/);
  assert.match(html, /role="status">JavaScript is required to check the image/);
  assert.match(html, /connect-src 'none'; form-action 'none'/);
});
