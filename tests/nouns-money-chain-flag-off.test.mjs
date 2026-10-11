// NM_CHAIN_ENABLED is off, and off means "exactly as today".
//
// Source checks always run. The build comparison runs when both builds exist:
//   NM_BASELINE_DIST=<origin/main's dist> node --test tests/nouns-money-chain-flag-off.test.mjs
// (this checkout's dist/ is the head build). It compares every file under
// dist/nouns-money/ and dist/nouns-money.json with origin/main's, normalizing
// nothing but ISO timestamps; Phase A may only add nouns-money/chain.json and
// nouns-money/chain/*.js, and a client update may change those scripts while
// no flag-off page loads them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NM_CHAIN_ENABLED, NM_EDITION_TERMS, catalogForFlag } from '../src/data/nouns-money-chain.ts';
import { SOURCE_CATALOG } from '../src/lib/nouns-money/catalog.ts';
import { NM_REPLACEMENT_LINE, NM_STANDARD_LINE } from '../src/lib/nouns-money/chain-copy.mjs';
import { compareDists } from '../scripts/compare-nm-flag-off.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('the flag is off, and the terms are the plan’s', () => {
  assert.equal(NM_CHAIN_ENABLED, false);
  assert.match(read('src/data/nouns-money-chain.ts'), /^export const NM_CHAIN_ENABLED: boolean = false;$/m, 'one flag, declared once');
  assert.deepEqual(
    { ...NM_EDITION_TERMS },
    {
      id: 'nouns-money-27',
      title: 'Nouns Money 27',
      supply: 1100,
      per_account: 0,
      closes_at: 0,
      attestor: 'house',
      transferable: false,
      royalty_bps: 0,
      recipe_schema: 0,
      unique_key_len: 4,
      renderer_hash: null,
      l1_ref: null,
    },
  );
});

test('flag off: catalog.json keeps the live line; on: the plan’s replacement and the standard line', () => {
  assert.equal(catalogForFlag(SOURCE_CATALOG, false), SOURCE_CATALOG);
  assert.equal(JSON.stringify(catalogForFlag(SOURCE_CATALOG)), JSON.stringify(SOURCE_CATALOG));
  assert.match(SOURCE_CATALOG.meaning, /^Collected artwork preferences\. No mint, token ownership/);
  const on = catalogForFlag(SOURCE_CATALOG, true);
  assert.equal(on.meaning, NM_REPLACEMENT_LINE);
  assert.equal(on.standard_line, NM_STANDARD_LINE, 'the standard line is on every flagged surface, catalog.json too');
  assert.deepEqual(Object.keys(on), [...Object.keys(SOURCE_CATALOG), 'standard_line'], 'existing keys keep their order');
  assert.notEqual(SOURCE_CATALOG.meaning, NM_REPLACEMENT_LINE, 'the source catalog is not mutated');
  assert.equal(SOURCE_CATALOG.standard_line, undefined);
});

test('flag-off pages render the chain shelf only behind the flag, with nothing bundled', () => {
  const home = read('src/pages/nouns-money.astro');
  const collect = read('src/pages/nouns-money/collect.astro');
  assert.match(home, /\{NM_CHAIN_ENABLED && <div class="nm-section nm-chain"><NounsMoneyChainShelf \/><\/div>\}/);
  assert.match(collect, /\{NM_CHAIN_ENABLED && <NounsMoneyChainShelf \/>\}/);
  const shelf = read('src/components/NounsMoneyChainShelf.astro');
  assert.match(shelf, /\{NM_CHAIN_ENABLED && \(/, 'the component guards itself too');
  assert.doesNotMatch(shelf.replace(/<style is:inline>/g, ''), /<style\b/, 'no bundled style: a flag-off build keeps its CSS');
  assert.doesNotMatch(shelf.replace(/<script type="module" is:inline/g, '').replace(/<script type="application\/json"/g, ''), /<script\b/, 'no bundled script');
  const note = read('src/pages/nouns-money/note/[serial].astro');
  assert.match(note, /if \(!NM_CHAIN_ENABLED\) return \[\];/, 'no note pages while off');
});

test('flag-on surfaces follow the design law: 400/500 weights, --pc-font-mono, hard corners, light like their host pages', () => {
  for (const f of ['src/components/NounsMoneyChainShelf.astro', 'src/pages/nouns-money/note/[serial].astro']) {
    const css = /<style is:inline>([\s\S]*?)<\/style>/.exec(read(f))[1];
    assert.doesNotMatch(css, /font(?:-weight)?:\s*(?:[6-9]00|bold)/, `${f}: two weights only (BLOCKS.md)`);
    assert.doesNotMatch(css, /ui-monospace|SFMono|Menlo/, `${f}: never system mono (BLOCKS.md)`);
    assert.match(css, /var\(--pc-font-mono/, `${f}: metadata in the PointCast mono`);
    assert.doesNotMatch(css, /border-radius:\s*[3-9]/, `${f}: hard corners`);
    assert.doesNotMatch(css, /prefers-color-scheme/, `${f}: the Nouns Money pages and BlockLayout tokens are light-only, so no dark island`);
  }
  // the home page shelf sits in the page's own section rhythm
  assert.match(read('src/pages/nouns-money.astro'), /<div class="nm-section nm-chain"><NounsMoneyChainShelf \/><\/div>/);
});

test('the shelf keeps its spaces: no whitespace-only text between an expression and the next one or a tag', () => {
  // Rendered flag-on (Astro container, 2026-10-10) the old markup read "the artwork.A free devnet art record"
  // and "Noun #0NM27-000001": inside {NM_CHAIN_ENABLED && (…)} that whitespace is dropped.
  const shelf = read('src/components/NounsMoneyChainShelf.astro');
  const markup = shelf.slice(shelf.indexOf('{NM_CHAIN_ENABLED && ('), shelf.indexOf('<style is:inline>'));
  assert.deepEqual(markup.match(/\}[ \t]+(?=[{<])/g), null);
  assert.match(shelf, /const FINE = \[\.\.\.NM_COPY\.supporting, NM_COPY\.replacementLine\]\.join\(' '\);/);
});

const BASE = process.env.NM_BASELINE_DIST || '';
const HEAD = fileURLToPath(new URL('dist/', root));
const haveBuilds = Boolean(BASE) && existsSync(BASE) && existsSync(HEAD);

test('flag-off build: every Nouns Money file equals origin/main’s build (timestamps aside)', { skip: !haveBuilds && 'set NM_BASELINE_DIST to an origin/main dist and build this checkout' }, () => {
  const r = compareDists(BASE, HEAD);
  assert.ok(r.same.includes('nouns-money/index.html'), '/nouns-money/ was compared');
  assert.ok(r.same.includes('nouns-money/collect/index.html'), '/nouns-money/collect/ was compared');
  assert.ok(r.same.includes('nouns-money/catalog.json'), '/nouns-money/catalog.json was compared');
  assert.deepEqual(r.changed, [], 'changed files');
  assert.deepEqual(r.removed, [], 'removed files');
  assert.deepEqual(r.unexpectedAdded, [], 'unexpected new files');
  assert.deepEqual(r.pagesLoadingScripts, [], 'no flag-off page loads a client script');
  assert.ok(r.scriptsChanged.every((f) => /^nouns-money\/chain\/nm-[a-z-]+\.js$/.test(f)), 'only client scripts may differ');
  // Against a pre-Phase-A main chain.json is new; against a main that has it, it must not change.
  assert.ok(r.added.includes('nouns-money/chain.json') || r.same.includes('nouns-money/chain.json'), 'chain.json: new or unchanged');
  assert.ok(!existsSync(new URL('dist/nouns-money/note/', root)) || readdirSync(new URL('dist/nouns-money/note/', root)).length === 0, 'no note pages built');
});

test('compareDists: pages must match; client scripts may change only while no page loads them', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'nm-flag-off-'));
  const put = (dist, rel, text) => {
    const p = join(tmp, dist, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, text);
  };
  try {
    for (const d of ['base', 'head']) {
      put(d, 'nouns-money/index.html', '<h1>Nouns Money</h1> built 2026-10-10T00:00:00Z');
      put(d, 'nouns-money/chain.json', '{"entries":[]}');
    }
    put('base', 'nouns-money/chain/nm-collect.js', 'old client');
    put('head', 'nouns-money/index.html', '<h1>Nouns Money</h1> built 2026-10-11T08:00:00Z');
    put('head', 'nouns-money/chain/nm-collect.js', 'new client');
    put('head', 'nouns-money/chain/nm-claim.js', 'new module');
    let r = compareDists(join(tmp, 'base'), join(tmp, 'head'));
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.deepEqual(r.scriptsChanged, ['nouns-money/chain/nm-collect.js']);
    assert.deepEqual(r.added, ['nouns-money/chain/nm-claim.js']);
    assert.deepEqual(r.same, ['nouns-money/chain.json', 'nouns-money/index.html'], 'timestamps aside');

    put('head', 'nouns-money/chain.json', '{"entries":[1]}');
    r = compareDists(join(tmp, 'base'), join(tmp, 'head'));
    assert.deepEqual(r.changed, ['nouns-money/chain.json'], 'chain.json is data, not a client script');
    assert.equal(r.ok, false);
    put('head', 'nouns-money/chain.json', '{"entries":[]}');

    // A listing (like /tv/assets) names the file and loads nothing.
    for (const d of ['base', 'head']) put(d, 'nouns-money/files/index.html', '<a href="/nouns-money/chain/nm-collect.js">nm collect</a>');
    r = compareDists(join(tmp, 'base'), join(tmp, 'head'));
    assert.deepEqual(r.pagesLoadingScripts, []);
    assert.equal(r.ok, true);

    put('head', 'nouns-money/collect/index.html', '<script type="module" is:inline src="/nouns-money/chain/nm-collect.js"></script>');
    put('base', 'nouns-money/collect/index.html', '<p>collect</p>');
    r = compareDists(join(tmp, 'base'), join(tmp, 'head'));
    assert.deepEqual(r.pagesLoadingScripts, ['nouns-money/collect/index.html']);
    assert.equal(r.ok, false, 'a page that loads a client script is a flag-off change');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
