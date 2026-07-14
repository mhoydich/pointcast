import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const PAGE = new URL('../src/pages/passport.astro', import.meta.url);
const JSON_ROUTE = new URL('../src/pages/passport.json.ts', import.meta.url);
const PASSPORT_DATA = new URL('../src/lib/tezos-passport.ts', import.meta.url);
const PLAY_LAYER = new URL('../src/lib/play-layer.ts', import.meta.url);
const APPS = new URL('../src/lib/pointcast-apps.ts', import.meta.url);
const TEZOS = new URL('../src/lib/tezos.ts', import.meta.url);

const [page, jsonRoute, passportData, playLayer, apps, tezos] = await Promise.all([
  readFile(PAGE, 'utf8'),
  readFile(JSON_ROUTE, 'utf8'),
  readFile(PASSPORT_DATA, 'utf8'),
  readFile(PLAY_LAYER, 'utf8'),
  readFile(APPS, 'utf8'),
  readFile(TEZOS, 'utf8'),
]);

test('Tezos Passport keeps local, public, and signed claims distinct', () => {
  assert.match(page, /private local ritual stamps on one page, public Tezos collection visas on the other/);
  assert.match(page, /No transaction is submitted\. No gas is spent\./);
  assert.match(page, /Local stamp added\. It has not left this browser\./);
  assert.match(page, /Public wallet passport copied\. Local stamps were not included\./);
  assert.doesNotMatch(page, /mint your passport/i);
});

test('passport supports public addresses, TzKT holdings, and Beacon seals', () => {
  assert.match(page, /\/passport\?address=tz…/);
  assert.match(page, /https:\/\/api\.tzkt\.io\/v1\/accounts\//);
  assert.match(page, /token\.contract\.in=/);
  assert.match(page, /await import\('\.\.\/lib\/tezos'\)/);
  assert.match(page, /signTezosPayload\(message\)/);
  assert.match(page, /pc:wallet-change/);
  assert.match(tezos, /publicKey\?: string/);
  assert.match(tezos, /publicKey: account\?\.publicKey/);
});

test('visa registry includes live and future PointCast lanes', () => {
  for (const id of ['visit-nouns', 'coffee-mugs', 'zen-cats', 'morning-ocean']) {
    assert.match(passportData, new RegExp(`id: '${id}'`));
    assert.match(passportData, new RegExp(`tokenRoute: '/token/${id}'`));
  }
  assert.match(passportData, /status: contractFor\('visit_nouns'\)\.startsWith\('KT1'\) \? 'live' : 'future'/);
  assert.match(passportData, /TEZOS_PASSPORT_SEAL_SCHEMA/);
  assert.match(passportData, /verificationMaterial: \['message', 'payload', 'signature', 'publicKey', 'address'\]/);
});

test('human and machine discovery surfaces advertise the same passport model', () => {
  assert.match(jsonRoute, /buildTezosPassportManifest/);
  assert.match(jsonRoute, /access-control-allow-origin/);
  assert.match(playLayer, /PLAY_LAYER_VERSION = '0\.3\.0'/);
  assert.match(playLayer, /passportJson:|machine: 'https:\/\/pointcast\.xyz\/passport\.json'/);
  assert.match(passportData, /machine: 'https:\/\/pointcast\.xyz\/passport\.json'/);
  assert.match(apps, /slug: 'pointcast-passport'/);
  assert.match(apps, /LOCAL STAMPS · TEZOS VISAS · SIGNED SEALS/);
});

test('passport UI exposes stable responsive controls and visual assets', () => {
  assert.match(page, /data-open-wallet/);
  assert.match(page, /data-address-form/);
  assert.match(page, /data-seal-journey/);
  assert.match(page, /data-share-public/);
  assert.match(page, /https:\/\/noun\.pics\/137\.svg/);
  assert.match(page, /@media \(max-width: 700px\)/);
  assert.match(page, /prefers-reduced-motion/);
});
