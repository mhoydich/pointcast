#!/usr/bin/env node
/**
 * verify-receipts.mjs — verify Ed25519 signatures on every spend Block.
 *
 * Reads src/content/blocks/*.json + src/data/agent-identities.json,
 * runs verifySpend() on each block carrying a spend field, and reports.
 *
 * Output: pretty table by default; --json for machine-readable.
 *
 * Useful as a CI gate (catch a tampered Block before merge) or as
 * part of an audit run. No network calls; pure local crypto.
 *
 * Spec: pointcast.agent-payments/v1.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifySpend } from '../src/lib/agent-signing.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BLOCKS_DIR = path.join(REPO_ROOT, 'src/content/blocks');
const IDENTITIES_FILE = path.join(REPO_ROOT, 'src/data/agent-identities.json');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json')   args.json = true;
    if (a === '--strict') args.strict = true; // exit non-zero if any signed receipt fails verification
  }
  return args;
}

(function main() {
  const args = parseArgs(process.argv);
  const identities = JSON.parse(fs.readFileSync(IDENTITIES_FILE, 'utf8'));

  const rows = [];
  let signed = 0, unsigned = 0, valid = 0, invalid = 0;

  for (const f of fs.readdirSync(BLOCKS_DIR).sort()) {
    if (!/\.json$/.test(f)) continue;
    let block;
    try { block = JSON.parse(fs.readFileSync(path.join(BLOCKS_DIR, f), 'utf8')); }
    catch { continue; }
    if (!block.spend) continue;
    const result = verifySpend(block, identities);
    const status = !block.spend.signature ? 'unsigned' : (result.ok ? 'valid' : 'INVALID');
    if (status === 'unsigned') unsigned++;
    else if (status === 'valid') { signed++; valid++; }
    else { signed++; invalid++; }
    rows.push({
      id: block.id,
      agent: block.spend.agent ?? '?',
      agent_id: block.spend.agent_id ?? '—',
      amount_usd: block.spend.amount_usd ?? 0,
      mode: block.spend.mode ?? '?',
      status,
      reason: result.reason,
    });
  }

  if (args.json) {
    process.stdout.write(JSON.stringify({
      total: rows.length, signed, unsigned, valid, invalid, receipts: rows,
    }, null, 2) + '\n');
  } else {
    process.stdout.write('\n— receipt signature audit —\n\n');
    process.stdout.write(`  total receipts:  ${rows.length}\n`);
    process.stdout.write(`  signed:          ${signed} (${valid} valid, ${invalid} INVALID)\n`);
    process.stdout.write(`  unsigned:        ${unsigned}\n\n`);
    for (const r of rows) {
      const icon = r.status === 'valid' ? '✓' : r.status === 'INVALID' ? '✗' : '·';
      process.stdout.write(`  ${icon} ${r.id}  ${r.agent.padEnd(8)} ${r.agent_id.padEnd(20)} $${r.amount_usd.toFixed(2).padStart(7)}  ${r.mode.padEnd(4)}  ${r.status}${r.status === 'INVALID' ? ` — ${r.reason}` : ''}\n`);
    }
    process.stdout.write('\n');
  }

  if (args.strict && invalid > 0) {
    process.stderr.write(`✗ strict mode: ${invalid} INVALID signature(s) found\n`);
    process.exit(2);
  }
})();
