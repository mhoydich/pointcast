// Pure parts of the Morning Edition (/morning, /morning.json): which edition a
// moment belongs to, its number, the seven slots, the reporters line, the
// freeze rule and the JSON Feed. Kept in a plain module so tests run it under
// node without the Pages runtime; functions/_lib/morning-sources.ts gathers
// the inputs and functions/morning.json.ts serves and freezes the result.
//
// The rules, from the PRD (docs/plans/2026-09-28-field-reports-prd.md,
// "Morning Edition") and the build spec §9:
//   - One edition per LA day, dated by the 6:45 AM cutoff: before 6:45 the
//     current edition is yesterday's. Intl handles DST (ends 2026-11-01).
//   - Seven fixed slots, always seven, never empty. Every slot's chain ends in
//     a template, and a slot records `fallback: true` when it used one.
//   - Report numbers fill templates. A report reaches a line only as a bucket
//     value from the spots config (src/data/air-spots.json), never as text; a
//     value the config does not know drops the report. Free text (a Shortwave
//     post) appears only quoted and attributed inside the town slot, and never
//     in the title or masthead: those are built from the date alone.
//   - KLAX (the sky) or the report store missing makes the edition
//     provisional. A provisional edition is served, retried, never frozen.
//     KLAX's final word that it filed nothing before 6:45 is not missing: it
//     prints as a template and freezes, since no later read could fill it.
//   - Slot 7 never carries a THC item and never a link: "No link, no commission."
//
// Inputs to composeEdition (every key optional; see the slot builders below):
//   sources.sky     { marine, beach }   marine: answerMarine() (or previewMarine()) output, null when KLAX failed;
//                                        only its last report at or before 6:45 AM is printed (marineLine)
//                                        (+ optional `call`, a "10:40 AM" burn-off call); beach: a Moment
//   sources.courts  { yesterday, lastWeek }   Moments or null; a missing `courts` means the store failed
//   sources.price   pickPrice() output
//   sources.town    pickTown() output
//   sources.pick    { blockId, title }  (the `today` entry of /today.json fits)
//   sources.shop    pickShop() output
// A Moment is momentOf() output: { value, at, support, bylines, reportIds }.
// Moments carry public bylines and report ids only, never pid_hash or ip_hash.

import { labelOf } from './air-kinds.mjs';
import { evidence, isoSec, laClock, laDate, laParts, reading } from './air-reading.mjs';

export const FIRST_EDITION = '2026-10-03';
/** 6:45 AM, El Segundo wall time. */
export const CUTOFF_MINUTE = 6 * 60 + 45;
export const FEED_SIZE = 7;
export const SITE = 'https://pointcast.xyz';
/** caches.default lifetimes, seconds. */
export const EDITION_TTL = Object.freeze({ frozen: 300, provisional: 60 });
export const PRICE_WINDOW_DAYS = 14;
export const SHOP_AHEAD_DAYS = 30;
export const NEWS_MAX_AGE_DAYS = 7;
export const FOOTER_LINE = 'Reporters earn points, never cash, and never for what a report says.';
export const SHOP_DISCLOSURE = 'No link, no commission.';
export const FEED_TITLE = 'PointCast Morning Edition';
/** Mirrors NET in src/lib/band.ts (step 168 = 7.200 MHz); tests keep them equal. */
export const NIGHTLY_NET = Object.freeze({ startMinute: 21 * 60, minutes: 20, mhz: '7.200' });
/** The seven slots, in print order. Sky and Courts take their frequency from the spots config when it has them. */
export const SLOTS = Object.freeze([
  { id: 'sky', label: 'Sky · 6.100', spot: 'beach' },
  { id: 'courts', label: 'Courts · 7.500', spot: 'courts' },
  { id: 'price', label: 'A price' },
  { id: 'town', label: 'Today in town' },
  { id: 'ritual', label: 'Daily ritual' },
  { id: 'pick', label: 'One pick' },
  { id: 'shop', label: 'Shop' },
].map((s) => Object.freeze(s)));

const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** Report bylines as the server writes them: "@handle" (a town card) or "Guest 4471". Anything else is dropped. */
const BYLINE_RE = /^(?:@[a-z0-9][a-z0-9_.-]{0,31}|Guest \d{4})$/i;
const HANDLE_RE = /^[a-z0-9][a-z0-9_.-]{0,31}$/i;
const CLOCK_RE = /^(1[0-2]|[1-9]):[0-5]\d ?(AM|PM)$/i;
const BLOCK_RE = /^\d{3,5}$/;
const CONTROL = /[\x00-\x1F\x7F]/g;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const own = (o, k) => isObj(o) && Object.prototype.hasOwnProperty.call(o, k);
const toMs = (v) => {
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  if (typeof v === 'string' && v) return Date.parse(v);
  return NaN;
};
const uniq = (xs) => [...new Set(xs)];

/** Plain one-line text: control characters out, whitespace collapsed, capped with an ellipsis. */
function plain(v, max) {
  const s = (typeof v === 'string' ? v : '').replace(CONTROL, ' ').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  const chars = Array.from(s);
  return chars.length > max ? `${chars.slice(0, max - 1).join('').trimEnd()}…` : s;
}

/* ---------- dates ---------- */

/** A real calendar day written YYYY-MM-DD. */
export function isEditionDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, 12));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** '2026-10-31' + 1 → '2026-11-01'. Calendar days, so DST never shifts it. */
export function addDays(date, n) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
}

/** Whole calendar days from a to b (b − a). */
export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DAY_MS);
}

/**
 * Epoch ms of an El Segundo wall time: `date` at `minute` past midnight. LA is
 * UTC−7 (PDT) or UTC−8 (PST); NaN for a bad date or a time the clocks skip.
 */
export function laTimeMs(date, minute) {
  if (!isEditionDate(date) || !Number.isInteger(minute) || minute < 0 || minute >= 1440) return NaN;
  const [y, m, d] = date.split('-').map(Number);
  for (const offsetH of [7, 8]) {
    const t = Date.UTC(y, m - 1, d, 0, minute + offsetH * 60);
    const p = laParts(t);
    if (p.day === date && p.minuteOfDay === minute) return t;
  }
  return NaN;
}

/**
 * Epoch ms of 6:45 AM in El Segundo on `date`: 13:45Z under PDT, 14:45Z under
 * PST. The clocks change at 2 AM, so 6:45 is never ambiguous; NaN for a bad date.
 */
export function cutoffMs(date) {
  return laTimeMs(date, CUTOFF_MINUTE);
}

/**
 * The edition current at `now` (epoch ms or Date): the LA date from 6:45 AM
 * on, the day before until then. 06:44 on Nov 1 (PST) is still Oct 31's.
 */
export function editionDate(now = Date.now()) {
  const { day, minuteOfDay } = laParts(toMs(now));
  return minuteOfDay >= CUTOFF_MINUTE ? day : addDays(day, -1);
}

/** No. 1 is Sat 3 Oct 2026; days since then, plus one. Earlier (or unreadable) dates are 0: a preview. */
export function editionNumber(date) {
  if (!isEditionDate(date)) return 0;
  const n = daysBetween(FIRST_EDITION, date) + 1;
  return n >= 1 ? n : 0;
}

/** "Sat 3 Oct 2026". */
export function editionDayLabel(date) {
  const [y, m, d] = date.split('-').map(Number);
  return `${DOW[new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()]} ${d} ${MON[m - 1]} ${y}`;
}

/** "Morning Edition No. 1 · Sat 3 Oct 2026", or "Morning Edition Preview · …" before No. 1. Built from the date alone. */
export function editionTitle(date) {
  const n = editionNumber(date);
  return `Morning Edition ${n ? `No. ${n}` : 'Preview'} · ${editionDayLabel(date)}`;
}

/** "MORNING EDITION · No. 1 · SAT 3 OCT 2026 · 6:45 AM". */
export function editionMasthead(date) {
  const n = editionNumber(date);
  return `MORNING EDITION · ${n ? `No. ${n}` : 'PREVIEW'} · ${editionDayLabel(date).toUpperCase()} · 6:45 AM`;
}

/**
 * `?d=` for /morning.json: absent is the current edition; otherwise a real
 * date from FIRST_EDITION to the current edition, inclusive → {date} | {reason: 'bad-date'}.
 */
export function parseEditionParam(d, now = Date.now()) {
  const current = editionDate(now);
  if (d == null || d === '') return { date: current };
  if (!isEditionDate(d) || d < FIRST_EDITION || d > current) return { reason: 'bad-date' };
  return { date: d };
}

/** The feed's dates, newest first: the current edition (a preview before No. 1) and up to n − 1 earlier numbered ones. */
export function feedDates(now = Date.now(), n = FEED_SIZE) {
  const current = editionDate(now);
  const out = [current];
  for (let i = 1; i < n; i++) {
    const d = addDays(current, -i);
    if (d < FIRST_EDITION) break;
    out.push(d);
  }
  return out;
}

/* ---------- reports → moments ---------- */

/**
 * Pure: the reading at the last on-site moment of an LA `day` (optionally at
 * or before `until`, e.g. the cutoff), from D1 rows as air-reading.mjs takes
 * them. Same rule as the spot page's "yesterday" line (lastOfDay in
 * air-store.ts), plus the ids of the reports behind the winning value, so the
 * edition can pay their bylines. A "still" confirm names its confirmer but
 * cites no report of theirs. → { spot, value, label, at, support, bylines, reportIds } | null
 */
export function momentOf({ spot, cfg, rows = [], confirms = [], day, until = Infinity }) {
  const dayOf = (r) => r.day ?? laDate(r.observed_at);
  const dayRows = rows.filter((r) => dayOf(r) === day && r.observed_at <= until);
  const ids = new Set(dayRows.map((r) => r.id));
  const dayConfirms = confirms.filter((c) => ids.has(c.report_id) && c.at <= until);
  const ev = evidence(dayRows, dayConfirms).filter((e) => laDate(e.t) === day);
  const last = ev.at(-1);
  if (!last) return null;
  const r = reading({ spot, cfg, rows: dayRows, confirms: dayConfirms, now: last.t });
  if (r.status === 'none' || r.value == null) return null;
  const latest = new Map();
  for (const e of ev) if (e.t <= last.t) latest.set(e.pid, e);
  const decay = cfg.decayMin * 60_000;
  const reportIds = uniq([...latest.values()]
    .filter((e) => e.value === r.value && last.t - e.t < decay && e.via === 'report')
    .sort((a, b) => a.t - b.t)
    .map((e) => e.reportId));
  return { spot, value: r.value, label: r.label, at: last.t, support: r.support, bylines: r.bylines, reportIds };
}

/* ---------- picking the non-report slots ---------- */

const THC_WORDS = /\b(?:thc|thca|thcv|delta[\s-]?[89]|hhc|cbd|cbn|hemp|cannabis|cannabinoids?|marijuana|weed|kush|indica|sativa|pre-?rolls?|edibles?|gumm(?:y|ies)|dispensar(?:y|ies)|dab|vapes?)\b|good\s*feels/i;

/**
 * Whether an item is THC (or cannabis-adjacent) and must never run in the
 * shop slot. Conservative on purpose: any THC word in its name, brand, model,
 * category, kind or tags, an explicit `thc: true`, or the Good Feels channel.
 */
export function isThcItem(item) {
  if (!isObj(item)) return false;
  if (item.thc === true || String(item.channel ?? '').toUpperCase() === 'GF') return true;
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const text = [item.id, item.name, item.short, item.brand, item.model, item.title, item.category, item.kind, item.type, ...tags]
    .filter((v) => typeof v === 'string').join(' ');
  return THC_WORDS.test(text);
}

const nameOf = (p) => plain(p.short || [p.brand, p.model].filter(Boolean).join(' ') || p.name || '', 60);
const priced = (p) => isObj(p) && typeof p.msrp === 'number' && Number.isFinite(p.msrp) && p.msrp > 0 && isEditionDate(p.date) && Boolean(nameOf(p)) && !isThcItem(p);
const PRECISION_RANK = { day: 0, week: 1, month: 2 };
const asPaddle = (p) => ({ id: p.id ?? null, name: nameOf(p), msrp: p.msrp, date: p.date, precision: p.precision ?? 'day', status: p.status ?? null });

/**
 * Pure: slot 3. The release (paddle calendar) nearest the edition date within
 * ±14 days that has an MSRP and a day or month date; ties go to the more
 * precise date, then the earlier one. Otherwise the newest register change
 * dated on or before the edition. Otherwise null (the slot's template).
 * → {kind: 'release', id, name, msrp, date, precision, status} | {kind: 'change', date, paddle, name, text} | null
 */
export function pickPrice({ releases = [], changes = [], paddles = [], date }) {
  const near = releases
    .filter((r) => priced(r) && own(PRECISION_RANK, r.precision ?? 'day') && Math.abs(daysBetween(date, r.date)) <= PRICE_WINDOW_DAYS)
    .sort((a, b) => Math.abs(daysBetween(date, a.date)) - Math.abs(daysBetween(date, b.date))
      || PRECISION_RANK[a.precision ?? 'day'] - PRECISION_RANK[b.precision ?? 'day']
      || a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id)))[0];
  if (near) return { kind: 'release', ...asPaddle(near) };
  const change = changes.filter((c) => isObj(c) && isEditionDate(c.date) && c.date <= date && plain(c.text, 200))
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!change) return null;
  const named = [...releases, ...paddles].find((p) => isObj(p) && p.id === change.paddle);
  return { kind: 'change', date: change.date, paddle: change.paddle ?? null, name: named ? nameOf(named) : '', text: plain(change.text, 200) };
}

/**
 * Pure: slot 7. A register paddle with an MSRP, never a THC item, never the
 * price slot's paddle (`exclude` ids): the nearest one due in the next 30
 * days, else one rotated by the date so the shelf turns daily. → paddle | null
 */
export function pickShop({ paddles = [], date, exclude = [] }) {
  const pool = paddles.filter((p) => priced(p) && !exclude.includes(p.id));
  if (!pool.length) return null;
  const ahead = pool.filter((p) => { const d = daysBetween(date, p.date); return d > 0 && d <= SHOP_AHEAD_DAYS; })
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id)))[0];
  if (ahead) return asPaddle(ahead);
  const sorted = [...pool].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const turn = ((daysBetween('1970-01-01', date) % sorted.length) + sorted.length) % sorted.length;
  return asPaddle(sorted[turn]);
}

/**
 * Pure: slot 4. A front-door news item 7 days old or less (newest first);
 * else the newest card-verified Shortwave post before the cutoff that is not
 * a station post and not by an owner handle; else the almanac line; else null.
 * Posts are untrusted text: only card posts (with a handle) qualify.
 * → {kind: 'news', label, line, link, date} | {kind: 'shortwave', text, handle, at} | {kind: 'almanac', line} | null
 */
export function pickTown({ news = [], posts = [], almanac = null, date, ownerHandles = [] }) {
  const item = news.filter((n) => isObj(n) && isEditionDate(n.date) && plain(n.line, 220)
    && daysBetween(n.date, date) >= 0 && daysBetween(n.date, date) <= NEWS_MAX_AGE_DAYS)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (item) return { kind: 'news', label: plain(item.label, 40), line: plain(item.line, 220), link: typeof item.link === 'string' && item.link.startsWith('/') ? item.link : null, date: item.date };
  const owners = new Set(ownerHandles.map((h) => String(h).replace(/^@/, '').toLowerCase()));
  const cutoff = cutoffMs(date);
  const post = posts.filter((p) => isObj(p) && p.via !== 'air' && p.attribution !== 'station'
    && typeof p.handle === 'string' && HANDLE_RE.test(p.handle) && !owners.has(p.handle.toLowerCase())
    && toMs(p.at) <= cutoff && cutoff - toMs(p.at) <= NEWS_MAX_AGE_DAYS * DAY_MS && plain(p.text, 280))
    .sort((a, b) => toMs(b.at) - toMs(a.at))[0];
  if (post) return { kind: 'shortwave', text: plain(post.text, 280), handle: post.handle.toLowerCase(), at: isoSec(toMs(post.at)) };
  const line = plain(typeof almanac === 'string' ? almanac : almanac?.line, 220);
  return line ? { kind: 'almanac', line } : null;
}

/* ---------- reporters ---------- */

/** Report bylines that are safe to print, in order, once each. */
export function cleanBylines(bylines) {
  return uniq((Array.isArray(bylines) ? bylines : []).filter((b) => typeof b === 'string' && BYLINE_RE.test(b)));
}

/** "@mike, Guest 4471, @sam +2" — the first `max` names and a count of the rest (plus `extra` not listed). */
export function nameList(bylines, max = 3, extra = 0) {
  const names = cleanBylines(bylines);
  const more = Math.max(0, names.length - max) + (Number.isInteger(extra) && extra > 0 ? extra : 0);
  return `${names.slice(0, max).join(', ')}${more ? ` +${more}` : ''}`;
}

/**
 * The reporters line under the masthead: "On the air yesterday: @mike, @sam,
 * Guest 4471 +2". Empty when nobody reported, so the page hides it.
 */
export function reportersLine(bylines, { lead = 'On the air yesterday', max = 3 } = {}) {
  return cleanBylines(bylines).length ? `${lead}: ${nameList(bylines, max)}` : '';
}

/* ---------- slot lines ---------- */

const clock = (ms) => laClock(ms, { ampm: true });
const money = (n) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);
const shortDate = (date) => { const [, m, d] = date.split('-').map(Number); return `${MON[m - 1]} ${d}`; };
const lowerFirst = (s) => (/^[A-Z][a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const sentence = (s) => (/[.!?…]$/.test(s) ? s : `${s}.`);
const mhzOf = (spot, fallback) => (typeof spot?.mhz === 'number' && Number.isFinite(spot.mhz) ? spot.mhz.toFixed(3) : fallback);

function spotCfg(config, id) {
  const spot = isObj(config) && Array.isArray(config.spots) ? config.spots.find((s) => s?.id === id) : null;
  if (!spot || !isObj(spot.kinds)) return null;
  const kind = Object.keys(spot.kinds)[0];
  return kind ? { spot, kind, cfg: spot.kinds[kind] } : null;
}

/** A bucket value the config knows: the value itself, or an exact label read back to its value. Anything else is null. */
function knownValue(cfg, m) {
  const values = cfg.options.map((o) => o.v);
  if (typeof m.value === 'string') return values.includes(m.value) ? m.value : null;
  if (typeof m.label === 'string') return values.find((v) => labelOf(cfg, v) === m.label || cfg.options.find((o) => o.v === v)?.label === m.label) ?? null;
  return null;
}

/**
 * When a Moment happened, as epoch ms: epoch ms, an ISO string, or the spot
 * page's "07:41" clock on `m.date` (else `day`), read as El Segundo time.
 */
function momentMs(m, day) {
  if (typeof m.at === 'string' && /^\d{1,2}:\d{2}$/.test(m.at)) {
    const [h, min] = m.at.split(':').map(Number);
    return h < 24 && min < 60 ? laTimeMs(isEditionDate(m.date) ? m.date : day, h * 60 + min) : NaN;
  }
  return toMs(m.at);
}

/**
 * A Moment reduced to what templates may print: the config's label for its
 * bucket, its time, how many agree, safe bylines and report ids. Unknown
 * buckets, unreadable times and non-positive support drop it (null). `day` is
 * the LA date a bare "07:41" clock belongs to.
 */
function cleanMoment(t, m, day) {
  if (!t || !isObj(m)) return null;
  const value = knownValue(t.cfg, m);
  const at = momentMs(m, day);
  const support = Number.isInteger(m.support) ? m.support : null;
  if (value == null || !Number.isFinite(at) || !support || support < 1) return null;
  const bylines = cleanBylines(m.bylines);
  const more = Number.isInteger(m.more) && m.more > 0 ? m.more : 0;
  const reportIds = uniq((Array.isArray(m.reportIds) ? m.reportIds : []).filter((id) => typeof id === 'string' && /^ar_[0-9a-f]{16,40}$/.test(id)));
  return { value, label: labelOf(t.cfg, value), at, support, bylines, more, reportIds };
}

/** "1–4 waiting, 5 agree" or "can't see the pier, 1 reporter". A single report is always labeled so. */
const tally = (m) => `${lowerFirst(m.label)}, ${m.support >= 2 ? `${m.support} agree` : '1 reporter'}`;
const signed = (m) => (m.bylines.length ? ` — ${nameList(m.bylines, 3, m.more)}` : '');

/** When a moment happened, relative to the edition: "This morning 6:31 AM", "Yesterday 7:41 AM", "Fri 25 Sep 7:38 AM". */
function whenOf(ms, date) {
  const day = laDate(ms);
  if (day === date) return `This morning ${clock(ms)}`;
  if (day === addDays(date, -1)) return `Yesterday ${clock(ms)}`;
  const label = editionDayLabel(day).replace(/ \d{4}$/, '');
  return `${label} ${clock(ms)}`;
}

/** KLAX's line for one hourly report. */
function klaxAt(under, at, ft, call) {
  if (!under) return `No marine layer at KLAX at ${clock(at)}; the sky is open.`;
  const deck = typeof ft === 'number' && Number.isFinite(ft) ? ` (${Math.round(ft)} ft)` : '';
  return `Under the marine layer at KLAX, ${clock(at)}${deck}.${call}`;
}

/** The sky line when KLAX's record for the morning is closed and nothing came in by 6:45 AM. */
export const KLAX_NO_REPORT = 'KLAX filed no report before 6:45 AM.';

/**
 * KLAX's part of the sky: the last hourly report at or before the edition's
 * 6:45 AM, never a later one, so the line is the same whenever the edition is
 * first read (at 6:46 AM, at 2 PM, or on a later day through ?d=).
 *   - answerMarine() output: the last of `observations` with minute ≤ 6:45.
 *     None there and a final verdict (the day is over, e.g. 'no-record'): the
 *     fixed KLAX_NO_REPORT line, a template that still freezes, since no later
 *     read can bring a report in. None and not final: null.
 *   - previewMarine() shape ({underTheLayerNow, observedAt}): only a report
 *     on the edition's morning at or before 6:45.
 * The day's verdict (when the sky opened) is never printed: it is decided
 * after 6:45, so it would make the line depend on when it was read.
 * → { line, fallback } | null (KLAX has not answered for this morning: provisional)
 */
function marineLine(marine, date) {
  if (!isObj(marine) || (marine.date != null && marine.date !== date)) return null;
  const call = typeof marine.call === 'string' && CLOCK_RE.test(marine.call.trim()) ? ` Burn-off call ${marine.call.trim().toUpperCase().replace(/(\d)(AM|PM)$/, '$1 $2')}.` : '';
  if (Array.isArray(marine.observations)) {
    const dawn = marine.observations
      .filter((o) => isObj(o) && Number.isInteger(o.minute) && o.minute <= CUTOFF_MINUTE && typeof o.underTheLayer === 'boolean' && Number.isFinite(laTimeMs(date, o.minute)))
      .sort((a, b) => a.minute - b.minute)
      .at(-1);
    if (dawn) return { line: klaxAt(dawn.underTheLayer, laTimeMs(date, dawn.minute), dawn.ceilingFt, call), fallback: false };
    return isObj(marine.verdict) && marine.verdict.final === true ? { line: KLAX_NO_REPORT, fallback: true } : null;
  }
  const at = toMs(marine.observedAt);
  if (typeof marine.underTheLayerNow !== 'boolean' || !Number.isFinite(at) || laDate(at) !== date || at > cutoffMs(date)) return null;
  return { line: klaxAt(marine.underTheLayerNow, at, marine.ceilingFt, call), fallback: false };
}

function skySlot(base, sources, config, date) {
  const t = spotCfg(config, 'beach');
  const sky = isObj(sources.sky) ? sources.sky : {};
  const klax = marineLine(sky.marine, date);
  const beach = cleanMoment(t, sky.beach, date);
  const parts = [];
  if (klax) parts.push(klax.line);
  if (beach) parts.push(`At ${t.spot.name} ${clock(beach.at)}: ${tally(beach)}${signed(beach)}.`);
  const line = parts.length ? parts.join(' ') : 'KLAX has not reported yet; the sky fills in with its next hourly report.';
  return {
    slot: { ...base, line, source: klax && beach ? 'klax-asos+air' : klax ? 'klax-asos' : beach ? 'air' : 'template', reportIds: beach?.reportIds ?? [], bylines: beach?.bylines ?? [], fallback: !klax || klax.fallback },
    missing: klax ? [] : ['klax'],
    moments: beach ? [beach] : [],
  };
}

function courtCallLine(t, date) {
  const cc = t?.spot?.courtCall;
  if (!isObj(cc) || !Number.isInteger(cc.weekday) || typeof cc.time !== 'string') return '';
  const [h, m] = cc.time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
  const at = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  const [y, mo, d] = date.split('-').map(Number);
  const wd = new Date(Date.UTC(y, mo - 1, d, 12)).getUTCDay();
  const mhz = mhzOf(t.spot, '7.500');
  if (wd === cc.weekday) return `Court Call today, ${at} on ${mhz}.`;
  if ((cc.weekday - wd + 7) % 7 === 1) return `Court Call tomorrow, ${at} on ${mhz}.`;
  return `Next Court Call ${DOW[cc.weekday]} ${at} on ${mhz}.`;
}

function courtsSlot(base, sources, config, date) {
  const t = spotCfg(config, 'courts');
  const unavailable = !isObj(sources.courts);
  const c = unavailable ? {} : sources.courts;
  const y = cleanMoment(t, c.yesterday, addDays(date, -1));
  const w = cleanMoment(t, c.lastWeek, addDays(date, -8));
  const call = courtCallLine(t, date);
  const week = w ? `${y ? 'A week before' : 'The week before'}, ${whenOf(w.at, date)}: ${tally(w)}.` : '';
  const line = y
    ? [`${whenOf(y.at, date)}: ${tally(y)}${signed(y)}.`, week, call].filter(Boolean).join(' ')
    : [unavailable ? 'The courts log is not in yet.' : 'No reports from the courts yesterday.', week, call || 'Be the first on the air at pointcast.xyz/court.'].filter(Boolean).join(' ');
  return {
    slot: { ...base, line, source: y ? 'air' : w ? 'air+template' : 'template', reportIds: y?.reportIds ?? [], bylines: y?.bylines ?? [], fallback: !y },
    missing: unavailable ? ['reports'] : [],
    moments: y ? [y] : [],
  };
}

function priceSlot(base, sources, date) {
  const p = isObj(sources.price) && !isThcItem(sources.price) ? sources.price : null;
  if (p && p.kind !== 'change' && priced(p)) {
    const ahead = p.date > date;
    const when = p.precision === 'month' ? `in ${MONTH[Number(p.date.slice(5, 7)) - 1]}` : shortDate(p.date);
    return { ...base, line: `${nameOf(p)} ${ahead ? 'ships' : 'shipped'} ${when} at ${money(p.msrp)} MSRP. From the register, no link.`, source: 'paddle-calendar', reportIds: [], bylines: [], fallback: false };
  }
  if (p && p.kind === 'change' && isEditionDate(p.date) && plain(p.text, 200)) {
    const who = plain(p.name, 60);
    return { ...base, line: sentence(`From the register, ${shortDate(p.date)}: ${who ? `${who}. ` : ''}${plain(p.text, 200)}`), source: 'paddle-register', reportIds: [], bylines: [], fallback: true };
  }
  return { ...base, line: 'Prices for every 2026 paddle are on the register at pointcast.xyz/paddles.', source: 'template', reportIds: [], bylines: [], fallback: true };
}

function townSlot(base, sources) {
  const t = isObj(sources.town) ? sources.town : null;
  if (t?.kind === 'news' && plain(t.line, 220)) {
    const label = plain(t.label, 40);
    return { ...base, line: sentence(`${label ? `${label}: ` : ''}${plain(t.line, 220)}`), source: 'front-door-news', reportIds: [], bylines: [], fallback: false };
  }
  if (t?.kind === 'shortwave' && Number.isFinite(toMs(t.at))) {
    // Untrusted text: links out, capped, quoted and attributed. Never a headline.
    const quote = plain(String(t.text ?? '').replace(/\b(?:https?:\/\/|www\.)\S+/gi, ''), 120).replace(/"/g, "'");
    const by = typeof t.handle === 'string' && HANDLE_RE.test(t.handle) ? `@${t.handle.toLowerCase()}` : 'a listener';
    if (quote) return { ...base, line: `On Shortwave at ${clock(toMs(t.at))}: "${quote}" — ${by}`, source: 'shortwave', reportIds: [], bylines: [], fallback: true };
  }
  if (t?.kind === 'almanac' && plain(t.line, 220)) {
    return { ...base, line: sentence(plain(t.line, 220)), source: 'almanac', reportIds: [], bylines: [], fallback: true };
  }
  return { ...base, line: "Sunrise, sunset and the moon for El Segundo are in the almanac at pointcast.xyz/almanac.", source: 'template', reportIds: [], bylines: [], fallback: true };
}

function ritualSlot(base) {
  const h = Math.floor(NIGHTLY_NET.startMinute / 60), m = NIGHTLY_NET.startMinute % 60;
  const at = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return { ...base, line: `The Nightly Net, ${at} on ${NIGHTLY_NET.mhz}: ${NIGHTLY_NET.minutes} minutes, and net control calls the fox.`, source: 'band-net', reportIds: [], bylines: [], fallback: false };
}

function pickSlot(base, sources) {
  const p = isObj(sources.pick) ? sources.pick : null;
  const id = typeof p?.blockId === 'string' && BLOCK_RE.test(p.blockId) ? p.blockId : null;
  const title = plain(p?.title, 90);
  if (id && title) return { ...base, line: sentence(`Block ${id}: ${title}`), source: 'today-json', reportIds: [], bylines: [], fallback: false };
  return { ...base, line: "Today's block from the archive, the same one for everyone, is at pointcast.xyz/today.", source: 'template', reportIds: [], bylines: [], fallback: true };
}

function shopSlot(base, sources, date) {
  const p = isObj(sources.shop) && !isThcItem(sources.shop) && priced(sources.shop) ? sources.shop : null;
  if (p) {
    const when = p.precision === 'month' ? `in ${MONTH[Number(p.date.slice(5, 7)) - 1]}` : shortDate(p.date);
    const line = p.date > date
      ? `Coming ${when}: ${nameOf(p)}, ${money(p.msrp)} MSRP. ${SHOP_DISCLOSURE}`
      : `From the register: ${nameOf(p)}, ${money(p.msrp)} MSRP. ${SHOP_DISCLOSURE}`;
    return { ...base, line, source: 'paddle-register', reportIds: [], bylines: [], fallback: false };
  }
  return { ...base, line: `The paddle register lists every 2026 paddle at its MSRP. ${SHOP_DISCLOSURE}`, source: 'template', reportIds: [], bylines: [], fallback: true };
}

/* ---------- the edition ---------- */

/**
 * Pure: the edition for `date` from its sources: exactly seven slots in
 * SLOTS order, each {id, label, line, source, reportIds, bylines, fallback},
 * every line non-empty. `config` is the spots config (AIR_CONFIG); without it
 * no report can reach a line. `provisional` is true when KLAX or the report
 * store is missing (`missing` says which): serve it, never freeze it.
 */
export function composeEdition({ date, sources = {}, config = null } = {}) {
  if (!isEditionDate(date)) throw new TypeError('composeEdition needs a YYYY-MM-DD date');
  const src = isObj(sources) ? sources : {};
  const labels = {
    sky: `Sky · ${mhzOf(spotCfg(config, 'beach')?.spot, '6.100')}`,
    courts: `Courts · ${mhzOf(spotCfg(config, 'courts')?.spot, '7.500')}`,
  };
  const base = (s) => ({ id: s.id, label: labels[s.id] ?? s.label });
  const sky = skySlot(base(SLOTS[0]), src, config, date);
  const courts = courtsSlot(base(SLOTS[1]), src, config, date);
  const slots = [
    sky.slot,
    courts.slot,
    priceSlot(base(SLOTS[2]), src, date),
    townSlot(base(SLOTS[3]), src),
    ritualSlot(base(SLOTS[4])),
    pickSlot(base(SLOTS[5]), src),
    shopSlot(base(SLOTS[6]), src, date),
  ];
  const missing = [...sky.missing, ...courts.missing];
  const bylines = cleanBylines(slots.flatMap((s) => s.bylines));
  const moments = [...sky.moments, ...courts.moments];
  const allYesterday = moments.length > 0 && moments.every((m) => laDate(m.at) === addDays(date, -1));
  const number = editionNumber(date);
  return {
    v: 1,
    date,
    number,
    preview: number === 0,
    title: editionTitle(date),
    masthead: editionMasthead(date),
    cutoff: isoSec(cutoffMs(date)),
    provisional: missing.length > 0,
    missing,
    reporters: bylines.slice(0, 3),
    more: Math.max(0, bylines.length - 3),
    reporterLine: reportersLine(bylines, { lead: allYesterday ? 'On the air yesterday' : 'On the air' }),
    slots,
    reportIds: uniq(slots.flatMap((s) => s.reportIds)),
    footer: FOOTER_LINE,
    disclosure: SHOP_DISCLOSURE,
    frozen: false,
  };
}

/**
 * The freeze rule. Only a numbered, non-provisional edition with seven
 * filled slots, at or after its own 6:45 AM cutoff, may freeze. A provisional
 * edition never freezes: it is served and composed again on the next read.
 */
export function canFreeze(edition, now = Date.now()) {
  if (!isObj(edition) || !isEditionDate(edition.date)) return false;
  if (edition.provisional !== false || (Array.isArray(edition.missing) && edition.missing.length > 0)) return false;
  if (editionNumber(edition.date) < 1 || edition.number !== editionNumber(edition.date)) return false;
  if (!Array.isArray(edition.slots) || edition.slots.length !== SLOTS.length) return false;
  if (!edition.slots.every((s, i) => s?.id === SLOTS[i].id && typeof s.line === 'string' && s.line.trim())) return false;
  const t = toMs(now);
  return Number.isFinite(t) && t >= cutoffMs(edition.date);
}

/** The frozen copy to store (with its frozenAt), or null when canFreeze says no. */
export function freezeEdition(edition, now = Date.now()) {
  if (!canFreeze(edition, now)) return null;
  return { ...edition, frozen: true, frozenAt: isoSec(toMs(now)) };
}

/** The seven slots as plain lines, "Label: line", for content_text and plain clients. */
export function editionText(edition) {
  return edition.slots.map((s) => `${s.label}: ${s.line}`).join('\n');
}

/**
 * JSON Feed 1.1 for /morning.json: newest first, one item per date (a frozen
 * copy wins over a composed one), `limit` items. Item ids are stable,
 * `morning:<date>`. A provisional edition is never reported as frozen.
 */
export function toJsonFeed(editions, { site = SITE, limit = FEED_SIZE } = {}) {
  const byDate = new Map();
  for (const e of Array.isArray(editions) ? editions : []) {
    if (!isObj(e) || !isEditionDate(e.date) || !Array.isArray(e.slots)) continue;
    const had = byDate.get(e.date);
    if (!had || (e.frozen === true && had.frozen !== true)) byDate.set(e.date, e);
  }
  const items = [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit).map((e) => {
    const frozen = e.frozen === true && e.provisional !== true;
    const frozenAt = frozen ? toMs(e.frozenAt) : NaN;
    return {
      id: `morning:${e.date}`,
      url: `${site}/morning?d=${e.date}`,
      title: editionTitle(e.date),
      content_text: editionText(e),
      date_published: isoSec(cutoffMs(e.date)),
      ...(Number.isFinite(frozenAt) ? { date_modified: isoSec(frozenAt) } : {}),
      _pointcast: {
        number: editionNumber(e.date),
        frozen,
        provisional: e.provisional === true,
        missing: Array.isArray(e.missing) ? e.missing : [],
        masthead: editionMasthead(e.date),
        reporters: Array.isArray(e.reporters) ? e.reporters : [],
        more: Number.isInteger(e.more) ? e.more : 0,
        reporterLine: typeof e.reporterLine === 'string' ? e.reporterLine : '',
        footer: FOOTER_LINE,
        disclosure: SHOP_DISCLOSURE,
        slots: e.slots,
      },
    };
  });
  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: FEED_TITLE,
    home_page_url: `${site}/morning`,
    feed_url: `${site}/morning.json`,
    description: 'One screen at 6:45 AM in El Segundo: seven fixed slots, with bylines from Field Reports.',
    language: 'en-US',
    authors: [{ name: 'PointCast', url: site }],
    items,
  };
}
