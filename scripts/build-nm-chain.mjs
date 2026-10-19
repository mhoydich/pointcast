#!/usr/bin/env node
// Nouns Money chain record: public/nouns-money/chain.json (Phase A, flag off).
//
// One entry per design (0-99): the house specimen's chain serial, its
// 53-byte recipe and recipe hash, and the two art hashes the recipe carries.
// Chain reads (GET /edition/nouns-money-27/mints) return only a recipe hash,
// so this file is how anyone turns a token back into its exact artwork.
//
// Source of truth for the hashes:
//   public/images/nouns-money/source-100/provenance.json
// The output has no timestamps, so a rerun is byte-identical.
//
//   node scripts/build-nm-chain.mjs          # write public/nouns-money/chain.json
//   node scripts/build-nm-chain.mjs --check  # exit 1 if the file is stale
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NM_COPIES_PER_DESIGN,
  NM_DESIGNS,
  NM_EDITION_ID,
  NM_RECIPE_LEN,
  NM_RECIPE_VERSION,
  NM_SERIES,
  NM_SUPPLY,
  NM_UNIQUE_KEY_LEN,
  encodeRecipeHex,
  nm100Id,
  nm27Label,
  recipeHash,
  specimenSerial,
} from '../public/nouns-money/chain/nm-recipe.js';
import { RECIPE_HASH_TAG } from '../public/chain/first-mints/lib/pointcast-chain.js';
import { NM_COPY } from '../src/lib/nouns-money/chain-copy.mjs';

const root = new URL('../', import.meta.url);
export const PROVENANCE_PATH = 'public/images/nouns-money/source-100/provenance.json';
export const CHAIN_JSON_PATH = 'public/nouns-money/chain.json';

export function buildNmChain(provenance) {
  if (!provenance || !Array.isArray(provenance.notes)) throw new Error('provenance.json: notes[] missing');
  const byNoun = new Map(provenance.notes.map((n) => [n.noun_id, n]));
  const entries = [];
  for (let design = 0; design < NM_DESIGNS; design += 1) {
    const note = byNoun.get(design);
    if (!note) throw new Error(`provenance.json: no note for Noun #${design}`);
    if (note.id !== nm100Id(design)) throw new Error(`provenance.json: Noun #${design} is ${note.id}, expected ${nm100Id(design)}`);
    const serial = specimenSerial(design);
    if (note.serial !== nm27Label(serial)) throw new Error(`provenance.json: ${note.id} serial ${note.serial}, expected ${nm27Label(serial)}`);
    const recipe = encodeRecipeHex({ design, copy: 0, svgSha256: note.svg_sha256, nativeRgbSha256: note.native_rgb_sha256 });
    entries.push({
      design,
      noun_id: note.noun_id,
      id: note.id,
      specimen_serial: serial,
      specimen_label: nm27Label(serial),
      copy: 0,
      recipe,
      recipe_hash: recipeHash(recipe),
      svg_sha256: note.svg_sha256,
      native_rgb_sha256: note.native_rgb_sha256,
      svg: note.svg,
      preview: note.preview,
    });
  }
  const doc = {
    schema: 'pointcast.nouns-money.chain/v1',
    edition: NM_EDITION_ID,
    network: 'pointcast-devnet-2',
    status: 'Phase A: published for checking. The edition is not open; nothing here has been minted.',
    standard_line: NM_COPY.standardLine,
    recipe_layout: {
      bytes: NM_RECIPE_LEN,
      fields: 'u8 version ‖ u8 series ‖ u8 design ‖ u16 BE copy ‖ svg_sha256[32] ‖ native_rgb_sha256[0..16]',
      version: NM_RECIPE_VERSION,
      series: NM_SERIES,
      unique_key: `recipe[1..${1 + NM_UNIQUE_KEY_LEN}] = series ‖ design ‖ copy`,
      recipe_hash: `blake2b-256("${RECIPE_HASH_TAG}" ‖ recipe)`,
    },
    serials: {
      specimens: 'The house collects copy 0 of designs 0-99 first, in order: chain serial n = NM27-n = design n-1.',
      copies: `Copies 1-${NM_COPIES_PER_DESIGN} of each design are for public collecting; their serials start at ${NM_DESIGNS + 1}, in the order they land.`,
      supply: NM_SUPPLY,
    },
    provenance: '/' + PROVENANCE_PATH.replace(/^public\//, ''),
    entries,
  };
  return JSON.stringify(doc, null, 2) + '\n';
}

export function readProvenance() {
  return JSON.parse(readFileSync(new URL(PROVENANCE_PATH, root), 'utf8'));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const out = buildNmChain(readProvenance());
  const target = fileURLToPath(new URL(CHAIN_JSON_PATH, root));
  if (process.argv.includes('--check')) {
    let current = '';
    try {
      current = readFileSync(target, 'utf8');
    } catch {
      /* missing counts as stale */
    }
    if (current !== out) {
      console.error(`${CHAIN_JSON_PATH} is stale: run node scripts/build-nm-chain.mjs`);
      process.exit(1);
    }
    console.log(`${CHAIN_JSON_PATH} is current (${out.length} bytes).`);
  } else {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, out);
    console.log(`wrote ${CHAIN_JSON_PATH} (${out.length} bytes, ${NM_DESIGNS} entries)`);
  }
}
