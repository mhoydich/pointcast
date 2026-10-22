// Nouns Money chain recipe codec (public/nouns-money/chain/nm-recipe.js).
//
// - every design × copies 0-10 encodes to 53 bytes and decodes back unchanged;
// - unique keys (series ‖ design ‖ copy) and recipe hashes never collide;
// - the bytes and hashes equal tests/fixtures/nm-recipe-vectors.json, which was
//   generated independently in Python (hashlib.blake2b, digest_size 32) and is
//   the shared vector set for pointcast-chain sdk/nm-note.js and recipe.rs;
// - bad input fails with a named field.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  NM_COPIES_PER_DESIGN,
  NM_DESIGNS,
  NM_EDITION_ID,
  NM_RECIPE_LEN,
  NM_SUPPLY,
  NM_UNIQUE_KEY_LEN,
  NmRecipeError,
  decodeRecipe,
  encodeRecipe,
  encodeRecipeHex,
  nm100Id,
  nm27Label,
  recipeHash,
  recipeIndex,
  recipeMatchesEntry,
  specimenSerial,
  uniqueKey,
} from '../public/nouns-money/chain/nm-recipe.js';
import { editionRecipeHash } from '../public/chain/first-mints/lib/pointcast-chain.js';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const provenance = JSON.parse(read('public/images/nouns-money/source-100/provenance.json'));
const vectors = JSON.parse(read('tests/fixtures/nm-recipe-vectors.json'));
const byNoun = new Map(provenance.notes.map((n) => [n.noun_id, n]));
const fields = (design, copy) => ({ design, copy, svgSha256: byNoun.get(design).svg_sha256, nativeRgbSha256: byNoun.get(design).native_rgb_sha256 });

test('edition constants match the plan: nouns-money-27, 1,100 supply, 53-byte recipe, 4-byte key', () => {
  assert.equal(NM_EDITION_ID, 'nouns-money-27');
  assert.equal(NM_DESIGNS, 100);
  assert.equal(NM_COPIES_PER_DESIGN, 10);
  assert.equal(NM_SUPPLY, 1100);
  assert.equal(NM_RECIPE_LEN, 53);
  assert.equal(NM_UNIQUE_KEY_LEN, 4);
});

test('every design × copies 0-10 encodes to 53 bytes and decodes back unchanged', () => {
  for (let design = 0; design < NM_DESIGNS; design += 1) {
    for (let copy = 0; copy <= NM_COPIES_PER_DESIGN; copy += 1) {
      const f = fields(design, copy);
      const bytes = encodeRecipe(f);
      assert.equal(bytes.length, 53);
      const back = decodeRecipe(bytes);
      assert.equal(back.version, 1);
      assert.equal(back.series, 27);
      assert.equal(back.design, design);
      assert.equal(back.copy, copy);
      assert.equal(back.svgSha256, f.svgSha256);
      assert.equal(back.nativeRgbPrefix, f.nativeRgbSha256.slice(0, 32));
      assert.deepEqual(decodeRecipe(encodeRecipeHex(f)), back, 'hex and bytes decode the same');
    }
  }
});

test('1,100 recipes: no two share a unique key or a recipe hash; the index maps each back', () => {
  const keys = new Set();
  const hashes = new Set();
  const entries = provenance.notes.map((n) => ({ design: n.noun_id, svg_sha256: n.svg_sha256, native_rgb_sha256: n.native_rgb_sha256 }));
  const index = recipeIndex(entries);
  for (let design = 0; design < NM_DESIGNS; design += 1) {
    for (let copy = 0; copy <= NM_COPIES_PER_DESIGN; copy += 1) {
      const hex = encodeRecipeHex(fields(design, copy));
      keys.add(uniqueKey(hex));
      const h = recipeHash(hex);
      hashes.add(h);
      assert.deepEqual(index.get(h), { design, copy, recipe: hex });
    }
  }
  assert.equal(keys.size, NM_SUPPLY);
  assert.equal(hashes.size, NM_SUPPLY);
  assert.equal(index.size, NM_SUPPLY);
});

test('recipe hash is the chain’s: blake2b-256("pointcast/first-mints/recipe/v1" ‖ recipe)', () => {
  const hex = encodeRecipeHex(fields(7, 3));
  assert.equal(recipeHash(hex), editionRecipeHash(hex));
  assert.equal(recipeHash(encodeRecipe(fields(7, 3))), editionRecipeHash(hex));
});

test('the shared vectors (generated in Python) match byte for byte', () => {
  assert.equal(vectors.recipe_hash_tag, 'pointcast/first-mints/recipe/v1');
  assert.ok(vectors.vectors.length >= 10);
  for (const v of vectors.vectors) {
    const hex = encodeRecipeHex({ design: v.design, copy: v.copy, svgSha256: v.svg_sha256, nativeRgbSha256: v.native_rgb_sha256 });
    assert.equal(hex, v.recipe, `recipe d${v.design} c${v.copy}`);
    assert.equal(uniqueKey(hex), v.unique_key);
    assert.equal(recipeHash(hex), v.recipe_hash, `hash d${v.design} c${v.copy}`);
    assert.equal(v.svg_sha256, byNoun.get(v.design).svg_sha256, 'vectors use provenance hashes');
  }
  for (const bad of vectors.invalid) {
    assert.throws(() => decodeRecipe(bad.recipe), NmRecipeError, bad.why);
  }
});

test('encode refuses what the edition never mints', () => {
  const ok = fields(0, 0);
  assert.throws(() => encodeRecipe({ ...ok, design: 100 }), /design/);
  assert.throws(() => encodeRecipe({ ...ok, design: -1 }), /design/);
  assert.throws(() => encodeRecipe({ ...ok, design: 1.5 }), /design/);
  assert.throws(() => encodeRecipe({ ...ok, copy: 11 }), /copy/);
  assert.throws(() => encodeRecipe({ ...ok, copy: -1 }), /copy/);
  assert.throws(() => encodeRecipe({ ...ok, svgSha256: 'ABC' }), /svg_sha256/);
  assert.throws(() => encodeRecipe({ ...ok, svgSha256: ok.svgSha256.toUpperCase() }), /svg_sha256/);
  assert.throws(() => encodeRecipe({ ...ok, nativeRgbSha256: ok.nativeRgbSha256.slice(0, 32) }), /native_rgb_sha256/);
  assert.throws(() => decodeRecipe('zz'), /recipe/);
  assert.throws(() => decodeRecipe(42), /recipe/);
});

test('serial scheme: the house specimen of design d is serial d+1 = NM27-(d+1) = nm100-d', () => {
  assert.equal(specimenSerial(0), 1);
  assert.equal(specimenSerial(99), 100);
  assert.equal(nm27Label(1), 'NM27-000001');
  assert.equal(nm27Label(101), 'NM27-000101');
  assert.equal(nm100Id(0), 'nm100-000');
  assert.equal(nm100Id(99), 'nm100-099');
  for (const n of provenance.notes) {
    assert.equal(n.serial, nm27Label(specimenSerial(n.noun_id)), n.id);
    assert.equal(n.id, nm100Id(n.noun_id));
  }
});

test('recipeMatchesEntry: same design and both art hashes, or no match', () => {
  const n = byNoun.get(12);
  const entry = { design: 12, svg_sha256: n.svg_sha256, native_rgb_sha256: n.native_rgb_sha256 };
  assert.ok(recipeMatchesEntry(decodeRecipe(encodeRecipeHex(fields(12, 4))), entry));
  assert.ok(!recipeMatchesEntry(decodeRecipe(encodeRecipeHex(fields(13, 4))), entry));
  const forged = encodeRecipeHex({ design: 12, copy: 4, svgSha256: byNoun.get(13).svg_sha256, nativeRgbSha256: n.native_rgb_sha256 });
  assert.ok(!recipeMatchesEntry(decodeRecipe(forged), entry), 'a design byte with another note’s art is refused');
});

// INTEGRATION: when pointcast-chain sdk/nm-note.js exists in a checkout next to
// this one, its encoder must produce these exact bytes. Skips when it is absent.
const CHAIN_NM_NOTE = process.env.NM_NOTE_JS || '';
test('pointcast-chain sdk/nm-note.js encodes the same bytes (when NM_NOTE_JS points at it)', { skip: !CHAIN_NM_NOTE || !existsSync(CHAIN_NM_NOTE) }, async () => {
  const sdk = await import(CHAIN_NM_NOTE);
  const encode = sdk.encodeRecipe || sdk.encodeNmRecipe || sdk.encode;
  assert.equal(typeof encode, 'function', 'nm-note.js exports an encoder');
  for (const v of vectors.vectors) {
    const out = encode({ design: v.design, copy: v.copy, svgSha256: v.svg_sha256, nativeRgbSha256: v.native_rgb_sha256, svg_sha256: v.svg_sha256, native_rgb_sha256: v.native_rgb_sha256 });
    const hex = typeof out === 'string' ? out : Buffer.from(out).toString('hex');
    assert.equal(hex, v.recipe, `d${v.design} c${v.copy}`);
  }
});
