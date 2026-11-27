import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  normalizeLine,
  normalizeTape,
  canonicalText,
  sha256Hex,
  bitsFromHex,
  barcodeSvg,
  receiptHtml,
  keepsakeSvg,
  yoursLine,
  totals,
} from '../src/lib/friday-tape-ui.mjs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const fallback = JSON.parse(read('src/data/friday-tape-ui-fallback.json'));

test('the fallback snapshot is RECEIPTLINE v1 and every line carries a source and a check time', () => {
  const tape = normalizeTape(fallback);
  assert.ok(tape);
  assert.equal(tape.dropped, 0);
  assert.equal(tape.items.length, fallback.items.length);
  for (const line of fallback.items) {
    assert.match(line.sourceUrl, /^https:\/\//);
    assert.match(line.verifiedAt, /^2026-11-27T/);
    assert.equal(line.currency, 'USD');
    if (line.kind !== 'shop') assert.equal(line.price, '0.00', `${line.label} is free`);
  }
  assert.equal(fallback.subtotalCC0, totals(tape).madeSubtotal);
});

test('real shop items are listed, not bought, and link the shelf', () => {
  const shop = fallback.items.filter((l) => l.kind === 'shop');
  assert.ok(shop.length >= 1);
  for (const l of shop) assert.match(l.badge, /NOT BOUGHT/);
  assert.ok(fallback.realShopLinks.includes('https://pointcast.xyz/shop/'));
  assert.equal(totals(normalizeTape(fallback)).paid, '0.00');
});

test('a line without a source, a date, a USD price or a known kind is left off', () => {
  const ok = { qty: 1, label: 'x', price: '0.00', currency: 'USD', kind: 'cc0', sourceUrl: 'https://pointcast.xyz/', verifiedAt: '2026-11-27T16:00:00Z' };
  assert.ok(normalizeLine(ok));
  assert.equal(normalizeLine({ ...ok, sourceUrl: '' }), null);
  assert.equal(normalizeLine({ ...ok, sourceUrl: 'http://pointcast.xyz/' }), null);
  assert.equal(normalizeLine({ ...ok, verifiedAt: 'today' }), null);
  assert.equal(normalizeLine({ ...ok, price: '-1' }), null);
  assert.equal(normalizeLine({ ...ok, price: '12.5%' }), null);
  assert.equal(normalizeLine({ ...ok, currency: 'EUR' }), null);
  assert.equal(normalizeLine({ ...ok, kind: 'deal' }), null);
  assert.equal(normalizeLine({ ...ok, qty: 0 }), null);
  const tape = normalizeTape({ version: 1, date: '2026-11-27', items: [ok, { ...ok, sourceUrl: '' }] });
  assert.equal(tape.items.length, 1);
  assert.equal(tape.dropped, 1);
  assert.equal(normalizeTape({ version: 2, date: '2026-11-27', items: [ok] }), null);
});

test('your honest line needs words, no source, and is capped', () => {
  assert.equal(yoursLine('didnt', '   '), null);
  const l = yoursLine('made', 'a pot of soup '.repeat(10));
  assert.equal(l.kind, 'yours');
  assert.match(l.label, /^MADE TODAY: /);
  assert.ok(l.label.length <= 'MADE TODAY: '.length + 48);
  assert.match(yoursLine('didnt', 'a TV').label, /^DIDN'T BUY: a TV$/);
});

test('the barcode is a real SHA-256 of the printed lines', async () => {
  assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  const tape = normalizeTape(fallback);
  const text = canonicalText(tape);
  assert.equal(text.split('\n')[0], 'date|2026-11-27');
  assert.equal(text.split('\n').length, tape.items.length + 1);
  const digest = await sha256Hex(text);
  assert.match(digest, /^[0-9a-f]{64}$/);
  const withYours = await sha256Hex(canonicalText(tape, [yoursLine('didnt', 'a TV')]));
  assert.notEqual(withYours, digest);
  const bits = bitsFromHex(digest);
  assert.equal(bits.length, 256);
  assert.match(bits, /^[01]+$/);
  const bars = barcodeSvg(bits).match(/<rect /g).length;
  assert.equal(bars, 256 + 12, 'one bar per bit plus two 3-bar guards per row');
});

test('the receipt escapes what it prints and says amount paid 0.00', async () => {
  const tape = normalizeTape({
    version: 1,
    date: '2026-11-27',
    items: [{ qty: 1, label: '<img src=x onerror=alert(1)>', price: '0.00', kind: 'loom', sourceUrl: 'https://pointcast.xyz/"onclick', verifiedAt: '2026-11-27T16:24:00Z' }],
  });
  const digest = await sha256Hex(canonicalText(tape));
  const html = receiptHtml(tape, { digest });
  assert.doesNotMatch(html, /<img/);
  assert.match(html, /&lt;img src=x/);
  assert.doesNotMatch(html, /"onclick/);
  assert.match(html, /AMOUNT PAID<\/dt><dd>0\.00/);
  assert.match(html, /SNAPSHOT 8:24 AM PT/);
  assert.match(html, /TEAR RECEIPT/);
  assert.ok(html.includes(digest.slice(0, 8)));
});

test('the keepsake is a 1080×1350 SVG with the digest and well-formed text', async () => {
  const tape = normalizeTape(fallback);
  const yours = yoursLine('didnt', 'a TV & a <toaster>');
  const digest = await sha256Hex(canonicalText(tape, [yours]));
  const svg = keepsakeSvg(tape, { digest, yours, tornAt: '2026-11-27T19:52:00Z' });
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="1080" height="1350"/);
  assert.ok(svg.includes(digest.slice(0, 8)));
  assert.match(svg, /TORN 11:52 AM PT/);
  assert.match(svg, /a TV &amp; a/);
  assert.match(svg, /&lt;toaster&gt;/);
  assert.doesNotMatch(svg.replace(/&(amp|lt|gt|quot|#39);/g, ''), /&/);
});

test('no tracking, storage or wallet on the page', () => {
  const page = read('src/pages/friday-tape.astro');
  const script = read('src/scripts/friday-tape.mjs');
  const lib = read('src/lib/friday-tape-ui.mjs');
  assert.match(page, /\bisolated\b/, 'isolated drops the pageview and analytics beacons');
  for (const src of [script, lib]) {
    assert.doesNotMatch(src, /localStorage|sessionStorage|sendBeacon|document\.cookie|taquito|beacon-sdk|wallet\.|requestPermissions/i);
  }
  assert.match(page, /Add your 1 honest line/);
  assert.match(page, /What I didn’t buy/);
  assert.match(page, /What I made today/);
});
