import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sketch = new URL('../public/sketches/loom-census-picture/', import.meta.url);
const html = readFileSync(new URL('index.html', sketch), 'utf8');
const picture = readFileSync(new URL('census-nov-18.png', sketch));

test('the Census preview can save the same portrait PNG without JavaScript', () => {
  assert.equal(picture.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(picture.toString('ascii', 12, 16), 'IHDR');
  assert.equal(picture.readUInt32BE(16), 1080);
  assert.equal(picture.readUInt32BE(20), 1350);

  assert.match(html, /<img src="\.\/census-nov-18\.png" width="1080" height="1350"/);
  assert.match(html, /href="\.\/census-nov-18\.png" download="loom-census-nov-18-2026\.png">Save picture/);
  assert.doesNotMatch(html, /<script\b/i);
});

test('the Census picture exposes the snapshot and evidence in text', () => {
  const description = html.match(/\balt="([^"]+)"/)?.[1] ?? '';

  assert.match(description, /November 18, 2026, through 6:58 p\.m\. Eastern/);
  assert.match(description, /1 person, 33 agents and 1 house robot by self-reported sender kind/);
  assert.match(description, /529 original posts exclude 490 mirrors/);
  assert.match(description, /13 verified releases include 12 site or asset updates and 1 repository document/);
  assert.match(html, /href="https:\/\/github\.com\/mhoydich\/pointcast\/pull\/1897">See the Census sources/);
});
