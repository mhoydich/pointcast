// Honest copy for Nouns Money (plan §6): the "Never use" list as a test.
//
// - the scanner catches every banned group and lets the two approved lines
//   through (they say "$NOUNS", "redemption" and "balance" on purpose);
// - STRICT: the Phase A chain surfaces carry zero banned words;
// - LEGACY: no other Nouns Money source/page gains a banned word beyond
//   tests/fixtures/nouns-money-banned-baseline.json (a ratchet: down only);
// - the standard line is on every chain surface, and the "Use these words"
//   lines are verbatim;
// - the build gate: assertNmChainReady() throws on banned chain copy, and
//   refuses the flag while a chain surface still has banned words.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BANNED, extractCopy, scanSource, scanText, stringLiterals } from '../src/lib/nouns-money/honest-copy.mjs';
import { NM_APPROVED_LINES, NM_COPY, NM_REPLACEMENT_LINE, NM_STANDARD_LINE, allCopyStrings } from '../src/lib/nouns-money/chain-copy.mjs';
import { NM_CHAIN_SURFACE_SOURCES, NM_STRICT_SURFACES, assertNmChainReady, nmChainGaps } from '../src/data/nouns-money-chain.ts';
import { STRICT_FILES, legacyFiles, ratchetViolations, readBaseline, readRepo, scanFiles, scanStrict } from '../scripts/nm-honest-copy.mjs';

test('the plan’s lines are verbatim', () => {
  assert.equal(NM_STANDARD_LINE, 'Art on a test chain. No value, no redemption, may reset. Not $NOUNS. Not a claim on the Nouns treasury. No Nouns DAO endorsement. CC0.');
  assert.equal(NM_REPLACEMENT_LINE, 'A free devnet art record. No price, no balance, no redemption. Not transferable yet.');
  assert.deepEqual([...NM_COPY.supporting], ['The serial is a catalog number.', 'Money is the title of the artwork.']);
  assert.equal(NM_COPY.shelf.collectButton, 'Collect on devnet');
});

test('the scanner catches every "Never use" group', () => {
  const samples = {
    'money units': ['Worth $5 today', 'a $NOUNS bag', 'priced in USD', 'ten cents', 'a few dollars', 'legal tender'],
    printing: ['Print your own', 'printing press', 'the money printer', 'mint money'],
    banking: ['backed by art', 'fully backing it', 'a reserve', 'a peg', 'stake it', 'redeem it', 'redeemable', 'cash out', 'convert to', 'the bank', 'a deposit', 'your balance', 'proof of reserve'],
    investment: ['invest now', 'it will appreciate', 'the floor', 'early holders', 'an airdrop', 'your allocation', 'the allowlist'],
    spending: ['pay with notes', 'spend it', 'leave a tip', 'accepted at shops', 'a merchant'],
    hype: ['a billion', 'pump it', 'Pump.fun', 'DEX Screener', 'dexscreener'],
    endorsement: ['official Nouns art', 'DAO-backed', 'endorsed by'],
    evasive: ['no transfer of value'],
  };
  for (const [group, lines] of Object.entries(samples)) {
    for (const line of lines) {
      const hits = scanText(line);
      assert.ok(hits.length, `${group}: "${line}" must be caught`);
    }
  }
  assert.ok(new Set(BANNED.map(([, g]) => g)).size >= 8);
});

test('the scanner lets honest copy through, including the approved lines', () => {
  for (const ok of [
    NM_STANDARD_LINE,
    NM_REPLACEMENT_LINE,
    `${NM_STANDARD_LINE} ${NM_REPLACEMENT_LINE}`,
    'Collect a note. Hold it. Check it.',
    'The specimen is on the house shelf; 3 of 10 copies left.',
    'Back to the collection',
    'A blueprint, a fingerprint and a tooltip are fine.',
  ]) {
    assert.deepEqual(scanText(ok), [], ok);
  }
  // Only the exact approved line is excused: a paraphrase is not.
  assert.ok(scanText('No price, no balance.').length);
  assert.ok(scanText('Not $NOUNS, not redemption.').length);
});

test('copy extraction reads what a person sees, not code', () => {
  const astro = `---\nconst a = 'Print it';\n---\n<style>@media print{a{}}</style><p class="pay-with" title="spend it">Hello {x ? 'tip jar' : y}</p><script type="application/ld+json">{"x":"cash out"}</script><!-- bank -->`;
  const text = extractCopy(astro, 'x.astro');
  assert.match(text, /Print it/);
  assert.match(text, /spend it/);
  assert.match(text, /tip jar/);
  assert.doesNotMatch(text, /@media print/);
  assert.doesNotMatch(text, /cash out/, 'JSON-LD islands are data');
  assert.doesNotMatch(text, /bank/, 'comments are not copy');
  assert.doesNotMatch(text, /pay-with/, 'class names are not copy');
  assert.deepEqual(stringLiterals("const n = Math.floor(x); f('/images/print.png', 'balance-row', `x ${y} floor`)"), ['x   floor'], 'Math.floor, paths and class names are code; template text is copy');
});

test('copy extraction reaches copy the old extractor dropped (legacy pages and the flag gate read it)', () => {
  const astro = [
    '---',
    "const u = 'https://x.test/a // b'; const label = 'Cash out now';",
    '---',
    '<ul>{items.map((n) => <li><a href={n.href}>Spend {n.name} today</a></li>)}</ul>',
    "{flag && <p>Backed by {x ? 'art' : <b>the reserve</b>}</p>}",
    "<img alt='A redeemable note' src='/a.png' />",
    '{list.map((n) => `<li>${n.ok ? `Pay with ${n.id}` : \'\'}</li>`)}',
    '<p>Don’t worry {name}</p>',
  ].join('\n');
  const text = extractCopy(astro, 'x.astro');
  for (const want of ['Cash out now', 'Spend', 'Backed by', 'the reserve', 'A redeemable note', 'Pay with']) assert.match(text, new RegExp(want), want);
  const ids = new Set(scanSource(astro, 'x.astro').map((h) => h.id));
  for (const id of ['cash-out', 'spend', 'backed', 'reserve', 'redeem', 'pay-with']) assert.ok(ids.has(id), id);
  // one-token copy is copy; one-token code is not
  assert.deepEqual(stringLiterals("f('Pump.fun', '$1.00', 'DAO-backed', 'USD-pegged', '€5', 'pump.fun')"), ['Pump.fun', '$1.00', 'DAO-backed', 'USD-pegged', '€5', 'pump.fun']);
  assert.deepEqual(stringLiterals("f('balance-row', 'pay-with', '/images/print.png', 'print.css', 'Math.floor', 'data-nmc-r', '[data-x]')"), []);
  // "//" inside a string is text, and regex literals with quotes do not open strings
  assert.deepEqual(stringLiterals("const a = 'x // y'; const r = /['\"]/g; const b = 'tip jar';"), ['x // y', 'tip jar']);
  assert.ok(scanSource("const a = 'x // y'; say('cash out');", 'x.js').length);
});

test('STRICT: the Phase A chain surfaces carry zero banned words', () => {
  assert.deepEqual(scanStrict(STRICT_FILES), {});
  assert.deepEqual(scanFiles(STRICT_FILES), {});
  assert.deepEqual(scanText(allCopyStrings().join('\n')), []);
});

// Mutations an author could make to a strict file. Each one hid a banned word
// from the old copy extractor (JSX inside {…}, one-token strings, a "//" inside
// a string, single-quoted attributes, comments, CSS); the strict grep sees all.
const STRICT_MUTATIONS = [
  ['JSX text inside an expression', (s) => s + '\n{serial > 100 && <em>Backed by art</em>}\n'],
  ['a single-quoted attribute', (s) => s + "\n<img alt='A redeemable note' />\n"],
  ['a one-token string with a dot', (s) => s + "\nsay('Pump.fun');\n"],
  ['a one-token dollar amount', (s) => s + "\nsay('$1.00');\n"],
  ['a hyphenated one-token string', (s) => s + "\nsay('DAO-backed');\n"],
  ['a string after "//" in a string', (s) => s + "\nconst u = 'a // b'; say('Cash out now');\n"],
  ['a comment', (s) => s + '\n// spend it at the merchant\n'],
  ['a CSS rule', (s) => s + '\n<style>.floor{}</style>\n'],
  ['a JSON value', (s) => s.replace(/"status": "/, '"status": "Airdrop soon. ')],
];

test('STRICT is a grep: every mutation of every strict file is caught', () => {
  for (const f of STRICT_FILES) {
    const src = readRepo(f);
    assert.deepEqual(scanText(src), [], `${f} starts clean`);
    for (const [name, mutate] of STRICT_MUTATIONS) {
      const out = mutate(src);
      if (out === src) continue; // the JSON mutation only applies to chain.json
      assert.ok(scanText(out).length > 0, `${f}: ${name} must be caught`);
    }
  }
  // and the flag gate greps the two Phase A surfaces the same way
  for (const p of NM_STRICT_SURFACES) {
    const src = readRepo(p.slice(1));
    assert.deepEqual(nmChainGaps({ [p]: src }).filter((g) => g.startsWith(p)), [], `${p} starts clean`);
    const gaps = nmChainGaps({ [p]: STRICT_MUTATIONS[0][1](src) });
    assert.ok(gaps.some((g) => g.startsWith(`${p} uses banned words`)), `${p}: the gate sees JSX inside an expression`);
    // the build fails on it even with the flag off
    assert.doesNotThrow(() => assertNmChainReady({ [p]: src }, false));
    assert.throws(() => assertNmChainReady({ [p]: STRICT_MUTATIONS[0][1](src) }, false), /uses banned words/);
  }
});

test('LEGACY: no Nouns Money source/page gains a banned word (ratchet against the baseline)', () => {
  const files = legacyFiles();
  assert.ok(files.includes('src/pages/nouns-money.astro'));
  assert.ok(!files.some((f) => STRICT_FILES.includes(f)));
  const violations = ratchetViolations(scanFiles(files), readBaseline());
  assert.deepEqual(violations, [], 'a Nouns Money page added a "Never use" word (plan §6); reword it rather than raising the baseline');
});

test('the ratchet itself: a new word over the baseline is a violation, fewer is fine', () => {
  const baseline = { 'a.astro': { print: 2 } };
  assert.deepEqual(ratchetViolations({ 'a.astro': { print: 2 } }, baseline), []);
  assert.deepEqual(ratchetViolations({ 'a.astro': { print: 1 } }, baseline), []);
  assert.deepEqual(ratchetViolations({ 'a.astro': { print: 3 } }, baseline), [{ file: 'a.astro', id: 'print', count: 3, allowed: 2 }]);
  assert.deepEqual(ratchetViolations({ 'b.astro': { spend: 1 } }, baseline), [{ file: 'b.astro', id: 'spend', count: 1, allowed: 0 }]);
});

test('the standard line is on every chain surface', () => {
  for (const f of ['src/components/NounsMoneyChainShelf.astro', 'src/pages/nouns-money/note/[serial].astro']) {
    const src = readRepo(f);
    assert.match(src, /NM_COPY\.standardLine/, `${f} renders the standard line`);
  }
  assert.equal(JSON.parse(readRepo('public/nouns-money/chain.json')).standard_line, NM_STANDARD_LINE);
  const collect = readRepo('public/nouns-money/chain/nm-collect.js');
  assert.match(collect, /C\.standardLine/, 'the passkey confirm shows the standard line');
  assert.match(collect, /C\.replacementLine/, 'and the replacement line');
});

test('build gate: banned chain copy fails the build; the flag cannot turn on with gaps', () => {
  assert.doesNotThrow(() => assertNmChainReady({}, false));
  const sources = Object.fromEntries(NM_CHAIN_SURFACE_SOURCES.map((p) => [p, readRepo(p.slice(1))]));
  const gaps = nmChainGaps(sources);
  assert.ok(gaps.some((g) => /renderer_hash is not pinned/.test(g)), 'renderer hash gap');
  // Today the live /nouns-money/ page itself still carries banned words, so the flag must stay off.
  assert.ok(gaps.some((g) => g.startsWith('/src/pages/nouns-money.astro uses banned words')), 'legacy page copy gap');
  assert.throws(() => assertNmChainReady(sources, true), /NM_CHAIN_ENABLED is on but Nouns Money is not ready/);
  assert.equal(scanSource(readRepo('src/components/NounsMoneyChainShelf.astro'), 'x.astro').length, 0);
});

test('the note page’s build-time glob lists exactly NM_CHAIN_SURFACE_SOURCES', () => {
  const page = readRepo('src/pages/nouns-money/note/[serial].astro');
  const glob = /import\.meta\.glob\(([\s\S]*?)\{ query: '\?raw'/.exec(page)[1];
  const listed = [...glob.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  assert.deepEqual(listed, [...NM_CHAIN_SURFACE_SOURCES]);
  assert.match(page, /assertNmChainReady\(sources\)/);
});

test('approved lines are the only escape hatch', () => {
  assert.deepEqual([...NM_APPROVED_LINES], [NM_STANDARD_LINE, NM_REPLACEMENT_LINE]);
});
