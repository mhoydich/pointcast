#!/usr/bin/env node
/**
 * handshakes — read tmp/visits/_handshakes.jsonl and report.
 *
 * Usage:
 *   node scripts/handshakes.mjs            # latest 30
 *   node scripts/handshakes.mjs --summary  # roll-up by type + adoption
 *   node scripts/handshakes.mjs --json-only  # only show real agents.json hits
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const summary = args.includes('--summary');
const jsonOnly = args.includes('--json-only');

const repoRoot = resolve(fileURLToPath(import.meta.url), '..', '..');
const file = resolve(repoRoot, 'tmp/visits/_handshakes.jsonl');

if (!existsSync(file)) {
  console.error('no handshakes yet. run: node scripts/reciprocal-crawl.mjs');
  process.exit(1);
}

const records = [];
for (const line of readFileSync(file, 'utf8').split('\n')) {
  if (!line) continue;
  try { records.push(JSON.parse(line)); } catch {}
}

const C = { dim: '\x1b[2m', reset: '\x1b[0m', cyan: '\x1b[36m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m' };

if (summary) {
  console.log(`\n${C.cyan}handshakes${C.reset}  ${records.length} total probes\n`);
  const byType = {};
  for (const r of records) {
    byType[r.original_type] ??= { ops: 0, opsOk: 0, wk: 0, wkReal: 0 };
    if (r.target_kind === 'operator') {
      byType[r.original_type].ops++;
      if (r.ok) byType[r.original_type].opsOk++;
    } else {
      byType[r.original_type].wk++;
      if (r.real_agents_json) byType[r.original_type].wkReal++;
    }
  }
  console.log(`${C.cyan}operator-doc reachability + agents.json adoption${C.reset}`);
  for (const [t, s] of Object.entries(byType).sort()) {
    const real = s.wkReal > 0 ? `${C.green}YES (${s.wkReal})${C.reset}` : `${C.dim}none${C.reset}`;
    console.log(`  ${t.padEnd(16)}  operator ${s.opsOk}/${s.ops}  agents.json ${real}`);
  }
  const adopted = records.filter((r) => r.real_agents_json);
  console.log(`\n${C.cyan}sites serving real agents.json:${C.reset} ${adopted.length}`);
  for (const r of adopted) console.log(`  ${r.target}`);
  process.exit(0);
}

const rows = jsonOnly ? records.filter((r) => r.real_agents_json) : records;
console.log(`\n${C.cyan}handshakes${C.reset}  showing ${Math.min(30, rows.length)} of ${rows.length}\n`);
for (const r of rows.slice(-30)) {
  const ts = new Date(r.t).toISOString().replace('T', ' ').slice(0, 16);
  const status = r.status === 200 ? C.green : (r.status === 404 ? C.dim : C.red);
  const real = r.real_agents_json ? ` ${C.green}★real-agents.json${C.reset}` : '';
  console.log(`${C.dim}${ts}Z${C.reset}  ${status}${String(r.status).padStart(3)}${C.reset}  ${r.original_type.padEnd(16)} ${r.target_kind.padEnd(11)}  ${r.target}${real}`);
}
