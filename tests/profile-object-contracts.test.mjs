import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  decodeProfileBytes,
  isProfileContractConfigured,
  isProfileHandle,
  listProfilePages,
  safeProfileLink,
} from '../src/lib/profile-object.mjs';

const ROOT = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, ROOT), 'utf8');

test('profile handle and bytes helpers keep the contract boundary', () => {
  assert.equal(isProfileHandle('mike'), true);
  assert.equal(isProfileHandle('pointcast-205'), true);
  assert.equal(isProfileHandle('Mike'), false);
  assert.equal(isProfileHandle('ab'), false);
  assert.equal(decodeProfileBytes('506f696e7443617374'), 'PointCast');
  assert.equal(safeProfileLink('https://pointcast.xyz/p/mike'), 'https://pointcast.xyz/p/mike');
  assert.equal(safeProfileLink('javascript:alert(1)'), '');
  assert.equal(isProfileContractConfigured(''), false);
  assert.equal(isProfileContractConfigured('KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh'), true);
});

test('TzKT handle, page, and ledger maps join into the public profile twin', async () => {
  const replies = {
    handles: [{ key: '7', value: '6d696b65' }],
    pages: [{
      key: '7',
      value: {
        name: '4d696b65',
        bio: '506f696e7443617374206e65696768626f722e',
        links: ['68747470733a2f2f706f696e74636173742e78797a'],
        noun_seed: '205',
      },
    }],
    ledger: [{ key: '7', value: 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb' }],
  };
  const fetchImpl = async (url) => {
    const name = Object.keys(replies).find((candidate) => url.includes(`/bigmaps/${candidate}/`));
    return { ok: Boolean(name), status: name ? 200 : 404, json: async () => replies[name] };
  };
  const profiles = await listProfilePages('KT1LP1oTBuudRubAYQDErH7i7mSwazVdohxh', fetchImpl);
  assert.equal(profiles.length, 1);
  assert.equal(profiles[0].handle, 'mike');
  assert.equal(profiles[0].page.name, 'Mike');
  assert.equal(profiles[0].page.nounSeed, 205);
  assert.equal(profiles[0].owner, 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb');
  assert.equal(profiles[0].json, 'https://pointcast.xyz/p/mike.json');
});

test('SmartPy sources encode owned and attested rights explicitly', async () => {
  const [profile, seal] = await Promise.all([
    read('contracts/v2/profile_object_fa2.py'),
    read('contracts/v2/seal_soulbound_fa2.py'),
  ]);
  assert.match(profile, /def claim\(self, handle\)/);
  assert.match(profile, /HANDLE_TAKEN/);
  assert.match(profile, /self\.data\.ledger\[params\.token_id\] == sp\.sender/);
  assert.match(profile, /def handle_of/);
  assert.match(profile, /def token_of/);
  assert.match(profile, /def page/);
  assert.match(seal, /main\.NoTransfer/);
  assert.match(seal, /def attest/);
  assert.match(seal, /sp\.sender in self\.data\.issuers/);
  assert.match(seal, /def revoke/);
  assert.match(seal, /def seals_of/);
  for (const kind of ['showed-up', 'kennel-club-holder', 'resident', 'founding-100']) {
    assert.match(seal, new RegExp(Buffer.from(kind).toString('hex')));
  }
});

test('compiled artifacts are valid JSON with paused origination storage', async () => {
  for (const directory of ['profile_object', 'seal_soulbound']) {
    const [code, storage] = await Promise.all([
      read(`contracts/build/${directory}/step_003_cont_0_contract.json`).then(JSON.parse),
      read(`contracts/build/${directory}/step_003_cont_0_storage.json`).then(JSON.parse),
    ]);
    assert.equal(Array.isArray(code), true);
    assert.equal(storage.prim, 'Pair');
    assert.match(JSON.stringify(storage), /"prim":"True"/);
  }
});

test('new profile DOM uses delegated data hooks and no element IDs', async () => {
  const files = await Promise.all([
    read('src/pages/me.astro'),
    read('src/pages/p/[handle].astro'),
    read('src/pages/p/index.astro'),
  ]);
  assert.match(files[0], /document\.addEventListener\('submit'/);
  assert.match(files[0], /pc:auth-change/);
  assert.match(files[0], /getSession/);
  for (const source of files) assert.doesNotMatch(source, /\sid\s*=/i);
  assert.doesNotMatch(files[0], /tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw/);
});

test('origination scripts default to preparation-only and require the named key gate', async () => {
  const [shared, profile, seal] = await Promise.all([
    read('scripts/profile-contract-origination.mjs'),
    read('scripts/profile-object-originate.mjs'),
    read('scripts/seal-soulbound-originate.mjs'),
  ]);
  assert.match(shared, /PROFILE_MAINNET_SECRET_KEY/);
  assert.match(shared, /I_UNDERSTAND_MAINNET/);
  assert.match(shared, /execute: false/);
  assert.match(shared, /paused: true/);
  assert.match(profile, /profile_object/);
  assert.match(seal, /seal_soulbound/);
});
