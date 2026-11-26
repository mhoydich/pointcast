// Fictional demo roster, venues and ledger for the Communicator. No real people: every name,
// handle and contact field below is made up (contact fields use the reserved .invalid domain and
// 555 numbers on purpose, so tests can prove they never leak into a Message or a public view).
import * as L from './ledger.mjs';

export const DEMO_NOW = '2026-11-10T18:00:00-08:00'; // a Tuesday, so "Thursday" is 2026-11-12
const LADDER = L.DEFAULT_LADDER.id;

export const DEMO_VENUES = [
  {
    id: 'el-segundo', name: 'El Segundo Recreation Park courts', short: 'Rec Park', town: 'el-segundo',
    address: '401 Sheldon St, El Segundo', hours: { open: '08:00', close: '22:00' },
    blocks: [
      { label: 'Advanced drop-in $5', days: [1], start: '17:00', end: '19:00' },
      { label: 'Advanced drop-in', days: [5], start: '09:00', end: '12:00' },
      { label: '3.0 drop-in', days: [0, 6], start: '09:00', end: '12:00' },
      { label: '3.5 drop-in', days: [0, 6], start: '15:00', end: '17:00' },
    ],
    reserve: { label: 'Book on Rec', url: 'https://www.rec.us/organizations/el-segundo-recreation' },
    courts: 8, aliases: ['rec park', 'rec', 'recreation park'],
  },
  {
    id: 'manhattan-heights', name: 'Manhattan Heights Park courts', short: 'Heights', town: 'manhattan-beach',
    address: '1 Example Way, Manhattan Beach', hours: { open: '08:00', close: '21:00' }, blocks: [],
    reserve: null, courts: 4, aliases: ['heights', 'manhattan heights'],
  },
];

// Availability helpers: Thursday evening, or some other slot that does not cover it.
const THU = [{ days: [4], start: '17:00', end: '21:00' }];
const WED = [{ days: [3], start: '17:00', end: '21:00' }];
const SAT = [{ days: [6], start: '09:00', end: '12:00' }];

// [handle, display, declared, availability, venues, consent, recent, contact]
const ROWS = [
  ['mike', 'Mike H.', 4.0, THU, ['el-segundo'], true, 3, 'mike@example.invalid', '310-555-0100'],
  ['ada-r', 'Ada R.', 4.0, THU, ['el-segundo', 'manhattan-heights'], true, 2, 'ada@example.invalid', '310-555-0101'],
  ['bo-t', 'Bo T.', 4.0, THU, ['el-segundo'], true, 0, 'bo@example.invalid', '310-555-0102'],
  ['cy-l', 'Cy L.', 4.0, THU, ['el-segundo'], true, 4, 'cy@example.invalid', '310-555-0103'],
  ['dee-m', 'Dee M.', 4.5, THU, ['el-segundo'], true, 1, 'dee@example.invalid', '310-555-0104'],
  ['eli-p', 'Eli P.', 4.0, [...THU, ...WED], ['el-segundo'], true, 1, 'eli@example.invalid', '310-555-0105'],
  ['fay-k', 'Fay K.', 4.0, THU, ['el-segundo'], true, 0, 'fay@example.invalid', '310-555-0106'],
  ['gus-o', 'Gus O.', 4.0, THU, ['el-segundo'], false, 0, 'gus@example.invalid', '310-555-0107'], // no communicator consent
  ['hal-n', 'Hal N.', 4.0, THU, ['el-segundo'], true, 1, 'hal@example.invalid', '310-555-0108'], // self-declared only
  ['ivy-s', 'Ivy S.', 3.5, THU, ['el-segundo'], true, 1, 'ivy@example.invalid', '310-555-0109'], // 3.5 Settled, outside a 4.0 band
  ['jo-w', 'Jo W.', 4.0, THU, ['manhattan-heights'], true, 2, 'jo@example.invalid', '310-555-0110'], // heights only
  ['kit-b', 'Kit B.', 4.0, SAT, ['el-segundo'], false, 0, 'kit@example.invalid', '310-555-0111'], // no consent
  ['lou-f', 'Lou F.', 4.0, THU, ['manhattan-heights'], true, 0, 'lou@example.invalid', '310-555-0112'], // heights only
];

export const DEMO_PROFILES = ROWS.map(([handle, display, declared, availability, venues, consent, gamesLast30, email, phone], i) => ({
  schema: 'coordination/profile/1', id: L.stableId('cp_', handle, 10), handle, display, town: 'el-segundo',
  identity: { tier: i % 4, proofs: [{ provider: 'key', verifiedAt: '2026-01-15T00:00:00Z' }] },
  contact: { email, phone },
  channels: { sms: true, email: true, push: false, quietHours: { start: '21:00', end: '08:00' } },
  consent: { communicator: consent, contactableBy: consent ? ['ladder-peers'] : [], listed: true },
  ladders: { [LADDER]: { declared } },
  availability, venues,
  recent: { gamesLast30, lastInvitedAt: gamesLast30 > 2 ? '2026-11-08T12:00:00Z' : i % 2 ? '2026-10-20T12:00:00Z' : null },
}));

// ---- ledger: organizer finishes and confirmed games ----------------------------------------
let n = 0;
const nextId = () => L.stableId('le_', `demo-${++n}`);
const finish = (handle, at, level, place, draw, event) => ({
  id: nextId(), schema: 'coordination/ledger-entry/1', ladder: LADDER, kind: 'finish', at,
  sides: [{ players: [handle] }], place, draw, level, event,
  source: { kind: 'organizer', ref: `https://example.invalid/events/${event}` }, confirmations: [], status: 'confirmed', dispute: null,
});
const game = (at, a, sa, b, sb) => ({
  id: nextId(), schema: 'coordination/ledger-entry/1', ladder: LADDER, kind: 'game', at,
  sides: [{ players: a, score: sa }, { players: b, score: sb }], source: { kind: 'communicator', ref: `demo-g${n}` },
  confirmations: [{ by: a[0], side: 0, at }, { by: b[0], side: 1, at }], status: 'confirmed', dispute: null,
});
const finishes = (handle, level, place, count, draw = 8) =>
  Array.from({ length: count }, (_, i) => finish(handle, `2026-0${3 + i}-1${i}T20:00:00Z`, level, place, draw, `demo-open-${handle}-${i}`));

export const DEMO_LADDER = [
  ...finishes('mike', 4.0, 3, 2), ...finishes('ada-r', 4.0, 3, 3), ...finishes('bo-t', 4.0, 2, 3),
  ...finishes('cy-l', 4.0, 3, 1), ...finishes('dee-m', 4.5, 3, 1), ...finishes('eli-p', 4.0, 3, 2),
  ...finishes('fay-k', 4.0, 2, 1), ...finishes('gus-o', 4.0, 3, 3), ...finishes('ivy-s', 3.5, 3, 3),
  ...finishes('jo-w', 4.0, 3, 2), ...finishes('lou-f', 4.0, 3, 1),
  // hal-n: no results at all, so the rating is Self-declared. kit-b: none either.
  game('2026-09-05T02:00:00Z', ['ada-r', 'bo-t'], 11, ['cy-l', 'eli-p'], 7),
  game('2026-09-12T02:00:00Z', ['ada-r', 'cy-l'], 11, ['bo-t', 'eli-p'], 9),
  game('2026-09-19T02:00:00Z', ['bo-t', 'eli-p'], 11, ['ada-r', 'mike'], 6),
  game('2026-09-26T02:00:00Z', ['mike', 'fay-k'], 11, ['cy-l', 'dee-m'], 8),
  game('2026-10-03T02:00:00Z', ['ada-r', 'mike'], 11, ['bo-t', 'fay-k'], 10),
  game('2026-10-10T02:00:00Z', ['bo-t', 'cy-l'], 11, ['ada-r', 'eli-p'], 4),
  game('2026-10-17T02:00:00Z', ['ada-r', 'eli-p'], 11, ['mike', 'fay-k'], 9),
];

// Ratings for everyone, computed once from the demo ledger. Two passes: the first gives the walk
// a sensible value for other players (their declared level), the second is what the UI would show.
const declaredOf = (p) => p.ladders[LADDER].declared;
const seedMap = Object.fromEntries(DEMO_PROFILES.map((p) => [p.handle, declaredOf(p)]));
export const DEMO_RATINGS = Object.fromEntries(DEMO_PROFILES.map((p) => [
  p.handle, L.rate(p.handle, { entries: DEMO_LADDER, declared: declaredOf(p), now: DEMO_NOW, ratings: seedMap }),
]));
