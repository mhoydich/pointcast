import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  normalizeLine,
  normalizeTape,
  canonicalJson,
  sha256Hex,
  bitsFromHex,
  barcodeSvg,
  receiptHtml,
  keepsakeSvg,
  yoursLine,
  totals,
  verifyTape,
  personalFingerprint,
} from '../src/lib/friday-tape-ui.mjs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const fallback = JSON.parse(read('src/data/friday-tape-ui-fallback.json'));
// Shwa's composer output from PR #1976 (branch shwa/friday-tape-ledger-20261127), byte for byte.
const sample1976 = JSON.parse(read('tests/fixtures/friday-tape-1976-sample.json'));

test('the fallback snapshot is RECEIPTLINE v1 and every line carries a source and a check time', () => {
  const tape = normalizeTape(fallback);
  assert.ok(tape);
  assert.equal(tape.dropped, 0);
  assert.equal(tape.items.length, fallback.items.length);
  for (const line of fallback.items) {
    assert.match(line.sourceUrl, /^https:\/\//);
    assert.match(line.verifiedAt, /^2026-11-27T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
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
  const ok = { qty: 1, label: 'x', price: '0.00', currency: 'USD', kind: 'cc0', sourceUrl: 'https://pointcast.xyz/', verifiedAt: '2026-11-27T16:00:00.000Z' };
  assert.ok(normalizeLine(ok));
  assert.equal(normalizeLine({ ...ok, sourceUrl: '' }), null);
  assert.equal(normalizeLine({ ...ok, sourceUrl: 'http://pointcast.xyz/' }), null);
  assert.equal(normalizeLine({ ...ok, verifiedAt: 'today' }), null);
  assert.equal(normalizeLine({ ...ok, price: '-1' }), null);
  assert.equal(normalizeLine({ ...ok, price: '12.5%' }), null);
  assert.equal(normalizeLine({ ...ok, price: '5' }), null, 'prices are printed as published, so they must already read 0.00');
  assert.equal(normalizeLine({ ...ok, label: ' padded ' }), null, 'labels are printed as published, never trimmed');
  assert.equal(normalizeLine({ ...ok, currency: 'EUR' }), null);
  assert.equal(normalizeLine({ ...ok, kind: 'deal' }), null);
  assert.equal(normalizeLine({ ...ok, qty: 0 }), null);
  const tape = normalizeTape({ version: 1, date: '2026-11-27', station: 'PointCast', items: [ok, { ...ok, sourceUrl: '' }] });
  assert.equal(tape.items.length, 1);
  assert.equal(tape.dropped, 1);
  assert.equal(normalizeTape({ version: 2, date: '2026-11-27', station: 'PointCast', items: [ok] }), null);
});

test('your honest line needs words, no source, and is capped', () => {
  assert.equal(yoursLine('didnt', '   '), null);
  const l = yoursLine('made', 'a pot of soup '.repeat(10));
  assert.equal(l.kind, 'yours');
  assert.match(l.label, /^MADE TODAY: /);
  assert.ok(l.label.length <= 'MADE TODAY: '.length + 48);
  assert.match(yoursLine('didnt', 'a TV').label, /^DIDN'T BUY: a TV$/);
  const tape = normalizeTape(fallback);
  assert.equal(totals(tape, [l]).madeCount, totals(tape).madeCount, 'your line is printed but not counted as the town’s');
});

test('Shwa’s #1976 feed verifies: same fingerprint, same 256 bits', async () => {
  const check = await verifyTape(sample1976);
  assert.equal(check.ok, true, check.reason);
  assert.equal(check.digest, 'a2195deaf6378e49c8d4198a6b64694dead484d50a2a13656166bd35d73ab396');
  assert.equal(check.digest, sample1976.dayDigestSha256);
  assert.equal(bitsFromHex(check.digest), sample1976.barcodeBits);
  assert.equal(await sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(canonicalJson({ b: 1, a: [{ d: 'x', c: null }] }), '{"a":[{"c":null,"d":"x"}],"b":1}');
});

test('the page prints the feed’s own digest and bits, untouched', async () => {
  const check = await verifyTape(sample1976);
  const html = receiptHtml(check.tape, { digest: check.digest, source: 'live' });
  assert.ok(html.includes('a2195dea f6378e49 c8d4198a 6b64694d ead484d5 0a2a1365 6166bd35 d73ab396'));
  assert.equal((receiptHtml(check.tape, { digest: check.digest }).match(/<rect /g) || []).length, 256 + 12);
  assert.doesNotMatch(html, /PERSONAL COPY/);
  const svg = keepsakeSvg(check.tape, { digest: check.digest });
  assert.ok(svg.includes('a2195dea f6378e49 c8d4198a 6b64694d'));
  assert.ok(svg.includes('ead484d5 0a2a1365 6166bd35 d73ab396'));
  assert.doesNotMatch(svg, /PERSONAL COPY/);
});

test('a feed whose fingerprint or bits don’t recompute is rejected', async () => {
  const tampered = structuredClone(sample1976);
  tampered.items[0].label = 'Nouns Money art note (fre)';
  assert.equal((await verifyTape(tampered)).reason, 'digest');
  const badBits = { ...sample1976, barcodeBits: sample1976.barcodeBits.replace(/^1/, '0') };
  assert.equal((await verifyTape(badBits)).reason, 'bits');
  const noDigest = { ...sample1976 };
  delete noDigest.dayDigestSha256;
  assert.equal((await verifyTape(noDigest)).ok, false);
  const badLine = structuredClone(sample1976);
  badLine.items[1].sourceUrl = '';
  assert.equal((await verifyTape(badLine)).reason, 'lines', 'a feed line the receipt can’t print is never hashed around');
});

test('the checked snapshot carries its own canonical fingerprint', async () => {
  const check = await verifyTape(fallback);
  assert.equal(check.ok, true, check.reason);
  assert.equal(fallback.barcodeBits.length, 256);
});

test('your line makes a personal copy with its own hash; the original stays as published', async () => {
  const check = await verifyTape(sample1976);
  const yours = yoursLine('didnt', 'a TV');
  const personal = await personalFingerprint(check.digest, yours);
  assert.match(personal, /^[0-9a-f]{64}$/);
  assert.notEqual(personal, check.digest);
  const html = receiptHtml(check.tape, { digest: check.digest, yours, personalDigest: personal });
  assert.match(html, /PERSONAL COPY/);
  assert.match(html, /ORIGINAL RECEIPT FINGERPRINT/);
  assert.ok(html.includes('a2195dea f6378e49'));
  assert.ok(html.includes(personal.slice(0, 8)));
  const svg = keepsakeSvg(check.tape, { digest: check.digest, yours, personalDigest: personal });
  assert.match(svg, /PERSONAL COPY/);
  assert.ok(svg.includes('a2195dea f6378e49 c8d4198a 6b64694d'));
});

test('the receipt escapes what it prints and says amount paid 0.00', async () => {
  const tape = normalizeTape({
    version: 1,
    date: '2026-11-27',
    station: 'PointCast',
    items: [{ qty: 1, label: '<img src=x onerror=alert(1)>', price: '0.00', kind: 'loom', sourceUrl: 'https://pointcast.xyz/%22onclick', verifiedAt: '2026-11-27T16:24:00.000Z' }],
  });
  const digest = await sha256Hex('x');
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
  const { digest } = await verifyTape(fallback);
  const svg = keepsakeSvg(tape, { digest, yours, personalDigest: await personalFingerprint(digest, yours), tornAt: '2026-11-27T19:52:00Z' });
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
