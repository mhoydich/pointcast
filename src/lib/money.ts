import type { CollectionEntry } from 'astro:content';
import {
  MONEY_LIVE_CAP_CENTS,
  buildAllowanceSummary as buildRuntimeAllowanceSummary,
  formatUsd as formatRuntimeUsd,
} from './money-runtime.mjs';

export type MoneyBlock = CollectionEntry<'blocks'>;
export type SpendStatus = 'pending' | 'approved' | 'denied' | 'settled' | 'refunded';
export type SpendMode = 'test' | 'live';
export { MONEY_LIVE_CAP_CENTS };

export interface MoneyReceipt {
  id: string;
  title: string;
  url: string;
  jsonUrl: string;
  timestamp: string;
  whenLabel: string;
  agent: string;
  loop: string;
  agentLoop: string;
  amountCents: number;
  amountUsd: number;
  amountLabel: string;
  currency: string;
  merchant: string;
  mode: SpendMode;
  status: SpendStatus;
  linkSessionId: string | null;
  receiptUrl: string | null;
  credentialLabel: string | null;
  context: string;
  dualRail: boolean;
}

export interface MoneyAgentTotal {
  agent: string;
  amountCents: number;
  amountUsd: number;
  amountLabel: string;
  receiptCount: number;
}

export interface MoneyLedger {
  totalCents: number;
  totalUsd: number;
  totalLabel: string;
  testCents: number;
  testLabel: string;
  liveCents: number;
  liveLabel: string;
  receiptCount: number;
  dualRailCount: number;
  allowance: MoneyAllowanceSummary;
  agents: MoneyAgentTotal[];
  receipts: MoneyReceipt[];
  updatedAt: string | null;
}

export interface MoneyAllowanceSummary {
  capCents: number;
  capUsd: number;
  capLabel: string;
  liveSpentCents: number;
  liveSpentLabel: string;
  testCents: number;
  testLabel: string;
  reservedDraftCents: number;
  reservedDraftLabel: string;
  liveReservedCents: number;
  liveReservedLabel: string;
  remainingCents: number;
  remainingLabel: string;
  pendingReceiptCount: number;
  settledDraftCount: number;
  overCap: boolean;
}

export function amountCentsForSpend(spend: MoneyBlock['data']['spend']): number {
  if (!spend) return 0;
  if (Number.isFinite(spend.amount_cents)) return Math.round(spend.amount_cents ?? 0);
  if (Number.isFinite(spend.amount_usd)) return Math.round((spend.amount_usd ?? 0) * 100);
  return 0;
}

export function formatUsd(cents: number): string {
  return formatRuntimeUsd(cents);
}

export function buildMoneyLedger(blocks: MoneyBlock[], now = new Date()): MoneyLedger {
  const receipts = blocks
    .filter((block) => Boolean(block.data.spend))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime())
    .map((block) => buildReceipt(block, now));

  const totalCents = receipts.reduce((sum, receipt) => sum + receipt.amountCents, 0);
  const testCents = receipts.filter((receipt) => receipt.mode === 'test').reduce((sum, receipt) => sum + receipt.amountCents, 0);
  const liveCents = receipts.filter((receipt) => receipt.mode === 'live').reduce((sum, receipt) => sum + receipt.amountCents, 0);
  const dualRailCount = receipts.filter((receipt) => receipt.dualRail).length;

  const agentMap = new Map<string, MoneyAgentTotal>();
  receipts.forEach((receipt) => {
    const current = agentMap.get(receipt.agent) ?? {
      agent: receipt.agent,
      amountCents: 0,
      amountUsd: 0,
      amountLabel: formatUsd(0),
      receiptCount: 0,
    };
    current.amountCents += receipt.amountCents;
    current.amountUsd = current.amountCents / 100;
    current.amountLabel = formatUsd(current.amountCents);
    current.receiptCount += 1;
    agentMap.set(receipt.agent, current);
  });

  const agents = [...agentMap.values()].sort((a, b) => {
    if (b.amountCents !== a.amountCents) return b.amountCents - a.amountCents;
    return a.agent.localeCompare(b.agent);
  });

  return {
    totalCents,
    totalUsd: totalCents / 100,
    totalLabel: formatUsd(totalCents),
    testCents,
    testLabel: formatUsd(testCents),
    liveCents,
    liveLabel: formatUsd(liveCents),
    receiptCount: receipts.length,
    dualRailCount,
    allowance: buildRuntimeAllowanceSummary({ liveCents, testCents, receipts }) as MoneyAllowanceSummary,
    agents,
    receipts,
    updatedAt: receipts[0]?.timestamp ?? null,
  };
}

function buildReceipt(block: MoneyBlock, now: Date): MoneyReceipt {
  const spend = block.data.spend!;
  const amountCents = amountCentsForSpend(spend);
  const agent = spend.agent;
  const loop = spend.loop;
  return {
    id: block.data.id,
    title: block.data.title,
    url: `https://pointcast.xyz/b/${block.data.id}`,
    jsonUrl: `https://pointcast.xyz/b/${block.data.id}.json`,
    timestamp: block.data.timestamp.toISOString(),
    whenLabel: relativeTime(block.data.timestamp, now),
    agent,
    loop,
    agentLoop: `${agent}/${loop}`,
    amountCents,
    amountUsd: amountCents / 100,
    amountLabel: formatUsd(amountCents),
    currency: spend.currency ?? 'USD',
    merchant: spend.merchant,
    mode: spend.mode ?? 'live',
    status: spend.status,
    linkSessionId: spend.link_session_id ?? null,
    receiptUrl: spend.receipt_url ?? null,
    credentialLabel: spend.credential_label ?? null,
    context: contextForBlock(block),
    dualRail: Boolean(block.data.edition),
  };
}

function contextForBlock(block: MoneyBlock): string {
  const body = block.data.body ?? block.data.dek ?? '';
  const first = body.split(/\n\n+/)[0]?.trim() ?? '';
  return first.length > 520 ? `${first.slice(0, 517).trimEnd()}...` : first;
}

function relativeTime(date: Date, now: Date): string {
  const diffSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Los_Angeles',
  }).format(date);
}
