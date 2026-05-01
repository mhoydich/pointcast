#!/usr/bin/env node
/**
 * agent-spend.mjs — resident-side spend-and-receipt wrapper.
 *
 * Runs `link-cli spend-request create --test --request-approval`, awaits
 * Mike's approval push, and on success writes a Block to
 * `src/content/blocks/####.json` populating the `spend` field. The
 * caller commits and pushes the Block themselves (or runs with
 * --commit to do it inline).
 *
 * v0 architecture choice: the Cloudflare Worker can't spawn child
 * processes, so the Astro `/api/link/spend.ts` route is unreachable on
 * prod. The simpler path: residents (Codex/Claude/Manus) running locally
 * shell out via this script, write the Block JSON, and push. Cloudflare
 * Pages rebuilds.
 *
 * Hard rules (server-side, in addition to dashboard caps):
 *   - --test mode required in v0. --live is disabled until a follow-up PR.
 *   - amount must be <= LINK_CAPS.perPurchaseUsd ($10)
 *   - merchant must be in LINK_MERCHANT_WHITELIST_V0
 *   - context must be >= 100 chars (link-cli requirement)
 *
 * Usage:
 *   node scripts/agent-spend.mjs \
 *     --agent codex \
 *     --loop scout \
 *     --amount 1.20 \
 *     --merchant replicate.com \
 *     --merchant-url https://replicate.com \
 *     --context "Codex Scout loop — generating 5 ranked leads from this morning's pings via Replicate llava-13b inference. Cost is the inference budget for one batch run; if approved, the resulting receipt block lands in FD with ?lead=1..5 anchors so each lead is citable separately." \
 *     [--channel FD] \
 *     [--dry-run] \
 *     [--commit]
 *
 * Exit codes: 0 success, 1 link-cli error, 2 cap/whitelist violation,
 * 3 bad args, 4 file write failure, 5 git operation failure (when --commit).
 *
 * Env required (sourced from .env.local or shell):
 *   LINK_PAYMENT_METHOD_ID — csmrpd_xxx from Mike's `link-cli onboard`.
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const BLOCKS_DIR = path.join(REPO_ROOT, 'src/content/blocks');
const ENV_FILE = path.join(REPO_ROOT, '.env.local');

// Source .env.local on startup (matches scripts/manus.mjs convention).
// Repo-local secrets land in .env.local which is gitignored.
(function loadEnv() {
  if (!existsSync(ENV_FILE)) return;
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
})();

// Must mirror src/lib/link.ts. If you change one, change the other.
const LINK_CAPS = {
  perPurchaseUsd: 10.0,
  perAgentPerDayUsd: 25.0,
  rolling30dUsd: 200.0,
};
const LINK_MERCHANT_WHITELIST_V0 = new Set([
  'replicate.com',
  'api.anthropic.com',
  'api.openai.com',
]);
const ALLOWED_AGENTS = ['claude', 'codex', 'manus', 'cc'];

// ─── arg parsing ────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') { args.dryRun = true; continue; }
    if (a === '--commit')  { args.commit  = true; continue; }
    if (a.startsWith('--')) {
      args[a.slice(2)] = argv[++i];
    }
  }
  return args;
}

function die(code, msg) {
  process.stderr.write(`\n✗ ${msg}\n\n`);
  process.exit(code);
}

// ─── validation ─────────────────────────────────────────────────────────────

function validate(args) {
  if (!args.agent || !ALLOWED_AGENTS.includes(args.agent)) {
    die(3, `--agent must be one of ${ALLOWED_AGENTS.join(', ')}`);
  }
  if (!args.loop) die(3, '--loop required (e.g. scout, producer, host)');
  const amountUsd = Number(args.amount);
  if (!isFinite(amountUsd) || amountUsd <= 0) die(3, '--amount must be a positive number (USD)');
  if (amountUsd > LINK_CAPS.perPurchaseUsd) {
    die(2, `--amount $${amountUsd} exceeds per-purchase cap of $${LINK_CAPS.perPurchaseUsd}`);
  }
  if (!args.merchant) die(3, '--merchant required (e.g. replicate.com)');
  if (!LINK_MERCHANT_WHITELIST_V0.has(args.merchant)) {
    die(2, `merchant "${args.merchant}" not in v0 whitelist: ${[...LINK_MERCHANT_WHITELIST_V0].join(', ')}`);
  }
  if (!args['merchant-url']) die(3, '--merchant-url required');
  if (!args.context || args.context.length < 100) {
    die(3, `--context required, min 100 chars (link-cli requirement). Got ${args.context?.length ?? 0}.`);
  }
  if (args.live) die(2, '--live not supported in v0. Test mode only.');
  return { ...args, amountUsd, channel: args.channel || 'FD' };
}

// ─── link-cli shell-out ─────────────────────────────────────────────────────

function runLinkCli(args) {
  return new Promise((resolve, reject) => {
    const cliArgs = [
      'spend-request', 'create',
      '--payment-method-id', process.env.LINK_PAYMENT_METHOD_ID,
      '--credential-type',   'card',
      '--amount',            String(Math.round(args.amountUsd * 100)),
      '--currency',          'usd',
      '--merchant-name',     args.merchant,
      '--merchant-url',      args['merchant-url'],
      '--context',           args.context,
      '--request-approval',
      '--test',
      '--format',            'json',
    ];
    process.stdout.write(`→ link-cli ${cliArgs.slice(0, 2).join(' ')}  (test mode, $${args.amountUsd.toFixed(2)} → ${args.merchant})\n`);
    process.stdout.write(`  awaiting approval push on Mike's phone…\n`);

    const proc = spawn('link-cli', cliArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('error', (err) => reject(new Error(`link-cli not on PATH: ${err.message}. Run \`npm install -g @stripe/link-cli\`.`)));
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`link-cli exited ${code}\n${stderr || stdout}`));
        return;
      }
      try { resolve(JSON.parse(stdout)); }
      catch { reject(new Error(`link-cli stdout not JSON:\n${stdout.slice(0, 500)}`)); }
    });
  });
}

// ─── block writer ───────────────────────────────────────────────────────────

async function nextBlockId() {
  const entries = await fs.readdir(BLOCKS_DIR);
  const ids = entries
    .map((e) => e.match(/^(\d{4})\.json$/)?.[1])
    .filter(Boolean)
    .map(Number);
  return String(Math.max(...ids) + 1).padStart(4, '0');
}

async function writeBlock({ id, agent, loop, amountUsd, merchant, merchantUrl, context, settled, channel }) {
  const block = {
    id,
    channel,
    type: 'NOTE',
    title: `${agent} ${loop} — ${merchant} — $${amountUsd.toFixed(2)} (testmode)`,
    dek: `Test-mode receipt of a ${loop} loop. Approved by Mike via Stripe Link push. Spend-request ${settled.id ?? 'unknown'}.`,
    timestamp: new Date().toISOString(),
    size: '1x1',
    noun: Number(id),
    spend: {
      agent,
      loop,
      amount_usd: amountUsd,
      currency: 'usd',
      merchant,
      merchant_url: merchantUrl,
      credential_type: 'card',
      status: settled.status ?? 'settled',
      link_session_id: settled.id ?? '',
      receipt_url: settled.receipt_url ?? undefined,
      mode: 'test',
      context,
    },
    author: agent === 'cc' ? 'cc' : agent,
    source: `link-cli spend-request create --test, approved 2026-04-30 by Mike`,
    meta: {
      location: 'El Segundo, CA',
      station: 'Money',
      series: 'receipt',
      module: '/wire',
      topics: `link; ${agent}; ${loop}; receipt; testmode`,
      status: 'published',
    },
  };
  // strip undefined for clean JSON
  block.spend = Object.fromEntries(Object.entries(block.spend).filter(([, v]) => v !== undefined));
  const target = path.join(BLOCKS_DIR, `${id}.json`);
  await fs.writeFile(target, JSON.stringify(block, null, 2) + '\n', 'utf8');
  return target;
}

// ─── main ───────────────────────────────────────────────────────────────────

(async () => {
  const args = validate(parseArgs(process.argv));

  if (!args.dryRun && !process.env.LINK_PAYMENT_METHOD_ID) {
    die(3, 'LINK_PAYMENT_METHOD_ID env not set. Run `link-cli onboard` first, then export LINK_PAYMENT_METHOD_ID=csmrpd_xxx (or add to .env.local).');
  }

  if (args.dryRun) {
    process.stdout.write('— DRY RUN — no link-cli call, no Block written.\n');
    process.stdout.write(`  agent:        ${args.agent}\n`);
    process.stdout.write(`  loop:         ${args.loop}\n`);
    process.stdout.write(`  amount:       $${args.amountUsd.toFixed(2)}\n`);
    process.stdout.write(`  merchant:     ${args.merchant} (${args['merchant-url']})\n`);
    process.stdout.write(`  context:      ${args.context.slice(0, 80)}…\n`);
    process.stdout.write(`  channel:      ${args.channel}\n`);
    process.stdout.write(`  next id:      ${await nextBlockId()}\n`);
    process.exit(0);
  }

  let settled;
  try {
    settled = await runLinkCli(args);
  } catch (err) {
    die(1, err.message);
  }

  process.stdout.write(`\n✓ approved — spend_request ${settled.id ?? '?'} status=${settled.status ?? '?'}\n`);

  const id = await nextBlockId();
  let target;
  try {
    target = await writeBlock({
      id,
      agent: args.agent,
      loop: args.loop,
      amountUsd: args.amountUsd,
      merchant: args.merchant,
      merchantUrl: args['merchant-url'],
      context: args.context,
      settled,
      channel: args.channel,
    });
  } catch (err) {
    die(4, `block write failed: ${err.message}`);
  }
  process.stdout.write(`✓ wrote ${path.relative(REPO_ROOT, target)}\n`);

  if (args.commit) {
    const { spawn: spawnSync } = await import('node:child_process');
    await new Promise((resolve, reject) => {
      const p = spawnSync('git', ['add', target], { stdio: 'inherit', cwd: REPO_ROOT });
      p.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`git add failed: ${c}`))));
    }).catch((e) => die(5, e.message));
    await new Promise((resolve, reject) => {
      const msg = `content(${id}): ${args.agent} ${args.loop} receipt — ${args.merchant} $${args.amountUsd.toFixed(2)} (testmode)`;
      const p = spawnSync('git', ['commit', '-m', msg], { stdio: 'inherit', cwd: REPO_ROOT });
      p.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`git commit failed: ${c}`))));
    }).catch((e) => die(5, e.message));
    process.stdout.write(`✓ committed. Push when ready.\n`);
  }
})();
