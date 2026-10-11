// Nouns Money on pointcast-devnet-2: the recipe codec (Phase A, flag off).
//
// One edition, `nouns-money-27`. Every token's recipe names exactly one
// artwork and one copy of it:
//
//   recipe = u8 version (1) ‖ u8 series (27) ‖ u8 design (0-99) ‖
//            u16 BE copy (0-10) ‖ svg_sha256 (32 bytes) ‖
//            native_rgb_sha256[0..16] (16 bytes)                = 53 bytes
//   recipe_hash = blake2b-256("pointcast/first-mints/recipe/v1" ‖ recipe)
//                 (chain-core recipe.rs; the SDK's editionRecipeHash)
//   unique key  = recipe[1..5] = series ‖ design ‖ copy (unique_key_len 4)
//
// There is no denomination byte. Copy 0 of each design is the house
// specimen, minted first and in design order, so chain serial n is
// NM27-n and design n-1 (nm100-(n-1)). Copies 1-10 are the public copies
// (serial 101 and up, in whatever order people collect them).
//
// The svg and pixel hashes come from
// public/images/nouns-money/source-100/provenance.json via
// scripts/build-nm-chain.mjs → public/nouns-money/chain.json.
//
// INTEGRATION: pointcast-chain sdk/nm-note.js (encodeNmRecipe, nmRecipeHash)
// is the chain's twin of this codec, plus the glyph/portrait renderer. On
// 2026-10-10 its working copy produced the same bytes for all 1,100 recipes
// and the same 100 specimen hashes; tests/nouns-money-chain-recipe.test.mjs
// re-checks it when NM_NOTE_JS=<path to nm-note.js>.
// tests/fixtures/nm-recipe-vectors.json (generated in Python) is the vector
// set both must match.
//
// Pure ES module: no DOM, no network. Works in browsers and Node.
import { bytesToHex, editionRecipeHash, hexToBytes } from '../../chain/first-mints/lib/pointcast-chain.js';

export const NM_EDITION_ID = 'nouns-money-27';
export const NM_RECIPE_VERSION = 1;
export const NM_SERIES = 27;
export const NM_DESIGNS = 100;
/** Public copies per design (copy numbers 1..10). Copy 0 is the house specimen. */
export const NM_COPIES_PER_DESIGN = 10;
export const NM_SUPPLY = NM_DESIGNS * (1 + NM_COPIES_PER_DESIGN); // 1,100
export const NM_RECIPE_LEN = 53;
export const NM_UNIQUE_KEY_LEN = 4;
export const NM_RGB_PREFIX_BYTES = 16;

const HEX64 = /^[0-9a-f]{64}$/;

export class NmRecipeError extends Error {
  constructor(field, rule) {
    super(`${field}: ${rule}`);
    this.name = 'NmRecipeError';
    this.field = field;
    this.rule = rule;
  }
}

const isInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

/** Encode one recipe. `svgSha256` and `nativeRgbSha256` are full 64-hex sha256 digests. */
export function encodeRecipe({ design, copy, svgSha256, nativeRgbSha256 }) {
  if (!isInt(design, 0, NM_DESIGNS - 1)) throw new NmRecipeError('design', 'must be an integer 0..99');
  if (!isInt(copy, 0, NM_COPIES_PER_DESIGN)) throw new NmRecipeError('copy', 'must be an integer 0..10');
  if (typeof svgSha256 !== 'string' || !HEX64.test(svgSha256)) throw new NmRecipeError('svg_sha256', 'must be 64 lowercase hex');
  if (typeof nativeRgbSha256 !== 'string' || !HEX64.test(nativeRgbSha256)) throw new NmRecipeError('native_rgb_sha256', 'must be 64 lowercase hex');
  const out = new Uint8Array(NM_RECIPE_LEN);
  out[0] = NM_RECIPE_VERSION;
  out[1] = NM_SERIES;
  out[2] = design;
  out[3] = (copy >> 8) & 0xff;
  out[4] = copy & 0xff;
  out.set(hexToBytes(svgSha256), 5);
  out.set(hexToBytes(nativeRgbSha256).slice(0, NM_RGB_PREFIX_BYTES), 37);
  return out;
}

export const encodeRecipeHex = (fields) => bytesToHex(encodeRecipe(fields));

/** Decode a recipe (bytes or hex). Throws NmRecipeError on the first rule it breaks. */
export function decodeRecipe(input) {
  let bytes;
  if (typeof input === 'string') {
    if (!/^[0-9a-f]*$/.test(input) || input.length % 2) throw new NmRecipeError('recipe', 'must be lowercase hex');
    bytes = hexToBytes(input);
  } else if (input instanceof Uint8Array) {
    bytes = input;
  } else {
    throw new NmRecipeError('recipe', 'must be hex or bytes');
  }
  if (bytes.length !== NM_RECIPE_LEN) throw new NmRecipeError('recipe', `must be ${NM_RECIPE_LEN} bytes`);
  if (bytes[0] !== NM_RECIPE_VERSION) throw new NmRecipeError('version', `must be ${NM_RECIPE_VERSION}`);
  if (bytes[1] !== NM_SERIES) throw new NmRecipeError('series', `must be ${NM_SERIES}`);
  const design = bytes[2];
  if (design >= NM_DESIGNS) throw new NmRecipeError('design', 'must be an integer 0..99');
  const copy = (bytes[3] << 8) | bytes[4];
  if (copy > NM_COPIES_PER_DESIGN) throw new NmRecipeError('copy', 'must be an integer 0..10');
  return {
    version: bytes[0],
    series: bytes[1],
    design,
    copy,
    svgSha256: bytesToHex(bytes.slice(5, 37)),
    nativeRgbPrefix: bytesToHex(bytes.slice(37, 53)),
  };
}

/** blake2b-256 recipe hash, exactly what the chain records per token (hex). */
export function recipeHash(input) {
  const hex = typeof input === 'string' ? input : bytesToHex(input);
  return editionRecipeHash(hex);
}

/** recipe[1..5]: the 4-byte unique key the edition enforces (hex). */
export function uniqueKey(input) {
  const bytes = typeof input === 'string' ? hexToBytes(input) : input;
  return bytesToHex(bytes.slice(1, 1 + NM_UNIQUE_KEY_LEN));
}

/** Chain serial of design d's house specimen (copy 0), given the house mints them first, in order. */
export const specimenSerial = (design) => design + 1;
/** nm100-000 … nm100-099: the art catalog id of a design. */
export const nm100Id = (design) => `nm100-${String(design).padStart(3, '0')}`;
/** NM27-000001 …: the catalog label of a chain serial. */
export const nm27Label = (serial) => `NM27-${String(serial).padStart(6, '0')}`;

/** Does a recipe's art match a published chain.json entry? */
export function recipeMatchesEntry(decoded, entry) {
  return (
    decoded.design === entry.design &&
    decoded.svgSha256 === entry.svg_sha256 &&
    decoded.nativeRgbPrefix === entry.native_rgb_sha256.slice(0, NM_RGB_PREFIX_BYTES * 2)
  );
}

/** Every (design, copy) recipe hash for the published entries: hash → { design, copy }. */
export function recipeIndex(entries) {
  const index = new Map();
  for (const entry of entries) {
    for (let copy = 0; copy <= NM_COPIES_PER_DESIGN; copy += 1) {
      const hex = encodeRecipeHex({ design: entry.design, copy, svgSha256: entry.svg_sha256, nativeRgbSha256: entry.native_rgb_sha256 });
      index.set(recipeHash(hex), { design: entry.design, copy, recipe: hex });
    }
  }
  return index;
}
