import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SaxesParser } from 'saxes';
import { COMMONS, nounArt, noteFrontSVG, noteBackSVG, machineEdition, serial, textLines } from '../src/lib/currency-builder/commons.mjs';

function assertWellFormed(xml, label) {
  const parser = new SaxesParser({ xmlns: true });
  let error = null;
  parser.on('error', (e) => { error = e; });
  parser.write(xml).close();
  assert.equal(error, null, `${label} is well-formed XML`);
}

const provenance = JSON.parse(readFileSync(new URL('../public/images/nouns-money/source-100/provenance.json', import.meta.url), 'utf8'));
const imageData = JSON.parse(readFileSync(new URL('../public/images/nouns-money/source-100/sources/official-image-data.json', import.meta.url), 'utf8'));

test('forty currencies, ten per system, forty different actual Nouns', () => {
  assert.equal(COMMONS.currencies.length, 40);
  for (const theme of ['rental', 'mesh', 'sharing', 'barter']) {
    assert.equal(COMMONS.currencies.filter((entry) => entry.theme === theme).length, 10, theme);
  }
  assert.equal(new Set(COMMONS.currencies.map((entry) => entry.nounId)).size, 40);
  assert.equal(new Set(COMMONS.currencies.map((entry) => entry.slug)).size, 40);
  assert.equal(new Set(COMMONS.currencies.map((entry) => entry.code)).size, 40);
  for (const entry of COMMONS.currencies) {
    assert.match(entry.slug, /^[a-z0-9-]+$/);
    assert.ok(Number.isInteger(entry.denomination) && entry.denomination > 0, entry.slug);
  }
});

test('every Noun comes from its recorded seed and the official trait files', () => {
  for (const entry of COMMONS.currencies) {
    const proof = provenance.notes.find((note) => note.noun_id === entry.nounId);
    assert.ok(proof, `Noun #${entry.nounId} has verified provenance`);
    const art = nounArt(entry.nounId);
    assert.deepEqual(art.seed, proof.seed);
    assert.equal(imageData.images.heads[proof.seed.head].filename, proof.traits.head);
    assert.equal(imageData.images.glasses[proof.seed.glasses].filename, proof.traits.glasses);
    assert.equal(imageData.images.bodies[proof.seed.body].filename, proof.traits.body);
    assert.equal(imageData.images.accessories[proof.seed.accessory].filename, proof.traits.accessory);
    assert.equal(art.background, `#${imageData.bgcolors[proof.seed.background]}`);
  }
});

test('note faces embed the exact Noun pixels and the art-only disclaimer', () => {
  for (const entry of COMMONS.currencies) {
    const pixels = nounArt(entry.nounId).svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    const front = noteFrontSVG(entry);
    const back = noteBackSVG(entry);
    assert.ok(front.includes(pixels), `${entry.slug} front carries the Noun pixels unchanged`);
    assert.ok(back.includes(pixels), `${entry.slug} back carries the Noun pixels unchanged`);
    assert.ok(front.includes('<svg x="820" y="120" width="320" height="320" viewBox="0 0 320 320"'), `${entry.slug} front places the Noun in its window`);
    assert.ok(back.includes('<svg x="876" y="80" width="208" height="208" viewBox="0 0 320 320"'), `${entry.slug} back places the Noun in its window`);
    assert.match(back, /NOT ENDORSED BY NOUNS DAO/);
    for (const [label, face] of [['front', front], ['back', back]]) {
      assert.match(face, /NOT LEGAL TENDER · NO CASH VALUE/);
      assert.match(face, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 1200 600" width="150mm" height="75mm"/);
      assert.doesNotMatch(face, /legal tender of|redeemable|backed by|invest/i);
      assertWellFormed(face, `${entry.slug} ${label}`);
    }
    const lines = textLines(entry);
    assert.ok(lines.line.length <= 3, `${entry.slug} line fits in three lines`);
    assert.ok(lines.how.length <= 7, `${entry.slug} how fits in seven lines`);
    assert.equal(noteFrontSVG(entry), front, `${entry.slug} renders deterministically`);
  }
});

test('machine edition lists files, serials and Noun provenance', () => {
  const edition = machineEdition();
  assert.equal(edition.currencies.length, 40);
  for (const item of edition.currencies) {
    assert.equal(item.serial, serial(item));
    assert.equal(item.files.front, `/currency-builder/commons/notes/front/${item.slug}.svg`);
    assert.equal(item.files.back, `/currency-builder/commons/notes/back/${item.slug}.svg`);
    assert.equal(item.noun.official_url, `https://nouns.wtf/noun/${item.nounId}`);
  }
});
