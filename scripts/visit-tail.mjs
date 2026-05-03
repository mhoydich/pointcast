#!/usr/bin/env node
/**
 * visit-tail — peek at the live PointCast visit log.
 *
 * Usage:
 *   node scripts/visit-tail.mjs                 # latest 20 entries
 *   node scripts/visit-tail.mjs --n 50
 *   node scripts/visit-tail.mjs --watch         # poll every 15s
 *   node scripts/visit-tail.mjs --filter human  # only humans
 *   node scripts/visit-tail.mjs --filter ai:    # only AI crawlers
 *   node scripts/visit-tail.mjs --summary       # type + country breakdown
 *   node scripts/visit-tail.mjs --save          # append new entries to tmp/visits/YYYY-MM-DD.jsonl
 *   node scripts/visit-tail.mjs --watch --save  # poll + persist
 *
 * Snapshots dedupe by entry timestamp `t` (ms epoch — unique per write).
 */

import { mkdirSync, appendFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return undefined;
  const v = args[i + 1];
  return v && !v.startsWith('--') ? v : true;
};

const base = process.env.PC_BASE || 'https://pointcast.xyz';
const n = Number(flag('n')) || 20;
const filter = typeof flag('filter') === 'string' ? flag('filter') : '';
const watch = flag('watch') === true;
const summary = flag('summary') === true;
const save = flag('save') === true;

const repoRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
const visitsDir = resolve(repoRoot, 'tmp/visits');
const seen = new Set();

const C = { dim: '\x1b[2m', reset: '\x1b[0m', cyan: '\x1b[36m', yellow: '\x1b[33m', green: '\x1b[32m', magenta: '\x1b[35m', red: '\x1b[31m' };

const colorFor = (type) => {
  if (type === 'human') return C.green;
  if (type.startsWith('ai:')) return C.magenta;
  if (type.startsWith('bot:')) return C.yellow;
  return C.dim;
};

const fmtTime = (t) => {
  const d = new Date(t);
  const ago = Math.floor((Date.now() - t) / 1000);
  const rel = ago < 60 ? `${ago}s` : ago < 3600 ? `${Math.floor(ago / 60)}m` : ago < 86400 ? `${Math.floor(ago / 3600)}h` : `${Math.floor(ago / 86400)}d`;
  return `${d.toISOString().slice(11, 19)}Z ${C.dim}(${rel} ago)${C.reset}`;
};

const snapshotFor = (t) => {
  const d = new Date(t);
  const day = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  return resolve(visitsDir, `${day}.jsonl`);
};

const loadSeenForToday = () => {
  const f = snapshotFor(Date.now());
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    if (!line) continue;
    try { seen.add(JSON.parse(line).t); } catch {}
  }
};

const persist = (log) => {
  if (!existsSync(visitsDir)) mkdirSync(visitsDir, { recursive: true });
  let added = 0;
  for (const e of [...log].reverse()) {
    if (seen.has(e.t)) continue;
    seen.add(e.t);
    appendFileSync(snapshotFor(e.t), JSON.stringify(e) + '\n');
    added++;
  }
  return added;
};

const fetchLog = async () => {
  const r = await fetch(`${base}/api/visit?t=${Date.now()}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
};

const renderSummary = (log, count) => {
  const types = {}, countries = {};
  for (const e of log) {
    types[e.type] = (types[e.type] || 0) + 1;
    if (e.country) countries[e.country] = (countries[e.country] || 0) + 1;
  }
  const entries = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
  console.log(`\n${C.cyan}total count:${C.reset} ${count}  ${C.dim}(log holds last ${log.length})${C.reset}\n`);
  console.log(`${C.cyan}by type${C.reset}`);
  for (const [k, v] of entries(types)) console.log(`  ${colorFor(k)}${k.padEnd(18)}${C.reset} ${v}`);
  console.log(`\n${C.cyan}by country${C.reset}`);
  for (const [k, v] of entries(countries)) console.log(`  ${k.padEnd(4)} ${v}`);
};

const renderRows = (log, count, present) => {
  console.clear?.();
  console.log(`${C.cyan}pointcast visits${C.reset}  total=${count}  here=${present.length}  ${C.dim}${new Date().toISOString()}${C.reset}\n`);
  let rows = log;
  if (filter) rows = rows.filter((e) => e.type.includes(filter));
  for (const e of rows.slice(0, n)) {
    const where = e.city ? `${e.city}, ${e.region || e.country}` : e.country || '—';
    const firsts = e.firsts?.length ? ` ${C.red}★${e.firsts.join(',')}${C.reset}` : '';
    const note = e.note ? `  ${C.dim}"${e.note}"${C.reset}` : '';
    console.log(`${fmtTime(e.t)}  ${colorFor(e.type)}${e.type.padEnd(16)}${C.reset} #${String(e.nounId).padStart(4)}  ${where}${firsts}${note}`);
  }
};

const run = async () => {
  const data = await fetchLog();
  if (save) {
    const added = persist(data.log);
    if (added) console.log(`${C.dim}[save] +${added} new entries → tmp/visits/${C.reset}`);
  }
  if (summary) return renderSummary(data.log, data.count);
  renderRows(data.log, data.count, data.present);
};

if (save) loadSeenForToday();
await run();
if (watch) {
  setInterval(() => run().catch((e) => console.error(C.red + e.message + C.reset)), 15_000);
}
