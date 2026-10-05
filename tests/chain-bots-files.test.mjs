// /chain/bots serves the signed bot and the verify script as ready-to-run
// files (public/chain/bots/bot.mjs, verify.mjs, package.json), and the page's
// snippets are those same files, read with ?raw at build. From Manus's
// fresh-eyes run of the signed path on 2026-10-05: "One file, no
// dependencies" meant assembling bot.mjs by hand from the page, Node warned
// because nothing declared the SDK an ES module, the Node version wasn't
// stated, and METHOD still read as if signed posts had never gone live.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const page = read('src/pages/chain/bots.astro');
const chainHome = read('src/data/chain-home.ts');
const bot = read('public/chain/bots/bot.mjs');
const verify = read('public/chain/bots/verify.mjs');
const pkg = read('public/chain/bots/package.json');
const sdk = read('public/chain/sdk/pointcast-chain.js');
const verifier = read('public/chain/yard/verifier/verify.js');

const DEVNET_URL = chainHome.match(/const DEVNET_URL = '([^']+)'/)[1];
const GENESIS = chainHome.match(/const DEVNET_GENESIS = '([0-9a-f]{64})'/)[1];
const CHAIN_ID = chainHome.match(/chainId: '([^']+)'/)[1];

/** Names a module exports: `export function|class|const x` and `export { a, b }`. */
const exportsOf = (src) => {
  const names = new Set([...src.matchAll(/^export\s+(?:async\s+)?(?:function\*?|class|const|let)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]));
  for (const m of src.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const part of m[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop();
      if (name) names.add(name);
    }
  }
  return names;
};
/** `import { a, b } from "<spec>"` → { spec: [a, b] } for every relative import. */
const relativeImports = (src) => {
  const out = {};
  for (const m of src.matchAll(/^import\s*\{([^}]*)\}\s*from\s*"(\.\/[^"]+)";/gm)) {
    out[m[2]] = m[1].split(',').map((s) => s.trim()).filter(Boolean);
  }
  return out;
};
/** The text of a `const name = String.raw\`…\`;` in the page frontmatter. */
const rawConst = (name) => {
  const m = page.match(new RegExp(`const ${name} = String\\.raw\`([\\s\\S]*?)\`;`));
  assert.ok(m, `const ${name} in bots.astro`);
  return m[1];
};
const sitePaths = (s) => [...s.matchAll(/\$\{SITE\}(\/chain\/[^\s\\]+)/g)].map((m) => m[1]);

test('package.json makes the downloaded SDK and verifier ES modules', () => {
  assert.deepEqual(JSON.parse(pkg), { type: 'module' });
});

test('the page shows the files themselves: imported with ?raw, with no second copy inline', () => {
  assert.match(page, /^import botMjs from '\.\.\/\.\.\/\.\.\/public\/chain\/bots\/bot\.mjs\?raw';$/m);
  assert.match(page, /^import verifyMjs from '\.\.\/\.\.\/\.\.\/public\/chain\/bots\/verify\.mjs\?raw';$/m);
  assert.match(page, /<Snippet label="bot\.mjs[^"]*" code=\{botMjs\} \/>/);
  assert.match(page, /<Snippet label="verify\.mjs[^"]*" code=\{verifyMjs\} \/>/);
  // Snippet prints `code` as-is inside <pre><code> (the Copy button copies that textContent), so the
  // ?raw string reaches the page and the clipboard unchanged even when there is no dist/ to compare.
  assert.match(read('src/components/chain/Snippet.astro'), /<pre><code>\{code\}<\/code><\/pre>/);
  // Lines that exist only in the files: a copy of them in the page source could drift.
  for (const line of ['crypto.subtle.importKey("pkcs8"', 'chain.buildPublish(', 'chain.waitForTx(', 'PointcastVerifier.load(', 'verifier.push']) {
    assert.ok(bot.includes(line) || verify.includes(line), `fixture: ${line}`);
    assert.ok(!page.includes(line), `inline copy in bots.astro: ${line}`);
  }
});

test('the files pin the same devnet as src/data/chain-home.ts', () => {
  for (const [name, src] of [['bot.mjs', bot], ['verify.mjs', verify]]) {
    assert.ok(src.includes(`const DEVNET = "${DEVNET_URL}";`), `${name}: DEVNET`);
    assert.ok(src.includes(`const GENESIS = "${GENESIS}";`), `${name}: GENESIS`);
  }
  assert.ok(bot.includes(`const CHAIN_ID = "${CHAIN_ID}";`), 'bot.mjs: CHAIN_ID');
  assert.match(bot, /await connect\(DEVNET, \{ expect: \{ chainId: CHAIN_ID, genesisHash: GENESIS \} \}\)/);
  assert.match(verify, /v\.call\("verifier\.new", \{ params: await get\("\/params"\), genesis: GENESIS \}\)/);
});

test('every name the files import is exported by the file served beside them', () => {
  const botImports = relativeImports(bot);
  assert.deepEqual(Object.keys(botImports), ['./pointcast-chain.js']);
  const sdkExports = exportsOf(sdk);
  for (const name of botImports['./pointcast-chain.js']) assert.ok(sdkExports.has(name), `SDK exports ${name}`);

  const verifyImports = relativeImports(verify);
  assert.deepEqual(Object.keys(verifyImports), ['./verify.js']);
  const verifierExports = exportsOf(verifier);
  for (const name of verifyImports['./verify.js']) assert.ok(verifierExports.has(name), `verify.js exports ${name}`);
  // The wasm is found next to the script, wherever node is run from.
  assert.match(verify, /readFile\(new URL\("\.\/pointcast_chain\.wasm", import\.meta\.url\)\)/);
});

test('both files parse as ES modules', () => {
  for (const p of ['public/chain/bots/bot.mjs', 'public/chain/bots/verify.mjs']) {
    const r = spawnSync(process.execPath, ['--check', fileURLToPath(new URL(p, root))], { encoding: 'utf8' });
    assert.equal(r.status, 0, `${p}: ${r.stderr}`);
  }
});

test('the one-command quickstarts fetch files this site serves, and nothing else', () => {
  assert.match(page, /^const SITE = 'https:\/\/pointcast\.xyz';$/m);
  const quick = rawConst('signedQuickstart');
  assert.deepEqual(sitePaths(quick).sort(), ['/chain/bots/bot.mjs', '/chain/bots/package.json', '/chain/sdk/pointcast-chain.js']);
  // One -O for many URLs (or a shell brace glob) would print every file after the first to stdout.
  // Without --fail-early, curl -f exits 0 when only an earlier URL fails, so && runs node anyway.
  assert.match(quick, /^mkdir pc-bot && cd pc-bot && curl -fsS --fail-early --remote-name-all \\$/m);
  assert.match(quick, /&& node bot\.mjs "[^"]+"$/);

  const fetchVerify = rawConst('verifyFetch');
  assert.deepEqual(sitePaths(fetchVerify).sort(), [
    '/chain/bots/package.json',
    '/chain/bots/verify.mjs',
    '/chain/yard/verifier/pointcast_chain.wasm',
    '/chain/yard/verifier/pointcast_chain.wasm.sha256',
    '/chain/yard/verifier/verify.js',
  ]);
  assert.match(fetchVerify, /curl -fsS --fail-early --remote-name-all \\/);
  assert.match(fetchVerify, /&& shasum -a 256 -c pointcast_chain\.wasm\.sha256 \\\n  && node verify\.mjs$/);

  for (const p of [...sitePaths(quick), ...sitePaths(fetchVerify)]) assert.ok(existsSync(new URL(`public${p}`, root)), `public${p}`);
});

test('copy: Node 22 and WebCrypto Ed25519 beside the run block; downloads for all three files', () => {
  assert.match(page, /<Snippet label="One command · Node 22 or newer \(uses WebCrypto Ed25519\)" code=\{signedQuickstart\} \/>/);
  assert.match(page, /<span>Node 22 or newer \(uses WebCrypto Ed25519\)\./);
  assert.match(bot, /^\/\/ ed25519 key\. Node 22 or newer \(uses WebCrypto Ed25519\)\./m);
  assert.doesNotMatch(page, /One file, no dependencies/);
  for (const href of ['/chain/bots/bot.mjs', '/chain/sdk/pointcast-chain.js', '/chain/bots/package.json']) {
    assert.ok(page.includes(`href="${href}" download>`), href);
  }
});

test('METHOD: the stubbed run was the first test; a signed post has since gone live', () => {
  const method = page.slice(page.indexOf('<footer class="method">'));
  assert.doesNotMatch(method, /so nothing was posted\./);
  assert.match(method, /The signed bot was first tested with\s+its writes stubbed out, so that first test posted nothing\./);
  // Manus is a PointCast resident agent (src/data/residents.ts), not an outside adopter.
  assert.match(method, /Since then \{FIRST_LIVE_SIGNED\.who\}, one of\s+PointCast’s <a href="\/residents">resident agents<\/a>, has followed this page fresh and posted a signed transaction\s+live with its own key/);
  assert.doesNotMatch(page, /outside agent/i);
  assert.match(page, /const FIRST_LIVE_SIGNED = \{ who: 'Manus', height: 564, on: 'October 5', tx: '[0-9a-f]{64}' \};/);
});

test('honesty: both files say devnet, no value, may reset, and make no value claims', () => {
  for (const [name, src] of [['bot.mjs', bot], ['verify.mjs', verify]]) {
    assert.match(src, /a devnet: no value, may reset\./, name);
    for (const phrase of [/main\s*net/i, /\bworth\b/i, /\binvest/i, /\bprofit/i, /\byield\b/i]) assert.doesNotMatch(src, phrase, `${name}: ${phrase}`);
  }
});

const built = new URL('dist/chain/bots/index.html', root);
test('built page: the bot.mjs and verify.mjs snippets equal the served files byte for byte', { skip: !existsSync(built) && 'no dist/ build' }, () => {
  const doc = new JSDOM(readFileSync(built, 'utf8')).window.document;
  const snippets = [...doc.querySelectorAll('.snip pre code')].map((c) => c.textContent);
  assert.ok(snippets.includes(bot), 'the bot.mjs snippet is the file');
  assert.ok(snippets.includes(verify), 'the verify.mjs snippet is the file');
  for (const f of ['bot.mjs', 'verify.mjs', 'package.json']) {
    assert.equal(readFileSync(new URL(`dist/chain/bots/${f}`, root), 'utf8'), read(`public/chain/bots/${f}`), `dist/chain/bots/${f}`);
  }
});
