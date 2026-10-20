/**
 * Facts and copy for /chain/bloom (Checkpoint Blooms), kept here so the page,
 * its tests and the integrator read one place. The devnet facts themselves
 * (URL, genesis, yard link) are never retyped: they come from
 * src/data/chain-home.ts.
 *
 * Build-time only: recipeText() reads public/chain/apps/bloom.js, so the
 * recipe the page prints is the shipped code, never a copy that can drift.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

/**
 * TODO(integrator): the wire block that announces Checkpoint Blooms. 0660 is
 * ChainHeader's default (the PointCast Chain home block); set this to the
 * app's own block once it is published, and the breadcrumb follows.
 */
export const BLOOM_BLOCK = '0660';

export const BLOOM_PATH = '/chain/bloom';
export const BLOOM_TITLE = 'Checkpoint Blooms on the PointCast devnet';
export const BLOOM_DESCRIPTION =
  'Every tenth block of the PointCast devnet is a checkpoint. A bloom is an abstract drawing of its hash: the same hash always gives the same SVG, you can recompute it in twenty lines, and witness keys add thin rings. Free, no price, not a token. Devnet, no value, may reset.';

/** The line every Bloom surface carries, verbatim (tests/chain-app-bloom.test.mjs checks it). */
export const HONESTY_LINE = 'devnet · no value · may reset';

/** The one import the printed recipe needs; the shipped file imports the same module by a relative path. */
export const SDK_URL = 'https://pointcast.xyz/chain/sdk/pointcast-chain.js';

const SOURCE = 'public/chain/apps/bloom.js';

/** The recipe region of bloom.js: the lines between the recipe markers, and the text the page prints and copies. */
export function recipeParts(file: string = SOURCE): { lines: string[]; importLine: string; text: string } {
  const src = readFileSync(file, 'utf8');
  const a = src.indexOf('// <recipe>');
  const b = src.indexOf('// </recipe>');
  if (a < 0 || b < a) throw new Error('bloom.js has no recipe markers');
  const lines = src.slice(a + '// <recipe>'.length, b).replace(/^\n/, '').replace(/\n$/, '').split('\n');
  const importLine = `import { blake2b, hexToBytes } from '${SDK_URL}';`;
  const text = `${importLine}\n${lines.join('\n')}\n// bloom('<64 hex: a block hash>') returns the SVG as a string.`;
  return { lines, importLine, text };
}

/**
 * The genesis bloom: drawn from the devnet's genesis hash and printed into the
 * page, so the hero has a picture before the live read lands and without
 * JavaScript. It is not a checkpoint and the page says so.
 */
export async function genesisBloomDataUri(genesis: string): Promise<string> {
  try {
    const mod = await import(/* @vite-ignore */ pathToFileURL(resolve(SOURCE)).href);
    return `data:image/svg+xml,${encodeURIComponent(mod.bloomSvg(genesis))}`;
  } catch {
    return '';
  }
}

/** What each step of the recipe does, in plain words (the printed lines are the exact version). */
export const HOW_STEPS: { k: string; v: string }[] = [
  { k: 'Seeds', v: 'The chain’s own hash, blake2b-512, runs over the 32 bytes of the block hash plus a counter byte, for counters 0, 1 and 2. That is 192 seed bytes. Two bytes at a time become a number between 0 and 1.' },
  { k: 'Palette', v: 'Colours are chosen in OKLCH: one hue anywhere on the wheel, a near-white ink, a deep ground tinted like the site’s ink, and three petal colours with the chroma the channel ramps use. They are written as sRGB hex so every viewer agrees.' },
  { k: 'Petals', v: 'Five to thirteen petals in three layers: long and outer, shorter and offset, short and doubled. Length, width and how sharp the tip is come from the next numbers.' },
  { k: 'Rings and arcs', v: 'Three to six thin rings at hash-chosen radii, some dashed, and three to five signal arcs with round ends that start and sweep where the hash says.' },
  { k: 'Grain', v: 'A calm stipple: 120 tiny dots along a spiral, nudged by the seed bytes.' },
  { k: 'Witness rings', v: 'Not part of the recipe. If keys signed the checkpoint, one thin gold ring per distinct key is added outside the bloom, at radius 390 + 7 × k. Up to 14 are drawn; the text says the real count.' },
];

export const NOT_LIST: string[] = [
  'Free to look at, free to download. There is no price and no sale.',
  'Not tokens. A bloom is a drawing of a checkpoint, not a record on any chain and not a claim on anything.',
  'Not proof. A witness ring is one more accountable claim, tied to a free key, that the key replayed the chain and got this hash. Nothing checks that it did; strikes only catch disagreement with this server.',
  'Not permanent. This is devnet-2, one server runs it, and it may reset. A reset is dated and recorded: devnet-1 is kept as a recording you can replay at /chain/yard/devnet-1/. After a reset the old hashes are gone from the live chain and these drawings would no longer match it.',
];
