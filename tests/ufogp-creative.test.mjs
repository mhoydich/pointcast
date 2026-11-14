import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { renderSeed } from '../src/lib/nouns-parts.mjs';
const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root));
const json = p => JSON.parse(read(p));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
test('six charter recipes, complete official layers, and exact artifact hashes', () => {
  const p = json('public/images/ufogp/provenance.json');
  assert.equal(p.sourceSha256, sha(read(p.source.imageData)));
  assert.equal(p.seats.length, 6);
  const charter = [['wave','blue-sky'],['mailbox','computerblue'],['star-sparkles','purple'],['sunset','orange-yellow'],['earth','green'],['moon','bluegrey']];
  assert.equal(new Set(p.seats.map(s => s.artSha256)).size, 6);
  p.seats.forEach((s,i) => {
    assert.equal(s.id,i);
    assert.equal(s.recipe.head,`head-${charter[i][0]}`);
    assert.equal(s.recipe.body,`body-${charter[i][1]}`);
    const svg = read(`public${s.art}`).toString();
    // Independent index lookup through renderSeed prevents mislabeled trait filenames.
    assert.equal(svg,renderSeed(s.seed).svg+'\n');
    assert.equal(sha(svg),s.artSha256);
    assert.ok(svg.includes('viewBox="0 0 320 320"'));
    const m = json(`contracts/ufogp/metadata/${i}.json`);
    assert.deepEqual(m,json(`public/ufogp/metadata/${i}.json`));
    assert.equal(m.decimals,0); assert.equal(m.isBooleanAmount,true);
    assert.equal(m.artifactUri,`https://pointcast.xyz${s.art}`);
    assert.equal(m.formats[0].mimeType,'image/svg+xml');
    assert.equal(m.formats[0].fileSize,Buffer.byteLength(svg));
    assert.equal(m.attributes.length,5);
    assert.equal(m.creators,undefined);
  });
});
test('share card embeds all six complete SVG portraits without external image dependencies', () => {
  const card = read('public/images/ufogp/share-card.svg').toString();
  assert.equal((card.match(/<g transform=/g)||[]).length,6);
  assert.ok(card.includes('viewBox="0 0 1200 630"'));
  assert.doesNotMatch(card,/<image|<script|foreignObject|href=/);
  assert.doesNotMatch(card,/100%/); // Embedded portrait backgrounds must stay within their own 320px canvas.
});
test('interview assets carry the open-map idea and complete portraits', () => {
  const p = json('public/images/ufogp/provenance.json');
  assert.ok(p.interview.inspiration.includes('Tess'));
  assert.ok(p.interview.inspiration.includes('Loom desk'));
  const flag = read(`public${p.interview.flag}`).toString();
  assert.ok(flag.includes('TAKE NOTHING. LEAVE MAPS.'));
  const card = read(`public${p.interview.shareCard}`).toString();
  assert.ok(card.includes('ROOM FOR A SEVENTH'));
  assert.equal((card.match(/scale\(0\.328125\)/g)||[]).length,6);
  assert.doesNotMatch(card,/100%|<image|<script|foreignObject|href=/);
  for (const [name,w,h] of [['flag',960,640],['share-card',1200,630],['interview-flag',960,640],['interview-share-card',1200,630]]) {
    const bytes = read(`public/images/ufogp/${name}.png`);
    assert.equal(bytes.subarray(1,4).toString(),'PNG');
    assert.equal(bytes.readUInt32BE(16),w);
    assert.equal(bytes.readUInt32BE(20),h);
  }
});
