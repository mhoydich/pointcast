// Pure parts of /api/paddles/fund — validation and tallies — kept in a plain
// module so tests run them under node without the Pages runtime.

export const TIERS = ['patron', 'club'];
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Parse a pledge or vote body, or return a reason. Never repairs. */
export function parseFundAction(body, candidates) {
  const kind = body?.kind;
  if (kind === 'pledge') {
    if (!TIERS.includes(body.tier)) return { reason: 'bad-tier' };
    return { kind, tier: body.tier };
  }
  if (kind === 'vote') {
    const court = typeof body.court === 'string' ? body.court : '';
    if (!SLUG_RE.test(court) || court.length > 64 || !candidates.includes(court)) return { reason: 'bad-court' };
    return { kind, court };
  }
  return { reason: 'bad-kind' };
}

/** Counts from the per-session record map: { pid: { pledge?: tier, vote?: court } }. */
export function tally(records, candidates) {
  const pledges = { patron: 0, club: 0 };
  const votes = Object.fromEntries(candidates.map((c) => [c, 0]));
  for (const r of Object.values(records)) {
    if (r?.pledge && pledges[r.pledge] != null) pledges[r.pledge] += 1;
    if (r?.vote && votes[r.vote] != null) votes[r.vote] += 1;
  }
  return { pledges, votes };
}

/** Ledger arithmetic: totals in, the split, payouts, the fund balance. Rejects payouts without a receipt. */
export function ledgerTotals(ledger) {
  const split = ledger.meta?.split ?? { house: 0.5, fund: 0.5 };
  let inUsd = 0, outUsd = 0;
  const payouts = [];
  for (const e of ledger.entries ?? []) {
    if (e.kind === 'in' && typeof e.usd === 'number' && e.usd > 0) inUsd += e.usd;
    if (e.kind === 'out' && typeof e.usd === 'number' && e.usd > 0 && typeof e.receipt === 'string' && /^https:\/\//.test(e.receipt)) { outUsd += e.usd; payouts.push(e); }
  }
  const round = (v) => Math.round(v * 100) / 100;
  const fundIn = round(inUsd * split.fund), houseIn = round(inUsd * split.house);
  return { inUsd: round(inUsd), houseIn, fundIn, outUsd: round(outUsd), fundBalance: round(fundIn - outUsd), payouts, passes: (ledger.entries ?? []).filter((e) => e.kind === 'in').length };
}
