// Time Capsules: /chain/capsules (src/pages/chain/capsules.astro), the logic
// public/chain/apps/capsules.js (no DOM), the DOM side capsules-view.js and the
// shared key panel.
//
// What this suite holds:
//   - a capsule is a commit and reveal, and this page's commitment is the
//     chain's own: the commitments of the capsules recorded on a local devnet-2
//     (two sealed and opened, one still sealed) are recomputed from the opens'
//     own salt, title and message and match, and a capsule file edited by one
//     character no longer matches its capsule id and is refused;
//   - nothing but the commitment, the channel, the block and the label goes into
//     a seal; the message and the salt stay in the capsule file;
//   - an open is refused, with nothing sent and the salt unspoken, unless the
//     devnet lists the capsule and its next block may open it; when it goes, the
//     message is stored by its hash and the open is signed by the opener's own key;
//   - the wall joins each opened capsule to its seal by capsuleId(author,
//     commitment), shows messages only when they hash to what was sealed, and
//     shows every devnet text as plain text;
//   - waiting is said in blocks, with the rate the devnet is keeping and both
//     extremes, never a promise of a clock time;
//   - the page pins the genesis, stops at GENESIS CHANGED, is lazy, honours
//     ?devnet= only for localhost and 127.0.0.1, writes only on button presses after
//     a confirm box, and says a reset erases every capsule.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { DEVNET, DEVNET_PREVIOUS, RESET } from '../src/data/chain-home.ts';
import { APP, HONESTY_LINE, HOW_STEPS, KEEP_COPY, NOT_LIST, WAIT_COPY, codeSnippet } from '../src/data/chain-app-capsules.ts';
import { CHAIN_APPS } from '../src/data/chain-apps.ts';
import * as C from '../public/chain/apps/capsules.js';
import * as view from '../public/chain/apps/capsules-view.js';
import * as K from '../public/chain/apps/chain-kit.js';
import { FX, fakeDevnet } from './helpers/fake-devnet.mjs';
import { assertNoSinks, bannedHits, BANNED, callArgs, code, currencyHits } from './helpers/chain-app-rules.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const FILES = {
  logic: 'public/chain/apps/capsules.js',
  view: 'public/chain/apps/capsules-view.js',
  keys: 'public/chain/apps/key-panel.js',
  page: 'src/pages/chain/capsules.astro',
  data: 'src/data/chain-app-capsules.ts',
};
const src = Object.fromEntries(Object.entries(FILES).map(([k, p]) => [k, read(p)]));
const MY_FILES = [...Object.values(FILES), 'tests/chain-app-capsules.test.mjs', 'scripts/e2e-chain-app-capsules.mjs'].filter((p) => existsSync(new URL(p, root)));
const HEX = (c) => c.repeat(64);
const GENESIS = FX.status.genesis_hash;
const CHAIN_ID = FX.status.chain_id;
const DOMAIN = K.pcc.domainOf(CHAIN_ID, GENESIS);
const clone = (o) => JSON.parse(JSON.stringify(o));
const netFor = (opts) => K.makeNet('http://127.0.0.1:8799', { fetch: fakeDevnet(opts) });
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

/** The recorded capsules, found by walking the blocks (sharing no code with the app). */
const SEALS = [];
const OPENS = [];
for (const b of FX.blocks) for (const t of b.txs) {
  if (t.tx.type === 'seal_capsule') SEALS.push({ height: b.header.height, tx: t.tx, hash: K.pcc.txHash(t), id: K.pcc.capsuleId(t.tx.sender, t.tx.commitment) });
  if (t.tx.type === 'open_capsule') OPENS.push({ height: b.header.height, tx: t.tx, hash: K.pcc.txHash(t) });
}
const OPENED = OPENS.map((o) => ({ ...o, seal: SEALS.find((s) => s.id === o.tx.capsule), body: FX.bodies[o.tx.body_hash] }));
const SEALED_ONLY = SEALS.filter((s) => !OPENS.some((o) => o.tx.capsule === s.id));
/** A capsule file rebuilt from a recorded open: the open carries the salt, the title and (by hash) the message. */
const fileOf = (o) => C.makeCapsuleFile({ chainId: CHAIN_ID, genesis: GENESIS, api: 'http://127.0.0.1:8799', capsule: o.tx.capsule, author: o.seal.tx.sender, channel: o.seal.tx.channel, title: o.tx.title, body: o.body, salt: o.tx.salt, label: o.seal.tx.label, openAt: o.seal.tx.open_at, sealedAt: o.seal.height, sealTx: o.seal.hash });

// ================================================================ the commitment is the chain's own

test('the recording holds two opened capsules and one still sealed, and each opened one’s commitment recomputes from its own salt, title and message', () => {
  assert.ok(OPENED.length >= 2, 'opened: ' + OPENED.length);
  assert.ok(SEALED_ONLY.length >= 1, 'sealed only: ' + SEALED_ONLY.length);
  for (const o of OPENED) {
    assert.ok(o.seal && o.body, 'the open names a seal and a stored message');
    const c = K.pcc.capsuleCommitment(DOMAIN, { author: o.seal.tx.sender, channel: o.seal.tx.channel, salt: o.tx.salt, title: o.tx.title, body_hash: K.pcc.bodyHash(o.body), media_uri: null });
    assert.equal(c.commitment, o.seal.tx.commitment, 'the SDK reproduces what the chain holds');
    assert.equal(c.capsule, o.tx.capsule);
    assert.ok(o.height > o.seal.height, 'opened after it was sealed');
    assert.ok(o.height >= o.seal.tx.open_at, 'and not before its block');
  }
});

test('commit() draws a fresh salt every time and the commitment moves with every field it binds', () => {
  const base = { author: 'tz1WspKrkkKjHhXeWPJEZJusB7dEjFgJ3uME', channel: 'BOT', title: 'A title', body: 'A message' };
  const a = C.commit(DOMAIN, base);
  const b = C.commit(DOMAIN, base);
  assert.notEqual(a.salt, b.salt, 'a fresh salt each time');
  assert.notEqual(a.commitment, b.commitment);
  assert.match(a.salt, /^(?:[0-9a-f]{2}){16,64}$/);
  assert.equal(a.bodyHash, K.pcc.bodyHash('A message'));
  assert.equal(a.capsule, K.pcc.capsuleId(base.author, a.commitment));
  // with the salt held fixed, every bound field changes the commitment
  const fixed = (o) => K.pcc.capsuleCommitment(DOMAIN, { ...{ author: base.author, channel: base.channel, title: base.title, body_hash: K.pcc.bodyHash(base.body), media_uri: null }, salt: a.salt, ...o }).commitment;
  const want = fixed({});
  assert.equal(want, a.commitment);
  assert.notEqual(fixed({ title: 'A title.' }), want);
  assert.notEqual(fixed({ body_hash: K.pcc.bodyHash('A message.') }), want);
  assert.notEqual(fixed({ channel: 'GDN' }), want);
  assert.notEqual(fixed({ author: 'tz1bLEsiTQ2vQx8znZnuahFfKEf98xicMX35' }), want);
  assert.notEqual(K.pcc.capsuleCommitment(K.pcc.domainOf(CHAIN_ID, HEX('9')), { author: base.author, channel: 'BOT', title: base.title, body_hash: a.bodyHash, media_uri: null, salt: a.salt }).commitment, want, 'a capsule sealed for one chain is not valid on another');
});

// ================================================================ planning a seal

const TIP = 100;
const plan = (o = {}) => C.planSeal({ channel: 'BOT', title: 'Hello', body: 'World', label: 'wax', delay: 20, tip: TIP, sender: 'tz1x', ...o });

test('a good seal plans clean: the block it opens at is the tip plus the wait', () => {
  const p = plan({ delay: '25' });
  assert.equal(p.ok, true, p.errors.join(' '));
  assert.deepEqual(p.fields, { channel: 'BOT', title: 'Hello', body: 'World', label: 'wax', openAt: 125, delay: 25 });
  assert.equal(plan({ channel: 'GDN', delay: 3 }).fields.openAt, 103);
  assert.equal(plan({ delay: 1000000 }).ok, true);
  // whitespace is folded in a title and a label, line breaks are kept in a message
  const t = plan({ title: '  a   b  ', label: ' x  y ', body: 'line one\r\nline two  \n' });
  assert.equal(t.fields.title, 'a b');
  assert.equal(t.fields.label, 'x y');
  assert.equal(t.fields.body, 'line one\nline two');
});

test('every refusal says why, before anything is signed', () => {
  const errs = (o) => plan(o).errors.join(' | ');
  assert.match(errs({ channel: 'FD' }), /channel is BOT or GDN/);
  assert.match(errs({ channel: '' }), /channel is BOT or GDN/);
  assert.match(errs({ title: '' }), /title cannot be empty/);
  assert.match(errs({ title: 'x'.repeat(121) }), /title: at most 120/);
  assert.match(errs({ title: 'a\u0007b' }), /title: no control, direction or invisible/);
  assert.match(errs({ title: 'a‮b' }), /title: no control, direction or invisible/);
  assert.match(errs({ title: 'a​b' }), /title: no control, direction or invisible/);
  assert.match(errs({ label: '' }), /label cannot be empty/);
  assert.match(errs({ label: 'x'.repeat(65) }), /label: at most 64/);
  assert.match(errs({ body: '' }), /message cannot be empty/);
  assert.match(errs({ body: '   \n ' }), /message cannot be empty/);
  assert.match(errs({ body: 'x'.repeat(4001) }), /at most 4000 bytes/);
  assert.match(errs({ body: 'é'.repeat(2001) }), /at most 4000 bytes/, 'bytes, not characters');
  assert.match(errs({ body: 'a\u0000b' }), /message: no control or direction/);
  assert.match(errs({ body: 'a‮b' }), /message: no control or direction/);
  for (const d of [2, 0, -5, 1000001, 2.5, 'abc', '', '1e3', '12 3', NaN, undefined]) assert.match(errs({ delay: d }), /Wait 3 to 1,000,000 blocks/, String(d));
  assert.match(errs({ tip: null }), /newest block is not known/);
  assert.match(errs({ sender: '' }), /Make a key first/);
  assert.equal(plan({ body: 'tabs\tare fine\nand lines' }).ok, true);
  assert.equal(plan({ body: 'é'.repeat(2000) }).ok, true, '4000 bytes exactly');
  // several errors are all said
  assert.ok(plan({ title: '', label: '', body: '', delay: 1 }).errors.length >= 4);
  assert.deepEqual(plan({ channel: 'FD' }).fields.openAt, 120, 'a refused plan still says what it would have been');
});

// ================================================================ the capsule file

test('a capsule file rebuilt from each recorded open is accepted: its contents hash to the id the chain holds', () => {
  for (const o of OPENED) {
    const f = fileOf(o);
    const m = C.readCapsuleFile(JSON.stringify(f));
    assert.equal(m.capsule, o.tx.capsule);
    assert.equal(m.author, o.seal.tx.sender);
    assert.equal(m.channel, o.seal.tx.channel);
    assert.equal(m.title, o.tx.title);
    assert.equal(m.body, o.body);
    assert.equal(m.salt, o.tx.salt);
    assert.equal(m.openAt, o.seal.tx.open_at);
    assert.equal(m.sealedAt, o.seal.height);
    assert.deepEqual(C.readCapsuleFile(f), m, 'an object reads the same as its text');
  }
});

test('a capsule file changed by one character is refused: it no longer hashes to its own capsule id', () => {
  const o = OPENED[0];
  const f = fileOf(o);
  const touch = (k, v) => ({ ...f, [k]: v });
  const bad = [
    touch('title', f.title + '!'), touch('body', f.body + '.'), touch('body', f.body.replace(/./, 'X')),
    touch('salt', (f.salt[0] === 'a' ? 'b' : 'a') + f.salt.slice(1)), touch('author', 'tz1bLEsiTQ2vQx8znZnuahFfKEf98xicMX35'), touch('channel', f.channel === 'BOT' ? 'GDN' : 'BOT'),
    touch('capsule', HEX('3')), { ...f, devnet: { ...f.devnet, genesis: HEX('9') } }, { ...f, devnet: { ...f.devnet, chain_id: 'pointcast-devnet-9' } },
  ];
  for (const b of bad) assert.throws(() => C.readCapsuleFile(b), /not a capsule file/, JSON.stringify(b).slice(0, 60));
  assert.throws(() => C.readCapsuleFile(touch('body', f.body + '.')), /does not hash to the capsule id it names, so it was changed after sealing/);
  for (const nonFile of ['', 'nope', '[]', '{}', JSON.stringify({ ...f, format: 'x' }), JSON.stringify({ ...f, devnet: null }), JSON.stringify({ ...f, capsule: 'z' }), JSON.stringify({ ...f, author: 'nope' }), JSON.stringify({ ...f, salt: 'ab' }),
    JSON.stringify({ ...f, open_at: 0 }), JSON.stringify({ ...f, open_at: 1.5 }), JSON.stringify({ ...f, title: '' }), JSON.stringify({ ...f, body: '' }), JSON.stringify({ ...f, title: ' padded ' }), 'x'.repeat(50000), null, 5]) {
    assert.throws(() => C.readCapsuleFile(nonFile), /not a capsule file|not JSON|too large/, String(nonFile).slice(0, 40));
  }
  // the label and open_at are not in the commitment, so they are advisory: the devnet's own listing is what the page trusts (matchFile compares them)
  assert.equal(C.readCapsuleFile(touch('open_at', f.open_at + 7)).openAt, f.open_at + 7);
  assert.equal(C.readCapsuleFile(touch('label', f.label + 'x')).label, f.label + 'x');
});

test('a file the page makes after sealing reads back as what was sealed, and holds the warning in words', () => {
  const f = C.makeCapsuleFile({ chainId: CHAIN_ID, genesis: GENESIS, api: 'x', capsule: HEX('1'), author: 'tz1WspKrkkKjHhXeWPJEZJusB7dEjFgJ3uME', channel: 'BOT', title: 't', body: 'b', salt: 'ab'.repeat(32), label: 'l', openAt: 9, sealedAt: 3, sealTx: HEX('2') });
  assert.equal(f.format, 'pointcast-capsule/v1');
  assert.match(f.secret, /holds the message and the salt\. Anyone who has it can read the capsule before it opens/);
  assert.match(f.secret, /Lose it and the capsule never opens\./);
  assert.deepEqual(Object.keys(f).sort(), ['author', 'body', 'capsule', 'channel', 'devnet', 'format', 'label', 'open_at', 'salt', 'sealed_at', 'seal_tx', 'secret', 'title'].sort());
});

// ================================================================ reading capsules

test('readCapsules takes the recorded list: the one capsule still sealed, far away, and nothing the devnet does not send', () => {
  const l = C.readCapsules(FX.capsules);
  assert.equal(l.enabled, true);
  assert.equal(l.height, FX.tip);
  assert.equal(l.rows.length, SEALED_ONLY.length);
  const far = l.rows[0];
  assert.equal(far.id, SEALED_ONLY[0].id);
  assert.equal(far.author, SEALED_ONLY[0].tx.sender);
  assert.equal(far.channel, 'GDN');
  assert.equal(far.label, 'far capsule');
  assert.equal(far.openAt, SEALED_ONLY[0].tx.open_at);
  assert.equal(far.sealedAt, SEALED_ONLY[0].height);
  assert.equal(far.due, false);
  assert.equal(C.stateOf(far, l.height), 'waiting');
  assert.ok(!JSON.stringify(l).includes(SEALED_ONLY[0].tx.commitment), 'the list never carries a commitment');
  // states
  const row = { openAt: 10, lapsesAt: 20 };
  assert.equal(C.stateOf(row, 7), 'waiting');
  assert.equal(C.stateOf(row, 8), 'waiting');
  assert.equal(C.stateOf(row, 9), 'due', 'the next block (10) may open it');
  assert.equal(C.stateOf(row, 18), 'due');
  assert.equal(C.stateOf(row, 19), 'lapsed', 'the next block (20) is past it');
  assert.equal(C.stateOf(null, 5), 'gone');
  assert.equal(C.stateOf({ openAt: 10, lapsesAt: null }, 500), 'due');
  for (const junk of [null, 3, 'x', {}, { capsules: 'x' }, { capsules: [null, 3, {}, { id: 'z' }] }]) assert.doesNotThrow(() => C.readCapsules(junk));
  assert.equal(C.readCapsules(null), null);
  assert.deepEqual(C.readCapsules({ capsules: [null, 3, {}, { id: 'z' }] }).rows, []);
  const evil = '<img src=x onerror=alert(1)>' + 'z'.repeat(200);
  const r = C.readCapsuleRow({ ...FX.capsules.capsules[0], label: evil, channel: evil });
  assert.ok(r.label.length <= 64 && r.channel.length <= 16);
  assert.equal(C.readCapsuleRow({ ...FX.capsules.capsules[0], author: evil }), null, 'an author that is not an address is no capsule');
});

test('the wait is said in blocks, at the current rate and at both extremes, and never as a promise', () => {
  assert.equal(C.etaWords(0, 12), 'now');
  assert.equal(C.etaWords(-3, 12), 'now');
  assert.equal(C.etaWords(NaN, 12), 'now');
  assert.equal(C.etaWords(20, 12), 'about 1.7 hours at the current rate, as soon as 60 seconds if the devnet is busy and as late as 1.7 hours if it goes quiet');
  assert.equal(C.etaWords(100, 1200), 'about 5 minutes at the current rate, as soon as 5 minutes if the devnet is busy and as late as 8.3 hours if it goes quiet');
  assert.match(C.etaWords(3, 12), /^about 15 minutes at the current rate, as soon as 9 seconds if the devnet is busy and as late as 15 minutes if it goes quiet$/);
  assert.match(C.etaWords(5000, 12), /about \d+ days at the current rate/);
  assert.match(C.etaWords(10, 0), /at the current rate/, 'a zero rate falls back to the heartbeat');
  assert.match(WAIT_COPY, /5 minutes to 8 hours|five minutes to eight hours/);
  assert.match(WAIT_COPY, /blocks, not minutes/);
});

test('readRate takes the rate from block timestamps and falls back to the heartbeat when it cannot', async () => {
  const net = netFor();
  const r = await C.readRate(net, FX.tip, 50);
  const ts = FX.blocks.slice(-50).map((b) => b.header.timestamp).filter((t) => t > 0);
  assert.ok(Math.abs(r - K.blocksPerHour(ts)) < 1e-9);
  assert.ok(r > 0);
  assert.equal(await C.readRate(netFor(), 2, 50), 12);
  assert.equal(await C.readRate(netFor(), 'x', 50), 12);
  assert.equal(await C.readRate(netFor({ overrides: { '/raw/blocks': async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => '{"blocks":[]}' }) } }), 80, 50), 12);
  assert.equal(K.blocksPerHour([1000, 1000]), 12);
  assert.equal(K.blocksPerHour([0, 3600000]), 12, 'a block with no time is not counted');
  assert.equal(Math.round(K.blocksPerHour([1000, 301000, 601000])), 12);
  assert.equal(Math.round(K.blocksPerHour([1000, 4000, 7000])), 1200);
  assert.equal(K.msUntilHeight(110, 100, 12), 3000000);
  assert.equal(K.msUntilHeight(90, 100, 12), 0);
});

// ================================================================ the wall of opened capsules

test('the wall joins each opened capsule to its seal by capsuleId(author, commitment), and shows the message only when it hashes to what was sealed', async () => {
  const w = await C.readWall(netFor());
  assert.equal(w.complete, true);
  assert.ok(w.scannedBlocks > 40);
  assert.equal(w.items.length, OPENED.length);
  for (const o of OPENED) {
    const it = w.items.find((x) => x.capsule === o.tx.capsule);
    assert.ok(it, 'every opened capsule is on the wall');
    assert.equal(it.title, o.tx.title);
    assert.equal(it.height, o.height);
    assert.equal(it.opener, o.tx.sender);
    assert.equal(it.bodyVerified, true);
    assert.equal(it.body, o.body);
    assert.ok(it.seal, 'joined to its seal');
    assert.equal(it.seal.author, o.seal.tx.sender);
    assert.equal(it.seal.height, o.seal.height);
    assert.equal(it.seal.label, o.seal.tx.label);
    assert.equal(it.seal.openAt, o.seal.tx.open_at);
    assert.equal(it.tx, o.hash);
  }
  assert.deepEqual(w.items.map((x) => x.height), [...w.items.map((x) => x.height)].sort((a, b) => b - a), 'newest first');
  // a message the devnet serves wrongly is not shown as the capsule's
  const bodies = { ...FX.bodies, [OPENED[0].tx.body_hash]: OPENED[0].body + ' (edited)' };
  const bad = await C.readWall(netFor({ bodies }));
  const it = bad.items.find((x) => x.capsule === OPENED[0].tx.capsule);
  assert.equal(it.bodyVerified, false);
  assert.equal(it.body, '');
  const gone = { ...FX.bodies };
  delete gone[OPENED[0].tx.body_hash];
  assert.equal((await C.readWall(netFor({ bodies: gone }))).items.find((x) => x.capsule === OPENED[0].tx.capsule).bodyVerified, false);
  // a seal older than the scan leaves the open without a seal, not wrong
  const cut = await C.readWall(netFor({ blocks: FX.blocks.filter((b) => b.header.height > OPENED[0].seal.height) }));
  assert.ok(cut.items.some((x) => x.capsule === OPENED[0].tx.capsule && x.seal === null));
});

test('the wall pages with before, stops at the page limit honestly, and shows at most twelve messages', async () => {
  const log = [];
  const w = await C.readWall(netFor({ log }), { limit: 5 });
  assert.ok(log.some((l) => /^GET \/feed\?limit=5&before=\d+$/.test(l)));
  assert.equal(w.items.length, OPENED.length);
  const cut = await C.readWall(netFor(), { limit: 5, maxPages: 1 });
  assert.equal(cut.complete, false);
  assert.ok(cut.scannedBlocks <= 5);
  await assert.rejects(() => C.readWall(netFor({ overrides: { '/feed': async () => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => '"x"' }) } })), /not the shape this page reads/);
});

// ================================================================ sealing and opening (a stand-in client captures what would be sent)

async function fakeClient({ list = FX.capsules, seed = '81'.repeat(32) } = {}) {
  const key = await K.keyFromSeed(seed);
  const sent = [];
  const posts = [];
  const chain = {
    domain: DOMAIN,
    chainId: CHAIN_ID,
    genesisHash: GENESIS,
    async submit(signed) { sent.push(signed); return { txHash: K.pcc.txHash(signed), status: 'pending' }; },
    async waitForTx() { return { height: 5000 + sent.length, index: 0, status: 'included' }; },
  };
  const net = {
    api: 'http://127.0.0.1:8799',
    count: 0,
    async get(p) { if (p.split('?')[0] === '/capsules') return list; if (p.startsWith('/account/')) return { next_nonce: 6, balance: 0, exists: true }; return null; },
    async post(p, body) {
      posts.push([p, body]);
      if (p === '/body') return { body_hash: K.pcc.bodyHash(body.body) };
      if (p === '/tx') return { tx_hash: K.pcc.txHash(body), status: 'pending' };
      return null;
    },
  };
  return { key, chain, net, sent, posts };
}

test('sealCapsule sends one seal_capsule with only the commitment, channel, block and label; the message and the salt stay in the file', async () => {
  const { key, chain, net, sent, posts } = await fakeClient();
  const p = plan({ title: 'Secret title', body: 'A secret message nobody should see yet.', label: 'my wax', delay: 30, tip: 200, sender: key.sender });
  const r = await C.sealCapsule({ chain, net, key, plan: p });
  assert.equal(sent.length, 1);
  assert.equal(posts.length, 0, 'nothing is stored on the devnet at seal time');
  const tx = sent[0].tx;
  assert.equal(tx.type, 'seal_capsule');
  assert.equal(tx.channel, 'BOT');
  assert.equal(tx.open_at, 230);
  assert.equal(tx.label, 'my wax');
  assert.equal(tx.nonce, 6);
  assert.equal(tx.sender, key.sender);
  assert.match(tx.commitment, /^[0-9a-f]{64}$/);
  const wire = JSON.stringify(sent[0]);
  assert.ok(!wire.includes('Secret title') && !wire.includes('secret message') && !wire.includes(r.file.salt), 'the title, the message and the salt are not in what is sent');
  assert.equal(await K.pcc.verifyEd25519(sent[0].public_key.bytes, K.pcc.hexToBytes(K.pcc.signingHash(tx, DOMAIN)), sent[0].signature), true);
  // the file is the capsule: it reads back, hashes to the id, and the id is what the chain will name
  const m = C.readCapsuleFile(r.file);
  assert.equal(m.title, 'Secret title');
  assert.equal(m.body, 'A secret message nobody should see yet.');
  assert.equal(m.author, key.sender);
  assert.equal(m.openAt, 230);
  assert.equal(m.sealedAt, r.height);
  assert.equal(m.sealTx, r.txHash);
  assert.equal(K.pcc.capsuleId(key.sender, tx.commitment), m.capsule, 'the id a later open must name');
  assert.equal(K.pcc.capsuleCommitment(DOMAIN, { author: key.sender, channel: 'BOT', salt: m.salt, title: m.title, body_hash: K.pcc.bodyHash(m.body), media_uri: null }).commitment, tx.commitment);
  // an invalid plan sends nothing
  sent.length = 0;
  await assert.rejects(() => C.sealCapsule({ chain, net, key, plan: plan({ title: '' }) }), /title cannot be empty/);
  assert.equal(sent.length, 0);
});

const OPEN_FILE_FOR = async (opts = {}) => {
  const c = await fakeClient(opts.client);
  // a capsule sealed by the same key, due now on the devnet's list
  const p = plan({ title: 'Due now', body: 'Open me.', label: 'due', delay: 5, tip: 900, sender: c.key.sender });
  const sealed = await C.sealCapsule({ chain: c.chain, net: c.net, key: c.key, plan: p });
  c.sent.length = 0;
  return { ...c, file: C.readCapsuleFile(sealed.file), raw: sealed.file };
};
const listWith = (file, over = {}, height = 1000) => ({ enabled: true, height, capsules: [{ id: file.capsule, author: file.author, channel: file.channel, label: file.label, sealed_at: 900, open_at: file.openAt, lapses_at: file.openAt + 10512000, due: height + 1 >= file.openAt, blocks_until_open: Math.max(0, file.openAt - height - 1), ...over }] });

test('openCapsule stores the message by its hash, signs open_capsule with the opener’s own key, and the signature verifies', async () => {
  const c = await OPEN_FILE_FOR();
  const list = listWith(c.file, {}, c.file.openAt + 2);
  const net = { ...c.net, get: async (p) => (p.split('?')[0] === '/capsules' ? list : c.net.get(p)) };
  const opener = await K.keyFromSeed('82'.repeat(32));
  const stages = [];
  const r = await C.openCapsule({ chain: c.chain, net, key: opener, file: c.file, onStage: (s) => stages.push(s) });
  assert.deepEqual(c.posts.map((p) => p[0]), ['/body', '/tx'], 'the message first, then the open');
  assert.deepEqual(c.posts[0][1], { body: 'Open me.' });
  const signed = c.posts[1][1];
  assert.equal(signed.tx.type, 'open_capsule');
  assert.equal(signed.tx.capsule, c.file.capsule);
  assert.equal(signed.tx.salt, c.file.salt);
  assert.equal(signed.tx.title, 'Due now');
  assert.equal(signed.tx.body_hash, K.pcc.bodyHash('Open me.'));
  assert.equal(signed.tx.sender, opener.sender, 'anyone with the file may open it, signing as themselves');
  assert.notEqual(signed.tx.sender, c.file.author);
  assert.equal(await K.pcc.verifyEd25519(signed.public_key.bytes, K.pcc.hexToBytes(K.pcc.signingHash(signed.tx, DOMAIN)), signed.signature), true);
  assert.equal(r.txHash, K.pcc.txHash(signed));
  assert.deepEqual(stages, ['stored', 'signed', 'sent']);
});

test('an open is refused, nothing sent and the salt unspoken, while the capsule waits, is not listed, or has lapsed', async () => {
  const c = await OPEN_FILE_FOR();
  const opener = await K.keyFromSeed('83'.repeat(32));
  const run = (list) => C.openCapsule({ chain: c.chain, net: { ...c.net, get: async (p) => (p.split('?')[0] === '/capsules' ? list : null) }, key: opener, file: c.file });
  // before open_at: one block short, and far away
  await assert.rejects(() => run(listWith(c.file, {}, c.file.openAt - 2)), (e) => e.code === 'early' && /opens at block \d+ and the devnet is at \d+\. Nothing was sent, so the message stays secret until then/.test(e.message));
  await assert.rejects(() => run(listWith(c.file, {}, c.file.openAt - 100)), (e) => e.code === 'early');
  // the exact edge: the next block is open_at, so it may go
  await assert.doesNotReject(() => run(listWith(c.file, {}, c.file.openAt - 1)));
  c.posts.length = 0;
  // not listed (opened, pruned, reset) or the list cannot be read
  await assert.rejects(() => run({ enabled: true, height: 5000, capsules: [] }), (e) => e.code === 'gone' && /does not list this capsule[\s\S]*Nothing was sent, and the salt stays secret/.test(e.message));
  await assert.rejects(() => run(null), (e) => e.code === 'gone');
  // another capsule's row is not this one's
  await assert.rejects(() => run({ enabled: true, height: 5000, capsules: [{ ...listWith(c.file).capsules[0], id: HEX('4') }] }), (e) => e.code === 'gone');
  // lapsed
  await assert.rejects(() => run(listWith(c.file, { lapses_at: c.file.openAt + 3 }, c.file.openAt + 5)), (e) => e.code === 'lapsed' && /lapsed at block/.test(e.message));
  assert.deepEqual(c.posts, [], 'not one byte went to the devnet in any refused case');
  assert.deepEqual(c.sent, []);
});

test('an open that the devnet answers oddly is an error, not a success: a different stored hash, a different transaction hash', async () => {
  const c = await OPEN_FILE_FOR();
  const opener = await K.keyFromSeed('84'.repeat(32));
  const list = listWith(c.file, {}, c.file.openAt + 1);
  const bad1 = { ...c.net, get: async (p) => (p.split('?')[0] === '/capsules' ? list : { next_nonce: 0 }), post: async (p) => (p === '/body' ? { body_hash: HEX('7') } : {}) };
  await assert.rejects(() => C.openCapsule({ chain: c.chain, net: bad1, key: opener, file: c.file }), /stored the message under a different hash/);
  const bad2 = { ...c.net, get: async (p) => (p.split('?')[0] === '/capsules' ? list : { next_nonce: 0 }), post: async (p, b) => (p === '/body' ? { body_hash: K.pcc.bodyHash(b.body) } : { tx_hash: HEX('8') }) };
  await assert.rejects(() => C.openCapsule({ chain: c.chain, net: bad2, key: opener, file: c.file }), /reported a different transaction from the one signed/);
});

test('matchFile says whether the devnet’s listing agrees with a file: same author, channel and block', async () => {
  const c = await OPEN_FILE_FOR();
  const at = c.file.openAt + 1;
  const list = C.readCapsules(listWith(c.file, {}, at));
  const m = C.matchFile(c.file, list);
  assert.deepEqual({ state: m.state, agrees: m.agrees }, { state: 'due', agrees: true });
  assert.equal(C.matchFile(c.file, C.readCapsules(listWith(c.file, {}, 5))).state, 'waiting');
  assert.equal(C.matchFile(c.file, C.readCapsules(listWith(c.file, { label: 'another' }, at))).agrees, false);
  assert.equal(C.matchFile(c.file, C.readCapsules(listWith(c.file, { open_at: c.file.openAt + 1 }, at))).agrees, false);
  assert.equal(C.matchFile(c.file, C.readCapsules(listWith(c.file, { channel: 'GDN' }, at))).agrees, false);
  assert.deepEqual(C.matchFile(c.file, { rows: [], height: 5 }), { row: null, state: 'gone', agrees: false });
  assert.deepEqual(C.matchFile(c.file, null), { row: null, state: 'gone', agrees: false });
});

// ================================================================ the view (jsdom)

function skeleton() {
  const hooks = [...new Set(src.view.match(/data-cp-[a-z-]+/g))];
  const parts = [];
  for (const h of hooks) {
    if (['data-cp-title', 'data-cp-label', 'data-cp-delay'].includes(h)) parts.push('<input type="text" ' + h + '>');
    else if (h === 'data-cp-body' || h === 'data-cp-import-text') parts.push('<textarea ' + h + ' disabled></textarea>');
    else if (h === 'data-cp-channel') parts.push('<select ' + h + '><option value="BOT">BOT</option><option value="GDN">GDN</option></select>');
    else if (h === 'data-cp-import-file') parts.push('<input type="file" ' + h + ' disabled>');
    else if (h === 'data-cp-keep') parts.push('<input type="checkbox" ' + h + '>');
    else if (['data-cp-review', 'data-cp-send', 'data-cp-cancel', 'data-cp-open-send', 'data-cp-open-cancel'].includes(h)) parts.push('<button ' + h + '>x</button>');
    else if (['data-cp-import-go', 'data-cp-refresh'].includes(h)) parts.push('<button ' + h + ' disabled>x</button>');
    else if (h === 'data-cp-download') parts.push('<button ' + h + ' hidden>x</button>');
    else if (h === 'data-cp-errors') parts.push('<ul ' + h + ' hidden></ul>');
    else if (h === 'data-cp-confirm') parts.push('<div ' + h + ' hidden><ul data-cp-confirm-list></ul><p data-cp-confirm-eta></p></div>');
    else if (h === 'data-cp-open-confirm') parts.push('<div ' + h + ' hidden><ul data-cp-open-list></ul><p data-cp-open-where></p></div>');
    else if (h === 'data-cp-result') parts.push('<div ' + h + ' hidden><p data-cp-result-text></p></div>');
    else if (h === 'data-cp-open-result') parts.push('<div ' + h + ' hidden><p data-cp-open-result-text></p></div>');
    else if (h === 'data-cp-list') parts.push('<table><tbody ' + h + '></tbody></table>');
    else if (h === 'data-cp-mine' || h === 'data-cp-wall') parts.push('<ul ' + h + '></ul>');
    else if (h === 'data-cp-genesis') parts.push('<p ' + h + ' hidden></p>');
    else if (['data-cp-confirm-list', 'data-cp-confirm-eta', 'data-cp-open-list', 'data-cp-open-where', 'data-cp-result-text', 'data-cp-open-result-text'].includes(h)) continue;
    else parts.push('<div ' + h + '></div>');
  }
  const kp = '<div data-key-panel>' + ['status', 'address', 'make', 'forget', 'keep', 'reveal', 'seed', 'copy', 'own', 'own-note', 'use'].map((k) => (k === 'keep' ? '<input type="checkbox" data-kp-keep>' : '<span data-kp-' + k + '></span>')).join('') + '</div>';
  return parts.join('\n') + kp;
}
function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
function mountView({ search = '', fetchOpts = {}, extra = {}, storage = fakeStorage() } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><section data-capsules-app data-state="static" data-api="' + DEVNET.url + '" data-genesis="' + GENESIS + '" data-chain-id="x">' + skeleton() + '</section></body></html>', { url: 'http://localhost/chain/capsules/' + search });
  const rootEl = dom.window.document.querySelector('[data-capsules-app]');
  const log = fetchOpts.log || [];
  const base = fakeDevnet({ ...fetchOpts, log });
  const fetchFn = async (u, i) => base(String(u).replace(DEVNET.url, 'http://127.0.0.1:8799'), i);
  const c = view.mount(rootEl, { window: dom.window, fetch: fetchFn, storage, supported: true, now: () => 1792480100000, ...extra });
  return { dom, rootEl, c, log, storage };
}
const $ = (rootEl, sel) => rootEl.querySelector(sel);
const txt = (rootEl, sel) => ($(rootEl, sel) || {}).textContent;

test('the view draws the devnet’s capsules, the rate, and the wall of opened ones, all as text', async () => {
  const { rootEl, c, dom } = mountView();
  await c.begin();
  c.stop();
  assert.equal(rootEl.dataset.state, 'ready');
  assert.match(txt(rootEl, '[data-cp-count]'), /^1 capsule sealed · 0 may be opened now · newest block #92$/);
  const rows = [...rootEl.querySelectorAll('[data-cp-list] tr')];
  assert.equal(rows.length, 1);
  assert.match(rows[0].textContent, /^[0-9a-f]{8}…[0-9a-f]{4}far capsuleGDNtz1\w{5}…\w{6}#\d{1,3}(,\d{3})*in \d+ blocks$/);
  assert.match(txt(rootEl, '[data-cp-rate]'), /^The devnet has been sealing about [\d.]+ blocks an hour \(a block every \d+ s on average\)\.$/);
  const wall = [...rootEl.querySelectorAll('[data-cp-wall] li')];
  assert.equal(wall.length, OPENED.length);
  for (const o of OPENED) assert.ok(wall.some((li) => li.textContent.includes(o.tx.title) && li.textContent.includes(o.body.split('\n')[0]) && li.textContent.includes('waited ' + (o.height - o.seal.height) + ' blocks')), o.tx.title);
  assert.match(txt(rootEl, '[data-cp-wall-note]'), /^Scanned the newest \d+ blocks that carry transactions \(all of them\)\.$/);
  assert.match(txt(rootEl, '[data-cp-delay-hint]'), /^A whole number of blocks\.$|^Opens at block [\d,]+: about /);
  assert.equal(dom.window.document.querySelectorAll('script, iframe, img, a[href]').length, 0);
});

test('hostile text from the devnet is shown as plain text and makes no element', async () => {
  const evil = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  const bodies = { ...FX.bodies, [OPENED[0].tx.body_hash]: evil };
  const blocks = clone(FX.blocks);
  // an open whose hash matches the hostile body: the message is shown as text; its title is hostile too
  const o = blocks.find((b) => b.header.height === OPENED[0].height).txs.find((t) => t.tx.type === 'open_capsule');
  o.tx.body_hash = K.pcc.bodyHash(evil);
  o.tx.title = evil;
  bodies[o.tx.body_hash] = evil;
  const caps = clone(FX.capsules);
  caps.capsules[0].label = evil;
  const { rootEl, c } = mountView({ fetchOpts: { blocks, bodies, fx: { ...FX, capsules: caps } } });
  await c.begin();
  c.stop();
  assert.equal(rootEl.querySelectorAll('img, script, iframe, object, embed, a[href], [onerror], [onload], style').length, 0);
  assert.ok(rootEl.textContent.includes('alert(1)'), 'it is on the page, as text');
  for (const el of rootEl.querySelectorAll('*')) for (const a of el.attributes) assert.ok(!/^(on|href|src|srcdoc|style|action|formaction)/i.test(a.name), a.name);
});

test('sealing in the page: the confirm lists what goes on chain and what does not, nothing is sent until Send, and the file is kept', async () => {
  const c0 = await fakeClient();
  const sent = [];
  const connect = async () => ({ ...c0.chain, submit: async (s) => { sent.push(s); return c0.chain.submit(s); } });
  const accounts = { [c0.key.sender]: { balance: 0, next_nonce: 3 } };
  const { rootEl, c, dom, storage } = mountView({ fetchOpts: { accounts }, extra: { connect } });
  await c.begin();
  c.stop();
  assert.equal($(rootEl, '[data-cp-review]').disabled !== true, true);
  $(rootEl, '[data-cp-title]').value = 'To me, later';
  $(rootEl, '[data-cp-body]').value = 'Remember this.\nAnd this.';
  $(rootEl, '[data-cp-label]').value = 'page seal';
  $(rootEl, '[data-cp-delay]').value = '3';
  // no key: the review says so
  $(rootEl, '[data-cp-review]').click();
  assert.equal($(rootEl, '[data-cp-confirm]').hidden, true);
  assert.match(txt(rootEl, '[data-cp-errors]'), /Make a key first/);
  await c.keys.setSeed('81'.repeat(32));
  await tick(30);
  $(rootEl, '[data-cp-review]').click();
  assert.equal($(rootEl, '[data-cp-confirm]').hidden, false);
  const items = [...rootEl.querySelectorAll('[data-cp-confirm-list] li')].map((l) => l.textContent);
  assert.equal(items.length, 2);
  assert.match(items[0], new RegExp('^One seal_capsule transaction signed by ' + c0.key.sender + ': a commitment \\(a hash\\), channel BOT, open at block \\d+, wax seal label “page seal”\\. That is all that goes on chain now\\.$'));
  assert.match(items[1], /^Not sent: your title, your message and the salt\. They go into a capsule file you must keep\.$/);
  assert.match(txt(rootEl, '[data-cp-confirm-eta]'), /^It may be opened from block [\d,]+ \(about .* at the current rate, as soon as .* if the devnet is busy and as late as .* if it goes quiet\)\. Sent to /);
  assert.equal(sent.length, 0, 'the confirm box sends nothing');
  $(rootEl, '[data-cp-cancel]').click();
  assert.equal($(rootEl, '[data-cp-confirm]').hidden, true);
  $(rootEl, '[data-cp-review]').click();
  $(rootEl, '[data-cp-send]').click();
  await tick(400);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].tx.type, 'seal_capsule');
  assert.equal($(rootEl, '[data-cp-result]').dataset.state, 'ok');
  assert.match(txt(rootEl, '[data-cp-result-text]'), /^Sealed in block \d+\. The capsule opens at block [\d,]+\. DOWNLOAD THE CAPSULE FILE NOW: it holds your message and the salt, and without it the capsule never opens\.$/);
  assert.equal($(rootEl, '[data-cp-download]').hidden, false);
  assert.match(txt(rootEl, '[data-cp-seal-id]'), /^[0-9a-f]{64}$/);
  // it appears under "your capsules", and nothing is stored on the device unless asked
  assert.equal(c.state.mine.length, 1);
  assert.equal(c.state.mine[0].title, 'To me, later');
  assert.equal(storage.m.size, 0, 'the message is not stored on this device unless the box is ticked');
  assert.match(txt(rootEl, '[data-cp-mine-count]'), /^1 capsule file on this page$/);
  // Download builds a Blob of the file; it names the message and the salt
  const made = [];
  dom.window.URL.createObjectURL = (b) => { made.push(b); return 'blob:test/1'; };
  dom.window.URL.revokeObjectURL = () => {};
  $(rootEl, '[data-cp-download]').click();
  assert.equal(made.length, 1);
  const text = await new Promise((ok) => { const fr = new dom.window.FileReader(); fr.onload = () => ok(String(fr.result)); fr.readAsText(made[0]); });
  const file = JSON.parse(text);
  assert.equal(file.body, 'Remember this.\nAnd this.');
  assert.equal(file.format, 'pointcast-capsule/v1');
  assert.deepEqual(C.readCapsuleFile(file).capsule, c.state.mine[0].capsule);
  // keeping files on this device writes them (and unticking removes them)
  $(rootEl, '[data-cp-keep]').checked = true;
  $(rootEl, '[data-cp-keep]').dispatchEvent(new dom.window.Event('change'));
  assert.equal(storage.m.has(view.MY_SLOT), true);
  assert.equal(C.readCapsuleFile(JSON.parse(storage.getItem(view.MY_SLOT))[0]).title, 'To me, later');
  $(rootEl, '[data-cp-keep]').checked = false;
  $(rootEl, '[data-cp-keep]').dispatchEvent(new dom.window.Event('change'));
  assert.equal(storage.m.has(view.MY_SLOT), false);
});

test('a seal whose confirmation fails keeps the capsule file, says "sent, not confirmed" and never "Not sent": the salt exists nowhere else', { timeout: 30000 }, async () => {
  const c0 = await fakeClient();
  const sent = [];
  const seen = [];
  // the devnet accepts the seal; every poll for its block then fails (a gateway error with no verdict)
  const gateway = Object.assign(new Error('502 /tx/' + HEX('a')), { name: 'PointcastChainError', details: null });
  const connect = async () => ({ ...c0.chain, submit: async (s) => { sent.push(s); return c0.chain.submit(s); }, waitForTx: async () => { seen.push('poll'); throw gateway; } });
  const accounts = { [c0.key.sender]: { balance: 0, next_nonce: 3 } };
  const { rootEl, c, storage } = mountView({ fetchOpts: { accounts }, extra: { connect, wait: { timeoutMs: 400, intervalMs: 5 } } });
  await c.begin();
  c.stop();
  await c.keys.setSeed('81'.repeat(32));
  await tick(30);
  $(rootEl, '[data-cp-title]').value = 'to my future self';
  $(rootEl, '[data-cp-body]').value = 'the secret message I will never get back';
  $(rootEl, '[data-cp-label]').value = 'lost-test';
  $(rootEl, '[data-cp-delay]').value = '4';
  $(rootEl, '[data-cp-review]').click();
  $(rootEl, '[data-cp-send]').click();
  await tick(600);
  assert.equal(sent.length, 1, 'the seal went out once');
  assert.ok(seen.length > 1, 'a failed poll is tried again before giving up: ' + seen.length);
  const text = txt(rootEl, '[data-cp-result-text]');
  assert.doesNotMatch(text, /^Not sent/, 'the devnet holds this seal, so "Not sent" would be false: ' + text);
  assert.match(text, /^Sent, not confirmed yet: the devnet answered 502 for \/tx\/<hash>\. Transaction [0-9a-f]{64}\./);
  assert.match(text, /DOWNLOAD THE CAPSULE FILE NOW/);
  assert.equal($(rootEl, '[data-cp-result]').dataset.state, 'warn');
  // the file exists, holds the message and the salt, and hashes to the capsule id the seal committed to
  assert.equal($(rootEl, '[data-cp-download]').hidden, false);
  assert.equal(c.state.mine.length, 1);
  assert.ok(c.state.lastFile, 'the page holds the file for the download button');
  const file = C.readCapsuleFile(c.state.lastFile);
  assert.equal(file.body, 'the secret message I will never get back');
  assert.match(file.salt, /^[0-9a-f]{64}$/);
  assert.equal(K.pcc.capsuleId(c0.key.sender, sent[0].tx.commitment), file.capsule, 'the id on the seal that was sent is the file’s');
  assert.equal(file.sealTx, K.pcc.txHash(sent[0]), 'the file names the seal transaction that was sent');
  assert.match(txt(rootEl, '[data-cp-seal-id]'), /^[0-9a-f]{64}$/);
  // a second Send would seal a second capsule with a fresh salt: the confirm is closed
  assert.equal($(rootEl, '[data-cp-confirm]').hidden, true);
  $(rootEl, '[data-cp-send]').click();
  await tick(60);
  assert.equal(sent.length, 1, 'nothing more was sent');
  assert.equal(storage.m.size, 0, 'and nothing was stored on the device that the person did not ask for');
});

test('one transient failed poll after the seal is ridden out; a refusal at the send keeps no file and says Not sent', { timeout: 30000 }, async () => {
  const c0 = await fakeClient();
  // a single 502 on the first poll: the seal still confirms
  let polls = 0;
  const connect = async () => ({ ...c0.chain, waitForTx: async (h) => { polls += 1; if (polls === 1) throw Object.assign(new Error('502 /tx/' + h), { details: null }); return { height: 6001, index: 0, status: 'included' }; } });
  const accounts = { [c0.key.sender]: { balance: 0, next_nonce: 3 } };
  const a = mountView({ fetchOpts: { accounts }, extra: { connect, wait: { timeoutMs: 2000, intervalMs: 5 } } });
  await a.c.begin();
  a.c.stop();
  await a.c.keys.setSeed('81'.repeat(32));
  await tick(30);
  $(a.rootEl, '[data-cp-title]').value = 'T';
  $(a.rootEl, '[data-cp-body]').value = 'B';
  $(a.rootEl, '[data-cp-label]').value = 'L';
  $(a.rootEl, '[data-cp-delay]').value = '4';
  $(a.rootEl, '[data-cp-review]').click();
  $(a.rootEl, '[data-cp-send]').click();
  await tick(400);
  assert.equal(polls, 2);
  assert.match(txt(a.rootEl, '[data-cp-result-text]'), /^Sealed in block 6001\./);
  assert.equal($(a.rootEl, '[data-cp-result]').dataset.state, 'ok');
  // the devnet refuses the seal outright: nothing is on chain, so no file is kept and "Not sent" is true
  const refuse = async () => ({ ...c0.chain, submit: async () => { throw Object.assign(new Error('seal refused: too many unopened capsules'), { name: 'PointcastChainError', details: { error: 'seal refused: too many unopened capsules' } }); } });
  const b = mountView({ fetchOpts: { accounts }, extra: { connect: refuse } });
  await b.c.begin();
  b.c.stop();
  await b.c.keys.setSeed('81'.repeat(32));
  await tick(30);
  $(b.rootEl, '[data-cp-title]').value = 'T';
  $(b.rootEl, '[data-cp-body]').value = 'B';
  $(b.rootEl, '[data-cp-label]').value = 'L';
  $(b.rootEl, '[data-cp-delay]').value = '4';
  $(b.rootEl, '[data-cp-review]').click();
  $(b.rootEl, '[data-cp-send]').click();
  await tick(300);
  assert.match(txt(b.rootEl, '[data-cp-result-text]'), /^Not sent: seal refused: too many unopened capsules$/);
  assert.equal(b.c.state.mine.length, 0, 'a seal that never left leaves no capsule file behind');
  assert.equal($(b.rootEl, '[data-cp-download]').hidden, true);
  assert.equal(b.c.state.lastFile, null);
});

test('sealCapsule hands the file over before the seal is sent, and a failure carries it', async () => {
  const c0 = await fakeClient();
  const order = [];
  const chain = { ...c0.chain, submit: async (s) => { order.push('submit'); throw Object.assign(new Error('503 /tx'), { details: null }); } };
  const key = c0.key;
  const p = C.planSeal({ channel: 'BOT', title: 'T', body: 'B', label: 'L', delay: 5, tip: 100, sender: key.sender });
  await assert.rejects(() => C.sealCapsule({ chain, net: c0.net, key, plan: p, onFile: (f) => order.push('file:' + f.sealed_at) }), (e) => {
    assert.equal(e.sendState, 'maybe', 'a send that got no answer may or may not have arrived');
    assert.equal(e.file.salt.length, 64);
    assert.equal(e.capsule, e.file.capsule);
    assert.match(e.txHash, /^[0-9a-f]{64}$/);
    assert.equal(e.file.seal_tx, e.txHash);
    return true;
  });
  assert.deepEqual(order, ['file:0', 'submit'], 'the file was kept before the first byte left');
  // the second copy, after the block, carries the height and replaces the first (same capsule id)
  const got = [];
  const r = await C.sealCapsule({ chain: c0.chain, net: c0.net, key, plan: p, onFile: (f) => got.push(f) });
  assert.equal(got.length, 2);
  assert.equal(got[0].capsule, got[1].capsule);
  assert.equal(got[0].salt, got[1].salt);
  assert.equal(got[0].sealed_at, 0);
  assert.equal(got[1].sealed_at, r.height);
});

test('a capsule file is refused by its size before any of it is read into memory', async () => {
  const { rootEl, c, dom } = mountView();
  await c.begin();
  c.stop();
  const reads = [];
  const imp = $(rootEl, '[data-cp-import-file]');
  const pick = (f) => { Object.defineProperty(imp, 'files', { value: [f], configurable: true }); imp.dispatchEvent(new dom.window.Event('change')); };
  pick({ name: 'huge.json', size: 900 * 1048576, text: async () => { reads.push('huge'); return 'x'; } });
  await tick(30);
  assert.deepEqual(reads, [], 'text() was never called on a 900 MiB file');
  assert.match(txt(rootEl, '[data-cp-import-note]'), /too large to be a capsule file/);
  assert.equal($(rootEl, '[data-cp-import-note]').dataset.bad, 'yes');
  assert.equal(c.state.mine.length, 0);
  // a file of the right size is read and judged by its content
  pick({ name: 'f.json', size: 20, text: async () => { reads.push('small'); return '{"nope":1}'; } });
  await tick(30);
  assert.deepEqual(reads, ['small']);
  assert.match(txt(rootEl, '[data-cp-import-note]'), /not a capsule file/);
  // and a real one is added
  const f = fileOf(OPENED[0]);
  const body = JSON.stringify(f);
  pick({ name: 'real.json', size: body.length, text: async () => body });
  await tick(30);
  assert.equal(c.state.mine.length, 1);
});

test('with more capsules than one reply holds, a due capsule is not called NOT LISTED: the list is asked for at its ceiling, and a cut list says so', { timeout: 30000 }, async () => {
  const c0 = await fakeClient();
  const made = await OPEN_FILE_FOR({ client: { seed: '81'.repeat(32) } });
  const file = made.file;
  const rawText = JSON.stringify(made.raw);
  // 500 other capsules that lapse sooner crowd the victim out of the 500 the devnet serves
  const rows = (n) => Array.from({ length: n }, (_, i) => ({ id: K.pcc.bytesToHex(K.pcc.sha256(new TextEncoder().encode('spam' + i))), author: c0.key.sender, blocks_until_open: 0, channel: 'BOT', due: true, label: 'spam ' + i, lapses_at: 10000 + i, open_at: 3 + i, sealed_at: 1 }));
  const victimRow = listWith(file, {}, file.openAt + 1).capsules.find((r) => r.id === file.capsule);
  assert.ok(victimRow, 'the victim is in the plain list');
  const listOf = (n, withVictim) => ({ ...listWith(file, {}, file.openAt + 1), capsules: [...rows(n), ...(withVictim ? [victimRow] : [])] });
  // the request asks for the ceiling
  const log = [];
  const full = mountView({ fetchOpts: { log, fx: { ...FX, capsules: listOf(500, false) } } });
  await full.c.begin();
  full.c.stop();
  assert.ok(log.includes('GET /capsules?limit=500'), 'the list is read with limit=500: ' + log.filter((p) => p.includes('capsules')).join());
  assert.equal(full.c.state.list.capped, true);
  assert.match(txt(full.rootEl, '[data-cp-count]'), /500 capsules sealed · .* · the devnet cuts this list at 500 \(the ones that lapse soonest\), so more may exist$/);
  // the victim's file: missing from a cut list is "not in the list shown", not "gone", and Open is refused for the true reason
  await full.c.importFile(rawText);
  const li = full.rootEl.querySelector('[data-cp-mine] li');
  assert.equal(li.dataset.state, 'unknown');
  assert.match(li.textContent, /NOT IN THE LIST SHOWN/);
  assert.doesNotMatch(li.textContent, /NOT LISTED|does not list it/);
  assert.match(li.textContent, /cannot tell whether it is due, opened or gone/);
  assert.equal([...li.querySelectorAll('button')].find((b) => b.textContent === 'Open it').disabled, true);
  const posts = [];
  const net = { ...c0.net, get: async (p) => (p.split('?')[0] === '/capsules' ? listOf(500, false) : c0.net.get(p)), post: async (p, b) => { posts.push(p); return {}; } };
  await assert.rejects(() => C.openCapsule({ chain: c0.chain, net, key: c0.key, file }), (e) => e.code === 'capped' && /lists only its 500 capsules that lapse soonest, and this one is not among them[\s\S]*Nothing was sent, and the salt stays secret/.test(e.message) && !/never sealed here/.test(e.message));
  assert.deepEqual(posts, [], 'nothing was posted');
  // a list that is NOT cut and lacks the capsule really is "gone"
  const short = mountView({ fetchOpts: { fx: { ...FX, capsules: listOf(499, false) } } });
  await short.c.begin();
  short.c.stop();
  await short.c.importFile(rawText);
  assert.equal(short.rootEl.querySelector('[data-cp-mine] li').dataset.state, 'gone');
  assert.equal(C.matchFile(file, C.readCapsules(listOf(499, false))).state, 'gone');
  assert.equal(C.matchFile(file, C.readCapsules(listOf(500, false))).state, 'unknown');
  // and with the victim inside the 500 it is found and due
  const inside = C.readCapsules(listOf(499, true));
  assert.equal(inside.capped, true);
  assert.equal(C.matchFile(file, inside).state, 'due');
});

test('capsule files you hold: an edited file is refused with a reason, a good one is added, and the ones kept on this device come back', async () => {
  const f = fileOf(OPENED[0]);
  const { rootEl, c, dom } = mountView();
  await c.begin();
  c.stop();
  await c.importFile(JSON.stringify({ ...f, body: f.body + '!' }));
  assert.equal($(rootEl, '[data-cp-import-note]').dataset.bad, 'yes');
  assert.match(txt(rootEl, '[data-cp-import-note]'), /changed after sealing/);
  assert.equal(c.state.mine.length, 0);
  await c.importFile(JSON.stringify(f));
  assert.equal($(rootEl, '[data-cp-import-note]').dataset.bad, 'no');
  assert.equal(c.state.mine.length, 1);
  const li = $(rootEl, '[data-cp-mine] li');
  assert.equal(li.dataset.state, 'gone', 'this one has opened: the devnet no longer lists it');
  assert.match(li.textContent, /NOT LISTED/);
  assert.match(li.textContent, /already opened, lapsed and pruned, or the devnet was reset/);
  assert.equal([...li.querySelectorAll('button')].find((b) => b.textContent === 'Open it').disabled, true);
  // the far capsule from the recording is listed and waiting: a file for it shows the wait
  const far = SEALED_ONLY[0];
  const farFile = C.makeCapsuleFile({ chainId: CHAIN_ID, genesis: GENESIS, api: 'x', capsule: far.id, author: far.tx.sender, channel: far.tx.channel, title: 'x', body: 'y', salt: 'a1b2c3d4'.repeat(8), label: far.tx.label, openAt: far.tx.open_at, sealedAt: far.height, sealTx: far.hash });
  assert.throws(() => C.readCapsuleFile(farFile), /does not hash/, 'a made-up salt does not fit the recorded capsule, as it should not');
  // kept files load on the next visit, unreadable ones are dropped
  const storage = fakeStorage({ [view.MY_SLOT]: JSON.stringify([f, { nonsense: true }]) });
  const again = mountView({ storage });
  assert.equal(again.c.state.mine.length, 1);
  assert.equal(again.c.state.mine[0].capsule, f.capsule);
  assert.equal($(again.rootEl, '[data-cp-keep]').checked, true);
  // remove from this page
  const rm = [...li.querySelectorAll('button')].find((b) => b.textContent === 'Remove from this page');
  rm.click();
  assert.equal(c.state.mine.length, 0);
  assert.ok(dom);
});

test('opening in the page: the Open button is off until the capsule is due, the confirm says what becomes public, and a refusal sends nothing', async () => {
  const c0 = await fakeClient();
  const made = await OPEN_FILE_FOR({ client: { seed: '81'.repeat(32) } });
  const file = made.file;
  const rawText = JSON.stringify(made.raw);
  const tipNow = FX.tip;
  // a devnet whose list shows this capsule due, and one where it still waits
  const dueList = listWith(file, {}, file.openAt + 1);
  const waitingList = listWith(file, {}, file.openAt - 50);
  const posts = [];
  const fx = (list) => ({ ...FX, capsules: list });
  const opener = async (list, extra = {}) => {
    const m = mountView({ fetchOpts: { fx: fx(list), overrides: { '/body': async (u, init) => { posts.push(['/body', JSON.parse(init.body)]); return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ body_hash: K.pcc.bodyHash(JSON.parse(init.body).body) }) }; }, '/tx': async (u, init) => { const b = JSON.parse(init.body); posts.push(['/tx', b]); return { ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ tx_hash: K.pcc.txHash(b), status: 'pending' }) }; } }, accounts: { [c0.key.sender]: { balance: 0, next_nonce: 0 } } }, extra: { connect: async () => ({ ...c0.chain, waitForTx: async () => ({ height: 777 }) }), ...extra } });
    await m.c.begin();
    m.c.stop();
    await m.c.importFile(rawText);
    return m;
  };
  const w = await opener(waitingList);
  assert.equal(w.rootEl.querySelector('[data-cp-mine] li').dataset.state, 'waiting');
  assert.match(w.rootEl.querySelector('[data-cp-mine] li').textContent, /SEALED · WAITING/);
  await w.c.keys.setSeed('81'.repeat(32));
  await tick(30);
  assert.equal([...w.rootEl.querySelectorAll('[data-cp-mine] button')].find((b) => b.textContent === 'Open it').disabled, true, 'not due: the button is off');
  // even if it were pressed, the logic refuses and sends nothing
  w.c.showOpenConfirm(w.c.state.mine[0]);
  w.rootEl.querySelector('[data-cp-open-send]').click();
  await tick(300);
  assert.match(txt(w.rootEl, '[data-cp-open-result-text]'), /^Not opened: it opens at block|^Not opened: .*Nothing was sent, so the message stays secret until then/);
  assert.equal($(w.rootEl, '[data-cp-open-result]').dataset.state, 'bad');
  assert.deepEqual(posts, []);
  // due: the button is on, the confirm lists the two things, Send opens it
  const d = await opener(dueList);
  await d.c.keys.setSeed('81'.repeat(32));
  await tick(30);
  const btn = [...d.rootEl.querySelectorAll('[data-cp-mine] button')].find((b) => b.textContent === 'Open it');
  assert.equal(btn.disabled, false);
  btn.click();
  assert.equal($(d.rootEl, '[data-cp-open-confirm]').hidden, false);
  const items = [...d.rootEl.querySelectorAll('[data-cp-open-list] li')].map((l) => l.textContent);
  assert.equal(items.length, 2);
  assert.match(items[0], /^Your message, stored on the devnet by its hash \(POST \/body\)\. It becomes public\.$/);
  assert.match(items[1], new RegExp('^One open_capsule transaction signed by YOUR key ' + c0.key.sender + ', revealing the salt\\. It airs as a post by the capsule’s author ' + file.author + ' on channel BOT, titled “Due now”\\.$'));
  assert.deepEqual(posts, [], 'the confirm sends nothing');
  d.rootEl.querySelector('[data-cp-open-send]').click();
  await tick(400);
  assert.deepEqual(posts.map((p) => p[0]), ['/body', '/tx']);
  assert.equal(posts[1][1].tx.type, 'open_capsule');
  assert.equal($(d.rootEl, '[data-cp-open-result]').dataset.state, 'ok');
  assert.match(txt(d.rootEl, '[data-cp-open-result-text]'), /^Opened in block 777\. Transaction [0-9a-f]{64}\. The message is now public on the wall below\.$/);
  assert.ok(tipNow > 0);
});

test('an open that was sent but not seen to confirm is not "Not opened": the page reads the list again and says whether it landed', { timeout: 30000 }, async () => {
  const c0 = await fakeClient();
  const made = await OPEN_FILE_FOR({ client: { seed: '81'.repeat(32) } });
  const file = made.file;
  const rawText = JSON.stringify(made.raw);
  const posts = [];
  const gateway = Object.assign(new Error('502 /tx/' + HEX('b')), { details: null });
  const open = async (list) => {
    posts.length = 0;
    list.current = () => (list.vanishes && posts.includes('/tx') ? { ...listWith(file, {}, file.openAt + 1), capsules: [] } : listWith(file, {}, file.openAt + 1));
    const accepted = { ok: true, status: 200, headers: { get: () => null } };
    const m = mountView({ fetchOpts: { fx: { ...FX, get capsules() { return list.current(); } }, overrides: { '/body': async (u, init) => { posts.push('/body'); return { ...accepted, text: async () => JSON.stringify({ body_hash: K.pcc.bodyHash(JSON.parse(init.body).body) }) }; }, '/tx': async (u, init) => { const b = JSON.parse(init.body); posts.push('/tx'); return { ...accepted, text: async () => JSON.stringify({ tx_hash: K.pcc.txHash(b), status: 'pending' }) }; } }, accounts: { [c0.key.sender]: { balance: 0, next_nonce: 0 } } }, extra: { connect: async () => ({ ...c0.chain, waitForTx: async () => { throw gateway; } }), wait: { timeoutMs: 200, intervalMs: 5 } } });
    await m.c.begin();
    m.c.stop();
    await m.c.importFile(rawText);
    await m.c.keys.setSeed('81'.repeat(32));
    await tick(30);
    [...m.rootEl.querySelectorAll('[data-cp-mine] button')].find((b) => b.textContent === 'Open it').click();
    m.rootEl.querySelector('[data-cp-open-send]').click();
    await tick(500);
    return m;
  };
  // the open was accepted, then the poll for its block failed; the devnet's list no longer holds the capsule: it opened
  const list = { vanishes: false };
  const m = await open(list);
  assert.deepEqual(posts, ['/body', '/tx']);
  const text = txt(m.rootEl, '[data-cp-open-result-text]');
  assert.doesNotMatch(text, /^Not opened/, text);
  assert.equal($(m.rootEl, '[data-cp-open-confirm]').hidden, true, 'the confirm is closed');
  // the list still holds it (this fake never removes it): not opened yet, so the page says "sent, not confirmed", and that it may still open
  assert.match(text, /^Sent, not confirmed yet: the devnet answered 502 for \/tx\/<hash>\. Transaction [0-9a-f]{64}\. The devnet accepted it, so it may still land: check before sending again\. The capsule is still listed, so it has not opened yet; if it does, its message becomes public\.$/);
  assert.equal($(m.rootEl, '[data-cp-open-result]').dataset.state, 'warn');
  // the same failure when the capsule has left the list: the open landed, and the message is public
  list.vanishes = true;
  const gone = await open(list);
  assert.match(txt(gone.rootEl, '[data-cp-open-result-text]'), /^The devnet no longer lists this capsule, so the open landed and its message is public on the wall below, though this page did not see it confirm \(the devnet answered 502 for \/tx\/<hash>\)\.$/);
  assert.equal($(gone.rootEl, '[data-cp-open-result]').dataset.state, 'ok');
});

test('the Open confirm names the key that will sign and is withdrawn when the key changes; it shows the message, and does not call someone else’s message yours', { timeout: 30000 }, async () => {
  const c0 = await fakeClient();
  const made = await OPEN_FILE_FOR({ client: { seed: '81'.repeat(32) } });
  const file = made.file;
  const posts = [];
  const accepted = { ok: true, status: 200, headers: { get: () => null } };
  const m = mountView({ fetchOpts: { fx: { ...FX, capsules: listWith(file, {}, file.openAt + 1) }, overrides: { '/body': async (u, init) => { posts.push('/body'); return { ...accepted, text: async () => JSON.stringify({ body_hash: K.pcc.bodyHash(JSON.parse(init.body).body) }) }; }, '/tx': async (u, init) => { posts.push('/tx'); const b = JSON.parse(init.body); return { ...accepted, text: async () => JSON.stringify({ tx_hash: K.pcc.txHash(b), status: 'pending' }) }; } }, accounts: { [c0.key.sender]: { balance: 0, next_nonce: 0 } } }, extra: { connect: async () => ({ ...c0.chain, waitForTx: async () => ({ height: 777 }) }) } });
  await m.c.begin();
  m.c.stop();
  await m.c.importFile(JSON.stringify(made.raw));
  const pressOpen = () => [...m.rootEl.querySelectorAll('[data-cp-mine] button')].find((b) => b.textContent === 'Open it').click();
  await m.c.keys.setSeed('81'.repeat(32));
  await tick(30);
  const mine = m.c.keys.key().sender;
  pressOpen();
  assert.equal($(m.rootEl, '[data-cp-open-confirm]').hidden, false);
  assert.match(txt(m.rootEl, '[data-cp-open-list]'), /^Your message, stored on the devnet by its hash/);
  assert.match(txt(m.rootEl, '[data-cp-open-list]'), new RegExp('signed by YOUR key ' + mine));
  assert.equal(txt(m.rootEl, '[data-cp-open-message]'), 'Open me.', 'the message that will become public is shown, word for word');
  // another key is made while the confirm is open: it is withdrawn, so Send cannot sign with a key it never named
  await m.c.keys.setSeed('82'.repeat(32));
  await tick(30);
  assert.equal($(m.rootEl, '[data-cp-open-confirm]').hidden, true, 'the confirm for the old key is gone');
  assert.equal(m.c.state.openPlan, null);
  $(m.rootEl, '[data-cp-open-send]').click();
  await tick(100);
  assert.deepEqual(posts, [], 'nothing was signed or sent');
  // the same file opened by another key: its message is not "yours"
  pressOpen();
  assert.match(txt(m.rootEl, '[data-cp-open-list]'), new RegExp('^The message in this capsule file, sealed by ' + file.author + ', stored on the devnet by its hash'));
  assert.doesNotMatch(txt(m.rootEl, '[data-cp-open-list]'), /^Your message/);
  assert.match(txt(m.rootEl, '[data-cp-open-list]'), new RegExp('signed by YOUR key ' + m.c.keys.key().sender));
  // Forget: the confirm goes with the key, instead of staying up and silently doing nothing
  $(m.rootEl, '[data-kp-forget]').click();
  await tick(30);
  assert.equal($(m.rootEl, '[data-cp-open-confirm]').hidden, true);
  assert.equal(m.c.state.openSender, '');
  // and a confirm for the current key still opens the capsule
  await m.c.keys.setSeed('82'.repeat(32));
  await tick(30);
  pressOpen();
  $(m.rootEl, '[data-cp-open-send]').click();
  await tick(400);
  assert.deepEqual(posts, ['/body', '/tx']);
  assert.match(txt(m.rootEl, '[data-cp-open-result-text]'), /^Opened in block 777\./);
});

test('a reset shows GENESIS CHANGED, reads nothing else and cannot send', async () => {
  const log = [];
  const { rootEl, c } = mountView({ fetchOpts: { log, status: { ...FX.status, genesis_hash: HEX('9') } } });
  await c.begin();
  c.stop();
  assert.equal(rootEl.dataset.state, 'changed');
  assert.equal($(rootEl, '[data-cp-genesis]').hidden, false);
  assert.match(txt(rootEl, '[data-cp-genesis]'), /GENESIS CHANGED/);
  assert.deepEqual(log, ['GET /status']);
  assert.match(txt(rootEl, '[data-cp-status]'), /Capsules sealed before the reset are gone/);
  assert.equal(c.state.halted, true);
});

test('an unreachable devnet is said so; ?devnet= is honoured only for localhost and 127.0.0.1; the page starts lazily', async () => {
  const { rootEl, c } = mountView({ fetchOpts: { overrides: { '/status': async () => { throw new TypeError('Failed to fetch'); } } } });
  await c.begin();
  c.stop();
  assert.equal(rootEl.dataset.state, 'down');
  assert.match(txt(rootEl, '[data-cp-status]'), /devnet did not answer/);
  assert.equal(mountView({ search: '?devnet=http://127.0.0.1:8799' }).c.where.api, 'http://127.0.0.1:8799');
  for (const bad of ['?devnet=https://pointcast-devnet.mhoydich.workers.dev', '?devnet=http://localhost@evil.example', '?devnet=//127.0.0.1', '?devnet=http://127.0.0.1.evil.example']) {
    const m = mountView({ search: bad });
    assert.equal(m.c.where.api, DEVNET.url, bad);
    assert.equal(m.c.where.genesis, GENESIS, bad);
  }
  const lazy = mountView();
  assert.deepEqual(lazy.log, []);
  assert.equal(lazy.c.state.begun, false);
  assert.match(code(src.view), /whenReady\(root, \(\) => c\.begin\(\), env\)/);
  assert.match(src.page, /requestIdleCallback/);
});

// ================================================================ rules read off the sources

test('nothing from the devnet becomes markup, a link or a style: the only link is a Blob the page builds from the capsule file — proven by mutation', () => {
  const allow = [/a\.href = win\.URL\.createObjectURL\(blob\);/];
  assertNoSinks(src.view, 'capsules-view.js', { allow });
  assertNoSinks(src.logic, 'capsules.js');
  assertNoSinks(src.keys, 'key-panel.js');
  const inline = (src.page.match(/<script is:inline[\s\S]*?<\/script>/) || [''])[0];
  assertNoSinks(inline, 'the page script');
  assert.throws(() => assertNoSinks(src.view, 'view'), /a link, source or style sink \(\.href =/);
  assert.throws(() => assertNoSinks(src.view + '\nlink.href = row.url;', 'view', { allow }), /a link, source or style sink/);
  assert.throws(() => assertNoSinks(src.view + '\nn.innerHTML = x;', 'view', { allow }), /an HTML sink/);
  assert.equal((code(src.view).match(/\.href\s*=/g) || []).length, 1);
});

test('the page writes only the SDK’s signed transactions and, to open, a message by its hash: three routes, each behind a button and a confirm', () => {
  const posts = callArgs(src.logic, 'net.post(').map((a) => a.split(',')[0]);
  assert.deepEqual(posts, ["'/body'", "'/tx'"], 'the message store and the signed open');
  assert.doesNotMatch(code(src.view), /\.post\(|method\s*:\s*['"]POST|\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
  assert.doesNotMatch(code(src.logic), /\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
  for (const arg of callArgs(src.logic, 'net.get(')) assert.ok(/^'\/[a-z]+'$|^CAPSULES_PATH$|^'\/account\/' \+ encodeURIComponent\(key\.sender\)$|^'\/raw\/blocks\?from=' \+ from \+ '&limit=' \+ count$|^'\/feed\?limit=' \+ limit \+ \(before === null \? '' : '&before=' \+ before\)$|^'\/body\/' \+ o\.bodyHash$/.test(arg), arg);
  // the order inside openCapsule: the readiness check, then the message, then the signed open
  const open = code(src.logic).slice(code(src.logic).indexOf('export async function openCapsule'));
  assert.ok(open.indexOf('net.get(CAPSULES_PATH)') < open.indexOf("net.post('/body'") && open.indexOf("net.post('/body'") < open.indexOf("net.post('/tx'"));
  assert.match(open, /st === 'waiting'\) throw/);
  assert.match(open, /st === 'gone'\) throw/);
  assert.match(open, /st === 'unknown'\) throw/);
  assert.equal(C.CAPSULES_PATH, '/capsules?limit=500', 'the list is asked for at the devnet’s ceiling, not its default of 100');
  assert.match(open, /st === 'lapsed'\) throw/);
  // the view reaches every write through a button and a confirm
  assert.match(code(src.view), /send\.addEventListener\('click', sendSeal\)/);
  assert.match(code(src.view), /openSend\.addEventListener\('click', sendOpen\)/);
  assert.match(code(src.view), /if \(!plan \|\| !plan\.ok \|\| !k \|\| S\.halted\) return;/);
  assert.match(code(src.view), /if \(!m \|\| !k \|\| S\.halted\) return;/);
  // the salt and the message are never sent at seal time
  const seal = code(src.logic).slice(code(src.logic).indexOf('export async function sealCapsule'), code(src.logic).indexOf('export async function openCapsule'));
  assert.doesNotMatch(seal, /net\.post|\/body/);
  assert.match(seal, /commitment: c\.commitment, open_at: f\.openAt, label: f\.label/);
});

test('the page and the view agree on every hook, the key panel is in the page, and the page uses the registry', () => {
  for (const h of new Set(src.view.match(/data-cp-[a-z-]+/g))) assert.ok(src.page.includes(h), h + ' is in the page');
  assert.match(src.page, /<KeyPanel signs="the seal" id="cp-kp" \/>/);
  assert.match(src.page, /<ChainHeader current="capsules"/);
  assert.ok(CHAIN_APPS.some((a) => a.key === 'capsules' && a.href === APP.path));
  assert.match(src.page, /import\('\/chain\/apps\/capsules-view\.js'\)/);
  assert.match(src.page, /data-genesis=\{DEVNET\.genesis\}/);
  assert.match(src.page, /assertDevnetLaunchPinned\(\)/);
  assert.equal(HOW_STEPS.length, 4);
  assert.deepEqual(C.CHANNELS, ['BOT', 'GDN']);
  assert.match(src.page, /<option value="BOT">[\s\S]*<option value="GDN">/);
});

test('the page is honest: lose the file and it never opens, anyone with the file can read it, a reset erases every capsule, the wait is blocks', () => {
  assert.equal(HONESTY_LINE, 'devnet · no value · may reset');
  const para = (src.page.match(/<p class="ca-honest"[\s\S]*?<\/p>/) || [''])[0];
  for (const needle of ['{HONESTY_LINE}', '{KEEP_COPY.reset}', 'dated and recorded, never silent', '{DEVNET_PREVIOUS.path}', '{notYet(RESET.date)}', 'no\n        capsule survived it', 'accountable claim']) assert.ok(para.includes(needle) || para.replace(/\s+/g, ' ').includes(needle.replace(/\s+/g, ' ')), needle);
  assert.match(KEEP_COPY.lose, /Lose the capsule file and the capsule never opens/);
  assert.match(KEEP_COPY.leak, /Anyone who holds the file can read your message before it opens/);
  assert.match(KEEP_COPY.open, /public and permanent on this devnet, until a reset/);
  assert.match(KEEP_COPY.reset, /A reset erases every sealed capsule/);
  assert.equal(DEVNET_PREVIOUS.path, '/chain/yard/devnet-1/');
  assert.match(RESET.date, /^20\d\d-\d\d-\d\d/);
  assert.ok(NOT_LIST.some((t) => /It is not encryption/.test(t)) && NOT_LIST.some((t) => /does not choose the moment/.test(t)) && NOT_LIST.some((t) => /A reset is dated and recorded/.test(t)));
  assert.match(src.page, /Seal it now\. Open it at a block you pick\./);
  assert.match(src.page, /NOTHING IS SENT UNTIL YOU PRESS SEND/);
  assert.match(src.page, /\{WAIT_COPY\}/);
});

test('no banned word and no currency sign anywhere in the app’s files, and the scanner catches each one', () => {
  assert.ok(MY_FILES.length >= 6);
  for (const f of MY_FILES) {
    const text = read(f);
    assert.deepEqual(bannedHits(text), [], f + ' carries a banned word');
    assert.deepEqual(currencyHits(text), [], f + ' carries a price');
  }
  for (const w of BANNED) assert.ok(bannedHits('some ' + w + ' here').length, w);
});

test('the page is accessible and responsive by construction: labelled inputs, status regions, a table with a caption, alerts for errors', () => {
  for (const id of ['cp-title', 'cp-channel', 'cp-body', 'cp-label', 'cp-delay', 'cp-import-file', 'cp-import-text']) assert.match(src.page, new RegExp('<label class="ca-label" for="' + id + '">'), id);
  assert.match(src.page, /data-cp-status role="status" aria-live="polite"/);
  assert.match(src.page, /role="alert" hidden/);
  assert.match(src.page, /<caption>Capsules sealed and not yet opened/);
  assert.match(src.page, /<th scope="col">Capsule<\/th>/);
  assert.match(src.page, /@media \(max-width:760px\)/);
});

test('the script on the page is real JavaScript, readies the capsule before it sends anything, and uses only routes the devnet has always had', () => {
  const text = codeSnippet(DEVNET.url, DEVNET.genesis);
  const dir = mkdtempSync(join(tmpdir(), 'capsule-snippet-'));
  try {
    writeFileSync(join(dir, 'capsule.mjs'), text);
    const syntax = spawnSync(process.execPath, ['--check', join(dir, 'capsule.mjs')], { encoding: 'utf8' });
    assert.equal(syntax.status, 0, syntax.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  assert.ok(text.includes('genesisHash: GENESIS'), 'it pins the genesis');
  assert.ok(text.indexOf('row.due') < text.indexOf('open_capsule'), 'the due check comes before the open is built');
  assert.match(text, /sending early would burn the salt/);
  assert.doesNotMatch(text, /capsuleReady|\/capsule\//, 'it does not need GET /capsule/{id}');
  assert.doesNotMatch(text, /`|\$\{/, 'plain strings');
  assert.ok(text.split('\n').length <= 30);
});

// ================================================================ the built page (skips while dist/ is absent)

const builtPath = new URL('dist/chain/capsules/index.html', root);
test('the built page carries the hooks, the honesty line, the pinned genesis, the key panel, the code and no outside script', { skip: !existsSync(builtPath) && 'dist/ is absent: run npm run build:bare to check the built page' }, () => {
  const html = readFileSync(builtPath, 'utf8');
  for (const h of new Set(src.view.match(/data-cp-[a-z-]+/g))) assert.ok(html.includes(h), h);
  assert.ok(html.includes(HONESTY_LINE));
  assert.ok(html.includes('data-genesis="' + DEVNET.genesis + '"'));
  assert.ok(html.includes('data-key-panel'));
  assert.match(html, /<h1>Seal it now\. Open it at a block you pick\.<\/h1>/);
  assert.match(html, /aria-current="page"[^>]*>Time Capsules</);
  assert.ok(html.includes('capsule.mjs'));
  assert.ok(!/<script[^>]+src="https?:\/\/(?!pointcast\.xyz)/.test(html));
});

// ================================================================ the real devnets (GET only; skipped when unreachable)

async function reach(base) {
  try {
    const r = await fetch(base + '/status', { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return null;
    return { base, status: await r.json() };
  } catch {
    return null;
  }
}
const LOCAL = await reach('http://127.0.0.1:8799');
const LIVE = await reach(DEVNET.url);

for (const [label, ep, genesis] of [['local devnet-2 at 127.0.0.1:8799', LOCAL, () => (LOCAL ? LOCAL.status.genesis_hash : '')], ['the live devnet', LIVE, () => DEVNET.genesis]]) {
  test('against ' + label + ': the list reads, the wall joins every open to its seal, and every message shown hashes to what was sealed', async (t) => {
    if (!ep) return t.skip(label + ' is not reachable');
    if (ep.status.genesis_hash !== genesis()) return t.skip(label + ' has a different genesis from the one pinned here');
    const net = K.makeNet(ep.base);
    const list = C.readCapsules(await net.get('/capsules'));
    assert.ok(list && list.enabled);
    for (const r of list.rows) assert.ok(['waiting', 'due', 'lapsed'].includes(C.stateOf(r, list.height)));
    const w = await C.readWall(net);
    assert.equal(w.complete, true);
    for (const it of w.items) {
      assert.ok(it.bodyVerified, 'every message on the wall hashes to what its open names');
      assert.equal(K.pcc.bodyHash(it.body), it.bodyHash);
      if (it.seal) assert.ok(it.seal.height < it.height);
    }
    assert.ok(Number.isFinite(await C.readRate(net, (await net.get('/status')).height)));
  });
}
