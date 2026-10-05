// Sky Calls — one call per handle on whether a marine layer will sit over
// KLAX on a given morning. Points only, never cash.
//
// The question uses the marine-layer rule in src/lib/burnoff.ts, the same
// one /marine-layer and the Marine Layer Oracle already judge with:
//   opened or never  → there was a layer (a broken, overcast, or indefinite
//                      ceiling below 3,000 ft around sunrise)
//   no-layer         → there was not
//   no-record        → the station did not report enough; the morning is void
//
// Calls for a morning close at 9:00 PM Pacific the night before. Settlement
// is applied at read time from a verdict the caller supplies (the API asks
// the Marine Layer Oracle, which runs that same rule). Nothing here is a
// cron, and nothing is cash.

import { laParts } from './air-reading.mjs';
import { addDays, laTimeMs } from './morning.mjs';
import { BURN_OFF_DEFINITION, DECK_CEILING_FT, DECK_COVERS, HOLD_MINUTES } from '../../src/lib/burnoff-definition.ts';

export const BOOK_KEY = 'sky:book:v1';
export const CUTOFF_MINUTE = 21 * 60;
export const POINTS_PER_CORRECT = 1;
export const DAY_CAP = 400;
export const DAY_KEEP = 120;
export const CALLS = Object.freeze(['layer', 'clear']);
export const RATE_BUDGET = 8;
export const RATE_WINDOW = 600;

const HANDLE_RE = /^[a-z0-9][a-z0-9_.-]{1,31}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATES = new Set(['opened', 'never', 'no-layer', 'no-record']);

export const SKY_DEFINITION = Object.freeze({
  question: 'Will there be a marine layer at KLAX on this morning?',
  layer: 'A layer means the burn-off rule finds a broken, overcast, or indefinite ceiling below 3,000 feet around sunrise. The morning then either opens (opened) or stays grey past 2 PM (never). Both count as a layer. Few and scattered do not count.',
  clear: 'Clear means the rule finds no such deck around sunrise (no-layer). That is a different kind of morning, not a fast burn-off.',
  void: 'If KLAX does not report enough of the morning (no-record), the day is void. Nobody scores.',
  cutoff: 'Calls close at 9:00 PM Pacific the night before the morning.',
  points: 'One point for a correct call. A miss is zero. A void is zero. Points are a score, never cash.',
  oneEach: 'One call per handle per morning.',
  rule: BURN_OFF_DEFINITION,
  deckCeilingFt: DECK_CEILING_FT,
  deckCovers: DECK_COVERS,
  holdMinutes: HOLD_MINUTES,
  source: 'src/lib/burnoff-definition.ts',
});

const plain = (v) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim() : '');

export function cleanHandle(v) {
  const s = plain(v).replace(/^@/, '').toLowerCase();
  if (!HANDLE_RE.test(s)) return '';
  if (/(https?:\/\/|www\.)/i.test(s)) return '';
  return s;
}

export function emptyBook() {
  return { v: 1, days: {} };
}

function validCall(c) {
  return c && typeof c === 'object'
    && cleanHandle(c.handle) === c.handle
    && (c.call === 'layer' || c.call === 'clear')
    && (c.kind === 'human' || c.kind === 'agent')
    && typeof c.t === 'string';
}

function validVerdict(v) {
  if (!v || v.final !== true || !STATES.has(v.state)) return null;
  const layer = v.state === 'opened' || v.state === 'never' ? true : v.state === 'no-layer' ? false : null;
  return {
    state: v.state,
    layer,
    final: true,
    settledAt: typeof v.settledAt === 'string' ? v.settledAt : '',
    sentence: plain(v.sentence).slice(0, 240),
  };
}

export function normalizeBook(raw) {
  const book = emptyBook();
  const days = raw && typeof raw === 'object' && raw.days && typeof raw.days === 'object' ? raw.days : {};
  for (const [date, day] of Object.entries(days)) {
    if (!DATE_RE.test(date) || !day || typeof day !== 'object') continue;
    const calls = (Array.isArray(day.calls) ? day.calls : []).filter(validCall).slice(0, DAY_CAP);
    const verdict = validVerdict(day.verdict);
    if (!calls.length && !verdict) continue;
    book.days[date] = { calls, verdict };
  }
  return book;
}

/** The morning currently open for calls, and when it closes. */
export function openMorning(now = Date.now()) {
  const { day, minuteOfDay } = laParts(now);
  const date = minuteOfDay < CUTOFF_MINUTE ? addDays(day, 1) : addDays(day, 2);
  const closesAt = new Date(laTimeMs(addDays(date, -1), CUTOFF_MINUTE)).toISOString();
  return { date, closesAt, cutoff: '9:00 PM PT' };
}

export function layerFromState(state) {
  if (state === 'opened' || state === 'never') return true;
  if (state === 'no-layer') return false;
  return null;
}

/** correct / miss / void, scored off the stored verdict. Pending calls score nothing. */
export function resultOf(call, verdict) {
  if (!verdict?.final) return { result: null, points: 0 };
  if (verdict.layer == null) return { result: 'void', points: 0 };
  const correct = (call.call === 'layer') === verdict.layer;
  return { result: correct ? 'correct' : 'miss', points: correct ? POINTS_PER_CORRECT : 0 };
}

/**
 * Write a final verdict onto a day. Returns true when the book changed.
 * `verdict` is the oracle shape: { state, final, sentence? }.
 */
export function applyVerdict(day, verdict, now = Date.now()) {
  if (!day || !verdict || verdict.final !== true || !STATES.has(verdict.state)) return false;
  if (day.verdict?.final && day.verdict.state === verdict.state) return false;
  day.verdict = {
    state: verdict.state,
    layer: layerFromState(verdict.state),
    final: true,
    settledAt: new Date(now).toISOString(),
    sentence: plain(verdict.sentence).slice(0, 240),
  };
  return true;
}

/** Settle up to 14 past mornings that still have calls and no final verdict. */
export async function settleOutstanding(book, now, loadVerdict) {
  const today = laParts(now).day;
  const pending = Object.keys(book.days)
    .filter((date) => date <= today && book.days[date].calls?.length && !book.days[date].verdict?.final)
    .sort()
    .slice(-14);
  let changed = false;
  for (const date of pending) {
    let verdict = null;
    try {
      verdict = await loadVerdict(date);
    } catch {
      verdict = null;
    }
    if (applyVerdict(book.days[date], verdict, now)) changed = true;
  }
  return changed;
}

function prune(book) {
  const dates = Object.keys(book.days).sort();
  for (const date of dates.slice(0, Math.max(0, dates.length - DAY_KEEP))) delete book.days[date];
  return book;
}

/**
 * Place the one call for the open morning. Mutates `book` on success.
 * `input.date` may name that morning; any other date is refused.
 */
export function placeCall(book, input, now = Date.now()) {
  const handle = cleanHandle(input?.handle);
  if (!handle) return { ok: false, status: 400, error: 'handle is required: 2–32 characters, letters, numbers, dot, underscore or hyphen' };
  const call = input?.call === 'layer' || input?.call === 'clear' ? input.call : '';
  if (!call) return { ok: false, status: 400, error: 'call must be "layer" or "clear"' };
  const kind = input?.kind === 'agent' ? 'agent' : 'human';
  const open = openMorning(now);
  if (typeof input?.date === 'string' && input.date && input.date !== open.date) {
    return { ok: false, status: 409, error: `that morning is not open. The open morning is ${open.date}; calls close at 9:00 PM Pacific the night before.`, open };
  }
  const day = book.days[open.date] ?? { calls: [], verdict: null };
  if (day.calls.some((c) => c.handle === handle)) {
    return { ok: false, status: 409, error: 'one call per handle for that morning', date: open.date, open };
  }
  if (day.calls.length >= DAY_CAP) return { ok: false, status: 429, error: 'that morning already has all the calls it will take', open };
  const entry = { handle, kind, call, t: new Date(now).toISOString() };
  day.calls.push(entry);
  book.days[open.date] = day;
  prune(book);
  return { ok: true, status: 201, date: open.date, entry, open };
}

function sideOf(calls) {
  const correct = calls.filter((c) => c.result === 'correct').length;
  const miss = calls.filter((c) => c.result === 'miss').length;
  const judged = correct + miss;
  return {
    calls: calls.length,
    correct,
    miss,
    void: calls.filter((c) => c.result === 'void').length,
    pending: calls.filter((c) => c.result == null).length,
    points: correct * POINTS_PER_CORRECT,
    accuracy: judged ? Math.round((correct / judged) * 1000) / 10 : null,
  };
}

function boardsOf(book) {
  const rows = new Map();
  for (const day of Object.values(book.days)) {
    for (const call of day.calls) {
      const scored = resultOf(call, day.verdict);
      const key = `${call.kind}:${call.handle}`;
      const row = rows.get(key) ?? { handle: call.handle, kind: call.kind, points: 0, correct: 0, miss: 0, void: 0, pending: 0 };
      if (scored.result === 'correct') { row.correct += 1; row.points += scored.points; }
      else if (scored.result === 'miss') row.miss += 1;
      else if (scored.result === 'void') row.void += 1;
      else row.pending += 1;
      rows.set(key, row);
    }
  }
  const list = [...rows.values()].map((row) => {
    const judged = row.correct + row.miss;
    return { ...row, judged, accuracy: judged ? Math.round((row.correct / judged) * 1000) / 10 : null };
  });
  const sort = (xs) => xs.slice().sort((a, b) => b.points - a.points || b.correct - a.correct || a.miss - b.miss || a.handle.localeCompare(b.handle));
  return {
    human: sort(list.filter((row) => row.kind === 'human')).slice(0, 25),
    agent: sort(list.filter((row) => row.kind === 'agent')).slice(0, 25),
  };
}

function allScored(book, kind) {
  const out = [];
  for (const day of Object.values(book.days)) {
    for (const call of day.calls) {
      if (kind && call.kind !== kind) continue;
      out.push({ ...call, ...resultOf(call, day.verdict) });
    }
  }
  return out;
}

export function publicSky(book, now = Date.now()) {
  const open = openMorning(now);
  const today = laParts(now).day;
  const dates = new Set([...Object.keys(book.days), open.date]);
  const days = [...dates].sort().reverse().slice(0, 21).map((date) => {
    const day = book.days[date] ?? { calls: [], verdict: null };
    const calls = day.calls.map((call) => ({ ...call, ...resultOf(call, day.verdict) }));
    return {
      date,
      open: date === open.date,
      past: date <= today,
      closesAt: new Date(laTimeMs(addDays(date, -1), CUTOFF_MINUTE)).toISOString(),
      counts: {
        layer: calls.filter((c) => c.call === 'layer').length,
        clear: calls.filter((c) => c.call === 'clear').length,
        human: calls.filter((c) => c.kind === 'human').length,
        agent: calls.filter((c) => c.kind === 'agent').length,
      },
      verdict: day.verdict,
      calls,
    };
  });
  const settled = days.filter((day) => day.verdict?.final).length;
  return {
    ok: true,
    name: 'Sky Calls',
    place: 'KLAX, for El Segundo',
    points: 'never cash',
    definition: SKY_DEFINITION,
    open,
    empty: Object.values(book.days).every((day) => !day.calls.length),
    settledMornings: settled,
    days,
    leaderboard: boardsOf(book),
    averages: { human: sideOf(allScored(book, 'human')), agent: sideOf(allScored(book, 'agent')) },
    post: {
      url: 'https://pointcast.xyz/api/sky-calls',
      body: { handle: 'your-handle', call: 'layer', kind: 'human' },
      calls: CALLS,
      note: 'One call per handle per morning. kind "agent" is for agents; the MCP tool sky_call always files as agent. call is "layer" or "clear".',
    },
  };
}

/**
 * What the Morning Edition may print. Yesterday's settled morning, and the
 * tally for this morning (calls closed at 9 PM, so the count is stable).
 * Null when there is nothing honest to add. Read-only.
 */
export function editionCalls(raw, editionDate) {
  if (typeof editionDate !== 'string' || !DATE_RE.test(editionDate)) return null;
  const book = normalizeBook(raw);
  const yDate = addDays(editionDate, -1);
  const y = book.days[yDate];
  const t = book.days[editionDate];
  const yesterday = y?.verdict?.final && y.calls.length
    ? {
      date: yDate,
      state: y.verdict.state,
      layer: y.verdict.layer,
      correct: y.calls.filter((call) => resultOf(call, y.verdict).result === 'correct').length,
      of: y.calls.length,
    }
    : null;
  const layer = t ? t.calls.filter((call) => call.call === 'layer').length : 0;
  const clear = t ? t.calls.filter((call) => call.call === 'clear').length : 0;
  const today = layer + clear > 0 ? { date: editionDate, layer, clear } : null;
  if (!yesterday && !today) return null;
  return { yesterday, today };
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
  await kv.put(BOOK_KEY, JSON.stringify(prune(book)));
}

export async function readEditionCalls(kv, date) {
  if (!kv || typeof kv.get !== 'function') return null;
  try {
    return editionCalls(await kv.get(BOOK_KEY, 'json'), date);
  } catch {
    return null;
  }
}

export async function overBudget(kv, request, budget = RATE_BUDGET, windowSeconds = RATE_WINDOW) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'local';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`sky-rate:${ip}`));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 20);
  const key = `sky:rate:${hex}`;
  const count = Number(await kv.get(key).catch(() => '0')) || 0;
  if (count >= budget) return true;
  await kv.put(key, String(count + 1), { expirationTtl: Math.max(60, windowSeconds) });
  return false;
}

export async function readBody(request, max = 2048) {
  const text = await request.text().catch(() => '');
  if (!text || text.length > max) return null;
  try {
    const value = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
