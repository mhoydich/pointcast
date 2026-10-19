import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import schedule from '../src/data/courts-schedule.json' with { type: 'json' };
import { dropinOccurrences, laOffset } from '../functions/_lib/courts-feed.mjs';

// The /pickleball JSON-LD, Field Reports v2 (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §7.9, §7.10).
// The page is Astro, so the source is read as text and the occurrence rules
// run through the plain helper in functions/_lib/courts-feed.mjs; when a
// built dist/pickleball/index.html exists, the rendered JSON-LD is checked too.
const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const page = await read('src/pages/pickleball.astro');
const courtCard = await read('src/components/courts/CourtCard.astro');

const verifiedDropins = (court) => court.blocks.filter((b) => b.kind === 'dropin' && b.confidence === 'verified');
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const weekdayOf = (day) => new Date(`${day}T12:00:00Z`).getUTCDay();

test('source: every Event says EventScheduled, and there is no TennisComplex and no Court Call Event', () => {
  assert.match(page, /const EVENT_SCHEDULED = 'https:\/\/schema\.org\/EventScheduled'/);
  const events = page.match(/'@type': 'Event'/g) ?? [];
  const statuses = page.match(/eventStatus: EVENT_SCHEDULED/g) ?? [];
  assert.equal(events.length, 1, 'the dated Event only: a weekly eventSchedule Event has no top-level startDate');
  assert.doesNotMatch(page, /'@type': 'Schedule'|eventSchedule:/, 'no schedule-form Event for the Rich Results Test to flag');
  assert.equal(statuses.length, events.length, 'eventStatus on every Event');
  assert.doesNotMatch(page, /TennisComplex/);
  assert.match(page, /'@type': 'SportsActivityLocation'/);
  const ld = page.slice(page.indexOf('function courtEntity'), page.indexOf('const jsonLd'));
  assert.doesNotMatch(ld, /courtCall|Court Call/i, 'a Court Call is not a sourced session');
});

test('source: dated occurrences come from the shared helper, for verified drop-ins only, over 14 days from the build day', () => {
  assert.match(page, /import \{ dropinOccurrences \} from '\.\.\/\.\.\/functions\/_lib\/courts-feed\.mjs'/);
  assert.match(page, /const OCCURRENCE_DAYS = 14/);
  assert.match(page, /const dropins = court\.blocks\.filter\(\(b\) => b\.kind === 'dropin' && b\.confidence === 'verified' && sourcedTag\(b, buildDay\)\.tag === null\)/, 'verified and checked under 45 days ago');
  assert.match(page, /dropins\.flatMap\(\(b\) => dropinOccurrences\(b, buildDay, OCCURRENCE_DAYS\)/);
  assert.match(page, /startDate: o\.start,\s+endDate: o\.end,/);
  assert.match(page, /location: postal \? \{ '@type': 'Place', name: court\.name, address: postal \} : \{ '@id': id \}/, 'a Place with the verified address, else the court id');
  assert.match(page, /if \(address\) \{[\s\S]*?postal = \{ '@type': 'PostalAddress'/, 'the address is the verified one only');
  assert.match(page, /\(f\) => f\.key === 'address' && f\.confidence === 'verified'/);
  assert.match(page, /\.\.\.\(b\.fee \? \{ isAccessibleForFree: false, offers: feeOffer\(b\.fee\) \} : \{\}\)/);
  assert.match(page, /const buildDay = new Intl\.DateTimeFormat\('en-CA', \{ timeZone: 'America\/Los_Angeles'/);
});

test('helper: the offset is -07:00 up to Oct 31 and -08:00 from Nov 1', () => {
  assert.equal(laOffset('2026-10-31'), '-07:00');
  assert.equal(laOffset('2026-11-01'), '-08:00');
  const anyOpen = { days: [0, 1, 2, 3, 4, 5, 6], start: '17:00', end: '19:00', from: null, until: null };
  for (const o of dropinOccurrences(anyOpen, '2026-10-28', 14)) {
    assert.match(o.start, o.date < '2026-11-01' ? /-07:00$/ : /-08:00$/, o.date);
    assert.match(o.end, o.date < '2026-11-01' ? /-07:00$/ : /-08:00$/, o.date);
  }
});

test('real schedule: from Oct 18 the El Segundo blocks give dated sessions up to Oct 26-31 and none after', () => {
  const es = schedule.courts.find((c) => c.id === 'el-segundo');
  const dates = verifiedDropins(es).flatMap((b) => dropinOccurrences(b, '2026-10-18', 14).map((o) => [b.until, o.date]));
  assert.ok(dates.length > 0);
  for (const [until, date] of dates) assert.ok(date <= until, `${date} is after the block's until ${until}`);
  // A build on Nov 2 is past every El Segundo season: no dated session at all.
  assert.deepEqual(verifiedDropins(es).flatMap((b) => dropinOccurrences(b, '2026-11-02', 14)), []);
  // Standing weekly blocks (no season) keep publishing, and cross the clock change with the right offset.
  const mh = schedule.courts.find((c) => c.id === 'manhattan-heights');
  const standing = verifiedDropins(mh).flatMap((b) => dropinOccurrences(b, '2026-10-28', 14));
  assert.ok(standing.some((o) => o.date < '2026-11-01') && standing.some((o) => o.date >= '2026-11-01'));
  for (const o of standing) assert.equal(o.start.slice(-6), o.date < '2026-11-01' ? '-07:00' : '-08:00');
});

test('visible text: a block\'s season, times, days and fee are all printed by CourtCard, so the JSON-LD says nothing the page does not', () => {
  assert.match(courtCard, /const season = seasonText\(b\.from, b\.until\)/);
  assert.match(courtCard, /\$\{season \? ` · \$\{season\}` : ''\}/);
  assert.match(courtCard, /const fee = b\.fee \? ` · \$\{b\.fee\}` : ''/);
  assert.match(courtCard, /\$\{b\.label\} · \$\{daysText\(b\.days\)\} \$\{time\}/);
  assert.match(courtCard, /\{fact\.text\}/, 'facts, including the verified address, are printed');
  // Only verified blocks and hours are published; partial and unverified ones are tagged text, never JSON-LD.
  assert.match(page, /court\.hours && court\.hours\.confidence === 'verified'/);
});

test('public/llms.txt: exactly one Courts feed line, right after the MCP line, absolute links, under the cap', async () => {
  const text = await read('public/llms.txt');
  const lines = text.split('\n');
  const mcp = lines.findIndex((l) => l.startsWith('- [MCP](https://pointcast.xyz/api/mcp):'));
  assert.ok(mcp >= 0);
  assert.equal(lines[mcp + 1], '- [Courts feed](https://pointcast.xyz/courts.json): Sourced South Bay pickleball courts: hours, drop-in sessions and fees, each with its source and checked date, and an hours confidence (verified, posted-sign, reported or unknown).');
  assert.equal(lines.filter((l) => l.includes('/courts.json')).length, 1);
  assert.ok(lines.length < 320, `${lines.length} lines; tests/agent-surfaces.test.mjs caps the file under 320`);
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) assert.match(m[1], /^https?:\/\//, `link ${m[1]} is absolute`);
});

/* ---------- the built page, when there is one ---------- */

const builtPath = process.env.PICKLEBALL_HTML ? new URL(process.env.PICKLEBALL_HTML, `file://${process.cwd()}/`) : new URL('dist/pickleball/index.html', root);
test('dist: the rendered JSON-LD has eventStatus on every Event, no TennisComplex, and dated sessions that fit their blocks', { skip: !existsSync(builtPath) }, async () => {
  const html = await readFile(builtPath, 'utf8');
  const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  assert.ok(blocks.length > 0);
  assert.doesNotMatch(JSON.stringify(blocks), /TennisComplex/);
  const events = [];
  const walk = (v) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === 'object') {
      if (v['@type'] === 'Event') events.push(v);
      Object.values(v).forEach(walk);
    }
  };
  walk(blocks);
  assert.ok(events.length > 0);
  for (const e of events) assert.equal(e.eventStatus, 'https://schema.org/EventScheduled', e.name);
  for (const e of events) assert.ok(e.startDate && e.endDate, `${e.name}: every Event has a top-level startDate and endDate`);
  const courts = new Map(schedule.courts.map((c) => [c.name, c]));
  for (const e of events.filter((x) => x.startDate)) {
    const cut = e.name.lastIndexOf(' · '); // a label may hold " · " itself ("Drop-in · 7 courts")
    const court = courts.get(e.name.slice(cut + 3));
    assert.ok(court, `${e.name}: a listed court`);
    const date = e.startDate.slice(0, 10);
    assert.match(date, DAY_RE);
    assert.equal(e.startDate.slice(-6), laOffset(date), `${e.name} ${date}: the LA offset`);
    assert.equal(e.endDate.slice(0, 10), date);
    const label = e.name.slice(0, cut);
    const fits = verifiedDropins(court).some((b) => b.label === label && b.days.includes(weekdayOf(date))
      && (!b.from || date >= b.from) && (!b.until || date <= b.until)
      && e.startDate.slice(11, 16) === b.start && e.endDate.slice(11, 16) === b.end);
    assert.ok(fits, `${e.name} ${e.startDate}: matches a verified block, inside its season`);
    if (e.location['@type'] === 'Place') assert.equal(e.location.address['@type'], 'PostalAddress', `${e.name}: a Place carries the verified address`);
    else assert.match(e.location['@id'], /^https:\/\/pointcast\.xyz\/pickleball#/);
  }
});
