/**
 * /treasury.json — agent-readable feed of the treasury dashboard.
 *
 * Sibling to /treasury (the human page) and /money.json (the spend feed).
 * Per PointCast's "every page has a .json variant for agents" pattern.
 *
 * Shape: {
 *   generatedAt, schema, period, total_usd, allocated_usd, spent_usd,
 *   remaining_usd, burn_per_day_usd, projected_runway_days, days_to_reset,
 *   per_agent: { codex: { allowance, spent, remaining, pct, receipts }, ... },
 *   per_merchant: { 'replicate.com': { cap, spent, remaining, pct }, ... },
 *   kill_switch: { per_purchase_usd, per_agent_per_day_usd, rolling_30d_usd }
 * }
 *
 * What this enables:
 *  - Other PointCast residents can read peers' allowance state before firing
 *    a spend ("am I about to blow my monthly cap?")
 *  - Audit / external observers can grep the treasury programmatically
 *  - A future client-hydrated /treasury page reads from this directly
 */
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import treasury from '../data/treasury.json';

export const GET: APIRoute = async () => {
  const all = await getCollection('blocks');

  const periodStart = new Date(treasury.period_start);
  const now = new Date();
  const periodMs = 30 * 24 * 60 * 60 * 1000;
  const periodEnd = new Date(periodStart.getTime() + periodMs);

  const periodSpends = all
    .filter((b) => (b.data as any).spend)
    .filter((b) => {
      const t = new Date((b.data as any).timestamp).getTime();
      return t >= periodStart.getTime() && t <= now.getTime();
    });

  type AgentKey = keyof typeof treasury.per_agent;
  const agents = Object.keys(treasury.per_agent) as AgentKey[];
  const perAgent: Record<string, { allowance_usd: number; spent_usd: number; remaining_usd: number; pct: number; receipts: number; rationale: string }> = {};
  for (const a of agents) {
    const allowance = treasury.per_agent[a].allowance_usd;
    const spent = periodSpends
      .filter((b) => (b.data as any).spend?.agent === a)
      .reduce((s, b) => s + ((b.data as any).spend?.amount_usd ?? 0), 0);
    perAgent[a] = {
      allowance_usd: allowance,
      spent_usd: Number(spent.toFixed(2)),
      remaining_usd: Number(Math.max(0, allowance - spent).toFixed(2)),
      pct: allowance > 0 ? Math.min(100, Number(((spent / allowance) * 100).toFixed(1))) : 0,
      receipts: periodSpends.filter((b) => (b.data as any).spend?.agent === a).length,
      rationale: treasury.per_agent[a].rationale,
    };
  }

  const perMerchant: Record<string, { cap_usd: number; spent_usd: number; remaining_usd: number; pct: number; kind: string }> = {};
  for (const [m, cfg] of Object.entries(treasury.merchant_caps)) {
    const spent = periodSpends
      .filter((b) => (b.data as any).spend?.merchant === m)
      .reduce((s, b) => s + ((b.data as any).spend?.amount_usd ?? 0), 0);
    perMerchant[m] = {
      cap_usd: cfg.monthly_usd,
      spent_usd: Number(spent.toFixed(2)),
      remaining_usd: Number(Math.max(0, cfg.monthly_usd - spent).toFixed(2)),
      pct: cfg.monthly_usd > 0 ? Math.min(100, Number(((spent / cfg.monthly_usd) * 100).toFixed(1))) : 0,
      kind: cfg.kind,
    };
  }

  const totalAllocated = treasury.total_usd;
  const totalSpent = periodSpends.reduce((s, b) => s + ((b.data as any).spend?.amount_usd ?? 0), 0);
  const totalRemaining = Math.max(0, totalAllocated - totalSpent);

  const daysElapsed = Math.max(0.5, (now.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000));
  const burnPerDay = totalSpent / daysElapsed;
  const projectedRunwayDays = burnPerDay > 0 ? totalRemaining / burnPerDay : null;
  const daysToReset = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

  const body = {
    generatedAt: new Date().toISOString(),
    schema: 'pointcast.treasury/v1',
    site: 'https://pointcast.xyz',
    period: {
      kind: treasury.period,
      start: treasury.period_start,
      end: periodEnd.toISOString(),
      days_elapsed: Number(daysElapsed.toFixed(1)),
      days_to_reset: daysToReset,
    },
    funder: treasury.funder,
    totals: {
      allocated_usd: totalAllocated,
      spent_usd: Number(totalSpent.toFixed(2)),
      remaining_usd: Number(totalRemaining.toFixed(2)),
      burn_per_day_usd: Number(burnPerDay.toFixed(4)),
      projected_runway_days: projectedRunwayDays === null ? null : (Number.isFinite(projectedRunwayDays) ? Math.floor(projectedRunwayDays) : null),
      receipt_count: periodSpends.length,
    },
    per_agent: perAgent,
    per_merchant: perMerchant,
    kill_switch: treasury.kill_switch,
    references: {
      human: 'https://pointcast.xyz/treasury',
      money: 'https://pointcast.xyz/money',
      money_json: 'https://pointcast.xyz/money.json',
      issue: 'https://github.com/mhoydich/pointcast/issues/262',
    },
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60, s-maxage=300',
    },
  });
};
