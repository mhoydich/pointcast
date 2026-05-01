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
    if (a === '--live')    { args.live    = true; continue; }
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
  // --live is opt-in; without it we default to --test. Hard cap on live amount
  // is intentionally lower than the per-purchase cap until the loop is proven.
  const isLive = args.live === true;
  if (isLive && amountUsd > 2.0) {
    die(2, `--live capped at $2.00/req for v0 proving runs. Got $${amountUsd}. Raise the cap explicitly when ready.`);
  }
  return { ...args, amountUsd, channel: args.channel || 'FD', isLive };
}

// ─── link-cli shell-out ─────────────────────────────────────────────────────

// link-cli's spend-request flow is two-step (discovered 2026-04-30 ~22:00 PT
// after losing two credentials):
//   1. `create` returns immediately with status: 'pending_approval' and a
//      `_next.command` instruction to poll `retrieve <id> --interval 2 --max-attempts N`.
//   2. The user approves in the Link iPhone app (or via approval_url in browser).
//   3. We must poll `retrieve` to get the issued credential.
//
// `--request-approval` on `create` does NOT poll inline — that flag tells the
// CLI to fire the user-side push, but the credential still lives in `retrieve`.
//
// For credential-type=card, `retrieve --include card` returns the actual
// virtual card { number, cvc, exp_month, exp_year, brand, valid_until }.

function runCli(args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn('link-cli', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('error', (err) => reject(new Error(`link-cli spawn failed: ${err.message}. Run \`npm install -g @stripe/link-cli\`.`)));
    proc.on('close', (code) => {
      if (code !== 0 && !opts.allowNonZero) {
        reject(new Error(`link-cli exited ${code}\n${stderr || stdout}`));
        return;
      }
      try { resolve({ data: JSON.parse(stdout), code }); }
      catch { reject(new Error(`link-cli stdout not JSON:\n${stdout.slice(0, 500)}`)); }
    });
  });
}

function unwrap(d) {
  // link-cli returns either a single object or a single-element array.
  if (Array.isArray(d)) return d[0] ?? {};
  return d ?? {};
}

async function createSpendRequest(args) {
  const cliArgs = [
    'spend-request', 'create',
    '--payment-method-id', process.env.LINK_PAYMENT_METHOD_ID,
    '--credential-type',   'card',
    '--amount',            String(Math.round(args.amountUsd * 100)),
    '--currency',          'usd',
    '--merchant-name',     args.merchant,
    '--merchant-url',      args['merchant-url'],
    '--context',           args.context,
    '--format',            'json',
  ];
  if (!args.isLive) cliArgs.push('--test');
  const modeLabel = args.isLive ? 'LIVE — REAL MONEY' : 'test mode';
  process.stdout.write(`→ link-cli spend-request create  (${modeLabel}, $${args.amountUsd.toFixed(2)} → ${args.merchant})\n`);

  const { data } = await runCli(cliArgs);
  return unwrap(data);
}

async function pollUntilTerminal(spendRequestId, intervalSec = 2, maxAttempts = 150) {
  process.stdout.write(`  polling spend-request ${spendRequestId} every ${intervalSec}s (max ${maxAttempts} attempts)…\n`);
  process.stdout.write(`  ↳ approve on iPhone Link app, OR open the approval_url in browser if shown above.\n`);
  // link-cli's retrieve has built-in polling — much cheaper than us looping.
  const { data } = await runCli([
    'spend-request', 'retrieve', spendRequestId,
    '--interval', String(intervalSec),
    '--max-attempts', String(maxAttempts),
    '--include', 'card',
    '--format', 'json',
  ], { allowNonZero: true });
  return unwrap(data);
}

async function runLinkCli(args) {
  // Two-step: create → returns pending_approval + approval_url.
  const created = await createSpendRequest(args);
  const status0 = created.status ?? created.code;
  const id = created.id ?? created.spendRequestId ?? created.spend_request_id;
  const approvalUrl = created.approval_url ?? created.approvalUrl;

  if (status0 === 'approved' || status0 === 'settled') {
    // Test mode often resolves immediately. Retrieve once with --include card to grab it.
    if (!id) return created;
    const { data } = await runCli(['spend-request','retrieve', id, '--include','card','--format','json']);
    return unwrap(data);
  }

  if (!id) {
    throw new Error(`link-cli created response missing id field. Got: ${JSON.stringify(created).slice(0,400)}`);
  }
  if (approvalUrl) {
    process.stdout.write(`  approval_url: ${approvalUrl}\n`);
  }

  // Poll until terminal status. Re-throws on POLLING_TIMEOUT / DENIED / EXPIRED.
  const settled = await pollUntilTerminal(id);
  if (settled.code === 'POLLING_TIMEOUT' || settled.status === 'expired' || settled.status === 'denied') {
    throw new Error(`spend-request ${id} did not resolve approved. status=${settled.status ?? settled.code}. Recover via \`link-cli spend-request retrieve ${id} --include card --format json\` once approved.`);
  }
  return settled;
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

async function writeBlock({ id, agent, loop, amountUsd, merchant, merchantUrl, context, settled, channel, isLive }) {
  // Verified shape from `link-cli spend-request retrieve --include card --format json`
  // (2026-04-30 night): top-level `id` (lsrq_xxx prefix), `status`, `card` object
  // with { number, cvc, exp_month, exp_year, brand, valid_until, billing_address }.
  // Older parses checked `spendRequestId` / camelCase — kept as fallback.
  const spendRequestId = settled.id ?? settled.spendRequestId ?? settled.spend_request_id ?? '';
  const status = settled.status ?? 'unknown';
  const approvalUrl = settled.approval_url ?? settled.approvalUrl ?? undefined;
  const receiptUrl = settled.receipt_url ?? settled.receiptUrl ?? undefined;
  const card = settled.card ?? settled.virtualCard ?? null;
  // We store last4 + brand + valid_until in the Block — never the full PAN.
  // The PAN lives only in ~/.link-cli-receipts/{id}.json (mode 0600) for the
  // user to paste into a merchant checkout. Block is git-tracked & public.
  const cardLast4  = card ? (card.last4 ?? card.number?.slice(-4) ?? null) : null;
  const cardBrand  = card?.brand ?? null;
  const cardValidUntil = card?.valid_until ?? card?.validUntil ?? null;

  const block = {
    id,
    channel,
    type: 'NOTE',
    title: `${agent} ${loop} — ${merchant} — $${amountUsd.toFixed(2)}${isLive ? '' : ' (testmode)'}`,
    dek: `${isLive ? 'Live' : 'Test-mode'} receipt of a ${loop} loop. Approved by Mike via Stripe Link. Spend-request ${spendRequestId || 'unknown'}.`,
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
      status,
      link_session_id: spendRequestId,
      approval_url: approvalUrl,
      receipt_url: receiptUrl,
      card_last4: cardLast4 ?? undefined,
      card_brand: cardBrand ?? undefined,
      card_valid_until: cardValidUntil ?? undefined,
      mode: isLive ? 'live' : 'test',
      context,
    },
    author: agent === 'cc' ? 'cc' : agent,
    source: `link-cli spend-request create${isLive ? '' : ' --test'}, approved by Mike on ${new Date().toISOString().slice(0, 10)}`,
    meta: {
      location: 'El Segundo, CA',
      station: 'Money',
      series: 'receipt',
      module: '/wire',
      topics: `link; ${agent}; ${loop}; receipt; ${isLive ? 'live' : 'testmode'}`,
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
    process.stdout.write(`  mode:         ${args.isLive ? 'LIVE — REAL MONEY' : 'test'}\n`);
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

  // Resolve id/status with the same camelCase fallbacks writeBlock uses.
  const sid = settled.spendRequestId ?? settled.id ?? settled.spend_request_id ?? settled.spendRequest?.id ?? '?';
  const sstatus = settled.status ?? settled.spendRequest?.status ?? '?';
  process.stdout.write(`\n✓ approved — spend_request ${sid} status=${sstatus}\n`);

  // CRITICAL — print and persist the credential. link-cli returns one-time-use
  // card details that we MUST surface for the user to paste into the merchant
  // checkout form. If we don't, the credential is lost (no list cmd to recover).
  // Save to ~/.link-cli-receipts/{id}.json with 0600 mode (user-only) — gitignored
  // by living outside the repo entirely. Print to stdout so the user can copy now.
  const card = settled.card ?? settled.virtualCard ?? settled.spendRequest?.card ?? settled.credential ?? null;
  if (card || args.isLive) {
    process.stdout.write('\n— CARD CREDENTIAL (one-time use, expires fast) —\n');
    if (card) {
      const last4 = card.last4 ?? card.number?.slice(-4) ?? '????';
      process.stdout.write(`  number:   ${card.number ?? `•••• ${last4}`}\n`);
      process.stdout.write(`  exp:      ${card.expMonth ?? card.exp_month ?? '??'}/${card.expYear ?? card.exp_year ?? '????'}\n`);
      process.stdout.write(`  cvc:      ${card.cvc ?? card.cvv ?? '???'}\n`);
      process.stdout.write(`  brand:    ${card.brand ?? '?'}\n`);
    } else {
      process.stdout.write('  (link-cli payload had no recognizable card field — full raw dump below)\n');
    }
    process.stdout.write('\n— RAW link-cli RESPONSE (for debug / recovery) —\n');
    process.stdout.write(JSON.stringify(settled, null, 2) + '\n');
    process.stdout.write('\nPaste into the merchant checkout in the next ~10 min before this credential expires.\n\n');

    // Also persist outside the repo for after-the-fact recovery.
    const RECEIPTS_DIR = path.join(process.env.HOME ?? '', '.link-cli-receipts');
    try {
      await fs.mkdir(RECEIPTS_DIR, { recursive: true, mode: 0o700 });
      const stash = path.join(RECEIPTS_DIR, `${sid}.json`);
      await fs.writeFile(stash, JSON.stringify(settled, null, 2) + '\n', { mode: 0o600 });
      process.stdout.write(`(also saved to ${stash} — file mode 0600, outside the repo)\n\n`);
    } catch { /* non-fatal */ }
  }

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
      isLive: args.isLive,
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
