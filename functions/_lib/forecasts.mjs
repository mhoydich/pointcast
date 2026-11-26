// The 25-Mile Forecast Board — yes/no questions about El Segundo and the
// South Bay. People and agents tap a probability. When a question resolves
// from its public source, every final forecast gets a Brier score.
//
// Forecasts only. No money, no tokens, no points, no prizes. Nothing here can
// be bought, sold, traded or redeemed, and nobody wins anything. The only
// output is a public accuracy record.
//
// Questions live in src/data/forecasts.json and resolve by a reviewed edit to
// that file (outcome, date, the source that settled it). Forecasts live in
// KV (VISITS `forecast:book:v1`). Identity is a browser key: the first
// forecast under a handle binds that handle to a hash of the key, and only
// the same key can change that handle's forecasts.

export const BOOK_KEY = 'forecast:book:v1';
export const P_MIN = 1;
export const P_MAX = 99;
export const QUESTION_CAP = 500;
export const HANDLE_CAP = 5000;
export const RATE_BUDGET = 20;
export const RATE_WINDOW = 600;
export const COIN_FLIP_BRIER = 0.25;

const HANDLE_RE = /^[a-z0-9][a-z0-9_.-]{1,31}$/;
const ID_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;
const KEY_RE = /^[A-Za-z0-9_-]{16,128}$/;
const HASH_RE = /^[a-f0-9]{24}$/;

export const BOARD_RULES = Object.freeze({
  what: 'Yes/no questions about El Segundo and the South Bay, within about 25 miles. You tap how likely you think YES is, from 1% to 99%.',
  noMoney: 'Forecasts only. No money, no tokens, no points, no prizes. Nothing to buy, sell, trade or redeem, and nobody wins anything.',
  scoring: 'When a question resolves, each forecaster\'s last forecast before the close gets a Brier score: (p − outcome)², where outcome is 1 for YES and 0 for NO. Lower is better. 0 is perfect, 0.25 is what always saying 50% earns, 1 is confidently wrong.',
  board: 'The accuracy board is the average Brier score across resolved questions, people and agents listed apart.',
  identity: 'Your handle is held by a key that lives in this browser. Change your forecast as often as you like until the question closes. Agents send their own key with each POST.',
  resolution: 'Every question names its public source. A person checks that source after the resolve date and records the outcome, the date and the link in src/data/forecasts.json. If the source never settles it, the question is void and nobody is scored.',
  visibility: 'While a question is open the board shows only the crowd average, so early forecasts don\'t anchor later ones. Individual forecasts appear once it closes.',
});

const plain = (v) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim() : '');
const round = (n, d = 3) => (Number.isFinite(n) ? Math.round(n * 10 ** d) / 10 ** d : null);

export function cleanHandle(v) {
  const s = plain(v).replace(/^@/, '').toLowerCase();
  if (!HANDLE_RE.test(s)) return '';
  if (/(https?:\/\/|www\.)/i.test(s)) return '';
  return s;
}

export function cleanKey(v) {
  return typeof v === 'string' && KEY_RE.test(v) ? v : '';
}

export async function hashKey(key) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`forecast-key:${key}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

/** An integer percent from 1 to 99, or null. Accepts 0–1 fractions too. */
export function cleanP(v) {
  let n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  if (n > 0 && n < 1) n *= 100;
  n = Math.round(n);
  if (n < P_MIN || n > P_MAX) return null;
  return n;
}

export function emptyBook() {
  return { v: 1, handles: {}, forecasts: {} };
}

function validEntry(e) {
  return e && typeof e === 'object'
    && cleanHandle(e.handle) === e.handle
    && (e.kind === 'human' || e.kind === 'agent')
    && cleanP(e.p) === e.p
    && typeof e.t === 'string'
    && Number.isFinite(Date.parse(e.t));
}

export function normalizeBook(raw) {
  const book = emptyBook();
  if (!raw || typeof raw !== 'object') return book;
  const handles = raw.handles && typeof raw.handles === 'object' ? raw.handles : {};
  for (const [handle, hash] of Object.entries(handles)) {
    if (cleanHandle(handle) === handle && typeof hash === 'string' && HASH_RE.test(hash)) book.handles[handle] = hash;
  }
  const forecasts = raw.forecasts && typeof raw.forecasts === 'object' ? raw.forecasts : {};
  for (const [id, list] of Object.entries(forecasts)) {
    if (!ID_RE.test(id) || !Array.isArray(list)) continue;
    const seen = new Set();
    const kept = [];
    for (const e of list) {
      if (!validEntry(e) || seen.has(e.handle)) continue;
      seen.add(e.handle);
      kept.push({ handle: e.handle, kind: e.kind, p: e.p, t: e.t, n: Number.isInteger(e.n) && e.n > 0 ? e.n : 1 });
    }
    if (kept.length) book.forecasts[id] = kept.slice(0, QUESTION_CAP);
  }
  return book;
}

/** open, closed (waiting on its source), resolved, or void. */
export function statusOf(q, now = Date.now()) {
  const r = q?.resolution;
  if (r && (r.outcome === true || r.outcome === false)) return 'resolved';
  if (r && r.outcome === null && r.void === true) return 'void';
  return now < Date.parse(q.closesAt) ? 'open' : 'closed';
}

export function outcomeOf(q) {
  const r = q?.resolution;
  if (r?.outcome === true) return 1;
  if (r?.outcome === false) return 0;
  return null;
}

export function brier(p, outcome) {
  if (outcome !== 0 && outcome !== 1) return null;
  const x = p / 100;
  return round((x - outcome) ** 2, 4);
}

function mean(xs) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

function median(xs) {
  if (!xs.length) return null;
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function crowdOf(entries) {
  const ps = entries.map((e) => e.p);
  const side = (kind) => {
    const xs = entries.filter((e) => e.kind === kind).map((e) => e.p);
    return { n: xs.length, mean: xs.length ? round(mean(xs), 1) : null };
  };
  return {
    n: ps.length,
    mean: ps.length ? round(mean(ps), 1) : null,
    median: ps.length ? round(median(ps), 1) : null,
    human: side('human'),
    agent: side('agent'),
  };
}

/**
 * File or change one forecast. `input` is {handle, key, id, p, kind?}.
 * Async because the key is hashed. Mutates `book` on success.
 */
export async function placeForecast(book, questions, input, now = Date.now()) {
  const handle = cleanHandle(input?.handle);
  if (!handle) return { ok: false, status: 400, error: 'handle is required: 2–32 characters, letters, numbers, dot, underscore or hyphen' };
  const key = cleanKey(input?.key);
  if (!key) return { ok: false, status: 400, error: 'key is required: 16–128 characters, letters, numbers, underscore or hyphen. The page makes one for your browser; agents bring their own and keep it.' };
  const id = typeof input?.id === 'string' ? input.id : '';
  const q = questions.find((x) => x.id === id);
  if (!q) return { ok: false, status: 404, error: 'no question with that id' };
  const status = statusOf(q, now);
  if (status !== 'open') return { ok: false, status: 409, error: `that question is ${status}; forecasts closed at ${q.closesAt}` };
  const p = cleanP(input?.p);
  if (p == null) return { ok: false, status: 400, error: 'p must be a whole percent from 1 to 99 (how likely YES is)' };
  const kind = input?.kind === 'agent' ? 'agent' : 'human';

  const hash = await hashKey(key);
  const owner = book.handles[handle];
  if (owner && owner !== hash) return { ok: false, status: 409, error: 'that handle is held by another browser key. Pick another handle, or use the browser that made it.' };
  if (!owner) {
    if (Object.keys(book.handles).length >= HANDLE_CAP) return { ok: false, status: 429, error: 'the board is not taking new handles right now' };
    book.handles[handle] = hash;
  }

  const list = book.forecasts[id] ?? [];
  const at = list.findIndex((e) => e.handle === handle);
  const t = new Date(now).toISOString();
  let entry;
  if (at >= 0) {
    entry = { ...list[at], p, t, kind, n: (list[at].n || 1) + 1 };
    list[at] = entry;
  } else {
    if (list.length >= QUESTION_CAP) return { ok: false, status: 429, error: 'that question already has all the forecasts it will take' };
    entry = { handle, kind, p, t, n: 1 };
    list.push(entry);
  }
  book.forecasts[id] = list;
  return { ok: true, status: at >= 0 ? 200 : 201, updated: at >= 0, entry, question: q.id, closesAt: q.closesAt };
}

function forecastsBeforeClose(q, book) {
  const close = Date.parse(q.closesAt);
  return (book.forecasts[q.id] ?? []).filter((e) => Date.parse(e.t) < close);
}

export function questionView(q, book, now = Date.now()) {
  const status = statusOf(q, now);
  const entries = forecastsBeforeClose(q, book);
  const outcome = outcomeOf(q);
  const crowd = crowdOf(entries);
  const view = {
    id: q.id,
    category: q.category,
    question: q.question,
    yesMeans: q.yesMeans,
    noMeans: q.noMeans,
    context: q.context ?? '',
    opensAt: q.opensAt,
    closesAt: q.closesAt,
    resolveDate: q.resolveDate,
    source: q.source,
    rumor: q.rumor ?? null,
    status,
    resolution: q.resolution ?? null,
    crowd,
  };
  if (status === 'resolved') {
    view.crowd.brier = crowd.mean == null ? null : brier(crowd.mean, outcome);
  }
  if (status !== 'open') {
    view.forecasts = entries
      .map((e) => ({ handle: e.handle, kind: e.kind, p: e.p, t: e.t, brier: outcome == null ? null : brier(e.p, outcome) }))
      .sort((a, b) => (a.brier ?? 9) - (b.brier ?? 9) || a.handle.localeCompare(b.handle));
  }
  return view;
}

/** Average Brier per forecaster over resolved questions. People and agents apart. */
export function accuracyBoard(questions, book, now = Date.now()) {
  const rows = new Map();
  let resolved = 0;
  const crowdScores = [];
  for (const q of questions) {
    if (statusOf(q, now) !== 'resolved') continue;
    resolved += 1;
    const outcome = outcomeOf(q);
    const entries = forecastsBeforeClose(q, book);
    const c = crowdOf(entries);
    if (c.mean != null) crowdScores.push(brier(c.mean, outcome));
    for (const e of entries) {
      const key = `${e.kind}:${e.handle}`;
      const row = rows.get(key) ?? { handle: e.handle, kind: e.kind, scores: [] };
      row.scores.push(brier(e.p, outcome));
      rows.set(key, row);
    }
  }
  const list = [...rows.values()].map((r) => ({ handle: r.handle, kind: r.kind, resolved: r.scores.length, brier: round(mean(r.scores), 4) }));
  const sort = (xs) => xs.slice().sort((a, b) => a.brier - b.brier || b.resolved - a.resolved || a.handle.localeCompare(b.handle));
  return {
    resolvedQuestions: resolved,
    coinFlip: COIN_FLIP_BRIER,
    crowd: crowdScores.length ? round(mean(crowdScores), 4) : null,
    human: sort(list.filter((r) => r.kind === 'human')).slice(0, 50),
    agent: sort(list.filter((r) => r.kind === 'agent')).slice(0, 50),
  };
}

export function publicBoard(data, book, now = Date.now()) {
  const questions = Array.isArray(data?.questions) ? data.questions : [];
  const views = questions.map((q) => questionView(q, book, now));
  const byClose = (a, b) => Date.parse(a.closesAt) - Date.parse(b.closesAt);
  return {
    ok: true,
    name: data?.name ?? 'The 25-Mile Forecast Board',
    place: 'El Segundo and the South Bay, within about 25 miles',
    money: 'none: forecasts only, no points, no prizes',
    rules: BOARD_RULES,
    updatedAt: data?.updatedAt ?? null,
    counts: {
      open: views.filter((v) => v.status === 'open').length,
      closed: views.filter((v) => v.status === 'closed').length,
      resolved: views.filter((v) => v.status === 'resolved').length,
      void: views.filter((v) => v.status === 'void').length,
      forecasts: views.reduce((n, v) => n + v.crowd.n, 0),
    },
    open: views.filter((v) => v.status === 'open').sort(byClose),
    closed: views.filter((v) => v.status === 'closed').sort(byClose),
    archive: views.filter((v) => v.status === 'resolved' || v.status === 'void').sort((a, b) => byClose(b, a)),
    accuracy: accuracyBoard(questions, book, now),
    post: {
      url: 'https://pointcast.xyz/api/forecasts',
      body: { handle: 'your-handle', key: 'a-long-random-key-you-keep', id: questions[0]?.id ?? 'question-id', p: 60, kind: 'agent' },
      note: 'p is how likely YES is, a whole percent from 1 to 99. Send the same key every time; it holds your handle. Change a forecast by posting again before the close.',
    },
  };
}

export function oneQuestion(data, book, id, now = Date.now()) {
  const q = (data?.questions ?? []).find((x) => x.id === id);
  return q ? questionView(q, book, now) : null;
}

/** Checks a question file. Returns a list of problems; empty means fine. */
export function auditQuestions(data) {
  const problems = [];
  const ids = new Set();
  for (const q of data?.questions ?? []) {
    const at = q?.id ?? '?';
    if (!ID_RE.test(q?.id ?? '')) problems.push(`${at}: bad id`);
    if (ids.has(q.id)) problems.push(`${at}: duplicate id`);
    ids.add(q.id);
    for (const f of ['category', 'question', 'yesMeans', 'noMeans', 'resolveDate']) if (!plain(q[f])) problems.push(`${at}: missing ${f}`);
    if (!/\?$/.test(plain(q.question))) problems.push(`${at}: question should end with ?`);
    if (!Number.isFinite(Date.parse(q.closesAt))) problems.push(`${at}: bad closesAt`);
    if (!Number.isFinite(Date.parse(q.opensAt))) problems.push(`${at}: bad opensAt`);
    if (!/^https:\/\//.test(q?.source?.url ?? '')) problems.push(`${at}: source.url must be https`);
    if (!plain(q?.source?.name)) problems.push(`${at}: missing source.name`);
    const r = q.resolution;
    if (r != null) {
      if (!(r.outcome === true || r.outcome === false || (r.outcome === null && r.void === true))) problems.push(`${at}: resolution.outcome must be true, false, or null with void true`);
      if (!/^https:\/\//.test(r.sourceUrl ?? '')) problems.push(`${at}: resolution needs the https link that settled it`);
      if (!Number.isFinite(Date.parse(r.resolvedAt))) problems.push(`${at}: resolution needs resolvedAt`);
    }
  }
  return problems;
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
  await kv.put(BOOK_KEY, JSON.stringify(book));
}

export async function overBudget(kv, request, budget = RATE_BUDGET, windowSeconds = RATE_WINDOW) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'local';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`forecast-rate:${ip}`));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 20);
  const key = `forecast:rate:${hex}`;
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
