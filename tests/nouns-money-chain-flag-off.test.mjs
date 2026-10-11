// NM_CHAIN_ENABLED is off, and off means "exactly as today".
//
// Source checks always run. The build comparison runs when both builds exist:
//   NM_BASELINE_DIST=<origin/main's dist> node --test tests/nouns-money-chain-flag-off.test.mjs
// (this checkout's dist/ is the head build). It compares every file under
// dist/nouns-money/ and dist/nouns-money.json with origin/main's, normalizing
// nothing but ISO timestamps; Phase A may only add nouns-money/chain.json and
// nouns-money/chain/*.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NM_CHAIN_ENABLED, NM_EDITION_TERMS, catalogForFlag } from '../src/data/nouns-money-chain.ts';
import { SOURCE_CATALOG } from '../src/lib/nouns-money/catalog.ts';
import { NM_REPLACEMENT_LINE } from '../src/lib/nouns-money/chain-copy.mjs';
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
      title: 'Nouns Money NM27',
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

test('flag off: catalog.json keeps the live line; on: the plan’s replacement, same key order', () => {
  assert.equal(catalogForFlag(SOURCE_CATALOG, false), SOURCE_CATALOG);
  assert.equal(JSON.stringify(catalogForFlag(SOURCE_CATALOG)), JSON.stringify(SOURCE_CATALOG));
  assert.match(SOURCE_CATALOG.meaning, /^Collected artwork preferences\. No mint, token ownership/);
  const on = catalogForFlag(SOURCE_CATALOG, true);
  assert.equal(on.meaning, NM_REPLACEMENT_LINE);
  assert.deepEqual(Object.keys(on), Object.keys(SOURCE_CATALOG));
  assert.notEqual(SOURCE_CATALOG.meaning, NM_REPLACEMENT_LINE, 'the source catalog is not mutated');
});

test('flag-off pages render the chain shelf only behind the flag, with nothing bundled', () => {
  const home = read('src/pages/nouns-money.astro');
  const collect = read('src/pages/nouns-money/collect.astro');
  assert.match(home, /\{NM_CHAIN_ENABLED && <NounsMoneyChainShelf \/>\}/);
  assert.match(collect, /\{NM_CHAIN_ENABLED && <NounsMoneyChainShelf \/>\}/);
  const shelf = read('src/components/NounsMoneyChainShelf.astro');
  assert.match(shelf, /\{NM_CHAIN_ENABLED && \(/, 'the component guards itself too');
  assert.doesNotMatch(shelf.replace(/<style is:inline>/g, ''), /<style\b/, 'no bundled style: a flag-off build keeps its CSS');
  assert.doesNotMatch(shelf.replace(/<script type="module" is:inline/g, '').replace(/<script type="application\/json"/g, ''), /<script\b/, 'no bundled script');
  const note = read('src/pages/nouns-money/note/[serial].astro');
  assert.match(note, /if \(!NM_CHAIN_ENABLED\) return \[\];/, 'no note pages while off');
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
  assert.ok(r.added.includes('nouns-money/chain.json'));
  assert.ok(!existsSync(new URL('dist/nouns-money/note/', root)) || readdirSync(new URL('dist/nouns-money/note/', root)).length === 0, 'no note pages built');
});
