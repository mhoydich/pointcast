// Nouns Money shelf and note page logic (public/nouns-money/chain/*.js).
//
// - card states come from chain mints mapped through chain.json recipes:
//   "3 of 10 copies left · specimen on the house shelf";
// - a /nm/claim answer is signed only if its recipe rebuilds from chain.json
//   (right design, public copy 1-10, same art hashes, honest recipe hash);
// - the note page's verdicts (not collected, unknown recipe, serial order);
// - the passkey wallet is First Mints' wallet: same key, same WebAuthn options.
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { encodeRecipeHex, recipeHash, recipeIndex } from '../public/nouns-money/chain/nm-recipe.js';
import { copiesLeft, fetchAllMints, findByRecipeHash, indexMints, judgeSerial, shelfLine, verifyClaim, sha256Hex } from '../public/nouns-money/chain/nm-shelf.js';
import { WALLET_KEY, createOptions, loadWallet, saveWallet, walletFromCredential } from '../public/nouns-money/chain/nm-wallet.js';
import { passkeyAddress } from '../public/chain/first-mints/lib/pointcast-chain.js';
import { NM_COPY } from '../src/lib/nouns-money/chain-copy.mjs';
import { NM_DEVNET, nmClientConfig } from '../src/data/nouns-money-chain.ts';
import { DEVNET } from '../src/data/chain-home.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const chain = JSON.parse(read('public/nouns-money/chain.json'));
const entries = chain.entries;
const index = recipeIndex(entries);
const HOUSE = 'tz1Vt8JkUShtxihYQUBQfnDfvVm3RvDCicpP';
const ME = 'pcp1examplepasskeyaccount000000000000';
const recipeOf = (design, copy) => {
  const e = entries[design];
  return encodeRecipeHex({ design, copy, svgSha256: e.svg_sha256, nativeRgbSha256: e.native_rgb_sha256 });
};
const hashOf = (design, copy) => recipeHash(recipeOf(design, copy));

// 100 house specimens, then 7 copies of design 5 and all 10 of design 9, and one stranger.
function fakeMints() {
  const mints = entries.map((e) => ({ serial: e.design + 1, owner: HOUSE, recipe_hash: e.recipe_hash, minted_at: 700 + e.design }));
  let serial = 101;
  for (let c = 1; c <= 7; c += 1) mints.push({ serial: serial++, owner: ME, recipe_hash: hashOf(5, c), minted_at: 900 });
  for (let c = 1; c <= 10; c += 1) mints.push({ serial: serial++, owner: ME, recipe_hash: hashOf(9, c), minted_at: 901 });
  mints.push({ serial: serial++, owner: ME, recipe_hash: 'ab'.repeat(32), minted_at: 902 });
  return mints;
}

test('card states: copies left per design and where the specimen sits', () => {
  const shelf = indexMints(fakeMints(), index);
  const S = NM_COPY.shelf;
  assert.equal(shelfLine(shelf.byDesign.get(5), { house: HOUSE, shelf: S }), '3 of 10 copies left · specimen on the house shelf', 'the plan’s own example');
  assert.equal(shelfLine(shelf.byDesign.get(9), { house: HOUSE, shelf: S }), 'All 10 copies collected · specimen on the house shelf');
  assert.equal(shelfLine(shelf.byDesign.get(0), { house: HOUSE, shelf: S }), '10 of 10 copies left · specimen on the house shelf');
  assert.equal(copiesLeft(shelf.byDesign.get(9)), 0);
  assert.equal(shelf.unknown.length, 1, 'a token with an unpublished recipe hash is set aside, never shown as a note');
  assert.equal(shelf.bySerial.get(1).design, 0);
  assert.equal(shelf.bySerial.get(101).copy, 1);
  const empty = indexMints([], index);
  assert.equal(shelfLine(empty.byDesign.get(3), { house: HOUSE, shelf: S }), '10 of 10 copies left · specimen not on the shelf yet');
  const moved = indexMints([{ serial: 4, owner: ME, recipe_hash: entries[3].recipe_hash, minted_at: 1 }], index);
  assert.match(shelfLine(moved.byDesign.get(3), { house: HOUSE, shelf: S }), /^10 of 10 copies left · specimen held by pcp1exam…0000$/);
});

test('fetchAllMints follows next_after and reports a closed edition', async () => {
  const all = Array.from({ length: 450 }, (_, i) => ({ serial: i + 1, owner: HOUSE, recipe_hash: '00'.repeat(32), minted_at: i }));
  const calls = [];
  const get = async (path) => {
    calls.push(path);
    const u = new URL(path, 'https://x');
    const after = Number(u.searchParams.get('after'));
    const limit = Number(u.searchParams.get('limit'));
    const mints = all.filter((m) => m.serial > after).slice(0, limit);
    return { id: 'nouns-money-27', minted: all.length, mints, next_after: mints.length ? mints[mints.length - 1].serial : null };
  };
  const r = await fetchAllMints(get);
  assert.equal(r.open, true);
  assert.equal(r.mints.length, 450);
  assert.deepEqual(calls, ['/edition/nouns-money-27/mints?after=0&limit=200', '/edition/nouns-money-27/mints?after=200&limit=200', '/edition/nouns-money-27/mints?after=400&limit=200']);
  const closed = await fetchAllMints(async () => ({ edition: null, id: 'nouns-money-27', mints: [] }));
  assert.deepEqual(closed, { open: false, mints: [] }, 'the live devnet answer today: {"edition":null,...}');
});

const goodClaim = (over = {}) => ({
  edition: 'nouns-money-27',
  sender: ME,
  recipient: ME,
  recipe: recipeOf(42, 3),
  recipe_hash: hashOf(42, 3),
  approval: 'cd'.repeat(64),
  approval_expires: 1900,
  ...over,
});

test('verifyClaim: a recipe that rebuilds from chain.json is accepted', () => {
  const ok = verifyClaim(goodClaim(), { entry: entries[42], sender: ME });
  assert.deepEqual(ok, { design: 42, copy: 3, recipe: recipeOf(42, 3), recipeHash: hashOf(42, 3), approval: 'cd'.repeat(64), approval_expires: 1900 });
  // optional fields may be absent (the approve route returns no recipe; nm.js must)
  const { edition, sender, recipient, recipe_hash, ...bare } = goodClaim();
  assert.equal(verifyClaim(bare, { entry: entries[42], sender: ME }).copy, 3);
});

test('verifyClaim accepts the reply shape of pointcast-chain nm.js (POST /nm/claim)', () => {
  // deploy/devnet-worker/src/nm.js reply(): the stored claim plus duplicate/network/sign/note.
  const rec = {
    edition: 'nouns-money-27', sender: ME, recipient: ME, design: 42, copy: 3,
    recipe: recipeOf(42, 3), recipe_hash: hashOf(42, 3), approval_expires: 1900, approval: 'cd'.repeat(64),
    day: '2026-10-11', at: 1791700000000,
  };
  const reply = { ...rec, duplicate: false, network: 'devnet', sign: { type: 'edition_mint', edition: rec.edition, recipient: ME, recipe: rec.recipe, approval_expires: 1900, approval: rec.approval }, note: 'sign an edition_mint with exactly these fields' };
  assert.equal(verifyClaim(reply, { entry: entries[42], sender: ME }).recipe, rec.recipe);
  // A same-day repeat for another design returns today's claim; the page checks it against that design's entry.
  assert.throws(() => verifyClaim({ ...reply, duplicate: true }, { entry: entries[7], sender: ME }), /design 42, asked for 7/);
  assert.equal(verifyClaim({ ...reply, duplicate: true }, { entry: entries[42], sender: ME }).copy, 3);
  assert.match(read('public/nouns-money/chain/nm-collect.js'), /claim\.j\.duplicate === true && Number\(claim\.j\.design\) !== design/);
});

test('verifyClaim: anything else is refused before signing', () => {
  const e = entries[42];
  const refuse = (over, re) => assert.throws(() => verifyClaim(goodClaim(over), { entry: e, sender: ME }), re);
  refuse({ recipe: recipeOf(43, 3), recipe_hash: hashOf(43, 3) }, /design 43/);
  refuse({ recipe: recipeOf(42, 0), recipe_hash: hashOf(42, 0) }, /not a public copy/);
  refuse({ recipe: recipeOf(42, 3).slice(0, 104) }, /53 bytes/);
  const forged = encodeRecipeHex({ design: 42, copy: 3, svgSha256: entries[7].svg_sha256, nativeRgbSha256: e.native_rgb_sha256 });
  refuse({ recipe: forged, recipe_hash: recipeHash(forged) }, /art hashes/);
  refuse({ recipe_hash: hashOf(42, 4) }, /recipe_hash/);
  refuse({ copy: 4 }, /copy field/);
  refuse({ design: 41 }, /design field/);
  refuse({ edition: 'first-mints' }, /edition/);
  refuse({ sender: 'pcp1someoneelse' }, /sender/);
  refuse({ recipient: 'pcp1someoneelse' }, /recipient/);
  refuse({ approval: 'cd'.repeat(10) }, /approval/);
  refuse({ approval_expires: 0 }, /approval_expires/);
  refuse({ recipe: '02' + recipeOf(42, 3).slice(2) }, /does not decode/);
  assert.throws(() => verifyClaim(null, { entry: e, sender: ME }), /no answer/);
});

test('note page verdicts: not collected, unknown recipe, serial order, found', () => {
  const mints = fakeMints();
  const shelf = indexMints(mints, index);
  const at = (s) => ({ token: shelf.bySerial.get(s), rawMint: mints.find((m) => m.serial === s) || null, entries });
  assert.equal(judgeSerial(5000, at(5000)).state, 'not-collected');
  assert.equal(judgeSerial(118, at(118)).state, 'unknown-recipe');
  const found = judgeSerial(1, at(1));
  assert.equal(found.state, 'found');
  assert.equal(found.entry.id, 'nm100-000');
  assert.equal(judgeSerial(101, at(101)).state, 'found');
  // a specimen minted out of order: serial 3 carrying design 7
  const odd = indexMints([{ serial: 3, owner: HOUSE, recipe_hash: entries[7].recipe_hash, minted_at: 1 }], index);
  const v = judgeSerial(3, { token: odd.bySerial.get(3), rawMint: null, entries });
  assert.equal(v.state, 'order');
  assert.equal(v.expected, 2);
  assert.equal(findByRecipeHash(mints, hashOf(5, 2)).serial, 102);
  assert.equal(findByRecipeHash(mints, hashOf(5, 9)), null);
});

test('sha256Hex hashes art files the way chain.json does', async () => {
  const e = entries[0];
  const bytes = readFileSync(new URL(`../public${e.svg}`, import.meta.url));
  assert.equal(await sha256Hex(new Uint8Array(bytes)), e.svg_sha256);
});

test('the passkey wallet is First Mints’ wallet: same storage key and WebAuthn options', () => {
  const live = read('public/chain/first-mints/live.js');
  assert.match(live, /const KEY = 'pc-fm-live:devnet-2';/);
  assert.equal(WALLET_KEY, 'pc-fm-live:devnet-2');
  assert.equal(NM_DEVNET.walletKey, WALLET_KEY);
  const o = createOptions('pointcast.xyz').publicKey;
  assert.deepEqual(o.rp, { id: 'pointcast.xyz', name: 'PointCast' });
  assert.match(live, /rp: \{ id: cfg\.rpId, name: 'PointCast' \}/);
  assert.equal(o.user.name, 'devnet-2 wallet');
  assert.equal(o.user.displayName, 'PointCast devnet-2');
  assert.match(live, /name: 'devnet-2 wallet', displayName: 'PointCast devnet-2'/);
  assert.deepEqual(o.pubKeyCredParams, [{ type: 'public-key', alg: -7 }]);
  assert.match(live, /pubKeyCredParams: \[\{ type: 'public-key', alg: -7 \}\]/);
  assert.deepEqual(o.authenticatorSelection, { residentKey: 'preferred', userVerification: 'required' });
  assert.match(live, /authenticatorSelection: \{ residentKey: 'preferred', userVerification: 'required' \}/);
  assert.equal(o.user.id.length, 16);
  assert.equal(o.challenge.length, 32);
});

test('walletFromCredential derives the pcp1 address from the passkey’s P-256 key', () => {
  const { publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const spki = publicKey.export({ type: 'spki', format: 'der' });
  const rawId = new Uint8Array([1, 2, 3, 250, 251, 252]);
  const w = walletFromCredential({ response: { getPublicKey: () => spki.buffer.slice(spki.byteOffset, spki.byteOffset + spki.length) }, rawId: rawId.buffer });
  assert.equal(w.publicKey.scheme, 'p256');
  assert.match(w.publicKey.bytes, /^0[23][0-9a-f]{64}$/);
  assert.equal(w.address, passkeyAddress(w.publicKey));
  assert.ok(w.address.startsWith('pcp1'));
  assert.equal(w.credentialId, 'AQID-vv8');
});

test('loadWallet / saveWallet tolerate missing, bad and blocked storage', () => {
  const mem = new Map();
  const store = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.equal(loadWallet(store), null);
  const w = { address: 'pcp1x', publicKey: { scheme: 'p256', bytes: '02' + '00'.repeat(32) }, credentialId: 'AQID' };
  saveWallet(w, store);
  assert.deepEqual(loadWallet(store), w);
  mem.set(WALLET_KEY, '{not json');
  assert.equal(loadWallet(store), null);
  const blocked = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('QuotaExceeded'); } };
  assert.equal(loadWallet(blocked), null);
  assert.doesNotThrow(() => saveWallet(w, blocked));
});

test('client config: the devnet-2 pins, the First Mints origin rules, and every string', () => {
  const cfg = nmClientConfig();
  assert.equal(cfg.devnet.api, DEVNET.url);
  assert.equal(cfg.devnet.chainId, 'pointcast-devnet-2');
  assert.equal(cfg.devnet.genesis, DEVNET.genesis);
  const fm = read('public/chain/first-mints/index.html');
  assert.match(fm, new RegExp(`data-rp="${cfg.devnet.rpId}"`));
  assert.match(fm, new RegExp(`data-origins="${cfg.devnet.origins.join(' ')}"`));
  assert.equal(cfg.devnet.edition, 'nouns-money-27');
  assert.equal(cfg.devnet.claimPath, '/nm/claim');
  assert.ok(cfg.devnet.yardHref.startsWith(DEVNET.yardHref) && cfg.devnet.yardHref.endsWith('&lens=mints'));
  assert.equal(cfg.copy, NM_COPY);
});

test('client scripts load nothing from outside this site and carry no copy of their own', () => {
  for (const f of ['nm-recipe.js', 'nm-shelf.js', 'nm-wallet.js', 'nm-collect.js', 'nm-note-page.js']) {
    const src = read(`public/nouns-money/chain/${f}`);
    for (const m of src.matchAll(/^import .* from '([^']+)';$/gm)) assert.match(m[1], /^\.\.?\//, `${f} imports ${m[1]}`);
    assert.doesNotMatch(src, /https?:\/\/(?!pointcast)/, `${f} names no outside host`);
  }
  for (const f of ['nm-collect.js', 'nm-note-page.js']) {
    const src = read(`public/nouns-money/chain/${f}`);
    assert.match(src, /data-nm-chain-config/, `${f} reads its words from the config island`);
    assert.doesNotMatch(src, /innerHTML|insertAdjacentHTML|document\.write/, `${f} never parses HTML`);
  }
});
