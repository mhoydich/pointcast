#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  MONEY_LIVE_CAP_CENTS,
  buildAllowanceSummary,
  centsFromAmount,
  formatUsd,
  normalizeMoneyReceiptDraft,
  publicMoneyReceiptDraft,
} from '../src/lib/money-runtime.mjs';

const args = parseArgs(process.argv.slice(2));
const command = args._[0] ?? 'help';

if (args.help || command === 'help') {
  printHelp();
  process.exit(0);
}

try {
  if (command === 'create') await createSpendRequest(args);
  else if (command === 'retrieve') await retrieveSpendRequest(args);
  else throw new Error(`unknown command "${command}"`);
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: err?.message ?? String(err) }, null, 2));
  process.exit(1);
}

async function createSpendRequest(options) {
  const amountCents = centsFromAmount(options.amountCents ?? options['amount-cents'], options.amountUsd ?? options['amount-usd']);
  const mode = options.test ? 'test' : 'live';
  const merchantName = required(options.merchantName ?? options['merchant-name'], '--merchant-name');
  const merchantUrl = required(options.merchantUrl ?? options['merchant-url'], '--merchant-url');
  const context = required(options.context, '--context');
  const agent = options.agent ?? 'codex';
  const loop = options.loop ?? 'scout';
  if (amountCents <= 0) throw new Error('amount must be positive');
  if (context.length < 100) throw new Error('context must be at least 100 characters; Link shows this to Mike for approval');

  const canonical = await readCanonicalLedger();
  const drafts = await readDraftReceipts(options);
  const allowance = buildAllowanceSummary(canonical, drafts);
  if (mode === 'live' && amountCents > allowance.remainingCents) {
    throw new Error(
      `live request ${formatUsd(amountCents)} exceeds remaining cap ${allowance.remainingLabel} of ${allowance.capLabel}`,
    );
  }

  const cliArgs = [
    'spend-request',
    'create',
    '--format',
    'json',
    '--amount',
    String(amountCents),
    '--currency',
    String(options.currency ?? 'usd'),
    '--merchantName',
    merchantName,
    '--merchantUrl',
    merchantUrl,
    '--context',
    context,
    '--lineItem',
    `name:${agent}/${loop},amount:${amountCents}`,
    '--total',
    `label:Total,amount:${amountCents}`,
  ];
  if (options.paymentMethodId ?? options['payment-method-id']) {
    cliArgs.push('--paymentMethodId', String(options.paymentMethodId ?? options['payment-method-id']));
  }
  if (options['no-approval']) cliArgs.push('--requestApproval', 'false');
  if (options.test) cliArgs.push('--test');

  if (options['dry-run']) {
    printJson({
      ok: true,
      dryRun: true,
      mode,
      allowance,
      command: redactCommand(['link-cli', ...cliArgs]),
    });
    return;
  }

  const result = runLinkCli(cliArgs);
  const normalized = normalizeMoneyReceiptDraft(result, {
    agent,
    loop,
    now: new Date().toISOString(),
  });
  printJson({
    ok: true,
    mode,
    allowance,
    receipt: publicMoneyReceiptDraft(normalized),
    rawStatus: result?.status ?? result?.data?.object?.status ?? null,
  });
}

async function retrieveSpendRequest(options) {
  const id = required(options._[1] ?? options.id, 'spend request id');
  const cliArgs = ['spend-request', 'retrieve', id, '--format', 'json'];
  if (options.timeout) cliArgs.push('--timeout', String(options.timeout));
  if (options.interval) cliArgs.push('--interval', String(options.interval));
  if (options.maxAttempts ?? options['max-attempts']) {
    cliArgs.push('--maxAttempts', String(options.maxAttempts ?? options['max-attempts']));
  }
  const result = options['dry-run'] ? { id, status: 'pending' } : runLinkCli(cliArgs);
  const normalized = normalizeMoneyReceiptDraft(result, {
    agent: options.agent ?? 'codex',
    loop: options.loop ?? 'scout',
    now: new Date().toISOString(),
  });
  printJson({
    ok: true,
    dryRun: Boolean(options['dry-run']),
    receipt: publicMoneyReceiptDraft(normalized),
  });
}

function runLinkCli(cliArgs) {
  const child = spawnSync('link-cli', cliArgs, { encoding: 'utf8' });
  if (child.error) throw child.error;
  if (child.status !== 0) {
    throw new Error((child.stderr || child.stdout || `link-cli exited ${child.status}`).trim());
  }
  try {
    return JSON.parse(child.stdout);
  } catch {
    return { output: child.stdout.trim() };
  }
}

async function readCanonicalLedger() {
  const blocksDir = resolve('src/content/blocks');
  const { readdir } = await import('node:fs/promises');
  const files = await readdir(blocksDir);
  const receipts = [];
  for (const file of files) {
    if (!/^\d{4}\.json$/.test(file)) continue;
    const data = JSON.parse(await readFile(resolve(blocksDir, file), 'utf8'));
    if (!data.spend) continue;
    receipts.push({
      linkSessionId: data.spend.link_session_id ?? null,
      mode: data.spend.mode ?? 'live',
      status: data.spend.status,
      amountCents: centsFromAmount(data.spend.amount_cents, data.spend.amount_usd),
    });
  }
  return {
    liveCents: receipts.filter((receipt) => receipt.mode === 'live').reduce((sum, receipt) => sum + receipt.amountCents, 0),
    testCents: receipts.filter((receipt) => receipt.mode === 'test').reduce((sum, receipt) => sum + receipt.amountCents, 0),
    receipts,
  };
}

async function readDraftReceipts(options) {
  if (options['drafts-file']) {
    const parsed = JSON.parse(await readFile(resolve(String(options['drafts-file'])), 'utf8'));
    return Array.isArray(parsed) ? parsed : parsed.receipts ?? [];
  }
  if (options['receipts-url']) {
    const headers = {};
    if (options['admin-token']) headers.authorization = `Bearer ${options['admin-token']}`;
    const response = await fetch(String(options['receipts-url']), { headers });
    if (!response.ok) throw new Error(`receipt endpoint returned ${response.status}`);
    const parsed = await response.json();
    return parsed.receipts ?? [];
  }
  return [];
}

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];
    if (!part.startsWith('--')) {
      parsed._.push(part);
      continue;
    }
    const key = part.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) parsed[key] = true;
    else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function required(value, label) {
  if (value == null || String(value).trim() === '') throw new Error(`${label} is required`);
  return String(value).trim();
}

function redactCommand(command) {
  const redacted = [...command];
  const sensitive = new Set(['--paymentMethodId']);
  for (let i = 0; i < redacted.length; i += 1) {
    if (sensitive.has(redacted[i]) && redacted[i + 1]) redacted[i + 1] = '[redacted]';
  }
  return redacted;
}

function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function printHelp() {
  console.log(`PointCast Money spend request wrapper

Usage:
  node scripts/link-spend-request.mjs create --agent codex --loop scout --amount-cents 50 --merchant-name replicate.com --merchant-url https://replicate.com --context "100+ chars..." [--test] [--dry-run]
  node scripts/link-spend-request.mjs retrieve <request-id> [--timeout 300] [--interval 5]

Live requests reserve against a ${formatUsd(MONEY_LIVE_CAP_CENTS)} cap using canonical MNY Blocks plus optional --drafts-file or --receipts-url data.
`);
}
