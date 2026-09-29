// The court lane — the register's release calendar, read as a shop shelf.
//
// This is a calendar view: paddles that are on sale soon, and paddles that
// shipped recently. It takes no input beyond the register rows and a date,
// and it does not know what a link earns.

import { paddleUrl, whenLabel, type Paddle } from './paddle-register';

export interface CourtRow {
  id: string;
  brand: string;
  model: string;
  build: Paddle['build'];
  status: string;
  date: string;
  when: string;
  listPriceUsd: number | null;
  listPriceLabel: string | null;
  url: string;
  /** The maker's own product page, as the register records it (null when it has none). */
  makerUrl: string | null;
}

export interface CourtLane {
  upcoming: CourtRow[];
  recent: CourtRow[];
}

const toRow = (p: Paddle): CourtRow => ({
  id: p.id,
  brand: p.brand,
  model: p.model,
  build: p.build,
  status: p.status,
  date: p.date,
  when: whenLabel(p),
  listPriceUsd: p.msrp,
  listPriceLabel: p.msrpLabel ?? null,
  url: paddleUrl(p),
  makerUrl: p.productUrl ?? null,
});

/**
 * `upcoming`: rows not yet on sale, oldest date first (what's coming next).
 * `recent`: rows on sale within `recentDays` of `asOf`, newest first, capped
 * at `recentCap`.
 */
export function courtLane(
  rows: Paddle[],
  asOf: string,
  opts: { recentDays?: number; recentCap?: number } = {},
): CourtLane {
  const recentDays = opts.recentDays ?? 120;
  const recentCap = opts.recentCap ?? 12;

  const cutoff = new Date(`${asOf}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - recentDays);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const upcoming = rows
    .filter((p) => p.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(toRow);

  const recent = rows
    .filter((p) => (p.status === 'released' || p.status === 'limited') && p.date >= cutoffIso && p.date <= asOf)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, recentCap)
    .map(toRow);

  return { upcoming, recent };
}
