// The Paddle Register — one permanent page per paddle line.
//
// The labs (John Kew, Pickleball Effect, Pickleball Studio, Matt's) measure
// paddles. The register keeps the other record: what exists, when it
// launched, where it is legal, what it is made of, what happened to it
// since, and where to read each lab's numbers. Every fact carries a source.
//
// Data: the 2026 calendar (src/data/paddle-calendar.json) plus
// src/data/paddle-register.json, which holds the per-paddle enrichment
// (variants, core layers, timeline, status, lab links) and the 2025 backfill.

import calendar from '../data/paddle-calendar.json';
import register from '../data/paddle-register.json';
import { BUILDS, type Build } from './paddle-calendar';

export const PADDLE_REGISTER_URL = 'https://pointcast.xyz/paddles';
export const PADDLE_BAG_URL = 'https://tez-rally.pages.dev/bag/';
export const PADDLE_REGISTER_BLOCK = '0598';

export interface Variant {
  name?: string; shape?: string | null; lengthIn?: number | string | null; widthIn?: number | string | null; handleIn?: number | string | null;
  thicknessMm?: number | null; weightOz?: string | null; sw?: number | string | null; tw?: number | string | null; specSource?: string | null;
}
export interface TimelineEvent { date: string; precision?: string; kind: string; text: string; source?: string | null }
export interface LabLink { lab: string; kind?: string; url: string }
export interface Status {
  usap: string; usapSource?: string | null; upaa: string; upaaSource?: string | null;
  quiet?: boolean; patent?: string; investigation?: string | null; lifecycle?: string;
}
export interface Paddle {
  id: string; brand: string; model: string; short: string; year: number;
  date: string; precision: string; dateLabel: string; status: string;
  msrp: number | null; msrpLabel?: string; build: Build; thickness: string; shapes: string;
  tech: string; specs: string; usap: string; upaa: string; certNote?: string; pro: string; take: string;
  sources: string[]; confidence: string;
  productUrl?: string | null; variants: Variant[]; core: { layers: string[]; face?: string; edge?: string; source?: string };
  timeline: TimelineEvent[]; reg: Status; labs: LabLink[]; colorways: string[]; madeIn?: string | null; warranty?: string | null; notes?: string | null;
}

type Raw = Record<string, any>;
const enrich = (register as Raw).enrich as Record<string, Raw>;
const backfill = ((register as Raw).backfill as Raw[]) ?? [];

export const slug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const clean = <T,>(list: T[] | undefined | null): T[] => (Array.isArray(list) ? list.filter(Boolean) : []);

function build(raw: Raw): Paddle {
  const own = enrich[raw.id];
  // backfill rows carry their own enrichment; their status object lives under statusInfo
  const e: Raw = own ?? { ...raw, status: raw.statusInfo };
  const lifecycleFallback = raw.status === 'upcoming' ? 'upcoming' : raw.status === 'limited' ? 'limited' : 'current';
  const reg: Status = {
    usap: e.status?.usap && e.status.usap !== 'unknown' ? e.status.usap : raw.usap ?? 'unknown',
    usapSource: e.status?.usapSource ?? null,
    upaa: e.status?.upaa && e.status.upaa !== 'unknown' ? e.status.upaa : raw.upaa ?? 'unknown',
    upaaSource: e.status?.upaaSource ?? null,
    quiet: Boolean(e.status?.quiet),
    patent: e.status?.patent ?? 'none-known',
    investigation: e.status?.investigation ?? null,
    lifecycle: e.status?.lifecycle ?? lifecycleFallback,
  };
  const launch: TimelineEvent = {
    date: raw.date, precision: raw.precision, kind: raw.status === 'upcoming' ? 'upcoming' : 'launch',
    text: raw.status === 'upcoming' ? `On sale ${raw.dateLabel}.` : `Launch: ${raw.dateLabel}.`, source: raw.sources?.[0] ?? null,
  };
  const events = clean<TimelineEvent>(e.timeline).filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.date) && t.text);
  const hasLaunch = events.some((t) => ['launch', 'ship', 'preorder'].includes(t.kind));
  const timeline = [...events, ...(hasLaunch ? [] : [launch])].sort((a, b) => a.date.localeCompare(b.date));
  return {
    ...(raw as Paddle),
    short: raw.short || `${raw.brand} ${raw.model}`,
    year: Number(raw.date.slice(0, 4)),
    pro: raw.pro ?? '', specs: raw.specs ?? '', thickness: raw.thickness ?? '', shapes: raw.shapes ?? '',
    productUrl: e.productUrl ?? null,
    variants: clean<Variant>(e.variants),
    core: { layers: clean<string>(e.core?.layers), face: e.core?.face ?? '', edge: e.core?.edge ?? '', source: e.core?.source ?? '' },
    timeline, reg,
    labs: clean<LabLink>(e.labs).filter((l) => /^https:\/\//.test(l.url)),
    colorways: clean<string>(e.colorways), madeIn: e.madeIn ?? null, warranty: e.warranty ?? null, notes: e.notes ?? null,
  };
}

export const PADDLES: Paddle[] = [...backfill, ...(calendar.releases as Raw[])]
  .map(build)
  .sort((a, b) => b.date.localeCompare(a.date));

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** A short launch label that only claims the precision the date has. */
export const whenLabel = (p: { date: string; precision: string }): string => {
  const y = p.date.slice(0, 4), m = Number(p.date.slice(5, 7)), d = Number(p.date.slice(8, 10));
  if (p.precision === 'day') return `${MON[m - 1]} ${d}, ${y}`;
  if (p.precision === 'month') return `${MON[m - 1]} ${y}`;
  return `Q${Math.ceil(m / 3)} ${y}`;
};

export const paddleById = (id: string) => PADDLES.find((p) => p.id === id);
export const paddleUrl = (p: { id: string }) => `/paddles/${p.id}`;
export const brandUrl = (brand: string) => `/paddles/brand/${slug(brand)}`;

/** The variant a page leads with: the first one that publishes its own outline. */
export const leadVariant = (p: Paddle): Variant | undefined =>
  p.variants.find((v) => typeof v.lengthIn === 'number' && typeof v.widthIn === 'number') ?? p.variants[0];

/** Distinct outlines worth drawing, one per shape, capped. */
export function plateVariants(p: Paddle, cap = 3): Variant[] {
  const seen = new Set<string>();
  const out: Variant[] = [];
  for (const v of p.variants) {
    const key = `${(v.shape || '').toLowerCase()}|${v.lengthIn}|${v.widthIn}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= cap) break;
  }
  return out.length ? out : [{ shape: p.shapes, thicknessMm: Number.parseFloat(p.thickness) || null }];
}

export const CERT_WORDS: Record<string, string> = {
  yes: 'Approved', no: 'Not on the list', pending: 'Pending', split: 'Some variants', unknown: 'Not confirmed here',
};
export const PATENT_WORDS: Record<string, string> = {
  'none-known': 'No patent action known',
  'own-patent': 'Brand holds core patents',
  'licensed-joola': "Licensed under JOOLA's patents",
  'named-joola-settled': "Brand settled JOOLA's patent case",
  'named-joola-holdout': "Brand is contesting JOOLA's patent case",
  'named-joola-default': "Brand has not answered JOOLA's patent case",
};
export const LIFECYCLE_WORDS: Record<string, string> = {
  current: 'Current', limited: 'Limited run', 'phasing-out': 'Phasing out', upcoming: 'Not out yet', discontinued: 'Discontinued',
};

export interface BrandFile {
  brand: string; slug: string; paddles: Paddle[];
  file?: { hq?: string; founded?: string; owner?: string; lines?: string; pros?: string; cadence?: string; story?: string };
}
const files = [...(calendar.companies as Raw[]), ...(((register as Raw).companies as Raw[]) ?? [])];
export const BRANDS: BrandFile[] = [...new Set(PADDLES.map((p) => p.brand))]
  .sort((a, b) => a.localeCompare(b))
  .map((brand) => ({ brand, slug: slug(brand), paddles: PADDLES.filter((p) => p.brand === brand), file: files.find((c) => c.brand === brand) }));

/** Same brand first, then nearest list price in the same build. */
export function neighbours(p: Paddle, n = 6): Paddle[] {
  const sameBrand = PADDLES.filter((q) => q.brand === p.brand && q.id !== p.id);
  const nearPrice = PADDLES.filter((q) => q.brand !== p.brand && q.msrp != null && p.msrp != null)
    .sort((a, b) => Math.abs((a.msrp as number) - (p.msrp as number)) - Math.abs((b.msrp as number) - (p.msrp as number)) || b.date.localeCompare(a.date));
  return [...sameBrand, ...nearPrice].slice(0, n);
}

export const REGISTER_STATS = {
  paddles: PADDLES.length,
  brands: BRANDS.length,
  years: [...new Set(PADDLES.map((p) => p.year))].sort(),
  withOutline: PADDLES.filter((p) => p.variants.some((v) => typeof v.lengthIn === 'number' && typeof v.widthIn === 'number')).length,
  labLinks: PADDLES.reduce((sum, p) => sum + p.labs.length, 0),
  events: PADDLES.reduce((sum, p) => sum + p.timeline.length, 0),
  asOf: calendar.meta.asOf,
};

export const publicPaddle = (p: Paddle) => ({
  id: p.id, url: `${PADDLE_REGISTER_URL}/${p.id}`, brand: p.brand, model: p.model, year: p.year,
  launch: { date: p.date, precision: p.precision, label: p.dateLabel }, lifecycle: p.reg.lifecycle,
  listPriceUsd: p.msrp, listPriceLabel: p.msrpLabel ?? null, build: p.build, buildLabel: BUILDS[p.build].label,
  thickness: p.thickness, shapes: p.shapes, pro: p.pro || null, summary: p.take, construction: p.tech,
  core: p.core, variants: p.variants, status: p.reg, certNote: p.certNote ?? null, timeline: p.timeline, labs: p.labs,
  colorways: p.colorways, madeIn: p.madeIn, warranty: p.warranty, notes: p.notes, productUrl: p.productUrl,
  sources: p.sources, confidence: p.confidence, image: `https://pointcast.xyz/images/og/paddles/${p.id}.png`,
});
