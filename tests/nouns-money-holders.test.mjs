import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { countNounsMoneyHolders, holdersOf, BURN, OFFICE_UNRESOLVED, PAGINATION_INCOMPLETE } from '../src/lib/nouns-money-holders.mjs';
import { onRequestGet } from '../functions/api/nouns-money/holders.ts';

const config = JSON.parse(readFileSync(new URL('../src/data/nouns-money-collections.json', import.meta.url)));
// Base58Check fixtures from synthetic 20-byte public hashes, not live wallets.
const OFFICE = 'tz1Qfz1863b6JEcboRWppXLYUnbrqigNQSnE';
const ORIGINATED_OFFICE = 'KT1FdWCa4EeEQMMAdeDuZfkLJCpcnUaMCw79';
const OTHER = 'KT1U7ezCFkEbEkhavPzCGYFvxHB7oj14DCNm';
const THIRD = 'KT1Mp6gEa4ENmChWTgkQZbX81qaTTW6EdUbt';
const FOURTH = 'KT1Jx6gsKwuDNh99FniyDKHLotwBU9438e6f';
const FULL = Array(10_000).fill(OTHER);

function fakeFetch(pages, domain = () => Response.json([OFFICE])) {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    if (url.includes('/domains?')) {
      const select = new URL(url).searchParams.get('select');
      if (select === 'address') return Response.json([{ address: OFFICE }]);
      assert.equal(select, 'address.address', 'TzKT must project the plain address string');
      return domain();
    }
    const offset = Number(new URL(url).searchParams.get('offset'));
    return Response.json(pages[offset / 10_000] || []);
  };
  return { fetcher, calls };
}

test('collection list is valid and unique', () => {
  const seen = new Set();
  for (const c of config.collections) {
    assert.match(c.contract, /^KT1[1-9A-HJ-NP-Za-km-z]{33}$/);
    assert.ok(!seen.has(c.contract), `duplicate ${c.contract}`);
    seen.add(c.contract);
    assert.ok(c.name);
  }
});

test('counts unique holders, excluding the office wallet and burn', async () => {
  const { fetcher } = fakeFetch([[OTHER, THIRD, OTHER, OFFICE, BURN, FOURTH]]);
  const out = await countNounsMoneyHolders(fetcher, config, new Date('2026-11-23T13:47:00Z'));
  assert.equal(out.holders, 3);
  assert.equal(out.excludes.office, OFFICE);
  assert.equal(out.collections, config.collections.length);
  assert.equal(out.observedAt, '2026-11-23T13:47:00.000Z');
});

test('pages until a short page', async () => {
  const full = FULL;
  const { fetcher, calls } = fakeFetch([full, [OTHER, THIRD]]);
  const set = await holdersOf(fetcher, config.collections.map((c) => c.contract));
  assert.equal(set.size, 2);
  assert.equal(calls.length, 2);
});

test('a tzkt error surfaces instead of a fake zero', async () => {
  const fetcher = async () => new Response('nope', { status: 502 });
  await assert.rejects(() => countNounsMoneyHolders(fetcher, { collections: config.collections }), /tzkt 502/);
});

test('an originated account can be the resolved office exclusion', async () => {
  const { fetcher } = fakeFetch([[ORIGINATED_OFFICE, OTHER]], () => Response.json([ORIGINATED_OFFICE]));
  const out = await countNounsMoneyHolders(fetcher, config);
  assert.equal(out.holders, 1);
  assert.equal(out.excludes.office, ORIGINATED_OFFICE);
});

const officeFailures = [
  ['HTTP error', () => new Response('upstream failure', { status: 502 })],
  ['network failure', () => { throw new TypeError('fetch failed'); }],
  ['empty result', () => Response.json([])],
  ['invalid JSON', () => new Response('not json')],
  ['invalid shape', () => Response.json([{ address: OFFICE }])],
  ['invalid address syntax', () => Response.json(['tz1office00'])],
  ['invalid address checksum', () => Response.json([OFFICE.slice(0, -1) + 'F'])],
];
for (const [label, domain] of officeFailures) {
  test(`office ${label} fails closed before an otherwise valid balance read`, async () => {
    const { fetcher, calls } = fakeFetch([[OFFICE, OTHER]], domain);
    await assert.rejects(() => countNounsMoneyHolders(fetcher, config), { message: OFFICE_UNRESOLVED });
    assert.equal(calls.length, 1);
    assert.match(calls[0], /\/domains\?name=officenoun\.tez/);
  });
}

test('the final allowed page may prove completeness', async () => {
  const { fetcher, calls } = fakeFetch([...Array(19).fill(FULL), [THIRD]]);
  const holders = await holdersOf(fetcher, config.collections.map((c) => c.contract));
  assert.equal(holders.size, 2);
  assert.equal(calls.length, 20);
});

test('twenty full pages never return a partial holder total', async () => {
  const { fetcher, calls } = fakeFetch([...Array(20).fill(FULL), [THIRD]]);
  await assert.rejects(() => countNounsMoneyHolders(fetcher, config), { message: PAGINATION_INCOMPLETE });
  const balanceCalls = calls.filter((url) => url.includes('/tokens/balances?'));
  assert.equal(balanceCalls.length, 20);
  assert.equal(new URL(balanceCalls.at(-1)).searchParams.get('offset'), '190000');
});

for (const [reason, pages, domain] of [
  [OFFICE_UNRESOLVED, [[OFFICE, OTHER]], () => Response.json([])],
  [PAGINATION_INCOMPLETE, Array(20).fill(FULL), undefined],
]) {
  test(`the Pages handler returns 503, no-store and a null count for ${reason}`, async (t) => {
    const { fetcher } = fakeFetch(pages, domain);
    t.mock.method(globalThis, 'fetch', fetcher);
    const response = await onRequestGet();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), {
      schema: 'pointcast.nouns-money-holders/v1',
      holders: null,
      error: reason,
    });
  });
}

test('the Pages handler retains a cacheable successful count', async (t) => {
  const { fetcher } = fakeFetch([[OFFICE, BURN, OTHER]]);
  t.mock.method(globalThis, 'fetch', fetcher);
  const response = await onRequestGet();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=600, s-maxage=600');
  const body = await response.json();
  assert.equal(body.holders, 1);
  assert.equal(body.excludes.office, OFFICE);
  assert.equal(body.collections, config.collections.length);
});

test('an actual empty balance page retains a cacheable zero', async (t) => {
  const { fetcher } = fakeFetch([[]]);
  t.mock.method(globalThis, 'fetch', fetcher);
  const response = await onRequestGet();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=600, s-maxage=600');
  assert.equal((await response.json()).holders, 0);
});

test('malformed balance entries invalidate the entire count, including earlier pages', async (t) => {
  for (const malformed of [null, { address: THIRD }, '', 'not-an-account', OTHER.slice(0, -1) + 'B']) {
    const { fetcher, calls } = fakeFetch([FULL, [THIRD, malformed]]);
    const mock = t.mock.method(globalThis, 'fetch', fetcher);
    try {
      const response = await onRequestGet();
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), {
        schema: 'pointcast.nouns-money-holders/v1',
        holders: null,
        error: 'unavailable',
      });
      assert.equal(calls.length, 3);
    } finally {
      mock.mock.restore();
    }
  }
});
