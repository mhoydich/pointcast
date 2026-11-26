import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchNewestHolders,
  relativeTime,
  shapeNewestHolders,
} from '../public/nouns-money/newest-holders/data.mjs';

const NOW = Date.parse('2026-11-25T16:00:00Z');
const OFFICE = 'tz1Qfz1863b6JEcboRWppXLYUnbrqigNQSnE';
const BURN = 'tz1burnburnburnburnburnburnburjAYjjX';
const CONTRACT = 'KT1U7ezCFkEbEkhavPzCGYFvxHB7oj14DCNm';
const OTHER_COLLECTION = 'KT1Mp6gEa4ENmChWTgkQZbX81qaTTW6EdUbt';
const collections = [{ contract: CONTRACT, name: 'Nouns Money · gm notes' }];
const config = { officeDomain: 'officenoun.tez', collections };
const options = { office: OFFICE, collections, now: NOW };
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
// Synthetic, syntactically valid account fixtures; no live wallets or network reads.
const wallet = (index) => `tz1${'A'.repeat(31)}${alphabet[Math.floor(index / 58)]}${alphabet[index % 58]}`;
const at = (minutesAgo) => new Date(NOW - minutesAgo * 60_000).toISOString();
const transfer = (index, minutesAgo, overrides = {}) => ({
  id: index,
  timestamp: at(minutesAgo),
  from: { address: OFFICE },
  to: { address: wallet(index) },
  amount: '1',
  token: {
    contract: { address: CONTRACT },
    tokenId: String(index),
    metadata: {
      name: `Note ${index}`,
      thumbnailUri: `https://images.example/note-${index}.png`,
    },
  },
  ...overrides,
});
const domain = (address, name, overrides = {}) => ({
  address: { address },
  name,
  reverse: true,
  expiration: '2027-11-25T16:00:00Z',
  ...overrides,
});

test('newest holders excludes the office, burn, self, zero and malformed transfers', () => {
  const rows = [
    transfer(1, 1, { to: { address: OFFICE } }),
    transfer(2, 2, { to: { address: BURN } }),
    transfer(3, 3, { to: null }),
    transfer(4, 4, { from: { address: wallet(4) } }),
    transfer(5, 5, { amount: '0' }),
    transfer(6, 6, { token: { ...transfer(6, 6).token, contract: { address: OTHER_COLLECTION } } }),
    transfer(7, 7, { timestamp: 'not a timestamp' }),
    transfer(8, 8, { to: { address: 'tz1not-an-account' } }),
    transfer(9, 9),
  ];
  const result = shapeNewestHolders(rows, options);
  assert.deepEqual(result.map((row) => row.address), [wallet(9)]);
  assert.equal(result[0].contract, CONTRACT);
  assert.equal(result[0].tokenId, '9');
  assert.equal(result[0].name, 'Note 9');
  assert.equal(result[0].thumbnail, 'https://images.example/note-9.png');
  assert.equal(new URL(result[0].objktUrl).hostname, 'objkt.com');
  assert.ok(result[0].objktUrl.includes(CONTRACT));
  assert.ok(result[0].objktUrl.endsWith('/9'));
});

test('newest holders orders receives by time and ID, keeping one latest note per wallet', () => {
  const rows = [
    transfer(1, 9),
    transfer(2, 3),
    transfer(3, 1),
    transfer(4, 1, { to: { address: wallet(1) } }),
    transfer(5, 8, { to: { address: wallet(2) } }),
  ];
  const result = shapeNewestHolders(rows, options);
  assert.deepEqual(result.map((row) => row.address), [wallet(1), wallet(3), wallet(2)]);
  assert.deepEqual(result.map((row) => row.tokenId), ['4', '3', '2']);
  assert.deepEqual(result.map((row) => row.timestamp), [at(1), at(1), at(3)]);
});

test('newest holders caps the strip at 12 distinct wallets after exclusions', () => {
  const rows = Array.from({ length: 16 }, (_, i) => transfer(i + 1, i + 1)).reverse();
  rows.push(transfer(17, 0, { to: { address: OFFICE } }));
  rows.push(transfer(18, 20, { to: { address: wallet(1) } }));
  const result = shapeNewestHolders(rows, options);
  assert.equal(result.length, 12);
  assert.deepEqual(result.map((row) => row.address), Array.from({ length: 12 }, (_, i) => wallet(i + 1)));
});

test('active reverse .tez names take priority over aliases and shortened addresses', () => {
  const rows = [
    transfer(1, 1, { to: { address: wallet(1), alias: 'old-name.tez' } }),
    transfer(2, 2, { to: { address: wallet(2), alias: 'collector.tez' } }),
    transfer(3, 3, { to: { address: wallet(3), alias: 'ordinary display name' } }),
    transfer(4, 4),
  ];
  const domains = [
    domain(wallet(1), 'new-name.tez'),
    domain(wallet(2), 'expired.tez', { expiration: '2025-11-25T16:00:00Z' }),
    domain(wallet(3), 'forward-only.tez', { reverse: false }),
    domain(wallet(4), 'wrong-domain.example'),
  ];
  const result = shapeNewestHolders(rows, { ...options, domains });
  assert.deepEqual(result.map((row) => row.label), [
    'new-name.tez',
    'collector.tez',
    `${wallet(3).slice(0, 6)}…${wallet(3).slice(-4)}`,
    `${wallet(4).slice(0, 6)}…${wallet(4).slice(-4)}`,
  ]);
});

test('relative receive times are concise at minute, hour and day boundaries', () => {
  assert.equal(relativeTime(new Date(NOW - 20_000).toISOString(), NOW), 'just now');
  assert.equal(relativeTime(at(1), NOW), '1m ago');
  assert.equal(relativeTime(at(120), NOW), '2h ago');
  assert.equal(relativeTime(at(3 * 24 * 60), NOW), '3d ago');
});

test('a failed live read rejects instead of manufacturing a holder result', async () => {
  await assert.rejects(() => fetchNewestHolders(
    async () => new Response('upstream unavailable', { status: 503 }),
    config,
    { now: new Date(NOW) },
  ));
});

test('live reads use the configured collections and enrich recipients with full domain rows', async () => {
  const calls = [];
  const fetcher = async (url) => {
    const request = new URL(url);
    calls.push(request);
    if (request.searchParams.has('name')) return Response.json([domain(OFFICE, 'officenoun.tez')]);
    if (request.pathname.endsWith('/tokens/transfers')) {
      assert.equal(request.searchParams.get('token.contract.in'), CONTRACT);
      return Response.json([transfer(1, 1), transfer(2, 2)]);
    }
    assert.equal(request.searchParams.get('address.in'), `${wallet(1)},${wallet(2)}`);
    return Response.json([domain(wallet(1), 'new-holder.tez')]);
  };
  const result = await fetchNewestHolders(fetcher, config, { now: new Date(NOW) });
  assert.equal(calls.length, 3);
  assert.equal(calls[0].searchParams.get('name'), 'officenoun.tez');
  assert.equal(result[0].label, 'new-holder.tez');
  assert.equal(result[1].label, `${wallet(2).slice(0, 6)}…${wallet(2).slice(-4)}`);
});

test('live reads page past repeat recipients to find 12 wallets using the last transfer ID', async () => {
  const transferCalls = [];
  const fetcher = async (url) => {
    const request = new URL(url);
    if (request.searchParams.has('name')) return Response.json([domain(OFFICE, 'officenoun.tez')]);
    if (!request.pathname.endsWith('/tokens/transfers')) return Response.json([]);
    transferCalls.push(request);
    const limit = Number(request.searchParams.get('limit'));
    if (!request.searchParams.has('id.lt')) {
      return Response.json(Array.from({ length: limit }, (_, i) => transfer(1, 1 + i, { id: 300 - i })));
    }
    assert.equal(request.searchParams.get('id.lt'), String(301 - limit));
    return Response.json(Array.from({ length: 11 }, (_, i) => transfer(i + 2, limit + i + 1, { id: 300 - limit - i })));
  };
  const result = await fetchNewestHolders(fetcher, config, { now: new Date(NOW) });
  assert.equal(transferCalls.length, 2);
  assert.deepEqual(result.map((row) => row.address), Array.from({ length: 12 }, (_, i) => wallet(i + 1)));
});

test('an unresolved office fails closed before reading recipients', async () => {
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return Response.json([]);
  };
  await assert.rejects(() => fetchNewestHolders(fetcher, config, { now: new Date(NOW) }));
  assert.equal(calls, 1);
});

test('expired or mismatched office domains fail closed before reading recipients', async () => {
  for (const row of [
    domain(OFFICE, 'officenoun.tez', { expiration: at(1) }),
    domain(OFFICE, 'someone-else.tez'),
  ]) {
    let calls = 0;
    await assert.rejects(() => fetchNewestHolders(async () => {
      calls++;
      return Response.json([row]);
    }, config, { now: new Date(NOW) }), /Office address unavailable/);
    assert.equal(calls, 1);
  }
});

test('a transfer read failure rejects after office resolution', async () => {
  const fetcher = async (url) => new URL(url).searchParams.has('name')
    ? Response.json([domain(OFFICE, 'officenoun.tez')])
    : new Response('upstream unavailable', { status: 502 });
  await assert.rejects(() => fetchNewestHolders(fetcher, config, { now: new Date(NOW) }));
});

test('an optional name lookup failure retains confirmed recipients with shortened labels', async () => {
  const fetcher = async (url) => {
    const request = new URL(url);
    if (request.searchParams.has('name')) return Response.json([domain(OFFICE, 'officenoun.tez')]);
    if (request.pathname.endsWith('/tokens/transfers')) return Response.json([transfer(1, 1)]);
    throw new TypeError('name lookup failed');
  };
  const result = await fetchNewestHolders(fetcher, config, { now: new Date(NOW) });
  assert.equal(result.length, 1);
  assert.equal(result[0].label, `${wallet(1).slice(0, 6)}…${wallet(1).slice(-4)}`);
});

test('a non-advancing transfer cursor rejects instead of returning an incomplete strip', async () => {
  let pages = 0;
  const fetcher = async (url) => {
    const request = new URL(url);
    if (request.searchParams.has('name')) return Response.json([domain(OFFICE, 'officenoun.tez')]);
    assert.ok(request.pathname.endsWith('/tokens/transfers'));
    pages++;
    const limit = Number(request.searchParams.get('limit'));
    return Response.json(Array.from({ length: limit }, (_, i) => transfer(1, 1 + i, { id: 300 - i })));
  };
  await assert.rejects(() => fetchNewestHolders(fetcher, config, { now: new Date(NOW) }), /Incomplete transfer history/);
  assert.equal(pages, 2);
});
