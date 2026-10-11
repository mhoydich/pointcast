// Nouns Money shelf and note page logic (public/nouns-money/chain/*.js).
//
// - card states come from chain mints mapped through chain.json recipes:
//   "3 of 10 copies left · specimen on the house shelf";
// - a /nm/claim answer is signed only if its recipe rebuilds from chain.json
//   (right design, public copy 1-10, same art hashes, honest recipe hash);
// - the note page's verdicts (not collected, unknown recipe, serial order);
// - the passkey wallet is First Mints' wallet: same key, same WebAuthn options;
// - the signed claim (nm-shelf.js requestClaim) against the documented protocol (pointcast-chain
//   docs/DEVNET.md, "Nouns Money", the claim): GET /nm/challenge, one passkey assertion
//   over exactly its bytes, POST /nm/claim {sender, design, challenge, public_key,
//   signature}; a new challenge after nm_challenge_expired or nm_challenge_used.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ECDH, createECDH, createHash, createPrivateKey, createPublicKey, generateKeyPairSync, randomBytes, sign as ecSign, verify as ecVerify } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { encodeRecipeHex, recipeHash, recipeIndex } from '../public/nouns-money/chain/nm-recipe.js';
import {
  CHALLENGE_BYTES,
  RETRY_CODES,
  assertionRequest,
  cardView,
  challengeUrl,
  claimBody,
  confirmText,
  copiesLeft,
  fetchAllMints,
  findByRecipeHash,
  indexMints,
  judgeSerial,
  readChallenge,
  readClaims,
  refusalLine,
  requestClaim,
  shelfLine,
  verifyClaim,
  sha256Hex,
} from '../public/nouns-money/chain/nm-shelf.js';
import { WALLET_KEY, createOptions, loadWallet, saveWallet, walletFromCredential } from '../public/nouns-money/chain/nm-wallet.js';
import { base64url, base64urlDecode, buildTx, describeTx, parseWebauthnEnvelope, passkeyAddress } from '../public/chain/first-mints/lib/pointcast-chain.js';
import { scanText } from '../src/lib/nouns-money/honest-copy.mjs';
import { NM_COPY, allCopyStrings, fill } from '../src/lib/nouns-money/chain-copy.mjs';
import { NM_CLAIM_POLICY, NM_DEVNET, nmClientConfig } from '../src/data/nouns-money-chain.ts';
import { DEVNET } from '../src/data/chain-home.ts';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const chain = JSON.parse(read('public/nouns-money/chain.json'));
const entries = chain.entries;
const index = recipeIndex(entries);
const HOUSE = 'tz1Vt8JkUShtxihYQUBQfnDfvVm3RvDCicpP';
const ME = 'pcp12oAndhL3CgMYUbYNE2k67192EGyuvBpUu'; // a real passkey address (checksummed)
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
  assert.match(shelfLine(moved.byDesign.get(3), { house: HOUSE, shelf: S }), /^10 of 10 copies left · specimen held by pcp12oAn…BpUu$/);
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

test('a refused or failed read is never an open shelf or a closed edition', async () => {
  // devnet error bodies look like {"error": "...", "network": "devnet"} (rate limits, bad ids, 5xx)
  await assert.rejects(fetchAllMints(async () => ({ error: 'slow down', code: 'rate', network: 'devnet' })), /rate: slow down/);
  await assert.rejects(fetchAllMints(async () => null), /no answer/);
  await assert.rejects(fetchAllMints(async () => ({ id: 'nouns-money-27' })), /no mints list/);
  await assert.rejects(fetchAllMints(async () => { throw new Error('HTTP 503'); }), /HTTP 503/);
  // a failure on a later page fails the whole read rather than showing part of the shelf
  let n = 0;
  const flaky = async () => (n++ === 0 ? { mints: Array.from({ length: 200 }, (_, i) => ({ serial: i + 1 })), next_after: 200 } : { error: 'internal' });
  await assert.rejects(fetchAllMints(flaky), /internal/);
  assert.deepEqual(await fetchAllMints(async () => ({ edition: null, id: 'nouns-money-27', mints: [] })), { open: false, mints: [] });

  const S = NM_COPY.shelf;
  const shelf = indexMints(fakeMints(), index);
  const at = (state, design, canCollect = true) => cardView(state, { slot: shelf.byDesign.get(design), house: HOUSE, shelf: S, canCollect });
  assert.deepEqual(at('failed', 5), { line: S.unreadable, enabled: false });
  assert.deepEqual(at('closed', 5), { line: S.notOpen, enabled: false });
  assert.deepEqual(at('reading', 5), { line: S.checking, enabled: false });
  assert.deepEqual(at('open', 5), { line: '3 of 10 copies left · specimen on the house shelf', enabled: true });
  assert.equal(at('open', 9).enabled, false, 'all copies collected');
  assert.equal(at('open', 5, false).enabled, false, 'no wallet, or off pointcast.xyz');
  const collect = read('public/nouns-money/chain/nm-collect.js');
  assert.match(collect, /if \(!r\.ok \|\| !r\.j\) throw new Error\(errText\(r\)\);/, 'reads throw on a refused answer');
  assert.match(collect, /cardView\(state, \{/, 'cards are painted from cardView');
  assert.match(collect, /return fail\(C\.status\.unreadable, e\);/);
  const note = read('public/nouns-money/chain/nm-note-page.js');
  assert.match(note, /if \(!r\.ok \|\| !j \|\| j\.error !== undefined\) throw/);
});

// GET /nm/state as pointcast-chain deploy/devnet-worker/src/nm.js state() answers it (trimmed).
function nmState({ open, pending = {} }) {
  return {
    network: 'devnet',
    edition: 'nouns-money-27',
    status: open ? 'open' : 'closed',
    open,
    reason: open ? null : 'claims are closed until the house opens them (POST /admin/nm/open)',
    height: 40,
    chain: { opened_at: 3, terms_ok: true, minted: 117, specimens: 100, specimens_complete: true, public_copies: 17, violations: 0 },
    designs: entries.map((e) => ({ design: e.design, noun_id: e.noun_id, copies_collected: 0, copies_pending: pending[e.design] || 0, copies_left: 10 - (pending[e.design] || 0) })),
  };
}

test('claims follow GET /nm/state, not the edition existing: closed claims never enable Collect', () => {
  const S = NM_COPY.shelf;
  const shelf = indexMints(fakeMints(), index);
  // The house closed claims (POST /admin/nm/close) while the edition stays open on chain.
  const closed = readClaims(nmState({ open: false }));
  assert.equal(closed.open, false);
  const paused = cardView('paused', { slot: shelf.byDesign.get(5), house: HOUSE, shelf: S, canCollect: true });
  assert.deepEqual(paused, { line: '3 of 10 copies left · specimen on the house shelf', enabled: false }, 'the shelf still shows what the chain records');
  // Open: copies set aside for live claims count as taken, as the Worker counts them.
  const open = readClaims(nmState({ open: true, pending: { 5: 2, 0: 10 } }));
  assert.equal(open.open, true);
  assert.equal(open.pending.get(5), 2);
  const at = (design) => cardView('open', { slot: shelf.byDesign.get(design), house: HOUSE, shelf: S, canCollect: true, pending: open.pending.get(design) || 0 });
  assert.deepEqual(at(5), { line: '1 of 10 copies left · specimen on the house shelf', enabled: true });
  assert.deepEqual(at(0), { line: 'All 10 copies collected · specimen on the house shelf', enabled: false }, 'all ten set aside: the Worker would answer nm_design_full');
  assert.equal(copiesLeft(shelf.byDesign.get(5), 10, 3), 0);
  assert.equal(copiesLeft(shelf.byDesign.get(5), 10, 99), 0, 'never below zero');
  // A refused or odd answer is never "open".
  assert.throws(() => readClaims({ error: 'slow down', code: 'nm_rate', network: 'devnet' }), /nm_rate: slow down/);
  assert.throws(() => readClaims(null), /no answer/);
  assert.throws(() => readClaims({ status: 'open' }), /no open flag/);
  assert.throws(() => readClaims({ open: true }), /no designs list/);
  // The page wires it: claims come from /nm/state on every shelf read, and a paused shelf says so.
  const collect = read('public/nouns-money/chain/nm-collect.js');
  assert.match(collect, /const claims = r\.open \? readClaims\(await get\('\/nm\/state'\)\) : null;/);
  assert.match(collect, /state = !r\.open \? 'closed' : claims\.open \? 'open' : 'paused';/);
  assert.match(collect, /pending: pending\.get\(design\) \|\| 0,/);
  assert.match(collect, /state === 'paused' \? C\.status\.claimsClosed : C\.status\.notOpen/);
  assert.equal(scanText(NM_COPY.status.claimsClosed).length, 0);
});

test('the passkey confirm sheet holds the honest copy: note lines, then the SDK words minus "Never use" lines', () => {
  const cfg = JSON.parse(JSON.stringify(nmClientConfig())); // as the page reads it from the JSON island
  const never = cfg.never.map(([source, flags]) => new RegExp(source, flags));
  const me = 'pcp12oAndhL3CgMYUbYNE2k67192EGyuvBpUu';
  const tx = buildTx('edition_mint', { sender: me, nonce: 0, edition: 'nouns-money-27', recipient: me, recipe: recipeOf(42, 3), approval_expires: 1900, approval: 'cd'.repeat(64) });
  const w = describeTx(tx, {});
  assert.ok(scanText(w.not_allowed.join('\n')).length > 0, 'the SDK words for edition_mint carry a banned word (Spending attention.)');
  const lines = [NM_COPY.confirm.title, NM_COPY.replacementLine, NM_COPY.standardLine];
  const text = confirmText(lines, w, never);
  assert.deepEqual(scanText(text), [], text);
  assert.ok(text.startsWith(lines.join('\n')), 'note lines first');
  for (const kept of [w.title, ...w.allowed, 'Changing the card later: the recipe is permanent.', 'Minting the same recipe twice.', 'Lasts: Permanent.', "Undo: Can't be undone."]) assert.ok(text.includes(kept), kept);
  assert.ok(!/Spending/.test(text));
  assert.match(read('public/nouns-money/chain/nm-collect.js'), /confirm: async \(w\) => window\.confirm\(confirmText\(words, w, never\)\)/);
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
  // the chain's replay law (sdk/nm-law.js), as far as a page can see it
  const PK = ME;
  const judge = (raw) => {
    const t = indexMints([raw], index).bySerial.get(raw.serial);
    return judgeSerial(raw.serial, { token: t, rawMint: raw, entries, house: HOUSE });
  };
  assert.equal(judge({ serial: 3, owner: HOUSE, recipe_hash: entries[2].recipe_hash, minted_at: 1 }).state, 'found');
  assert.deepEqual(
    (({ state, rule }) => ({ state, rule }))(judge({ serial: 3, owner: PK, recipe_hash: entries[2].recipe_hash, minted_at: 1 })),
    { state: 'order', rule: 'specimen-owner' },
    'a specimen the house does not hold',
  );
  assert.equal(judge({ serial: 150, owner: HOUSE, recipe_hash: entries[7].recipe_hash, minted_at: 1 }).rule, 'copy', 'a specimen (copy 0) above serial 100');
  assert.equal(judge({ serial: 101, owner: HOUSE, recipe_hash: hashOf(5, 1), minted_at: 1 }).rule, 'copy', 'a public copy held by a tz1 account');
  assert.equal(judge({ serial: 101, owner: PK, recipe_hash: hashOf(5, 1), minted_at: 1 }).state, 'found');
  assert.equal(v.rule, 'specimen-order');
  const page = read('public/nouns-money/chain/nm-note-page.js');
  assert.match(page, /judgeSerial\(serial, \{ token, rawMint, entries, house \}\)/);
  for (const k of ['serialOrder', 'specimenOwner', 'serialCopy']) assert.match(page, new RegExp(`N\\.${k}`));
  assert.equal(findByRecipeHash(mints, hashOf(5, 2)).serial, 102);
  assert.equal(findByRecipeHash(mints, hashOf(5, 9)), null);
});

test('the note page shows the very SVG bytes it hashed, never the preview image', () => {
  const src = read('public/nouns-money/chain/nm-note-page.js');
  assert.doesNotMatch(src, /entry\.preview/, 'the preview webp is not what the hash covers');
  assert.match(src, /const fileHash = await sha256Hex\(svgBytes\);/);
  assert.match(src, /art\.src = URL\.createObjectURL\(new Blob\(\[svgBytes\], \{ type: 'image\/svg\+xml' \}\)\);/);
  assert.ok(src.indexOf('sha256Hex(svgBytes)') < src.indexOf('art.src ='), 'shown only after it is hashed');
  // the published SVGs are self-contained vector files, so a blob: URL draws them whole
  for (const e of entries.slice(0, 5)) assert.doesNotMatch(read(`public${e.svg}`), /(?:href|src)="(?!#)|url\((?!#)/);
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
  assert.equal(cfg.devnet.challengePath, '/nm/challenge');
  assert.equal(cfg.policy, NM_CLAIM_POLICY);
  assert.deepEqual(
    { ...cfg.policy },
    { claimsPerPasskeyPerUtcDay: 1, passkeyOnly: true, passkeyProof: true, holdBlocks: 24, ipPendingMax: 3, ipClaimsPerDay: 10, challengeTtlMs: 120000 },
    'the numbers pointcast-chain src/nm.js enforces',
  );
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

// ------------------------------------------------------------------ the signed claim (nm-shelf.js requestClaim)

const sha256 = (...parts) => {
  const h = createHash('sha256');
  for (const p of parts) h.update(p);
  return h.digest();
};
const u32 = (n) => {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n);
  return b;
};
const arrayBuffer = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

/**
 * A SOFTWARE passkey shaped like a browser on https://pointcast.xyz: credentials.get()
 * resolves {response: {authenticatorData, clientDataJSON, signature}} as ArrayBuffers, the
 * signature DER-encoded as browsers return it. Its key is a public test value.
 */
function softPasskey(secretHex = '5a'.repeat(32), { origin = 'https://pointcast.xyz', flags = 0x05 } = {}) {
  const d = Buffer.from(secretHex, 'hex');
  const ecdh = createECDH('prime256v1');
  ecdh.setPrivateKey(d);
  const pub = ecdh.getPublicKey();
  const key = createPrivateKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', d: d.toString('base64url'), x: pub.subarray(1, 33).toString('base64url'), y: pub.subarray(33).toString('base64url') } });
  const publicKey = { scheme: 'p256', bytes: ecdh.getPublicKey(null, 'compressed').toString('hex') };
  const wallet = { address: passkeyAddress(publicKey), publicKey, credentialId: base64url(new Uint8Array([9, 8, 7, 250, 251, 252])) };
  const gets = [];
  const credentials = {
    async get(options) {
      gets.push(options);
      const o = options.publicKey;
      const authenticatorData = Buffer.concat([sha256(o.rpId), Buffer.from([flags]), u32(1)]);
      const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge: base64url(new Uint8Array(o.challenge)), origin, crossOrigin: false }));
      const signature = ecSign('sha256', Buffer.concat([authenticatorData, sha256(clientDataJSON)]), { key, dsaEncoding: 'der' });
      return { response: { authenticatorData: arrayBuffer(authenticatorData), clientDataJSON: arrayBuffer(clientDataJSON), signature: arrayBuffer(signature) } };
    },
  };
  return { wallet, credentials, gets };
}

/**
 * A fake devnet that follows the documented claim door (DEVNET.md): challenges bound to one
 * sender and one design, each good for one claim; POST /nm/claim checks the body has exactly
 * the five fields and that its assertion is a passkey's over that challenge (key → pcp1
 * address, rp_id hash, UP|UV, the strict clientDataJSON head, low-S ECDSA P-256).
 * `answers` overrides the claim replies in order (after the checks ran and the challenge was spent).
 */
function fakeDevnet({ answers = [], challengeAnswer = null } = {}) {
  const issued = new Map();
  const used = new Set();
  const log = [];
  const call = async (path) => {
    log.push(['GET', path]);
    if (challengeAnswer) return challengeAnswer;
    const u = new URL(path, 'https://devnet.test');
    assert.equal(u.pathname, '/nm/challenge');
    assert.deepEqual([...u.searchParams.keys()], ['sender', 'design']);
    const sender = u.searchParams.get('sender');
    const design = Number(u.searchParams.get('design'));
    assert.match(u.searchParams.get('design'), /^(0|[1-9][0-9]?)$/, 'design: 0..99, no leading zero');
    const challenge = base64url(randomBytes(CHALLENGE_BYTES));
    issued.set(challenge, { sender, design });
    const at = 1791700000000;
    return {
      ok: true,
      status: 200,
      j: { network: 'devnet', edition: 'nouns-money-27', sender, design, day: '2026-10-11', challenge, issued_at: at, expires_at: at + 120000, ttl_ms: 120000, rp_id: 'pointcast.xyz', origins: ['https://pointcast.xyz'], user_verification: 'required', claim: 'POST /nm/claim {sender, design, challenge, public_key, signature}' },
    };
  };
  const post = async (path, body) => {
    log.push(['POST', path, body]);
    assert.equal(path, '/nm/claim');
    assert.deepEqual(Object.keys(body).sort(), ['challenge', 'design', 'public_key', 'sender', 'signature'], 'the documented body, nothing else');
    const refuse = (status, code) => ({ ok: false, status, j: { error: code, code, network: 'devnet' } });
    if (!body.challenge || !body.public_key || !body.signature) return refuse(401, 'nm_unsigned');
    const bound = issued.get(body.challenge);
    if (!bound || bound.sender !== body.sender || bound.design !== body.design) return refuse(401, 'nm_challenge');
    assert.deepEqual(Object.keys(body.public_key).sort(), ['bytes', 'scheme']);
    assert.equal(body.public_key.scheme, 'p256');
    if (passkeyAddress(body.public_key) !== body.sender) return refuse(401, 'nm_key');
    assert.match(body.signature, /^[0-9a-f]+$/, 'the envelope as lowercase hex');
    const env = parseWebauthnEnvelope(body.signature);
    assert.equal(env.normalized, false, 'low-S as sent');
    assert.equal(env.hex, body.signature, 'canonical');
    const ad = Buffer.from(env.authenticatorData);
    assert.deepEqual(ad.subarray(0, 32), sha256('pointcast.xyz'), 'rp_id pointcast.xyz');
    assert.equal(ad[32] & 0x05, 0x05, 'UP and UV');
    const cdj = Buffer.from(env.clientDataJSON).toString('utf8');
    assert.ok(cdj.startsWith(`{"type":"webauthn.get","challenge":"${body.challenge}","origin":"https://pointcast.xyz"`), cdj);
    const point = ECDH.convertKey(Buffer.from(body.public_key.bytes, 'hex'), 'prime256v1', undefined, undefined, 'uncompressed');
    const pk = createPublicKey({ format: 'jwk', key: { kty: 'EC', crv: 'P-256', x: point.subarray(1, 33).toString('base64url'), y: point.subarray(33).toString('base64url') } });
    assert.ok(ecVerify('sha256', Buffer.concat([ad, sha256(env.clientDataJSON)]), { key: pk, dsaEncoding: 'ieee-p1363' }, Buffer.from(env.rs)), 'ECDSA P-256 over authenticatorData ‖ SHA-256(clientDataJSON)');
    if (used.has(body.challenge)) return refuse(401, 'nm_challenge_used');
    used.add(body.challenge);
    if (answers.length) return answers.shift();
    const recipe = recipeOf(body.design, 1);
    return { ok: true, status: 200, j: { edition: 'nouns-money-27', sender: body.sender, recipient: body.sender, design: body.design, copy: 1, recipe, recipe_hash: recipeHash(recipe), approval_expires: 1900, approval: 'cd'.repeat(64), day: '2026-10-11', duplicate: false, network: 'devnet' } };
  };
  return { call, post, log, used };
}

const claimRun = (dev, pk, over = {}) => {
  const events = [];
  const confirms = [];
  const credentials = { get: async (o) => (events.push('passkey'), pk.credentials.get(o)) };
  return requestClaim({
    call: dev.call,
    post: dev.post,
    credentials,
    confirm: async (attempt) => (events.push('words'), confirms.push(attempt), true),
    onStep: (s) => events.push(`step:${s}`),
    devnet: NM_DEVNET,
    wallet: pk.wallet,
    design: 42,
    ...over,
  }).then((r) => ({ r, events, confirms }));
};

test('signed claim: GET /nm/challenge, the plain words, one passkey assertion over exactly its bytes, then the documented POST body', async () => {
  const pk = softPasskey();
  const dev = fakeDevnet();
  const { r, events, confirms } = await claimRun(dev, pk);
  assert.equal(r.ok, true, JSON.stringify(r));
  assert.equal(r.j.copy, 1);
  assert.equal(verifyClaim(r.j, { entry: entries[42], sender: pk.wallet.address }).copy, 1, 'the answer goes on to verifyClaim as before');
  assert.deepEqual(events, ['step:challenge', 'words', 'step:passkey', 'passkey', 'step:claim'], 'the words come before the passkey sheet');
  assert.deepEqual(confirms, [0]);
  assert.deepEqual(dev.log.map(([m, p]) => `${m} ${p}`), [`GET /nm/challenge?sender=${pk.wallet.address}&design=42`, 'POST /nm/claim']);
  const [, , body] = dev.log[1];
  assert.equal(body.sender, pk.wallet.address);
  assert.equal(body.design, 42);
  assert.deepEqual(body.public_key, pk.wallet.publicKey);
  assert.equal(body.challenge.length, 75, '56 bytes, unpadded base64url, exactly as served');
  // the passkey was asked once, for this wallet's credential, with user verification, over the challenge's 56 bytes
  assert.equal(pk.gets.length, 1);
  const o = pk.gets[0].publicKey;
  assert.equal(o.rpId, 'pointcast.xyz');
  assert.equal(o.rpId, NM_DEVNET.rpId);
  assert.equal(o.userVerification, 'required');
  assert.deepEqual([...o.allowCredentials[0].id], [...base64urlDecode(pk.wallet.credentialId)]);
  assert.equal(o.allowCredentials[0].type, 'public-key');
  assert.deepEqual([...o.challenge], [...base64urlDecode(body.challenge)]);
  assert.equal(o.challenge.length, CHALLENGE_BYTES);
});

test('signed claim: on 401 nm_challenge_expired or nm_challenge_used, a new challenge and the passkey again, once; a used challenge is never re-sent', async () => {
  for (const code of RETRY_CODES) {
    const pk = softPasskey('6b'.repeat(32));
    const dev = fakeDevnet({ answers: [{ ok: false, status: 401, j: { error: 'ask again', code, network: 'devnet' } }] });
    const { r, events, confirms } = await claimRun(dev, pk);
    assert.equal(r.ok, true, `${code}: ${JSON.stringify(r)}`);
    const posts = dev.log.filter(([m]) => m === 'POST').map(([, , b]) => b);
    assert.equal(posts.length, 2);
    assert.equal(dev.log.filter(([m]) => m === 'GET').length, 2, 'a second GET /nm/challenge');
    assert.notEqual(posts[1].challenge, posts[0].challenge, 'the retry carries the new challenge');
    assert.equal(pk.gets.length, 2, 'and a second passkey assertion');
    assert.deepEqual(confirms, [0, 1], 'the words again before the second sheet');
    assert.ok(events.includes('step:retry'));
  }
  // At most once more: a second refusal ends the claim with that code.
  const pk = softPasskey('7c'.repeat(32));
  const used = { ok: false, status: 401, j: { error: 'challenge already used', code: 'nm_challenge_used', network: 'devnet' } };
  const dev = fakeDevnet({ answers: [used, { ...used }] });
  const { r } = await claimRun(dev, pk);
  assert.deepEqual({ ok: r.ok, stage: r.stage, status: r.status, code: r.code }, { ok: false, stage: 'claim', status: 401, code: 'nm_challenge_used' });
  assert.equal(dev.log.filter(([m]) => m === 'POST').length, 2);
  // Other refusals are final: no new challenge.
  for (const [status, code] of [[409, 'nm_daily'], [429, 'nm_ip_cap'], [429, 'nm_ip_daily'], [401, 'nm_proof'], [403, 'nm_closed']]) {
    const d = fakeDevnet({ answers: [{ ok: false, status, j: { error: 'no', code, network: 'devnet' } }] });
    const out = await claimRun(d, softPasskey('7d'.repeat(32)));
    assert.equal(out.r.code, code);
    assert.equal(d.log.filter(([m]) => m === 'GET').length, 1, `${code}: no retry`);
  }
});

test('signed claim: no passkey without the words, and nothing signed or sent when the challenge is refused or not ours', async () => {
  const pk = softPasskey('8e'.repeat(32));
  let dev = fakeDevnet();
  let out = await claimRun(dev, pk, { confirm: async () => false });
  assert.deepEqual({ ok: out.r.ok, stage: out.r.stage }, { ok: false, stage: 'declined' });
  assert.equal(pk.gets.length, 0, 'the passkey was never asked');
  assert.equal(dev.log.filter(([m]) => m === 'POST').length, 0);

  dev = fakeDevnet({ challengeAnswer: { ok: false, status: 403, j: { error: 'Nouns Money claims are closed on this devnet', code: 'nm_closed', network: 'devnet' } } });
  out = await claimRun(dev, pk);
  assert.deepEqual({ stage: out.r.stage, status: out.r.status, code: out.r.code }, { stage: 'challenge', status: 403, code: 'nm_closed' });
  assert.match(out.r.why, /^nm_closed: /, 'the refusal shows its code');
  assert.deepEqual(out.events, ['step:challenge'], 'no words, no passkey');

  const good = (await fakeDevnet().call(challengeUrl('/nm/challenge', pk.wallet.address, 42))).j;
  for (const [over, re] of [
    [{ sender: softPasskey('9f'.repeat(32)).wallet.address }, /another wallet/],
    [{ design: 41 }, /design 41, asked for 42/],
    [{ rp_id: 'evil.example' }, /rp_id evil\.example/],
    [{ edition: 'first-mints' }, /edition first-mints/],
    [{ challenge: `${good.challenge}=` }, /56 bytes/],
    [{ challenge: good.challenge.slice(1) }, /56 bytes/],
  ]) {
    dev = fakeDevnet({ challengeAnswer: { ok: true, status: 200, j: { ...good, ...over } } });
    out = await claimRun(dev, pk);
    assert.equal(out.r.stage, 'challenge-check');
    assert.match(out.r.why, re);
    assert.equal(dev.log.filter(([m]) => m === 'POST').length, 0);
  }
  assert.equal(pk.gets.length, 0, 'no assertion for a challenge that is not this wallet’s and this note’s');
});

test('readChallenge, challengeUrl, assertionRequest and claimBody hold the documented shapes', () => {
  const pk = softPasskey();
  assert.equal(challengeUrl('/nm/challenge', 'pcp1abc', 0), '/nm/challenge?sender=pcp1abc&design=0');
  assert.equal(challengeUrl('/nm/challenge', 'a b&c', 99), '/nm/challenge?sender=a%20b%26c&design=99');
  for (const bad of [-1, 100, 1.5, '4', NaN]) assert.throws(() => challengeUrl('/nm/challenge', 'pcp1abc', bad), /design/);
  const bytes = new Uint8Array(randomBytes(CHALLENGE_BYTES));
  const j = { edition: 'nouns-money-27', sender: pk.wallet.address, design: 7, challenge: base64url(bytes), rp_id: 'pointcast.xyz', expires_at: 5 };
  const c = readChallenge(j, { sender: pk.wallet.address, design: 7, rpId: 'pointcast.xyz' });
  assert.deepEqual([...c.bytes], [...bytes]);
  assert.equal(c.challenge, j.challenge);
  assert.equal(c.expiresAt, 5);
  assert.throws(() => readChallenge({ error: 'slow down', code: 'nm_rate' }, { sender: pk.wallet.address, design: 7, rpId: 'pointcast.xyz' }), /nm_rate: slow down/);
  assert.throws(() => readChallenge(null, {}), /no answer/);
  assert.throws(() => readChallenge({ ...j, design: '7' }, { sender: pk.wallet.address, design: 7, rpId: 'pointcast.xyz' }), /design/);
  const o = assertionRequest(bytes, { rpId: 'pointcast.xyz', credentialId: pk.wallet.credentialId }).publicKey;
  assert.deepEqual(Object.keys(o).sort(), ['allowCredentials', 'challenge', 'rpId', 'timeout', 'userVerification']);
  assert.equal(o.challenge, bytes);
  const resp = { authenticatorData: new Uint8Array(37), clientDataJSON: new TextEncoder().encode('{}'), signature: new Uint8Array([...new Uint8Array(31), 1, ...new Uint8Array(31), 1]) };
  const body = claimBody({ sender: pk.wallet.address, design: 7, challenge: j.challenge, publicKey: pk.wallet.publicKey, response: resp });
  assert.deepEqual(Object.keys(body), ['sender', 'design', 'challenge', 'public_key', 'signature']);
  assert.match(body.signature, /^[0-9a-f]+$/);
  assert.throws(() => claimBody({ sender: 'x', design: 7, challenge: 'c', publicKey: { scheme: 'ed25519', bytes: '00' }, response: resp }), /p256/);
});

test('refused claims get their own words: the per-IP caps with the policy numbers, a declined prompt, a challenge not ours', () => {
  const S = NM_COPY.status;
  const line = (r) => refusalLine(r, S, NM_CLAIM_POLICY, fill);
  const cap = line({ ok: false, stage: 'claim', status: 429, code: 'nm_ip_cap', why: 'nm_ip_cap: …' });
  assert.equal(cap, 'Not collected: this connection already has 3 copies set aside. Collect them, or wait about 24 blocks for them to lapse, then try again.');
  const daily = line({ ok: false, stage: 'claim', status: 429, code: 'nm_ip_daily', why: 'nm_ip_daily: …' });
  assert.equal(daily, 'Not collected: this connection has made its 10 claims for today (UTC), whatever passkeys it used. It can claim again after 00:00 UTC.');
  assert.equal(line({ ok: false, stage: 'declined' }), S.declined);
  assert.equal(line({ ok: false, stage: 'challenge-check', why: 'challenge is for another wallet' }), 'Not collected: devnet-2 sent a claim code that is not for this wallet and note (challenge is for another wallet). Nothing was signed.');
  assert.equal(line({ ok: false, stage: 'claim', code: 'nm_unsigned', why: 'nm_unsigned: a claim needs the passkey proof' }), 'Not collected: nm_unsigned: a claim needs the passkey proof');
  for (const t of [cap, daily]) assert.doesNotMatch(t, /\{\w+\}/, 'every placeholder filled');
  assert.deepEqual(scanText([cap, daily, ...allCopyStrings(NM_COPY.claim)].join('\n')), []);
  assert.equal(NM_COPY.claim.lines.length, 3);
  assert.match(NM_COPY.claim.title, /prompt 1 of 2/);
  assert.match(S.collecting, /prompt 2 of 2/);
});

test('the page sends the signed claim, never the Phase A body {sender, design}', () => {
  const collect = read('public/nouns-money/chain/nm-collect.js');
  assert.doesNotMatch(collect, /post\(devnet\.claimPath/, 'the claim goes through requestClaim');
  assert.match(collect, /import \{ cardView, confirmText, fetchAllMints, findByRecipeHash, indexMints, readClaims, refusalLine, requestClaim, verifyClaim \} from '\.\/nm-shelf\.js';/);
  assert.match(collect, /const claim = await requestClaim\(\{/);
  assert.match(collect, /credentials: navigator\.credentials,/);
  assert.match(collect, /confirm: async \(\) => window\.confirm\(claimWords\),/);
  assert.match(collect, /fill\(C\.claim\.title, \{ nounId: entry\.noun_id \}\)/);
  assert.match(collect, /C\.claim\.lines\.map/);
  assert.match(collect, /if \(!claim\.ok\) return say\(refusalLine\(claim, C\.status, cfg\.policy, fill\), 'is-warn'\);/);
  assert.ok(collect.indexOf('requestClaim({') < collect.indexOf('verifyClaim(claim.j'), 'the approval is still checked against chain.json before the edition_mint is signed');
  const shelf = read('public/nouns-money/chain/nm-shelf.js');
  assert.match(shelf, /import \{ addressKind, base64urlDecode, webauthnEnvelope \} from '\.\.\/\.\.\/chain\/first-mints\/lib\/pointcast-chain\.js';/);
  const code = shelf.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(code, /document\.|window\.|localStorage|navigator\.credentials\.get|fetch\(/, 'pure: the page passes the network and the passkey in');
  assert.ok(!existsSync(new URL('../public/nouns-money/chain/nm-claim.js', import.meta.url)), 'no new public file: /tv/assets and every flag-off page stay byte-identical');
});
