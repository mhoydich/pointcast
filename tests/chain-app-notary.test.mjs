// The Notary: /chain/notary (src/pages/chain/notary.astro), the logic
// public/chain/apps/notary.js (no DOM), the DOM side notary-view.js and the
// shared key panel.
//
// What this suite holds:
//   - a stamp is five plain lines, written and read strictly: the lines in order,
//     nothing extra, nothing that reads two ways;
//   - hashing is right (checked against node's own SHA-256), a file is read in the
//     browser and goes nowhere, and only the hash, the size and an optional name
//     and note go into the post;
//   - finding and checking work on a recorded local devnet-2 that holds real
//     stamps: a stamp found by its hash, or by its receipt, is checked through
//     the five Verify a block steps and the Notary's own, and each tampering (a
//     signature byte, a removed transaction, an edited body, the wrong file, the
//     wrong genesis) turns exactly the right check red;
//   - the post is signed with a key made in the browser and the signature
//     verifies; a stamp is sent only after the confirm box shows the body word for
//     word;
//   - nothing from the devnet becomes markup, a link or a style; the page pins the
//     genesis, stops at GENESIS CHANGED, is lazy and honours ?devnet= only for
//     localhost and 127.0.0.1;
//   - the copy is honest: a stamp is one server's accountable claim on a devnet
//     that may reset, not proof of authorship, and not anchored anywhere;
//   - the same check as a script (the snippet on the page) runs against a local
//     devnet and says what the page says (skipped when unreachable).
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, cpSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { DEVNET, DEVNET_PREVIOUS, RESET } from '../src/data/chain-home.ts';
import { APP, CHANNEL, HONESTY_LINE, NOT_ANCHORED, NOT_PROVES, PROVES, STAMP_LINES, checkSnippet } from '../src/data/chain-app-notary.ts';
import { CHAIN_APPS } from '../src/data/chain-apps.ts';
import * as N from '../public/chain/apps/notary.js';
import * as view from '../public/chain/apps/notary-view.js';
import * as K from '../public/chain/apps/chain-kit.js';
import { FX, fakeDevnet } from './helpers/fake-devnet.mjs';
import { assertNoSinks, bannedHits, BANNED, callArgs, code, currencyHits } from './helpers/chain-app-rules.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const FILES = {
  logic: 'public/chain/apps/notary.js',
  view: 'public/chain/apps/notary-view.js',
  keys: 'public/chain/apps/key-panel.js',
  page: 'src/pages/chain/notary.astro',
  data: 'src/data/chain-app-notary.ts',
};
const src = Object.fromEntries(Object.entries(FILES).map(([k, p]) => [k, read(p)]));
const MY_FILES = [...Object.values(FILES), 'tests/chain-app-notary.test.mjs', 'scripts/e2e-chain-app-notary.mjs'].filter((p) => existsSync(new URL(p, root)));
const HEX = (c) => c.repeat(64);
const GENESIS = FX.status.genesis_hash;
const sha = (s) => createHash('sha256').update(s).digest('hex');
const clone = (o) => JSON.parse(JSON.stringify(o));
const netFor = (opts) => K.makeNet('http://127.0.0.1:8799', { fetch: fakeDevnet(opts) });
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

/** The stamps the recorded devnet holds, found by walking its blocks (shares no code with findStamps). */
const STAMPS = FX.blocks.flatMap((b) => b.txs.filter((t) => t.tx.type === 'publish_block' && t.tx.channel === 'NOTARY').map((t) => ({ height: b.header.height, stx: t, body: FX.bodies[t.tx.body_hash] })));
const KNOWN = STAMPS.find((s) => /name:fixture\.txt/.test(s.body));
const KNOWN_TEXT = 'the recorded fixture file';
const KNOWN_TX = K.pcc.txHash(KNOWN.stx);

// ================================================================ the stamp text

test('a stamp is five plain lines, written exactly one way and read back exactly', () => {
  const h = HEX('a');
  const full = N.stampBody({ sha256: h, bytes: 12, name: 'my file.pdf', note: 'draft one' });
  assert.equal(full, ['notary/v1', 'sha256:' + h, 'bytes:12', 'name:my file.pdf', 'note:draft one'].join('\n'));
  assert.deepEqual(N.parseStamp(full), { sha256: h, bytes: 12, name: 'my file.pdf', note: 'draft one' });
  assert.equal(N.stampBody({ sha256: h, bytes: 0 }), 'notary/v1\nsha256:' + h + '\nbytes:0');
  assert.deepEqual(N.parseStamp('notary/v1\nsha256:' + h + '\nbytes:0'), { sha256: h, bytes: 0, name: '', note: '' });
  assert.equal(N.stampBody({ sha256: h, bytes: 3, note: 'only a note' }), 'notary/v1\nsha256:' + h + '\nbytes:3\nnote:only a note');
  assert.deepEqual(N.parseStamp(N.stampBody({ sha256: h, bytes: 3, note: 'only a note' })), { sha256: h, bytes: 3, name: '', note: 'only a note' });
  assert.equal(N.stampTitle(h), 'notary/v1 sha256:' + h);
  assert.ok(N.stampTitle(h).length <= 120, 'the title fits a keyless post too');
  assert.equal(N.CHANNEL, 'NOTARY');
  assert.equal(CHANNEL, 'NOTARY');
  // whitespace in a name is folded to one space, and an empty name or note is simply left out
  assert.equal(N.stampBody({ sha256: h, bytes: 1, name: '  a   b  ', note: '   ' }), 'notary/v1\nsha256:' + h + '\nbytes:1\nname:a b');
});

test('anything off is refused, on the way in and on the way out: one reading, no ambiguity', () => {
  const h = HEX('b');
  const ok = ['notary/v1', 'sha256:' + h, 'bytes:5'];
  const bad = [
    [], ['notary/v1'], ['notary/v2', ...ok.slice(1)], [ok[0], ok[2], ok[1]], [...ok, 'name:x', 'note:y', 'extra:z'], [...ok, 'note:y', 'name:x'], [...ok, 'name:x', 'name:y'],
    [ok[0], 'sha256:' + h.toUpperCase(), ok[2]], [ok[0], 'sha256:' + h.slice(1), ok[2]], [ok[0], 'sha256: ' + h, ok[2]], [ok[0], ok[1], 'bytes:-1'], [ok[0], ok[1], 'bytes:05'], [ok[0], ok[1], 'bytes:1.5'],
    [ok[0], ok[1], 'bytes:99999999999999999999'], [ok[0], ok[1], 'bytes:'], [...ok, 'name:'], [...ok, 'note:' + 'x'.repeat(141)], [...ok, 'name:' + 'x'.repeat(61)], [...ok, 'name: leading'], [...ok, 'name:two  spaces'],
    [...ok, 'name:bell\u0007'], [...ok, 'note:\u202eevil'],
  ];
  for (const lines of bad) assert.equal(N.parseStamp(lines.join('\n')), null, JSON.stringify(lines));
  for (const body of [null, undefined, 3, {}, '', 'notary/v1\r\nsha256:' + h + '\r\nbytes:5', ok.join('\n') + '\n', ' ' + ok.join('\n'), 'x'.repeat(3000)]) assert.equal(N.parseStamp(body), null, String(body).slice(0, 30));
  assert.throws(() => N.stampBody({ sha256: 'xyz', bytes: 1 }), /64 lowercase hex/);
  assert.throws(() => N.stampBody({ sha256: h.toUpperCase(), bytes: 1 }), /64 lowercase hex/);
  assert.throws(() => N.stampBody({ sha256: h, bytes: -1 }), /whole number of bytes/);
  assert.throws(() => N.stampBody({ sha256: h, bytes: 1.5 }), /whole number of bytes/);
  assert.throws(() => N.stampBody({ sha256: h, bytes: 1, name: 'a\u0000b' }), /no control or direction/);
  assert.throws(() => N.stampBody({ sha256: h, bytes: 1, name: '\u202eabc' }), /no control or direction/);
  assert.throws(() => N.stampBody({ sha256: h, bytes: 1, note: 'n'.repeat(141) }), /at most 140/);
  assert.throws(() => N.stampBody({ sha256: h, bytes: 1, name: 'n'.repeat(61) }), /at most 60/);
  // what the writer produces, the reader accepts, for awkward but legal text
  for (const name of ['a', 'résumé.pdf', 'file (1).txt', '日本語.txt', 'x'.repeat(60)]) assert.equal(N.parseStamp(N.stampBody({ sha256: h, bytes: 7, name })).name, name);
});

// ================================================================ hashing

test('hashing is SHA-256 of the exact bytes: the same as node’s, for text, bytes and files, and the file goes nowhere', async () => {
  assert.deepEqual(await N.hashText('hello'), { sha256: '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824', bytes: 5 });
  assert.deepEqual(await N.hashText(''), { sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', bytes: 0 });
  assert.deepEqual(await N.hashText('  spaced \n'), { sha256: sha('  spaced \n'), bytes: 10 }, 'no trimming');
  assert.equal((await N.hashText('é')).bytes, 2, 'bytes, not characters');
  const bytes = Uint8Array.from({ length: 5000 }, (_, i) => (i * 31) % 256);
  assert.deepEqual(await N.hashFile(bytes), { sha256: sha(bytes), bytes: 5000 });
  assert.deepEqual(await N.hashFile(bytes.buffer), { sha256: sha(bytes), bytes: 5000 });
  assert.deepEqual(await N.hashFile(new Blob([bytes])), { sha256: sha(bytes), bytes: 5000 });
  assert.equal((await N.hashFile(new Blob([]))).sha256, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  await assert.rejects(() => N.hashFile({ size: 65 * 1048576, arrayBuffer: async () => { throw new Error('must not read'); } }), /files up to 64 MiB/);
  await assert.rejects(() => N.hashFile('a string'), /not a file/);
  await assert.rejects(() => N.hashFile(null), /not a file/);
  // the SDK's own SHA-256 agrees with node's too (the fallback when WebCrypto is absent)
  assert.equal(K.pcc.bytesToHex(K.pcc.sha256(bytes)), sha(bytes));
  assert.equal(await K.sha256Hex(bytes), sha(bytes));
});

test('a pasted hash is taken in the forms people paste it, and nothing else', () => {
  const h = sha('x');
  assert.equal(N.parsePastedHash(h), h);
  assert.equal(N.parsePastedHash('  ' + h.toUpperCase() + '\n'), h);
  assert.equal(N.parsePastedHash('sha256:' + h), h);
  assert.equal(N.parsePastedHash('SHA-256: ' + h), h);
  assert.equal(N.parsePastedHash('sha256=' + h), h);
  for (const bad of ['', 'abc', h.slice(1), h + '0', 'g'.repeat(64), h + ' ' + h, null, undefined, 5]) assert.equal(N.parsePastedHash(bad), null, String(bad));
});

// ================================================================ receipts

test('a receipt keeps where the stamp is and which file it is for, and is read back strictly', () => {
  const r = N.makeReceipt({ chainId: 'pointcast-devnet-2', genesis: GENESIS, api: 'http://127.0.0.1:8799', txHash: HEX('1'), height: 92, blockHash: HEX('2'), timeMs: 1792480000000, sender: 'tz1abc', bodyHash: HEX('3'), sha256: HEX('4'), bytes: 25, name: 'fixture.txt', note: 'n', createdMs: 1792480001000 });
  assert.equal(r.format, 'pointcast-notary-receipt/v1');
  assert.match(r.meaning, /not who wrote the file\. devnet: no value, may reset\./);
  assert.equal(r.created, '2026-10-20T07:06:41.000Z');
  const back = N.readReceipt(JSON.stringify(r));
  assert.deepEqual({ tx: back.txHash, h: back.height, g: back.genesis, f: back.sha256, b: back.bytes, n: back.name }, { tx: HEX('1'), h: 92, g: GENESIS, f: HEX('4'), b: 25, n: 'fixture.txt' });
  assert.deepEqual(N.readReceipt(r), back, 'an object is read the same as its text');
  const lean = N.makeReceipt({ chainId: 'c', genesis: GENESIS, api: 'a', txHash: HEX('1'), height: 1, sender: 's', bodyHash: HEX('3'), sha256: HEX('4'), bytes: 0 });
  assert.equal('name' in lean.file, false);
  for (const bad of ['', 'nope', '[]', '{}', JSON.stringify({ ...r, format: 'x' }), JSON.stringify({ ...r, devnet: { chain_id: 'c', genesis: 'short' } }), JSON.stringify({ ...r, stamp: { ...r.stamp, tx: 'z' } }),
    JSON.stringify({ ...r, stamp: { ...r.stamp, height: 0 } }), JSON.stringify({ ...r, stamp: { ...r.stamp, height: 1.5 } }), JSON.stringify({ ...r, file: { sha256: 'bad', bytes: 1 } }), JSON.stringify({ ...r, file: { sha256: HEX('4'), bytes: -3 } }), 'x'.repeat(30000), null, 5]) {
    assert.throws(() => N.readReceipt(bad), /not a Notary receipt|not JSON|too large/, String(bad).slice(0, 40));
  }
  // hostile text in a receipt is cut to a short plain line
  const evil = '<img src=x onerror=alert(1)>' + 'z'.repeat(300);
  const e = N.readReceipt({ ...r, file: { ...r.file, name: evil, note: evil }, stamp: { ...r.stamp, sender: evil }, devnet: { ...r.devnet, api: evil, chain_id: evil } });
  assert.ok(e.name.length <= 60 && e.note.length <= 140 && e.sender.length <= 80 && e.api.length <= 120 && e.chainId.length <= 64);
});

// ================================================================ finding stamps

test('the recorded devnet holds three stamps, and findStamps finds each by its hash alone', async () => {
  assert.ok(STAMPS.length >= 3, 'the recording has stamps: ' + STAMPS.length);
  for (const s of STAMPS) {
    const want = N.parseStamp(s.body);
    assert.ok(want, 'every recorded stamp reads back');
    const f = await N.findStamps(netFor(), want.sha256);
    assert.equal(f.stamps.length, 1, want.sha256.slice(0, 12));
    assert.equal(f.stamps[0].height, s.height);
    assert.equal(f.stamps[0].txHash, K.pcc.txHash(s.stx));
    assert.equal(f.stamps[0].sender, s.stx.tx.sender);
    assert.deepEqual(f.stamps[0].stamp, want);
    assert.equal(f.complete, true, 'it reached the oldest block');
    assert.ok(f.scannedBlocks > 40);
  }
  const k = await N.findStamps(netFor(), sha(KNOWN_TEXT));
  assert.equal(k.stamps[0].stamp.name, 'fixture.txt');
  assert.equal(k.stamps[0].stamp.note, 'recorded for the tests');
  assert.equal(k.stamps[0].stamp.bytes, KNOWN_TEXT.length);
  assert.ok(k.stamps[0].timeMs > 1.79e12);
  // a hash nobody stamped is not found, and the scan says how far it looked
  const none = await N.findStamps(netFor(), HEX('e'));
  assert.deepEqual(none.stamps, []);
  assert.equal(none.complete, true);
  await assert.rejects(() => N.findStamps(netFor(), 'nope'), /64 lowercase hex/);
});

test('findStamps pages through GET /feed with `before`, and says "complete" only when it reached the oldest block', async () => {
  const log = [];
  const net = netFor({ log });
  const a = await N.findStamps(net, sha(KNOWN_TEXT), { limit: 5 });
  assert.equal(a.stamps.length, 1);
  assert.ok(a.pages >= 8, 'five blocks a page: ' + a.pages);
  assert.ok(log.some((l) => /^GET \/feed\?limit=5&before=\d+$/.test(l)));
  assert.equal(a.complete, true);
  // stopping at the page limit is not "complete": not found would then mean only "not in the newest N"
  const cut = await N.findStamps(netFor(), HEX('e'), { limit: 5, maxPages: 2 });
  assert.equal(cut.complete, false);
  assert.equal(cut.pages, 2);
  assert.ok(cut.scannedBlocks <= 10);
  // the stamp from block 1 of the scan is still found if the scan reaches it
  const all = await N.findStamps(netFor(), sha(KNOWN_TEXT), { limit: 500 });
  assert.equal(all.pages, 2, 'a page of everything, then the empty page that ends it');
});

test('a post on NOTARY that is not a stamp, a stamp on another channel and a body that lies are not stamps', async () => {
  const h = sha('a trap');
  const blocks = clone(FX.blocks);
  const bodies = { ...FX.bodies };
  const mk = (channel, body) => {
    const bodyHash = K.pcc.bodyHash(body);
    bodies[bodyHash] = body;
    return { tx: { sender: 'tz1WspKrkkKjHhXeWPJEZJusB7dEjFgJ3uME', nonce: 0, type: 'publish_block', channel, title: 't', body_hash: bodyHash, media_uri: null }, public_key: { scheme: 'ed25519', bytes: HEX('1') }, signature: '2'.repeat(128) };
  };
  const good = N.stampBody({ sha256: h, bytes: 1 });
  blocks[10].txs.push(mk('FD', good), mk('NOTARY', good + '\nextra'), mk('NOTARY', good.replace('notary/v1', 'notary/v2')), mk('NOTARY', 'sha256:' + h));
  const f = await N.findStamps(netFor({ blocks, bodies }), h);
  assert.deepEqual(f.stamps, [], 'none of the four counts');
  blocks[11].txs.push(mk('NOTARY', good));
  const g = await N.findStamps(netFor({ blocks, bodies }), h);
  assert.equal(g.stamps.length, 1, 'a real one does');
  // two stamps of one hash: the earliest is first
  blocks[40].txs.push(mk('NOTARY', good));
  const two = await N.findStamps(netFor({ blocks, bodies }), h);
  assert.deepEqual(two.stamps.map((s) => s.height), [blocks[11].header.height, blocks[40].header.height]);
});

// ================================================================ checking a stamp

const REF = { height: KNOWN ? KNOWN.height : 0, txHash: KNOWN_TX };
const check = (o = {}) => N.checkStamp({ api: 'http://127.0.0.1:8799', genesis: GENESIS, pinSource: 'pinned', ref: REF, sha256: sha(KNOWN_TEXT), env: { fetch: fakeDevnet(o.devnet || {}) }, ...o.args });
const states = (r) => Object.fromEntries(r.checks.map((c) => [c.id, c.state]));

test('a recorded stamp passes the Verify a block steps and the Notary’s own: STAMPED, and it says it is the newest block', async () => {
  const r = await check();
  assert.equal(r.verdict, 'STAMPED', r.checks.map((c) => c.state + ' ' + c.text).join('\n'));
  assert.deepEqual(states(r), { present: 'pass', kind: 'pass', body: 'pass', file: 'pass', steps: 'pass' });
  assert.equal(r.newest, KNOWN.height === FX.tip, 'block 92 is the tip, so its forward link has no next block to read');
  assert.match(r.checks.find((c) => c.id === 'steps').text, /newest block, so the next block has not yet named its hash|passes every Verify a block check/);
  assert.deepEqual(r.report.failed, []);
  assert.equal(r.stamp.sha256, sha(KNOWN_TEXT));
  assert.equal(r.stamp.name, 'fixture.txt');
  assert.equal(r.stamp.height, KNOWN.height);
  assert.equal(r.stamp.sender, KNOWN.stx.tx.sender);
  assert.equal(r.stamp.bodyHash, KNOWN.stx.tx.body_hash);
  // an older stamp has a next block, so every step passes with nothing skipped
  const older = STAMPS.find((s) => s.height < FX.tip - 3);
  const want = N.parseStamp(older.body);
  const o = await N.checkStamp({ api: 'http://127.0.0.1:8799', genesis: GENESIS, pinSource: 'pinned', ref: { height: older.height, txHash: K.pcc.txHash(older.stx) }, sha256: want.sha256, env: { fetch: fakeDevnet() } });
  assert.equal(o.verdict, 'STAMPED');
  assert.equal(o.newest, false);
  assert.deepEqual(o.report.skipped, []);
});

test('the wrong file: the stamp is real but names another hash, so NOT STAMPED, with the two hashes named', async () => {
  const r = await check({ args: { sha256: HEX('d') } });
  assert.equal(r.verdict, 'NOT STAMPED');
  assert.equal(states(r).file, 'fail');
  assert.match(r.checks.find((c) => c.id === 'file').text, /names a different SHA-256 \([0-9a-f]{16}…\) from your file’s \(dddddddddddddddd…\)/);
  assert.equal(states(r).present, 'pass', 'the stamp itself is fine');
});

test('flip one byte of the stamp’s signature in its block: the Verify a block steps go red and the verdict is NOT STAMPED', async () => {
  const blocks = clone(FX.blocks);
  const b = blocks.find((x) => x.header.height === KNOWN.height);
  const t = b.txs.find((x) => K.pcc.txHash(x) === KNOWN_TX);
  t.signature = (t.signature[0] === '0' ? '1' : '0') + t.signature.slice(1);
  // the stamp's tx id changes with its signature, so look it up by the new id
  const newTx = K.pcc.txHash(t);
  const r = await N.checkStamp({ api: 'http://127.0.0.1:8799', genesis: GENESIS, pinSource: 'pinned', ref: { height: KNOWN.height, txHash: newTx }, sha256: sha(KNOWN_TEXT), env: { fetch: fakeDevnet({ blocks }) } });
  assert.equal(r.verdict, 'NOT STAMPED');
  assert.equal(states(r).steps, 'fail');
  assert.ok(r.report.failed.some((id) => /tx_root|sig/.test(id)), r.report.failed.join());
  assert.equal(states(r).present, 'fail', 'the block’s tx_root no longer rebuilds from its transactions');
});

test('remove the stamp’s transaction from its block, or point at a block that does not hold it: present fails', async () => {
  const blocks = clone(FX.blocks);
  const b = blocks.find((x) => x.header.height === KNOWN.height);
  b.txs = b.txs.filter((x) => K.pcc.txHash(x) !== KNOWN_TX);
  const r = await check({ devnet: { blocks } });
  assert.equal(r.verdict, 'NOT STAMPED');
  assert.equal(states(r).present, 'fail');
  assert.match(r.checks[0].text, /does not hold a transaction with the id /);
  const other = await N.checkStamp({ api: 'http://127.0.0.1:8799', genesis: GENESIS, pinSource: 'pinned', ref: { height: KNOWN.height - 2, txHash: KNOWN_TX }, sha256: sha(KNOWN_TEXT), env: { fetch: fakeDevnet() } });
  assert.equal(states(other).present, 'fail');
});

test('edit the stamp’s body on the devnet and the body check fails: its hash no longer matches what was signed; remove it and the check is skipped, not passed', async () => {
  const bodies = { ...FX.bodies, [KNOWN.stx.tx.body_hash]: KNOWN.body.replace('fixture.txt', 'changed.txt') };
  const r = await check({ devnet: { bodies } });
  assert.equal(r.verdict, 'NOT STAMPED');
  assert.equal(states(r).body, 'fail');
  assert.equal(r.stamp, null);
  const gone = { ...FX.bodies };
  delete gone[KNOWN.stx.tx.body_hash];
  const s = await check({ devnet: { bodies: gone } });
  assert.equal(s.verdict, 'PARTLY');
  assert.equal(states(s).body, 'skip');
  assert.match(s.checks.find((c) => c.id === 'body').text, /no longer serves the stamp’s body/);
  // a body the caller already holds is used without asking the devnet
  const given = await check({ devnet: { bodies: gone }, args: { body: KNOWN.body } });
  assert.equal(given.verdict, 'STAMPED');
});

test('a devnet with another genesis fails at the pin and reads nothing further to trust; a local override is PARTLY and says why', async () => {
  const log = [];
  const r = await N.checkStamp({ api: 'http://127.0.0.1:8799', genesis: HEX('9'), pinSource: 'pinned', ref: REF, sha256: sha(KNOWN_TEXT), env: { fetch: fakeDevnet({ log }) } });
  assert.equal(r.verdict, 'NOT STAMPED');
  assert.equal(r.checks.length, 1);
  assert.equal(r.checks[0].id, 'pin');
  assert.match(r.checks[0].text, /probably reset, and the stamp is gone from it/);
  assert.ok(log.every((p) => p.startsWith('GET ')));
  const local = await N.checkStamp({ api: 'http://127.0.0.1:8799', genesis: null, pinSource: 'node', ref: REF, sha256: sha(KNOWN_TEXT), env: { fetch: fakeDevnet() } });
  assert.equal(local.verdict, 'PARTLY');
  assert.equal(states(local).pin, 'skip');
  assert.match(local.checks.find((c) => c.id === 'pin').text, /taken from the devnet itself, not pinned/);
});

test('a block that is not on the devnet is an error that says so, never a pass', async () => {
  await assert.rejects(() => N.checkStamp({ api: 'http://127.0.0.1:8799', genesis: GENESIS, ref: { height: 99999, txHash: KNOWN_TX }, sha256: sha(KNOWN_TEXT), env: { fetch: fakeDevnet() } }), /is not on the devnet/);
  assert.deepEqual(await N.lookupTx(netFor(), KNOWN_TX), { status: 'included', height: KNOWN.height });
  assert.deepEqual(await N.lookupTx(netFor(), HEX('7')), { status: 'unknown', height: null });
  await assert.rejects(() => N.lookupTx(netFor(), 'nope'), /64 hex/);
});

// ================================================================ stamping (no network: a stand-in client captures what would be sent)

async function fakeStamping() {
  const sent = [];
  const stored = [];
  const key = await K.keyFromSeed('71'.repeat(32));
  const domain = K.pcc.domainOf(FX.status.chain_id, GENESIS);
  const chain = {
    domain,
    chainId: FX.status.chain_id,
    genesisHash: GENESIS,
    async buildPublish({ sender, channel, title, body }) {
      stored.push(body);
      return { sender, nonce: 0, type: 'publish_block', channel, title, body_hash: K.pcc.bodyHash(body), media_uri: null };
    },
    async submit(signed) { sent.push(signed); return { txHash: K.pcc.txHash(signed), status: 'pending' }; },
    async waitForTx() { return { height: 4242, index: 0, status: 'included' }; },
  };
  const net = { api: 'http://127.0.0.1:8799', count: 0, get: async (p) => (p === '/block/4242' ? { hash: HEX('5'), timestamp: 1792480000000 } : null) };
  return { chain, net, key, sent, stored, domain };
}

test('stampHash signs one post on NOTARY whose body is the five lines, the signature verifies, and the receipt says where it landed', async () => {
  const { chain, net, key, sent, stored, domain } = await fakeStamping();
  const h = sha(KNOWN_TEXT);
  const r = await N.stampHash({ chain, net, key, sha256: h, bytes: 25, name: 'fixture.txt', note: 'a note', now: () => 1792480002000 });
  assert.equal(sent.length, 1);
  const tx = sent[0].tx;
  assert.equal(tx.type, 'publish_block');
  assert.equal(tx.channel, 'NOTARY');
  assert.equal(tx.title, 'notary/v1 sha256:' + h);
  assert.equal(stored.length, 1);
  assert.equal(stored[0], N.stampBody({ sha256: h, bytes: 25, name: 'fixture.txt', note: 'a note' }));
  assert.equal(tx.body_hash, K.pcc.bodyHash(stored[0]));
  assert.equal(tx.sender, key.sender);
  assert.equal(await K.pcc.verifyEd25519(sent[0].public_key.bytes, K.pcc.hexToBytes(K.pcc.signingHash(tx, domain)), sent[0].signature), true);
  assert.equal(r.height, 4242);
  assert.equal(r.txHash, K.pcc.txHash(sent[0]));
  assert.equal(r.receipt.stamp.block_hash, HEX('5'));
  assert.equal(r.receipt.stamp.time_ms, 1792480000000);
  assert.equal(r.receipt.stamp.sender, key.sender);
  assert.equal(r.receipt.file.sha256, h);
  assert.equal(r.receipt.created, new Date(1792480002000).toISOString());
  assert.deepEqual(N.readReceipt(r.receipt).sha256, h);
  // a bad hash or a name that is not allowed sends nothing
  sent.length = 0;
  await assert.rejects(() => N.stampHash({ chain, net, key, sha256: 'nope', bytes: 1 }), /64 lowercase hex/);
  await assert.rejects(() => N.stampHash({ chain, net, key, sha256: h, bytes: 1, name: 'a\u0001' }), /no control or direction/);
  assert.equal(sent.length, 0);
  // the receipt survives a failure to read the block back
  const noBlock = { ...net, get: async () => { throw new Error('down'); } };
  const r2 = await N.stampHash({ chain, net: noBlock, key, sha256: h, bytes: 1 });
  assert.equal(r2.receipt.stamp.block_hash, '');
  assert.equal(r2.receipt.stamp.height, 4242);
});

// ================================================================ the view (jsdom)

function skeleton() {
  const hooks = [...new Set(src.view.match(/data-nt-[a-z-]+/g))];
  const parts = [];
  for (const h of hooks) {
    if (['data-nt-file', 'data-nt-c-file', 'data-nt-c-receipt-file'].includes(h)) parts.push('<input type="file" ' + h + '>');
    else if (['data-nt-text', 'data-nt-c-receipt-text'].includes(h)) parts.push('<textarea ' + h + '></textarea>');
    else if (['data-nt-paste', 'data-nt-paste-size', 'data-nt-note', 'data-nt-c-hash'].includes(h)) parts.push('<input type="text" ' + h + '>');
    else if (h === 'data-nt-name-box') parts.push('<input type="checkbox" ' + h + ' disabled>');
    else if (['data-nt-text-go', 'data-nt-paste-go', 'data-nt-c-run', 'data-nt-send', 'data-nt-cancel', 'data-nt-review'].includes(h)) parts.push('<button ' + h + '>x</button>');
    else if (h === 'data-nt-receipt') parts.push('<button ' + h + ' hidden>x</button>');
    else if (h === 'data-nt-errors') parts.push('<ul ' + h + ' hidden></ul>');
    else if (h === 'data-nt-confirm') parts.push('<div ' + h + ' hidden></div>');
    else if (h === 'data-nt-result') parts.push('<div ' + h + ' hidden><p data-nt-result-text></p></div>');
    else if (h === 'data-nt-c-out') parts.push('<div ' + h + ' hidden><h3 data-nt-c-verdict></h3><ul data-nt-c-checks></ul><p data-nt-c-detail></p><a data-nt-c-link hidden href="/chain/verify-a-block">x</a></div>');
    else if (h === 'data-nt-genesis') parts.push('<p ' + h + ' hidden></p>');
    else if (['data-nt-result-text', 'data-nt-c-verdict', 'data-nt-c-checks', 'data-nt-c-detail', 'data-nt-c-link'].includes(h)) continue;
    else parts.push('<div ' + h + '></div>');
  }
  const kp = '<div data-key-panel>' + ['status', 'address', 'make', 'forget', 'keep', 'reveal', 'seed', 'copy', 'own', 'own-note', 'use'].map((k) => (k === 'keep' ? '<input type="checkbox" data-kp-keep>' : '<span data-kp-' + k + '></span>')).join('') + '</div>';
  return parts.join('\n') + kp;
}
function mountView({ search = '', fetchOpts = {}, extra = {} } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><section data-notary-app data-state="static" data-api="' + DEVNET.url + '" data-genesis="' + GENESIS + '" data-chain-id="x">' + skeleton() + '</section></body></html>', { url: 'http://localhost/chain/notary/' + search });
  const rootEl = dom.window.document.querySelector('[data-notary-app]');
  const log = fetchOpts.log || [];
  const base = fakeDevnet({ ...fetchOpts, log });
  const fetchFn = async (u, i) => base(String(u).replace(DEVNET.url, 'http://127.0.0.1:8799'), i);
  const c = view.mount(rootEl, { window: dom.window, fetch: fetchFn, storage: null, supported: true, now: () => 1792480100000, ...extra });
  return { dom, rootEl, c, log };
}
const $ = (rootEl, sel) => rootEl.querySelector(sel);
const txt = (rootEl, sel) => ($(rootEl, sel) || {}).textContent;

test('hashing in the page: text, a pasted hash and a file all land in the same place, and say the file went nowhere', async () => {
  const { rootEl, c, log } = mountView();
  await c.begin();
  c.stop?.call?.(c);
  $(rootEl, '[data-nt-text]').value = KNOWN_TEXT;
  $(rootEl, '[data-nt-text-go]').click();
  await tick(30);
  assert.equal(txt(rootEl, '[data-nt-hash]'), sha(KNOWN_TEXT));
  assert.equal(txt(rootEl, '[data-nt-size]'), KNOWN_TEXT.length + ' bytes');
  assert.match(txt(rootEl, '[data-nt-hash-note]'), /^Hashed as UTF-8 text exactly as typed, with no trimming\. The text went nowhere\.$/);
  $(rootEl, '[data-nt-paste]').value = 'SHA256:' + sha('other').toUpperCase();
  $(rootEl, '[data-nt-paste-size]').value = '5';
  $(rootEl, '[data-nt-paste-go]').click();
  await tick(10);
  assert.equal(txt(rootEl, '[data-nt-hash]'), sha('other'));
  assert.equal(txt(rootEl, '[data-nt-size]'), '5 bytes');
  $(rootEl, '[data-nt-paste]').value = 'not a hash';
  $(rootEl, '[data-nt-paste-go]').click();
  assert.match(txt(rootEl, '[data-nt-hash-note]'), /64 hex characters/);
  assert.equal($(rootEl, '[data-nt-hash-note]').dataset.bad, 'yes');
  assert.equal(txt(rootEl, '[data-nt-hash]'), sha('other'), 'a bad paste leaves the last good hash');
  // a File: hashed from its bytes, named, size shown
  const bytes = Uint8Array.from({ length: 3000 }, (_, i) => i % 251);
  await c.takeFile(new File([bytes], 'report.pdf'));
  assert.equal(txt(rootEl, '[data-nt-hash]'), sha(bytes));
  assert.equal(txt(rootEl, '[data-nt-size]'), '3,000 bytes · report.pdf');
  assert.equal($(rootEl, '[data-nt-name-box]').disabled, false, 'the file has a name to offer');
  assert.match(txt(rootEl, '[data-nt-hash-note]'), /Hashed in your browser\. The file went nowhere\./);
  // none of that touched the network except reading the devnet's status once
  assert.deepEqual(log, ['GET /status']);
  // too big a file is said so, in words, and the old hash is cleared
  await c.takeFile({ size: 70 * 1048576, name: 'big.bin', arrayBuffer: async () => { throw new Error('no'); } });
  assert.match(txt(rootEl, '[data-nt-hash-note]'), /files up to 64 MiB/);
  assert.equal(txt(rootEl, '[data-nt-hash]'), 'no file or hash yet');
});

test('multi-line text from a text box is not "exactly as typed": the page says line breaks are LF and shows the byte count; the digest is that of the LF text, not of a CRLF file', async () => {
  const { rootEl, c, dom } = mountView();
  await c.begin();
  // what a Windows text file holds, pasted into a text box: the API value arrives with CR LF already turned into LF
  const windows = 'line one\r\nline two\r\n';
  const area = $(rootEl, '[data-nt-text]');
  area.value = windows;
  assert.equal(area.value, 'line one\nline two\n', 'the browser itself normalises the box (this is the cause)');
  $(rootEl, '[data-nt-text-go]').click();
  await tick(30);
  const lf = 'line one\nline two\n';
  assert.equal(txt(rootEl, '[data-nt-hash]'), sha(lf));
  assert.notEqual(txt(rootEl, '[data-nt-hash]'), sha(windows), 'it can never equal the CRLF file’s sha256sum');
  assert.equal(txt(rootEl, '[data-nt-size]'), '18 bytes', 'the size is the LF text’s, not the 20 bytes of the file');
  const note = txt(rootEl, '[data-nt-hash-note]');
  assert.doesNotMatch(note, /exactly as typed/, 'the claim would be false here');
  assert.match(note, /18 bytes/);
  assert.match(note, /Line breaks are counted as LF/);
  assert.match(note, /CR LF/);
  assert.match(note, /choose the file instead/);
  // a single line has no line breaks to change, and keeps its plain note
  area.value = 'one line';
  $(rootEl, '[data-nt-text-go]').click();
  await tick(30);
  assert.match(txt(rootEl, '[data-nt-hash-note]'), /^Hashed as UTF-8 text exactly as typed, with no trimming\. The text went nowhere\.$/);
  // a file keeps its CRLF bytes: choosing it is the path that matches sha256sum
  await c.takeFile(new File([new TextEncoder().encode(windows)], 'win.txt'));
  assert.equal(txt(rootEl, '[data-nt-hash]'), sha(windows));
  assert.equal(txt(rootEl, '[data-nt-size]'), '20 bytes · win.txt');
  assert.ok(dom);
  assert.doesNotMatch(src.page, /exactly as typed/, 'the page’s placeholder makes no such claim either');
});

test('stamping in the page: the confirm shows the exact post, nothing is sent until Send, and the receipt can be kept', async () => {
  const fake = await fakeStamping();
  const sent = [];
  const connect = async () => ({ ...fake.chain, submit: async (s) => { sent.push(s); return fake.chain.submit(s); } });
  const { rootEl, c, dom } = mountView({ extra: { connect } });
  await c.begin();
  assert.equal($(rootEl, '[data-nt-review]').disabled, true, 'no hash, no key');
  $(rootEl, '[data-nt-text]').value = KNOWN_TEXT;
  $(rootEl, '[data-nt-text-go]').click();
  await tick(30);
  assert.equal($(rootEl, '[data-nt-review]').disabled, true, 'a hash but no key');
  await c.keys.setSeed('71'.repeat(32));
  await tick(30);
  assert.equal($(rootEl, '[data-nt-review]').disabled, false);
  $(rootEl, '[data-nt-note]').value = 'a note for the stamp';
  $(rootEl, '[data-nt-review]').click();
  assert.equal($(rootEl, '[data-nt-confirm]').hidden, false);
  assert.equal(txt(rootEl, '[data-nt-confirm-title]'), 'notary/v1 sha256:' + sha(KNOWN_TEXT));
  assert.equal(txt(rootEl, '[data-nt-confirm-body]'), N.stampBody({ sha256: sha(KNOWN_TEXT), bytes: KNOWN_TEXT.length, note: 'a note for the stamp' }), 'the body, word for word');
  assert.match(txt(rootEl, '[data-nt-confirm-from]'), /^Signed by tz1\w+ and sent to https:\/\/pointcast-devnet\.mhoydich\.workers\.dev|^Signed by tz1\w+ and sent to http:\/\/127\.0\.0\.1:8799/);
  assert.equal(sent.length, 0, 'the confirm box sends nothing');
  $(rootEl, '[data-nt-cancel]').click();
  assert.equal($(rootEl, '[data-nt-confirm]').hidden, true);
  $(rootEl, '[data-nt-review]').click();
  $(rootEl, '[data-nt-send]').click();
  await tick(300);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].tx.channel, 'NOTARY');
  assert.equal($(rootEl, '[data-nt-result]').dataset.state, 'ok');
  assert.match(txt(rootEl, '[data-nt-result-text]'), /^Stamped in block 4242\. Transaction [0-9a-f]{64}\. Keep the receipt: it is how you find and check the stamp later, and the devnet may reset\.$/);
  assert.equal($(rootEl, '[data-nt-receipt]').hidden, false);
  const receipt = JSON.parse(txt(rootEl, '[data-nt-receipt-json]'));
  assert.equal(receipt.format, 'pointcast-notary-receipt/v1');
  assert.equal(receipt.file.sha256, sha(KNOWN_TEXT));
  // Download builds a Blob of the receipt (jsdom has no object URLs, so the test supplies them)
  const made = [];
  dom.window.URL.createObjectURL = (b) => { made.push(b); return 'blob:test/1'; };
  dom.window.URL.revokeObjectURL = () => {};
  $(rootEl, '[data-nt-receipt]').click();
  assert.equal(made.length, 1);
  const blobText = await new Promise((ok) => { const fr = new dom.window.FileReader(); fr.onload = () => ok(String(fr.result)); fr.readAsText(made[0]); });
  assert.equal(JSON.parse(blobText).stamp.tx, receipt.stamp.tx);
  assert.equal(made[0].type, 'application/json');
  // the name goes in only when the box is ticked and the file has one
  await c.takeFile(new File([new Uint8Array([1, 2, 3])], 'secret-plans.docx'));
  $(rootEl, '[data-nt-review]').click();
  assert.doesNotMatch(txt(rootEl, '[data-nt-confirm-body]'), /secret-plans/, 'unticked: the name stays out');
  $(rootEl, '[data-nt-name-box]').checked = true;
  $(rootEl, '[data-nt-review]').click();
  assert.match(txt(rootEl, '[data-nt-confirm-body]'), /\nname:secret-plans\.docx/);
});

test('Send stamps the post the confirm showed, not what the note, the name box or the file hold by then', { timeout: 30000 }, async () => {
  const fake = await fakeStamping();
  const sent = [];
  const gate = { release: null };
  // the genesis check is slow: that is the window in which the page used to read its boxes
  const connect = () => new Promise((ok) => { gate.release = () => ok({ ...fake.chain, submit: async (s) => { sent.push(s); return fake.chain.submit(s); } }); });
  const { rootEl, c, dom } = mountView({ extra: { connect } });
  await c.begin();
  $(rootEl, '[data-nt-text]').value = KNOWN_TEXT;
  $(rootEl, '[data-nt-text-go]').click();
  await tick(30);
  await c.keys.setSeed('71'.repeat(32));
  await tick(30);
  $(rootEl, '[data-nt-note]').value = 'note A: what I reviewed';
  $(rootEl, '[data-nt-review]').click();
  assert.match(txt(rootEl, '[data-nt-confirm-body]'), /note:note A: what I reviewed$/);
  // 1. editing the note withdraws the confirm: the post it showed no longer matches the box
  $(rootEl, '[data-nt-note]').value = 'note B: typed after review, never shown';
  $(rootEl, '[data-nt-note]').dispatchEvent(new dom.window.Event('input'));
  assert.equal($(rootEl, '[data-nt-confirm]').hidden, true, 'a changed note takes the confirm away');
  $(rootEl, '[data-nt-send]').click();
  await tick(30);
  assert.equal(sent.length, 0, 'with no confirm there is nothing to send');
  // 2. the confirm is up for A, the person sends, and while the check is slow they change the note and the file
  $(rootEl, '[data-nt-note]').value = 'note A: what I reviewed';
  $(rootEl, '[data-nt-review]').click();
  $(rootEl, '[data-nt-send]').click();
  await tick(20);
  $(rootEl, '[data-nt-note]').value = 'note B: typed after review, never shown';
  $(rootEl, '[data-nt-text]').value = 'a different text entirely';
  $(rootEl, '[data-nt-text-go]').click();
  await tick(30);
  assert.equal(txt(rootEl, '[data-nt-hash]'), sha(KNOWN_TEXT), 'a new text is not taken while a stamp is on its way');
  assert.match(txt(rootEl, '[data-nt-hash-note]'), /A stamp is being sent/);
  gate.release();
  await tick(300);
  assert.equal(sent.length, 1);
  assert.deepEqual(fake.stored, [N.stampBody({ sha256: sha(KNOWN_TEXT), bytes: KNOWN_TEXT.length, note: 'note A: what I reviewed' })], 'the body that went out is the one the confirm showed');
  assert.equal(sent[0].tx.title, 'notary/v1 sha256:' + sha(KNOWN_TEXT));
  const receipt = JSON.parse(txt(rootEl, '[data-nt-receipt-json]'));
  assert.equal(receipt.file.note, 'note A: what I reviewed');
  assert.equal(receipt.file.sha256, sha(KNOWN_TEXT));
  // once it has landed, the next file can be taken
  $(rootEl, '[data-nt-text-go]').click();
  await tick(30);
  assert.equal(txt(rootEl, '[data-nt-hash]'), sha('a different text entirely'));
});

test('a refused stamp says what the devnet said and leaves the button usable', async () => {
  const fake = await fakeStamping();
  const connect = async () => ({ ...fake.chain, submit: async () => { throw new K.KitError('slow down: per-IP limit on signed txs', { status: 429 }); } });
  const { rootEl, c } = mountView({ extra: { connect } });
  await c.begin();
  await c.takeFile(new File([new Uint8Array([9])], 'x.bin'));
  await c.keys.setSeed('72'.repeat(32));
  await tick(30);
  $(rootEl, '[data-nt-review]').click();
  $(rootEl, '[data-nt-send]').click();
  await tick(300);
  assert.equal($(rootEl, '[data-nt-result]').dataset.state, 'bad');
  // the devnet gave no Retry-After and no per-minute window, so no retry time is invented
  assert.match(txt(rootEl, '[data-nt-result-text]'), /^Not sent, or not confirmed: slow down: per-IP limit on signed txs$/);
  assert.equal($(rootEl, '[data-nt-send]').disabled, false);
  assert.equal($(rootEl, '[data-nt-receipt]').hidden, true);
});

test('checking in the page: a pasted hash finds the stamp and shows STAMPED with the block, the time and the sender; the link goes to that block', async () => {
  const { rootEl, c } = mountView();
  await c.begin();
  $(rootEl, '[data-nt-c-hash]').value = sha(KNOWN_TEXT);
  $(rootEl, '[data-nt-c-run]').click();
  await tick(200);
  assert.equal($(rootEl, '[data-nt-c-out]').dataset.state, 'ok');
  assert.equal(txt(rootEl, '[data-nt-c-verdict]'), 'STAMPED');
  const checks = [...rootEl.querySelectorAll('[data-nt-c-checks] li')].map((l) => l.dataset.state);
  assert.deepEqual(checks, ['pass', 'pass', 'pass', 'pass', 'pass']);
  const detail = txt(rootEl, '[data-nt-c-detail]');
  assert.match(detail, new RegExp('^Block ' + KNOWN.height + ' · 2026-10-20 \\d\\d:\\d\\d:\\d\\d UTC · sent by tz1\\w+…\\w+ · name “fixture\\.txt” · note “recorded for the tests” · ' + KNOWN_TEXT.length + ' bytes$'));
  const link = $(rootEl, '[data-nt-c-link]');
  assert.equal(link.hidden, false);
  assert.equal(link.getAttribute('href'), '/chain/verify-a-block#b=' + KNOWN.height);
  // a hash nobody stamped: NOT FOUND, and it says not found is not proof
  $(rootEl, '[data-nt-c-hash]').value = HEX('e');
  $(rootEl, '[data-nt-c-run]').click();
  await tick(200);
  assert.equal(txt(rootEl, '[data-nt-c-verdict]'), 'NOT FOUND');
  assert.equal($(rootEl, '[data-nt-c-out]').dataset.state, 'bad');
  assert.match(txt(rootEl, '[data-nt-c-detail]'), /^No stamp of this hash in the newest \d+ blocks that carry transactions \(that is every block the devnet has\)\. Not found is not proof it was never stamped/);
  assert.equal($(rootEl, '[data-nt-c-link]').hidden, true);
  // nothing to check
  $(rootEl, '[data-nt-c-hash]').value = '';
  $(rootEl, '[data-nt-c-run]').click();
  await tick(50);
  assert.equal(txt(rootEl, '[data-nt-c-verdict]'), 'NOTHING TO CHECK');
});

test('a receipt that points at a transaction that is not a stamp is NOT STAMPED without calling that transaction a stamp, and a pasted hash needs a size to be stamped', async () => {
  // a transfer, a post on another channel and a seal in the recording: none is a Notary post, so there is no stamp body to read
  const others = [];
  for (const b of FX.blocks) for (const t of b.txs) if (!(t.tx.type === 'publish_block' && t.tx.channel === 'NOTARY')) others.push({ height: b.header.height, hash: K.pcc.txHash(t), type: t.tx.type });
  const kinds = new Set(others.map((o) => o.type));
  assert.ok(kinds.has('transfer') && kinds.size >= 2, 'the recording holds more than one kind of transaction that is not a stamp: ' + [...kinds].join());
  for (const type of kinds) {
    const o = others.find((x) => x.type === type);
    const r = await N.checkStamp({ api: 'http://127.0.0.1:8799', genesis: GENESIS, pinSource: 'pinned', ref: { height: o.height, txHash: o.hash }, sha256: sha(KNOWN_TEXT), env: { fetch: fakeDevnet() } });
    assert.equal(r.verdict, 'NOT STAMPED', type);
    assert.equal(states(r).kind, 'fail', type);
    assert.equal(states(r).body, undefined, type + ': no body check at all for a transaction that has no stamp body');
    assert.ok(!r.checks.some((c) => /stamp’s body/.test(c.text)), type + ': nothing calls it a stamp');
    assert.equal(r.stamp, null);
  }
  // a pasted hash with no size is taken but cannot be stamped: the page will not put a made-up size on chain
  const fake = await fakeStamping();
  const sent = [];
  const { rootEl, c } = mountView({ extra: { connect: async () => ({ ...fake.chain, submit: async (s) => { sent.push(s); return fake.chain.submit(s); } }) } });
  await c.begin();
  await c.keys.setSeed('71'.repeat(32));
  await tick(30);
  $(rootEl, '[data-nt-paste]').value = sha('some file');
  $(rootEl, '[data-nt-paste-go]').click();
  assert.equal(txt(rootEl, '[data-nt-size]'), 'size not given');
  assert.match(txt(rootEl, '[data-nt-hash-note]'), /type the file’s size in bytes/);
  $(rootEl, '[data-nt-review]').click();
  assert.equal($(rootEl, '[data-nt-confirm]').hidden, true, 'no confirm for a stamp that would carry bytes:0 by default');
  assert.match(txt(rootEl, '[data-nt-errors]'), /A stamp carries the file’s size in bytes/);
  $(rootEl, '[data-nt-paste-size]').value = '0';
  $(rootEl, '[data-nt-paste-go]').click();
  $(rootEl, '[data-nt-review]').click();
  assert.equal($(rootEl, '[data-nt-confirm]').hidden, false, 'a typed 0 is a size (an empty file)');
  assert.match(txt(rootEl, '[data-nt-confirm-body]'), /\nbytes:0$/);
  assert.equal(sent.length, 0);
});

test('checking says which input it used, and when a file and a hash are both filled the one touched last wins', async () => {
  const { rootEl, c, dom } = mountView();
  await c.begin();
  const fileEl = $(rootEl, '[data-nt-c-file]');
  const setFiles = (files) => Object.defineProperty(fileEl, 'files', { value: files, configurable: true });
  const bytes = new TextEncoder().encode('some other file');
  setFiles([new File([bytes], 'old-choice.bin')]);
  fileEl.dispatchEvent(new dom.window.Event('change'));
  // later the person pastes the hash of the stamped text: that is what they mean
  $(rootEl, '[data-nt-c-hash]').value = sha(KNOWN_TEXT);
  $(rootEl, '[data-nt-c-hash]').dispatchEvent(new dom.window.Event('input'));
  $(rootEl, '[data-nt-c-run]').click();
  await tick(250);
  assert.equal(txt(rootEl, '[data-nt-c-verdict]'), 'STAMPED', 'the pasted hash, not the leftover file, was checked');
  assert.match(txt(rootEl, '[data-nt-c-from]'), new RegExp('^Checked against the pasted hash ' + sha(KNOWN_TEXT).slice(0, 12) + '…'));
  // pick a file again: now the file wins, and the page names it
  fileEl.dispatchEvent(new dom.window.Event('change'));
  $(rootEl, '[data-nt-c-run]').click();
  await tick(250);
  assert.match(txt(rootEl, '[data-nt-c-from]'), /^Checked against the file old-choice\.bin \(SHA-256 [0-9a-f]{12}…[0-9a-f]{8}\)\.$/);
  assert.equal(txt(rootEl, '[data-nt-c-verdict]'), 'NOT FOUND');
  // nothing to check clears the line
  setFiles([]);
  $(rootEl, '[data-nt-c-hash]').value = '';
  $(rootEl, '[data-nt-c-run]').click();
  await tick(50);
  assert.equal(txt(rootEl, '[data-nt-c-from]'), '');
});

test('checking with a receipt goes straight to the stamp’s block; a receipt for another devnet, or another file, or garbage, is said so', async () => {
  const { rootEl, c, log } = mountView();
  await c.begin();
  const receipt = N.makeReceipt({ chainId: FX.status.chain_id, genesis: GENESIS, api: 'x', txHash: KNOWN_TX, height: KNOWN.height, sender: KNOWN.stx.tx.sender, bodyHash: KNOWN.stx.tx.body_hash, sha256: sha(KNOWN_TEXT), bytes: KNOWN_TEXT.length });
  // the page pins the genesis it was built with; the recording is a different devnet only under ?devnet=, so use the local override page for the same-devnet case
  const local = mountView({ search: '?devnet=http://127.0.0.1:8799&genesis=' + GENESIS });
  await local.c.begin();
  const before = local.log.length;
  $(local.rootEl, '[data-nt-c-hash]').value = sha(KNOWN_TEXT);
  $(local.rootEl, '[data-nt-c-receipt-text]').value = JSON.stringify(receipt);
  $(local.rootEl, '[data-nt-c-run]').click();
  await tick(250);
  assert.equal(txt(local.rootEl, '[data-nt-c-verdict]'), 'STAMPED');
  assert.ok(!local.log.slice(before).some((p) => p.startsWith('GET /feed')), 'with a receipt it does not scan the feed');
  assert.ok(local.log.slice(before).some((p) => p === 'GET /raw/block/' + KNOWN.height));
  // a receipt for another file: the check runs and the file check fails
  $(local.rootEl, '[data-nt-c-hash]').value = HEX('c');
  $(local.rootEl, '[data-nt-c-run]').click();
  await tick(250);
  assert.equal(txt(local.rootEl, '[data-nt-c-verdict]'), 'NOT STAMPED');
  assert.match(txt(local.rootEl, '[data-nt-c-detail]'), /The receipt is for a different file/);
  // a receipt for another devnet
  $(local.rootEl, '[data-nt-c-receipt-text]').value = JSON.stringify({ ...receipt, devnet: { ...receipt.devnet, genesis: HEX('8') } });
  $(local.rootEl, '[data-nt-c-run]').click();
  await tick(100);
  assert.equal(txt(local.rootEl, '[data-nt-c-verdict]'), 'NOT THIS DEVNET');
  // garbage
  $(local.rootEl, '[data-nt-c-receipt-text]').value = '{"format":"x"}';
  $(local.rootEl, '[data-nt-c-run]').click();
  await tick(50);
  assert.equal(txt(local.rootEl, '[data-nt-c-verdict]'), 'THAT IS NOT A RECEIPT');
  assert.ok(log.every((p) => p.startsWith('GET ')) && local.log.every((p) => p.startsWith('GET ')), 'checking only reads');
});

test('hostile text in a stamp is shown as plain text and makes no element', async () => {
  const evil = '<img src=x onerror=alert(1)><script>alert(1)</script>';
  const blocks = clone(FX.blocks);
  const bodies = { ...FX.bodies };
  const h = sha('evil file');
  // a stamp whose name and note are the longest legal hostile-looking text
  const body = N.stampBody({ sha256: h, bytes: 4, name: '<b>bold</b>"\'&', note: '<img src=x onerror=alert(1)>' });
  const bodyHash = K.pcc.bodyHash(body);
  bodies[bodyHash] = body;
  const tx = clone(KNOWN.stx);
  tx.tx.body_hash = bodyHash;
  blocks.find((b) => b.header.height === KNOWN.height).txs[0] = tx;
  const { rootEl, c } = mountView({ fetchOpts: { blocks, bodies }, search: '?devnet=http://127.0.0.1:8799' });
  await c.begin();
  $(rootEl, '[data-nt-c-hash]').value = h;
  $(rootEl, '[data-nt-c-run]').click();
  await tick(250);
  assert.ok(evil.length > 10);
  assert.equal(rootEl.querySelectorAll('img, script, iframe, object, embed, [onerror], [onload], style').length, 0, 'no element the stamp could have asked for');
  assert.match(txt(rootEl, '[data-nt-c-detail]'), /name “<b>bold<\/b>"'&” · note “<img src=x onerror=alert\(1\)>”/);
  for (const el of rootEl.querySelectorAll('*')) for (const a of el.attributes) assert.ok(!/^(on|srcdoc|style|action|formaction)/i.test(a.name), a.name);
});

test('a reset shows GENESIS CHANGED, stops the page and cannot stamp', async () => {
  const log = [];
  const { rootEl, c } = mountView({ fetchOpts: { log, status: { ...FX.status, genesis_hash: HEX('9') } } });
  await c.begin();
  assert.equal(rootEl.dataset.state, 'changed');
  assert.equal($(rootEl, '[data-nt-genesis]').hidden, false);
  assert.match(txt(rootEl, '[data-nt-genesis]'), /GENESIS CHANGED/);
  assert.deepEqual(log, ['GET /status']);
  await c.takeFile(new File([new Uint8Array([1])], 'a'));
  await c.keys.setSeed('73'.repeat(32));
  await tick(30);
  assert.equal($(rootEl, '[data-nt-review]').disabled, true, 'the review button is off after a reset');
  const plan = c.planStamp();
  assert.equal(plan.ok, false);
  assert.match(plan.errors.join(), /The devnet was reset; nothing can be sent/);
});

test('an unreachable devnet is said so, and hashing still works', async () => {
  const { rootEl, c } = mountView({ fetchOpts: { overrides: { '/status': async () => { throw new TypeError('Failed to fetch'); } } } });
  await c.begin();
  assert.equal(rootEl.dataset.state, 'down');
  assert.match(txt(rootEl, '[data-nt-status]'), /devnet did not answer: .*You can still hash a file here; stamping needs the devnet\.$/);
  $(rootEl, '[data-nt-text]').value = 'still works';
  $(rootEl, '[data-nt-text-go]').click();
  await tick(30);
  assert.equal(txt(rootEl, '[data-nt-hash]'), sha('still works'));
});

test('?devnet= is honoured only for localhost and 127.0.0.1, and the page starts lazily', () => {
  assert.equal(mountView({ search: '?devnet=http://127.0.0.1:8799' }).c.where.api, 'http://127.0.0.1:8799');
  for (const bad of ['?devnet=https://pointcast-devnet.mhoydich.workers.dev', '?devnet=http://localhost@evil.example', '?devnet=//127.0.0.1', '?devnet=http://127.0.0.1.evil.example']) {
    const m = mountView({ search: bad });
    assert.equal(m.c.where.api, DEVNET.url, bad);
    assert.equal(m.c.where.genesis, GENESIS, bad);
  }
  const m = mountView();
  assert.deepEqual(m.log, [], 'mount reads nothing');
  assert.equal(m.c.state.begun, false);
  assert.match(code(src.view), /whenReady\(root, \(\) => c\.begin\(\), env\)/);
  assert.match(src.page, /requestIdleCallback/);
});

// ================================================================ rules read off the sources

test('nothing from the devnet becomes markup, a link or a style: the only links are the block-number link and a Blob the page builds — proven by mutation', () => {
  const allow = [/a\.href = win\.URL\.createObjectURL\(blob\);/, /link\.href = '\/chain\/verify-a-block#b=' \+ Number\(ref\.height\);/];
  assertNoSinks(src.view, 'notary-view.js', { allow });
  assertNoSinks(src.logic, 'notary.js');
  assertNoSinks(src.keys, 'key-panel.js');
  const inline = (src.page.match(/<script is:inline[\s\S]*?<\/script>/) || [''])[0];
  assertNoSinks(inline, 'the page script');
  assert.throws(() => assertNoSinks(src.view, 'view'), /a link, source or style sink \(\.href =/);
  assert.throws(() => assertNoSinks(src.view + '\nlink.href = row.url;', 'view', { allow }), /a link, source or style sink/);
  assert.throws(() => assertNoSinks(src.view + '\nn.innerHTML = x;', 'view', { allow }), /an HTML sink/);
  assert.throws(() => assertNoSinks(src.view + '\nn.setAttribute("src", x);', 'view', { allow }), /a link, source or style sink/);
  assert.equal((code(src.view).match(/\.href\s*=/g) || []).length, 2, 'exactly the two allowed');
  assert.match(code(src.view), /Number\(ref\.height\)/);
});

test('the page sends nothing itself: the only writes are the SDK’s /body and /tx under "Send the stamp"; checking reads only', () => {
  assert.doesNotMatch(code(src.logic), /net\.post\(|method\s*:\s*['"]POST|XMLHttpRequest|sendBeacon|\bfetch\s*\(/);
  assert.doesNotMatch(code(src.view), /\.post\(|method\s*:\s*['"]POST|\bfetch\s*\(|XMLHttpRequest|sendBeacon/);
  const reads = callArgs(src.logic, 'net.get(');
  assert.ok(reads.length >= 3, 'reads: ' + reads.join(' ; '));
  for (const arg of reads) assert.ok(/^'\/feed\?limit=' \+ limit \+ \(before === null \? '' : '&before=' \+ before\)$|^'\/block\/' \+ done\.height$|^'\/tx\/' \+ txHash$/.test(arg), arg);
  assert.match(code(src.view), /sendBtn\.addEventListener\('click', send\)/);
  assert.match(code(src.view), /if \(!plan \|\| !plan\.ok \|\| !k \|\| S\.halted\) return;/);
  assert.match(code(src.view), /S\.plan = plan;/);
  // the file is read only by hashFile, and never stored or sent anywhere
  assert.doesNotMatch(code(src.view + src.logic), /localStorage|sessionStorage|indexedDB|FileReader|readAsDataURL|FormData/);
  assert.equal((code(src.logic).match(/arrayBuffer\(\)/g) || []).length, 1, 'one place reads the file’s bytes');
});

test('the page and the view agree on every hook, the key panel is in the page, and the page uses the registry', () => {
  for (const h of new Set(src.view.match(/data-nt-[a-z-]+/g))) assert.ok(src.page.includes(h), h + ' is in the page');
  assert.match(src.page, /<KeyPanel signs="the stamp" id="nt-kp" \/>/);
  assert.match(src.page, /<ChainHeader current="notary"/);
  assert.ok(CHAIN_APPS.some((a) => a.key === 'notary' && a.href === APP.path));
  assert.match(src.page, /import\('\/chain\/apps\/notary-view\.js'\)/);
  assert.match(src.page, /data-genesis=\{DEVNET\.genesis\}/);
  assert.match(src.page, /assertDevnetLaunchPinned\(\)/);
  assert.equal(STAMP_LINES.length, 5);
  assert.deepEqual(STAMP_LINES.map((l) => l.line.split(':')[0].split('/')[0]), ['notary', 'sha256', 'bytes', 'name', 'note']);
});

test('the page is honest: one server’s accountable claim, not proof of authorship, not anchored, a reset wipes it, keep the receipt', () => {
  assert.equal(HONESTY_LINE, 'devnet · no value · may reset');
  const para = (src.page.match(/<p class="ca-honest"[\s\S]*?<\/p>/) || [''])[0];
  for (const needle of ['{HONESTY_LINE}', '{NOT_ANCHORED}', 'accountable claim, not proof of who wrote the file', 'dated and recorded, never silent', '{DEVNET_PREVIOUS.path}', '{notYet(RESET.date)}', 'Keep the receipt']) assert.ok(para.includes(needle), needle);
  assert.match(NOT_ANCHORED, /not anchored to Tezos or any other chain: the devnet does not anchor/);
  assert.equal(DEVNET_PREVIOUS.path, '/chain/yard/devnet-1/');
  assert.match(RESET.date, /^20\d\d-\d\d-\d\d/);
  assert.ok(NOT_PROVES.some((t) => /Who holds the key/.test(t)) && NOT_PROVES.some((t) => /wipes every stamp/.test(t)) && NOT_PROVES.some((t) => /accountable claim, not proof/.test(t)));
  assert.ok(PROVES.length === 3 && PROVES[1].includes('The page checks all of that'));
  assert.match(src.page, /The file stays in your browser/i.source ? /THE FILE STAYS IN YOUR BROWSER/ : /x/);
  assert.match(src.page, /A claim by a key, sealed by a server\./);
  assert.match(src.page, /only its hash goes on chain|only the hash and size/i);
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

test('the page is accessible and responsive by construction: labelled inputs, status regions, a drop zone that is also a button, alerts for errors', () => {
  for (const id of ['nt-file', 'nt-text', 'nt-paste', 'nt-paste-size', 'nt-note', 'nt-c-file', 'nt-c-hash', 'nt-c-rf', 'nt-c-rt']) assert.match(src.page, new RegExp('<label class="ca-label" for="' + id + '">'), id);
  assert.match(src.page, /data-nt-status role="status" aria-live="polite"/);
  assert.match(src.page, /role="alert" hidden/);
  assert.match(src.page, /<input id="nt-file" class="ca-input ca-file" data-nt-file type="file"/);
  assert.match(src.page, /@media \(max-width:760px\)/);
  assert.match(src.page, /<caption>The body of the post on channel/);
  assert.match(src.page, /aria-label="The checks"/);
});

test('the check script on the page is real: it runs under Node against a local devnet and says what the page says', { timeout: 120000 }, async (t) => {
  let up = null;
  try {
    const r = await fetch('http://127.0.0.1:8799/status', { signal: AbortSignal.timeout(4000) });
    up = r.ok ? await r.json() : null;
  } catch { up = null; }
  if (!up || up.genesis_hash !== GENESIS) return t.skip('the local devnet-2 that was recorded is not reachable (or was reset)');
  const feed = await (await fetch('http://127.0.0.1:8799/feed?limit=500')).json();
  const stamped = feed.blocks.flatMap((b) => b.txs.map((x) => ({ b, x }))).find(({ x }) => x.kind === 'publish_block' && x.payload.channel === 'NOTARY' && x.hash === KNOWN_TX);
  if (!stamped) return t.skip('the recorded stamp is not on this local devnet');
  const dir = mkdtempSync(join(tmpdir(), 'notary-snippet-'));
  try {
    cpSync(new URL('public/chain/first-mints/lib/pointcast-chain.js', root), join(dir, 'pointcast-chain.js'));
    writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
    writeFileSync(join(dir, 'notary-check.mjs'), checkSnippet('http://127.0.0.1:8799', GENESIS));
    writeFileSync(join(dir, 'file.txt'), KNOWN_TEXT);
    const run = (file) => spawnSync(process.execPath, [join(dir, 'notary-check.mjs'), join(dir, file), String(stamped.b.height), KNOWN_TX], { encoding: 'utf8', cwd: dir });
    const good = run('file.txt');
    assert.equal(good.status, 0, good.stderr);
    assert.match(good.stdout, /in the block, committed by tx_root: true\nbody hashes to the signed body_hash: true\nbody names your file: true/);
    writeFileSync(join(dir, 'other.txt'), 'a different file');
    const other = run('other.txt');
    assert.match(other.stdout, /body names your file: false/);
    // the wrong genesis is refused before anything is read
    writeFileSync(join(dir, 'notary-check.mjs'), checkSnippet('http://127.0.0.1:8799', HEX('9')));
    const pinned = run('file.txt');
    assert.notEqual(pinned.status, 0);
    assert.match(pinned.stderr, /not the pinned devnet/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ================================================================ the built page (skips while dist/ is absent)

const builtPath = new URL('dist/chain/notary/index.html', root);
test('the built page carries the hooks, the honesty line, the pinned genesis, the key panel and no outside script', { skip: !existsSync(builtPath) && 'dist/ is absent: run npm run build:bare to check the built page' }, () => {
  const html = readFileSync(builtPath, 'utf8');
  for (const h of new Set(src.view.match(/data-nt-[a-z-]+/g))) assert.ok(html.includes(h), h);
  assert.ok(html.includes(HONESTY_LINE));
  assert.ok(html.includes('data-genesis="' + DEVNET.genesis + '"'));
  assert.ok(html.includes('data-key-panel'));
  assert.match(html, /<h1>Stamp a file’s fingerprint\. Check one later\.<\/h1>/);
  assert.match(html, /aria-current="page"[^>]*>Notary</);
  assert.ok(html.includes('notary-check.mjs'), 'the code block is on the page');
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
  test('against ' + label + ': every NOTARY stamp on it is found by its own hash and checks STAMPED or PARTLY, never a failure', async (t) => {
    if (!ep) return t.skip(label + ' is not reachable');
    if (ep.status.genesis_hash !== genesis()) return t.skip(label + ' has a different genesis from the one pinned here');
    const net = K.makeNet(ep.base);
    const feed = await net.get('/feed?limit=100');
    const cards = [];
    let before = null;
    for (let i = 0; i < 20; i++) {
      const page = i === 0 ? feed : await net.get('/feed?limit=100&before=' + before);
      for (const b of page.blocks) for (const x of b.txs) if (x.kind === 'publish_block' && x.payload.channel === 'NOTARY') cards.push({ b, x });
      if (!page.blocks.length || !page.next_before) break;
      before = page.next_before;
    }
    for (const { b, x } of cards.slice(0, 5)) {
      const want = N.parseStamp(x.payload.body);
      if (!want) continue;
      const f = await N.findStamps(net, want.sha256);
      assert.ok(f.stamps.some((s) => s.txHash === x.hash));
      const r = await N.checkStamp({ api: ep.base, genesis: genesis(), pinSource: 'pinned', ref: { height: b.height, txHash: x.hash }, sha256: want.sha256, env: {} });
      assert.ok(['STAMPED', 'PARTLY'].includes(r.verdict), r.verdict + ' ' + JSON.stringify(r.checks.filter((c) => c.state === 'fail')));
    }
    const none = await N.findStamps(net, HEX('e'));
    assert.deepEqual(none.stamps, []);
    assert.equal(none.complete, true);
  });
}
