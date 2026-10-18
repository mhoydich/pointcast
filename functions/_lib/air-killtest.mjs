// The Field Reports kill test, counted honestly: on-site answers to a spot's
// main question by people, Sep 28 to Oct 23, 2026, Fridays left out (the PRD's
// strict count: Friday is the Court Call), read on Sat Oct 24.
// Pure; the rows come from functions/_lib/air-count-store.ts
// (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §3.2, §7).
//
// The result is numbers, booleans and the two window dates only. `who`
// (COALESCE(user_id, pid_hash)), `pid` and `uid` are used for distinct
// counting inside killTestCount and never leave it.

import { STALE_MS, kindOf, kindRole } from './air-kinds.mjs';
import { isoSec, laDate } from './air-reading.mjs';
import { isHouseRow } from './air-house.mjs';

export const KILL_TEST = Object.freeze({ from: '2026-09-28', to: '2026-10-23', readOn: '2026-10-24', minReports: 10, minPeople: 3 });
/**
 * How long after midnight Oct 24 the read waits: a report observed before
 * midnight may land up to STALE_MS later (the client queue), and the API is
 * edge-cached 60 s.
 */
export const READ_GRACE_MS = STALE_MS + 60_000;
export const FREEZE_LINE = 'The game layer freezes: no new mechanics; the edition, the courts board and the early shift keep running.';
/** The rules, one plain sentence each, printed on /r/how as an ordered list in this order. */
export const KILL_TEST_RULES = Object.freeze([
  'A report counts when a person answers a spot’s main question while at the spot: how many are waiting at a court, or the fog at the beach.',
  'At the spot means the report carried the spot’s code. The code is shared at the court and by link, and we cannot tell where a phone is; a report without the code does not count.',
  'Side questions do not count: parking, the court vibe and desk questions.',
  'One report per person per spot per half hour. A person is a signed-in account, or a browser when signed out; a browser’s signed-out reports count as its account once it signs in there.',
  'Agents never count. The early shift files its rows as agents, and they print grey.',
  'House phones and house accounts never count. Any account with the broadcaster or director role is house, and so is every phone marked as a house phone.',
  'Marking a phone as house also takes its earlier reports out of the count. The mark is kept per browser, so it is made in each browser that has filed reports.',
  'Reports removed as spam never count.',
  'Friday reports are left out. Friday is the Court Call; the test asks about the other six days.',
  'The window is Mon Sep 28 to Fri Oct 23, 2026, by El Segundo dates.',
  'The test passes with 10 or more non-Friday reports from 3 or more people.',
  'The result is read on Sat Oct 24, once the last Oct 23 reports have had time to land, and that read is kept as it was. If the test does not pass, the game layer freezes: no new mechanics; the edition, the courts board and the early shift keep running.',
  'The count is numbers only: no names, no times, no phones.',
]);

/** Whether spot+kind is the spot's main (live) question. Unknown spot or kind → false. */
export function countedKind(config, spot, kind) {
  const cfg = kindOf(config, spot, kind);
  return cfg != null && kindRole(cfg) === 'live';
}

const onsite = (v) => v === 1 || v === true || v === '1' || v === 1n;

/** Whether an El Segundo date ('YYYY-MM-DD') is a Friday. */
export function isFriday(day) {
  const [y, m, d] = String(day).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay() === 5;
}

const nonEmpty = (v) => typeof v === 'string' && v !== '';

/**
 * rows: {spot, kind, day, slot, who, pid, uid, onsite, source, status, house_pid, house_user, user_payload}.
 * Keeps source 'page', status 'ok', on site, KILL_TEST.from <= day <= KILL_TEST.to,
 * not a Friday, the spot's live kind, not house, and a non-empty `who`; one
 * report per person|spot|kind|slot.
 *
 * A person is the account when the row has one. A signed-out row (uid empty)
 * whose pid was also seen signed in counts as that account, so one person who
 * reported as a guest and later signed in is one person, not two; and when
 * that account is house by account (its role or its user row on the house
 * list), the guest rows are house too. Rows without `pid`/`uid` fall back to `who`.
 * → {window: {from, to}, needs: {reports, people}, reports, people, pass, final, asOf}
 */
export function killTestCount(config, rows, now) {
  const list = (Array.isArray(rows) ? rows : []).filter((r) => r && typeof r === 'object');
  const pidUser = new Map();
  const houseUsers = new Set();
  for (const r of list) {
    if (!nonEmpty(r.uid)) continue;
    if (nonEmpty(r.pid) && !pidUser.has(r.pid)) pidUser.set(r.pid, r.uid);
    if (isHouseRow({ house_user: r.house_user, user_payload: r.user_payload })) houseUsers.add(r.uid);
  }
  const personOf = (r) => {
    if (nonEmpty(r.uid)) return r.uid;
    if (nonEmpty(r.pid) && pidUser.has(r.pid)) return pidUser.get(r.pid);
    return r.who;
  };
  const seen = new Set();
  const people = new Set();
  for (const r of list) {
    if (r.source !== 'page' || r.status !== 'ok' || !onsite(r.onsite)) continue;
    if (typeof r.day !== 'string' || r.day < KILL_TEST.from || r.day > KILL_TEST.to) continue;
    if (isFriday(r.day)) continue;
    if (!countedKind(config, r.spot, r.kind)) continue;
    if (!nonEmpty(r.who)) continue;
    if (isHouseRow(r)) continue;
    const person = personOf(r);
    if (!nonEmpty(person) || houseUsers.has(person)) continue;
    const key = `${person}|${r.spot}|${r.kind}|${r.slot}`;
    if (seen.has(key)) continue;
    seen.add(key);
    people.add(person);
  }
  const reports = seen.size;
  const persons = people.size;
  return {
    window: { from: KILL_TEST.from, to: KILL_TEST.to },
    needs: { reports: KILL_TEST.minReports, people: KILL_TEST.minPeople },
    reports,
    people: persons,
    pass: reports >= KILL_TEST.minReports && persons >= KILL_TEST.minPeople,
    final: laDate(now - READ_GRACE_MS) >= KILL_TEST.readOn,
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

/** "1 report from 1 person so far. The test needs 10 non-Friday reports from 3 people, Sep 28 to Oct 23." */
export function countLine(c) {
  const reports = num(c?.reports);
  const people = num(c?.people);
  return `${reports} ${reportsWord(reports)} from ${people} ${peopleWord(people)} so far. `
    + `The test needs ${KILL_TEST.minReports} non-Friday reports from ${KILL_TEST.minPeople} people, `
    + `${shortDate(KILL_TEST.from)} to ${shortDate(KILL_TEST.to)}.`;
}

/**
 * '' unless c.final. Pass: "The read, Sat Oct 24: passed, with 12 non-Friday reports from 4 people."
 * Fail: "The read, Sat Oct 24: not passed. 1 non-Friday report from 1 person, short of 10 from 3. " + FREEZE_LINE
 * A later live figure that differs (c.recount) follows as "A recount now shows ...".
 */
export function readLine(c) {
  if (c?.final !== true) return '';
  const reports = num(c.reports);
  const people = num(c.people);
  const head = `The read, ${shortDate(KILL_TEST.readOn, true)}:`;
  const rc = c.recount;
  const recount = rc && typeof rc === 'object' && Number.isFinite(rc.reports) && Number.isFinite(rc.people)
    ? ` A recount now shows ${rc.reports} ${reportsWord(rc.reports)} from ${rc.people} ${peopleWord(rc.people)}; the read stands.`
    : '';
  if (c.pass === true) return `${head} passed, with ${reports} non-Friday ${reportsWord(reports)} from ${people} ${peopleWord(people)}.${recount}`;
  return `${head} not passed. ${reports} non-Friday ${reportsWord(reports)} from ${people} ${peopleWord(people)}, `
    + `short of ${KILL_TEST.minReports} from ${KILL_TEST.minPeople}. ${FREEZE_LINE}${recount}`;
}
