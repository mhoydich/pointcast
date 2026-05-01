#!/usr/bin/env node
/**
 * audit-spend.mjs — read-only audit of every Block carrying a `spend` field.
 *
 * Reports:
 *  - Per-block status (pending_approval / approved / settled / etc.)
 *  - Per-block credential availability (file present in ~/.link-cli-receipts)
 *  - Per-block credential validity (valid_until vs now)
 *  - Totals: spent, pending, by mode, by agent
 *  - Dual-rail blocks (those carrying both `edition` and `spend`)
 *
 * Optional --refresh flag: also calls `link-cli spend-request retrieve <id>`
 * for each block whose spend.link_session_id is set, updating the local
 * Block JSON if the live status has changed (e.g., pending_approval → approved).
 * No money is moved; just state reconciliation.
 *
 * Optional --recover flag: for any block whose live status is 'approved' and
 * whose ~/.link-cli-receipts/{id}.json doesn't exist, fetch the credential
 * with --include card and save it to disk (mode 0600). Useful for the
 * "I lost the credential before it expired" recovery path.
 *
 * Usage:
 *   node scripts/audit-spend.mjs                      # plain audit, no calls
 *   node scripts/audit-spend.mjs --refresh            # also reconcile live status
 *   node scripts/audit-spend.mjs --refresh --recover  # also try to recover credentials
 *   node scripts/audit-spend.mjs --json               # machine-readable output
 *
 * Exit codes: 0 success, 1 cli error, 3 bad args.
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BLOCKS_DIR = path.join(REPO_ROOT, 'src/content/blocks');
const RECEIPTS_DIR = path.join(process.env.HOME ?? '', '.link-cli-receipts');
const ENV_FILE = path.join(REPO_ROOT, '.env.local');

(function loadEnv() {
  if (!existsSync(ENV_FILE)) return;
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
})();

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--refresh')   args.refresh = true;
    else if (a === '--recover') args.recover = true;
    else if (a === '--json')    args.json = true;
  }
  return args;
}

function unwrap(d) { return Array.isArray(d) ? d[0] ?? {} : d ?? {}; }

function runCli(cliArgs) {
  return new Promise((resolve, reject) => {
    const proc = spawn('link-cli', cliArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    proc.stdout.on('data', (d) => (out += d.toString()));
    proc.stderr.on('data', (d) => (err += d.toString()));
    proc.on('error', (e) => reject(new Error(`link-cli not on PATH: ${e.message}`)));
    proc.on('close', (code) => {
      try { resolve({ data: JSON.parse(out), code }); }
      catch { reject(new Error(`stdout not JSON (exit ${code}): ${err || out.slice(0, 200)}`)); }
    });
  });
}

async function readSpendBlocks() {
  const entries = await fs.readdir(BLOCKS_DIR);
  const out = [];
  for (const e of entries) {
    if (!/\.json$/.test(e)) continue;
    try {
      const j = JSON.parse(await fs.readFile(path.join(BLOCKS_DIR, e), 'utf8'));
      if (j.spend) out.push({ path: path.join(BLOCKS_DIR, e), block: j });
    } catch { /* skip malformed */ }
  }
  out.sort((a, b) => Number(a.block.id) - Number(b.block.id));
  return out;
}

function credentialFile(spendId) {
  if (!spendId) return null;
  const f = path.join(RECEIPTS_DIR, `${spendId}.json`);
  return existsSync(f) ? f : null;
}

function fmtUsd(n) { return `$${(n ?? 0).toFixed(2)}`; }

function classifyValidity(validUntilStr, now = new Date()) {
  if (!validUntilStr) return { state: 'unknown', minutes: null };
  const validUntil = new Date(validUntilStr);
  const minutes = Math.floor((validUntil.getTime() - now.getTime()) / 60000);
  if (minutes < 0)      return { state: 'expired',  minutes };
  if (minutes < 30)     return { state: 'imminent', minutes };
  if (minutes < 60 * 6) return { state: 'fresh',    minutes };
  return                       { state: 'fresh',    minutes };
}

(async () => {
  const args = parseArgs(process.argv);
  const blocks = await readSpendBlocks();

  if (blocks.length === 0) {
    process.stdout.write('No blocks with spend field found.\n');
    process.exit(0);
  }

  const rows = [];
  let totalUsd = 0, pendingUsd = 0, liveUsd = 0, testUsd = 0;
  const byAgent = new Map();

  for (const { path: bp, block } of blocks) {
    const s = block.spend;
    let liveStatus = s.status;
    let card = null;
    let credFile = credentialFile(s.link_session_id);

    if (args.refresh && s.link_session_id) {
      try {
        const result = await runCli(['spend-request', 'retrieve', s.link_session_id, '--include','card', '--format','json']);
        const settled = unwrap(result.data);
        liveStatus = settled.status ?? liveStatus;
        if (settled.card) card = settled.card;

        if (args.recover && card && !credFile && (liveStatus === 'approved' || liveStatus === 'settled')) {
          await fs.mkdir(RECEIPTS_DIR, { recursive: true, mode: 0o700 });
          const stash = path.join(RECEIPTS_DIR, `${s.link_session_id}.json`);
          await fs.writeFile(stash, JSON.stringify(settled, null, 2) + '\n', { mode: 0o600 });
          credFile = stash;
        }

        if (liveStatus !== s.status) {
          const updated = { ...block, spend: { ...s, status: liveStatus } };
          if (card) {
            const last4 = card.last4 ?? card.number?.slice(-4);
            if (last4) updated.spend.card_last4 = last4;
            if (card.brand) updated.spend.card_brand = card.brand;
            if (card.valid_until) updated.spend.card_valid_until = card.valid_until;
          }
          await fs.writeFile(bp, JSON.stringify(updated, null, 2) + '\n');
        }
      } catch (err) {
        // network / cli issue — keep going, just don't update
      }
    }

    const validity = classifyValidity(s.card_valid_until ?? card?.valid_until);
    totalUsd += s.amount_usd;
    if (s.mode === 'live') liveUsd += s.amount_usd; else testUsd += s.amount_usd;
    if (liveStatus === 'pending_approval' || liveStatus === 'pending') pendingUsd += s.amount_usd;
    const ag = byAgent.get(s.agent) ?? { count: 0, usd: 0 };
    ag.count++; ag.usd += s.amount_usd;
    byAgent.set(s.agent, ag);

    rows.push({
      id: block.id,
      mode: s.mode,
      amount: s.amount_usd,
      merchant: s.merchant,
      agent: s.agent,
      loop: s.loop,
      status: liveStatus,
      session: s.link_session_id || '—',
      cred: credFile ? 'on-disk' : '—',
      validity: validity.state,
      validity_min: validity.minutes,
      dual_rail: !!block.edition,
    });
  }

  if (args.json) {
    process.stdout.write(JSON.stringify({
      totals: { totalUsd, pendingUsd, liveUsd, testUsd, count: rows.length },
      by_agent: Object.fromEntries(byAgent),
      receipts: rows,
    }, null, 2) + '\n');
    process.exit(0);
  }

  // Pretty terminal output.
  process.stdout.write('\n— /money audit —\n\n');
  process.stdout.write(`  receipts:   ${rows.length}\n`);
  process.stdout.write(`  total:      ${fmtUsd(totalUsd)}\n`);
  process.stdout.write(`  test:       ${fmtUsd(testUsd)}\n`);
  process.stdout.write(`  live:       ${fmtUsd(liveUsd)}\n`);
  process.stdout.write(`  pending:    ${fmtUsd(pendingUsd)}\n`);
  process.stdout.write(`  dual-rail:  ${rows.filter((r) => r.dual_rail).length}\n`);

  process.stdout.write('\n  by agent:\n');
  for (const [a, st] of byAgent) {
    process.stdout.write(`    ${a.padEnd(8)}  ${String(st.count).padStart(3)} loop(s)  ${fmtUsd(st.usd)}\n`);
  }

  process.stdout.write('\n  receipts:\n');
  for (const r of rows) {
    const mode = r.mode === 'live' ? 'LIVE' : 'test';
    const status = r.status.padEnd(18);
    const cred  = r.cred === 'on-disk' ? '🔑' : '··';
    const validity = r.validity === 'expired' ? `expired ${Math.abs(r.validity_min)}m ago`
                  : r.validity === 'imminent' ? `${r.validity_min}m left`
                  : r.validity === 'fresh' ? `${Math.floor((r.validity_min ?? 0) / 60)}h+ left`
                  : '';
    process.stdout.write(`    ${r.id}  ${mode.padEnd(4)}  ${fmtUsd(r.amount).padStart(7)}  ${r.merchant.padEnd(18)} ${r.agent}/${r.loop.padEnd(12)}  ${status} ${cred} ${validity}\n`);
  }
  process.stdout.write('\n');

  if (!args.refresh) {
    process.stdout.write('  (run with --refresh to reconcile live status; add --recover to fetch credentials for newly-approved requests)\n\n');
  }
})();
