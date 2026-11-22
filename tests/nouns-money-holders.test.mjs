import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { countNounsMoneyHolders, holdersOf, BURN } from '../src/lib/nouns-money-holders.mjs';

const config = JSON.parse(readFileSync(new URL('../src/data/nouns-money-collections.json', import.meta.url)));
const OFFICE = 'tz1officeofficeofficeofficeoffice00';

function fakeFetch(pages) {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    if (url.includes('/domains?')) return new Response(JSON.stringify([OFFICE]));
    const offset = Number(new URL(url).searchParams.get('offset'));
    return new Response(JSON.stringify(pages[offset / 10_000] || []));
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
  const { fetcher } = fakeFetch([['tz1a', 'tz1b', 'tz1a', OFFICE, BURN, 'tz2c']]);
  const out = await countNounsMoneyHolders(fetcher, config, new Date('2026-11-23T13:47:00Z'));
  assert.equal(out.holders, 3);
  assert.equal(out.excludes.office, OFFICE);
  assert.equal(out.collections, config.collections.length);
  assert.equal(out.observedAt, '2026-11-23T13:47:00.000Z');
});

test('pages until a short page', async () => {
  const full = Array.from({ length: 10_000 }, (_, i) => `tz1x${i}`);
  const { fetcher, calls } = fakeFetch([full, ['tz1last']]);
  const set = await holdersOf(fetcher, config.collections.map((c) => c.contract));
  assert.equal(set.size, 10_001);
  assert.equal(calls.length, 2);
});

test('a tzkt error surfaces instead of a fake zero', async () => {
  const fetcher = async () => new Response('nope', { status: 502 });
  await assert.rejects(() => countNounsMoneyHolders(fetcher, { collections: config.collections }), /tzkt 502/);
});
