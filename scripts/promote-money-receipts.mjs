#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  assertNoMoneySecrets,
  centsFromAmount,
  formatUsd,
  publicMoneyReceiptDraft,
} from '../src/lib/money-runtime.mjs';

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

try {
  const receipts = await readReceipts(args);
  const selected = selectReceipt(receipts, args);
  const blockId = String(args.id ?? (await nextBlockId(Number(args['start-id'] ?? 0)))).padStart(4, '0');
  const block = buildBlock(selected, blockId, args);
  const problems = assertNoMoneySecrets(block);
  if (problems.length > 0) throw new Error(`refusing to promote secret-like fields: ${problems.join(', ')}`);

  const outputPath = resolve('src/content/blocks', `${blockId}.json`);
  if (args.write) {
    await mkdir(resolve('src/content/blocks'), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(block, null, 2)}\n`, 'utf8');
  }

  console.log(JSON.stringify({
    ok: true,
    dryRun: !args.write,
    wrote: args.write ? outputPath : null,
    blockId,
    receiptId: selected.id,
    block,
  }, null, 2));
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: err?.message ?? String(err) }, null, 2));
  process.exit(1);
}

async function readReceipts(options) {
  if (options.file) {
    const parsed = JSON.parse(await readFile(resolve(String(options.file)), 'utf8'));
    return normalizeReceiptList(parsed);
  }
  if (options['receipt-json']) {
    return [JSON.parse(await readFile(resolve(String(options['receipt-json'])), 'utf8'))];
  }
  if (options['receipts-url']) {
    const headers = {};
    if (options['admin-token']) headers.authorization = `Bearer ${options['admin-token']}`;
    const response = await fetch(String(options['receipts-url']), { headers });
    if (!response.ok) throw new Error(`receipt endpoint returned ${response.status}`);
    return normalizeReceiptList(await response.json());
  }
  throw new Error('provide --file, --receipt-json, or --receipts-url');
}

function normalizeReceiptList(value) {
  if (Array.isArray(value)) return value.map(publicMoneyReceiptDraft);
  return (value.receipts ?? []).map(publicMoneyReceiptDraft);
}

function selectReceipt(receipts, options) {
  const settled = receipts.filter((receipt) => receipt.status === 'settled' && !receipt.promotedBlockId);
  if (options['receipt-id']) {
    const found = settled.find((receipt) => receipt.id === options['receipt-id'] || receipt.linkSessionId === options['receipt-id']);
    if (!found) throw new Error(`settled unpromoted receipt not found: ${options['receipt-id']}`);
    return found;
  }
  if (settled.length === 0) throw new Error('no settled unpromoted receipts found');
  return settled.sort((a, b) => String(a.settledAt ?? a.updatedAt).localeCompare(String(b.settledAt ?? b.updatedAt)))[0];
}

async function nextBlockId(startAt = 0) {
  const blocksDir = resolve('src/content/blocks');
  const files = await readdir(blocksDir);
  const max = files
    .map((file) => file.match(/^(\d{4})\.json$/)?.[1])
    .filter(Boolean)
    .map(Number)
    .reduce((highest, id) => Math.max(highest, id), startAt);
  return max + 1;
}

function buildBlock(receipt, blockId, options) {
  const amountCents = centsFromAmount(receipt.amountCents, receipt.amountUsd);
  const amountLabel = formatUsd(amountCents);
  const timestamp = receipt.settledAt ?? receipt.approvedAt ?? receipt.updatedAt ?? new Date().toISOString();
  const modeSuffix = receipt.mode === 'test' ? ' (testmode)' : '';
  const body =
    receipt.context ||
    `Link ${receipt.mode} receipt for ${receipt.agent}/${receipt.loop}: ${amountLabel} at ${receipt.merchant}.`;
  return {
    id: blockId,
    channel: 'MNY',
    type: 'READ',
    title: `${receipt.agent} ${receipt.loop} - ${receipt.merchant} - ${amountLabel}${modeSuffix}`,
    dek: `Link ${receipt.mode} spend receipt for ${receipt.agent}/${receipt.loop}.`,
    timestamp,
    size: '2x1',
    noun: Number(blockId),
    readingTime: '1 min',
    body,
    spend: {
      agent: receipt.agent,
      loop: receipt.loop,
      amount_cents: amountCents,
      amount_usd: amountCents / 100,
      currency: receipt.currency ?? 'USD',
      merchant: receipt.merchant,
      mode: receipt.mode,
      status: 'settled',
      link_session_id: receipt.linkSessionId,
      ...(receipt.receiptUrl ? { receipt_url: receipt.receiptUrl } : {}),
      ...(receipt.credentialLabel ? { credential_label: receipt.credentialLabel } : {}),
      ...(receipt.requestedAt ? { requested_at: receipt.requestedAt } : {}),
      ...(receipt.approvedAt ? { approved_at: receipt.approvedAt } : {}),
      ...(receipt.settledAt ? { settled_at: receipt.settledAt } : {}),
    },
    external: {
      label: 'Open Money ledger',
      url: 'https://pointcast.xyz/money',
    },
    companions: [
      { id: '0410', label: 'Why this exists', surface: 'block' },
      { id: 'https://link.com/agents', label: 'Link for agents', surface: 'external' },
    ],
    author: options.author ?? 'codex',
    source: `Promoted Link spend receipt ${receipt.linkSessionId ?? receipt.id}.`,
    mood: 'systems-current',
    meta: {
      location: 'PointCast money desk',
      series: 'agent-payments',
      topics: `link; ${receipt.mode}; ${receipt.agent}; ${receipt.loop}; receipt`,
      status: 'published',
    },
  };
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];
    if (!part.startsWith('--')) continue;
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

function printHelp() {
  console.log(`Promote settled Link receipt drafts into MNY Blocks.

Usage:
  node scripts/promote-money-receipts.mjs --file receipts.json
  node scripts/promote-money-receipts.mjs --receipts-url https://pointcast.xyz/api/link/receipts --admin-token "$MONEY_ADMIN_TOKEN"
  node scripts/promote-money-receipts.mjs --file receipts.json --receipt-id req_123 --write

Defaults to dry-run. Pass --write to create src/content/blocks/<next-id>.json.
`);
}
