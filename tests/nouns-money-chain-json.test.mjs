// public/nouns-money/chain.json (scripts/build-nm-chain.mjs).
//
// - 100 entries, designs 0-99, each the house specimen (copy 0, serial d+1);
// - every svg/pixel hash equals provenance.json, and every svg hash equals
//   the sha256 of the SVG file this site serves;
// - each recipe is the codec's encoding and each recipe hash the chain's;
// - a rerun is byte-identical to the committed file.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { buildNmChain, readProvenance, CHAIN_JSON_PATH } from '../scripts/build-nm-chain.mjs';
import { decodeRecipe, encodeRecipeHex, recipeHash, nm27Label, nm100Id } from '../public/nouns-money/chain/nm-recipe.js';
import { NM_STANDARD_LINE } from '../src/lib/nouns-money/chain-copy.mjs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const committed = read(CHAIN_JSON_PATH);
const chain = JSON.parse(committed);
const provenance = JSON.parse(read('public/images/nouns-money/source-100/provenance.json'));
const byId = new Map(provenance.notes.map((n) => [n.id, n]));

test('chain.json: 100 entries, designs 0-99 in order, one per provenance note', () => {
  assert.equal(chain.schema, 'pointcast.nouns-money.chain/v1');
  assert.equal(chain.edition, 'nouns-money-27');
  assert.equal(chain.entries.length, 100);
  chain.entries.forEach((e, i) => {
    assert.equal(e.design, i);
    assert.equal(e.noun_id, i);
    assert.equal(e.id, nm100Id(i));
    assert.equal(e.copy, 0);
    assert.equal(e.specimen_serial, i + 1, 'house specimens are minted first, in design order');
    assert.equal(e.specimen_label, nm27Label(i + 1));
  });
  assert.equal(new Set(chain.entries.map((e) => e.recipe_hash)).size, 100);
});

test('every svg hash equals provenance.json and the served SVG file; pixel hashes equal provenance', () => {
  for (const e of chain.entries) {
    const p = byId.get(e.id);
    assert.ok(p, e.id);
    assert.equal(e.svg_sha256, p.svg_sha256, `${e.id} svg`);
    assert.equal(e.native_rgb_sha256, p.native_rgb_sha256, `${e.id} rgb`);
    assert.equal(e.svg, p.svg);
    assert.equal(e.preview, p.preview);
    const file = readFileSync(new URL(`public${e.svg}`, root));
    assert.equal(createHash('sha256').update(file).digest('hex'), e.svg_sha256, `${e.svg} bytes`);
  }
});

test('each recipe is the codec’s 53-byte encoding and each hash the chain’s', () => {
  for (const e of chain.entries) {
    assert.equal(e.recipe.length, 106);
    assert.equal(e.recipe, encodeRecipeHex({ design: e.design, copy: 0, svgSha256: e.svg_sha256, nativeRgbSha256: e.native_rgb_sha256 }));
    assert.equal(e.recipe_hash, recipeHash(e.recipe));
    const d = decodeRecipe(e.recipe);
    assert.equal(d.design, e.design);
    assert.equal(d.copy, 0);
    assert.equal(d.series, 27);
  }
});

test('the file says what it is: not open, nothing minted, the standard line, no timestamps', () => {
  assert.match(chain.status, /not open; nothing here has been minted/);
  assert.equal(chain.standard_line, NM_STANDARD_LINE);
  assert.equal(chain.serials.supply, 1100);
  assert.equal(chain.recipe_layout.bytes, 53);
  assert.doesNotMatch(committed, /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'no timestamps, so reruns are identical');
});

test('reruns are byte-identical: in memory twice, and the CLI --check against the committed file', () => {
  const a = buildNmChain(readProvenance());
  const b = buildNmChain(readProvenance());
  assert.equal(a, b);
  assert.equal(a, committed, 'committed chain.json is current (node scripts/build-nm-chain.mjs)');
  const out = execFileSync(process.execPath, ['scripts/build-nm-chain.mjs', '--check'], { cwd: new URL('.', root), encoding: 'utf8' });
  assert.match(out, /is current/);
});

test('the builder refuses a provenance file that breaks the serial scheme', () => {
  const prov = readProvenance();
  const swapped = structuredClone(prov);
  swapped.notes[3].serial = 'NM27-000099';
  assert.throws(() => buildNmChain(swapped), /serial/);
  const missing = structuredClone(prov);
  missing.notes = missing.notes.filter((n) => n.noun_id !== 50);
  assert.throws(() => buildNmChain(missing), /Noun #50/);
});
