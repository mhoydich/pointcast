// Communicator engine: request parsing, slots, matchmaking, the game state machine, the outbox.
// Plain ES module, zero dependencies beyond ./ledger.mjs, no network, no clock reads (every
// function that needs the time takes `now`). Pure: inputs are never mutated.
//
// Shared profile v1 (the privacy split is a hard rule):
//   { schema:'coordination/profile/1', id:'cp_...', handle, display, town,
//     identity:{ tier:0..3, proofs:[{provider, verifiedAt}] },
//     contact:{ email?, phone?, push? },          // PRIVATE: never leaves the profile
//     channels:{ sms, email, push, quietHours:{start,end} },
//     consent:{ communicator, contactableBy:['ladder-peers'], listed },
//     ladders:{ [ladderId]:{ declared } },
//     availability:[{ days:[0..6], start:'HH:MM', end:'HH:MM' }],   // local time, 0=Sun
//     venues:[venueId], recent:{ gamesLast30, lastInvitedAt } }
// Nothing in a Message or in publicProfile output may carry contact fields. Messages address
// people by handle only; the delivery layer looks up the private contact at send time.
import * as L from './ledger.mjs';

const DAY3 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_RES = [/\bsun(?:day)?\b/, /\bmon(?:day)?\b/, /\btue(?:s|sday)?\b/, /\bwed(?:nesday)?\b/, /\bthu(?:r|rs|rsday)?\b/, /\bfri(?:day)?\b/, /\bsat(?:urday)?\b/];
const WINDOWS = [ // checked in order; first hit wins
  [/after work/, 'evening', 17 * 60, 21 * 60], [/lunch/, 'lunch', 11 * 60 + 30, 13 * 60 + 30],
  [/morning/, 'morning', 8 * 60, 12 * 60], [/afternoon/, 'afternoon', 12 * 60, 17 * 60],
  [/evening|tonight/, 'evening', 17 * 60, 21 * 60],
];

// ---- time helpers (strings only; the offset of `now` is reused, DST is not modelled in v0) ----
const pad = (n) => String(n).padStart(2, '0');
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const hhmm = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const asIso = (now) => (typeof now === 'number' ? new Date(now).toISOString() : now);
const weekday = (d) => new Date(`${d}T00:00:00Z`).getUTCDay();
const addDays = (d, n) => { const t = new Date(`${d}T00:00:00Z`); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const offsetOf = (iso) => (/(Z|[+-]\d\d:\d\d)$/.exec(iso) || [])[1] || '-08:00'; // default: Pacific standard
const isoAt = (date, min, offset) => `${date}T${hhmm(min)}:00${offset}`;
const fmt12 = (min) => { const h = Math.floor(min / 60) % 24; return { t: `${h % 12 || 12}:${pad(min % 60)}`, ap: h >= 12 ? 'PM' : 'AM' }; };
const hourSpan = (a, b) => `${a % 60 ? hhmm(a) : a / 60}\u2013${b % 60 ? hhmm(b) : b / 60}`;
const firstName = (display) => String(display || '').split(' ')[0];

// "6pm", "6:30", "at 6", "how about 7": hours 1..7 without am/pm read as evening.
const guessHour = (h) => (h >= 1 && h <= 7 ? h + 12 : h);
function clockFrom(text) {
  let m = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/.exec(text);
  if (m) return ((+m[1] % 12) + (m[3] === 'pm' ? 12 : 0)) * 60 + (+m[2] || 0);
  m = /\b(\d{1,2}):(\d{2})\b/.exec(text);
  if (m) return guessHour(+m[1]) * 60 + +m[2];
  m = /\b(?:at|about|around|make it|try)\s+(\d{1,2})(?![\d.])/.exec(text);
  return m ? guessHour(+m[1]) * 60 : null;
}

// "Thu 6:00\u20137:30 PM" from a slot whose ISO strings carry local wall time.
export function whenLabel(slot) {
  const a = toMin(slot.start.slice(11, 16)), b = toMin(slot.end.slice(11, 16));
  const fa = fmt12(a), fb = fmt12(b);
  return `${DAY3[weekday(slot.start.slice(0, 10))]} ${fa.t}${fa.ap === fb.ap ? '' : ' ' + fa.ap}\u2013${fb.t} ${fb.ap}`;
}

// ---- profiles --------------------------------------------------------------------------
export function publicProfile(p) {
  return { handle: p.handle, display: p.display, town: p.town, tier: p.identity?.tier ?? 0, venues: [...(p.venues || [])], listed: !!p.consent?.listed };
}
export function canContact(profile, { via = 'communicator', from = 'ladder-peers' } = {}) {
  return via === 'communicator' && !!profile?.consent?.communicator && (profile.consent.contactableBy || []).includes(from);
}

// ---- parseRequest ----------------------------------------------------------------------
export function parseRequest(text, { now, venues = [], defaultLadder } = {}) {
  const raw = String(text);
  const t = raw.toLowerCase();
  const today = asIso(now).slice(0, 10);
  const lm = /\b([2-7]\.[05])\b/.exec(t);
  const level = lm && L.isLevel(parseFloat(lm[1])) ? parseFloat(lm[1]) : null;
  const format = /single/.test(t) ? 'singles' : 'doubles';

  let date = null;
  if (/tomorrow/.test(t)) date = addDays(today, 1);
  else if (/today|tonight/.test(t)) date = today;
  else {
    const wd = DAY_RES.findIndex((re) => re.test(t));
    // Naming today's weekday means next week's; "today" is the word for today.
    if (wd >= 0) date = addDays(today, (wd - weekday(today) + 7) % 7 || 7);
  }

  let window = { start: '17:00', end: '21:00', label: 'evening' }; // default: evening, so a bare day still resolves
  const hit = WINDOWS.find(([re]) => re.test(t));
  if (hit) window = { start: hhmm(hit[2]), end: hhmm(hit[3]), label: hit[1] };
  const clock = clockFrom(t);
  if (clock !== null) { const f = fmt12(clock); window = { start: hhmm(clock), end: hhmm(Math.min(clock + 120, 24 * 60 - 1)), label: `at ${f.t} ${f.ap}` }; }

  let venue = null;
  for (const v of venues) {
    const names = [v.short, v.name, ...(v.aliases || [])].filter(Boolean).map((s) => s.toLowerCase());
    if (names.some((n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(t))) { venue = v.id; break; }
  }

  const ladder = typeof defaultLadder === 'string' ? defaultLadder : defaultLadder?.id ?? L.DEFAULT_LADDER.id;
  const request = {
    schema: 'coordination/request/1', level, format, players: format === 'singles' ? 2 : 4,
    day: date ? weekday(date) : null, date, window, venue, ladder, raw,
  };
  const missing = [['level', level], ['day', date], ['venue', venue]].filter(([, v]) => v === null).map(([k]) => k);
  return { ok: missing.length === 0, request, missing };
}

// ---- slots -----------------------------------------------------------------------------
const blockAllows = (label, level) => {
  const m = /\b([2-8]\.[05])\b/.exec(label);
  if (m) return parseFloat(m[1]) === level;
  return /advanced/i.test(label) && level >= 4.0; // "Advanced" means 4.0 and up
};

export function proposeSlots(request, venue, { now } = {}) {
  if (!request.date) return [];
  const dur = request.format === 'singles' ? 60 : 90;
  const offset = offsetOf(asIso(now));
  const open = toMin(venue.hours.open), close = toMin(venue.hours.close);
  const wStart = toMin(request.window.start), wEnd = toMin(request.window.end);
  const out = [];
  // Hourly steps keep the three options distinct instead of 30-minute near-duplicates.
  for (let s = Math.ceil(wStart / 30) * 30; s + dur <= Math.max(wEnd, wStart + dur) && out.length < 3; s += 60) {
    const e = s + dur;
    if (s < open || e > close) continue;
    if (Date.parse(isoAt(request.date, s, offset)) <= Date.parse(asIso(now))) continue;
    const hits = (venue.blocks || []).filter((b) => b.days.includes(request.day) && s < toMin(b.end) && e > toMin(b.start));
    if (hits.some((b) => !blockAllows(b.label, request.level))) continue;
    const slot = { start: isoAt(request.date, s, offset), end: isoAt(request.date, e, offset), court: 'reserve', note: '' };
    if (hits.length) { slot.court = 'open play'; slot.note = `${hits[0].label} runs then`; }
    else slot.note = venue.reserve ? `${venue.reserve.label}: ${venue.reserve.url}` : 'Reserve a court';
    out.push(slot);
  }
  return out;
}

// ---- matchmaking -----------------------------------------------------------------------
const TAG_BONUS = { Settled: 1, Provisional: 0.6, 'Self-declared': 0.3 };

export function findCandidates(request, { profiles, ratings = {}, now, exclude = [], seed = 1, venues = [] }) {
  const win = [toMin(request.window.start), toMin(request.window.end)];
  const venue = venues.find((v) => v.id === request.venue);
  const pool = [];
  for (const p of profiles) {
    const entry = p.ladders?.[request.ladder];
    if (!canContact(p) || !p.consent.listed || !entry || exclude.includes(p.handle)) continue;
    if (request.venue && !(p.venues || []).includes(request.venue)) continue;
    if (request.day !== null && !(p.availability || []).some((a) => a.days.includes(request.day) && toMin(a.start) <= win[0] && toMin(a.end) >= win[1])) continue;
    const r = ratings[p.handle] ?? (L.isLevel(entry.declared) ? { handle: p.handle, value: entry.declared, plusMinus: L.BAND_AT_ZERO, level: L.levelName(entry.declared), tag: 'Self-declared' } : null);
    if (!r || r.value == null) continue;
    if (request.level !== null && !L.inBand(r.value, request.level, 0.25)) continue;
    pool.push({ p, r });
  }
  // Seeded shuffle first; the stable sort below then breaks fit ties in that order.
  const rng = L.mulberry32(seed);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const scored = pool.map(({ p, r }) => {
    const closeness = request.level === null ? 1 : Math.max(0, 1 - Math.abs(r.value - request.level) / 0.5);
    // Fairness rule: players who played less lately and were invited longer ago rank higher.
    const since = p.recent?.lastInvitedAt ? (Date.parse(asIso(now)) - Date.parse(p.recent.lastInvitedAt)) / 86400000 : 14;
    const fresh = 0.5 / (1 + (p.recent?.gamesLast30 ?? 0)) + 0.5 * Math.min(1, Math.max(0, since) / 14);
    const fit = Math.round((0.5 * closeness + 0.25 * (TAG_BONUS[r.tag] ?? 0) + 0.25 * fresh) * 1000) / 1000;
    const reasons = [`${r.level} ${(r.tag || 'unrated').toLowerCase()}`];
    if (request.day !== null) reasons.push(`free ${DAY3[request.day]} ${hourSpan(win[0], win[1])}`);
    if (request.venue) reasons.push(`plays ${venue?.short ?? venue?.name ?? request.venue}`);
    return { handle: p.handle, display: p.display, fit, reasons, rating: L.publicRating(r) };
  });
  return scored.sort((a, b) => b.fit - a.fit);
}

// ---- messages --------------------------------------------------------------------------
const REPLIES = {
  invite: ['in', 'out', 'maybe', 'newtime'], 're-invite': ['in', 'out', 'maybe', 'newtime'],
  short: ['widen band', 'new time', 'cancel'], newtime: ['accept', 'keep'],
  confirmed: ['directions', 'add to calendar', 'drop out'], 'score-confirm': ['confirm', 'dispute'],
};
const clip = (s) => (s.length <= 160 ? s : s.slice(0, 159) + '\u2026');

// ctx: { name, host, level, format, when, where, address, url, need, by, a, b, other, reason, delta }
export function renderText(kind, ctx = {}) {
  const c = ctx;
  const game = `${c.level ?? ''} ${c.format ?? 'doubles'}`.trim();
  const lines = {
    invite: `${c.name}, ${game} ${c.when} at ${c.where} with ${c.host}. In?`,
    're-invite': `${c.name}, new time: ${c.when} at ${c.where} with ${c.host}. Still in?`,
    filled: `Game on: ${game} ${c.when} at ${c.where} is full. ${c.host} will confirm.`,
    short: `Still ${c.need} short for ${c.when} at ${c.where}. Widen the band, try a new time, or cancel?`,
    newtime: c.other ? `${c.by} suggests ${c.other} instead. Accept?` : `${c.by} would like a different time. Accept?`,
    confirmed: `Confirmed: ${game} ${c.when} at ${c.where}, ${c.address}.${c.url ? ' Book: ' + c.url : ''}`,
    'reminder-24h': `Tomorrow: ${game} ${c.when} at ${c.where}. See you there.`,
    'reminder-2h': `Today in 2 hours: ${game} ${c.when} at ${c.where}.`,
    'score-confirm': `${c.by} logged ${c.a}\u2013${c.b} for ${c.when} at ${c.where}. Confirm?`,
    recorded: `Recorded ${c.a}\u2013${c.b}.${c.delta ? ' Your rating ' + c.delta + '.' : ''} Thanks for playing.`,
    disputed: `${c.by} disputed the score for ${c.when}. Sort it out or void it.`,
    cancelled: `${game} ${c.when} at ${c.where} is cancelled${c.reason ? ': ' + c.reason : ''}.`,
  };
  return clip(lines[kind] ?? `${kind}: ${c.when ?? ''}`.trim());
}

function mk(g, now, to, kind, extra = {}) {
  const base = { name: firstName(g.names[to]), host: firstName(g.names[g.host]), level: g.request.level?.toFixed(1), format: g.request.format,
    when: whenLabel(g.slot), where: g.venueInfo.short, address: g.venueInfo.address, url: g.venueInfo.reserve?.url };
  return { id: L.stableId('m_', `${g.id}|${kind}|${to}|${g.history.length}`), at: asIso(now), to, kind,
    text: renderText(kind, { ...base, ...extra }), replies: [...(REPLIES[kind] || [])], effect: 'consent',
    requires: { recipientConsent: true, senderOkay: true }, game: g.id };
}
const step = (g, now, actor, op, detail = '') => { const n = structuredClone(g); n.history.push({ at: asIso(now), actor, op, detail }); return n; };
const everyone = (g) => [...new Set([...g.roster.in, ...g.roster.invited, ...g.roster.maybe])];

// ---- game state machine ----------------------------------------------------------------
export function createGame(request, { venue, slot, host, hostDisplay, needed, ladder, now, seed = 0 }) {
  const n = needed ?? request.players ?? 4;
  const id = L.stableId('g_', `${host}|${slot.start}|${venue.id}|${seed}`);
  const game = {
    schema: 'coordination/game/1', id, ladder: typeof ladder === 'string' ? ladder : ladder?.id ?? request.ladder,
    request: structuredClone(request), venue: venue.id, slot: structuredClone(slot), needed: n, host,
    // Extras beyond the spec: public display names and venue facts, so messages can render without a lookup.
    names: { [host]: hostDisplay || host },
    venueInfo: { short: venue.short || venue.name, address: venue.address, reserve: venue.reserve ?? null },
    roster: { in: [host], maybe: [], out: [], invited: [], waitlist: [] },
    status: 'proposed', proposals: [], score: null, ledgerEntryId: null,
    history: [{ at: asIso(now), actor: host, op: 'create', detail: id }], createdAt: asIso(now),
  };
  return { game, outbox: [] };
}

// `profiles` is required so consent is re-checked here even though findCandidates already filters.
export function invite(game, candidates, { now, profiles = [], max, waitlist = 3 } = {}) {
  const by = new Map(profiles.map((p) => [p.handle, p]));
  for (const c of candidates) {
    if (!canContact(by.get(c.handle))) throw new Error(`cannot invite ${c.handle}: no communicator consent`);
  }
  const fresh = candidates.filter((c) => c.handle !== game.host && ![...game.roster.in, ...game.roster.invited, ...game.roster.waitlist].includes(c.handle));
  const n = max ?? game.needed - 1;
  const go = fresh.slice(0, n), wait = fresh.slice(n, n + waitlist);
  let g = step(game, now, game.host, 'invite', go.map((c) => c.handle).join(','));
  for (const c of [...go, ...wait]) g.names[c.handle] = c.display;
  g.roster.invited.push(...go.map((c) => c.handle));
  g.roster.waitlist.push(...wait.map((c) => c.handle));
  g.status = 'inviting';
  return { game: g, outbox: go.map((c) => mk(g, now, c.handle, 'invite')) };
}

export function reply(game, { handle, answer, slot = null, now }) {
  if (!['in', 'out', 'maybe', 'newtime'].includes(answer)) throw new Error(`unknown answer ${answer}`);
  if (['cancelled', 'played', 'scoring', 'recorded', 'disputed'].includes(game.status)) throw new Error(`game is ${game.status}`);
  const r0 = game.roster;
  if (![r0.in, r0.maybe, r0.out, r0.invited, r0.waitlist].some((l) => l.includes(handle))) throw new Error(`${handle} is not part of this game`);
  const wasCounted = r0.in.includes(handle) || r0.invited.includes(handle);
  let g = step(game, now, handle, 'reply', answer);
  const r = g.roster, outbox = [];
  const drop = () => { for (const k of Object.keys(r)) r[k] = r[k].filter((h) => h !== handle); };
  if (answer === 'in') {
    drop();
    // A late "in" to a full game goes to the waitlist instead of overfilling it.
    (r.in.length >= g.needed ? r.waitlist : r.in).push(handle);
  } else if (answer === 'maybe') { drop(); r.maybe.push(handle); }
  else if (answer === 'out') {
    drop(); r.out.push(handle);
    if (wasCounted && r.waitlist.length) {
      const next = r.waitlist.shift();
      r.invited.push(next);
      outbox.push(mk(g, now, next, 'invite'));
    }
  } else if (slot) {
    const same = g.proposals.find((p) => p.slot.start === slot.start && p.slot.end === slot.end);
    if (same) { if (!same.votes.includes(handle)) same.votes.push(handle); }
    else g.proposals.push({ by: handle, slot: structuredClone(slot), votes: [handle] });
  }
  if (answer === 'newtime') {
    if (handle !== g.host) outbox.push(mk(g, now, g.host, 'newtime', { by: firstName(g.names[handle]), other: slot ? whenLabel(slot) : '' }));
    return { game: g, outbox };
  }
  if (r.in.length >= g.needed && ['proposed', 'inviting', 'short'].includes(g.status)) {
    g.status = 'filled';
    for (const h of r.in) outbox.push(mk(g, now, h, 'filled'));
  } else if (r.in.length < g.needed && ['filled', 'confirmed', 'short'].includes(g.status)) {
    g.status = r.in.length + r.invited.length < g.needed ? 'short' : 'inviting';
  }
  if (answer === 'out' && wasCounted && r.in.length + r.invited.length < g.needed) {
    g.status = 'short';
    outbox.push(mk(g, now, g.host, 'short', { need: g.needed - r.in.length }));
  }
  return { game: g, outbox };
}

export function acceptNewTime(game, proposalIndex, { now }) {
  const p = game.proposals[proposalIndex];
  if (!p) throw new Error('no such proposal');
  let g = step(game, now, game.host, 'accept-newtime', p.slot.start);
  g.slot = structuredClone(p.slot);
  g.proposals = [];
  const back = [...new Set([...g.roster.in, ...g.roster.maybe, ...g.roster.invited])].filter((h) => h !== g.host);
  g.roster.in = [g.host]; g.roster.maybe = []; g.roster.invited = back;
  g.status = 'inviting';
  return { game: g, outbox: back.map((h) => mk(g, now, h, 're-invite')) };
}

export function confirm(game, { now }) {
  if (game.status !== 'filled') throw new Error(`cannot confirm a ${game.status} game`);
  const g = step(game, now, game.host, 'confirm');
  g.status = 'confirmed';
  return { game: g, outbox: g.roster.in.map((h) => mk(g, now, h, 'confirmed')) };
}

const HOUR_MS = 3600000;
const reminderList = (game) => {
  const s = Date.parse(game.slot.start);
  return [['reminder-24h', 24], ['reminder-2h', 2]].map(([kind, h]) => ({ at: new Date(s - h * HOUR_MS).toISOString(), kind }));
};
// Computed, not stored: only the ones still ahead of `now`.
export const reminders = (game, { now }) => reminderList(game).filter((x) => Date.parse(x.at) > Date.parse(asIso(now)));

export function dueReminders(game, { now }) {
  const t = Date.parse(asIso(now));
  if (!['confirmed'].includes(game.status) || t >= Date.parse(game.slot.start)) return [];
  const sent = game.history.filter((h) => h.op === 'reminder-sent').map((h) => h.detail);
  return reminderList(game).filter((x) => Date.parse(x.at) <= t && !sent.includes(x.kind))
    .flatMap((x) => game.roster.in.map((h) => mk(game, now, h, x.kind)));
}
export const markReminderSent = (game, kind, { now }) => ({ game: step(game, now, 'system', 'reminder-sent', kind), outbox: [] });

export function markPlayed(game, { now, force = false } = {}) {
  if (game.status !== 'confirmed') throw new Error(`cannot mark a ${game.status} game played`);
  if (!force && Date.parse(asIso(now)) < Date.parse(game.slot.end)) throw new Error('game has not ended yet');
  const g = step(game, now, game.host, 'played', force ? 'forced' : '');
  g.status = 'played';
  return { game: g, outbox: [] };
}

const sideOf = (sides, h) => sides.findIndex((s) => s.players.includes(h));

export function submitScore(game, { by, sides, now, ladder = L.DEFAULT_LADDER }) {
  if (game.status !== 'played') throw new Error(`cannot score a ${game.status} game`); // one submission; a dispute reopens via the host
  if (!game.roster.in.includes(by)) throw new Error(`${by} did not play`);
  const half = game.needed / 2;
  const flat = (sides || []).flatMap((s) => s.players || []);
  if (sides?.length !== 2 || sides.some((s) => s.players?.length !== half) || flat.length !== game.roster.in.length
      || !game.roster.in.every((h) => flat.includes(h)) || new Set(flat).size !== flat.length) throw new Error('sides must split the roster evenly');
  const [a, b] = sides.map((s) => s.score);
  if (![a, b].every((n) => Number.isInteger(n) && n >= 0)) throw new Error('scores must be whole numbers');
  // ES Rec rule: first to toPoints, win by one (so 11-10 stands and 11-11 does not).
  if (Math.max(a, b) < ladder.game.toPoints || a === b) throw new Error(`a game goes to ${ladder.game.toPoints} and cannot tie`);
  const mine = sideOf(sides, by);
  let entry = {
    id: L.stableId('le_', game.id), schema: 'coordination/ledger-entry/1', ladder: game.ladder, kind: 'game', at: game.slot.end,
    sides: sides.map((s) => ({ players: [...s.players], score: s.score })), source: { kind: 'communicator', ref: game.id },
    confirmations: [], status: 'pending', dispute: null,
  };
  entry = L.confirmEntry(entry, { by, side: mine, at: asIso(now), ladder });
  let g = step(game, now, by, 'score', `${a}-${b}`);
  g.score = { sides: structuredClone(entry.sides), by, at: asIso(now) };
  g.ledgerEntryId = entry.id;
  g.status = entry.status === 'confirmed' ? 'recorded' : 'scoring';
  const others = entry.sides[1 - mine].players;
  return { game: g, ledger: [entry], outbox: others.map((h) => mk(g, now, h, 'score-confirm', { by: firstName(g.names[by]), a, b })) };
}

// `deltas` (optional, handle -> "+0.04") lets the UI pass the before/after rating change into the text.
export function confirmScore(game, entry, { by, now, ladder = L.DEFAULT_LADDER, deltas = {} }) {
  if (entry.id !== game.ledgerEntryId) throw new Error('entry does not belong to this game');
  const next = L.confirmEntry(entry, { by, side: sideOf(entry.sides, by), at: asIso(now), ladder });
  let g = step(game, now, by, 'confirm-score');
  if (next.status === 'confirmed') g.status = 'recorded';
  const [a, b] = next.sides.map((s) => s.score);
  const outbox = next.status === 'confirmed' ? g.roster.in.map((h) => mk(g, now, h, 'recorded', { a, b, delta: deltas[h] })) : [];
  return { game: g, ledger: [next], outbox };
}

export function disputeScore(game, entry, { by, now, note = '' }) {
  if (entry.id !== game.ledgerEntryId || !game.roster.in.includes(by)) throw new Error('only a player in this game can dispute its score');
  const next = L.disputeEntry(entry, { by, at: asIso(now), note });
  const g = step(game, now, by, 'dispute-score', note);
  g.status = 'disputed';
  return { game: g, ledger: [next], outbox: [mk(g, now, g.host, 'disputed', { by: firstName(g.names[by]) })] };
}

export function cancel(game, { by, now, reason = '' }) {
  if (by !== game.host) throw new Error('only the host can cancel');
  if (['cancelled', 'recorded'].includes(game.status)) throw new Error(`game is already ${game.status}`);
  const g = step(game, now, by, 'cancel', reason);
  g.status = 'cancelled';
  return { game: g, outbox: everyone(g).filter((h) => h !== by).map((h) => mk(g, now, h, 'cancelled', { reason })) };
}

// ---- reply parsing for voice and text --------------------------------------------------
// Returns { answer, slotHint } so the time hint can ride along; parseReply is the string-only form.
export function parseReplyDetail(text) {
  const t = String(text || '').toLowerCase().trim();
  const clock = clockFrom(t);
  const hint = clock === null ? null : hhmm(clock);
  let answer = null;
  if (clock !== null || /how about|what about|\b(later|earlier)\b|different time|another time|new time/.test(t)) answer = 'newtime';
  else if (/\b(maybe|might)\b|not sure/.test(t)) answer = 'maybe';
  else if (/\b(out|no|nope|pass)\b|can'?t|cannot/.test(t)) answer = 'out';
  else if (/\b(in|yes|yep|yeah|yup|sure|ok|okay)\b|\u{1F44D}/u.test(t)) answer = 'in';
  return answer === 'newtime' && hint ? { answer, slotHint: hint } : { answer, slotHint: null };
}
export const parseReply = (text) => parseReplyDetail(text).answer;

// ---- the bot map -----------------------------------------------------------------------
// effect: read = no change, write = changes game state only, consent = reaches a person.
export const ACTIONS = [
  { name: 'ladder_read', effect: 'read', who: 'anyone', description: 'Read a ladder config, a public rating, or the league table.' },
  { name: 'venue_read', effect: 'read', who: 'anyone', description: 'Read a venue: hours, drop-in blocks, booking link.' },
  { name: 'availability_read', effect: 'read', who: 'anyone', description: 'Read whether a profile is free in a window, without exposing the profile.' },
  { name: 'parseRequest', effect: 'read', who: 'anyone', description: 'Turn a typed or spoken ask into a structured request and say what is missing.' },
  { name: 'proposeSlots', effect: 'read', who: 'anyone', description: 'Offer up to three slots that respect venue hours and drop-in blocks.' },
  { name: 'findCandidates', effect: 'read', who: 'host', description: 'Rank consenting, in-band, available players; fairness favors those who played less.' },
  { name: 'publicProfile', effect: 'read', who: 'anyone', description: 'The only profile fields that may be shown: no contact details.' },
  { name: 'canContact', effect: 'read', who: 'anyone', description: 'Check a profile consented to be reached through the communicator.' },
  { name: 'createGame', effect: 'write', who: 'host', description: 'Start a proposed game with the host on the roster.' },
  { name: 'invite', effect: 'consent', who: 'host', description: 'Send invites to consenting candidates and queue a waitlist.' },
  { name: 'reply', effect: 'consent', who: 'player', description: 'Record in/out/maybe/newtime; backfill from the waitlist and tell the host when short.' },
  { name: 'acceptNewTime', effect: 'consent', who: 'host', description: 'Move the game to a proposed time and re-invite everyone.' },
  { name: 'confirm', effect: 'consent', who: 'host', description: 'Lock a full game and send the address and booking link.' },
  { name: 'reminders', effect: 'read', who: 'anyone', description: 'List the upcoming 24-hour and 2-hour reminder times.' },
  { name: 'dueReminders', effect: 'consent', who: 'organizer', description: 'Build reminder messages that are due and not yet sent.' },
  { name: 'markReminderSent', effect: 'write', who: 'organizer', description: 'Record that a reminder went out so it is not repeated.' },
  { name: 'markPlayed', effect: 'write', who: 'host', description: 'Mark a confirmed game as played once its slot has ended.' },
  { name: 'submitScore', effect: 'consent', who: 'player', description: 'Log a score and ask the other side to confirm it.' },
  { name: 'confirmScore', effect: 'consent', who: 'player', description: 'Confirm a logged score; both sides confirming records it on the ledger.' },
  { name: 'disputeScore', effect: 'consent', who: 'player', description: 'Dispute a logged score and alert the host.' },
  { name: 'cancel', effect: 'consent', who: 'host', description: 'Cancel a game and tell everyone involved.' },
  { name: 'renderText', effect: 'read', who: 'anyone', description: 'Write the short message text for an event, display names only.' },
  { name: 'parseReply', effect: 'read', who: 'anyone', description: 'Read a free-text reply as in, out, maybe or newtime.' },
  { name: 'parseReplyDetail', effect: 'read', who: 'anyone', description: 'Same as parseReply, plus any time the player named.' },
  { name: 'whenLabel', effect: 'read', who: 'anyone', description: 'Format a slot as a short day and time range.' },
];
