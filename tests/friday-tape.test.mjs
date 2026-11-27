import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { composeFridayTape, encodeBarcode, decodeBarcode } from '../src/lib/friday-tape.mjs';

const cc0 = {
  qty: 1, label: 'Free art note', price: '0.00', currency: 'USD', kind: 'cc0',
  sourceUrl: 'https://pointcast.xyz/nouns-money/coin-and-note/',
  verifiedAt: '2026-11-27T16:18:24.000Z',
};
const shop = {
  ...cc0, label: 'Shop pick', price: '179.99', kind: 'shop',
  sourceUrl: 'https://www.lego.com/en-us/product/dragon-ball-shenron-goku-11390',
};
const input = { version: 1, date: '2026-11-27', station: 'PointCast', items: [cc0, shop] };
const reverseKeys = value => Object.fromEntries(Object.entries(value).reverse());

test('object insertion order is irrelevant, while printed line order and evidence are hashed', () => {
  const a = composeFridayTape(input);
  assert.deepEqual(a, composeFridayTape(reverseKeys({ ...input, items: input.items.map(reverseKeys) })));
  assert.notEqual(a.dayDigestSha256, composeFridayTape({ ...input, items: [shop, cc0] }).dayDigestSha256);
  assert.notEqual(a.dayDigestSha256, composeFridayTape({
    ...input, items: [{ ...cc0, verifiedAt: '2026-11-27T16:18:25.000Z' }, shop],
  }).dayDigestSha256);
  const canonical = '{"date":"2026-11-27","items":[{"currency":"USD","kind":"cc0","label":"Free art note","price":"0.00","qty":1,"sourceUrl":"https://pointcast.xyz/nouns-money/coin-and-note/","verifiedAt":"2026-11-27T16:18:24.000Z"}],"realShopLinks":[],"station":"PointCast","subtotalCC0":"0.00","version":1}';
  assert.equal(composeFridayTape({ ...input, items: [cc0] }).dayDigestSha256,
    createHash('sha256').update(canonical).digest('hex'));
});

test('missing, unsafe, lookalike and non-specific sources fail the whole receipt', () => {
  for (const sourceUrl of [undefined, '', '/nouns-money/coin-and-note/', 'javascript:alert(1)',
    'http://pointcast.xyz/nouns-money/coin-and-note/', 'https://pointcast.xyz.evil.test/nouns-money/coin-and-note/',
    'https://name@pointcast.xyz/nouns-money/coin-and-note/', 'https://pointcast.xyz/']) {
    assert.throws(() => composeFridayTape({ ...input, items: [shop, { ...cc0, sourceUrl }] }), /sourceUrl/);
  }
  assert.throws(() => composeFridayTape({
    ...input, items: [{ ...cc0, kind: 'loom', sourceUrl: 'https://pointcast.xyz/loom?to=%23friday-tape' }],
  }), /exact source/);
});

test('invalid verification/date/quantity is not silently coerced', () => {
  assert.throws(() => composeFridayTape({ ...input, date: '2026-02-30' }), /timestamp/);
  assert.throws(() => composeFridayTape({ ...input, items: [{ ...cc0, verifiedAt: 'yesterday' }] }), /verifiedAt/);
  assert.throws(() => composeFridayTape({ ...input, items: [{ ...cc0, qty: 0 }] }), /qty/);
  assert.throws(() => composeFridayTape({ ...input, items: new Array(1) }), /receipt line/);
});

test('CC0 is always zero; real shop links never affect the subtotal', () => {
  const receipt = composeFridayTape({ ...input, items: [{ ...cc0, qty: 4 }, shop, shop] });
  assert.equal(receipt.subtotalCC0, '0.00');
  assert.deepEqual(receipt.realShopLinks, [shop.sourceUrl]);
  assert.throws(() => composeFridayTape({ ...input, items: [{ ...cc0, price: '0.01' }] }), /nonzero/);
  assert.throws(() => composeFridayTape({ ...input, items: [{ ...shop, price: 179.99 }] }), /price/);
});

test('barcode round-trips the complete digest, including leading zeroes', () => {
  const receipt = composeFridayTape(input);
  assert.equal(decodeBarcode(receipt.barcodeBits), receipt.dayDigestSha256);
  const hex = '0123456789abcdef'.repeat(4);
  assert.equal(encodeBarcode(hex).slice(0, 12), '000000010010');
  assert.equal(decodeBarcode(encodeBarcode(hex)), hex);
  assert.throws(() => decodeBarcode('1'.repeat(255)), /256/);
  assert.throws(() => encodeBarcode('g'.repeat(64)), /SHA-256/);
});

test('JSON twin serves the pinned snapshot, ignoring visitor-supplied data', async () => {
  const { GET, prerender } = await import('../src/pages/friday-tape.json.ts');
  assert.equal(prerender, true);
  const response = GET({ request: new Request('https://pointcast.xyz/friday-tape.json?price=0.01') });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^application\/json/);
  const receipt = await response.json();
  assert.equal(receipt.date, '2026-11-27');
  assert.deepEqual(receipt.items.map(x => x.kind), ['cc0', 'loom', 'github', 'chess', 'shop']);
  assert.deepEqual(receipt, composeFridayTape(receipt));
  assert.equal(decodeBarcode(receipt.barcodeBits), receipt.dayDigestSha256);
});
