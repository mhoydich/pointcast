#!/usr/bin/env node
// Nouns Money honest-copy scan (plan §6 "Never use"), over two scopes:
//
//   STRICT  the chain surfaces built for Phase A. Zero banned words, ever,
//           anywhere in the file: code, comments, attributes, strings. This
//           scope is a plain grep of the whole text (only the approved lines
//           are cut out first), so no syntax can hide a word from it.
//   LEGACY  every other Nouns Money source/page that was live before Phase A.
//           A ratchet: a file may never gain a banned word beyond
//           tests/fixtures/nouns-money-banned-baseline.json. The baseline
//           records what is live today, so it can only go down.
//
//   node scripts/nm-honest-copy.mjs              # report both scopes
//   node scripts/nm-honest-copy.mjs --baseline   # rewrite the legacy baseline (only after removing words)
//
// tests/nouns-money-chain-copy.test.mjs runs the same checks and fails the
// test run; assertNmChainReady() runs the strict copy check in the Astro build.
// The LEGACY scope reads only the copy a person sees (extractCopy), because
// those files are code-heavy pages that still carry live banned words.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { countHits, scanSource, scanText } from '../src/lib/nouns-money/honest-copy.mjs';

const root = new URL('../', import.meta.url);
export const BASELINE_PATH = 'tests/fixtures/nouns-money-banned-baseline.json';

/** The Phase A chain surfaces: copy must scan clean. */
export const STRICT_FILES = Object.freeze([
  'src/lib/nouns-money/chain-copy.mjs',
  'src/data/nouns-money-chain.ts',
  'src/components/NounsMoneyChainShelf.astro',
  'src/pages/nouns-money/note/[serial].astro',
  'scripts/build-nm-chain.mjs',
  'public/nouns-money/chain.json',
  'public/nouns-money/chain/nm-recipe.js',
  'public/nouns-money/chain/nm-shelf.js',
  'public/nouns-money/chain/nm-wallet.js',
  'public/nouns-money/chain/nm-collect.js',
  'public/nouns-money/chain/nm-note-page.js',
]);

/** Every Nouns Money source/page outside the strict scope (tracked files, by pattern). */
export const LEGACY_PATTERNS = Object.freeze([
  'src/pages/nouns-money*',
  'src/pages/nouns-money/**',
  'src/components/*NounsMoney*',
  'src/layouts/NounsMoney*',
  'src/lib/nouns-money*',
  'src/lib/nouns-money/**',
  'src/data/nouns-money-*',
  'src/scripts/nouns-money-*',
  'functions/api/me/nouns-money.ts',
]);

/** The scanner and its own word list are not copy. */
const NOT_COPY = new Set(['src/lib/nouns-money/honest-copy.mjs']);

export function legacyFiles() {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', ...LEGACY_PATTERNS], {
    cwd: fileURLToPath(root),
    encoding: 'utf8',
  });
  const strict = new Set(STRICT_FILES);
  return out
    .split('\n')
    .filter(Boolean)
    .filter((p) => !strict.has(p) && !NOT_COPY.has(p))
    .sort();
}

export const readRepo = (p) => readFileSync(new URL(p, root), 'utf8');

/** { file: { patternId: count } } for files with at least one hit. */
export function scanFiles(files) {
  const report = {};
  for (const f of files) {
    const hits = scanSource(readRepo(f), f);
    if (hits.length) report[f] = countHits(hits);
  }
  return report;
}

export function readBaseline() {
  try {
    return JSON.parse(readRepo(BASELINE_PATH)).files;
  } catch {
    return {};
  }
}

/**
 * STRICT: { file: { patternId: count } } over each file's whole text, the way
 * grep would read it. Nothing is skipped as "code".
 */
export function scanStrict(files = STRICT_FILES) {
  const report = {};
  for (const f of files) {
    const hits = scanText(readRepo(f));
    if (hits.length) report[f] = countHits(hits);
  }
  return report;
}

/** Files whose count for any pattern exceeds the baseline. */
export function ratchetViolations(report, baseline) {
  const out = [];
  for (const [file, counts] of Object.entries(report)) {
    for (const [id, n] of Object.entries(counts)) {
      const allowed = baseline[file]?.[id] ?? 0;
      if (n > allowed) out.push({ file, id, count: n, allowed });
    }
  }
  return out;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const strict = scanStrict(STRICT_FILES);
  const legacy = scanFiles(legacyFiles());
  if (process.argv.includes('--baseline')) {
    const doc = {
      schema: 'pointcast.nouns-money.banned-baseline/v1',
      note: 'Banned-word counts (plan §6 "Never use") in Nouns Money copy that was live before Phase A. A ratchet: counts may only go down. Regenerate with node scripts/nm-honest-copy.mjs --baseline after removing words, never to add them.',
      files: legacy,
    };
    writeFileSync(new URL(BASELINE_PATH, root), JSON.stringify(doc, null, 2) + '\n');
    console.log(`wrote ${BASELINE_PATH}: ${Object.keys(legacy).length} files`);
  }
  console.log('STRICT (must be empty):', JSON.stringify(strict));
  const total = Object.values(legacy).reduce((n, c) => n + Object.values(c).reduce((a, b) => a + b, 0), 0);
  console.log(`LEGACY: ${total} banned-word hits in ${Object.keys(legacy).length} files`);
  for (const [f, c] of Object.entries(legacy)) console.log(`  ${f}: ${JSON.stringify(c)}`);
  const v = ratchetViolations(legacy, readBaseline());
  if (Object.keys(strict).length || v.length) {
    for (const x of v) console.error(`RATCHET ${x.file}: ${x.id} ${x.count} > ${x.allowed}`);
    process.exit(1);
  }
}
