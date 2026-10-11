#!/usr/bin/env node
// Flag-off check for Nouns Money Phase A: does this build render the Nouns
// Money pages exactly as origin/main's build does?
//
//   node scripts/compare-nm-flag-off.mjs <base-dist> <head-dist> [--all]
//
// Compares every file under nouns-money/ plus nouns-money.json (with --all:
// every file in dist). Only ISO-8601 timestamps are normalized. Files Phase A
// adds on purpose (nouns-money/chain.json, nouns-money/chain/*.js) are listed
// as "added"; anything else added, removed or changed fails.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PHASE_A_ADDED = /^nouns-money\/(?:chain\.json|chain\/nm-[a-z-]+\.js)$/;
const TIMESTAMP = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/g;
const TEXT = /\.(?:html|json|xml|txt|js|css|svg|webmanifest)$/;

function walk(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, base, out);
    else out.push(relative(base, p).split('\\').join('/'));
  }
  return out;
}

export function nmScope(dist, all = false) {
  if (all) return walk(dist).sort();
  const files = walk(join(dist, 'nouns-money')).map((p) => `nouns-money/${p}`);
  if (existsSync(join(dist, 'nouns-money.json'))) files.push('nouns-money.json');
  return files.sort();
}

const digest = (dist, rel) => {
  const bytes = readFileSync(join(dist, rel));
  const norm = TEXT.test(rel) ? Buffer.from(bytes.toString('utf8').replace(TIMESTAMP, 'TIMESTAMP')) : bytes;
  return createHash('sha256').update(norm).digest('hex');
};

export function compareDists(baseDist, headDist, { all = false } = {}) {
  const base = new Set(nmScope(baseDist, all));
  const head = new Set(nmScope(headDist, all));
  const result = { same: [], changed: [], removed: [], added: [], unexpectedAdded: [] };
  for (const rel of base) {
    if (!head.has(rel)) result.removed.push(rel);
    else if (digest(baseDist, rel) === digest(headDist, rel)) result.same.push(rel);
    else result.changed.push(rel);
  }
  for (const rel of head) {
    if (base.has(rel)) continue;
    (PHASE_A_ADDED.test(rel) ? result.added : result.unexpectedAdded).push(rel);
  }
  result.ok = !result.changed.length && !result.removed.length && !result.unexpectedAdded.length;
  return result;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const [baseDist, headDist] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!baseDist || !headDist) {
    console.error('usage: node scripts/compare-nm-flag-off.mjs <base-dist> <head-dist> [--all]');
    process.exit(2);
  }
  const r = compareDists(baseDist, headDist, { all: process.argv.includes('--all') });
  console.log(`same ${r.same.length} · changed ${r.changed.length} · removed ${r.removed.length} · added (Phase A) ${r.added.length} · added (unexpected) ${r.unexpectedAdded.length}`);
  for (const k of ['changed', 'removed', 'unexpectedAdded', 'added']) for (const f of r[k]) console.log(`  ${k}: ${f}`);
  process.exit(r.ok ? 0 : 1);
}
