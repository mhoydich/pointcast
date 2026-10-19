import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { EDITIONS, DENOMINATIONS, stableCredit, renderNote, designId } from '../public/sunset-downs/money/note.mjs';
const root = new URL('../public/sunset-downs/art/nouns/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
const portrait = await readFile(new URL('silver-screen.svg', root), 'utf8');

test('six distinct original Nouns horse portraits retain recorded bytes and reproducible seeds', async () => {
  assert.equal(EDITIONS.length, 6);
  assert.equal(new Set(EDITIONS.map(item => item.id)).size, 6);
  assert.equal(manifest.source.commit, '2213eea1c15f331f786784c2621d53bdecf907e2');
  assert.equal(manifest.source.asset_sha256, 'a03f22b7838b35fdf0332617c9b8e2b032eb26cf1632afbefb200fec64c4bc20');
  assert.equal(new Set(manifest.items.map(item => JSON.stringify(item.seed))).size, 6);
  for (const edition of EDITIONS) {
    const item = manifest.items.find(value => value.id === edition.id);
    assert.ok(item);
    assert.equal(item.seed.head, 105);
    for (const format of ['svg', 'png']) {
      const bytes = await readFile(new URL(item[format], root));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), item[`${format}_sha256`]);
    }
  }
});

test('every design downloads as self-contained 180 by 70 mm art with exact original portrait', () => {
  const ids = new Set();
  for (const edition of EDITIONS) for (const value of DENOMINATIONS) {
    const id = designId(edition.id, value); ids.add(id);
    const svg = renderNote(edition.id, value, 'Night Garden Stable', portrait);
    assert.match(svg, /width="180mm" height="70mm"/);
    assert.match(svg, /PROP SCRIP/);
    assert.match(svg, /NO CASH VALUE/);
    assert.match(svg, /REPRINTABLE/);
    assert.match(svg, /STABLE CREDIT · Night Garden Stable/);
    assert.ok(svg.includes(id));
    const encodedPortrait = /<image[^>]*href="data:image\/svg\+xml,([^"]+)"/.exec(svg)?.[1];
    assert.ok(encodedPortrait);
    assert.equal(decodeURIComponent(encodedPortrait), portrait);
    assert.doesNotMatch(svg, /<script|<foreignObject/);
  }
  assert.equal(ids.size, 18);
});

test('stable credits are bounded, control-free and escaped; invalid editions cannot make notes', () => {
  assert.equal(stableCredit(' \u202e\u0000 '), 'THE SUNSET SYNDICATE');
  assert.equal(Array.from(stableCredit('🐎'.repeat(60))).length, 36);
  assert.equal(stableCredit('Cafe\u0301'), 'Café');
  const svg = renderNote('silver-screen', 100, '<script>alert("x")</script>&', portrait);
  assert.ok(svg.includes('&lt;script&gt;'));
  assert.doesNotMatch(svg, /<script/);
  assert.throws(() => renderNote('missing', 10, 'Stable', portrait));
  assert.throws(() => renderNote('silver-screen', 1000, 'Stable', portrait));
  assert.throws(() => renderNote('silver-screen', '100', 'Stable', portrait));
  assert.throws(() => renderNote('silver-screen', 10, 'Stable', '<svg ><script>bad()</script></svg>'));
  assert.throws(() => renderNote('silver-screen', 10, 'Stable', '<svg ><image href="https://example.com/x"/></svg>'));
});
