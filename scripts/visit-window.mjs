#!/usr/bin/env node
/**
 * visit-window — promo-window analyzer. Given an event timestamp (the moment
 * you posted on X / Nextdoor / Slack / wherever), report what landed on
 * pointcast.xyz in the N minutes that followed.
 *
 * Reads from tmp/visits/*.jsonl snapshots written by visit-tail.mjs --save.
 * Falls back to the live API for the very recent window if snapshots haven't
 * caught up yet.
 *
 * Usage:
 *   node scripts/visit-window.mjs "2026-05-01T05:00Z"        # default 60min
 *   node scripts/visit-window.mjs "2026-05-01T05:00Z" 120    # 120min window
 *   node scripts/visit-window.mjs --since 4h                 # last 4 hours
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const flagIdx = (n) => argv.indexOf(`--${n}`);
const sinceFlag = flagIdx('since') >= 0 ? argv[flagIdx('since') + 1] : null;

const repoRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
const visitsDir = resolve(repoRoot, 'tmp/visits');

let startMs, durationMin;

if (sinceFlag) {
  const m = /^(\d+)([mh])$/.exec(sinceFlag);
  if (!m) { console.error('--since takes e.g. 30m or 4h'); process.exit(1); }
  durationMin = m[2] === 'h' ? Number(m[1]) * 60 : Number(m[1]);
  startMs = Date.now() - durationMin * 60_000;
} else {
  const positional = argv.filter((a) => !a.startsWith('--'));
  if (positional.length === 0) {
    console.error('usage: visit-window.mjs <iso-timestamp> [minutes]   OR   --since 60m|4h');
    process.exit(1);
  }
  startMs = Date.parse(positional[0]);
  if (Number.isNaN(startMs)) { console.error(`bad timestamp: ${positional[0]}`); process.exit(1); }
  durationMin = Number(positional[1]) || 60;
}

const endMs = startMs + durationMin * 60_000;

const loadFromSnapshots = () => {
  if (!existsSync(visitsDir)) return [];
  const files = readdirSync(visitsDir).filter((f) => f.endsWith('.jsonl'));
  const all = [];
  for (const f of files) {
    for (const line of readFileSync(resolve(visitsDir, f), 'utf8').split('\n')) {
      if (!line) continue;
      try { all.push(JSON.parse(line)); } catch {}
    }
  }
  return all;
};

const loadFromApi = async () => {
  const r = await fetch('https://pointcast.xyz/api/visit?t=' + Date.now());
  if (!r.ok) return [];
  const d = await r.json();
  return d.log || [];
};

const snapshot = loadFromSnapshots();
const live = await loadFromApi();
const seen = new Set();
const merged = [...snapshot, ...live].filter((e) => {
  if (seen.has(e.t)) return false;
  seen.add(e.t);
  return true;
});

const inWindow = merged.filter((e) => e.t >= startMs && e.t <= endMs).sort((a, b) => a.t - b.t);

const types = {}, countries = {}, cities = {};
for (const e of inWindow) {
  types[e.type] = (types[e.type] || 0) + 1;
  if (e.country) countries[e.country] = (countries[e.country] || 0) + 1;
  if (e.type === 'human' && e.city) cities[`${e.city}, ${e.region || e.country}`] = (cities[e.city] || 0) + 1;
}

const ent = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]);
const C = { dim: '\x1b[2m', reset: '\x1b[0m', cyan: '\x1b[36m', green: '\x1b[32m', magenta: '\x1b[35m', yellow: '\x1b[33m' };

console.log(`\n${C.cyan}window:${C.reset} ${new Date(startMs).toISOString()} → ${new Date(endMs).toISOString()}`);
console.log(`${C.cyan}duration:${C.reset} ${durationMin}min`);
console.log(`${C.cyan}hits:${C.reset} ${inWindow.length}`);
console.log(`  ${C.green}humans:${C.reset}    ${inWindow.filter((e) => e.type === 'human').length}`);
console.log(`  ${C.magenta}AI crawlers:${C.reset} ${inWindow.filter((e) => e.type.startsWith('ai:')).length}`);
console.log(`  ${C.yellow}other bots:${C.reset} ${inWindow.filter((e) => e.type.startsWith('bot:')).length}`);

if (inWindow.length === 0) {
  console.log(`\n${C.dim}no entries — try a wider window or check the timestamp${C.reset}`);
  process.exit(0);
}

console.log(`\n${C.cyan}by type${C.reset}`);
for (const [k, v] of ent(types)) console.log(`  ${k.padEnd(18)} ${v}`);

console.log(`\n${C.cyan}by country${C.reset}`);
for (const [k, v] of ent(countries)) console.log(`  ${k.padEnd(4)} ${v}`);

const realHumans = inWindow.filter((e) => e.type === 'human' && e.city !== 'Hawthorne');
if (realHumans.length) {
  console.log(`\n${C.cyan}non-Hawthorne humans${C.reset}`);
  for (const e of realHumans) {
    const where = [e.city, e.region, e.country].filter(Boolean).join(', ');
    const offset = Math.round((e.t - startMs) / 60_000);
    console.log(`  +${String(offset).padStart(3)}m  ${where.padEnd(36)} noun #${e.nounId}`);
  }
}

const aiHits = inWindow.filter((e) => e.type.startsWith('ai:'));
if (aiHits.length) {
  console.log(`\n${C.cyan}AI crawler timing${C.reset}`);
  const buckets = {};
  for (const e of aiHits) {
    const b = Math.floor((e.t - startMs) / 60_000 / 5) * 5;
    buckets[b] = buckets[b] || {};
    buckets[b][e.type] = (buckets[b][e.type] || 0) + 1;
  }
  for (const [b, ts] of Object.entries(buckets).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    const parts = Object.entries(ts).map(([k, v]) => `${k}×${v}`).join(' ');
    console.log(`  +${String(b).padStart(3)}m  ${parts}`);
  }
}
