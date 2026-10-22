import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SaxesParser } from 'saxes';
import { BARTER, nounArt, noteFrontSVG, noteBackSVG, machineEdition, serial, textLines } from '../src/lib/currency-builder/barter.mjs';

const provenance = JSON.parse(readFileSync(new URL('../public/images/nouns-money/source-100/provenance.json', import.meta.url), 'utf8'));
const BANNED = /\b(invest\w*|shares?|backed|redeemable|returns|profit\w*|yield|guaranteed|legal tender)\b/i;

function assertWellFormed(xml, label) {
  const parser = new SaxesParser({ xmlns: true });
  let error = null;
  parser.on('error', (e) => { error = e; });
  parser.write(xml).close();
  assert.equal(error, null, `${label} is well-formed XML`);
}

test('one hundred currencies use Nouns #0–99 exactly once', () => {
  assert.equal(BARTER.currencies.length, 100);
  const ids = BARTER.currencies.map((entry) => entry.nounId).sort((a, b) => a - b);
  assert.deepEqual(ids, Array.from({ length: 100 }, (_, i) => i));
  for (const key of ['code', 'slug', 'name']) {
    assert.equal(new Set(BARTER.currencies.map((entry) => entry[key].toLowerCase())).size, 100, `${key}s are unique`);
  }
  const regions = new Set(BARTER.regions.map((region) => region.id));
  for (const entry of BARTER.currencies) {
    assert.ok(regions.has(entry.region), `${entry.code} has a known region`);
    assert.match(entry.slug, /^[a-z0-9-]+$/);
    assert.match(entry.code, /^G\d{3}$/);
    assert.ok(Number.isInteger(entry.denomination) && entry.denomination >= 1 && entry.denomination <= 100, entry.code);
    assert.match(entry.source_url, /^https:\/\//, `${entry.code} cites an https source`);
    assert.ok(entry.name.length <= 18 && entry.place.length <= 34, `${entry.code} name and place fit the note`);
    for (const field of ['name', 'unit', 'units', 'line', 'how', 'fact']) {
      assert.doesNotMatch(entry[field], BANNED, `${entry.code} ${field} avoids financial-offer words`);
    }
  }
});

test('every Noun comes from its recorded seed', () => {
  for (const entry of BARTER.currencies) {
    const proof = provenance.notes.find((note) => note.noun_id === entry.nounId);
    assert.ok(proof, `Noun #${entry.nounId} has recorded provenance`);
    assert.deepEqual(nounArt(entry.nounId).seed, proof.seed);
  }
});

test('note faces carry the exact Noun, fit their text and stay well-formed', () => {
  for (const entry of BARTER.currencies) {
    const pixels = nounArt(entry.nounId).svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    const front = noteFrontSVG(entry);
    const back = noteBackSVG(entry);
    assert.ok(front.includes('<svg x="820" y="120" width="320" height="320" viewBox="0 0 320 320"'), `${entry.code} front places the Noun`);
    assert.ok(front.includes(pixels) && back.includes(pixels), `${entry.code} carries the Noun pixels unchanged`);
    assert.ok(back.includes('<svg x="876" y="80" width="208" height="208" viewBox="0 0 320 320"'), `${entry.code} back places the Noun`);
    for (const [label, face] of [['front', front], ['back', back]]) {
      assert.match(face, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 1200 600" width="150mm" height="75mm"/);
      assert.match(face, /NOT LEGAL TENDER · NO CASH VALUE/);
      assertWellFormed(face, `${entry.code} ${label}`);
    }
    assert.match(back, /NOT ENDORSED BY NOUNS DAO/);
    const t = textLines(entry);
    assert.ok(t.line.length <= 2, `${entry.code} line fits in two lines`);
    assert.ok(t.tradition.length <= 2, `${entry.code} tradition fits in two lines`);
    assert.ok(t.fact.length <= 4, `${entry.code} fact fits in four lines`);
    assert.ok(t.how.length <= 5, `${entry.code} how fits in five lines`);
    assert.equal(noteFrontSVG(entry), front, `${entry.code} renders deterministically`);
  }
});

test('machine edition lists files, serials, sources and Noun provenance', () => {
  const edition = machineEdition();
  assert.equal(edition.currencies.length, 100);
  for (const item of edition.currencies) {
    assert.equal(item.serial, serial(item));
    assert.equal(item.files.front, `/currency-builder/barter/notes/front/${item.slug}.svg`);
    assert.equal(item.noun.official_url, `https://nouns.wtf/noun/${item.nounId}`);
    assert.ok(item.source_url && item.source_title, `${item.code} keeps its source`);
  }
});
