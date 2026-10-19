import test from 'node:test';
import assert from 'node:assert/strict';
import { SaxesParser } from 'saxes';
import { nounArt } from '../src/lib/currency-builder/primitives.mjs';
import { registerCells } from '../src/lib/currency-builder/security.mjs';
import { FEATURES, securityEntries, securityFiles, securityNote, securitySVG } from '../src/lib/currency-builder/security-edition.mjs';

const BANNED = /\b(invest\w*|shares?|backed|redeemable|returns|profit\w*|yield|guaranteed)\b/i;
const entries = securityEntries();

function assertWellFormed(xml, label) {
  const parser = new SaxesParser({ xmlns: true });
  let error = null;
  parser.on('error', (e) => { error = e; });
  parser.write(xml).close();
  assert.equal(error, null, `${label} is well-formed XML`);
}

test('every Commons, Global Barter and Almanac note has a Security Edition', () => {
  assert.equal(entries.length, 192);
  const serials = entries.map(({ collection, entry }) => securityNote(collection, entry).serial);
  assert.equal(new Set(serials).size, 192, 'serials are unique across collections');
  for (const { collection, entry } of entries) {
    const files = securityFiles(collection, entry);
    assert.equal(files.front, `/currency-builder/security/${collection}/front/${entry.slug}.svg`);
    assert.equal(files.back, `/currency-builder/security/${collection}/back/${entry.slug}.svg`);
  }
});

test('faces are well-formed, labeled, compact and deterministic, and every reference resolves', () => {
  for (const { collection, entry } of entries) {
    for (const face of ['front', 'back']) {
      const svg = securitySVG(collection, entry, face);
      const label = `${collection}/${entry.slug} ${face}`;
      assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 1200 600" width="150mm" height="75mm" role="img" aria-label="[^"]+">/);
      assertWellFormed(svg, label);
      assert.ok(svg.length < 170 * 1024, `${label} stays under 170 KB (${Math.round(svg.length / 1024)} KB)`);
      assert.equal(securitySVG(collection, entry, face), svg, `${label} renders deterministically`);
      const ids = new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
      for (const [, ref] of svg.matchAll(/(?:href="#|url\(#)([^")]+)/g)) assert.ok(ids.has(ref), `${label} defines #${ref}`);
      // The disclaimer is outlined type, so check the source text through the label and microtext.
      assert.match(svg, /ART NOTE NOT LEGAL TENDER|SECURITY FEATURES ARE PRINTED ART/);
    }
  }
});

test('the back medallion carries the full Noun, pixel for pixel', () => {
  for (const { collection, entry } of entries) {
    const pixels = nounArt(entry.nounId).svg.replace(/^<svg[^>]*><rect width="100%" height="100%"[^>]*\/>/, '').replace(/<\/svg>$/, '');
    assert.ok(pixels.includes('<rect'), `Noun #${entry.nounId} has pixels`);
    assert.ok(securitySVG(collection, entry, 'back').includes(pixels), `${entry.slug} back shows all of Noun #${entry.nounId}, glasses included`);
  }
});

test('see-through register halves meet exactly, with no noggle motif', () => {
  for (const seed of [0, 7, 42, 99]) {
    const cells = registerCells(seed);
    assert.equal(cells.length, 41, 'the diamond has 41 cells');
    assert.ok(cells.some((c) => c.front) && cells.some((c) => !c.front), 'both faces carry part of it');
  }
  for (const [name, body] of FEATURES) {
    assert.doesNotMatch(`${name} ${body}`, /noggle/i);
    assert.doesNotMatch(`${name} ${body}`, BANNED);
  }
});

test('every front line fits without being cut: two lines, or three at the smaller size', async () => {
  const { wrapMeasured } = await import('../src/lib/currency-builder/type.mjs');
  for (const { collection, entry } of entries) {
    const line = securityNote(collection, entry).line;
    const wide = wrapMeasured('body', line, 19, 390);
    const lines = wide.length > 2 ? wrapMeasured('body', line, 16.5, 390) : wide;
    assert.ok(lines.length <= 3, `${collection}/${entry.slug} front line fits in three lines`);
    if (collection !== 'almanac') assert.ok(wide.length <= 2, `${collection}/${entry.slug} keeps its two-line front`);
  }
});
