/**
 * Network Points — one open, append-only points ledger for the PointCast
 * network (PointCast, elsegundo.xyz, Industry Next, UES).
 *
 * Plain rules, in one file, so the page, the JSON twin, the Pages Function
 * and the tests all read the same numbers:
 *
 *   - A ledger line says who earned what, for what, where and when.
 *   - Lines are hash-chained per profile (each line names the id of the one
 *     before it), so anyone can re-hash a profile's history and check that
 *     nothing was edited. The chain head is what a later Tezos anchor would
 *     publish; nothing is on chain today.
 *   - Points and Nouns Money notes are collectible marks. They have no cash
 *     value, are never sold, never redeemed and never traded for money.
 *     They are not part of Good Feels or any cannabis program.
 *
 * Runs unchanged in a Pages Function, in the browser and in `node --test`:
 * Web Crypto only, no Node built-ins, no dependencies.
 *
 * Spec page: /points/ · JSON: /points.json · Schema: /points/schema.json
 */

export const POINTS_SCHEMA = 'pointcast.points.line/v1';
export const POINTS_SUMMARY_SCHEMA = 'pointcast.points.summary/v1';
export const POINTS_GENESIS = 'genesis';
export const POINTS_SITES = ['pointcast.xyz', 'elsegundo.xyz', 'industrynext.xyz', 'ues'];

/** What earns points. `live` kinds are wired; the rest are reserved names. */
export const POINT_KINDS = {
  checkin: { points: 10, label: 'Check-in', live: true, rule: 'First check-in of the day, anywhere on the network.' },
  'checkin-again': { points: 2, label: 'Another check-in', live: true, rule: 'Each later check-in the same day, up to four more.' },
  streak: { points: 15, label: 'Streak', live: true, rule: 'Every third day in a row you check in.' },
  'long-streak': { points: 30, label: 'Long streak', live: true, rule: 'Every seventh day in a row you check in.' },
  'sister-town': { points: 30, label: 'Sister town', live: true, rule: 'Your first check-in from each network town.' },
  drum: { points: 5, label: 'Drum day', live: true, rule: 'Any day you play a PointCast drum while signed in.' },
  pickleball: { points: 10, label: 'Pickleball game', live: false, rule: 'A countersigned game on the court ladder. Reserved.' },
  forecast: { points: 5, label: 'Forecast', live: false, rule: 'A call on the 25-Mile Forecast Board. Reserved.' },
  almanac: { points: 10, label: 'Almanac sign', live: false, rule: "Logging the week's sign in the town almanac. Reserved." },
};

export const MAX_SAME_DAY_CHECKINS = 5;

/** Network towns. A first check-in from each earns a Nouns Reserve note. */
export const SISTER_TOWNS = [
  { id: 'el-segundo', name: 'El Segundo, CA', match: ['el segundo', 'elsegundo', '90245'] },
  { id: 'medway', name: 'Medway, MA', match: ['medway'] },
  { id: 'new-braunfels', name: 'New Braunfels, TX', match: ['new braunfels', 'newbraunfels'] },
  { id: 'elizabeth', name: 'Elizabeth, NJ', match: ['elizabeth, nj', 'elizabeth nj', 'elizabeth new jersey'] },
];

/**
 * Nouns Money, Series 1. Three notes, issued by Hoydich Enterprises, earned
 * only by showing up. The edition runs to the spring equinox; the next season
 * starts a new series and earlier notes stay on the profile.
 */
export const NOUNS_MONEY_EDITIONS = [
  {
    id: 'series-1',
    name: 'Series 1',
    season: 'Winter 2026–27',
    opens: '2026-11-09',
    closes: '2027-03-20',
    issuer: 'Hoydich Enterprises',
    notes: [
      {
        id: 'enjoy',
        name: 'Enjoy.',
        long: 'Enjoy. house note',
        earnedBy: 'checkin',
        rule: 'One for each day you check in.',
        frame: 'Cream "Enjoy." frame on your profile',
        ink: '#d9622b',
        image: '/currency-builder/series-1/notes/front/enjoy.svg',
      },
      {
        id: 'blue',
        name: 'Blue Note',
        long: 'KansasDAO Blue Note',
        earnedBy: 'streak',
        rule: 'One for every third day in a row.',
        frame: 'Cobalt border on your profile',
        ink: '#1f4fa8',
        image: '/currency-builder/series-1/notes/front/blue.svg',
      },
      {
        id: 'reserve',
        name: 'Nouns Reserve',
        long: 'Nouns Reserve note',
        earnedBy: 'long-streak or sister-town',
        rule: 'One for every seventh day in a row, and one for your first check-in from each network town.',
        frame: 'Gold seal on your profile',
        ink: '#c9a227',
        image: '/currency-builder/series-1/notes/front/reserve.svg',
      },
    ],
  },
];

export const NOTE_FOR_KIND = { checkin: 'enjoy', streak: 'blue', 'long-streak': 'reserve', 'sister-town': 'reserve' };

export const PROFILE_UNLOCKS = [
  { id: 'enjoy-frame', needs: { enjoy: 1 }, label: 'Enjoy. frame' },
  { id: 'cobalt-border', needs: { blue: 1 }, label: 'Cobalt border' },
  { id: 'gold-seal', needs: { reserve: 1 }, label: 'Gold seal' },
  { id: 'full-set', needs: { enjoy: 1, blue: 1, reserve: 1 }, label: 'Series 1 full set' },
  { id: 'regular', needs: { enjoy: 10 }, label: 'Regular (10 days)' },
];

export const DISCLOSURE = 'Points and Nouns Money notes are collectible marks with no cash value. They are never sold, redeemed or traded for money, and they are not part of Good Feels or any cannabis program.';

export function editionFor(at) {
  const day = utcDay(at);
  return NOUNS_MONEY_EDITIONS.find((e) => day >= e.opens && day < e.closes) ?? NOUNS_MONEY_EDITIONS[NOUNS_MONEY_EDITIONS.length - 1];
}

export function utcDay(at) {
  const d = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(d.getTime())) throw new Error('bad-time');
  return d.toISOString().slice(0, 10);
}

function addDays(day, n) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Matches a coarse place name to a network town, or null. */
export function sisterTownFor(place) {
  const p = String(place ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!p) return null;
  return SISTER_TOWNS.find((t) => t.match.some((m) => p.includes(m))) ?? null;
}

/** Consecutive check-in days ending on `day`, given the set of days already checked in. */
export function streakEndingOn(day, days) {
  let n = 0;
  let cursor = day;
  while (days.has(cursor)) { n += 1; cursor = addDays(cursor, -1); }
  return n;
}

/**
 * Plan the ledger lines one check-in earns, from the profile's earlier lines.
 * Pure: returns line drafts (no ids yet). `ref` is the check-in's own id and
 * makes every award idempotent.
 */
export function planCheckin({ profile, at, place = '', site = 'pointcast.xyz', ref }, priorLines = []) {
  if (!profile || !ref) throw new Error('missing-profile-or-ref');
  const day = utcDay(at);
  const edition = editionFor(at).id;
  const checkins = priorLines.filter((l) => l.kind === 'checkin' || l.kind === 'checkin-again');
  const todayCount = checkins.filter((l) => l.day === day).length;
  const base = { profile, at: new Date(at).toISOString(), day, place: String(place).slice(0, 80), site, edition };
  if (todayCount >= MAX_SAME_DAY_CHECKINS) return [];
  if (todayCount > 0) return [{ ...base, kind: 'checkin-again', points: POINT_KINDS['checkin-again'].points, note: null, ref }];

  const lines = [{ ...base, kind: 'checkin', points: POINT_KINDS.checkin.points, note: 'enjoy', ref }];
  const days = new Set(checkins.map((l) => l.day));
  days.add(day);
  const streak = streakEndingOn(day, days);
  if (streak > 0 && streak % 3 === 0) lines.push({ ...base, kind: 'streak', points: POINT_KINDS.streak.points, note: 'blue', ref: `${ref}#streak-${streak}` });
  if (streak > 0 && streak % 7 === 0) lines.push({ ...base, kind: 'long-streak', points: POINT_KINDS['long-streak'].points, note: 'reserve', ref: `${ref}#long-streak-${streak}` });
  const town = sisterTownFor(place);
  if (town && !priorLines.some((l) => l.kind === 'sister-town' && l.ref.endsWith(`#town-${town.id}`))) {
    lines.push({ ...base, kind: 'sister-town', points: POINT_KINDS['sister-town'].points, note: 'reserve', ref: `${ref}#town-${town.id}` });
  }
  return lines;
}

/** One drum line per profile per day. */
export function planDrumDay({ profile, at, site = 'pointcast.xyz' }, priorLines = []) {
  const day = utcDay(at);
  if (priorLines.some((l) => l.kind === 'drum' && l.day === day)) return [];
  return [{ profile, at: new Date(at).toISOString(), day, place: '', site, edition: editionFor(at).id, kind: 'drum', points: POINT_KINDS.drum.points, note: null, ref: `drum:${day}` }];
}

/** The exact bytes a line id is the SHA-256 of. Field order is fixed. */
export function canonicalLine(line) {
  return JSON.stringify([
    POINTS_SCHEMA, line.prev, line.profile, line.kind, line.points, line.note ?? null,
    line.edition, line.site, line.ref, line.day, line.place ?? '', line.at,
  ]);
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Gives drafts their `prev` and `id`, continuing from the profile's chain head. */
export async function chainLines(drafts, head = POINTS_GENESIS) {
  const out = [];
  let prev = head || POINTS_GENESIS;
  for (const draft of drafts) {
    const line = { schema: POINTS_SCHEMA, ...draft, prev };
    line.id = await sha256Hex(canonicalLine(line));
    out.push(line);
    prev = line.id;
  }
  return out;
}

/** Re-hashes a profile's lines in order. Returns { ok, head, brokenAt }. */
export async function verifyChain(lines) {
  let prev = POINTS_GENESIS;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.prev !== prev) return { ok: false, head: prev, brokenAt: i };
    if ((await sha256Hex(canonicalLine(line))) !== line.id) return { ok: false, head: prev, brokenAt: i };
    prev = line.id;
  }
  return { ok: true, head: prev, brokenAt: -1 };
}

/** What a profile shows: totals, notes per edition, unlocks, streak. */
export function summarize(profile, lines, { now = new Date(), beats = null } = {}) {
  const notes = {};
  for (const edition of NOUNS_MONEY_EDITIONS) notes[edition.id] = Object.fromEntries(edition.notes.map((n) => [n.id, 0]));
  const byKind = {};
  let points = 0;
  const checkinDays = new Set();
  let drumDays = 0;
  for (const line of lines) {
    points += line.points;
    byKind[line.kind] = (byKind[line.kind] ?? 0) + line.points;
    if (line.note && notes[line.edition]) notes[line.edition][line.note] = (notes[line.edition][line.note] ?? 0) + 1;
    if (line.kind === 'checkin') checkinDays.add(line.day);
    if (line.kind === 'drum') drumDays += 1;
  }
  const today = utcDay(now);
  const streak = checkinDays.has(today)
    ? streakEndingOn(today, checkinDays)
    : streakEndingOn(addDays(today, -1), checkinDays);
  const current = editionFor(now).id;
  const held = notes[current] ?? {};
  const unlocks = PROFILE_UNLOCKS.filter((u) => Object.entries(u.needs).every(([k, v]) => (held[k] ?? 0) >= v)).map((u) => u.id);
  return {
    schema: POINTS_SUMMARY_SCHEMA,
    profile,
    points,
    lines: lines.length,
    head: lines.length ? lines[lines.length - 1].id : POINTS_GENESIS,
    byKind,
    edition: current,
    notes,
    held,
    heldTotal: Object.values(held).reduce((a, b) => a + b, 0),
    unlocks,
    checkins: { days: checkinDays.size, streak },
    drums: { days: drumDays, beats },
    updatedAt: lines.length ? lines[lines.length - 1].at : null,
    disclosure: DISCLOSURE,
  };
}

/** The public rulebook, as served at /points.json. */
export function rulebook() {
  return {
    schema: 'pointcast.points.rules/v1',
    name: 'Network Points',
    summary: 'One open points ledger across PointCast, elsegundo.xyz, Industry Next and the University of El Segundo. Every line is public and hash-chained per profile.',
    kinds: Object.entries(POINT_KINDS).map(([id, k]) => ({ id, ...k })),
    maxSameDayCheckins: MAX_SAME_DAY_CHECKINS,
    sisterTowns: SISTER_TOWNS.map(({ id, name }) => ({ id, name })),
    editions: NOUNS_MONEY_EDITIONS,
    noteForKind: NOTE_FOR_KIND,
    unlocks: PROFILE_UNLOCKS,
    chain: {
      lineSchema: POINTS_SCHEMA,
      genesis: POINTS_GENESIS,
      id: 'sha256 of canonicalLine(line): JSON array [schema, prev, profile, kind, points, note, edition, site, ref, day, place, at]',
      anchor: 'Not on chain yet. A later step can publish each profile chain head to Tezos; the line format does not change.',
    },
    endpoints: {
      rules: 'https://pointcast.xyz/points.json',
      schema: 'https://pointcast.xyz/points/schema.json',
      summary: 'https://pointcast.xyz/api/points?profile={id}',
      ledger: 'https://pointcast.xyz/api/points?profile={id}&lines=1',
      recent: 'https://pointcast.xyz/api/points?recent=1',
    },
    privacy: 'Members join the open ledger by choice from /me. A profile id is an opaque hash; a name shows only if the member sets one. Places are coarse town names, never GPS.',
    disclosure: DISCLOSURE,
    license: 'CC0-1.0',
  };
}
