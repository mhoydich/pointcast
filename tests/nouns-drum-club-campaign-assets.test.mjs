import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const creatives = ['everybody', 'no-audition', 'one-more'];
const sizes = {
  '300x250': [300, 250],
  '336x280': [336, 280],
  '728x90': [728, 90],
  '970x250': [970, 250],
  '300x600': [300, 600],
  '160x600': [160, 600],
  '320x50': [320, 50],
  '320x100': [320, 100],
  '1080x1080': [1080, 1080],
  '1080x1920': [1080, 1920],
};

function pngDimensions(buffer) {
  assert.deepEqual([...buffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], 'expected image/png signature');
  assert.equal(buffer.toString('ascii', 12, 16), 'IHDR', 'expected PNG IHDR');
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function isWebp(buffer) {
  return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
}

test('Nouns Drum Club fixed creative assets have their advertised image/png dimensions and non-empty payloads', async () => {
  for (const creative of creatives) {
    for (const [size, dimensions] of Object.entries(sizes)) {
      const asset = new URL(`public/ads/nouns-drum-club/${creative}-${size}.png`, root);
      const buffer = await readFile(asset);
      assert.ok(buffer.byteLength >= 1024, `${asset.pathname} is unexpectedly small`);
      assert.deepEqual(pngDimensions(buffer), dimensions, `${asset.pathname} dimensions`);
    }
  }
});

test('Nouns Drum Club responsive campaign art has image/webp payloads', async () => {
  for (const creative of ['everybody-band', 'no-audition', 'one-more']) {
    const asset = new URL(`public/images/nouns-drum-club/campaign/${creative}.webp`, root);
    const buffer = await readFile(asset);
    assert.ok(buffer.byteLength >= 1024, `${asset.pathname} is unexpectedly small`);
    assert.ok(isWebp(buffer), `${asset.pathname} must be image/webp`);
  }
});
