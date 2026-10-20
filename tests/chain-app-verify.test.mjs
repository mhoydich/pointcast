// "Verify a block by hand" (/chain/verify-a-block): the logic in
// public/chain/apps/verify.js, the DOM side in public/chain/apps/verify-view.js,
// the page src/pages/chain/verify-a-block.astro and the words in
// src/data/chain-app-verify.ts.
//
// What this suite holds:
//   - devnet data never becomes markup (and a mutated source proves the test
//     catches an innerHTML), no banned word or currency sign anywhere in the
//     app's files (this one included), the honesty line is on the page;
//   - the steps pass on real devnet-2 blocks (a recorded fixture, then the
//     live devnet and a local one by GET) and each tamper kind turns exactly
//     the right checks red;
//   - nothing is read at import, and the ?devnet= override accepts only
//     localhost and 127.0.0.1;
//   - the "same steps, in code" file on the page runs and agrees.
// Written without the dollar sign and without template literals on purpose:
// the app's files carry neither, and this file is scanned with them.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { DEVNET, DEVNET_PREVIOUS, RESET } from '../src/data/chain-home.ts';
import { APP, HONESTY_LINE, NOT_PROVES, PROVES, SDK_PATH, STEPS, WASM_SHA256, snippet } from '../src/data/chain-app-verify.ts';
import * as V from '../public/chain/apps/verify.js';
import * as view from '../public/chain/apps/verify-view.js';
import * as pcc from '../public/chain/first-mints/lib/pointcast-chain.js';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const FILES = [
  'public/chain/apps/verify.js',
  'public/chain/apps/verify-view.js',
  'src/pages/chain/verify-a-block.astro',
  'src/data/chain-app-verify.ts',
  'tests/chain-app-verify.test.mjs',
  'tests/fixtures/chain-app-verify.json',
  'scripts/e2e-chain-app-verify.mjs',
].filter((f) => existsSync(new URL(f, root)));
const src = Object.fromEntries(FILES.map((f) => [f, read(f)]));
const page = src['src/pages/chain/verify-a-block.astro'];
const viewSrc = src['public/chain/apps/verify-view.js'];
const logicSrc = src['public/chain/apps/verify.js'];
const fixture = JSON.parse(read('tests/fixtures/chain-app-verify.json'));

const HEX64 = (s) => typeof s === 'string' && s.length === 64 && !/[^0-9a-f]/.test(s);
const J = (...a) => a.join('');
const clone = (x) => structuredClone(x);
const set = (h) => clone(fixture.sets[String(h)]);
const GENESIS = fixture.genesis;
const baseOf = (s, extra = {}) => ({ n: Number(s.block.header.height), params: fixture.params, genesis: GENESIS, pinSource: 'pinned', ...s, ...extra });
const ids = (report) => [...report.failed].sort();
const stateOf = (report) => Object.fromEntries(report.steps.map((s) => [s.id, s.state]));

// ---------------------------------------------------------------- the sink scanner, and proof it works

/** Throws when a source can turn text into markup, a link target or a style. */
export function assertNoSinks(code, name) {
  const body = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*/gm, '');
  assert.doesNotMatch(body, /\binnerHTML\b|\bouterHTML\b|insertAdjacentHTML|document\.write|set:html|createContextualFragment|DOMParser|\beval\s*\(|new Function\b|\bsrcdoc\b/, name + ': an HTML sink');
  assert.doesNotMatch(body, /\.(href|src|srcset|action|formAction)\s*=|setAttribute\s*\(|setAttributeNS|style\.setProperty|\.style\s*=|\.style\.cssText|\.cssText\s*=/, name + ': a link, source or style sink');
}

const inlineScript = (page.match(/<script is:inline type="module">([\s\S]*?)<\/script>/) || [])[1] || '';

test('devnet data never becomes markup, an href, a src or a style', () => {
  assert.ok(inlineScript.length > 50, 'the page has its inline bootstrap');
  for (const [name, text] of [['verify.js', logicSrc], ['verify-view.js', viewSrc], ['page script', inlineScript]]) assertNoSinks(text, name);
  assert.match(viewSrc, /\.textContent = /);
  assert.match(viewSrc, /createTextNode/);
  // The page's own links are build-time constants: no href is an expression over devnet data.
  for (const m of page.matchAll(/href=\{([^}]+)\}/g)) assert.match(m[1], /^(DEVNET\.yardHref|DEVNET_PREVIOUS\.path|SDK_PATH)/, m[1]);
});

test('verify.js has no DOM access: it runs the same in a page and in node', () => {
  const body = logicSrc.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"])\/\/.*/gm, '');
  assert.doesNotMatch(body, /\b(document|window|navigator|localStorage|sessionStorage|location|history|alert)\b/);
  assert.doesNotMatch(body, /\.querySelector|createElement|addEventListener/);
  assert.match(viewSrc, /createElement/, 'the DOM is the view’s job');
});

test('the sink test catches a mutated source (one escape turned into innerHTML)', () => {
  // 1. the text-setting helper in the view, mutated
  const mutated = viewSrc.replace('if (text !== undefined) n.textContent = text;', 'if (text !== undefined) n.innerHTML = text;');
  assert.notEqual(mutated, viewSrc, 'the helper line exists to mutate');
  assert.throws(() => assertNoSinks(mutated, 'mutated view'), /an HTML sink/);
  // 2. one row's value written as markup
  const m2 = viewSrc.replace('v.textContent = r.v;', 'v.innerHTML = r.v;');
  assert.notEqual(m2, viewSrc);
  assert.throws(() => assertNoSinks(m2, 'mutated row'), /an HTML sink/);
  // 3. the logic file given a sink
  assert.throws(() => assertNoSinks(logicSrc + '\ndocument.body.insertAdjacentHTML("beforeend", x);', 'logic'), /an HTML sink/);
  // 4. a link target from data, and a style from data
  assert.throws(() => assertNoSinks(viewSrc + '\na.href = row.v;', 'view'), /a link, source or style sink/);
  assert.throws(() => assertNoSinks(viewSrc + '\nnode.setAttribute("style", row.v);', 'view'), /a link, source or style sink/);
  assert.throws(() => assertNoSinks(inlineScript + '\nroot.innerHTML = x;', 'page script'), /an HTML sink/);
  // and the real sources are clean (the first test), so the scanner is not just always failing
  assert.doesNotThrow(() => assertNoSinks(viewSrc, 'view'));
});

// ---------------------------------------------------------------- honest copy

const BANNED = [J('ca', 'sh'), J('in', 'vest'), J('pro', 'fit'), J('ea', 'rn'), J('air', 'drop'), J('real', ' ', 'money'), J('yi', 'eld'), J('sta', 'ke'), J('re', 'deem'), J('back', 'ed'), J('U', 'SD')];
const bannedHits = (text) => BANNED.filter((w) => new RegExp('\\b' + w.replace(' ', '\\s+') + (w === J('U', 'SD') ? '\\b' : ''), 'i').test(text));
const CURRENCY_SIGN = String.fromCharCode(36);

test('no banned word and no currency sign anywhere in the app’s files, this one included', () => {
  assert.ok(FILES.length >= 6, 'the app’s files exist: ' + FILES.join(', '));
  for (const [f, text] of Object.entries(src)) {
    assert.deepEqual(bannedHits(text), [], f + ' carries a banned word');
    assert.ok(!text.includes(CURRENCY_SIGN), f + ' carries a dollar sign');
  }
  // the scanner itself works: every banned word is caught, in any case, and ordinary words are not
  for (const w of BANNED) {
    assert.ok(bannedHits('some ' + w + ' here').length, w);
    assert.ok(bannedHits(w.toUpperCase()).length, w + ' upper');
  }
  for (const ok of ['learn', 'mistake', 'a nearby block', 'the genesis hash']) assert.deepEqual(bannedHits(ok), [], ok);
});

test('the honesty line is on the page: devnet-2, no value, may reset, a dated and recorded reset, the devnet-1 recording', () => {
  assert.equal(HONESTY_LINE, 'devnet · no value · may reset');
  const para = (text) => (text.match(/<p class="vb-honest"[\s\S]*?<\/p>/) || [''])[0];
  const honest = (text) => {
    const p = para(text);
    return p.includes('{HONESTY_LINE}') && p.includes('{DEVNET.chainId}') && p.includes('A reset is dated and') && p.includes('recorded, never silent') && p.includes('{DEVNET_PREVIOUS.path}') && p.includes('{notYet(RESET.date)}') && p.includes('accountable claim');
  };
  assert.ok(honest(page), 'the page carries the honesty paragraph');
  assert.equal(DEVNET_PREVIOUS.path, '/chain/yard/devnet-1/');
  assert.equal(DEVNET.chainId, 'pointcast-devnet-2');
  assert.match(RESET.date, /^20\d\d-\d\d-\d\d/);
  // it fails when the line is missing
  assert.equal(honest(page.replace('<b>{HONESTY_LINE}.</b>', '')), false);
  assert.equal(honest(page.replaceAll('{DEVNET_PREVIOUS.path}', '/somewhere')), false);
  assert.equal(honest(page.replace('A reset is dated and', 'A reset happens and')), false);
  // the kicker says it too, and the method footer repeats it
  assert.match(page, /PUBLIC DEVNET-2 · NO VALUE · MAY RESET, NEVER SILENTLY/);
  assert.ok((page.match(/\{HONESTY_LINE\}/g) || []).length >= 2);
  assert.match(page, /A witness or a stamp is the same\./);
  // proof is only ever negated or about what the steps prove
  assert.ok(NOT_PROVES.some((t) => /witness is a claim, not proof/.test(t)));
  assert.ok(NOT_PROVES.some((t) => /state root is not recomputed/.test(t)));
  assert.ok(PROVES.length >= 4 && NOT_PROVES.length >= 5);
});

test('copy keeps its promises: the state root is not recomputed, the Yard VERIFY, pcv.py and verify.mjs are linked, abstract art has no text', () => {
  assert.match(page, /DEVNET\.yardHref/);
  assert.match(page, /\/chain\/bots\/pcv\.py/);
  assert.match(page, /\/chain\/bots\/verify\.mjs/);
  assert.ok(NOT_PROVES.join(' ').includes('VERIFY in the Block Yard'));
  assert.ok(NOT_PROVES.join(' ').includes('pcv.py and verify.mjs'));
  const svg = page.match(/<svg[\s\S]*?<\/svg>/)[0];
  assert.doesNotMatch(svg, /<text|<tspan|<image|<use/);
  for (const tool of STEPS.map((s) => s.tool)) assert.match(tool, /^Tool:/);
  assert.deepEqual(STEPS.map((s) => s.id), ['fetch', 'link', 'seal', 'txroot', 'sigs']);
  for (const s of STEPS) assert.equal(V.STEP_TITLES[s.id], s.title, 'verify.js and the copy agree on the title of ' + s.id);
});

test('design law: tokens, square corners, 1.5px borders, weights 400 and 500, 16px gutters, focus, reduced motion', () => {
  const css = page.slice(page.indexOf('<style is:global>'));
  assert.match(css, /prefers-color-scheme: dark/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /border-radius:\s*[1-9]/);
  assert.doesNotMatch(css, /font:\s*(?:italic\s+)?[6-9]00\b/, 'weights 400 and 500 only');
  assert.doesNotMatch(css, /font-weight:\s*[6-9]00/);
  assert.ok(css.includes('1.5px solid'));
  assert.match(css, /:focus-visible\{outline:2px solid var\(--c600\)/);
  for (const color of css.match(/#[0-9a-fA-F]{3,8}\b/g)) assert.ok(color.length >= 4, color);
  // light-mode colours come from tokens set once on the root, not scattered in the rules
  const hexInRules = css.replace(/@media \(prefers-color-scheme: dark\)\{[\s\S]*?\n  \}\n/, '').match(/#[0-9a-fA-F]{6}\b/g) || [];
  assert.ok(hexInRules.length <= 2, 'only the two status tokens are literal in light mode: ' + hexInRules.join(','));
  // the page opens its controls with aria labels and a live status
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /<form class="vb-controls" data-vb-form aria-label="Pick a block">/);
  assert.match(page, /<label class="vb-label" for="vb-n">/);
});

// ---------------------------------------------------------------- the page and its hooks agree

test('every hook the view queries exists on the page, and the page’s data attributes come from build constants', () => {
  const hooks = new Set([...viewSrc.matchAll(/\[(data-[a-z-]+)(?:=|\])/g)].map((m) => m[1]));
  assert.ok(hooks.size >= 20, [...hooks].join(' '));
  for (const h of hooks) assert.ok(page.includes(h), 'the page has ' + h);
  for (const needle of ['data-api={D}', 'data-genesis={DEVNET.genesis}', 'data-chain-id={DEVNET.chainId}', 'data-wasm={WASM_PATH}', 'data-wasm-sha256={WASM_SHA256}'])
    assert.ok(page.includes(needle), needle);
  assert.match(page, /import \{ DEVNET, DEVNET_PREVIOUS, RESET, VERIFIER_KIB, assertDevnetLaunchPinned, notYet \} from '\.\.\/\.\.\/data\/chain-home';/);
  assert.match(page, /assertDevnetLaunchPinned\(\);/);
  assert.doesNotMatch(page, /[0-9a-f]{64}/, 'no hash typed in the page');
  assert.doesNotMatch(page, /workers\.dev/, 'no devnet URL typed in the page');
  // the page loads the view lazily, from the public folder
  assert.match(inlineScript, /import\('\/chain\/apps\/verify-view\.js'\)/);
  assert.match(inlineScript, /requestIdleCallback/);
  assert.match(inlineScript, /'load'/);
  assert.doesNotMatch(inlineScript, /\bfetch\s*\(/);
});

test('the SDK this app imports exports every name it uses, and the wasm pin is the file’s sha256', () => {
  const sdk = read('public/chain/first-mints/lib/pointcast-chain.js');
  assert.match(logicSrc, /from '\.\.\/first-mints\/lib\/pointcast-chain\.js'/);
  assert.equal('/chain/first-mints/lib/pointcast-chain.js', SDK_PATH);
  const exported = new Set([...sdk.matchAll(/^export\s+(?:async\s+)?(?:function\*?|class|const|let)\s+([A-Za-z_][A-Za-z0-9_]*)/gm)].map((m) => m[1]));
  const used = new Set([...logicSrc.matchAll(/\bpcc\.([A-Za-z0-9_]+)/g)].map((m) => m[1]));
  assert.ok(used.size >= 15, [...used].join(' '));
  for (const name of used) assert.ok(exported.has(name), 'the SDK exports ' + name);
  // the older SDK at /chain/sdk/ lacks the three helpers this lesson is built on
  const old = read('public/chain/sdk/pointcast-chain.js');
  for (const name of ['blockHeaderHash', 'sealDigest', 'txRoot']) assert.ok(sdk.includes('export function ' + name), name + ' is in the v0.2 SDK');
  assert.equal(old.includes('export function blockHeaderHash'), false, 'if this fails, /chain/sdk/ was updated: the app may import it instead');
  const wasmFile = createHash('sha256').update(readFileSync(new URL('public/chain/yard/verifier/pointcast_chain.wasm', root))).digest('hex');
  assert.equal(WASM_SHA256, wasmFile);
  assert.match(read('public/chain/yard/verifier/pointcast_chain.wasm.sha256'), new RegExp(wasmFile));
});

// ---------------------------------------------------------------- small pure helpers

test('the ?devnet= override takes localhost and 127.0.0.1 only', () => {
  assert.deepEqual(V.devnetOverride('?devnet=http://127.0.0.1:8799'), { api: 'http://127.0.0.1:8799', genesis: null });
  assert.deepEqual(V.devnetOverride('?devnet=http://localhost:8787/some/path?x=1'), { api: 'http://localhost:8787', genesis: null });
  assert.deepEqual(V.devnetOverride('?devnet=https://localhost&genesis=' + GENESIS.toUpperCase()), { api: 'https://localhost', genesis: GENESIS });
  assert.deepEqual(V.devnetOverride('?devnet=http://127.0.0.1:1&genesis=nothex'), { api: 'http://127.0.0.1:1', genesis: null });
  for (const bad of [
    '', '?', '?devnet=', '?devnet=' + DEVNET.url, '?devnet=https://evil.example', '?devnet=http://127.0.0.1.evil.example', '?devnet=http://localhost.evil.example:80',
    '?devnet=http://localhost@evil.example', '?devnet=http://user:pw@127.0.0.1:8799', '?devnet=http://127.0.0.2:8799', '?devnet=http://0.0.0.0:8799',
    '?devnet=http://[::1]:8799', '?devnet=javascript:alert(1)', '?devnet=file:///etc/passwd', '?devnet=ftp://127.0.0.1', '?devnet=//127.0.0.1:8799',
    '?devnet=evil.example', '?x=http://127.0.0.1:8799', '?devnet=http://127.0.0.1:8799@evil.example', '?devnet=data:text/html,x',
  ]) assert.equal(V.devnetOverride(bad), null, bad);
});

test('block times read as UTC, and the genesis block says timestamp 0', () => {
  assert.equal(V.formatTime(1792475413880), '2026-10-20 05:50:13 UTC');
  assert.equal(V.formatTime(0), 'timestamp 0');
  assert.equal(V.formatTime(10n), '1970-01-01 00:00:00 UTC');
  assert.equal(V.formatTime('nonsense'), 'timestamp 0');
});

test('block numbers: parse, default, fragment', () => {
  assert.equal(V.parseBlockNumber('3318', 4000), 3318);
  assert.equal(V.parseBlockNumber(' #12 ', 4000), 12);
  for (const bad of ['', '0', '-1', '1.5', '1e3', 'abc', '99999999999999999999', '3319', ' ', null, undefined]) assert.equal(V.parseBlockNumber(bad, 3318), null, String(bad));
  assert.equal(V.parseBlockNumber('3319'), 3319, 'no tip known: any whole number');
  assert.equal(V.defaultBlock(3321), 3318);
  assert.equal(V.defaultBlock(4), 3);
  assert.equal(V.defaultBlock(2), 1);
  assert.equal(V.defaultBlock(0), 1);
  assert.equal(V.blockFromHash('#b=3318'), 3318);
  assert.equal(V.blockFromHash('#b=0'), null);
  assert.equal(V.blockFromHash('#b=12x'), 12, 'digits then anything: the digits');
  assert.equal(V.blockFromHash('#other'), null);
});

test('cleanText strips control and bidirectional characters and caps length', () => {
  const rlo = String.fromCharCode(0x202e);
  const zw = String.fromCharCode(0x200b);
  const bell = String.fromCharCode(7);
  assert.equal(V.cleanText('a' + rlo + 'b' + zw + 'c' + bell + 'd'), 'a b c d');
  assert.equal(V.cleanText(42), '');
  assert.equal(V.cleanText('x'.repeat(500), 10).length, 10);
  assert.equal(V.cleanText('  many   spaces  '), 'many spaces');
});

test('diffRuns marks exactly the characters that differ', () => {
  assert.deepEqual(V.diffRuns('abcd', 'abcd'), [['abcd', false]]);
  assert.deepEqual(V.diffRuns('abXd', 'abcd'), [['ab', false], ['X', true], ['d', false]]);
  assert.deepEqual(V.diffRuns('Xbcd', 'abcd'), [['X', true], ['bcd', false]]);
});

test('merkle levels: the empty root, one leaf, an odd node moving up unchanged, and the SDK’s txRoot agree', () => {
  const empty = V.merkleLevels([]);
  assert.equal(empty.length, 1);
  assert.equal(empty[0][0], fixture.sets['3318'].block.header.tx_root, 'the empty root is the empty block’s tx_root');
  for (const h of [1, 249, 309, 690, 3247]) {
    const b = fixture.sets[String(h)].block;
    const txids = b.txs.map((t) => V.txIdOf(t));
    const levels = V.merkleLevels(txids);
    assert.equal(levels[levels.length - 1][0], b.header.tx_root, 'block ' + h);
    assert.equal(levels[levels.length - 1][0], pcc.txRoot(b.txs), 'block ' + h + ' vs SDK');
  }
  const three = V.merkleLevels(['11'.repeat(32), '22'.repeat(32), '33'.repeat(32)]);
  assert.deepEqual(three.map((l) => l.length), [3, 2, 1]);
  assert.equal(three[1][1], three[0][2], 'the odd leaf moves up unchanged');
  assert.equal(V.merkleLevels(['11'.repeat(32)])[0].length, 1);
});

test('long check lists show every failure and cap the passes', () => {
  const many = Array.from({ length: 60 }, (_, i) => ({ id: 'c' + i, state: i === 40 ? 'fail' : i === 50 ? 'skip' : 'pass' }));
  const { shown, hidden } = V.listChecks(many, 10);
  assert.equal(shown.length, 12, '10 passes, the failure and the skip');
  assert.equal(hidden, 48);
  assert.ok(shown.some((c) => c.id === 'c40') && shown.some((c) => c.id === 'c50'));
  assert.deepEqual(V.listChecks(many.slice(0, 5), 10), { shown: many.slice(0, 5), hidden: 0 });
});

test('the laid-out bytes are the bytes hashed: header hash, seal digest, tx id', () => {
  for (const h of [1, 249, 3247, 3318]) {
    const s = fixture.sets[String(h)];
    assert.equal(V.headerHashOf(s.block.header), pcc.blockHeaderHash(s.block.header));
    assert.equal(V.hashHeaderParts(V.headerParts(s.block.header)), V.headerHashOf(s.block.header));
    assert.equal(V.sealDigestOf(s.block.header, GENESIS), pcc.sealDigest(s.block.header, GENESIS));
    for (const t of s.block.txs) {
      assert.equal(V.txIdOf(t), pcc.txHash(t));
      const b = V.signedTxBytes(t);
      assert.ok(b.signed.startsWith(b.unsigned));
      assert.equal(b.unsigned, pcc.bytesToHex(pcc.encodeTx(t.tx)));
    }
  }
  assert.equal(V.headerParts(fixture.sets['3318'].block.header).length, 5);
  assert.equal(V.headerParts(fixture.sets['3318'].block.header)[0][1].length, 16, 'height is 8 bytes');
});

test('readBlock refuses what the page does not read', () => {
  const ok = fixture.sets['3318'].block;
  assert.doesNotThrow(() => V.readBlock(clone(ok)));
  const bad = (f) => { const b = clone(ok); f(b); assert.throws(() => V.readBlock(b), /malformed/); };
  bad((b) => { b.header.prev_hash = 'zz'; });
  bad((b) => { b.header.prev_hash = b.header.prev_hash.toUpperCase(); });
  bad((b) => { b.header.sequencer_sig = 'ab'.repeat(32); });
  bad((b) => { b.header.height = 0; });
  bad((b) => { b.header.height = '5'; });
  bad((b) => { b.header.timestamp = -1; });
  bad((b) => { b.txs = {}; });
  bad((b) => { b.txs = [{ tx: {}, public_key: {}, signature: '' }]; });
  bad((b) => { delete b.header; });
  assert.throws(() => V.readBlock(null), /malformed/);
  assert.throws(() => V.readBlock([]), /malformed/);
});

// ---------------------------------------------------------------- the steps, on recorded devnet-2 blocks

test('every recorded block passes all five steps, whatever its transaction kinds', async () => {
  for (const h of [1, 249, 309, 690, 3247, 3318]) {
    const s = set(h);
    const r = await V.runSteps(baseOf(s));
    assert.equal(r.verdict, 'pass', 'block ' + h + ': ' + r.summary);
    assert.deepEqual(r.failed, [], 'block ' + h);
    assert.deepEqual(r.steps.map((x) => x.state), ['pass', 'pass', 'pass', 'pass', 'pass'], 'block ' + h);
    assert.deepEqual(r.steps.map((x) => x.id), ['fetch', 'link', 'seal', 'txroot', 'sigs']);
    for (const step of r.steps) assert.ok(step.groups.length && step.tool && step.title, step.id);
    assert.equal(r.checks.filter((c) => c.id.startsWith('sig:')).length, s.block.txs.length);
  }
});

test('the five steps carry the bytes: header parts, the seal digest, tx bytes, the tree and the digest each signature covers', async () => {
  const s = set(3247);
  const r = await V.runSteps(baseOf(s));
  const flat = (id) => r.steps.find((x) => x.id === id).groups.flatMap((g) => g.rows);
  const h = s.block.header;
  const link = flat('link');
  for (const k of ['domain', 'height · 8 bytes', 'prev_hash · 32 bytes', 'timestamp ms · 8 bytes', 'tx_root · 32 bytes', 'state_root · 32 bytes']) assert.ok(link.some((x) => x.k === k), k);
  assert.ok(link.some((x) => x.v === V.headerHashOf(h) && x.strong), 'the header hash row');
  assert.ok(link.some((x) => x.v === s.next.header.prev_hash && x.cmp === 'ok'));
  const seal = flat('seal');
  assert.ok(seal.some((x) => x.v === V.sealDigestOf(h, GENESIS)));
  assert.ok(seal.some((x) => x.k === 'ed25519 verify' && x.v === 'valid'));
  assert.ok(seal.some((x) => x.k.startsWith('/params hashed') && x.cmp === 'ok'));
  const tx = flat('txroot');
  assert.ok(tx.some((x) => x.k === 'tx_root recomputed' && x.cmp === 'ok' && x.v === h.tx_root));
  assert.equal(tx.filter((x) => x.k === 'tx id').length, 3);
  assert.equal(tx.filter((x) => x.k.startsWith('leaf = ')).length, 3);
  const sig = flat('sigs');
  assert.equal(sig.filter((x) => x.k === 'ed25519 verify' && x.v === 'valid').length, 3);
  assert.equal(sig.filter((x) => x.k === 'address derived from the key' && x.cmp === 'ok').length, 3);
  const dom = pcc.domainOf(fixture.chain_id, GENESIS);
  assert.ok(sig.some((x) => x.v === pcc.signingHash(s.block.txs[0].tx, dom)));
  // hostile-free rows: every hex row is hex (or a clipped prefix of it)
  for (const x of [...link, ...seal, ...tx, ...sig]) if (x.kind === 'hex') assert.ok(!/[^0-9a-f…]/.test(x.v), x.k);
});

test('the newest block has no next block: nothing fails, the forward link is "not fully checked"', async () => {
  const s = set(3318);
  s.next = null;
  const r = await V.runSteps(baseOf(s));
  assert.equal(r.verdict, 'partial');
  assert.deepEqual(r.failed, []);
  assert.deepEqual(r.skipped, ['link_forward']);
  assert.deepEqual(stateOf(r), { fetch: 'pass', link: 'skip', seal: 'pass', txroot: 'pass', sigs: 'pass' });
});

test('block 1 follows the pinned genesis, with no previous block', async () => {
  const r = await V.runSteps(baseOf(set(1)));
  assert.equal(r.verdict, 'pass');
  const link = r.steps.find((x) => x.id === 'link').groups.flatMap((g) => g.rows);
  assert.ok(link.some((x) => x.k === 'block 1 prev_hash' && x.v === GENESIS && x.cmp === 'ok'));
  const wrong = await V.runSteps(baseOf(set(1), { genesis: '00'.repeat(32) }));
  assert.ok(wrong.failed.includes('link_back'));
  assert.ok(wrong.failed.includes('params_pin'));
});

test('a wrong pin: the params do not hash to it, so the seal is not run and the page says why', async () => {
  const r = await V.runSteps(baseOf(set(3247), { genesis: '11'.repeat(32) }));
  assert.ok(r.failed.includes('params_pin'));
  assert.ok(r.skipped.includes('seal'), 'the seal is not run against a key that came from unpinned params');
  assert.equal(r.verdict, 'fail');
  assert.match(r.steps.find((x) => x.id === 'seal').checks.find((c) => c.id === 'params_pin').text, /do not hash to the genesis hash you trust/);
});

test('a server that answers with the wrong heights is caught in step 1', async () => {
  const s = set(3247);
  s.n = 3247;
  const r = await V.runSteps({ ...baseOf(s), n: 3248 });
  assert.ok(r.failed.includes('fetch_heights'));
  assert.equal(r.steps[0].state, 'fail');
});

// ---------------------------------------------------------------- tampering: each kind turns the right checks red

const EXPECT = {
  title: { failed: ['sig:0', 'tx_root'], green: ['fetch', 'link', 'seal'] },
  tx_signature: { failed: ['sig:0', 'tx_root'], green: ['fetch', 'link', 'seal'] },
  tx_drop: { failed: ['tx_root'], green: ['fetch', 'link', 'seal', 'sigs'] },
  seal: { failed: ['seal'], green: ['fetch', 'link', 'txroot', 'sigs'] },
  prev_hash: { failed: ['link_back', 'link_forward', 'seal'], green: ['fetch', 'txroot', 'sigs'] },
  state_root: { failed: ['link_forward', 'seal'], green: ['fetch', 'txroot', 'sigs'] },
};

test('each tamper kind turns exactly the right checks red, on a block with transactions', async () => {
  assert.deepEqual(V.TAMPERS.map((t) => t.id).sort(), Object.keys(EXPECT).sort());
  for (const kind of Object.keys(EXPECT)) {
    const s = set(3247);
    const t = V.tamperSet(s, kind);
    const r = await V.runSteps(baseOf(t.set, { tamper: t.note }));
    assert.deepEqual(ids(r), EXPECT[kind].failed, kind + ': ' + r.summary);
    assert.equal(r.verdict, 'fail', kind);
    for (const id of EXPECT[kind].green) assert.equal(stateOf(r)[id], 'pass', kind + ' leaves ' + id + ' green');
    assert.ok(t.note.text.length > 20 && t.note.where, kind);
    assert.match(V.caughtBy(r), /^Caught by /, kind);
    // the original set is untouched: tampering works on a copy, in memory
    assert.deepEqual(s, set(3247), kind + ' did not change the fetched copy');
    assert.equal((await V.runSteps(baseOf(s))).verdict, 'pass');
  }
});

test('each tamper kind changes exactly one thing, and says what', () => {
  const s = set(3247);
  const diff = (kind) => {
    const t = V.tamperSet(s, kind).set;
    const was = JSON.stringify(s);
    const now = JSON.stringify(t);
    return { was, now, t };
  };
  const title = diff('title');
  const tn = V.tamperSet(s, 'title').note;
  const was = s.block.txs[tn.txIndex].tx[tn.field];
  const now = title.t.block.txs[tn.txIndex].tx[tn.field];
  assert.equal(now.length, was.length);
  assert.notEqual(now, was);
  assert.equal(now.toLowerCase(), was.toLowerCase(), 'one letter changed case');
  assert.equal(Array.from(was).filter((c, i) => c !== Array.from(now)[i]).length, 1);
  assert.deepEqual(title.t.block.header, s.block.header);
  const sig = diff('tx_signature');
  const a = pcc.hexToBytes(s.block.txs[0].signature);
  const b = pcc.hexToBytes(sig.t.block.txs[0].signature);
  assert.equal(a.filter((x, i) => x !== b[i]).length, 1, 'one byte of the signature');
  assert.equal(a[0] ^ b[0], 1);
  const drop = diff('tx_drop');
  assert.equal(drop.t.block.txs.length, s.block.txs.length - 1);
  for (const [kind, field] of [['seal', 'sequencer_sig'], ['prev_hash', 'prev_hash'], ['state_root', 'state_root']]) {
    const t = diff(kind).t;
    const x = pcc.hexToBytes(s.block.header[field]);
    const y = pcc.hexToBytes(t.block.header[field]);
    assert.equal(x.filter((v, i) => v !== y[i]).length, 1, kind);
    assert.deepEqual(t.block.txs, s.block.txs, kind + ' leaves the transactions alone');
    assert.deepEqual(t.prev, s.prev);
    assert.deepEqual(t.next, s.next);
  }
});

test('on an empty block the transaction tampers are off, the header ones still work', async () => {
  const s = set(3318);
  assert.deepEqual(V.tamperAvailable(s.block), { title: false, tx_signature: false, prev_hash: true, seal: true, state_root: true, tx_drop: false });
  for (const kind of ['title', 'tx_signature', 'tx_drop']) assert.throws(() => V.tamperSet(s, kind), /no transaction/);
  for (const kind of ['seal', 'prev_hash', 'state_root']) {
    const t = V.tamperSet(s, kind);
    const r = await V.runSteps(baseOf(t.set, { tamper: t.note }));
    assert.deepEqual(ids(r), EXPECT[kind].failed, kind);
  }
  assert.deepEqual(V.tamperAvailable(set(3247).block), { title: true, tx_signature: true, prev_hash: true, seal: true, state_root: true, tx_drop: true });
  assert.throws(() => V.tamperSet(s, 'nonsense'), /unknown tamper kind/);
});

test('a title tamper on a kind without a title still flips a text field; on a lone transaction a drop leaves the empty root to fail', async () => {
  const s = set(690);
  assert.equal(s.block.txs[0].tx.type, 'claim_station');
  const t = V.tamperSet(s, 'title');
  assert.ok(['name', 'code'].includes(t.note.field), t.note.field);
  const r = await V.runSteps(baseOf(t.set, { tamper: t.note }));
  assert.deepEqual(ids(r), ['sig:0', 'tx_root']);
  const d = V.tamperSet(s, 'tx_drop');
  assert.equal(d.set.block.txs.length, 0);
  assert.deepEqual(ids(await V.runSteps(baseOf(d.set, { tamper: d.note }))), ['tx_root']);
});

test('the tamper is shown: changed rows, a tx_root row that differs, and the caught-by sentence', async () => {
  const s = set(3247);
  const t = V.tamperSet(s, 'title');
  const r = await V.runSteps(baseOf(t.set, { tamper: t.note }));
  const rows = r.steps.flatMap((x) => x.groups.flatMap((g) => g.rows));
  assert.ok(rows.some((x) => x.changed && x.k.startsWith(t.note.field)), 'the changed text is flagged');
  const root = rows.find((x) => x.k === 'tx_root recomputed');
  assert.equal(root.cmp, 'bad');
  assert.equal(root.want, s.block.header.tx_root);
  assert.notEqual(root.v, root.want);
  assert.equal(V.caughtBy(r), 'Caught by step 4 (the tx_root) and step 5 (the signatures). Still passing: step 1 (the fetch), step 2 (the links) and step 3 (the seal).');
  const p = V.tamperSet(s, 'prev_hash');
  const rp = await V.runSteps(baseOf(p.set, { tamper: p.note }));
  assert.equal(V.caughtBy(rp), 'Caught by step 2 (the links) and step 3 (the seal). Still passing: step 1 (the fetch), step 4 (the tx_root) and step 5 (the signatures).');
  assert.equal(V.caughtBy(await V.runSteps(baseOf(s))), '');
  assert.ok(rp.steps.flatMap((x) => x.groups.flatMap((g) => g.rows)).some((x) => x.changed && x.k === 'prev_hash'));
});

// ---------------------------------------------------------------- signature modes and sender derivation (synthetic keys)

async function signedBlockFor(mode, signerIsSender = true) {
  const pair = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const other = await crypto.subtle.generateKey('Ed25519', true, ['sign', 'verify']);
  const pubOf = async (k) => ({ scheme: 'ed25519', bytes: pcc.bytesToHex(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey))) });
  const senderKey = await pubOf(pair);
  const signer = signerIsSender ? pair : other;
  const signerKey = signerIsSender ? senderKey : await pubOf(other);
  const tx = { sender: pcc.tezosAddress(senderKey), nonce: 0, type: 'publish_block', channel: 'FD', title: 'a hand-made test line', body_hash: '00'.repeat(32), media_uri: null };
  const domain = pcc.domainOf(fixture.chain_id, GENESIS);
  const digest = mode === 'raw' ? pcc.signingHash(tx, domain) : pcc.walletSignedDigest(pcc.walletText(tx, domain, pcc.walletTextVersion(fixture.params)));
  const sig = pcc.bytesToHex(new Uint8Array(await crypto.subtle.sign('Ed25519', signer.privateKey, pcc.hexToBytes(digest))));
  const stx = { tx, public_key: signerKey, signature: sig };
  if (mode === 'tezos_message') stx.sig_mode = 'tezos_message';
  const s = set(3318);
  s.block.txs = [stx];
  return s;
}

test('raw and wallet-signed ed25519 signatures check; a key that does not derive the sender is "not checked", never a pass', async () => {
  for (const mode of ['raw', 'tezos_message']) {
    const s = await signedBlockFor(mode);
    const r = await V.runSteps(baseOf(s));
    const c = (id) => r.checks.find((x) => x.id === id);
    assert.equal(c('sig:0').state, 'pass', mode);
    assert.equal(c('sender:0').state, 'pass', mode);
    // the hand-made block is not sealed, so those checks are red: only the two under test are isolated here
    assert.ok(r.failed.includes('tx_root'));
    const bad = clone(s);
    bad.block.txs[0].signature = pcc.bytesToHex(pcc.hexToBytes(bad.block.txs[0].signature).map((b, i) => (i === 3 ? b ^ 1 : b)));
    assert.equal((await V.runSteps(baseOf(bad))).checks.find((x) => x.id === 'sig:0').state, 'fail', mode + ' flipped');
  }
  const foreign = await signedBlockFor('raw', false);
  const r = await V.runSteps(baseOf(foreign));
  assert.equal(r.checks.find((x) => x.id === 'sig:0').state, 'pass', 'signed correctly by the key it carries');
  assert.equal(r.checks.find((x) => x.id === 'sender:0').state, 'skip');
  assert.match(r.checks.find((x) => x.id === 'sender:0').text, /controllers or a device pass/);
  assert.ok(!r.failed.includes('sender:0'));
});

test('a passkey transaction (P-256 in a WebAuthn envelope) is named and left unchecked, never passed or failed, and nothing throws', async () => {
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const key = pcc.p256PublicKey(new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey)));
  const tx = { sender: pcc.passkeyAddress(key), nonce: 0, type: 'publish_block', channel: 'FD', title: 'a passkey test line', body_hash: '00'.repeat(32), media_uri: null };
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, new Uint8Array([1, 2, 3])));
  const envelope = pcc.webauthnEnvelope({ authenticatorData: new Uint8Array(37), clientDataJSON: new TextEncoder().encode('{}'), signature: sig });
  const s = set(3318);
  s.block.txs = [{ tx, sig_mode: 'webauthn', public_key: key, signature: envelope }];
  const r = await V.runSteps(baseOf(s));
  const c = (id) => r.checks.find((x) => x.id === id);
  assert.equal(c('sig:0').state, 'skip');
  assert.match(c('sig:0').text, /^Not checked: a passkey signs with P-256 inside a WebAuthn envelope/);
  assert.equal(c('sender:0').state, 'pass', 'the pcp1 address still derives from the passkey’s key');
  assert.equal(c('tx_root').state, 'fail', 'the id is computed (the SDK’s txHash), and this hand-made block’s root is not the header’s');
  const groupRows = r.steps.find((x) => x.id === 'txroot').groups.flatMap((g) => g.rows);
  assert.ok(groupRows.some((x) => x.k === 'signature mode' && /passkey envelope/.test(x.v)));
  const t = V.tamperSet(s, 'tx_signature');
  assert.notEqual(t.set.block.txs[0].signature, envelope);
  assert.equal(t.set.block.txs[0].signature.length, envelope.length);
  await assert.doesNotReject(V.runSteps(baseOf(t.set, { tamper: t.note })));
});

test('a browser without ed25519 in WebCrypto: the seal and the signatures are "not checked", nothing fails and nothing is claimed', async () => {
  const saved = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true });
  let r;
  try {
    r = await V.runSteps(baseOf(set(3247)));
  } finally {
    Object.defineProperty(globalThis, 'crypto', saved);
  }
  assert.deepEqual(r.failed, []);
  assert.equal(r.verdict, 'partial');
  assert.deepEqual(r.skipped.sort(), ['seal', 'sig:0', 'sig:1', 'sig:2']);
  assert.deepEqual(stateOf(r), { fetch: 'pass', link: 'pass', seal: 'skip', txroot: 'pass', sigs: 'skip' });
  assert.match(r.checks.find((c) => c.id === 'seal').text, /no ed25519/);
  assert.match(r.summary, /^Block 3247: nothing failed, but 4 checks could not run/);
  assert.equal((await V.runSteps(baseOf(set(3247)))).verdict, 'pass', 'and WebCrypto is back');
});

test('a transaction kind the page cannot encode leaves the tx_root and its signature unchecked and says which', async () => {
  const s = set(3247);
  s.block.txs[0].tx.type = 'a_kind_from_the_future';
  const r = await V.runSteps(baseOf(s));
  const root = r.checks.find((c) => c.id === 'tx_root');
  assert.equal(root.state, 'skip');
  assert.match(root.text, /cannot encode tx 0 \(a_kind_from_the_future\)/);
  assert.equal(r.steps.find((x) => x.id === 'txroot').state, 'skip');
  assert.equal(r.checks.find((c) => c.id === 'sig:0').state, 'skip', 'its signing digest cannot be rebuilt either');
  assert.match(r.checks.find((c) => c.id === 'sig:0').text, /^Not checked: /);
  assert.deepEqual(r.failed, []);
  assert.equal(r.verdict, 'partial', 'nothing failed, and nothing is claimed for that block');
  assert.ok(r.skipped.includes('tx_root') && r.skipped.includes('sig:0'));
});

test('the wasm second opinion: the chain’s own tx.wallet agrees on every signing digest (when the pinned wasm loads)', async () => {
  const wasmUrl = new URL('public/chain/yard/verifier/pointcast_chain.wasm', root);
  const bytes = readFileSync(wasmUrl);
  const loaded = await V.loadWasmVerifier({ url: 'http://x/pointcast_chain.wasm', sha256: WASM_SHA256, fetch: async () => new Response(bytes) });
  assert.equal(loaded.sha256, WASM_SHA256);
  const s = set(3247);
  const params = pcc.parseJsonExact(JSON.stringify(fixture.params));
  const r = await V.runSteps(baseOf(s, { params, verifier: loaded.verifier }));
  const w = r.checks.filter((c) => c.id.startsWith('wasm:'));
  assert.equal(w.length, 3);
  assert.deepEqual(w.map((c) => c.state), ['pass', 'pass', 'pass']);
  assert.equal(r.verdict, 'pass');
  const words = r.steps.find((x) => x.id === 'sigs').groups.flatMap((g) => g.rows).filter((x) => x.k === 'the chain’s own words');
  assert.ok(words.length >= 1 && /mint|publish/.test(words[0].v), words[0] && words[0].v);
  // a tampered title: the wasm still agrees on the digest of what you hold; the signature is what goes red
  const t = V.tamperSet(s, 'title');
  const rt = await V.runSteps(baseOf(t.set, { params, verifier: loaded.verifier, tamper: t.note }));
  assert.equal(rt.checks.find((c) => c.id === 'wasm:0').state, 'pass');
  assert.equal(rt.checks.find((c) => c.id === 'sig:0').state, 'fail');
  // a verifier that is not the pinned one is refused
  await assert.rejects(V.loadWasmVerifier({ url: 'http://x/y.wasm', sha256: WASM_SHA256, fetch: async () => new Response(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])) }), /not the verifier wasm this page pins/);
  await assert.rejects(V.loadWasmVerifier({ url: 'http://x/y.wasm', sha256: WASM_SHA256, fetch: async () => new Response('no', { status: 404 }) }), /did not load/);
});

// ---------------------------------------------------------------- the view, in jsdom, against a fake devnet

const SKELETON =
  '<section data-verify-app data-state="static" data-api="' + DEVNET.url + '" data-genesis="' + DEVNET.genesis + '" data-wasm="/w.wasm" data-wasm-sha256="' + WASM_SHA256 + '" class="vb">' +
  '<form data-vb-form><input data-vb-input disabled><button type="submit" data-vb-go disabled></button><button type="button" data-vb-prev disabled></button><button type="button" data-vb-next disabled></button>' +
  '<button type="button" data-vb-near disabled></button><button type="button" data-vb-random disabled></button><button type="button" data-vb-txs disabled></button></form>' +
  '<p data-vb-status></p><p data-vb-block></p><p data-vb-genesis-note hidden></p><code data-vb-pin-hash></code><span data-vb-pin-how></span><span data-vb-net></span>' +
  '<input type="checkbox" data-vb-tamper><select data-vb-kind></select><p data-vb-tamper-note></p>' +
  '<div data-vb-banner hidden><p data-vb-banner-what></p><p data-vb-banner-caught></p></div><ol>' +
  STEPS.map((s) => '<li data-step="' + s.id + '"><span data-vb-mark></span><span data-vb-state></span><p data-vb-tool></p><ul data-vb-checks></ul><div data-vb-groups></div></li>').join('') +
  '</ol><button data-vb-wasm></button><button data-vb-walk disabled></button><p data-vb-walk-result></p></section>';

/** A devnet served from the fixture: tip 3321, so the default block is 3318. */
function fakeDevnet(extra = {}) {
  const calls = [];
  const bodies = new Map();
  bodies.set('/status', JSON.stringify({ chain_id: fixture.chain_id, genesis_hash: GENESIS, height: extra.tip || 3321, tip_hash: '00'.repeat(32) }));
  bodies.set('/params', JSON.stringify(fixture.params));
  for (const [h, s] of Object.entries(fixture.sets)) {
    const n = Number(h);
    if (s.prev) bodies.set('/raw/block/' + (n - 1), JSON.stringify(s.prev));
    bodies.set('/raw/block/' + n, JSON.stringify(extra.mutate ? extra.mutate(n, s.block) : s.block));
    bodies.set('/raw/block/' + (n + 1), JSON.stringify(s.next));
  }
  bodies.set('/feed?limit=12', JSON.stringify({ tip: 3321, blocks: [{ height: 3247 }, { height: 249 }, { height: 'x' }, { height: 3247 }] }));
  const fetch = async (url) => {
    calls.push(String(url));
    const u = new URL(String(url));
    const body = bodies.get(u.pathname + u.search);
    return body === undefined ? new Response('{}', { status: 404 }) : new Response(body, { status: 200 });
  };
  return { fetch, calls };
}

function lesson(extra = {}, search = '') {
  const dom = new JSDOM('<!doctype html><html><body>' + SKELETON + '</body></html>', { url: 'http://localhost/chain/verify-a-block/' + search });
  const rootEl = dom.window.document.querySelector('[data-verify-app]');
  const net = fakeDevnet(extra);
  const c = view.mount(rootEl, { window: dom.window, fetch: net.fetch, random: () => 0, ...extra.env });
  return { dom, rootEl, net, c, doc: dom.window.document };
}
const text = (rootEl, sel) => rootEl.querySelector(sel).textContent;
const states = (rootEl) => [...rootEl.querySelectorAll('[data-step]')].map((x) => x.dataset.state);
const settle = () => new Promise((r) => setTimeout(r, 25));
/** Poll until cond() is true (the view's async runs take a few ticks), at most 3 seconds. */
async function until(cond, what, tries = 120) {
  for (let i = 0; i < tries; i++) {
    if (cond()) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  assert.fail('timed out waiting for ' + what);
}
const onBlock = (rootEl, n) => () => rootEl.dataset.busy === 'no' && rootEl.querySelector('[data-vb-block]').textContent.startsWith('Block ' + n + ' ') && rootEl.dataset.state === 'live';

test('the view skeleton in this test has the hooks the page has', () => {
  const skeletonHooks = new Set([...SKELETON.matchAll(/(data-[a-z-]+)/g)].map((m) => m[1]));
  for (const h of new Set([...viewSrc.matchAll(/\[(data-[a-z-]+)(?:=|\])/g)].map((m) => m[1]))) assert.ok(skeletonHooks.has(h), h);
});

test('begin() opens the default block, a few behind the tip, and every step passes', async () => {
  const { rootEl, net, c } = lesson();
  assert.equal(net.calls.length, 0, 'mounting reads nothing');
  assert.deepEqual(states(rootEl), ['idle', 'idle', 'idle', 'idle', 'idle']);
  await c.begin();
  assert.deepEqual(states(rootEl), ['pass', 'pass', 'pass', 'pass', 'pass']);
  assert.match(text(rootEl, '[data-vb-block]'), /^Block 3318 · 20\d\d-\d\d-\d\d \d\d:\d\d:\d\d UTC · 0 transactions · tip 3321/);
  assert.match(text(rootEl, '[data-vb-status]'), /^Block 3318: all \d+ checks passed\. It holds no transactions, so steps 4 and 5 have little to check/);
  assert.equal(rootEl.dataset.state, 'live');
  assert.equal(rootEl.dataset.verdict, 'pass');
  assert.equal(rootEl.querySelector('[data-vb-input]').value, '3318');
  assert.deepEqual(net.calls.filter((u) => u.includes('/raw/block/')).map((u) => new URL(u).pathname), ['/raw/block/3317', '/raw/block/3318', '/raw/block/3319']);
  assert.ok(net.calls.every((u) => u.startsWith(DEVNET.url)), 'only the devnet is read, only by GET');
  assert.match(text(rootEl, '[data-vb-pin-hash]'), new RegExp(GENESIS));
  assert.match(text(rootEl, '[data-vb-pin-how]'), /^pinned in this page/);
  assert.ok(rootEl.querySelectorAll('.vb-group').length >= 6);
  assert.ok(rootEl.querySelectorAll('.vb-ck').length >= 5);
  for (const m of rootEl.querySelectorAll('[data-vb-mark]')) assert.equal(m.textContent, '✓');
  for (const m of rootEl.querySelectorAll('.vb-ck__m')) assert.equal(m.ariaHidden, 'true', 'the mark is decorative: the word beside it is read');
  for (const m of rootEl.querySelectorAll('[data-vb-state]')) assert.equal(m.textContent, 'PASS');
});

test('picking a number, a random block and a block with transactions; the previous and next buttons', async () => {
  const { rootEl, c, net } = lesson();
  await c.begin();
  const input = rootEl.querySelector('[data-vb-input]');
  input.value = '3247';
  rootEl.querySelector('[data-vb-form]').dispatchEvent(new rootEl.ownerDocument.defaultView.Event('submit', { cancelable: true, bubbles: true }));
  await until(onBlock(rootEl, 3247), 'block 3247');
  assert.match(text(rootEl, '[data-vb-block]'), /^Block 3247 · .* · 3 transactions/);
  assert.deepEqual(states(rootEl), ['pass', 'pass', 'pass', 'pass', 'pass']);
  assert.ok(rootEl.querySelectorAll('.vb-ck').length >= 12);
  // nonsense input is refused in words and reads nothing new
  const before = net.calls.length;
  for (const bad of ['', 'abc', '0', '-4', '3322', '1.5']) {
    input.value = bad;
    rootEl.querySelector('[data-vb-form]').dispatchEvent(new rootEl.ownerDocument.defaultView.Event('submit', { cancelable: true, bubbles: true }));
  }
  await settle();
  assert.equal(net.calls.length, before);
  assert.match(text(rootEl, '[data-vb-status]'), /^Type a whole block number from 1 to 3321\./);
  // a block with transactions: the fake feed lists 3247 and 249; the current block is skipped
  rootEl.querySelector('[data-vb-txs]').click();
  await until(onBlock(rootEl, 249), 'block 249');
  assert.match(text(rootEl, '[data-vb-block]'), /^Block 249 · /, 'random() is 0 and 3247 is already open, so the other one');
  // random(): 0 gives block 1
  rootEl.querySelector('[data-vb-random]').click();
  await until(onBlock(rootEl, 1), 'block 1');
  assert.match(text(rootEl, '[data-vb-block]'), /^Block 1 · timestamp 0 · 12 transactions/);
  assert.equal(rootEl.querySelector('[data-vb-prev]').disabled, true, 'nothing before block 1');
  assert.deepEqual(states(rootEl), ['pass', 'pass', 'pass', 'pass', 'pass']);
});

test('the TAMPER toggle re-runs the steps from memory and shows which check catches it', async () => {
  const { rootEl, c, net, doc } = lesson();
  await c.begin();
  const reads = net.calls.length;
  const box = rootEl.querySelector('[data-vb-tamper]');
  const sel = rootEl.querySelector('[data-vb-kind]');
  assert.equal(sel.disabled, true, 'the kind menu waits for the toggle');
  assert.equal(sel.options.length, V.TAMPERS.length);
  assert.equal(rootEl.querySelector('[data-vb-banner]').hidden, true);
  box.checked = true;
  box.dispatchEvent(new doc.defaultView.Event('change', { bubbles: true }));
  await until(() => states(rootEl).join() === 'pass,fail,fail,pass,pass', 'the prev_hash tamper');
  assert.equal(sel.disabled, false);
  assert.equal(net.calls.length, reads, 'tampering reads nothing and writes nothing');
  assert.equal(sel.value, 'prev_hash', 'the first choice on a block with no transactions');
  assert.deepEqual(states(rootEl), ['pass', 'fail', 'fail', 'pass', 'pass']);
  assert.equal(rootEl.querySelector('[data-vb-banner]').hidden, false);
  assert.match(text(rootEl, '[data-vb-banner-what]'), /prev_hash: 0x[0-9a-f]{2} became 0x[0-9a-f]{2}/);
  assert.match(text(rootEl, '[data-vb-banner-caught]'), /^Caught by step 2 \(the links\) and step 3 \(the seal\)/);
  assert.match(text(rootEl, '[data-vb-status]'), /Caught by step 2/);
  assert.ok(rootEl.querySelectorAll('mark.vb-diff').length >= 1, 'the differing characters are marked');
  assert.ok(rootEl.querySelectorAll('.vb-r--changed').length >= 1);
  for (const m of [...rootEl.querySelectorAll('[data-step]')].filter((x) => x.dataset.state === 'fail')) assert.equal(m.querySelector('[data-vb-mark]').textContent, '✗');
  // the transaction choices are disabled on an empty block
  assert.deepEqual([...sel.options].filter((o) => o.disabled).map((o) => o.value).sort(), ['title', 'tx_drop', 'tx_signature']);
  // move to a block with transactions, flip a signature byte
  rootEl.querySelector('[data-vb-input]').value = '3247';
  rootEl.querySelector('[data-vb-form]').dispatchEvent(new doc.defaultView.Event('submit', { cancelable: true, bubbles: true }));
  await until(onBlock(rootEl, 3247), 'block 3247 (still tampered with prev_hash)');
  assert.deepEqual([...sel.options].filter((o) => o.disabled), []);
  sel.value = 'tx_signature';
  sel.dispatchEvent(new doc.defaultView.Event('change', { bubbles: true }));
  await until(() => states(rootEl).join() === 'pass,pass,pass,fail,fail', 'the signature tamper');
  assert.deepEqual(states(rootEl), ['pass', 'pass', 'pass', 'fail', 'fail']);
  assert.match(text(rootEl, '[data-vb-banner-caught]'), /^Caught by step 4 \(the tx_root\) and step 5 \(the signatures\)\. Still passing: step 1 \(the fetch\), step 2 \(the links\) and step 3 \(the seal\)\./);
  // toggle off: green again, banner hidden
  box.checked = false;
  box.dispatchEvent(new doc.defaultView.Event('change', { bubbles: true }));
  await until(() => states(rootEl).join() === 'pass,pass,pass,pass,pass', 'tamper off');
  assert.equal(rootEl.querySelector('[data-vb-banner]').hidden, true);
});

test('hostile text from the devnet becomes text: no element, no attribute, no script', async () => {
  const evil = '<img src=x onerror=alert(1)><script>window.pwned=1</script> "><b>x</b>';
  const { rootEl, c, dom } = lesson({
    mutate: (n, b) => {
      if (n !== 3247) return b;
      const x = clone(b);
      x.txs[1].tx.title = evil;
      x.txs[1].tx.sender = '<svg onload=alert(2)>';
      x.txs[0].tx.type = '<iframe src=javascript:alert(3)>';
      return x;
    },
  });
  await c.begin();
  rootEl.querySelector('[data-vb-input]').value = '3247';
  rootEl.querySelector('[data-vb-form]').dispatchEvent(new dom.window.Event('submit', { cancelable: true, bubbles: true }));
  await until(onBlock(rootEl, 3247), 'block 3247 with hostile text');
  const shown = rootEl.textContent;
  assert.ok(shown.includes('&lt;') === false && shown.includes('<img src=x onerror=alert(1)>'), 'the hostile title is on screen as characters');
  for (const tag of ['img', 'script', 'svg', 'iframe', 'b']) assert.equal(rootEl.querySelectorAll(tag).length, 0, tag + ' elements');
  assert.equal(dom.window.pwned, undefined);
  for (const el of rootEl.querySelectorAll('*')) for (const a of el.attributes) assert.ok(!/^on/i.test(a.name), el.localName + ' has ' + a.name);
  // the run is red, because the title no longer matches its seal: the page says so instead of hiding it
  assert.equal(rootEl.dataset.verdict, 'fail');
});

test('the transaction kinds row of step 1 is cut to one safe line each: a short hostile kind with a bidi override and a long one are cleaned', async () => {
  const long = 'K'.repeat(60);
  const { rootEl, c, dom } = lesson({
    mutate: (n, b) => {
      if (n !== 3247) return b;
      const x = clone(b);
      x.txs[0].tx.type = 'ty\u202Epe\u0007';
      x.txs[1].tx.type = long;
      return x;
    },
  });
  await c.begin();
  rootEl.querySelector('[data-vb-input]').value = '3247';
  rootEl.querySelector('[data-vb-form]').dispatchEvent(new dom.window.Event('submit', { cancelable: true, bubbles: true }));
  await until(onBlock(rootEl, 3247), 'block 3247 with hostile kinds');
  const rows = [...rootEl.querySelectorAll('.vb-r')].filter((r) => r.querySelector('.vb-r__k') && r.querySelector('.vb-r__k').textContent === 'transactions');
  assert.ok(rows.length > 0, 'the transactions row is on screen');
  const shown = rows.map((r) => r.querySelector('.vb-r__v').textContent).join(' || ');
  assert.ok(!/[\u202E\u0007]/.test(shown), 'no bidi override or bell reaches the page: ' + JSON.stringify(shown));
  assert.ok(shown.includes('ty pe'), 'the override and the bell became spaces: ' + JSON.stringify(shown));
  assert.ok(shown.includes('K'.repeat(31) + '…'), 'a long kind is cut at 32 characters with an ellipsis: ' + JSON.stringify(shown));
  assert.ok(!shown.includes(long), 'the full 60 characters are not shown');
});

/** A browser drops the focus to <body> when the focused control becomes disabled; jsdom does not, so this does what Chrome does. */
function dropFocusWhenDisabled(win) {
  for (const proto of [win.HTMLButtonElement.prototype, win.HTMLInputElement.prototype]) {
    const d = Object.getOwnPropertyDescriptor(proto, 'disabled');
    Object.defineProperty(proto, 'disabled', { configurable: true, get: d.get, set(v) { if (v && this.ownerDocument.activeElement === this) this.blur(); d.set.call(this, v); } });
  }
}

test('keyboard focus survives a block change: Next, Previous and the number field keep (or get back) the focus when the run disables them', async () => {
  const { rootEl, c, dom } = lesson();
  dropFocusWhenDisabled(dom.window);
  const doc = dom.window.document;
  await c.begin();
  const next = rootEl.querySelector('[data-vb-next]');
  const prev = rootEl.querySelector('[data-vb-prev]');
  const input = rootEl.querySelector('[data-vb-input]');
  const n0 = c.state.n;
  assert.equal(n0, 3318, 'the default block is a few behind the tip of 3321');
  // Enter on Next: the block changes and the focus is still on Next (it was <body> before)
  next.focus();
  assert.equal(doc.activeElement, next);
  next.click();
  await until(onBlock(rootEl, n0 + 1), 'the next block');
  assert.equal(doc.activeElement, next, 'focus is on Next again, so Enter can step on');
  prev.focus();
  prev.click();
  await until(onBlock(rootEl, n0), 'the previous block');
  assert.equal(doc.activeElement, prev);
  // Enter in the number field
  input.focus();
  input.value = '3247';
  rootEl.querySelector('[data-vb-form]').dispatchEvent(new dom.window.Event('submit', { cancelable: true, bubbles: true }));
  await until(onBlock(rootEl, 3247), 'the typed block');
  assert.equal(doc.activeElement, input, 'the field keeps the focus after Enter');
  // focus that was elsewhere is not pulled onto a control by a run
  doc.activeElement.blur();
  input.value = String(n0);
  rootEl.querySelector('[data-vb-form]').dispatchEvent(new dom.window.Event('submit', { cancelable: true, bubbles: true }));
  await until(onBlock(rootEl, n0), 'back to the first block');
  assert.equal(doc.activeElement, doc.body, 'nothing had the focus, nothing is given it');
});

test('a control a run leaves off (Next at the tip) hands the focus to the line that names the block, not to <body>', async () => {
  const { rootEl, c, dom } = lesson({ tip: 3319, env: { hash: '#b=3318' } });
  dropFocusWhenDisabled(dom.window);
  const doc = dom.window.document;
  await c.begin();
  const next = rootEl.querySelector('[data-vb-next]');
  assert.equal(c.state.n, 3318);
  assert.equal(c.state.tip, 3319);
  next.focus();
  next.click();
  await until(onBlock(rootEl, 3319), 'the tip');
  assert.equal(next.disabled, true, 'Next is off at the tip');
  assert.notEqual(doc.activeElement, doc.body, 'focus is not thrown to <body>');
  assert.equal(doc.activeElement, rootEl.querySelector('[data-vb-block]'), 'it goes to the line that names the block');
  // and Previous is back on, with the keyboard able to step the other way
  const prev = rootEl.querySelector('[data-vb-prev]');
  assert.equal(prev.disabled, false);
  prev.focus();
  prev.click();
  await until(onBlock(rootEl, 3318), 'back one');
  assert.equal(doc.activeElement, prev);
});

test('the genesis pin: a devnet that was reset reports another genesis, is called out, and the steps fail at the pin', async () => {
  const net = fakeDevnet();
  const reset = clone(fixture.params);
  reset.tap_reward += 1;
  const other = pcc.paramsHash(reset);
  assert.notEqual(other, GENESIS);
  const f = async (url) => {
    const path = new URL(String(url)).pathname;
    if (path === '/status') return new Response(JSON.stringify({ chain_id: fixture.chain_id, genesis_hash: other, height: 3321 }));
    if (path === '/params') return new Response(JSON.stringify(reset));
    return net.fetch(url);
  };
  const dom = new JSDOM('<!doctype html><html><body>' + SKELETON + '</body></html>', { url: 'http://localhost/' });
  const rootEl = dom.window.document.querySelector('[data-verify-app]');
  const c = view.mount(rootEl, { window: dom.window, fetch: f });
  await c.begin();
  const note = rootEl.querySelector('[data-vb-genesis-note]');
  assert.equal(note.hidden, false);
  assert.match(note.textContent, /^GENESIS CHANGED\./);
  assert.ok(note.textContent.includes(other) && note.textContent.includes(GENESIS));
  assert.match(note.textContent, /a reset is dated and recorded/);
  assert.equal(rootEl.dataset.verdict, 'fail', 'the params do not hash to the pin of this page');
  assert.equal(rootEl.querySelector('[data-step="seal"]').dataset.state, 'fail');
  assert.match(rootEl.querySelector('[data-step="seal"]').textContent, /do not hash to the genesis hash you trust/);
});

test('a reset while the page is open: the next read notices the new genesis and says so', async () => {
  const net = fakeDevnet();
  const reset = clone(fixture.params);
  reset.tap_reward += 1;
  const other = pcc.paramsHash(reset);
  let gone = false;
  const f = async (url) => {
    const path = new URL(String(url)).pathname;
    if (gone && path === '/status') return new Response(JSON.stringify({ chain_id: fixture.chain_id, genesis_hash: other, height: 3321 }));
    if (gone && path === '/params') return new Response(JSON.stringify(reset));
    return net.fetch(url);
  };
  const dom = new JSDOM('<!doctype html><html><body>' + SKELETON + '</body></html>', { url: 'http://localhost/' });
  const rootEl = dom.window.document.querySelector('[data-verify-app]');
  const c = view.mount(rootEl, { window: dom.window, fetch: f });
  await c.begin();
  assert.equal(rootEl.querySelector('[data-vb-genesis-note]').hidden, true);
  assert.equal(rootEl.dataset.verdict, 'pass');
  gone = true;
  rootEl.querySelector('[data-vb-near]').click();
  await until(() => rootEl.dataset.busy === 'no' && rootEl.querySelector('[data-vb-genesis-note]').hidden === false, 'the reset to be noticed');
  assert.match(rootEl.querySelector('[data-vb-genesis-note]').textContent, /^GENESIS CHANGED\./);
  assert.equal(rootEl.dataset.verdict, 'fail');
});

test('?devnet= points the lesson at a local node, unpinned, and a lookalike is ignored', async () => {
  const net = fakeDevnet();
  const dom = new JSDOM('<!doctype html><html><body>' + SKELETON + '</body></html>', { url: 'http://localhost/chain/verify-a-block/?devnet=http://127.0.0.1:8799' });
  const rootEl = dom.window.document.querySelector('[data-verify-app]');
  const c = view.mount(rootEl, { window: dom.window, fetch: async (u) => net.fetch(String(u).replace('http://127.0.0.1:8799', DEVNET.url)) });
  assert.equal(c.api, 'http://127.0.0.1:8799');
  assert.equal(c.genesisInfo().genesis, '', 'nothing is pinned until the node is read');
  await c.begin();
  assert.equal(c.genesisInfo().source, 'node');
  assert.match(text(rootEl, '[data-vb-pin-how]'), /^taken from this local node for a local test/);
  assert.match(text(rootEl, '[data-vb-net]'), /local override/);
  assert.deepEqual(states(rootEl), ['pass', 'pass', 'pass', 'pass', 'pass']);
  // a lookalike host: ignored, the page's own devnet is used
  for (const bad of ['?devnet=http://127.0.0.1.evil.example', '?devnet=https://evil.example', '?devnet=http://localhost@evil.example']) {
    const d2 = new JSDOM('<!doctype html><html><body>' + SKELETON + '</body></html>', { url: 'http://localhost/chain/verify-a-block/' + bad });
    const r2 = d2.window.document.querySelector('[data-verify-app]');
    const c2 = view.mount(r2, { window: d2.window, fetch: net.fetch });
    assert.equal(c2.api, DEVNET.url, bad);
    assert.equal(c2.genesisInfo().genesis, GENESIS, bad);
  }
});

test('an unreachable devnet is said in words, the controls come back, and nothing throws', async () => {
  const dom = new JSDOM('<!doctype html><html><body>' + SKELETON + '</body></html>', { url: 'http://localhost/' });
  const rootEl = dom.window.document.querySelector('[data-verify-app]');
  let n = 0;
  const c = view.mount(rootEl, { window: dom.window, fetch: async () => { n += 1; throw new Error('network down'); } });
  await c.begin();
  assert.equal(rootEl.dataset.state, 'down');
  assert.match(text(rootEl, '[data-vb-status]'), /^The devnet is unreachable\./);
  assert.deepEqual(states(rootEl), ['idle', 'idle', 'idle', 'idle', 'idle']);
  assert.equal(rootEl.querySelector('[data-vb-go]').disabled, false, 'the reader can try again');
  assert.ok(n >= 1);
  const miss = fakeDevnet({ tip: 3321 });
  const c2 = lesson({ tip: 3321 });
  await c2.c.begin();
  c2.rootEl.querySelector('[data-vb-input]').value = '3321';
  c2.rootEl.querySelector('[data-vb-form]').dispatchEvent(new c2.dom.window.Event('submit', { cancelable: true, bubbles: true }));
  await until(() => c2.rootEl.dataset.busy === 'no' && /^Could not read that block/.test(text(c2.rootEl, '[data-vb-status]')), 'the missing block to be reported');
  assert.match(text(c2.rootEl, '[data-vb-status]'), /^Could not read that block: /, 'the fake devnet has no block 3321 or 3320');
  assert.equal(c2.rootEl.dataset.state, 'live', 'the last good result stays on screen');
  assert.ok(miss);
});

test('the lazy start: nothing is read at import or mount, only after load, idle, near the viewport and a visible tab', async () => {
  const realFetch = globalThis.fetch;
  let global = 0;
  globalThis.fetch = () => { global += 1; throw new Error('no fetch at import'); };
  try {
    await import('../public/chain/apps/verify.js?lazy=' + Date.now());
    await import('../public/chain/apps/verify-view.js?lazy=' + Date.now());
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(global, 0);
  for (const needle of ['requestIdleCallback', 'IntersectionObserver', "visibilityState !== 'hidden'", "addEventListener('load'", "rootMargin: '400px 0px'"]) assert.ok(viewSrc.includes(needle), needle);
  const build = (visible) => {
    const dom = new JSDOM('<!doctype html><html><body>' + SKELETON + '</body></html>', { url: 'http://localhost/' });
    const w = dom.window;
    let intersect = null;
    w.requestIdleCallback = (fn) => setTimeout(fn, 0);
    w.IntersectionObserver = class { constructor(cb) { intersect = cb; } observe() {} };
    Object.defineProperty(w.document, 'visibilityState', { get: () => (visible.now ? 'visible' : 'hidden'), configurable: true });
    const net = fakeDevnet();
    const rootEl = w.document.querySelector('[data-verify-app]');
    view.start(rootEl, { window: w, fetch: net.fetch });
    return { w, net, rootEl, ready: () => intersect !== null, intersect: (on) => intersect([{ isIntersecting: on }]) };
  };
  const loaded = async (x) => { for (let i = 0; i < 40 && !x.ready(); i++) await settle(); assert.ok(x.ready(), 'the observer is set up once the page has loaded'); };
  const a = build({ now: true });
  await loaded(a);
  assert.equal(a.net.calls.length, 0, 'loaded, but not near the viewport yet');
  assert.equal(a.net.calls.length, 0, 'not near the viewport yet');
  a.intersect(false);
  await settle();
  assert.equal(a.net.calls.length, 0);
  a.intersect(true);
  await settle(); await settle(); await settle();
  assert.ok(a.net.calls.length >= 3, 'near the viewport: read');
  const vis = { now: false };
  const b = build(vis);
  await loaded(b);
  b.intersect(true);
  await settle();
  assert.equal(b.net.calls.length, 0, 'a hidden tab reads nothing');
  vis.now = true;
  b.w.document.dispatchEvent(new b.w.Event('visibilitychange'));
  await settle(); await settle(); await settle();
  assert.ok(b.net.calls.length >= 3, 'visible again: read');
});

test('the wasm button loads the pinned verifier and step 5 gains a second opinion', async () => {
  const bytes = readFileSync(new URL('public/chain/yard/verifier/pointcast_chain.wasm', root));
  let asked = null;
  const { rootEl, c, dom } = lesson({
    env: { loadWasm: async (a) => { asked = a; return V.loadWasmVerifier({ ...a, fetch: async () => new Response(bytes) }); } },
  });
  await c.begin();
  rootEl.querySelector('[data-vb-input]').value = '3247';
  rootEl.querySelector('[data-vb-form]').dispatchEvent(new dom.window.Event('submit', { cancelable: true, bubbles: true }));
  await until(onBlock(rootEl, 3247), 'block 3247');
  assert.equal(rootEl.querySelectorAll('[data-step="sigs"] .vb-ck').length, 6, 'a signature and a sender check per transaction, before the wasm');
  rootEl.querySelector('[data-vb-wasm]').click();
  await until(() => rootEl.querySelectorAll('[data-step="sigs"] .vb-ck').length === 9, 'the wasm checks');
  assert.deepEqual(asked, { url: '/w.wasm', sha256: WASM_SHA256 });
  assert.equal(rootEl.querySelectorAll('[data-step="sigs"] .vb-ck').length, 9, 'plus one wasm check per transaction');
  assert.match(text(rootEl, '[data-vb-status]'), /^The chain’s own wasm is on\./);
  assert.match(text(rootEl, '[data-step="sigs"] [data-vb-tool]'), /pinned wasm/);
});

// ---------------------------------------------------------------- the real devnet: live (GET only) and local

/** fetch, with one more try when the connection is reset (a local wrangler worker drops idle sockets). */
async function sturdyFetch(u, o) {
  for (let i = 0; ; i++) {
    try { return await fetch(u, o); } catch (e) { if (i >= 2) throw e; await new Promise((r) => setTimeout(r, 150)); }
  }
}
const NET_ENV = { fetch: sturdyFetch };
async function reach(api) {
  try { return await V.loadChain(api, NET_ENV); } catch { return null; }
}
const LIVE = await reach(DEVNET.url);
const LOCAL = await reach('http://127.0.0.1:8799');
const live = LIVE && LIVE.paramsHash === DEVNET.genesis ? LIVE : null;

async function realRun(api, chain, pin, n, kind) {
  let blocks = await V.fetchBlockSet(api, n, NET_ENV);
  let note = null;
  if (kind) { const t = V.tamperSet(blocks, kind); blocks = t.set; note = t.note; }
  const report = await V.runSteps({ n, params: chain.params, genesis: pin, pinSource: 'pinned', chain, paths: blocks.paths, ...blocks, tamper: note });
  report.tamperNote = note;
  return report;
}

for (const [name, chainOf, pinOf, apiOf] of [
  ['live devnet-2 (GET only)', () => live, () => DEVNET.genesis, () => DEVNET.url],
  ['local devnet-2 at 127.0.0.1:8799', () => LOCAL, () => (LOCAL ? LOCAL.status.genesis : ''), () => 'http://127.0.0.1:8799'],
]) {
  test('real blocks, ' + name + ': the default block, a block with transactions and every tamper kind', async (t) => {
    const chain = chainOf();
    if (!chain) return t.skip(name + ' is not reachable (or its genesis is not the pinned one)');
    const api = apiOf();
    const pin = pinOf();
    assert.equal(chain.paramsHash, chain.status.genesis, 'the devnet’s own params hash to its own genesis');
    const tip = (await V.loadStatus(api, NET_ENV)).height;
    const n = V.defaultBlock(tip);
    const base = await realRun(api, chain, pin, n);
    assert.equal(base.verdict, 'pass', base.summary);
    const withTxs = await V.recentTxBlocks(api, NET_ENV);
    assert.ok(withTxs.length >= 1, 'a block with transactions exists');
    const target = withTxs[0];
    const ok = await realRun(api, chain, pin, target);
    assert.equal(ok.verdict === 'pass' || ok.verdict === 'partial', true, ok.summary);
    assert.deepEqual(ok.failed, []);
    for (const kind of Object.keys(EXPECT)) {
      const only = ok.verdict === 'partial' ? null : await realRun(api, chain, pin, target, kind);
      if (!only) continue;
      // "title" flips a letter of the first transaction that HAS text; on a block whose first transaction is a transfer that is not transaction 0
      const want = EXPECT[kind].failed
        .filter((x) => x !== 'link_forward' || only.checks.some((c) => c.id === 'link_forward' && c.state !== 'skip'))
        .map((x) => (kind === 'title' && x === 'sig:0' && only.tamperNote ? 'sig:' + only.tamperNote.txIndex : x));
      assert.deepEqual(ids(only), want.sort(), name + ' · block ' + target + ' · ' + kind);
    }
    // an empty block, if the default one is empty: the header tampers
    for (const kind of ['seal', 'prev_hash', 'state_root']) {
      const r = await realRun(api, chain, pin, n, kind);
      assert.deepEqual(ids(r), EXPECT[kind].failed, name + ' · block ' + n + ' · ' + kind);
    }
  });

  test('real blocks, ' + name + ': block 1 and a walk from block 1', async (t) => {
    const chain = chainOf();
    if (!chain) return t.skip(name + ' is not reachable');
    const api = apiOf();
    const pin = pinOf();
    const one = await realRun(api, chain, pin, 1);
    assert.equal(one.verdict, 'pass', one.summary);
    const upTo = Math.min(chain.status.height - 1, 40);
    const set1 = await V.fetchBlockSet(api, upTo, NET_ENV);
    const w = await V.walkToGenesis({ api, params: chain.params, genesis: pin, upTo, expectHash: V.headerHashOf(set1.block.header), env: NET_ENV });
    assert.equal(w.fault, null, V.walkSummary(w));
    assert.equal(w.checked, upTo);
    assert.equal(w.links, upTo);
    assert.equal(w.seals, upTo);
    assert.equal(w.matchesBlock, true);
    assert.match(V.walkSummary(w), /No state was replayed\./);
    // a served block with a changed prev_hash stops the walk exactly there
    const cut = Math.max(2, Math.min(upTo, 6));
    const evil = async (url, o) => {
      const res = await sturdyFetch(url, o);
      if (!String(url).includes('/raw/blocks')) return res;
      const body = pcc.parseJsonExact(await res.text());
      const b = body.blocks.find((x) => Number(x.header.height) === cut);
      if (b) b.header.prev_hash = pcc.bytesToHex(pcc.hexToBytes(b.header.prev_hash).map((x, i) => (i === 0 ? x ^ 1 : x)));
      return new Response(pcc.stringifyJsonExact(body));
    };
    const bad = await V.walkToGenesis({ api, params: chain.params, genesis: pin, upTo, env: { fetch: evil } });
    assert.equal(bad.fault.height, cut);
    assert.match(bad.fault.why, /prev_hash/);
    assert.match(V.walkSummary(bad), new RegExp('^The walk stopped at block ' + cut));
    // wrong pin: refused before any block is read
    const refused = await V.walkToGenesis({ api, params: chain.params, genesis: '22'.repeat(32), upTo, env: { fetch: () => { throw new Error('should not read'); } } });
    assert.match(refused.fault.why, /do not hash to the genesis hash you trust/);
    await assert.rejects(V.walkToGenesis({ api, params: chain.params, genesis: pin, upTo: V.LIMITS.walkMaxBlocks + 1, env: NET_ENV }), /more than/);
  });

  test('the lesson itself, in jsdom, against ' + name + ': open, tamper, walk', async (t) => {
    const chain = chainOf();
    if (!chain) return t.skip(name + ' is not reachable');
    const api = apiOf();
    const local = api !== DEVNET.url;
    const dom = new JSDOM('<!doctype html><html><body>' + SKELETON + '</body></html>', { url: 'http://localhost/chain/verify-a-block/' + (local ? '?devnet=' + api : '') });
    const rootEl = dom.window.document.querySelector('[data-verify-app]');
    const c = view.mount(rootEl, { window: dom.window, fetch: sturdyFetch });
    assert.equal(c.api, api);
    await c.begin();
    assert.deepEqual(states(rootEl), ['pass', 'pass', 'pass', 'pass', 'pass'], text(rootEl, '[data-vb-status]'));
    const box = rootEl.querySelector('[data-vb-tamper]');
    box.checked = true;
    box.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await until(() => states(rootEl).join() === 'pass,fail,fail,pass,pass', 'the tamper on the real block');
    // a short walk keeps the test quick: the whole chain is the e2e script's job
    const short = Math.min(40, chain.status.height - 2);
    rootEl.querySelector('[data-vb-input]').value = String(short);
    rootEl.querySelector('[data-vb-form]').dispatchEvent(new dom.window.Event('submit', { cancelable: true, bubbles: true }));
    await until(onBlock(rootEl, short), 'block ' + short);
    rootEl.querySelector('[data-vb-walk]').click();
    await until(() => /^Walked blocks 1 to /.test(text(rootEl, '[data-vb-walk-result]')) || /^The walk/.test(text(rootEl, '[data-vb-walk-result]')), 'the walk', 120);
    assert.match(text(rootEl, '[data-vb-walk-result]'), /^Walked blocks 1 to \d+: \d+ prev_hash links, \d+ seals checked under the genesis key, \d+ tx_roots rebuilt from \d+ transactions\./);
    assert.ok(text(rootEl, '[data-vb-walk-result]').endsWith('The walk ends at the block you examined. No state was replayed.'));
    assert.equal(rootEl.querySelector('[data-vb-walk-result]').dataset.state, 'pass');
  });

  test('"same steps, in code": the snippet on the page runs against ' + name + ' and every line is ok', async (t) => {
    const chain = chainOf();
    if (!chain) return t.skip(name + ' is not reachable');
    const api = apiOf();
    const tip = (await V.loadStatus(api, NET_ENV)).height;
    const txBlock = (await V.recentTxBlocks(api, NET_ENV)).find((h) => h >= 2 && h <= tip - 1);
    const dir = mkdtempSync(join(tmpdir(), 'pc-verify-snippet-'));
    try {
      copyFileSync(new URL('public/chain/first-mints/lib/pointcast-chain.js', root), join(dir, 'pointcast-chain.js'));
      writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
      writeFileSync(join(dir, 'verify-a-block.mjs'), snippet(api, chain.status.genesis) + '\n');
      for (const n of [V.defaultBlock(tip), txBlock].filter(Boolean)) {
        const r = spawnSync(process.execPath, [join(dir, 'verify-a-block.mjs'), String(n)], { cwd: dir, encoding: 'utf8', timeout: 60000 });
        assert.equal(r.status, 0, r.stderr);
        const out = r.stdout.trim().split('\n');
        assert.ok(out.length >= 4, r.stdout);
        for (const l of out) assert.ok(l.startsWith('ok '), 'block ' + n + ': ' + l);
        assert.ok(out.some((l) => l.includes('sequencer seal')));
        assert.ok(out.some((l) => l.includes('tx_root rebuilds')));
      }
      // a different genesis pin: the snippet refuses
      writeFileSync(join(dir, 'wrong.mjs'), snippet(api, '33'.repeat(32)) + '\n');
      const w = spawnSync(process.execPath, [join(dir, 'wrong.mjs'), '5'], { cwd: dir, encoding: 'utf8', timeout: 60000 });
      assert.notEqual(w.status, 0);
      assert.match(w.stderr, /params do not hash to the pinned genesis/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

// ---------------------------------------------------------------- the built page (skips while dist/ is absent)

const builtPath = new URL('dist/chain/verify-a-block/index.html', root);
test('the built page: one h1, the honesty paragraph, every control, the pins and the snippet as served',
  { skip: !existsSync(builtPath) && 'dist/ is absent: run npm run build:bare to check the built page' }, () => {
    const dom = new JSDOM(readFileSync(builtPath, 'utf8'));
    const doc = dom.window.document;
    assert.equal(doc.querySelectorAll('h1').length, 1);
    assert.equal(doc.querySelector('h1').textContent, 'Verify a block by hand.');
    assert.match(doc.title, /^Verify a block by hand on the PointCast devnet/);
    const honest = doc.querySelector('#honesty').textContent.replace(/\s+/g, ' ');
    for (const phrase of [HONESTY_LINE, DEVNET.chainId, 'A reset is dated and recorded, never silent', DEVNET_PREVIOUS.path, 'an accountable claim by a key, not proof that what it says is true', 'A witness or a stamp is the same.']) assert.ok(honest.includes(phrase), phrase);
    assert.equal(doc.querySelector('#honesty a').getAttribute('href'), DEVNET_PREVIOUS.path);
    const app = doc.querySelector('[data-verify-app]');
    assert.equal(app.dataset.api, DEVNET.url);
    assert.equal(app.dataset.genesis, DEVNET.genesis);
    assert.equal(app.dataset.chainId, DEVNET.chainId);
    assert.equal(app.dataset.wasmSha256, WASM_SHA256);
    for (const hook of ['data-vb-form', 'data-vb-input', 'data-vb-go', 'data-vb-near', 'data-vb-random', 'data-vb-txs', 'data-vb-prev', 'data-vb-next', 'data-vb-tamper', 'data-vb-kind', 'data-vb-banner', 'data-vb-wasm', 'data-vb-walk', 'data-vb-walk-result', 'data-vb-status'])
      assert.equal(app.querySelectorAll('[' + hook + ']').length, 1, hook);
    assert.equal(app.querySelectorAll('[data-step]').length, 5);
    assert.equal(doc.querySelector('[data-vb-status]').getAttribute('aria-live'), 'polite');
    assert.equal(doc.querySelector('[data-vb-walk-result]').getAttribute('aria-live'), 'polite');
    for (const b of app.querySelectorAll('button[data-vb-go], button[data-vb-near], button[data-vb-random], button[data-vb-txs], button[data-vb-walk]')) assert.ok(b.disabled, 'controls wait for the script');
    // the code block the page shows is exactly the file the tests run
    const shown = [...doc.querySelectorAll('.snip code')].map((c) => c.textContent).find((t) => t.includes('verify-a-block.mjs'));
    assert.equal(shown, snippet(DEVNET.url, DEVNET.genesis));
    // the hash links go to the Yard with the genesis pinned
    assert.ok([...doc.querySelectorAll('a')].some((a) => a.getAttribute('href') === DEVNET.yardHref));
    // the bootstrap is lazy, inline and imports only the view
    const boot = [...doc.querySelectorAll('script[type="module"]')].map((x) => x.textContent).find((t) => t.includes('verify-view.js'));
    assert.ok(boot && boot.includes("import('/chain/apps/verify-view.js')"));
    assert.doesNotMatch(boot, /fetch\(/);
    // no text in the art, no people, no places
    assert.equal(doc.querySelectorAll('.vb-art text, .vb-art image').length, 0);
  });

test('the snippet is plain strings: no template literals, no dollar sign, and it pins the genesis it is given', () => {
  const code = snippet('https://example.test', 'ab'.repeat(32));
  assert.ok(!code.includes(CURRENCY_SIGN));
  assert.ok(!code.includes(String.fromCharCode(96)));
  assert.ok(code.includes('const DEVNET = "https://example.test", GENESIS = "' + 'ab'.repeat(32) + '";'));
  assert.equal(code.split('\n').length, 15, 'fifteen lines, the header comment included');
  for (const name of ['paramsHash', 'blockHeaderHash', 'sealDigest', 'txRoot', 'signingHash', 'txHash', 'verifyEd25519', 'domainOf', 'parseJsonExact', 'hexToBytes']) {
    assert.ok(code.includes('pcc.' + name), name);
    assert.equal(typeof pcc[name], 'function', name);
  }
  assert.match(page, /code = snippet\(DEVNET\.url, DEVNET\.genesis\)/);
  assert.match(page, /<Snippet label="verify-a-block\.mjs/);
});
