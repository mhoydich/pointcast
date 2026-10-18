// The Field Reports kill test, counted honestly: on-site answers to a spot's
// main question by people, Sep 28 to Oct 23, 2026, read on Sat Oct 24.
// Pure; the rows come from functions/_lib/air-count-store.ts
// (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §3.2, §7).
//
// The result is numbers, booleans and the two window dates only. `who`
// (COALESCE(user_id, pid_hash)) is used for distinct counting inside
// killTestCount and never leaves it.

import { kindOf, kindRole } from './air-kinds.mjs';
import { isoSec, laDate } from './air-reading.mjs';
import { isHouseRow } from './air-house.mjs';

export const KILL_TEST = Object.freeze({ from: '2026-09-28', to: '2026-10-23', readOn: '2026-10-24', minReports: 10, minPeople: 3 });
export const FREEZE_LINE = 'The game layer freezes: no new mechanics; the edition, the courts board and the early shift keep running.';
/** The rules, one plain sentence each, printed on /r/how as an ordered list in this order. */
export const KILL_TEST_RULES = Object.freeze([
  'A report counts when a person answers a spot’s main question while at the spot: how many are waiting at a court, or the fog at the beach.',
  'At the spot means the phone opened the spot’s page with that day’s code. A report filed from away does not count.',
  'Side questions do not count: parking, the court vibe and desk questions.',
  'One report per person per spot per half hour. A person is a signed-in account, or a phone when signed out.',
  'Agents never count. The early shift files its rows as agents, and they print grey.',
  'House phones and house accounts never count. Any account with the broadcaster or director role is house, and so is every phone marked as a house phone.',
  'Marking a phone as house also takes its earlier reports out of the count.',
  'Reports removed as spam never count.',
  'The window is Mon Sep 28 to Fri Oct 23, 2026, by El Segundo dates.',
  'The test passes with 10 or more reports from 3 or more people.',
  'The result is read on Sat Oct 24. If the test does not pass, the game layer freezes: no new mechanics; the edition, the courts board and the early shift keep running.',
  'The count is numbers only: no names, no times, no phones.',
]);

/** Whether spot+kind is the spot's main (live) question. Unknown spot or kind → false. */
export function countedKind(config, spot, kind) {
  const cfg = kindOf(config, spot, kind);
  return cfg != null && kindRole(cfg) === 'live';
}

const onsite = (v) => v === 1 || v === true || v === '1' || v === 1n;

/**
 * rows: {spot, kind, day, slot, who, onsite, source, status, house_pid, house_user, user_payload}.
 * Keeps source 'page', status 'ok', on site, KILL_TEST.from <= day <= KILL_TEST.to,
 * the spot's live kind, not house, and a non-empty `who`; one report per
 * who|spot|kind|slot.
 * → {window: {from, to}, needs: {reports, people}, reports, people, pass, final, asOf}
 */
export function killTestCount(config, rows, now) {
  const seen = new Set();
  const people = new Set();
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r || typeof r !== 'object') continue;
    if (r.source !== 'page' || r.status !== 'ok' || !onsite(r.onsite)) continue;
    if (typeof r.day !== 'string' || r.day < KILL_TEST.from || r.day > KILL_TEST.to) continue;
    if (!countedKind(config, r.spot, r.kind)) continue;
    if (typeof r.who !== 'string' || r.who === '') continue;
    if (isHouseRow(r)) continue;
    const key = `${r.who}|${r.spot}|${r.kind}|${r.slot}`;
    if (seen.has(key)) continue;
    seen.add(key);
    people.add(r.who);
  }
  const reports = seen.size;
  const persons = people.size;
  return {
    window: { from: KILL_TEST.from, to: KILL_TEST.to },
    needs: { reports: KILL_TEST.minReports, people: KILL_TEST.minPeople },
    reports,
    people: persons,
    pass: reports >= KILL_TEST.minReports && persons >= KILL_TEST.minPeople,
    final: laDate(now) >= KILL_TEST.readOn,
    asOf: isoSec(now),
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** '2026-10-24' → 'Oct 24'; with weekday → 'Sat Oct 24'. */
function shortDate(day, weekday = false) {
  const [y, m, d] = day.split('-').map(Number);
  const md = `${MONTHS[m - 1]} ${d}`;
  return weekday ? `${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${md}` : md;
}

const reportsWord = (n) => (n === 1 ? 'report' : 'reports');
const peopleWord = (n) => (n === 1 ? 'person' : 'people');
const num = (v) => (Number.isFinite(v) ? v : 0);

/** "1 report from 1 person so far. The test needs 10 reports from 3 people, Sep 28 to Oct 23." */
export function countLine(c) {
  const reports = num(c?.reports);
  const people = num(c?.people);
  return `${reports} ${reportsWord(reports)} from ${people} ${peopleWord(people)} so far. `
    + `The test needs ${KILL_TEST.minReports} reports from ${KILL_TEST.minPeople} people, `
    + `${shortDate(KILL_TEST.from)} to ${shortDate(KILL_TEST.to)}.`;
}

/**
 * '' unless c.final. Pass: "The read, Sat Oct 24: passed, with 12 reports from 4 people."
 * Fail: "The read, Sat Oct 24: not passed. 1 report from 1 person, short of 10 from 3. " + FREEZE_LINE
 */
export function readLine(c) {
  if (c?.final !== true) return '';
  const reports = num(c.reports);
  const people = num(c.people);
  const head = `The read, ${shortDate(KILL_TEST.readOn, true)}:`;
  if (c.pass === true) return `${head} passed, with ${reports} ${reportsWord(reports)} from ${people} ${peopleWord(people)}.`;
  return `${head} not passed. ${reports} ${reportsWord(reports)} from ${people} ${peopleWord(people)}, `
    + `short of ${KILL_TEST.minReports} from ${KILL_TEST.minPeople}. ${FREEZE_LINE}`;
}
