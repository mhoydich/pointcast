import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestGet, publicEntry, recordVisit } from '../functions/api/visit.ts';

function fakeKv(seed = {}) {
  const map = new Map(Object.entries(seed));
  return {
    map,
    async get(key, type) { const v = map.get(key); return v === undefined ? null : type === 'json' ? JSON.parse(v) : v; },
    async put(key, value) { map.set(key, value); },
    async delete(key) { map.delete(key); },
    async list({ prefix = '' } = {}) { return { keys: [...map.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }; },
  };
}

test('a new visit stores no city, region or country', async () => {
  const kv = fakeKv();
  const r = await recordVisit({ env: { VISITS: kv }, ip: '203.0.113.9', ua: 'Mozilla/5.0 Safari', cf: { country: 'US', city: 'El Segundo', region: 'California' }, nounId: 7 });
  assert.equal(r.ok, true);
  for (const value of kv.map.values()) {
    assert.ok(!String(value).includes('El Segundo'));
    assert.ok(!String(value).includes('California'));
  }
  assert.equal(r.entry.city, undefined);
  assert.equal(r.entry.country, undefined);
});

test('older entries lose their place on the public read', async () => {
  assert.deepEqual(publicEntry({ t: 1, type: 'human', country: 'US', city: 'Torrance', region: 'California', nounId: 3, firsts: ['country'] }), { t: 1, type: 'human', nounId: 3, firsts: ['country'] });
  const old = [{ t: 1, type: 'human', country: 'JP', city: 'Osaka', region: 'Osaka', nounId: 3 }];
  const env = { VISITS: fakeKv({ 'visits:log': JSON.stringify(old), log: JSON.stringify(old) }) };
  const body = await (await onRequestGet({ env, request: new Request('https://pointcast.xyz/api/visit') })).json();
  assert.ok(!JSON.stringify(body).includes('Osaka'));
  assert.ok(!JSON.stringify(body).includes('"JP"'));
});
