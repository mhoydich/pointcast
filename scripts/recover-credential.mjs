#!/usr/bin/env node
/**
 * recover-credential.mjs — fetch + save a card credential for an existing
 * approved spend-request, when scripts/agent-spend.mjs lost it (or for any
 * other recovery path).
 *
 * Discovered necessary on 2026-04-30 night when the original agent-spend.mjs
 * script didn't poll past the initial pending_approval response and dropped
 * the issued credential. See docs/proposals/2026-04-30-link-architecture-correction.md
 * for the full bug story.
 *
 * Usage:
 *   node scripts/recover-credential.mjs <lsrq_xxx>
 *   node scripts/recover-credential.mjs <lsrq_xxx> --backfill <block_id>   # also patch the Block JSON with non-sensitive metadata
 *   node scripts/recover-credential.mjs <lsrq_xxx> --interval 2 --max-attempts 30  # poll if still pending_approval
 *
 * Output:
 *   - Prints last4 / brand / exp / valid_until / file path to stdout (no PAN)
 *   - Persists full payload to ~/.link-cli-receipts/{lsrq_id}.json with file mode 0600
 *   - With --backfill: also updates src/content/blocks/{block_id}.json
 *     to populate spend.link_session_id + card_last4 + card_brand + card_valid_until,
 *     leaving the existing fields (agent, loop, amount_usd, ...) untouched.
 *
 * Security: full PAN / cvc are NEVER printed to stdout, NEVER written to any
 * file inside the repo, and NEVER returned in shell exit messages. They live
 * only in ~/.link-cli-receipts/{id}.json which is outside the git tree and
 * mode 0600 (user-only readable).
 *
 * Exit codes: 0 success, 1 cli error, 2 missing or non-approved request,
 * 3 bad args, 4 backfill error.
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
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
  const args = { positional: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) args[a.slice(2)] = argv[++i];
    else args.positional.push(a);
  }
  return args;
}

function die(code, msg) {
  process.stderr.write(`\n✗ ${msg}\n\n`);
  process.exit(code);
}

function unwrap(d) { return Array.isArray(d) ? d[0] ?? {} : d ?? {}; }

function runCli(cliArgs, allowNonZero = false) {
  return new Promise((resolve, reject) => {
    const proc = spawn('link-cli', cliArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    proc.stdout.on('data', (d) => (out += d.toString()));
    proc.stderr.on('data', (d) => (err += d.toString()));
    proc.on('error', (e) => reject(new Error(`link-cli not on PATH: ${e.message}`)));
    proc.on('close', (code) => {
      if (code !== 0 && !allowNonZero) {
        reject(new Error(`link-cli exited ${code}\n${err || out}`));
        return;
      }
      try { resolve({ data: JSON.parse(out), code }); }
      catch { reject(new Error(`stdout not JSON:\n${out.slice(0, 500)}`)); }
    });
  });
}

async function backfillBlock(blockId, settled) {
  const blockPath = path.join(BLOCKS_DIR, `${blockId}.json`);
  if (!existsSync(blockPath)) {
    die(4, `Block ${blockId} not found at ${blockPath}.`);
  }
  const block = JSON.parse(await fs.readFile(blockPath, 'utf8'));
  if (!block.spend) {
    die(4, `Block ${blockId} has no spend field — nothing to backfill.`);
  }
  const card = settled.card ?? {};
  const last4 = card.last4 ?? card.number?.slice(-4) ?? null;
  const before = JSON.stringify(block.spend);

  block.spend.link_session_id = settled.id ?? block.spend.link_session_id ?? '';
  if (settled.status) block.spend.status = settled.status;
  if (settled.approval_url) block.spend.approval_url = settled.approval_url;
  if (settled.receipt_url) block.spend.receipt_url = settled.receipt_url;
  if (last4) block.spend.card_last4 = last4;
  if (card.brand) block.spend.card_brand = card.brand;
  if (card.valid_until) block.spend.card_valid_until = card.valid_until;

  if (JSON.stringify(block.spend) === before) {
    process.stdout.write(`  block ${blockId} already has all available metadata; no change\n`);
    return blockPath;
  }
  await fs.writeFile(blockPath, JSON.stringify(block, null, 2) + '\n');
  process.stdout.write(`  block ${blockId} backfilled — ${path.relative(REPO_ROOT, blockPath)}\n`);
  return blockPath;
}

(async () => {
  const args = parseArgs(process.argv);
  const lsrqId = args.positional[0];
  if (!lsrqId || !lsrqId.startsWith('lsrq_')) {
    die(3, 'first positional arg must be the spend-request id (lsrq_xxx)');
  }

  // Optional polling for in-flight pending_approval requests.
  const interval = Number(args.interval ?? 2);
  const maxAttempts = Number(args['max-attempts'] ?? 1);
  const useBuiltinPoll = maxAttempts > 1;

  process.stdout.write(`→ link-cli spend-request retrieve ${lsrqId} --include card\n`);
  const cliArgs = [
    'spend-request', 'retrieve', lsrqId,
    '--include', 'card',
    '--format', 'json',
  ];
  if (useBuiltinPoll) {
    cliArgs.push('--interval', String(interval), '--max-attempts', String(maxAttempts));
  }

  let result;
  try {
    result = await runCli(cliArgs, useBuiltinPoll);
  } catch (err) {
    die(1, err.message);
  }
  const settled = unwrap(result.data);

  if (settled.code === 'POLLING_TIMEOUT') {
    die(2, `polling timed out — request still ${settled.message?.match(/current status is (\w+)/)?.[1] ?? 'unknown'}. Try again with --max-attempts higher, or approve in Link app first.`);
  }
  const status = settled.status ?? settled.code;
  if (!['approved', 'settled'].includes(status)) {
    die(2, `request status is "${status}" — credential not retrievable. Approve in Link app first, then re-run.`);
  }

  // Persist outside the repo with restrictive perms.
  await fs.mkdir(RECEIPTS_DIR, { recursive: true, mode: 0o700 });
  const stash = path.join(RECEIPTS_DIR, `${lsrqId}.json`);
  await fs.writeFile(stash, JSON.stringify(settled, null, 2) + '\n', { mode: 0o600 });

  // Stdout summary — no PAN, no cvc.
  const card = settled.card ?? {};
  const last4 = card.last4 ?? card.number?.slice(-4) ?? '????';
  process.stdout.write(`\n✓ retrieved + saved\n`);
  process.stdout.write(`  status:        ${status}\n`);
  process.stdout.write(`  amount:        $${(settled.amount ?? 0) / 100} ${(settled.currency ?? 'usd').toUpperCase()}\n`);
  process.stdout.write(`  brand:         ${card.brand ?? '?'}\n`);
  process.stdout.write(`  •••• last4:    ${last4}\n`);
  process.stdout.write(`  exp:           ${card.exp_month ?? '?'}/${card.exp_year ?? '?'}\n`);
  process.stdout.write(`  valid_until:   ${card.valid_until ?? '?'}\n`);
  process.stdout.write(`  file:          ${stash}\n`);
  process.stdout.write(`  permissions:   0600 (user-only readable)\n`);
  process.stdout.write(`\nFor merchant checkout: \`cat ${stash} | python3 -m json.tool\` then copy card.number / cvc / exp into the form.\n\n`);

  if (args.backfill) {
    await backfillBlock(args.backfill, settled);
  }
})();
