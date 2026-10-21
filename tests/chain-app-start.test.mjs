// "Start here": /chain/start (src/pages/chain/start.astro), the logic
// public/chain/apps/start.js (no DOM), the DOM side start-view.js, the words
// src/data/chain-app-start.ts, and the one line it adds to chain-kit.js
// (signAndSend asks a key that has signTx for the whole signed transaction).
//
// What this suite holds:
//   - nothing is signed that the page did not show first: the card is built from
//     the exact transaction a module is about to sign (every field, the chain's
//     own description, the digest), Sign signs exactly it, Cancel signs and sends
//     nothing, and a passkey refuses any transaction that has no reviewed card;
//   - the three choices are the apps' own modules, called as their pages call
//     them: the bid is daily-mint.js sendBid at the least bid, the stamp
//     notary.js stampHash of a sentence's SHA-256 (the sentence never leaves),
//     the capsule capsules.js sealCapsule on GDN about 7 days of blocks on;
//   - passkeys follow the chain's launch record 7: on devnet-2 only
//     https://pointcast.xyz, and anywhere else the page says so and asks nothing;
//     the passkey account is First Mints' own (same options, same slot);
//   - the four steps go in order through the page's buttons, focus follows the
//     current step, and step 4 links check the very block;
//   - nothing from the devnet becomes markup, a link or a style; the page pins the
//     genesis, stops at GENESIS CHANGED, honours ?devnet= only for localhost and
//     127.0.0.1, and the copy is honest (no value, may reset, a claim not proof);
//   - its entry for the Apps registry is well formed, and equals the registry's
//     once the orchestrator adds it.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { DEVNET } from '../src/data/chain-home.ts';
import { APP, CAPSULE_DEFAULTS, CHOICE_COPY, HONESTY_LINE, NOT_LIST, PASSKEY_NOTE, REGISTRY_ENTRY, START_BLOCK, STEP_COPY } from '../src/data/chain-app-start.ts';
import { APPS_2_BLOCK, CHAIN_APPS, HONESTY, appByKey } from '../src/data/chain-apps.ts';
import * as S0 from '../public/chain/apps/start.js';
import * as view from '../public/chain/apps/start-view.js';
import * as K from '../public/chain/apps/chain-kit.js';
import * as D from '../public/chain/apps/daily-mint.js';
import * as N from '../public/chain/apps/notary.js';
import * as C from '../public/chain/apps/capsules.js';
import { MY_SLOT } from '../public/chain/apps/capsules-view.js';
import { KEY_SLOT } from '../public/chain/apps/key-panel.js';
import { FX, fakeDevnet } from './helpers/fake-devnet.mjs';
import { softPasskey } from './helpers/soft-passkey.mjs';
import { assertNoSinks, bannedHits, code, currencyHits } from './helpers/chain-app-rules.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const FILES = {
  logic: 'public/chain/apps/start.js',
  view: 'public/chain/apps/start-view.js',
  page: 'src/pages/chain/start.astro',
  data: 'src/data/chain-app-start.ts',
  kit: 'public/chain/apps/chain-kit.js',
};
const src = Object.fromEntries(Object.entries(FILES).map(([k, p]) => [k, read(p)]));
const MY_FILES = [FILES.logic, FILES.view, FILES.page, FILES.data, 'tests/chain-app-start.test.mjs', 'tests/helpers/soft-passkey.mjs', 'scripts/e2e-chain-app-start.mjs'];
const HEX = (c) => c.repeat(64);
const GENESIS = FX.status.genesis_hash;
const DOMAIN = K.pcc.domainOf(FX.status.chain_id, GENESIS);
const sha = (s) => createHash('sha256').update(s).digest('hex');
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const reply = (obj, status = 200) => ({ ok: status < 400, status, headers: { get: () => null }, text: async () => JSON.stringify(obj) });
/** The rate the page reads from the recording (block 2 to the tip; block 1's time is 0), and the delay it gives a capsule. */
const FX_RATE = ((FX.status.height - 2) * 3600000) / (FX.blocks.at(-1).header.timestamp - FX.blocks[1].header.timestamp);
const FX_DELAY = S0.capsuleDelay(FX_RATE);
const until = async (fn, ms = 3000) => { const end = Date.now() + ms; for (;;) { const v = fn(); if (v) return v; if (Date.now() > end) return null; await tick(10); } };

/** A stand-in SDK client: it builds posts the way the SDK does, captures what would be sent and seals everything in block 4242. */
function fakeChain({ sent = [], stored = [], params = FX.params } = {}) {
  return {
    domain: DOMAIN,
    chainId: FX.status.chain_id,
    genesisHash: GENESIS,
    params,
    async buildPublish({ sender, channel, title, body, nonce = 0 }) {
      if (body !== undefined) stored.push(body);
      return { sender, nonce, type: 'publish_block', channel, title, body_hash: body === undefined ? HEX('0') : K.pcc.bodyHash(body), media_uri: null };
    },
    async submit(signed) { sent.push(signed); return { txHash: K.pcc.txHash(signed), status: 'pending' }; },
    async waitForTx() { return { height: 4242, index: 0, status: 'included' }; },
  };
}
const fakeStorage = (init = {}) => {
  const m = new Map(Object.entries(init));
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};

// ================================================================ what will be signed

test('whatYouSign builds the card from the transaction itself: every field in order, the chain’s own words, and the digest the key signs', async () => {
  const k = await K.keyFromSeed('21'.repeat(32));
  const chain = fakeChain();
  const transfer = K.pcc.buildTx('transfer', { sender: k.sender, nonce: 3, to: FX.daily.addresses.auctioneer, amount: 4 });
  const c = S0.whatYouSign(transfer, chain, { lot: 9 });
  assert.deepEqual(c.fields.map((f) => f[0]), Object.keys(transfer));
  assert.deepEqual(Object.fromEntries(c.fields), { sender: k.sender, nonce: '3', type: 'transfer', to: FX.daily.addresses.auctioneer, amount: '4' });
  assert.equal(c.digest, K.pcc.signingHash(transfer, DOMAIN));
  assert.equal(c.headline, 'A transfer of 4 play ATTN from ' + k.sender + ' to ' + FX.daily.addresses.auctioneer + ', the auctioneer, as your bid on lot 0009.');
  assert.match(c.sdk.title, /^Send 4 ATTN to address /);
  assert.ok(c.sdk.notAllowed.some((t) => /can't be bought or sold/.test(t)));
  assert.equal(c.chainId, 'pointcast-devnet-2');
  assert.equal(c.genesis, GENESIS);
  // a post and a seal
  const post = await chain.buildPublish({ sender: k.sender, channel: 'NOTARY', title: N.stampTitle(HEX('a')), body: N.stampBody({ sha256: HEX('a'), bytes: 5 }) });
  const p = S0.whatYouSign(post, chain);
  assert.match(p.headline, /^A post on channel NOTARY titled “notary\/v1 sha256:a{64}”\. Its body is fixed by the hash [0-9a-f]{64}\.$/);
  assert.equal(Object.fromEntries(p.fields).media_uri, 'null');
  const seal = K.pcc.buildTx('seal_capsule', { sender: k.sender, nonce: 0, channel: 'GDN', commitment: HEX('b'), open_at: 2100, label: 'first minute' });
  const s = S0.whatYouSign(seal, chain);
  assert.match(s.headline, /^A sealed time capsule on channel GDN, wax seal “first minute”, that anyone may open from block 2100\. The chain gets only its commitment, not your message\.$/);
  assert.equal(Object.fromEntries(s.fields).commitment, HEX('b'));
  // what is not a transaction is refused, never described
  assert.throws(() => S0.whatYouSign(null, chain), /not a transaction/);
  assert.throws(() => S0.whatYouSign({ type: 'transfer', sender: 'x', nonce: 0, to: 'y', amount: -1 }, chain), /cannot be signed/);
});

test('reviewedKey signs only after the review says yes, signs exactly the transaction it showed, and Cancel signs and sends nothing', async () => {
  const k = await K.keyFromSeed('22'.repeat(32));
  let signs = 0;
  const base = { ...k, sign: async (d) => { signs += 1; return k.sign(d); } };
  const chain = fakeChain();
  const tx = K.pcc.buildTx('transfer', { sender: k.sender, nonce: 0, to: FX.daily.addresses.auctioneer, amount: 1 });
  const shown = [];
  const signedCards = [];
  const yes = S0.reviewedKey(base, async (card) => { shown.push(card); assert.equal(signs, 0, 'nothing is signed while the card is up'); return true; }, { context: () => ({ lot: 9 }), onSign: (c) => signedCards.push(c) });
  assert.equal(yes.sender, k.sender);
  assert.equal(typeof yes.sign, 'undefined', 'the wrapper has no digest-only door: it signs whole transactions it has shown');
  const signed = await yes.signTx(tx, chain);
  assert.equal(signs, 1);
  assert.equal(signed.tx, tx);
  assert.equal(await K.pcc.verifyEd25519(k.publicKey.bytes, K.pcc.hexToBytes(shown[0].digest), signed.signature), true, 'the signature is over the digest the card showed');
  assert.deepEqual(signedCards, shown);
  assert.equal(shown[0].context.lot, 9);
  // Cancel (or anything but true) refuses before signing
  for (const answer of [false, undefined, 'yes', 1]) {
    const no = S0.reviewedKey(base, async () => answer);
    await assert.rejects(() => no.signTx(tx, chain), (e) => e.code === 'declined' && /Nothing was signed or sent/.test(e.message));
  }
  assert.equal(signs, 1, 'no signature after a refusal');
  assert.throws(() => S0.reviewedKey(null, async () => true), /make a key first/);
  // a base key with its own signTx (a passkey) is handed the card it must sign against
  let got = null;
  const pk = S0.reviewedKey({ sender: 'pcp1x', publicKey: { scheme: 'p256', bytes: '02' + HEX('1').slice(0, 64) }, signTx: async (t, ch, card) => { got = card; return { tx: t, sig_mode: 'webauthn', public_key: {}, signature: '' }; } }, async () => true);
  await pk.signTx(tx, chain);
  assert.equal(got.digest, K.pcc.signingHash(tx, DOMAIN));
});

test('chain-kit signAndSend: a key with signTx signs through it, a signTx that returns another transaction is refused, and a refusal sends nothing and is not a send failure', async () => {
  const k = await K.keyFromSeed('23'.repeat(32));
  const sent = [];
  const chain = fakeChain({ sent });
  const tx = K.pcc.buildTx('transfer', { sender: k.sender, nonce: 0, to: FX.daily.addresses.auctioneer, amount: 1 });
  // a plain key still signs the old way
  const a = await K.signAndSend(chain, k, tx);
  assert.equal(a.height, 4242);
  assert.equal(sent.length, 1);
  assert.equal(await K.pcc.verifyEd25519(k.publicKey.bytes, K.pcc.hexToBytes(K.pcc.signingHash(tx, DOMAIN)), sent[0].signature), true);
  // a key with signTx: what it returns is what is sent
  const viaSignTx = { sender: k.sender, publicKey: k.publicKey, sign: async () => { throw new Error('the digest door must not be used'); }, signTx: async (t, ch) => ({ tx: t, public_key: k.publicKey, signature: await k.sign(K.pcc.signingHash(t, ch.domain)) }) };
  const b = await K.signAndSend(chain, viaSignTx, tx);
  assert.equal(sent.length, 2);
  assert.equal(b.txHash, K.pcc.txHash(sent[1]));
  // signing something else is refused before anything leaves
  const other = { ...viaSignTx, signTx: async (t) => ({ tx: { ...t, amount: 99 }, public_key: k.publicKey, signature: HEX('0') + HEX('0') }) };
  await assert.rejects(() => K.signAndSend(chain, other, tx), (e) => e.code === 'sign_mismatch' && !e.sendState);
  // a review that says no: nothing sent, and no sendState (so a page never says "may have arrived")
  await assert.rejects(() => K.signAndSend(chain, S0.reviewedKey(k, async () => false), tx), (e) => e.code === 'declined' && e.sendState === undefined);
  assert.equal(sent.length, 2);
  assert.match(src.kit, /typeof key\.signTx === 'function'\s*\n?\s*\? await key\.signTx\(tx, chain\)/);
});

// ================================================================ passkeys

test('passkeyPlace follows the chain’s launch record 7: devnet-2 takes passkeys at https://pointcast.xyz only, and says why anywhere else', () => {
  assert.deepEqual(FX.params.launch.webauthn, { max_webauthn_txs_per_block: 64, origins: ['https://pointcast.xyz'], rp_id: 'pointcast.xyz' }, 'the recorded devnet-2 params');
  const ok = S0.passkeyPlace({ params: FX.params, origin: 'https://pointcast.xyz', webauthn: true });
  assert.deepEqual(ok, { ok: true, rpId: 'pointcast.xyz', origins: ['https://pointcast.xyz'], reason: '' });
  for (const origin of ['http://localhost:4321', 'https://www.pointcast.xyz', 'https://chain.pointcast.xyz', 'https://pointcast.xyz.evil.example', '', undefined]) {
    const r = S0.passkeyPlace({ params: FX.params, origin, webauthn: true });
    assert.equal(r.ok, false, String(origin));
    assert.equal(r.reason, 'Passkeys on this devnet work only on https://pointcast.xyz: the chain fixed that list at genesis, so this copy of the page cannot make or use one. The play key works anywhere.');
  }
  assert.match(S0.passkeyPlace({ params: FX.params, origin: 'https://pointcast.xyz', webauthn: false }).reason, /This browser has no passkeys/);
  const noRecord = { ...FX.params, launch: { ...FX.params.launch, webauthn: undefined } };
  assert.match(S0.passkeyPlace({ params: noRecord, origin: 'https://pointcast.xyz', webauthn: true }).reason, /launch record 7 is off/);
  assert.equal(S0.passkeyPlace({ params: null, origin: 'https://pointcast.xyz', webauthn: true }).ok, false);
  // the page always says where passkeys work on devnet-2, and that they are devnet accounts too
  assert.match(PASSKEY_NOTE, /On devnet-2 passkeys work only on https:\/\/pointcast\.xyz: the chain’s launch record 7 names that one site, fixed at genesis\./);
  assert.match(PASSKEY_NOTE, /same passkey account First Mints makes/);
  assert.match(PASSKEY_NOTE, /no value, may reset/);
});

test('a passkey account is First Mints’ own: the same create options and slot, the same address from the same key, and nothing secret is kept', async () => {
  const soft = softPasskey();
  const w = await S0.makePasskey({ rpId: 'pointcast.xyz', credentials: soft });
  assert.equal(soft.log[0].op, 'create');
  assert.deepEqual(soft.log[0], { op: 'create', rpId: 'pointcast.xyz', alg: [-7], uv: 'required' });
  assert.match(w.address, /^pcp1/);
  assert.equal(w.address, K.pcc.passkeyAddress(w.publicKey));
  assert.equal(K.pcc.isP256Key(w.publicKey.bytes), true);
  // live.js reads the key by hand (the last 65 bytes of the SPKI, compressed): the same key, the same address
  const cred = await soft.create({ publicKey: { rp: { id: 'pointcast.xyz' }, pubKeyCredParams: [{ alg: -7 }], authenticatorSelection: { userVerification: 'required' } } });
  const spki = new Uint8Array(cred.response.getPublicKey());
  const point = spki.slice(spki.length - 65);
  const manual = new Uint8Array(33);
  manual[0] = point[64] & 1 ? 3 : 2;
  manual.set(point.slice(1, 33), 1);
  const mine = S0.passkeyFromCredential(cred);
  assert.equal(mine.publicKey.bytes, K.pcc.bytesToHex(manual));
  assert.equal(mine.credentialId, Buffer.from(new Uint8Array(cred.rawId)).toString('base64url'));
  // the create options are word for word First Mints’
  const live = read('public/chain/first-mints/live.js');
  for (const opt of ["rp: { id: cfg.rpId, name: 'PointCast' }", "name: 'devnet-2 wallet', displayName: 'PointCast devnet-2'", "pubKeyCredParams: [{ type: 'public-key', alg: -7 }]", "authenticatorSelection: { residentKey: 'preferred', userVerification: 'required' }", 'timeout: 60000']) {
    assert.ok(live.includes(opt), 'live.js ' + opt);
    assert.ok(src.logic.includes(opt.replace('cfg.rpId', 'rpId')), 'start.js ' + opt);
  }
  assert.match(live, /const KEY = 'pc-fm-live:devnet-2';/);
  assert.equal(S0.PASSKEY_SLOT, 'pc-fm-live:devnet-2');
  // kept: public key, credential id and address only; read back strictly
  const st = fakeStorage();
  assert.equal(S0.storePasskey(st, w), true);
  assert.deepEqual(Object.keys(JSON.parse(st.m.get(S0.PASSKEY_SLOT))).sort(), ['address', 'credentialId', 'publicKey']);
  assert.deepEqual(S0.loadPasskey(st), w);
  st.m.set(S0.PASSKEY_SLOT, JSON.stringify({ ...w, address: 'pcp1' + 'x'.repeat(30) }));
  assert.equal(S0.loadPasskey(st), null, 'an address that is not the key’s own is not loaded');
  for (const bad of ['nope', '{}', JSON.stringify({ ...w, publicKey: { scheme: 'p256', bytes: '04' + HEX('1') } }), JSON.stringify({ ...w, credentialId: '<script>' })]) { st.m.set(S0.PASSKEY_SLOT, bad); assert.equal(S0.loadPasskey(st), null, bad.slice(0, 20)); }
  assert.equal(S0.loadPasskey({ getItem: () => { throw new Error('blocked'); } }), null);
  assert.equal(S0.storePasskey({ setItem: () => { throw new Error('blocked'); } }, w), false);
  await assert.rejects(() => S0.makePasskey({ rpId: 'pointcast.xyz', credentials: null }), /no passkeys/);
  assert.throws(() => S0.passkeyFromCredential({ rawId: new ArrayBuffer(16), response: { getPublicKey: () => new Uint8Array(40).buffer } }), /ES256/);
  assert.throws(() => S0.passkeyFromCredential({}), /no public key/);
});

test('a passkey signs only a reviewed digest: no card, no sheet; with a card it signs exactly that digest as a webauthn transaction whose signature verifies', async () => {
  const soft = softPasskey();
  const w = await S0.makePasskey({ rpId: 'pointcast.xyz', credentials: soft });
  const key = S0.passkeyKey(w, { rpId: 'pointcast.xyz', credentials: soft });
  assert.equal(key.kind, 'passkey');
  assert.equal(key.sender, w.address);
  const chain = fakeChain();
  const tx = K.pcc.buildTx('transfer', { sender: w.address, nonce: 0, to: FX.daily.addresses.auctioneer, amount: 4 });
  await assert.rejects(() => key.signTx(tx, chain), (e) => e.code === 'unreviewed');
  await assert.rejects(() => key.signTx(tx, chain, { digest: 'nope' }), (e) => e.code === 'unreviewed');
  assert.equal(soft.log.filter((l) => l.op === 'get').length, 0, 'the authenticator was never asked');
  // a card for a different transaction: the SDK's confirm says no, so the sheet never opens
  const other = K.pcc.buildTx('transfer', { sender: w.address, nonce: 0, to: FX.daily.addresses.auctioneer, amount: 5 });
  await assert.rejects(() => key.signTx(tx, chain, S0.whatYouSign(other, chain)), /not approved: the passkey was not asked/);
  assert.equal(soft.log.filter((l) => l.op === 'get').length, 0);
  // reviewed: one assertion, over the digest the card showed
  const shown = [];
  const reviewed = S0.reviewedKey(key, async (c) => { shown.push(c); return true; });
  const signed = await reviewed.signTx(tx, chain);
  const gets = soft.log.filter((l) => l.op === 'get');
  assert.equal(gets.length, 1);
  assert.equal(gets[0].rpId, 'pointcast.xyz');
  assert.equal(gets[0].uv, 'required');
  assert.equal(gets[0].challenge, Buffer.from(shown[0].digest, 'hex').toString('base64url'));
  assert.equal(signed.sig_mode, 'webauthn');
  assert.equal(signed.tx, tx);
  assert.deepEqual(signed.public_key, w.publicKey);
  const env = K.pcc.parseWebauthnEnvelope(signed.signature);
  const cdj = JSON.parse(new TextDecoder().decode(env.clientDataJSON));
  assert.deepEqual(cdj, { type: 'webauthn.get', challenge: gets[0].challenge, origin: 'https://pointcast.xyz', crossOrigin: false });
  const pair = [...soft.creds.values()][0].pair;
  const msg = new Uint8Array([...env.authenticatorData, ...new Uint8Array(await crypto.subtle.digest('SHA-256', env.clientDataJSON))]);
  assert.equal(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pair.publicKey, env.rs, msg), true, 'the P-256 signature verifies over authenticatorData ‖ SHA-256(clientDataJSON)');
  assert.equal(K.pcc.txHash(signed).length, 64);
});

// ================================================================ the steps' small plans

test('takeAttn asks the faucet once and waits for the play ATTN to land; an account that already took it is told so; a closed faucet is an error that says why', async () => {
  const k = await K.keyFromSeed('24'.repeat(32));
  const accounts = {};
  const posts = [];
  let reads = 0;
  const faucet = async (u, init) => { posts.push(JSON.parse(init.body)); setTimeout(() => { accounts[k.sender] = { balance: 100, next_nonce: 0 }; }, 30); return reply({ tx_hash: HEX('c'), amount: 100 }); };
  const net = K.makeNet('http://127.0.0.1:8799', { fetch: fakeDevnet({ accounts, overrides: { '/daily/faucet': faucet, ['/account/' + k.sender]: async () => { reads += 1; const a = accounts[k.sender]; return reply(a ? { balance: a.balance, exists: true, next_nonce: 0 } : { balance: 0, exists: false, next_nonce: 0 }); } } }) });
  const r = await S0.takeAttn(net, k.sender, { every: 10 });
  assert.deepEqual(r, { amount: 100, balance: 100, already: false });
  assert.deepEqual(posts, [{ address: k.sender }], 'only the account’s name is sent');
  assert.ok(reads >= 2, 'it read until the play ATTN landed');
  const again = K.makeNet('http://127.0.0.1:8799', { fetch: fakeDevnet({ accounts, overrides: { '/daily/faucet': async () => reply({ error: 'this address already took its play ATTN from the faucet (once per address)' }, 409) } }) });
  assert.deepEqual(await S0.takeAttn(again, k.sender), { amount: null, balance: 100, already: true });
  const shut = K.makeNet('http://127.0.0.1:8799', { fetch: fakeDevnet({ overrides: { '/daily/faucet': async () => reply({ error: "the faucet's 300 claims for today are taken (UTC)" }, 429) } }) });
  await assert.rejects(() => S0.takeAttn(shut, k.sender), (e) => e.status === 429 && /claims for today are taken/.test(K.describeError(e)) && !/Try again in/.test(K.describeError(e)));
  // a claim that never lands is not waited on forever, and what is not an address is refused before anything is sent
  const slow = K.makeNet('http://127.0.0.1:8799', { fetch: fakeDevnet({ overrides: { '/daily/faucet': async () => reply({ tx_hash: HEX('c'), amount: 100 }) } }) });
  const t0 = Date.now();
  assert.deepEqual(await S0.takeAttn(slow, 'tz1WspKrkkKjHhXeWPJEZJusB7dEjFgJ3uME', { waitMs: 60, every: 10 }), { amount: 100, balance: 0, already: false });
  assert.ok(Date.now() - t0 < 1000);
  await assert.rejects(() => S0.takeAttn(slow, 'not-an-address'), (e) => e.code === 'bad_address');
});

test('the bid is the least the open lot takes, with no words and no gift, and a lot about to close is not bid on', () => {
  const d = D.readDaily(FX.daily);
  const me = 'tz1WspKrkkKjHhXeWPJEZJusB7dEjFgJ3uME';
  const p = S0.bidPlan(d, me, 100);
  assert.equal(p.ok, true, p.errors.join());
  assert.equal(p.amount, D.leastBid(d));
  assert.equal(p.amount, 4, 'the recorded lot leads at 3: the least bid is 4');
  assert.deepEqual(p.words, []);
  assert.equal(p.gift, null);
  assert.equal(p.auctioneer, FX.daily.addresses.auctioneer);
  // nobody bid yet: 1 play ATTN
  const empty = D.readDaily({ ...FX.daily, lot: { ...FX.daily.lot, leader: null, min_bid: 1, bids: 0 } });
  assert.equal(S0.bidPlan(empty, me, 100).amount, 1);
  assert.match(S0.bidPlan(d, me, 2).errors.join(' '), /You hold 2 play ATTN; this bid is 4\./);
  assert.match(S0.bidPlan(d, '', 100).errors.join(' '), /Make a key first/);
  // the close
  const lot = d.lot;
  assert.equal(S0.lotStillOpen(lot, 1000, 1000), true, lot.closesInMs + ' ms left');
  assert.equal(S0.lotStillOpen(lot, 1000, 1000 + lot.closesInMs - 121000), true);
  assert.equal(S0.lotStillOpen(lot, 1000, 1000 + lot.closesInMs - 119000), false, 'inside the two-minute margin');
  assert.equal(S0.lotStillOpen(lot, 1000, 1000 + lot.closesInMs + 5), false);
});

test('a sentence is one line of at most 280 characters, and its stamp is the Notary’s three lines of its SHA-256: the sentence itself goes nowhere', async () => {
  assert.deepEqual(S0.checkSentence('I was here.'), { ok: true, error: '', text: 'I was here.' });
  assert.equal(S0.checkSentence('  spaced  ').text, '  spaced  ', 'taken exactly as typed, as the Notary hashes text');
  for (const [bad, why] of [['', /Type a sentence/], ['   ', /Type a sentence/], ['two\nlines', /One line/], ['x'.repeat(281), /At most 280/], [null, /Type a sentence/]]) assert.match(S0.checkSentence(bad).error, why);
  assert.equal(S0.checkSentence('é'.repeat(280)).ok, true, 'characters, not bytes');
  const s = await S0.stampOf('I was here.');
  assert.equal(s.sha256, sha('I was here.'));
  assert.equal(s.bytes, 11);
  assert.equal(s.body, N.stampBody({ sha256: sha('I was here.'), bytes: 11 }));
  assert.equal(s.body, 'notary/v1\nsha256:' + sha('I was here.') + '\nbytes:11');
  assert.equal(s.title, N.stampTitle(sha('I was here.')));
  assert.ok(!s.body.includes('I was here'));
  // Regression (review 10-21): the page called this body "the five Notary lines". With no name and no note it is three,
  // and every place that counts its lines says three.
  assert.equal(s.body.split('\n').length, 3);
  for (const f of [FILES.logic, FILES.view, FILES.data, FILES.page]) assert.doesNotMatch(read(f), /\bfive(?:[- ]line| Notary lines| lines)\b/, f + ' counts the stamp’s lines as five');
  assert.match(src.view, /The body is the three Notary lines: the format, your sentence’s SHA-256/);
});

test('a capsule opens about 7 days of blocks on, from the rate of the last day and never sooner than 7 days of heartbeats, on GDN', async () => {
  assert.equal(S0.capsuleDelay(12), 2016);
  for (const r of [0, -1, NaN, undefined, 6, 11.9]) assert.equal(S0.capsuleDelay(r), 2016, String(r));
  assert.equal(S0.capsuleDelay(30), 5040);
  assert.equal(S0.capsuleDelay(1e9), C.LIMITS.maxDelay);
  assert.equal(S0.CAPSULE_CHANNEL, 'GDN');
  assert.ok(C.CHANNELS.includes(S0.CAPSULE_CHANNEL));
  const p = S0.capsulePlan({ message: 'See you in a week.', title: CAPSULE_DEFAULTS.title, label: CAPSULE_DEFAULTS.label, tip: 3770, perHour: 12.4, sender: 'tz1WspKrkkKjHhXeWPJEZJusB7dEjFgJ3uME' });
  assert.equal(p.ok, true, p.errors.join());
  assert.deepEqual(p.fields, { channel: 'GDN', title: CAPSULE_DEFAULTS.title, body: 'See you in a week.', label: 'first minute', openAt: 3770 + 2083, delay: 2083 });
  assert.match(S0.capsulePlan({ message: '', title: 't', label: 'l', tip: 1, perHour: 12, sender: 'x' }).errors.join(), /message cannot be empty/);
  // the rate of the last day, from two block headers; block 1 is skipped (its time can be 0)
  const blocks = { 2: 1792500000000, 290: 1792500000000 + 86400000, 3770: 1792600000000 };
  const log = [];
  const net = { get: async (p2) => { log.push(p2); const n = Number(p2.split('/').pop()); return blocks[n] !== undefined ? { timestamp: blocks[n] } : { timestamp: 0 }; } };
  const r = await S0.dayRate(net, 290);
  assert.deepEqual(log.sort(), ['/block/2', '/block/290']);
  assert.equal(r, 12, '288 blocks in a day');
  assert.equal(await S0.dayRate({ get: async (p2) => ({ timestamp: p2 === '/block/10' ? 1792500000000 + 1800000 : 1792500000000 }) }, 10), 16, '8 blocks in half an hour');
  assert.equal(await S0.dayRate({ get: async () => ({ timestamp: 0 }) }, 500), 12, 'unreadable times: the heartbeat');
  assert.equal(await S0.dayRate({ get: async () => { throw new Error('down'); } }, 500), 12);
  assert.equal(await S0.dayRate({ get: async (p2) => ({ timestamp: p2 === '/block/500' ? 1792500000000 + 86400000 * 30 : 1792500000000 }) }, 500), 12, 'slower than the heartbeat is read as the heartbeat');
  assert.equal(await S0.dayRate(net, 2), 12);
});

test('a capsule file is kept where Time Capsules finds it: newest first, one per capsule, at most 32, other entries left alone', () => {
  assert.equal(MY_SLOT, 'pointcast-chain-apps/capsules/v1');
  const st = fakeStorage({ [MY_SLOT]: JSON.stringify([{ format: 'something-newer' }, { capsule: HEX('1'), old: true }]) });
  assert.equal(S0.keepCapsuleFile(st, MY_SLOT, { capsule: HEX('1'), v: 2 }), true);
  assert.deepEqual(JSON.parse(st.m.get(MY_SLOT)), [{ capsule: HEX('1'), v: 2 }, { format: 'something-newer' }]);
  for (let i = 0; i < 40; i++) S0.keepCapsuleFile(st, MY_SLOT, { capsule: String(i).padStart(64, '0') });
  assert.equal(JSON.parse(st.m.get(MY_SLOT)).length, 32);
  assert.equal(JSON.parse(st.m.get(MY_SLOT))[0].capsule, '39'.padStart(64, '0'));
  assert.equal(S0.keepCapsuleFile({ getItem: () => null, setItem: () => { throw new Error('full'); } }, MY_SLOT, { capsule: HEX('2') }), false);
  assert.equal(S0.keepCapsuleFile(fakeStorage({ [MY_SLOT]: 'not json' }), MY_SLOT, { capsule: HEX('2') }), false);
});

test('step 4’s links are same-site paths built from the block number; under a local override they read that same local devnet, and nothing else gets in', () => {
  const pub = { api: DEVNET.url, genesis: DEVNET.genesis, override: false };
  assert.deepEqual(S0.blockLinks(pub, 3771, DEVNET.yardHref), { verify: '/chain/verify-a-block#b=3771', yard: DEVNET.yardHref, observatory: '/chain/observatory' });
  const local = { api: 'http://127.0.0.1:8812', genesis: HEX('8'), override: true };
  assert.deepEqual(S0.blockLinks(local, 21, DEVNET.yardHref), {
    verify: '/chain/verify-a-block?devnet=http%3A%2F%2F127.0.0.1%3A8812#b=21',
    yard: '/chain/yard/?api=http%3A%2F%2F127.0.0.1%3A8812&genesis=' + HEX('8') + '&verifier=/chain/yard/verifier',
    observatory: '/chain/observatory?devnet=http%3A%2F%2F127.0.0.1%3A8812',
  });
  // an "override" that is not localhost is treated as none; a bad height gives no verify link; a strange yard link falls back
  assert.deepEqual(S0.blockLinks({ api: 'https://evil.example', override: true }, 5, 'javascript:alert(1)'), { verify: '/chain/verify-a-block#b=5', yard: '/chain/yard/', observatory: '/chain/observatory' });
  for (const h of [0, -1, 1.5, '7', null]) assert.equal(S0.blockLinks(pub, h, DEVNET.yardHref).verify, null, String(h));
  for (const l of Object.values(S0.blockLinks(local, 21, DEVNET.yardHref))) assert.ok(l.startsWith('/chain/'));
});

test('landed reads the block back: its hash and time from GET /block/N, and GET /tx/HASH must name that same block', async () => {
  const b = FX.blocks.at(-1);
  const t = b.txs[0];
  const net = K.makeNet('http://127.0.0.1:8799', { fetch: fakeDevnet() });
  const r = await S0.landed(net, K.pcc.txHash(t), b.header.height);
  assert.equal(r.included, true);
  assert.equal(r.hash, K.pcc.blockHeaderHash(b.header));
  assert.equal(r.timeMs, b.header.timestamp);
  assert.equal((await S0.landed(net, K.pcc.txHash(t), b.header.height - 1)).included, false, 'another block is not "included"');
  assert.equal((await S0.landed(net, HEX('7'), b.header.height)).included, false);
  const down = await S0.landed(K.makeNet('http://127.0.0.1:8799', { fetch: async () => { throw new Error('down'); } }), HEX('7'), 3);
  assert.deepEqual(down, { height: 3, hash: '', timeMs: 0, included: false });
});

// ================================================================ the view (jsdom)

/** The page's skeleton, from the hooks the view uses (each one also exists in the page: checked below). */
function skeleton() {
  const step = (k, n) => '<li data-st-step="' + k + '" data-state="' + (k === 'key' ? 'now' : 'todo') + '"><h3 tabindex="-1" data-st-h="' + k + '">' + n + '</h3><span data-st-badge="' + k + '">x</span>';
  return [
    '<p data-st-status></p><p data-st-meta></p><p data-st-genesis hidden></p><ol>',
    step('key', 1),
    '<div data-key-panel><p data-kp-status></p><code data-kp-address></code><button data-kp-make disabled>Make a key</button><button data-kp-keepold hidden></button><input type="checkbox" data-kp-keep disabled><button data-kp-reveal disabled></button><button data-kp-copy hidden></button><button data-kp-forget disabled></button><input data-kp-seed hidden><input type="password" data-kp-own><p data-kp-own-note></p><button data-kp-use disabled></button></div>',
    '<button data-st-pk-make disabled></button><button data-st-pk-use hidden></button><button data-st-pk-off hidden></button><p data-st-pk-why></p><p data-st-who></p></li>',
    step('attn', 2), '<b data-st-balance></b><button data-st-faucet disabled></button><button data-st-skip disabled></button><p data-st-faucet-out></p></li>',
    step('act', 3), ...['bid', 'stamp', 'capsule'].map((c) => '<input type="radio" name="c" value="' + c + '" data-st-choice disabled>'),
    '<div data-st-panel="bid" hidden><dd data-st-lot></dd><dd data-st-least></dd><dd data-st-closes></dd><dd data-st-leader></dd></div>',
    '<div data-st-panel="stamp" hidden><input data-st-sentence><p data-st-sentence-note></p></div>',
    '<div data-st-panel="capsule" hidden><textarea data-st-message></textarea><input data-st-ctitle value="' + CAPSULE_DEFAULTS.title + '"><input data-st-clabel value="' + CAPSULE_DEFAULTS.label + '"><p data-st-capsule-when></p><input type="checkbox" data-st-capsule-keep></div>',
    '<button data-st-review disabled></button><ul data-st-errors hidden></ul>',
    '<div data-st-card hidden><h4 tabindex="-1" data-st-card-h></h4><p data-st-card-head></p><dl data-st-card-fields></dl><code data-st-card-digest></code><div data-st-card-sdk><p data-st-card-sdk-title></p><ul data-st-card-sdk-list></ul></div><p data-st-card-note></p><p data-st-card-where></p><button data-st-sign></button><button data-st-cancel></button></div>',
    '<div data-st-progress hidden><p data-st-progress-text></p></div></li>',
    step('see', 4), '<p data-st-see-wait></p><div data-st-done hidden><span data-st-done-height></span><span data-st-done-time></span><span data-st-done-who></span><p data-st-done-line></p><code data-st-done-tx></code><code data-st-done-hash></code><dd data-st-done-status></dd>',
    '<a data-st-link-verify href="/chain/verify-a-block">v</a><a data-st-link-yard href="' + DEVNET.yardHref.replace(/&/g, '&amp;') + '">y</a><a data-st-link-obs href="/chain/observatory">o</a>',
    '<div data-st-keep hidden><p data-st-keep-text></p><button data-st-download></button><pre data-st-keep-pre hidden></pre></div><p data-st-next></p></div></li></ol>',
  ].join('\n');
}

function mountView({ search = '', fetchOpts = {}, extra = {} } = {}) {
  const bar = '<div data-st-bar>' + S0.STEPS.map((k) => '<span data-seg="' + k + '"></span>').join('') + '</div><p data-st-bar-text></p>';
  const dom = new JSDOM('<!doctype html><html><body>' + bar + '<section data-start-app data-state="static" data-api="' + DEVNET.url + '" data-genesis="' + GENESIS + '" data-yard="' + DEVNET.yardHref.replace(/&/g, '&amp;') + '">' + skeleton() + '</section></body></html>', { url: 'http://localhost/chain/start/' + search });
  const rootEl = dom.window.document.querySelector('[data-start-app]');
  const log = fetchOpts.log || [];
  const base = fakeDevnet({ ...fetchOpts, log });
  const fetchFn = async (u, i) => base(String(u).replace(DEVNET.url, 'http://127.0.0.1:8799').replace(/^http:\/\/127\.0\.0\.1:8812/, 'http://127.0.0.1:8799'), i);
  const c = view.mount(rootEl, { window: dom.window, fetch: fetchFn, storage: null, supported: true, now: () => Date.now(), origin: 'http://localhost', credentials: null, ...extra });
  return { dom, rootEl, c, log };
}
const $ = (r, s) => r.querySelector(s);
const txt = (r, s) => ($(r, s) || {}).textContent;
const stateOf = (r, k) => $(r, '[data-st-step="' + k + '"]').dataset.state;

/** A devnet that funds on the faucet, and serves block 4242 and its transactions once they are "sent". */
function world({ sent = [], stored = [], accounts = {} } = {}) {
  const chain = fakeChain({ sent, stored });
  const overrides = new Proxy({
    '/daily/faucet': async (u, init) => { const a = JSON.parse(init.body).address; accounts[a] = { balance: 100, next_nonce: 0 }; return reply({ tx_hash: HEX('c'), amount: 100 }); },
    '/block/4242': async () => reply({ hash: HEX('5'), timestamp: 1792610000000, height: 4242 }),
  }, { get: (t, p) => (typeof p === 'string' && p.startsWith('/tx/') ? async (u) => reply(sent.some((s) => K.pcc.txHash(s) === u.pathname.slice(4)) ? { status: 'included', height: 4242, index: 0 } : { status: 'unknown' }) : t[p]) });
  return { chain, overrides, accounts, sent, stored, connect: async () => chain };
}

async function toStep3({ choice, skip = false, extra = {}, w = world() } = {}) {
  const m = mountView({ fetchOpts: { accounts: w.accounts, overrides: w.overrides }, extra: { connect: w.connect, ...extra } });
  await m.c.begin();
  m.c.stop();
  if (!extra.credentials) { $(m.rootEl, '[data-kp-make]').click(); await until(() => m.c.keys.key()); await tick(30); }
  if (skip) $(m.rootEl, '[data-st-skip]').click();
  else { $(m.rootEl, '[data-st-faucet]').click(); await until(() => stateOf(m.rootEl, 'act') === 'now'); }
  if (choice) { const r = $(m.rootEl, '[data-st-choice][value="' + choice + '"]'); r.checked = true; r.dispatchEvent(new m.dom.window.Event('change')); }
  return { ...m, w };
}

test('the steps go in order: a key, then play ATTN, then one thing, each one lighting up as the one before is done, the bar following', async () => {
  const w = world();
  const { rootEl, c, dom } = mountView({ fetchOpts: { accounts: w.accounts, overrides: w.overrides }, extra: { connect: w.connect } });
  await c.begin();
  c.stop();
  assert.equal(rootEl.dataset.state, 'ready');
  assert.deepEqual(S0.STEPS.map((k) => stateOf(rootEl, k)), ['now', 'todo', 'todo', 'todo']);
  assert.equal(dom.window.document.querySelector('[data-st-bar-text]').textContent, 'SETUP · STEP 1 OF 4 · MAKE YOUR KEY');
  assert.equal($(rootEl, '[data-st-faucet]').disabled, true, 'no faucet before a key');
  assert.ok([...rootEl.querySelectorAll('[data-st-choice]')].every((r) => r.disabled), 'no choices before a key');
  $(rootEl, '[data-kp-make]').click();
  await until(() => c.keys.key());
  await tick(30);
  assert.deepEqual(S0.STEPS.map((k) => stateOf(rootEl, k)), ['done', 'now', 'todo', 'todo']);
  assert.equal(dom.window.document.activeElement, $(rootEl, '[data-st-h="attn"]'), 'the focus moves to the step that is now current');
  assert.match(txt(rootEl, '[data-st-who]'), new RegExp('^Signing as ' + c.keys.key().sender + ' · the play key\\.$'));
  assert.equal(dom.window.document.querySelector('[data-seg="key"]').dataset.on, 'yes');
  assert.equal(dom.window.document.querySelector('[data-seg="attn"]').dataset.on, 'now');
  $(rootEl, '[data-st-faucet]').click();
  await until(() => stateOf(rootEl, 'act') === 'now');
  assert.deepEqual(S0.STEPS.map((k) => stateOf(rootEl, k)), ['done', 'done', 'now', 'todo']);
  assert.match(txt(rootEl, '[data-st-faucet-out]'), /^The faucet sent 100 play ATTN and it landed\. You hold 100 play ATTN\.$/);
  assert.equal(txt(rootEl, '[data-st-balance]'), '100 play ATTN');
  assert.equal(dom.window.document.querySelector('[data-st-bar-text]').textContent, 'SETUP · STEP 3 OF 4 · DO ONE THING');
  assert.ok([...rootEl.querySelectorAll('[data-st-choice]')].every((r) => !r.disabled));
  assert.equal($(rootEl, '[data-st-review]').disabled, true, 'Review waits for a choice');
  // a choice opens its own panel only
  const r = $(rootEl, '[data-st-choice][value="capsule"]');
  r.checked = true;
  r.dispatchEvent(new dom.window.Event('change'));
  assert.deepEqual([...rootEl.querySelectorAll('[data-st-panel]')].map((p) => p.hidden), [true, true, false]);
  assert.match(txt(rootEl, '[data-st-capsule-when]'), new RegExp('^It opens at block ' + K.groups(FX.status.height + FX_DELAY) + ', ' + K.groups(FX_DELAY) + ' blocks on: about 7 days at the current rate'));
  assert.equal($(rootEl, '[data-st-review]').disabled, false);
  assert.equal(w.sent.length, 0, 'nothing signed so far');
});

test('stamp: Review shows the exact post (every field, the digest), nothing is signed until Sign; Cancel sends nothing; Sign stamps it, and step 4 names the block and links its check', async () => {
  const { rootEl, c, dom, w } = await toStep3({ choice: 'stamp', skip: true });
  assert.equal($(rootEl, '[data-st-badge="attn"]').textContent, 'SKIPPED');
  $(rootEl, '[data-st-review]').click();
  await tick(30);
  assert.deepEqual([...rootEl.querySelectorAll('[data-st-errors] li')].map((l) => l.textContent), ['Type a sentence first.']);
  assert.equal(w.stored.length, 0);
  $(rootEl, '[data-st-sentence]').value = 'I was here first.';
  $(rootEl, '[data-st-review]').click();
  await until(() => !$(rootEl, '[data-st-card]').hidden);
  const fields = Object.fromEntries([...rootEl.querySelectorAll('[data-st-card-fields] > div')].map((d) => [d.firstChild.textContent, d.lastChild.textContent]));
  assert.deepEqual(Object.keys(fields), ['sender', 'nonce', 'type', 'channel', 'title', 'body_hash', 'media_uri']);
  assert.equal(fields.type, 'publish_block');
  assert.equal(fields.channel, 'NOTARY');
  assert.equal(fields.title, 'notary/v1 sha256:' + sha('I was here first.'));
  assert.equal(fields.sender, c.keys.key().sender);
  assert.equal(w.stored[0], 'notary/v1\nsha256:' + sha('I was here first.') + '\nbytes:17', 'the three lines, without the sentence');
  assert.equal(fields.body_hash, K.pcc.bodyHash(w.stored[0]));
  const tx = { sender: fields.sender, nonce: 0, type: 'publish_block', channel: 'NOTARY', title: fields.title, body_hash: fields.body_hash, media_uri: null };
  assert.equal(txt(rootEl, '[data-st-card-digest]'), K.pcc.signingHash(tx, DOMAIN));
  assert.match(txt(rootEl, '[data-st-card-note]'), /your sentence itself was not sent/);
  assert.match(txt(rootEl, '[data-st-card-where]'), /^Signed in this browser by the play key and sent to https:\/\/pointcast-devnet\.mhoydich\.workers\.dev \(pointcast-devnet-2, genesis /);
  assert.ok(txt(rootEl, '[data-st-card-sdk-title]').startsWith('Post "notary/v1 sha256:'));
  assert.equal(dom.window.document.activeElement, $(rootEl, '[data-st-card-h]'), 'the card takes the focus');
  assert.equal(w.sent.length, 0, 'nothing is signed while the card is up');
  assert.equal($(rootEl, '[data-st-review]').disabled, true, 'one review at a time');
  // Cancel, from the keyboard: Escape on the card
  $(rootEl, '[data-st-card]').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await until(() => $(rootEl, '[data-st-progress]').dataset.state === 'bad');
  assert.match(txt(rootEl, '[data-st-progress-text]'), /^Not signed: you pressed Cancel\. Nothing was signed, and no transaction was sent\. \(The stamp’s three lines, stored when you pressed Review, sit unsigned in the devnet’s body store, tied to no key\.\)$/);
  assert.equal(w.sent.length, 0);
  assert.equal($(rootEl, '[data-st-card]').hidden, true);
  assert.equal(stateOf(rootEl, 'act'), 'now');
  // Review again (Enter in the sentence), then Sign
  $(rootEl, '[data-st-sentence]').dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await until(() => !$(rootEl, '[data-st-card]').hidden);
  $(rootEl, '[data-st-sign]').click();
  await until(() => stateOf(rootEl, 'see') === 'done');
  assert.equal(w.sent.length, 1);
  assert.equal(await K.pcc.verifyEd25519(c.keys.key().publicKey.bytes, K.pcc.hexToBytes(K.pcc.signingHash(w.sent[0].tx, DOMAIN)), w.sent[0].signature), true);
  assert.equal(w.sent[0].tx.title, 'notary/v1 sha256:' + sha('I was here first.'));
  assert.equal(txt(rootEl, '[data-st-done-height]'), '#4,242');
  assert.equal(txt(rootEl, '[data-st-done-tx]'), K.pcc.txHash(w.sent[0]));
  assert.equal(txt(rootEl, '[data-st-done-hash]'), HEX('5'));
  assert.match(txt(rootEl, '[data-st-done-status]'), /^included: the devnet’s GET \/tx says block 4242$/);
  assert.match(txt(rootEl, '[data-st-done-line]'), /stamped in block 4242\. The stamp shows this key signed that SHA-256 by then; it does not show who wrote the sentence\./);
  assert.equal($(rootEl, '[data-st-link-verify]').getAttribute('href'), '/chain/verify-a-block#b=4242');
  assert.equal(txt(rootEl, '[data-st-link-verify]'), 'Verify block 4242 by hand →');
  assert.equal($(rootEl, '[data-st-link-yard]').getAttribute('href'), DEVNET.yardHref);
  assert.equal($(rootEl, '[data-st-link-obs]').getAttribute('href'), '/chain/observatory');
  assert.equal(dom.window.document.querySelector('[data-st-bar-text]').textContent, 'SETUP COMPLETE · 4 OF 4 · YOUR TRANSACTION IS IN BLOCK 4242');
  assert.deepEqual(S0.STEPS.map((k) => stateOf(rootEl, k)), ['done', 'done', 'done', 'done']);
  assert.equal($(rootEl, '[data-st-keep]').hidden, false);
  assert.match(txt(rootEl, '[data-st-keep-text]'), /^Your sentence, exactly as stamped: “I was here first\.”/);
  assert.equal(N.readReceipt(txt(rootEl, '[data-st-keep-pre]')).sha256, sha('I was here first.'));
  assert.equal(txt(rootEl, '[data-st-download]'), 'Download the receipt');
  assert.ok([...rootEl.querySelectorAll('[data-st-choice]')].every((r) => r.disabled), 'one thing: the choices close once it is done');
});

test('a stamp’s Review stores its three Notary lines before Sign, with the real SDK client, and the page says so before Review: no copy claims nothing is sent until Sign', async () => {
  // Regression (review 10-21): the act step said "Nothing is sent until you press Sign", but the SDK's buildPublish
  // stores a post's body (POST /body) when Review builds the stamp, before any key signs.
  const stored = [];
  const log = [];
  const overrides = { '/body': async (u, init) => { const b = JSON.parse(init.body).body; stored.push(b); return reply({ body_hash: K.pcc.bodyHash(b) }); } };
  const m = mountView({ fetchOpts: { overrides, log } }); // no stand-in connect: the page's own pinned SDK client
  await m.c.begin();
  m.c.stop();
  $(m.rootEl, '[data-kp-make]').click();
  await until(() => m.c.keys.key());
  await tick(30);
  $(m.rootEl, '[data-st-skip]').click();
  const r = $(m.rootEl, '[data-st-choice][value="stamp"]');
  r.checked = true;
  r.dispatchEvent(new m.dom.window.Event('change'));
  $(m.rootEl, '[data-st-sentence]').value = 'I was here first.';
  $(m.rootEl, '[data-st-review]').click();
  await until(() => !$(m.rootEl, '[data-st-card]').hidden);
  assert.equal($(m.rootEl, '[data-st-card]').hidden, false, txt(m.rootEl, '[data-st-progress-text]'));
  assert.deepEqual(log.filter((l) => !l.startsWith('GET ')), ['POST /body'], 'Review stores the body, and writes nothing else');
  assert.deepEqual(stored, ['notary/v1\nsha256:' + sha('I was here first.') + '\nbytes:17']);
  // the page says so where the person reads it before pressing Review, and nothing claims otherwise
  assert.match(STEP_COPY.find((s) => s.key === 'act').text, /Nothing is signed, and no transaction is sent, until you press Sign\. Reviewing a stamp first stores its three Notary lines \(the format, the fingerprint, the length\) on the devnet, unsigned/);
  assert.match(src.page.replace(/\s+/g, ' '), /data-st-sentence-note>[^<]*Review stores the three Notary lines \(the format, the fingerprint, the length\) on the devnet, unsigned, before you sign/);
  for (const f of MY_FILES.filter((p) => !p.startsWith('tests/'))) assert.doesNotMatch(read(f).replace(/\s+/g, ' '), /Nothing is sent until you press Sign/, f);
  // Cancel: no transaction, and the stored lines are named
  $(m.rootEl, '[data-st-cancel]').click();
  await until(() => $(m.rootEl, '[data-st-progress]').dataset.state === 'bad');
  assert.match(txt(m.rootEl, '[data-st-progress-text]'), /^Not signed: you pressed Cancel\. Nothing was signed, and no transaction was sent\. \(The stamp’s three lines, stored when you pressed Review, sit unsigned/);
  assert.ok(!log.includes('POST /tx'), 'no transaction was sent');
});

test('bid: the card is the transfer of the least bid to the auctioneer the edition names; a house that names another auctioneer gets nothing', async () => {
  const { rootEl, w } = await toStep3({ choice: 'bid' });
  assert.match(txt(rootEl, '[data-st-lot]'), /^Lot 0009 · 2026-10-20$/);
  assert.match(txt(rootEl, '[data-st-least]'), /^4 play ATTN, the least the lot takes now$/);
  assert.match(txt(rootEl, '[data-st-leader]'), /at 3 play ATTN$/);
  $(rootEl, '[data-st-review]').click();
  await until(() => !$(rootEl, '[data-st-card]').hidden || $(rootEl, '[data-st-progress]').dataset.state === 'bad');
  // the recorded lot closes in under 12 minutes of the recording: fresh reads keep it open here
  assert.equal($(rootEl, '[data-st-card]').hidden, false, txt(rootEl, '[data-st-progress-text]') + ' ' + txt(rootEl, '[data-st-errors]'));
  const fields = Object.fromEntries([...rootEl.querySelectorAll('[data-st-card-fields] > div')].map((d) => [d.firstChild.textContent, d.lastChild.textContent]));
  assert.deepEqual(fields, { sender: fields.sender, nonce: '0', type: 'transfer', to: FX.daily.addresses.auctioneer, amount: '4' });
  assert.match(txt(rootEl, '[data-st-card-head]'), /^A transfer of 4 play ATTN from tz1\w+ to tz1\w+, the auctioneer, as your bid on lot 0009\.$/);
  assert.match(txt(rootEl, '[data-st-card-note]'), /back within 3 blocks\. A transfer cannot be taken back\./);
  $(rootEl, '[data-st-sign]').click();
  await until(() => stateOf(rootEl, 'see') === 'done');
  assert.equal(w.sent.length, 1);
  assert.equal(w.sent[0].tx.to, FX.daily.addresses.auctioneer);
  assert.equal(w.sent[0].tx.amount, 4);
  assert.match(txt(rootEl, '[data-st-done-line]'), /^Your bid of 4 play ATTN on lot 0009 is in block 4242\./);
  // a house whose auctioneer is not the edition's creator
  const liar = world();
  liar.overrides['/edition/daily-mint'] = async () => reply({ ...FX.edition, terms: { ...FX.edition.terms, creator: 'tz1WspKrkkKjHhXeWPJEZJusB7dEjFgJ3uME' } });
  const b = await toStep3({ choice: 'bid', w: liar });
  $(b.rootEl, '[data-st-review]').click();
  await until(() => $(b.rootEl, '[data-st-progress]').dataset.state === 'bad');
  assert.match(txt(b.rootEl, '[data-st-errors]'), /edition’s own terms name tz1WspKrkkKjHhXeWPJEZJusB7dEjFgJ3uME\. Nothing was sent/);
  assert.equal($(b.rootEl, '[data-st-card]').hidden, true);
  assert.equal(liar.sent.length, 0);
});

test('bid: a lot about to close is not bid on, at Review or at Sign, and nothing is signed', async () => {
  let clock = Date.now();
  const w = world();
  const m = await toStep3({ choice: 'bid', w, extra: { now: () => clock } });
  $(m.rootEl, '[data-st-review]').click();
  await until(() => !$(m.rootEl, '[data-st-card]').hidden);
  clock += FX.daily.lot.closes_in_ms; // the person reads the card until the lot is closing
  $(m.rootEl, '[data-st-sign]').click();
  await until(() => $(m.rootEl, '[data-st-progress]').dataset.state === 'bad');
  assert.match(txt(m.rootEl, '[data-st-progress-text]'), /^Not signed: you pressed Cancel, or the lot was about to close\. Nothing was signed or sent\.$/);
  assert.equal(w.sent.length, 0);
  // at Review: the same lot, read with under two minutes left
  const w2 = world();
  w2.overrides['/daily'] = async () => reply({ ...FX.daily, lot: { ...FX.daily.lot, closes_in_ms: 90000 } });
  const m2 = await toStep3({ choice: 'bid', w: w2 });
  $(m2.rootEl, '[data-st-review]').click();
  await until(() => $(m2.rootEl, '[data-st-progress]').dataset.state === 'bad');
  assert.match(txt(m2.rootEl, '[data-st-errors]'), /^Lot 0009 closes in under two minutes/);
  assert.equal(w2.sent.length, 0);
});

test('capsule: the card is the seal (commitment, open_at about 7 days on, wax seal), the file exists before the send, is kept where Time Capsules finds it when asked, and a download is offered', async () => {
  const storage = fakeStorage();
  const w = world();
  const m = await toStep3({ choice: 'capsule', skip: true, extra: { storage }, w });
  $(m.rootEl, '[data-st-message]').value = 'Hello, next week.';
  $(m.rootEl, '[data-st-capsule-keep]').checked = true;
  $(m.rootEl, '[data-st-review]').click();
  await until(() => !$(m.rootEl, '[data-st-card]').hidden);
  const fields = Object.fromEntries([...m.rootEl.querySelectorAll('[data-st-card-fields] > div')].map((d) => [d.firstChild.textContent, d.lastChild.textContent]));
  assert.deepEqual(Object.keys(fields), ['sender', 'nonce', 'type', 'channel', 'commitment', 'open_at', 'label']);
  assert.equal(fields.channel, 'GDN');
  assert.equal(fields.label, 'first minute');
  assert.equal(Number(fields.open_at), FX.status.height + FX_DELAY, 'about 7 days at the recording’s own rate over its blocks');
  assert.ok(FX_DELAY > 2016, 'the recording sealed faster than the heartbeat: ' + FX_RATE.toFixed(1) + ' blocks an hour');
  assert.ok(!Object.values(fields).some((v) => v.includes('Hello')), 'the message is not in the transaction');
  assert.match(txt(m.rootEl, '[data-st-card-note]'), /Your message and the salt go in the capsule file you keep/);
  assert.equal(storage.m.get(MY_SLOT), undefined, 'no file before the key signs');
  $(m.rootEl, '[data-st-sign]').click();
  await until(() => stateOf(m.rootEl, 'see') === 'done');
  assert.equal(w.sent.length, 1);
  assert.equal(w.sent[0].tx.type, 'seal_capsule');
  const kept = JSON.parse(storage.m.get(MY_SLOT));
  assert.equal(kept.length, 1);
  const f = C.readCapsuleFile(kept[0]);
  assert.equal(f.body, 'Hello, next week.');
  assert.equal(f.channel, 'GDN');
  assert.equal(K.pcc.capsuleId(w.sent[0].tx.sender, w.sent[0].tx.commitment), f.capsule, 'the kept file opens the capsule that was sealed');
  assert.match(txt(m.rootEl, '[data-st-keep-text]'), /^DOWNLOAD THE CAPSULE FILE NOW\. It holds your message and the salt: anyone with it can read the message early, and without it the capsule never opens\. It is also kept on this device, where Time Capsules finds it\.$/);
  assert.equal(txt(m.rootEl, '[data-st-download]'), 'Download the capsule file');
  assert.equal($(m.rootEl, '[data-st-keep-pre]').hidden, true, 'the message is not printed on the page');
  // the download is a Blob of the file
  const blobs = [];
  m.dom.window.URL.createObjectURL = (b) => { blobs.push(b); return 'blob:x'; };
  m.dom.window.URL.revokeObjectURL = () => {};
  $(m.rootEl, '[data-st-download]').click();
  assert.equal(blobs.length, 1);
  const blobText = await new Promise((res) => { const fr = new m.dom.window.FileReader(); fr.onload = () => res(fr.result); fr.readAsText(blobs[0]); });
  assert.equal(C.readCapsuleFile(JSON.parse(blobText)).capsule, f.capsule);
  assert.match(txt(m.rootEl, '[data-st-keep-text]'), /^Capsule file downloaded\./);
});

test('a capsule file that is neither downloaded nor kept on the device makes leaving the page ask first', async () => {
  const w = world();
  const m = await toStep3({ choice: 'capsule', skip: true, w });
  $(m.rootEl, '[data-st-message]').value = 'Only in this tab.';
  $(m.rootEl, '[data-st-review]').click();
  await until(() => !$(m.rootEl, '[data-st-card]').hidden);
  $(m.rootEl, '[data-st-sign]').click();
  await until(() => stateOf(m.rootEl, 'see') === 'done');
  const ev = new m.dom.window.Event('beforeunload', { cancelable: true });
  m.dom.window.dispatchEvent(ev);
  assert.equal(ev.defaultPrevented, true);
  m.dom.window.URL.createObjectURL = () => 'blob:x';
  m.dom.window.URL.revokeObjectURL = () => {};
  $(m.rootEl, '[data-st-download]').click();
  const ev2 = new m.dom.window.Event('beforeunload', { cancelable: true });
  m.dom.window.dispatchEvent(ev2);
  assert.equal(ev2.defaultPrevented, false, 'downloaded: leaving is fine');
});

test('passkeys in the page: off on any other site with the reason; on pointcast.xyz a passkey account is made, funded, and signs only after Sign', async () => {
  const off = mountView({ extra: { connect: world().connect } });
  await off.c.begin();
  off.c.stop();
  assert.equal($(off.rootEl, '[data-st-pk-make]').disabled, true);
  assert.equal(txt(off.rootEl, '[data-st-pk-why]'), 'Not on this copy of the page (http://localhost), so the passkey button is off. The play key works anywhere.');
  const soft = softPasskey();
  const storage = fakeStorage();
  const w = world();
  const m = mountView({ fetchOpts: { accounts: w.accounts, overrides: w.overrides }, extra: { connect: w.connect, origin: 'https://pointcast.xyz', credentials: soft, storage } });
  await m.c.begin();
  m.c.stop();
  assert.equal($(m.rootEl, '[data-st-pk-make]').disabled, false);
  assert.equal(txt(m.rootEl, '[data-st-pk-why]'), 'Passkeys work here: the chain names https://pointcast.xyz. Making one asks your device; nothing is signed or sent to the devnet.');
  $(m.rootEl, '[data-st-pk-make]').click();
  await until(() => m.c.state.mode === 'passkey');
  await tick(30);
  const addr = m.c.activeKey().sender;
  assert.match(addr, /^pcp1/);
  assert.equal(JSON.parse(storage.m.get(S0.PASSKEY_SLOT)).address, addr);
  assert.equal(storage.m.get(KEY_SLOT), undefined, 'no play key was stored');
  assert.match(txt(m.rootEl, '[data-st-who]'), new RegExp('^Signing as ' + addr + ' · a passkey account\\.$'));
  assert.equal(stateOf(m.rootEl, 'attn'), 'now');
  $(m.rootEl, '[data-st-faucet]').click();
  await until(() => stateOf(m.rootEl, 'act') === 'now');
  const r = $(m.rootEl, '[data-st-choice][value="stamp"]');
  r.checked = true;
  r.dispatchEvent(new m.dom.window.Event('change'));
  $(m.rootEl, '[data-st-sentence]').value = 'Signed with a passkey.';
  $(m.rootEl, '[data-st-review]').click();
  await until(() => !$(m.rootEl, '[data-st-card]').hidden);
  assert.equal(soft.log.filter((l) => l.op === 'get').length, 0, 'the passkey is not asked while the card is up');
  assert.match(txt(m.rootEl, '[data-st-card-where]'), /^Signed by your passkey \(your device asks next\)/);
  $(m.rootEl, '[data-st-sign]').click();
  await until(() => stateOf(m.rootEl, 'see') === 'done');
  assert.equal(soft.log.filter((l) => l.op === 'get').length, 1);
  assert.equal(w.sent[0].sig_mode, 'webauthn');
  assert.equal(w.sent[0].tx.sender, addr);
  assert.match(txt(m.rootEl, '[data-st-next]'), /Verify a block does not check a passkey’s P-256 signature \(it says so\); the devnet checked it when it took the transaction\./);
  // a returning visitor: the passkey account is remembered, and offered
  const again = mountView({ fetchOpts: { accounts: w.accounts, overrides: w.overrides }, extra: { connect: w.connect, origin: 'https://pointcast.xyz', credentials: soft, storage } });
  await again.c.begin();
  again.c.stop();
  assert.match(txt(again.rootEl, '[data-st-pk-why]'), new RegExp('^This browser remembers a passkey account, ' + addr));
  assert.equal($(again.rootEl, '[data-st-pk-use]').hidden, false);
  $(again.rootEl, '[data-st-pk-use]').click();
  await until(() => again.c.state.mode === 'passkey' && again.c.state.balance === 100);
  assert.equal(stateOf(again.rootEl, 'attn'), 'done', 'its play ATTN is already there');
});

test('GENESIS CHANGED stops the page: nothing is read on, nothing can be sent', async () => {
  const w = world();
  const overrides = { ...w.overrides, '/status': async () => reply({ ...FX.status, genesis_hash: HEX('9') }) };
  const { rootEl, c } = mountView({ fetchOpts: { overrides }, extra: { connect: w.connect } });
  await c.begin();
  c.stop();
  assert.equal(rootEl.dataset.state, 'changed');
  assert.equal($(rootEl, '[data-st-genesis]').hidden, false);
  assert.match(txt(rootEl, '[data-st-genesis]'), /^GENESIS CHANGED\. The devnet reports genesis 9{64}, this page pins /);
  $(rootEl, '[data-kp-make]').click();
  await until(() => c.keys.key());
  await tick(30);
  assert.equal($(rootEl, '[data-st-faucet]').disabled, true);
  assert.equal($(rootEl, '[data-st-skip]').disabled, true);
  assert.ok([...rootEl.querySelectorAll('[data-st-choice]')].every((r) => r.disabled));
});

test('?devnet= is honoured only for localhost and 127.0.0.1, and then the links read that same devnet', async () => {
  const w = world();
  const local = mountView({ search: '?devnet=http://127.0.0.1:8812', fetchOpts: { accounts: w.accounts, overrides: w.overrides }, extra: { connect: w.connect } });
  assert.equal(local.c.where.api, 'http://127.0.0.1:8812');
  assert.equal(local.c.where.override, true);
  for (const bad of ['?devnet=https://evil.example', '?devnet=http://127.0.0.1.evil.example:8812', '?devnet=javascript:alert(1)', '?devnet=http://user:pw@localhost:1']) {
    const m = mountView({ search: bad });
    assert.equal(m.c.where.api, DEVNET.url, bad);
    assert.equal(m.c.where.ignored, true, bad);
  }
});

test('the view does nothing at import, and the page starts it only after load and idle', () => {
  assert.doesNotMatch(code(src.view).split('export function mount')[0], /fetch\(|document\.|window\./, 'nothing runs at import');
  const page = src.page;
  assert.match(page, /import\('\/chain\/apps\/start-view\.js'\)\.then\(\(m\) => m\.start\(root\)\)/);
  assert.match(page, /requestIdleCallback/);
  assert.match(page, /window\.addEventListener\('load', go, \{ once: true \}\)/);
});

// ================================================================ rules: sinks, words, the page

test('nothing from the devnet becomes markup, a link or a style: the only href writes are setLink’s same-site paths and the download’s blob', () => {
  assertNoSinks(src.logic, 'start.js');
  assertNoSinks(src.view, 'start-view.js', { allow: [/node\.href = path;/, /a\.href = win\.URL\.createObjectURL\(blob\);/] });
  assert.equal((code(src.view).match(/\.href = /g) || []).length, 2, 'two href writes, both allowed above');
  assert.match(src.view, /if \(!node \|\| typeof path !== 'string' \|\| !path\.startsWith\('\/chain\/'\)\) return;\n\s*node\.href = path;/);
  assertNoSinks(src.kit, 'chain-kit.js');
  // the view reaches the devnet only through the kit's reader and the modules
  assert.doesNotMatch(code(src.view), /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|document\.cookie|sessionStorage|indexedDB/);
  assert.doesNotMatch(code(src.logic), /XMLHttpRequest|sendBeacon|WebSocket|document\.|window\./);
  // the three choices are the apps' own modules
  for (const call of ['D.sendBid(', 'N.stampHash(', 'C.sealCapsule(', 'D.readEditionCreator(', 'mountKeyPanel(']) assert.ok(src.view.includes(call), call);
  for (const call of ['D.claimFaucet(', 'D.planBid(', 'N.hashText(', 'N.stampBody(', 'C.planSeal(', 'pcc.signWithPasskey(', 'pcc.describeTx(', 'pcc.p256PublicKey(']) assert.ok(src.logic.includes(call), call);
  assert.doesNotMatch(code(src.logic) + code(src.view), /buildTx\('(transfer|seal_capsule|publish_block)'/, 'no transaction is built here: the modules build them');
});

test('the words: honest about value, resets, claims and passkeys, with none of the fundraising words and no prices', () => {
  for (const f of MY_FILES) {
    const t = read(f);
    assert.deepEqual(bannedHits(t), [], f);
    assert.deepEqual(currencyHits(t), [], f);
  }
  assert.equal(HONESTY_LINE, HONESTY);
  assert.equal(HONESTY_LINE, 'devnet · no value · may reset');
  const page = src.page.replace(/\s+/g, ' ');
  assert.match(page, /<b>\{HONESTY_LINE\}\.<\/b>/);
  assert.match(page, /Play ATTN has no value and is never promised any/);
  assert.match(page, /a claim by a free key, not proof of who you are/);
  assert.match(page, /a reset is dated and recorded, never silent/);
  assert.match(page, /PUBLIC DEVNET-2 · NO VALUE · MAY RESET, NEVER SILENTLY/);
  assert.match(NOT_LIST.join(' '), /Not money\. Play ATTN has no value, is never promised any, and cannot be bought, sold or taken off the devnet\./);
  assert.match(NOT_LIST.join(' '), /One server runs this devnet and seals every block; it can refuse what it is sent\./);
  assert.match(STEP_COPY.find((s) => s.key === 'act').text, /the page shows you the exact transaction: every field, and the digest your key signs\. Nothing is signed, and no transaction is sent, until you press Sign\. Reviewing a stamp first stores its three Notary lines/);
  assert.match(CHOICE_COPY.find((c) => c.key === 'stamp').line, /Only its fingerprint \(its SHA-256\) and its length go on chain/);
  assert.match(CHOICE_COPY.find((c) => c.key === 'capsule').line, /without it the capsule never opens/);
  assert.match(CHOICE_COPY.find((c) => c.key === 'bid').line, /1 play ATTN while nobody has bid/);
  assert.deepEqual(CHOICE_COPY.map((c) => c.key), [...S0.CHOICES]);
  assert.deepEqual(STEP_COPY.map((s) => s.key), [...S0.STEPS]);
  for (const c of CHOICE_COPY) assert.ok(existsSync(new URL('src/pages' + c.app + '.astro', root)), c.app);
});

test('the page: pins from chain-home, the four steps in order, every hook the view uses, labels and live regions, one retro nod, and a phone-width layout', () => {
  const page = src.page;
  assert.match(page, /<ChainHeader current="start" trail=\{\[\{ label: 'start here' \}\]\} block=\{APP\.block\} quick=\{quick\} \/>/);
  assert.match(page, /data-api=\{D\}/);
  assert.match(page, /data-genesis=\{DEVNET\.genesis\}/);
  assert.match(page, /data-yard=\{DEVNET\.yardHref\}/);
  assert.doesNotMatch(page, /pointcast-devnet\.mhoydich\.workers\.dev|a720735b4733/, 'no pin typed in the page');
  assert.match(page, /assertDevnetLaunchPinned\(\);/);
  // every hook the view queries is in the page
  const hooks = new Set([...src.view.matchAll(/\[(data-(?:st|kp)-[a-z-]+)/g)].map((m) => m[1]));
  for (const h of hooks) assert.ok(page.includes(h), h + ' is in the page');
  for (const k of S0.STEPS) assert.ok(page.includes('data-st-step="' + k + '"'), k);
  assert.ok(page.indexOf('data-st-step="key"') < page.indexOf('data-st-step="attn"') && page.indexOf('data-st-step="attn"') < page.indexOf('data-st-step="act"') && page.indexOf('data-st-step="act"') < page.indexOf('data-st-step="see"'));
  // the key panel's own hooks, for mountKeyPanel
  for (const h of ['data-key-panel', 'data-kp-make', 'data-kp-keep', 'data-kp-reveal', 'data-kp-copy', 'data-kp-forget', 'data-kp-seed', 'data-kp-own', 'data-kp-use', 'data-kp-status', 'data-kp-address', 'data-kp-keepold']) assert.ok(page.includes(h), h);
  assert.match((page.match(/<input[^>]*data-kp-own[^>]*>/) || [''])[0], /type="password"/);
  // live regions are polite; every input has a label
  for (const h of ['data-st-status', 'data-kp-status', 'data-st-faucet-out', 'data-st-progress', 'data-st-pk-why']) assert.match(page, new RegExp(h + '[^>]*aria-live="polite"'), h);
  for (const id of ['st-own', 'st-sentence', 'st-message', 'st-ctitle', 'st-clabel']) { assert.ok(page.includes('for="' + id + '"'), id + ' label'); assert.ok(page.includes('id="' + id + '"'), id); }
  assert.match(page, /<fieldset class="st-choices">\s*<legend/);
  assert.match(page, /type="radio" name="st-choice"/);
  // the one retro nod, said once, and decoration only
  assert.equal((page.match(/The one retro nod/g) || []).length, 1);
  assert.match(page, /<div class="st-bar" data-st-bar aria-hidden="true">/);
  // 375px: buttons go full width under 560px, nothing fixed wider than a phone, long hashes wrap
  assert.match(page, /@media \(max-width:560px\)\{\s*\.chn \.st-go\{width:100%/);
  for (const m of page.matchAll(/(?:^|[;{])\s*(?:min-)?width:(\d+)px/g)) assert.ok(Number(m[1]) <= 343, 'a fixed width of ' + m[1] + 'px');
  assert.match(page, /\.st-fields dd\{[^}]*word-break:break-all/);
  // the JSON-LD and the block
  assert.match(page, /'@type': 'WebApplication'/);
  assert.equal(APP.block, START_BLOCK);
  assert.equal(APP.path, '/chain/start');
});

test('the Apps registry entry: well formed, honest, first in the list once the orchestrator adds it, and equal to the registry’s', () => {
  assert.deepEqual(Object.keys(REGISTRY_ENTRY), ['key', 'href', 'label', 'short', 'mode', 'blurb']);
  assert.equal(REGISTRY_ENTRY.key, 'start');
  assert.equal(REGISTRY_ENTRY.href, '/chain/' + REGISTRY_ENTRY.key);
  assert.equal(REGISTRY_ENTRY.href, APP.path);
  assert.equal(REGISTRY_ENTRY.mode, 'write');
  assert.ok(REGISTRY_ENTRY.blurb.length > 60 && REGISTRY_ENTRY.blurb.length < 260, 'blurb length ' + REGISTRY_ENTRY.blurb.length);
  assert.ok(REGISTRY_ENTRY.label.length > 3 && REGISTRY_ENTRY.short.length > 3);
  assert.match(REGISTRY_ENTRY.blurb, /No value; may reset\.$/);
  assert.match(REGISTRY_ENTRY.blurb, /You read every field before you sign\./);
  assert.deepEqual(bannedHits(REGISTRY_ENTRY.blurb), []);
  assert.match(src.page, /<ChainHeader current="start"/, 'the page lights the registry key');
  assert.match(START_BLOCK, /^\d{4}$/);
  assert.doesNotMatch(src.data, /TODO\(integrator\)|does not exist yet; the integrator sets it/);
  if (START_BLOCK === APPS_2_BLOCK) assert.ok(existsSync(new URL('src/content/blocks/' + START_BLOCK + '.json', root)));
  const inRegistry = appByKey('start');
  if (!inRegistry) return; // not added yet: the orchestrator adds REGISTRY_ENTRY as the first entry of CHAIN_APPS
  assert.equal(CHAIN_APPS[0].key, 'start', 'Start here is the first app');
  assert.deepEqual({ ...inRegistry }, { ...REGISTRY_ENTRY });
});
