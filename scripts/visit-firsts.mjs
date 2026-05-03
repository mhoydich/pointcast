#!/usr/bin/env node
/**
 * visit-firsts — surface every first-of-a-kind visitor across the snapshot
 * archive. The visit log already stamps `firsts: ['type','country']` on
 * novel entries; this just makes that history readable.
 *
 * Usage:
 *   node scripts/visit-firsts.mjs              # all firsts, oldest → newest
 *   node scripts/visit-firsts.mjs --kind type
 *   node scripts/visit-firsts.mjs --kind country
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const kindIdx = args.indexOf('--kind');
const kindFilter = kindIdx >= 0 ? args[kindIdx + 1] : null;

const repoRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
const visitsDir = resolve(repoRoot, 'tmp/visits');

const all = [];
if (existsSync(visitsDir)) {
  for (const f of readdirSync(visitsDir).filter((x) => x.endsWith('.jsonl'))) {
    for (const line of readFileSync(resolve(visitsDir, f), 'utf8').split('\n')) {
      if (!line) continue;
      try { all.push(JSON.parse(line)); } catch {}
    }
  }
}

try {
  const live = await fetch('https://pointcast.xyz/api/visit?t=' + Date.now()).then((r) => r.json());
  const seen = new Set(all.map((e) => e.t));
  for (const e of live.log || []) if (!seen.has(e.t)) all.push(e);
} catch {}

const firsts = all.filter((e) => Array.isArray(e.firsts) && e.firsts.length > 0).sort((a, b) => a.t - b.t);

const C = { dim: '\x1b[2m', reset: '\x1b[0m', cyan: '\x1b[36m', red: '\x1b[31m', green: '\x1b[32m', magenta: '\x1b[35m', yellow: '\x1b[33m' };
const colorFor = (t) => t === 'human' ? C.green : t.startsWith('ai:') ? C.magenta : t.startsWith('bot:') ? C.yellow : C.dim;

console.log(`\n${C.cyan}firsts archive${C.reset}  ${firsts.length} entries  ${C.dim}(snapshots: ${all.length} total)${C.reset}\n`);

for (const e of firsts) {
  if (kindFilter && !e.firsts.includes(kindFilter)) continue;
  const ts = new Date(e.t).toISOString().replace('T', ' ').slice(0, 16);
  const where = [e.city, e.country].filter(Boolean).join(', ') || '—';
  const badges = e.firsts.map((b) => `${C.red}★${b}${C.reset}`).join(' ');
  console.log(`${C.dim}${ts}Z${C.reset}  ${colorFor(e.type)}${e.type.padEnd(16)}${C.reset}  ${where.padEnd(28)} #${String(e.nounId).padStart(4)}  ${badges}`);
}

const types = new Set(firsts.filter((e) => e.firsts.includes('type')).map((e) => e.type));
const countries = new Set(firsts.filter((e) => e.firsts.includes('country')).map((e) => e.country).filter(Boolean));
console.log(`\n${C.cyan}coverage${C.reset}  ${types.size} unique types · ${countries.size} unique countries`);
