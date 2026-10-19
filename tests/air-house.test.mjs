import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  DIRECTOR_WALLET,
  DIRECTOR_WALLET_PROVIDERS,
  HOUSE_ROLES,
  HOUSE_SELECT,
  houseUser,
  isHouseRow,
  squash,
} from '../functions/_lib/air-house.mjs';

const root = new URL('../', import.meta.url);
const OTHER_TZ = 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb';

test('house: the broadcaster and director roles are house, nothing else is', () => {
  assert.deepEqual([...HOUSE_ROLES], ['broadcaster', 'director']);
  assert.equal(houseUser(JSON.stringify({ roles: ['broadcaster'] })), true);
  assert.equal(houseUser(JSON.stringify({ roles: ['reader', 'director'] })), true);
  assert.equal(houseUser({ roles: ['director'] }), true, 'an object payload works too');
  assert.equal(houseUser(JSON.stringify({ roles: [] })), false);
  assert.equal(houseUser(JSON.stringify({ roles: ['reader'] })), false);
  assert.equal(houseUser(JSON.stringify({})), false);
  assert.equal(houseUser(JSON.stringify({ roles: 'broadcaster' })), false, 'roles must be an array');
  assert.equal(houseUser(JSON.stringify({ roles: { broadcaster: true } })), false);
});

test('house: bad payloads are never house', () => {
  for (const bad of ['{not json', '', 'null', '[]', '"broadcaster"', '42', null, undefined, 42, true, ['broadcaster']]) {
    assert.equal(houseUser(bad), false, String(bad));
  }
});

test('house: the director wallet on a Tezos provider is house, elsewhere it is not', () => {
  assert.deepEqual([...DIRECTOR_WALLET_PROVIDERS], ['kukai', 'temple', 'umami', 'metamask-tezos']);
  for (const provider of DIRECTOR_WALLET_PROVIDERS) {
    assert.equal(houseUser(JSON.stringify({ identities: [{ provider, id: DIRECTOR_WALLET }] })), true, provider);
  }
  assert.equal(houseUser(JSON.stringify({ identities: [{ provider: 'metamask', id: DIRECTOR_WALLET }] })), true, 'metamask with a tz id');
  assert.equal(houseUser(JSON.stringify({ identities: [{ provider: 'github', id: DIRECTOR_WALLET }] })), false, 'the wallet string on github');
  assert.equal(houseUser(JSON.stringify({ identities: [{ provider: 'kukai', id: OTHER_TZ }] })), false, 'another tz address');
  assert.equal(houseUser(JSON.stringify({ identities: [{ provider: 'metamask', id: '0xabc' }] })), false);
  assert.equal(houseUser(JSON.stringify({ identities: [{ provider: 'kukai' }] })), false, 'no id');
  assert.equal(houseUser(JSON.stringify({ identities: 'kukai' })), false, 'identities must be an array');
  assert.equal(houseUser(JSON.stringify({ identities: [null, 3, { provider: 'kukai', id: DIRECTOR_WALLET }] })), true, 'junk entries are skipped');
});

test('house: DIRECTOR_WALLET is pinned to src/lib/director-access.ts', async () => {
  const src = await readFile(new URL('src/lib/director-access.ts', root), 'utf8');
  const m = src.match(/export const DIRECTOR_ADMIN_ADDRESS = '([^']+)';/);
  assert.ok(m, 'DIRECTOR_ADMIN_ADDRESS literal found');
  assert.equal(DIRECTOR_WALLET, m[1]);
  const providers = src.match(/TEZOS_PROVIDERS = new Set\(\[([^\]]+)\]\)/);
  assert.ok(providers, 'TEZOS_PROVIDERS literal found');
  assert.deepEqual([...DIRECTOR_WALLET_PROVIDERS], [...providers[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
});

test('house: isHouseRow reads each flag as 1, true, 0 or null', () => {
  for (const v of [1, true]) {
    assert.equal(isHouseRow({ house_pid: v, house_user: 0, user_payload: null }), true, `house_pid ${v}`);
    assert.equal(isHouseRow({ house_pid: 0, house_user: v, user_payload: null }), true, `house_user ${v}`);
  }
  for (const v of [0, null, false, undefined]) {
    assert.equal(isHouseRow({ house_pid: v, house_user: v, user_payload: null }), false, `flags ${v}`);
  }
  assert.equal(isHouseRow({ house_pid: 0, house_user: 0, user_payload: JSON.stringify({ roles: ['broadcaster'] }) }), true);
  assert.equal(isHouseRow({ house_pid: null, house_user: null, user_payload: JSON.stringify({ identities: [{ provider: 'kukai', id: DIRECTOR_WALLET }] }) }), true);
  assert.equal(isHouseRow({ house_pid: 0, house_user: 0, user_payload: JSON.stringify({ roles: ['reader'] }) }), false);
  assert.equal(isHouseRow(null), false);
  assert.equal(isHouseRow(undefined), false);
});

test('house: HOUSE_SELECT is one line with single spaces, and squash() collapses whitespace', () => {
  assert.equal(squash(HOUSE_SELECT), HOUSE_SELECT);
  assert.ok(!HOUSE_SELECT.includes('\n'));
  assert.match(HOUSE_SELECT, /AS house_pid, /);
  assert.match(HOUSE_SELECT, /AS house_user, /);
  assert.match(HOUSE_SELECT, /AS user_payload$/);
  assert.equal(squash('  SELECT\n  a,\t b \n'), 'SELECT a, b');
  const spread = HOUSE_SELECT.replace(/, /g, ',\n       ').replace(/ AS /g, '\n  AS ');
  assert.equal(squash(spread), HOUSE_SELECT);
  assert.equal(squash(null), '');
});
