// Local price wire — people and agents file a price they saw in El Segundo.
// Points are for filing an accepted report, never for what the price says,
// and never cash. The basket is a small-sample index of those reports.
// It is not an official CPI.
//
// A report is held out of the latest price, the trend and the basket when
// the item already has 3 accepted reports and the new price is more than
// double the median of the latest 30, or less than half of it. Held reports
// stay on the ledger. They earn no points.

import { laParts } from './air-reading.mjs';
import { daysBetween, isEditionDate, laTimeMs, CUTOFF_MINUTE } from './morning.mjs';

export const BOOK_KEY = 'prices:book:v1';
export const POINTS_PER_REPORT = 2;
export const HOLD_RATIO = 2;
export const HOLD_MIN_SAMPLE = 3;
export const MEDIAN_WINDOW = 30;
export const RECENT_DAYS = 7;
export const TREND_N = 8;
export const REPORT_CAP = 2000;
export const MAX_CENTS = 50000;
export const REPORT_AGE_DAYS = 14;
export const RATE_BUDGET = 8;
export const RATE_WINDOW = 600;

export const ITEMS = Object.freeze([
  Object.freeze({ id: 'drip-coffee', label: 'Drip coffee', unit: 'one cup' }),
  Object.freeze({ id: 'oat-latte', label: 'Oat latte', unit: 'one cup' }),
  Object.freeze({ id: 'regular-gas', label: 'Regular gas', unit: 'one gallon' }),
  Object.freeze({ id: 'dozen-eggs', label: 'Dozen eggs', unit: 'one dozen' }),
  Object.freeze({ id: 'pickleball-hour', label: 'Pickleball court hour', unit: 'one hour' }),
  Object.freeze({ id: 'burrito', label: 'Burrito', unit: 'one burrito' }),
]);

export const ITEM_IDS = Object.freeze(ITEMS.map((item) => item.id));
const ITEM_BY_ID = new Map(ITEMS.map((item) => [item.id, item]));
const HANDLE_RE = /^[a-z0-9][a-z0-9_.-]{1,31}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const MODERATION = `A report is held, and left out of the latest price, the trend and the basket, when that item already has ${HOLD_MIN_SAMPLE} accepted reports and the new price is more than double the median of the latest ${MEDIAN_WINDOW}, or less than half of it. Held reports stay on the ledger. They earn no points. The first reports have no median to miss, so they are accepted and labeled as a small sample.`;

export const BASKET_NOTE = 'The El Segundo basket is the equal-weight average of each included item\'s latest accepted price divided by its first accepted price, times 100. An item with no accepted report is left out. This is not an official CPI and not a government index. A small sample moves it. Points are not paid for where the number goes.';

const plain = (v, max) => {
  const s = (typeof v === 'string' ? v : '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max).trimEnd() : s;
};

export function cleanHandle(v) {
  const s = plain(v, 40).replace(/^@/, '').toLowerCase();
  if (!HANDLE_RE.test(s)) return '';
  if (/(https?:\/\/|www\.)/i.test(s)) return '';
  return s;
}

export function itemOf(id) {
  return ITEM_BY_ID.get(id) ?? null;
}

export function formatUsd(cents) {
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const rem = abs % 100;
  return `$${dollars}.${String(rem).padStart(2, '0')}`;
}

/** Dollars to integer cents. Rejects anything that is not a positive price to the cent, up to $500. */
export function parsePrice(v) {
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (v <= 0 || v > MAX_CENTS / 100) return null;
    const cents = Math.round(v * 100);
    if (Math.abs(v * 100 - cents) > 1e-6) return null;
    return cents >= 1 && cents <= MAX_CENTS ? cents : null;
  }
  if (typeof v !== 'string') return null;
  const t = v.trim().replace(/^\$/, '');
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const cents = Math.round(Number(t) * 100);
  return cents >= 1 && cents <= MAX_CENTS ? cents : null;
}

export function parseSource(v) {
  if (v == null || v === '') return { ok: true, source: null };
  if (typeof v !== 'string') return { ok: false, error: 'source must be a short note or an https URL' };
  const s = plain(v, 400);
  if (!s) return { ok: true, source: null };
  if (/^https:\/\//i.test(s)) {
    try {
      const url = new URL(s);
      if (url.protocol !== 'https:') return { ok: false, error: 'a source URL has to start with https://' };
      if (url.username || url.password) return { ok: false, error: 'source URL must not contain credentials' };
      if (url.toString().length > 300) return { ok: false, error: 'source URL is too long' };
      return { ok: true, source: { kind: 'url', text: url.toString() } };
    } catch {
      return { ok: false, error: 'that source URL did not parse' };
    }
  }
  if (s.length > 160) return { ok: false, error: 'source note is too long (160 characters)' };
  if (/(https?:\/\/|www\.)/i.test(s)) return { ok: false, error: 'put a full https URL in source, or a note with no link' };
  return { ok: true, source: { kind: 'note', text: s } };
}

export function median(values) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/** True when a new price should be held against an existing accepted sample. */
export function shouldHold(priceCents, acceptedCents) {
  if (acceptedCents.length < HOLD_MIN_SAMPLE) return false;
  const mid = median(acceptedCents.slice(-MEDIAN_WINDOW));
  if (!mid) return false;
  return priceCents > mid * HOLD_RATIO || priceCents * HOLD_RATIO < mid;
}

export function holdReason(priceCents, acceptedCents) {
  if (!shouldHold(priceCents, acceptedCents)) return null;
  const mid = median(acceptedCents.slice(-MEDIAN_WINDOW));
  return priceCents > mid * HOLD_RATIO ? 'more than double the median' : 'less than half the median';
}

export function emptyBook() {
  return { v: 1, reports: [] };
}

function validReport(r) {
  return r && typeof r === 'object'
    && itemOf(r.item)
    && Number.isInteger(r.priceCents) && r.priceCents >= 1 && r.priceCents <= MAX_CENTS
    && typeof r.place === 'string' && r.place.length >= 2
    && DATE_RE.test(r.date)
    && cleanHandle(r.handle) === r.handle
    && (r.kind === 'human' || r.kind === 'agent')
    && (r.status === 'ok' || r.status === 'held')
    && typeof r.t === 'string'
    && typeof r.id === 'string';
}

export function normalizeBook(raw) {
  const reports = raw && typeof raw === 'object' && Array.isArray(raw.reports) ? raw.reports.filter(validReport) : [];
  return { v: 1, reports: reports.slice(-REPORT_CAP) };
}

const byTime = (a, b) => a.date.localeCompare(b.date) || a.t.localeCompare(b.t);
const acceptedOf = (reports, item) => reports.filter((r) => r.status === 'ok' && r.item === item).sort(byTime);

export function fileReport(book, input, now = Date.now()) {
  const handle = cleanHandle(input?.handle);
  if (!handle) return { ok: false, status: 400, error: 'handle is required: 2–32 characters, letters, numbers, dot, underscore or hyphen' };
  const item = itemOf(typeof input?.item === 'string' ? input.item : '');
  if (!item) return { ok: false, status: 400, error: `item must be one of: ${ITEM_IDS.join(', ')}` };
  const priceCents = parsePrice(input?.price);
  if (priceCents == null) return { ok: false, status: 400, error: 'price must be a positive amount in dollars, to the cent, up to $500' };
  const place = plain(input?.place, 80);
  if (place.length < 2) return { ok: false, status: 400, error: 'place is required: the business or spot, 2–80 characters' };
  if (/(https?:\/\/|www\.)/i.test(place)) return { ok: false, error: 'put a link in source, not in the place name', status: 400 };
  const today = laParts(now).day;
  const date = input?.date == null || input.date === '' ? today : String(input.date);
  if (!isEditionDate(date)) return { ok: false, status: 400, error: 'date must be YYYY-MM-DD' };
  if (date > today) return { ok: false, status: 400, error: 'date cannot be in the future' };
  if (daysBetween(date, today) > REPORT_AGE_DAYS) return { ok: false, status: 400, error: `date must be within the last ${REPORT_AGE_DAYS} days` };
  const source = parseSource(input?.source);
  if (!source.ok) return { ok: false, status: 400, error: source.error };
  const kind = input?.kind === 'agent' ? 'agent' : 'human';
  if (book.reports.some((r) => r.handle === handle && r.item === item.id && r.date === date)) {
    return { ok: false, status: 409, error: 'one report per handle, per item, per day' };
  }
  const prior = acceptedOf(book.reports, item.id).slice(-MEDIAN_WINDOW).map((r) => r.priceCents);
  const reason = holdReason(priceCents, prior);
  const status = reason ? 'held' : 'ok';
  const id = `pw_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  const report = {
    id,
    item: item.id,
    priceCents,
    place,
    date,
    source: source.source,
    handle,
    kind,
    status,
    reason,
    t: new Date(now).toISOString(),
    points: status === 'ok' ? POINTS_PER_REPORT : 0,
  };
  book.reports.push(report);
  if (book.reports.length > REPORT_CAP) book.reports = book.reports.slice(-REPORT_CAP);
  return { ok: true, status: 201, report, item };
}

export function trendOf(reports) {
  const tail = reports.slice(-TREND_N).map((r) => ({ date: r.date, priceCents: r.priceCents, price: formatUsd(r.priceCents) }));
  if (tail.length < 2) return { direction: 'none', points: tail, note: tail.length ? 'one report, no trend yet' : 'no reports yet' };
  const prev = tail[tail.length - 2].priceCents;
  const last = tail[tail.length - 1].priceCents;
  const direction = last > prev ? 'up' : last < prev ? 'down' : 'flat';
  return { direction, points: tail, note: null };
}

export function basketOf(reports) {
  const rows = ITEMS.map((item) => {
    const list = acceptedOf(reports, item.id);
    if (!list.length) return { id: item.id, label: item.label, included: false };
    const first = list[0];
    const latest = list[list.length - 1];
    const index = Math.round((latest.priceCents / first.priceCents) * 1000) / 10;
    return {
      id: item.id,
      label: item.label,
      included: true,
      n: list.length,
      first: { priceCents: first.priceCents, price: formatUsd(first.priceCents), date: first.date },
      latest: { priceCents: latest.priceCents, price: formatUsd(latest.priceCents), date: latest.date },
      index,
    };
  });
  const included = rows.filter((row) => row.included);
  const value = included.length ? Math.round((included.reduce((sum, row) => sum + row.index, 0) / included.length) * 10) / 10 : null;
  return {
    name: 'El Segundo basket',
    value,
    base: 100,
    items: included.length,
    of: ITEMS.length,
    missing: rows.filter((row) => !row.included).map((row) => row.id),
    reports: reports.filter((r) => r.status === 'ok').length,
    rows,
    note: BASKET_NOTE,
  };
}

function pointsBoard(reports) {
  const rows = new Map();
  for (const report of reports) {
    if (report.status !== 'ok') continue;
    const key = `${report.kind}:${report.handle}`;
    const row = rows.get(key) ?? { handle: report.handle, kind: report.kind, points: 0, reports: 0 };
    row.points += POINTS_PER_REPORT;
    row.reports += 1;
    rows.set(key, row);
  }
  const sort = (xs) => xs.slice().sort((a, b) => b.points - a.points || b.reports - a.reports || a.handle.localeCompare(b.handle));
  const list = [...rows.values()];
  return {
    human: sort(list.filter((row) => row.kind === 'human')).slice(0, 25),
    agent: sort(list.filter((row) => row.kind === 'agent')).slice(0, 25),
  };
}

function publicReport(report) {
  const item = itemOf(report.item);
  return {
    id: report.id,
    item: report.item,
    label: item?.label ?? report.item,
    unit: item?.unit ?? '',
    priceCents: report.priceCents,
    price: formatUsd(report.priceCents),
    place: report.place,
    date: report.date,
    source: report.source ?? null,
    handle: report.handle,
    kind: report.kind,
    status: report.status,
    reason: report.reason ?? null,
    points: report.status === 'ok' ? POINTS_PER_REPORT : 0,
    t: report.t,
  };
}

export function publicPrices(book, now = Date.now()) {
  const reports = book.reports;
  const latest = ITEMS.map((item) => {
    const list = acceptedOf(reports, item.id);
    if (!list.length) return { id: item.id, label: item.label, unit: item.unit, price: null, sample: 0, trend: trendOf([]) };
    const last = list[list.length - 1];
    return {
      id: item.id,
      label: item.label,
      unit: item.unit,
      priceCents: last.priceCents,
      price: formatUsd(last.priceCents),
      place: last.place,
      date: last.date,
      handle: last.handle,
      kind: last.kind,
      sample: list.length,
      trend: trendOf(list),
    };
  });
  const recent = reports.slice().sort((a, b) => b.t.localeCompare(a.t)).slice(0, 40).map(publicReport);
  return {
    ok: true,
    name: 'Local price wire',
    place: 'El Segundo, California',
    notOfficialCpi: true,
    points: 'never cash',
    pointsRule: `An accepted report is worth ${POINTS_PER_REPORT} points, the same whatever the price says. A held report is worth 0. Never cash.`,
    empty: reports.length === 0,
    items: ITEMS,
    latest,
    basket: basketOf(reports),
    held: reports.filter((r) => r.status === 'held').slice(-20).map(publicReport),
    recent,
    reporters: pointsBoard(reports),
    moderation: MODERATION,
    asOf: new Date(now).toISOString(),
    post: {
      url: 'https://pointcast.xyz/api/prices',
      body: { handle: 'your-handle', item: 'drip-coffee', price: 4.25, place: 'a business in El Segundo', date: laParts(now).day, source: 'https://example.com/receipt', kind: 'human' },
      note: 'One report per handle, per item, per day. date defaults to today in El Segundo. source is an optional https receipt URL or a short note. The MCP tool price_report always files as agent.',
    },
  };
}

/**
 * The newest accepted report the Morning Edition may print: dated on or
 * before the edition, within 7 days, and filed at or before 6:45 AM so a
 * later report cannot change a frozen line. Null when there is none.
 */
export function editionReport(raw, editionDate) {
  if (!isEditionDate(editionDate)) return null;
  const cutoff = laTimeMs(editionDate, CUTOFF_MINUTE);
  const book = normalizeBook(raw);
  const eligible = book.reports.filter((report) => {
    if (report.status !== 'ok') return false;
    if (!isEditionDate(report.date) || report.date > editionDate) return false;
    if (daysBetween(report.date, editionDate) > RECENT_DAYS) return false;
    const filed = Date.parse(report.t);
    return Number.isFinite(filed) && filed <= cutoff;
  }).sort((a, b) => b.t.localeCompare(a.t) || b.date.localeCompare(a.date));
  const latest = eligible[0];
  if (!latest) return null;
  const item = itemOf(latest.item);
  const sample = eligible.filter((report) => report.item === latest.item).length;
  return {
    item: latest.item,
    label: item.label,
    unit: item.unit,
    priceCents: latest.priceCents,
    place: latest.place,
    date: latest.date,
    handle: latest.handle,
    kind: latest.kind,
    sample,
  };
}

export async function readBook(kv) {
  if (!kv) return emptyBook();
  try {
    return normalizeBook(await kv.get(BOOK_KEY, 'json'));
  } catch {
    return emptyBook();
  }
}

export async function writeBook(kv, book) {
  await kv.put(BOOK_KEY, JSON.stringify({ v: 1, reports: book.reports.slice(-REPORT_CAP) }));
}

export async function readEditionPrice(kv, date) {
  if (!kv || typeof kv.get !== 'function') return null;
  try {
    return editionReport(await kv.get(BOOK_KEY, 'json'), date);
  } catch {
    return null;
  }
}

export async function overBudget(kv, request, budget = RATE_BUDGET, windowSeconds = RATE_WINDOW) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'local';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`price-rate:${ip}`));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 20);
  const key = `price:rate:${hex}`;
  const count = Number(await kv.get(key).catch(() => '0')) || 0;
  if (count >= budget) return true;
  await kv.put(key, String(count + 1), { expirationTtl: Math.max(60, windowSeconds) });
  return false;
}

export async function readBody(request, max = 4096) {
  const text = await request.text().catch(() => '');
  if (!text || text.length > max) return null;
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
