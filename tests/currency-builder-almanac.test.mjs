import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SaxesParser } from 'saxes';
import { ALMANAC, nounArt, noteFrontSVG, noteBackSVG, machineEdition, serial, textLines } from '../src/lib/currency-builder/almanac.mjs';

function assertWellFormed(xml, label) {
  const parser = new SaxesParser({ xmlns: true });
  let error = null;
  parser.on('error', (e) => { error = e; });
  parser.write(xml).close();
  assert.equal(error, null, `${label} is well-formed XML`);
}

const provenance = JSON.parse(readFileSync(new URL('../public/images/nouns-money/source-100/provenance.json', import.meta.url), 'utf8'));

test('52 weeks in order, 13 per quarter, 52 different actual Nouns', () => {
  assert.equal(ALMANAC.currencies.length, 52);
  ALMANAC.currencies.forEach((entry, i) => {
    assert.equal(entry.week, i + 1, entry.slug);
    assert.equal(entry.denomination, entry.week, entry.slug);
    assert.equal(entry.code, `W${String(entry.week).padStart(2, '0')}`);
    assert.equal(entry.quarter, ALMANAC.quarters[Math.floor(i / 13)].id, `${entry.slug} sits in its quarter`);
    assert.match(entry.slug, /^[a-z0-9-]+$/);
    assert.match(entry.source_url, /^https:\/\//, `${entry.slug} cites an https source`);
    assert.ok(entry.source_title && entry.when && entry.where, entry.slug);
  });
  assert.equal(new Set(ALMANAC.currencies.map((entry) => entry.nounId)).size, 52);
  assert.equal(new Set(ALMANAC.currencies.map((entry) => entry.slug)).size, 52);
});

test('every Noun comes from its recorded seed', () => {
  for (const entry of ALMANAC.currencies) {
    const proof = provenance.notes.find((note) => note.noun_id === entry.nounId);
    assert.ok(proof, `Noun #${entry.nounId} has verified provenance`);
    assert.deepEqual(nounArt(entry.nounId).seed, proof.seed);
  }
});

test('faces embed the exact Noun pixels, light their own week and carry the disclaimer', () => {
  for (const entry of ALMANAC.currencies) {
    const pixels = nounArt(entry.nounId).svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
    const front = noteFrontSVG(entry);
    const back = noteBackSVG(entry);
    assert.ok(front.includes(pixels), `${entry.slug} front carries the Noun pixels unchanged`);
    assert.ok(back.includes(pixels), `${entry.slug} back carries the Noun pixels unchanged`);
    assert.equal((front.match(/stroke-width="7"/g) || []).length, 1, `${entry.slug} lights exactly one week`);
    assert.equal((front.match(/stroke-linecap="round"/g) || []).length, 52, `${entry.slug} draws all 52 ticks`);
    assert.ok(front.includes(`WEEK ${String(entry.week).padStart(2, '0')} OF 52`));
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
    // Mono header lines must clear the Noun windows (front x 812, back x 868).
    assert.ok(110 + (entry.when.length + 18) * 12.6 < 800, `${entry.slug} front header fits`);
    assert.ok(110 + (entry.where.length + 8) * 10 < 800, `${entry.slug} where line fits`);
    assert.equal(noteFrontSVG(entry), front, `${entry.slug} renders deterministically`);
  }
});

test('machine edition lists files, serials, sources and Noun provenance', () => {
  const edition = machineEdition();
  assert.equal(edition.currencies.length, 52);
  for (const item of edition.currencies) {
    assert.equal(item.serial, serial(item));
    assert.match(item.serial, /^CB-ALM-W\d\d-N\d{4}$/);
    assert.equal(item.files.front, `/currency-builder/almanac/notes/front/${item.slug}.svg`);
    assert.equal(item.noun.official_url, `https://nouns.wtf/noun/${item.nounId}`);
  }
});

test('the Wheel and KALM Radio pages load the real note files and link each other', () => {
  for (const [page, other] of [['wheel', 'radio'], ['radio', 'wheel']]) {
    const src = readFileSync(new URL(`../src/pages/currency-builder/almanac/${page}.astro`, import.meta.url), 'utf8');
    assert.match(src, /noteFiles\(e\)\.front/, `${page} points each week at its print SVG`);
    assert.match(src, /<script is:inline set:html=\{data\}>/, `${page} gets its data from the Almanac module`);
    assert.ok(src.includes(`/currency-builder/almanac/${other}/`), `${page} links to ${other}`);
    assert.match(src, /NOT LEGAL TENDER|not legal tender/i, `${page} carries the disclaimer`);
    assert.doesNotMatch(src, /redeemable|backed by|invest/i);
  }
  const index = readFileSync(new URL('../src/pages/currency-builder/almanac/index.astro', import.meta.url), 'utf8');
  assert.ok(index.includes('/currency-builder/almanac/radio/') && index.includes('/currency-builder/almanac/wheel/'));
});
