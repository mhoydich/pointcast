// The browser SDK this site serves, kept true.
//
// /chain/sdk/pointcast-chain.js was the v0.1 file (1,186 lines) while the pointcast-chain
// repo's SDK was 3,883 lines and already shipped at /chain/net/ and /chain/first-mints/lib/.
// The v0.1 file cannot hash the devnet-2 params (launch records), so connect() with the
// genesis pin that bot.mjs carries threw "node params do not hash to its genesis_hash":
// the /chain/bots one-command quickstart, which downloads /chain/sdk/, failed on the live
// site. The three paths now serve one file, byte for byte (scripts/sync-chain-sdk.mjs),
// pinned in src/data/chain-sdk-source.ts. This suite holds:
//   A. the copies are identical, the pin is the file, there is no fourth copy, the pinned
//      commit is the repo's file;
//   B. nothing that imports or downloads a served copy lost a name or a result: v0.1's
//      exports and golden outputs, bot.mjs's pin through connect(), the devnet-2 params;
//   C. no page or comment says the served file is the older one, and the pages that say
//      "byte for byte" say it from the pin;
//   D. the sync script, in a temp site and a temp repo: it copies, refuses an uncommitted
//      source, and --check fails on every way a copy can drift.
// Every guard has a mutation proof: the same function, fed the broken thing, returns
// a finding. There is no page here (no DOM, no hostile device text): this is a file and
// its copies. The run against a local devnet-2 is scripts/e2e-chain-app-sdksync.mjs.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SDK_KB, SDK_SOURCE } from '../src/data/chain-sdk-source.ts';
import * as S from '../scripts/sync-chain-sdk.mjs';

const root = new URL('../', import.meta.url);
const rootPath = fileURLToPath(root);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const bytes = (p) => readFileSync(new URL(p, root));
const sha = (b) => createHash('sha256').update(b).digest('hex');
const SCRIPT = fileURLToPath(new URL('scripts/sync-chain-sdk.mjs', root));
const SERVED = 'public/chain/sdk/pointcast-chain.js';
const THREE = [SERVED, 'public/chain/net/pointcast-chain.js', 'public/chain/first-mints/lib/pointcast-chain.js'];
const PIN = 'src/data/chain-sdk-source.ts';

const MY_FILES = [SERVED, PIN, 'scripts/sync-chain-sdk.mjs', 'scripts/e2e-chain-app-sdksync.mjs', 'tests/chain-app-sdksync.test.mjs'].filter((p) => existsSync(new URL(p, root)));
const cleanups = [];
test.after(() => { for (const d of cleanups) rmSync(d, { recursive: true, force: true }); });
const tmp = (prefix) => { const d = mkdtempSync(join(tmpdir(), prefix)); cleanups.push(d); return d; };
const runCli = (args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', timeout: 30000 });

// ---------------------------------------------------------------- A. the copies, the pin, the source

/** A site root (a temp dir) with the three copies and the pin, for the script tests to break. */
function makeSite(content = bytes(SERVED)) {
  const dir = tmp('sdksync-site-');
  for (const rel of THREE) { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), content); }
  mkdirSync(join(dir, 'src/data'), { recursive: true });
  cpSync(new URL(PIN, root), join(dir, PIN));
  return dir;
}

/** Every file named pointcast-chain.js under public/ of a site root, relative to it, sorted. */
function findCopies(site) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'pointcast-chain.js') out.push(relative(site, p));
    }
  };
  walk(join(site, 'public'));
  return out.sort();
}

test('the three served copies are one file, byte for byte', () => {
  const [a, b, c] = THREE.map(bytes);
  assert.ok(a.length > 150000, `${a.length} bytes: the full SDK, not the 48 KB v0.1 file`);
  assert.equal(sha(a), sha(b), '/chain/sdk/ and /chain/net/ differ');
  assert.equal(sha(a), sha(c), '/chain/sdk/ and /chain/first-mints/lib/ differ');
  assert.ok(a.equals(b) && a.equals(c));
});

test('the pin is this file: sha256, bytes, lines, the three paths, a commit that is a commit', () => {
  const b = bytes(SERVED);
  assert.equal(SDK_SOURCE.sha256, sha(b));
  assert.equal(SDK_SOURCE.bytes, b.length);
  assert.equal(SDK_SOURCE.lines, S.countLines(b));
  assert.deepEqual([...SDK_SOURCE.copies], THREE);
  assert.deepEqual([...SDK_SOURCE.copies], S.COPIES, 'the pin lists the paths the script copies to');
  assert.match(SDK_SOURCE.commitFull, /^[0-9a-f]{40}$/);
  assert.ok(SDK_SOURCE.commitFull.startsWith(SDK_SOURCE.commit) && SDK_SOURCE.commit.length === 7);
  assert.match(SDK_SOURCE.lastChangedIn, /^[0-9a-f]{7}$/);
  assert.match(SDK_SOURCE.commitDate, /^\d{4}-\d\d-\d\d$/);
  assert.equal(SDK_SOURCE.path, 'sdk/pointcast-chain.js');
  assert.equal(SDK_KB, Math.round(b.length / 1000), 'the size the pages print is the file’s');
  // The checked-in pin is exactly what the script writes for these facts: nobody hand-edited it.
  assert.equal(S.pinSource({ ...SDK_SOURCE, copies: [...SDK_SOURCE.copies] }), read(PIN));
  const r = S.readPin(rootPath);
  assert.equal(r.error, undefined);
  assert.deepEqual(r.pin, { commit: SDK_SOURCE.commit, commitFull: SDK_SOURCE.commitFull, commitDate: SDK_SOURCE.commitDate, lastChangedIn: SDK_SOURCE.lastChangedIn, sha256: SDK_SOURCE.sha256, bytes: SDK_SOURCE.bytes, lines: SDK_SOURCE.lines, copies: [...SDK_SOURCE.copies] });
});

test('scripts/sync-chain-sdk.mjs --check passes on this tree', () => {
  const r = runCli(['--check']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /3 copies identical, \d+ bytes, sha256 [0-9a-f]{12}, from pointcast-chain [0-9a-f]{7}/);
});

test('there is no fourth copy: pointcast-chain.js lives at exactly the three paths under public/', () => {
  assert.deepEqual(findCopies(rootPath), [...THREE].sort());
  // mutation: a fourth copy anywhere under public/ is found
  const site = makeSite();
  mkdirSync(join(site, 'public/chain/somewhere/lib'), { recursive: true });
  writeFileSync(join(site, 'public/chain/somewhere/lib/pointcast-chain.js'), bytes(SERVED));
  assert.deepEqual(findCopies(site), [...THREE, 'public/chain/somewhere/lib/pointcast-chain.js'].sort());
  assert.notDeepEqual(findCopies(site), [...THREE].sort());
});

test('the pinned commit is the repo’s file: git show <commit>:sdk/pointcast-chain.js is the served bytes (when the repo is here)', (t) => {
  const repo = process.env.PC_CHAIN_REPO || join(homedir(), 'pointcast-chain');
  if (!existsSync(join(repo, '.git'))) return t.skip('the pointcast-chain repo is local only and is not here');
  let shown;
  try {
    shown = execFileSync('git', ['-C', repo, 'show', `${SDK_SOURCE.commitFull}:${SDK_SOURCE.path}`], { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    return t.skip('the repo here does not have commit ' + SDK_SOURCE.commit + ' (' + String(e.stderr || e.message).trim().split('\n')[0] + ')');
  }
  assert.equal(sha(shown), SDK_SOURCE.sha256, 'the pin names a commit whose file is not the served one');
  // the file's last change is no later than the pinned commit, and is the commit the pin names
  const last = execFileSync('git', ['-C', repo, 'log', '-1', '--format=%h', '--abbrev=7', SDK_SOURCE.commitFull, '--', SDK_SOURCE.path], { encoding: 'utf8' }).trim();
  assert.equal(last, SDK_SOURCE.lastChangedIn);
  // informational: has the repo moved on since the sync? Not a failure: the site moves when someone runs the script.
  try {
    const now = execFileSync('git', ['-C', repo, 'show', `HEAD:${SDK_SOURCE.path}`], { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    t.diagnostic(sha(now) === SDK_SOURCE.sha256 ? 'the repo’s HEAD file is the served file' : 'the repo’s HEAD sdk/pointcast-chain.js has moved on: run node scripts/sync-chain-sdk.mjs');
  } catch { /* HEAD unreadable: nothing to say */ }
});

// ---------------------------------------------------------------- B. nothing that uses a served copy broke

const sdkUrl = pathToFileURL(fileURLToPath(new URL(SERVED, root))).href;
const sdk = await import(sdkUrl);

/** The names a source text takes from a pointcast-chain.js: `import { a, b as c }` and `import * as X` with `X.name`. */
function takenNames(text) {
  const names = new Set();
  for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"][^'"]*pointcast-chain\.js['"]/g)) {
    for (const part of m[1].split(',')) { const n = part.trim().split(/\s+as\s+/)[0]; if (n) names.add(n); }
  }
  for (const m of text.matchAll(/import\s*\*\s*as\s+([A-Za-z_$][\w$]*)\s+from\s*['"][^'"]*pointcast-chain\.js['"]/g)) {
    for (const u of text.matchAll(new RegExp(`\\b${m[1].replace(/\$/g, '\\$')}\\.([A-Za-z_$][\\w$]*)`, 'g'))) names.add(u[1]);
  }
  return names;
}
/** Files of the site that import or download a pointcast-chain.js, with the names they take. */
function consumers() {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(m?js)$/.test(e.name) && e.name !== 'pointcast-chain.js') {
        const names = takenNames(readFileSync(p, 'utf8'));
        if (names.size) out.push({ file: relative(rootPath, p), names });
      }
    }
  };
  walk(join(rootPath, 'public'));
  // the downloadable snippets live in the data modules as strings
  for (const f of readdirSync(new URL('src/data/', root)).filter((n) => /^chain-app-.*\.ts$/.test(n))) {
    const names = takenNames(read('src/data/' + f));
    if (names.size) out.push({ file: 'src/data/' + f, names });
  }
  return out;
}
const missingNames = (list, exported) => list.flatMap(({ file, names }) => [...names].filter((n) => !exported.has(n)).map((n) => `${file}: ${n}`));

test('every name a page script, a downloadable file or a snippet takes from a pointcast-chain.js is exported by it', () => {
  const list = consumers();
  assert.ok(list.length >= 12, 'found ' + list.length + ' consumers: ' + list.map((c) => c.file).join(', '));
  for (const f of ['public/chain/bots/bot.mjs', 'public/chain/apps/bloom.js', 'public/chain/apps/verify.js', 'public/chain/net/witness.js']) assert.ok(list.some((c) => c.file === f), f + ' was scanned');
  const total = list.reduce((n, c) => n + c.names.size, 0);
  assert.ok(total >= 60, total + ' names checked');
  assert.deepEqual(missingNames(list, new Set(Object.keys(sdk))), []);
  // mutation: with one export gone from the module, the scan names who needed it
  const without = new Set(Object.keys(sdk)); without.delete('signingHash');
  const found = missingNames(list, without);
  assert.ok(found.some((l) => l.startsWith('public/chain/bots/bot.mjs: signingHash')), found.join('; '));
});

/** What /chain/sdk/pointcast-chain.js (v0.1, 1,186 lines, sha256 6aeafc94…) exported. */
const V01_EXPORTS = ['ChainError', 'DEV_PUBLIC_KEYS', 'DEV_SEQUENCER_KEY', 'DROP_ID_RE', 'KIND_TAGS', 'MESSAGE_PREFIX', 'PointcastChain', 'accountLeaf', 'addressKind', 'agentAddress', 'artDropId', 'b58checkDecode', 'b58checkEncode', 'b58decode', 'b58encode', 'blake2b', 'bodyHash', 'bytesToHex', 'certificateCopy', 'checkDropId', 'connect', 'devWallet', 'domainOf', 'encodeAccount', 'encodeTx', 'hexToBytes', 'holdingsFromClaim', 'isAddress', 'isValidChainId', 'packString', 'paramsHash', 'parsePublicKey', 'parseSignature', 'publicKeyToB58', 'recipientStatus', 'sha256', 'signatureToB58', 'signingHash', 'tezosAddress', 'txHash', 'verifyClaim', 'verifyEd25519', 'verifyOwnership', 'walletSignedDigest', 'walletText'];
const V01_KIND_TAGS = { publish_block: 1, drum_session: 2, tap: 3, drop_mint: 4, transfer: 5, register_agent: 6, set_drum_attestors: 7, set_mandate: 8, clear_mandate: 9, spend_allowance: 10 };
/** sha256 of JSON.stringify(Object.entries(DEV_PUBLIC_KEYS)) in v0.1 (13 entries); the served file keeps them first. */
const V01_DEV_KEYS_SHA = 'f757cf98b66a2917d85b50ce1663003341537a419a1d98b1a35f8fcbb72f5f69';

/** Names v0.1 exported that `exported` (a module namespace) no longer does, or exports as another type. */
function lostFromV01(mod) {
  const lost = [];
  const ref = { ChainError: 'function', DEV_PUBLIC_KEYS: 'object', DEV_SEQUENCER_KEY: 'string', DROP_ID_RE: 'object', KIND_TAGS: 'object', MESSAGE_PREFIX: 'string', PointcastChain: 'function' };
  for (const n of V01_EXPORTS) {
    if (!(n in mod)) lost.push(n + ' (gone)');
    else if (typeof mod[n] !== (ref[n] || 'function')) lost.push(n + ' (now ' + typeof mod[n] + ')');
  }
  for (const [k, v] of Object.entries(V01_KIND_TAGS)) if (mod.KIND_TAGS?.[k] !== v) lost.push('KIND_TAGS.' + k);
  if (sha(JSON.stringify(Object.entries(mod.DEV_PUBLIC_KEYS || []).slice(0, 13))) !== V01_DEV_KEYS_SHA) lost.push('DEV_PUBLIC_KEYS (first 13)');
  return lost;
}

test('everything v0.1 exported is still exported, with the same type, tags and dev keys; the new file adds, never takes away', () => {
  assert.equal(V01_EXPORTS.length, 45);
  assert.deepEqual(lostFromV01(sdk), []);
  assert.ok(Object.keys(sdk).length >= 100, Object.keys(sdk).length + ' exports');
  assert.equal(sdk.DEV_SEQUENCER_KEY, '4558cc0a17d679a9a57057ff93b4efa80fcfb11c0f941cce923baed60c7625a9');
  assert.equal(sdk.MESSAGE_PREFIX, 'Tezos Signed Message: pointcast-chain');
  assert.equal(sdk.DROP_ID_RE.source, '^[a-z0-9_-]{1,64}$');
  // mutation: v0.1 sees a lost name, a retyped name, a changed tag and a changed dev key
  const { signingHash: _gone, ...rest } = sdk;
  assert.deepEqual(lostFromV01(rest), ['signingHash (gone)']);
  assert.deepEqual(lostFromV01({ ...sdk, connect: 5 }), ['connect (now number)']);
  assert.deepEqual(lostFromV01({ ...sdk, KIND_TAGS: { ...sdk.KIND_TAGS, tap: 99 } }), ['KIND_TAGS.tap']);
  assert.deepEqual(lostFromV01({ ...sdk, DEV_PUBLIC_KEYS: ['00', ...sdk.DEV_PUBLIC_KEYS.slice(1)] }), ['DEV_PUBLIC_KEYS (first 13)']);
});

/** Outputs computed by the v0.1 file for fixed inputs (generated from it at origin/main 75f33935). */
const GOLDEN = {
  blake2b32: '7e5793825a69a500ab646887655082e0ecd51d05d93b093271be224ec826edfc',
  blake2b64: 'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923',
  blake2b20: '384264f676f39536840523f284921cdc68b6846b',
  sha256: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  tezosAddress: 'tz1NMDGdwxXtD2TE5jRGcqMqi8yiV5AgpsUU',
  publicKeyToB58: 'edpkteDwHwoNPB18tKToFKeSCykvr1ExnoMV5nawTJy9Y9nLckT562',
  signingHash: '0b5ffef3fdf8babc36f3e0a9800df24a4f75456d0082ab913f1e378b662948c1',
  signingHashTransfer: 'd9874ac4d9258efce450a423dd270293b15560e6e1afce4d415abad785872873',
  txHash: '856f365eed4487f10eb04fc12c888efd63ec09990bb8341a7c3394037e21759b',
  bodyHash: 'dc3de6e12a33bfddcffaa9c816f04b6a1e9343ab2a6816bf18bb0c2ca8b49c45',
  walletSignedDigest: '030a05000f020a0e0e060f0a090e07030007030d000b000e080700000e0b080b0603090103020300000e05020103020a0a0505070001070c0f0e050f040d0a0b',
  artDropId: 'kt1abc-3',
  packString: '050100000003616263',
  b58checkEncode: 'kA3B33GVuqT',
};
const GOLDEN_WALLET_TEXT = 'Tezos Signed Message: pointcast-chain pointcast-devnet-2 publish_block sender tz1NMDGdwxXtD2TE5jRGcqMqi8yiV5AgpsUU nonce 7 digest 0b5ffef3f';
async function goldenOf(m) {
  const te = new TextEncoder();
  const key = { scheme: 'ed25519', bytes: '00'.repeat(31) + '01' };
  const dom = m.domainOf('pointcast-devnet-2', 'ab'.repeat(32));
  const tx = { sender: m.tezosAddress(key), nonce: 7, type: 'publish_block', channel: 'BOT', title: 'hi', body_hash: 'cd'.repeat(32), media_uri: null };
  const tx2 = { sender: m.tezosAddress(key), nonce: 8, type: 'transfer', to: 'tz1bLEsiTQ2vQx8znZnuahFfKEf98xicMX35', amount: 5 };
  return {
    blake2b32: m.bytesToHex(m.blake2b([m.hexToBytes('00'), m.hexToBytes('ff01')])),
    blake2b64: m.bytesToHex(m.blake2b([te.encode('abc')], 64)),
    blake2b20: m.bytesToHex(m.blake2b([te.encode('abc')], 20)),
    sha256: m.bytesToHex(await m.sha256(te.encode('abc'))),
    tezosAddress: m.tezosAddress(key),
    publicKeyToB58: m.publicKeyToB58(key),
    signingHash: m.signingHash(tx, dom),
    signingHashTransfer: m.signingHash(tx2, dom),
    txHash: m.txHash({ tx, public_key: key, signature: '00'.repeat(64) }),
    bodyHash: m.bodyHash('hello'),
    walletSignedDigest: m.bytesToHex(await m.walletSignedDigest(m.walletText(tx, dom))),
    artDropId: m.artDropId('KT1abc', 3),
    packString: m.bytesToHex(m.packString('abc')),
    b58checkEncode: m.b58checkEncode(m.hexToBytes('0102030405')),
    walletText: m.walletText(tx, dom),
  };
}

test('what v0.1 computed, the served file computes identically: hashes, addresses, signing hashes, wallet text', async () => {
  const got = await goldenOf(sdk);
  const { walletText, ...rest } = got;
  assert.deepEqual(rest, GOLDEN);
  assert.ok(walletText.startsWith(GOLDEN_WALLET_TEXT), walletText);
  assert.deepEqual([sdk.addressKind('tz1bLEsiTQ2vQx8znZnuahFfKEf98xicMX35'), sdk.addressKind('nope')], ['tz1', null]);
  assert.deepEqual([sdk.checkDropId('coffee-mug-0'), sdk.checkDropId('BAD ID')], [null, 'must be [a-z0-9_-]']);
  assert.deepEqual([sdk.recipientStatus('tz1bLEsiTQ2vQx8znZnuahFfKEf98xicMX35'), sdk.recipientStatus('nope')], ['ok', 'invalid']);
  assert.equal(sdk.certificateCopy('no_node'), 'PointCast chain: local rehearsal only. No certificates are issued or promised.');
  // mutation: a module whose blake2b or signing hash changed does not match the golden values
  const broken = { ...sdk, blake2b: (parts, n) => sdk.blake2b([...parts, new Uint8Array([0])], n), signingHash: () => '00'.repeat(32) };
  const g = await goldenOf(broken);
  assert.notEqual(g.blake2b32, GOLDEN.blake2b32);
  assert.notEqual(g.signingHash, GOLDEN.signingHash);
  assert.notDeepEqual(g, { ...GOLDEN, walletText: got.walletText });
});

/** What v0.1's paramsHash made of the recorded devnet-2 params (not the genesis): the quickstart's failure. */
const V01_PARAMS_HASH = '723fd038935b5c9c41c88dd04834fe6d064674f0736844ac5e109fb7fedd26bb';

test('the reason for the change: the served SDK hashes the recorded devnet-2 params to the live genesis, and bot.mjs’s pin passes connect()', async () => {
  const fx = JSON.parse(read('tests/fixtures/chain-app-verify.json'));
  assert.equal(fx.chain_id, 'pointcast-devnet-2');
  assert.notEqual(V01_PARAMS_HASH, fx.genesis, 'v0.1 got the wrong hash for these params, which is the bug');
  assert.equal(sdk.paramsHash(fx.params), fx.genesis);
  const bot = read('public/chain/bots/bot.mjs');
  const chainId = bot.match(/^const CHAIN_ID = "([^"]+)";$/m)[1];
  const genesis = bot.match(/^const GENESIS = "([0-9a-f]{64})";$/m)[1];
  const devnet = bot.match(/^const DEVNET = "(https:\/\/[^"]+)";$/m)[1];
  assert.equal(chainId, fx.chain_id);
  assert.equal(genesis, fx.genesis, 'bot.mjs pins the devnet-2 the fixture recorded');
  // exactly the call bot.mjs makes, with the recorded node behind it (reads only: the fetch has no other routes)
  const seen = [];
  const f = async (u) => {
    const path = new URL(u).pathname;
    seen.push(path);
    const body = path === '/status' ? { chain_id: fx.chain_id, genesis_hash: fx.genesis, height: fx.tip_when_read } : path === '/params' ? fx.params : null;
    return { ok: body !== null, status: body ? 200 : 404, text: async () => JSON.stringify(body) };
  };
  const chain = await sdk.connect(devnet, { expect: { chainId, genesisHash: genesis }, fetch: f });
  assert.deepEqual(seen, ['/status', '/params']);
  assert.equal(typeof chain.buildPublish, 'function');
  assert.equal(typeof chain.submit, 'function');
  assert.equal(typeof chain.waitForTx, 'function');
  assert.equal(chain.domain.genesis, fx.genesis);
  // the pin does its job: another genesis is refused
  await assert.rejects(sdk.connect(devnet, { expect: { chainId, genesisHash: '00'.repeat(32) }, fetch: f }), /genesis .* expected/);
  // mutation: a module with the v0.1 params hash cannot pass the same call
  const old = { ...sdk, paramsHash: () => V01_PARAMS_HASH };
  assert.notEqual(old.paramsHash(fx.params), fx.genesis);
});

test('the dev quickstart imports /chain/sdk/ from other origins, so it has CORS; the downloads exist', () => {
  const headers = read('public/_headers');
  assert.match(headers, /^\/chain\/sdk\/\*\n  Access-Control-Allow-Origin: \*$/m);
  for (const href of ['/chain/sdk/pointcast-chain.js', '/chain/bots/bot.mjs', '/chain/bots/package.json', '/chain/net/pointcast-chain.js']) assert.ok(existsSync(new URL('public' + href, root)), href);
  assert.match(read('src/pages/chain/bots.astro'), /\$\{SITE\}\/chain\/sdk\/pointcast-chain\.js/);
  assert.match(read('src/pages/chain/dev.astro'), /https:\/\/pointcast\.xyz\/chain\/sdk\/pointcast-chain\.js/);
});

// ---------------------------------------------------------------- C. the claims

/** Phrases that say the file at /chain/sdk/ is an older one: the claim this change makes false. */
function staleSdkClaims(text) {
  const out = [];
  for (const re of [
    /older[^.\n]{0,60}\/chain\/sdk\//i,
    /\/chain\/sdk\/(?:pointcast-chain\.js)?[^.]{0,80}\b(older|v0\.1)\b/i,
    /\b(older|v0\.1)\b[^.\n]{0,40}\bpointcast-chain\.js/i,
    /\bunchanged from the repo\b/i,
    /\bpublished (here )?unchanged\b/i,
    /\b48 KB\b/,
  ]) { const m = text.match(re); if (m) out.push(m[0]); }
  return out;
}
/** A page that says the SDK is byte for byte the repo's must take the commit from the pin. */
function unpinnedByteClaim(text) {
  const says = /byte for byte as it is in the repo|byte-identical to <code>sdk\/pointcast-chain\.js<\/code>/.test(text);
  return says && !/import \{[^}]*SDK_SOURCE[^}]*\} from '[^']*chain-sdk-source'/.test(text);
}

function filesUnder(rel, pattern) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (pattern.test(e.name)) out.push(relative(rootPath, p));
    }
  };
  walk(join(rootPath, rel));
  return out;
}

test('no page, data module or app script says the file at /chain/sdk/ is older, v0.1 or 48 KB, or "unchanged from the repo" without a pin', () => {
  const files = [...filesUnder('src/pages/chain', /\.(astro|ts)$/), ...filesUnder('src/components/chain', /\.astro$/), ...readdirSync(new URL('src/data/', root)).filter((n) => /^chain-/.test(n) && /\.ts$/.test(n)).map((n) => 'src/data/' + n), ...filesUnder('public/chain/apps', /\.js$/)];
  assert.ok(files.length > 40, files.length + ' files scanned');
  const found = files.flatMap((f) => staleSdkClaims(read(f)).map((c) => `${f}: ${c}`));
  assert.deepEqual(found, []);
  // mutation: each of the sentences this change removed is caught
  for (const old of [
    'the older file at /chain/sdk/ has no blockHeaderHash, sealDigest or txRoot',
    '/chain/sdk/pointcast-chain.js is the older v0.1 file without them.',
    '(the file at /chain/sdk/\n// is the older v0.1 one without the block, capsule and tx-form helpers).',
    'The zero-dependency SDK as one static file, unchanged from the repo.',
    'It is published here unchanged from the repo.',
    '<span>48 KB · ES module · MIT, per its package.json · from {SOURCE.commit}</span>',
  ]) assert.ok(staleSdkClaims(old).length > 0, old);
  assert.deepEqual(staleSdkClaims('The SDK is the same file the dev tools describe, from pointcast-chain 0795f26.'), []);
});

test('dev, docs and bots say where the SDK came from and how big it is from the pin, not from a typed commit or size', () => {
  const dev = read('src/pages/chain/dev.astro');
  const docs = read('src/pages/chain/docs/index.astro');
  const bots = read('src/pages/chain/bots.astro');
  assert.match(dev, /import \{ SDK_KB, SDK_SOURCE \} from '\.\.\/\.\.\/data\/chain-sdk-source';/);
  assert.match(dev, /<span>\{SDK_KB\} KB · ES module · MIT, per its package\.json · sdk\/pointcast-chain\.js at \{SDK_SOURCE\.commit\}<\/span>/);
  assert.match(dev, /It is published here byte for byte as it is in the repo at \{SDK_SOURCE\.commit\}\./);
  assert.match(dev, /byte-identical to <code>sdk\/pointcast-chain\.js<\/code> in the repo at \{SDK_SOURCE\.commit\}/);
  assert.match(docs, /import \{ SDK_SOURCE \} from '\.\.\/\.\.\/\.\.\/data\/chain-sdk-source';/);
  assert.match(docs, /byte for byte as it is in the repo at \{SDK_SOURCE\.commit\}\./);
  assert.match(bots, /import \{ SDK_SOURCE \} from '\.\.\/\.\.\/data\/chain-sdk-source';/);
  assert.match(bots, /The SDK is the same file the <a href="\/chain\/dev#sdk">dev tools<\/a> describe, from pointcast-chain \{SDK_SOURCE\.commit\}\./);
  for (const [name, src] of [['dev', dev], ['docs', docs], ['bots', bots]]) {
    assert.ok(!src.includes(SDK_SOURCE.commit), name + ' types the pinned commit instead of reading it');
    assert.doesNotMatch(src, new RegExp(String(SDK_SOURCE.bytes)), name + ' types the size');
  }
  // every page that makes the byte-for-byte claim takes the commit from the pin
  const claimers = filesUnder('src/pages/chain', /\.astro$/).filter((f) => /byte for byte as it is in the repo|byte-identical to <code>sdk\/pointcast-chain\.js/.test(read(f)));
  assert.deepEqual(claimers.sort(), ['src/pages/chain/dev.astro', 'src/pages/chain/docs/index.astro']);
  for (const f of claimers) assert.equal(unpinnedByteClaim(read(f)), false, f);
  // mutation: the claim without the import, and the import without the claim's pin
  assert.equal(unpinnedByteClaim('<p>published byte for byte as it is in the repo at 0795f26.</p>'), true);
  assert.equal(unpinnedByteClaim(dev.replace("import { SDK_KB, SDK_SOURCE } from '../../data/chain-sdk-source';", '')), true);
  assert.equal(unpinnedByteClaim(dev), false);
});

const built = (p) => new URL('dist/' + p, root);
test('built pages: dev prints the size and commit from the pin; docs and bots name the commit; none calls the SDK older', { skip: !existsSync(built('chain/dev/index.html')) && 'no dist/ build' }, () => {
  const text = (p) => read('dist/' + p).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const dev = text('chain/dev/index.html');
  assert.ok(dev.includes(`${SDK_KB} KB · ES module · MIT, per its package.json · sdk/pointcast-chain.js at ${SDK_SOURCE.commit}`), 'dev size line');
  assert.ok(dev.includes(`published here byte for byte as it is in the repo at ${SDK_SOURCE.commit}`));
  assert.ok(dev.includes(`in the repo at ${SDK_SOURCE.commit} (the file’s last change there is ${SDK_SOURCE.lastChangedIn})`));
  assert.ok(text('chain/docs/index.html').includes(`byte for byte as it is in the repo at ${SDK_SOURCE.commit}.`));
  assert.ok(text('chain/bots/index.html').includes(`dev tools describe, from pointcast-chain ${SDK_SOURCE.commit}.`));
  for (const p of ['chain/dev/index.html', 'chain/docs/index.html', 'chain/bots/index.html', 'chain/verify-a-block/index.html', 'chain/notary/index.html', 'chain/capsules/index.html', 'chain/net/index.html']) {
    if (existsSync(built(p))) assert.deepEqual(staleSdkClaims(text(p)), [], p);
  }
  // the served files are in the build, and are the pinned bytes
  for (const rel of THREE) assert.equal(sha(readFileSync(built(rel.replace(/^public\//, '')))), SDK_SOURCE.sha256, 'dist/' + rel);
});

// ---------------------------------------------------------------- D. the script

/** A temp pointcast-chain repo with sdk/pointcast-chain.js committed. */
function makeRepo(content, { commit = true } = {}) {
  const dir = tmp('sdksync-repo-');
  const g = (...a) => execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@example.test', '-c', 'commit.gpgsign=false', ...a], { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
  execFileSync('git', ['init', '-q', dir]);
  mkdirSync(join(dir, 'sdk'), { recursive: true });
  writeFileSync(join(dir, 'sdk/pointcast-chain.js'), content);
  writeFileSync(join(dir, 'README.md'), 'x\n');
  if (commit) { g('add', '.'); g('commit', '-q', '-m', 'sdk'); }
  return { dir, g };
}
const SDK_A = 'export const a = 1;\nexport function f() { return 2; }\n';
const SDK_B = SDK_A + 'export const b = 3;\n';
const snapshot = (site) => Object.fromEntries([...THREE, PIN].map((rel) => [rel, existsSync(join(site, rel)) ? sha(readFileSync(join(site, rel))) : null]));

test('sync: copies the committed source to the three paths, writes the pin from git, and a second run changes nothing', () => {
  const repo = makeRepo(SDK_A);
  const site = tmp('sdksync-empty-');
  const r = runCli(['--root', site, '--repo', repo.dir]);
  assert.equal(r.status, 0, r.stderr);
  const head = repo.g('rev-parse', 'HEAD').trim();
  for (const rel of THREE) assert.equal(readFileSync(join(site, rel), 'utf8'), SDK_A, rel);
  const { pin, error } = S.readPin(site);
  assert.equal(error, undefined);
  assert.equal(pin.commitFull, head);
  assert.equal(pin.commit, head.slice(0, 7));
  assert.equal(pin.lastChangedIn, head.slice(0, 7));
  assert.equal(pin.sha256, sha(SDK_A));
  assert.equal(pin.bytes, SDK_A.length);
  assert.equal(pin.lines, 2);
  assert.deepEqual(pin.copies, THREE);
  assert.equal(runCli(['--root', site, '--check']).status, 0);
  assert.equal(runCli(['--root', site, '--check', '--against-repo', '--repo', repo.dir]).status, 0);
  const before = snapshot(site);
  assert.equal(runCli(['--root', site, '--repo', repo.dir]).status, 0);
  assert.deepEqual(snapshot(site), before, 'a rerun is byte-identical, pin included');
  // the file is copied as it is: no provenance comment added to it
  assert.equal(sha(readFileSync(join(site, SERVED))), sha(SDK_A));
});

test('sync: a newer source moves all three paths and the pin together; lastChangedIn follows the file, not HEAD', () => {
  const repo = makeRepo(SDK_A);
  const site = tmp('sdksync-move-');
  assert.equal(runCli(['--root', site, '--repo', repo.dir]).status, 0);
  const first = S.readPin(site).pin;
  writeFileSync(join(repo.dir, 'README.md'), 'y\n');
  repo.g('commit', '-q', '-am', 'docs only');
  assert.equal(runCli(['--root', site, '--check', '--against-repo', '--repo', repo.dir]).status, 0, 'the SDK did not move: the repo has not moved on for this file');
  writeFileSync(join(repo.dir, 'sdk/pointcast-chain.js'), SDK_B);
  repo.g('commit', '-q', '-am', 'sdk b');
  const against = runCli(['--root', site, '--check', '--against-repo', '--repo', repo.dir]);
  assert.equal(against.status, 1);
  assert.match(against.stderr, /is not the repo's current sdk\/pointcast-chain\.js .* run node scripts\/sync-chain-sdk\.mjs/);
  assert.equal(runCli(['--root', site, '--check']).status, 0, 'offline --check does not care that the repo moved');
  assert.equal(runCli(['--root', site, '--repo', repo.dir]).status, 0);
  const next = S.readPin(site).pin;
  assert.notEqual(next.sha256, first.sha256);
  assert.equal(next.sha256, sha(SDK_B));
  assert.equal(next.commitFull, repo.g('rev-parse', 'HEAD').trim());
  assert.equal(next.lastChangedIn, next.commit);
  for (const rel of THREE) assert.equal(readFileSync(join(site, rel), 'utf8'), SDK_B);
  // a later commit that does not touch the file moves commit, not lastChangedIn
  writeFileSync(join(repo.dir, 'README.md'), 'z\n');
  repo.g('commit', '-q', '-am', 'docs again');
  assert.equal(runCli(['--root', site, '--repo', repo.dir]).status, 0);
  const last = S.readPin(site).pin;
  assert.notEqual(last.commit, next.commit);
  assert.equal(last.lastChangedIn, next.lastChangedIn);
});

test('sync refuses a source whose pin would be a guess, and writes nothing', () => {
  const none = tmp('sdksync-norepo-');
  mkdirSync(join(none, 'sdk'));
  writeFileSync(join(none, 'sdk/pointcast-chain.js'), SDK_A);
  const dirty = makeRepo(SDK_A);
  writeFileSync(join(dirty.dir, 'sdk/pointcast-chain.js'), SDK_B);
  const uncommitted = makeRepo(SDK_A, { commit: false });
  const untracked = makeRepo(SDK_A);
  untracked.g('rm', '-q', '--cached', 'sdk/pointcast-chain.js');
  const missing = makeRepo(SDK_A);
  rmSync(join(missing.dir, 'sdk/pointcast-chain.js'));
  const cases = [
    [none, /is not a git repository with a commit/],
    [dirty.dir, /has uncommitted changes/],
    [uncommitted.dir, /is not a git repository with a commit|not tracked/],
    [untracked.dir, /uncommitted changes|not tracked/],
    [missing.dir, /no sdk\/pointcast-chain\.js in/],
    [join(tmp('sdksync-nodir-'), 'nope'), /no sdk\/pointcast-chain\.js in/],
  ];
  for (const [repo, why] of cases) {
    const site = makeSite();
    const before = snapshot(site);
    const r = runCli(['--root', site, '--repo', repo]);
    assert.equal(r.status, 1, repo + ': ' + r.stdout);
    assert.match(r.stderr, why, repo);
    assert.deepEqual(snapshot(site), before, repo + ': nothing was written');
  }
  // the guard is the thing that stops these: a clean committed source is accepted by the same code
  assert.equal(runCli(['--root', tmp('sdksync-ok-'), '--repo', makeRepo(SDK_A).dir]).status, 0);
});

test('--check fails on every way a copy can drift, names the path, and passes again when put back', () => {
  const site = makeSite();
  assert.equal(runCli(['--root', site, '--check']).status, 0);
  const bad = (label, mutate, restore, expectStderr) => {
    mutate();
    const r = runCli(['--root', site, '--check']);
    assert.equal(r.status, 1, label + ': ' + r.stdout);
    assert.match(r.stderr, expectStderr, label);
    restore();
    assert.equal(runCli(['--root', site, '--check']).status, 0, label + ': restored');
  };
  const orig = bytes(SERVED);
  for (const rel of THREE) {
    const file = join(site, rel);
    // one flipped byte in one copy
    bad('flip ' + rel, () => { const b = Buffer.from(orig); b[1000] ^= 1; writeFileSync(file, b); }, () => writeFileSync(file, orig), new RegExp(`the served copies differ[^\\n]*${rel.replace(/[./]/g, '\\$&')}|${rel.replace(/[./]/g, '\\$&')} is not the pinned file`));
    // a trailing newline: the same code, a different file
    bad('append ' + rel, () => writeFileSync(file, Buffer.concat([orig, Buffer.from('\n')])), () => writeFileSync(file, orig), /the served copies differ/);
    // one copy missing
    bad('delete ' + rel, () => rmSync(file), () => writeFileSync(file, orig), new RegExp(`${rel.replace(/[./]/g, '\\$&')} is missing`));
    // an older, smaller SDK in one place (the situation this change fixes)
    bad('old file in ' + rel, () => writeFileSync(file, 'export const v = 1;\n'), () => writeFileSync(file, orig), /the served copies differ/);
  }
  // all three changed alike: they agree with each other, not with the pin
  bad('all three changed', () => { for (const rel of THREE) writeFileSync(join(site, rel), Buffer.concat([orig, Buffer.from('//x\n')])); }, () => { for (const rel of THREE) writeFileSync(join(site, rel), orig); }, /is not the pinned file/);
  // the pin edited
  const pinFile = join(site, PIN);
  const pinText = readFileSync(pinFile, 'utf8');
  bad('pin sha', () => writeFileSync(pinFile, pinText.replace(SDK_SOURCE.sha256, '0'.repeat(64))), () => writeFileSync(pinFile, pinText), /is not the pinned file/);
  bad('pin bytes', () => writeFileSync(pinFile, pinText.replace(`bytes: ${SDK_SOURCE.bytes},`, `bytes: ${SDK_SOURCE.bytes + 1},`)), () => writeFileSync(pinFile, pinText), /bytes and \d+ lines, pinned/);
  bad('pin lines', () => writeFileSync(pinFile, pinText.replace(`lines: ${SDK_SOURCE.lines},`, `lines: ${SDK_SOURCE.lines - 1},`)), () => writeFileSync(pinFile, pinText), /bytes and \d+ lines, pinned/);
  bad('pin copies', () => writeFileSync(pinFile, pinText.replace(", 'public/chain/net/pointcast-chain.js'", '')), () => writeFileSync(pinFile, pinText), /not the three paths this script copies to/);
  bad('pin commit', () => writeFileSync(pinFile, pinText.replace(`commit: '${SDK_SOURCE.commit}',`, "commit: 'abcdef0',")), () => writeFileSync(pinFile, pinText), /commit and commitFull do not agree/);
  bad('pin missing', () => rmSync(pinFile), () => writeFileSync(pinFile, pinText), /chain-sdk-source\.ts is missing/);
  bad('pin field gone', () => writeFileSync(pinFile, pinText.replace(/^  lines: \d+,\n/m, '')), () => writeFileSync(pinFile, pinText), /is missing lines/);
});

test('the CLI says what it is given wrong: unknown flags exit 2, a missing repo exits 1', () => {
  assert.equal(runCli(['--chek']).status, 2);
  assert.match(runCli(['--chek']).stderr, /unknown argument --chek/);
  assert.equal(runCli(['--check', '--against-repo', '--repo', join(tmp('sdksync-none-'), 'x')]).status, 1);
});

test('checkCopies is the one check: the unit function agrees with the CLI on the real tree and on a broken one', () => {
  assert.deepEqual(S.checkCopies(rootPath).problems, []);
  const site = makeSite();
  writeFileSync(join(site, THREE[1]), 'export {};\n');
  const r = S.checkCopies(site);
  assert.equal(r.ok, false);
  assert.ok(r.problems.length >= 2, r.problems.join(' | '));
});

test('this change touches only its own files plus the claims it corrected: no shared file is in its file set', () => {
  const shared = ['src/data/chain-home.ts', 'src/data/chain-apps.ts', 'src/pages/chain.astro', 'src/data/front-door-news.json', 'public/llms.txt', 'public/llms-full.txt', 'src/pages/for-agents.astro'];
  for (const f of shared) assert.ok(!MY_FILES.includes(f), f);
  for (const f of MY_FILES) assert.ok(existsSync(new URL(f, root)), f);
  assert.ok(!MY_FILES.some((f) => f.startsWith('src/content/blocks/')));
});
