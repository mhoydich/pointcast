import assert from 'node:assert/strict';
import test from 'node:test';

import config from '../src/data/air-spots.json' with { type: 'json' };
import calendar from '../src/data/paddle-calendar.json' with { type: 'json' };
import register from '../src/data/paddle-register.json' with { type: 'json' };
import news from '../src/data/front-door-news.json' with { type: 'json' };
import { NET, formatMhz } from '../src/lib/band.ts';
import { guestByline, kindOf } from '../functions/_lib/air-kinds.mjs';
import { editionSkyLine, editionTideLine } from '../functions/_lib/air-desk.mjs';
import {
  CUTOFF_MINUTE, EDITION_TTL, FIRST_EDITION, FOOTER_LINE, NIGHTLY_NET, SHOP_DISCLOSURE, SLOTS,
  addDays, canFreeze, composeEdition, cutoffMs, editionDate, editionMasthead, editionNumber, editionText, editionTitle,
  feedDates, freezeEdition, isEditionDate, isThcItem, momentOf, nameList, parseEditionParam, pickPrice, pickShop, pickTown,
  reportersLine, toJsonFeed,
} from '../functions/_lib/morning.mjs';

// The pickers below run on No. 1 (Sat 3 Oct 2026), where a front-door note under 7 days old outranks
// Shortwave. Use only notes filed more than a week before it, so a launch note filed later doesn't
// change what that date expects.
const newsBeforeNo1 = news.filter((n) => n.date < '2026-09-26');

const MIN = 60_000;
const COURTS = kindOf(config, 'courts', 'wait');
const BEACH = kindOf(config, 'beach', 'fog');
const SAT = '2026-10-03'; // No. 1
const FRI_741 = Date.parse('2026-10-02T14:41:00Z'); // Fri 7:41 AM PDT
const SAT_631 = Date.parse('2026-10-03T13:31:00Z'); // Sat 6:31 AM PDT
const SAT_553 = '2026-10-03T12:53:00.000Z'; // KLAX 5:53 AM PDT
const KLAX = { underTheLayerNow: true, observedAt: SAT_553 };
/** A 5:53 AM KLAX preview on the edition's own morning. */
const klaxOn = (date) => ({ underTheLayerNow: true, observedAt: new Date(cutoffMs(date) - 52 * MIN).toISOString() });
const SLOT_KEYS = ['bylines', 'fallback', 'id', 'label', 'line', 'reportIds', 'source'];
const rid = (n) => `ar_${String(n).padStart(20, '0')}`;
const moment = (over = {}) => ({ value: '1-4', at: FRI_741, support: 5, bylines: ['@mike', 'Guest 4471', '@sam', '@jen', 'Guest 2210'], reportIds: [rid(1), rid(2), rid(3)], ...over });
const byId = (edition, id) => edition.slots.find((s) => s.id === id);
const full = (date = SAT) => ({
  sky: { marine: klaxOn(date), beach: { value: 'none', at: SAT_631, support: 1, bylines: ['@jen'], reportIds: [rid(9)] } },
  courts: { yesterday: moment(), lastWeek: moment({ value: '5-8', at: Date.parse('2026-09-25T14:38:00Z'), support: 3, reportIds: [rid(7)] }) },
  price: pickPrice({ releases: calendar.releases, changes: register.changes, paddles: register.backfill, date: SAT }),
  town: { kind: 'news', label: 'Field Reports', line: 'Two stations are on the air.', link: '/r', date: '2026-10-02' },
  pick: { blockId: '0612', title: 'Drum Party' },
  shop: pickShop({ paddles: [...calendar.releases, ...register.backfill], date: SAT, exclude: ['gearbox-pressure-x'] }),
});

test('editionDate: 06:44 LA is still yesterday\'s edition, 06:45 is today\'s', () => {
  assert.equal(editionDate(Date.parse('2026-10-03T13:44:59Z')), '2026-10-02', '6:44:59 AM PDT');
  assert.equal(editionDate(Date.parse('2026-10-03T13:45:00Z')), '2026-10-03', '6:45 AM PDT');
  assert.equal(editionDate(new Date('2026-10-03T13:45:00Z')), '2026-10-03', 'a Date works too');
  assert.equal(editionDate(Date.parse('2026-10-03T07:00:00Z')), '2026-10-02', 'midnight to 6:44 is the day before');
  assert.equal(editionDate(Date.parse('2026-10-04T06:59:00Z')), '2026-10-03', '11:59 PM is still the day');
  assert.equal(CUTOFF_MINUTE, 6 * 60 + 45);
});

test('editionDate: the cutoff follows the clocks across DST (ends 2026-11-01, starts 2027-03-14)', () => {
  // Sun Nov 1 2026: PST from 2 AM, so 6:45 AM is 14:45Z, not 13:45Z.
  assert.equal(editionDate(Date.parse('2026-11-01T13:45:00Z')), '2026-10-31', '5:45 AM PST is before the cutoff');
  assert.equal(editionDate(Date.parse('2026-11-01T14:44:00Z')), '2026-10-31', '6:44 AM PST');
  assert.equal(editionDate(Date.parse('2026-11-01T14:45:00Z')), '2026-11-01', '6:45 AM PST');
  assert.equal(cutoffMs('2026-10-31'), Date.parse('2026-10-31T13:45:00Z'));
  assert.equal(cutoffMs('2026-11-01'), Date.parse('2026-11-01T14:45:00Z'));
  assert.equal(cutoffMs('2026-11-02'), Date.parse('2026-11-02T14:45:00Z'));
  assert.equal(editionDate(Date.parse('2027-03-14T13:44:00Z')), '2027-03-13', '6:44 AM PDT on the spring-forward day');
  assert.equal(editionDate(Date.parse('2027-03-14T13:45:00Z')), '2027-03-14');
  assert.ok(Number.isNaN(cutoffMs('2026-02-30')));
});

test('editionNumber: No. 1 is Sat 3 Oct 2026; earlier dates are previews (0)', () => {
  assert.equal(FIRST_EDITION, '2026-10-03');
  assert.equal(editionNumber('2026-10-03'), 1);
  assert.equal(editionNumber('2026-10-04'), 2);
  assert.equal(editionNumber('2026-11-01'), 30, 'DST does not skip or repeat a number');
  assert.equal(editionNumber('2026-11-02'), 31);
  assert.equal(editionNumber('2027-10-03'), 366);
  assert.equal(editionNumber('2026-10-02'), 0);
  assert.equal(editionNumber('2026-09-28'), 0);
  assert.equal(editionNumber('nope'), 0);
  assert.equal(editionNumber('2026-13-01'), 0);
  assert.equal(editionTitle('2026-10-03'), 'Morning Edition No. 1 · Sat 3 Oct 2026');
  assert.equal(editionTitle('2026-10-01'), 'Morning Edition Preview · Thu 1 Oct 2026');
  assert.equal(editionMasthead('2026-10-03'), 'MORNING EDITION · No. 1 · SAT 3 OCT 2026 · 6:45 AM');
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.ok(isEditionDate('2026-10-03') && !isEditionDate('2026-10-3') && !isEditionDate('2026-02-29'));
});

test('parseEditionParam and feedDates: ?d= runs from No. 1 to the current edition', () => {
  const now = Date.parse('2026-10-10T15:00:00Z'); // Sat 8:00 AM
  assert.deepEqual(parseEditionParam(null, now), { date: '2026-10-10' });
  assert.deepEqual(parseEditionParam('', now), { date: '2026-10-10' });
  assert.deepEqual(parseEditionParam('2026-10-03', now), { date: '2026-10-03' });
  assert.deepEqual(parseEditionParam('2026-10-10', now), { date: '2026-10-10' });
  assert.equal(parseEditionParam('2026-10-11', now).reason, 'bad-date', 'tomorrow is not out');
  assert.equal(parseEditionParam('2026-10-02', now).reason, 'bad-date', 'before No. 1');
  assert.equal(parseEditionParam('2026-10-10T00:00', now).reason, 'bad-date');
  assert.equal(parseEditionParam('2026-10-10', Date.parse('2026-10-10T13:00:00Z')).reason, 'bad-date', 'before 6:45 the 10th is not out yet');
  assert.deepEqual(feedDates(now), ['2026-10-10', '2026-10-09', '2026-10-08', '2026-10-07', '2026-10-06', '2026-10-05', '2026-10-04']);
  assert.deepEqual(feedDates(Date.parse('2026-10-04T15:00:00Z')), ['2026-10-04', '2026-10-03']);
  assert.deepEqual(feedDates(Date.parse('2026-09-30T15:00:00Z')), ['2026-09-30'], 'before launch the feed carries the preview');
  assert.deepEqual(EDITION_TTL, { frozen: 300, provisional: 60 });
});

test('composeEdition: always seven slots, in order, with the slot shape', () => {
  const cases = [
    { date: SAT, sources: full(), config },
    { date: SAT, sources: {}, config },
    { date: SAT },
    { date: SAT, sources: { sky: 'x', courts: [], price: 7, town: null, pick: { blockId: 12 }, shop: true }, config },
    { date: '2026-09-30', sources: full(), config },
  ];
  for (const input of cases) {
    const e = composeEdition(input);
    assert.equal(e.slots.length, 7);
    assert.deepEqual(e.slots.map((s) => s.id), ['sky', 'courts', 'price', 'town', 'ritual', 'pick', 'shop']);
    assert.deepEqual(e.slots.map((s) => s.label), ['Sky · 6.100', 'Courts · 7.500', 'A price', 'Today in town', 'Daily ritual', 'One pick', 'Shop']);
    for (const s of e.slots) {
      assert.deepEqual(Object.keys(s).sort(), SLOT_KEYS, `${s.id} has exactly the slot keys`);
      assert.ok(typeof s.line === 'string' && s.line.trim().length > 10, `${s.id} is never empty`);
      assert.equal(typeof s.fallback, 'boolean');
      assert.ok(Array.isArray(s.reportIds) && Array.isArray(s.bylines));
    }
    assert.equal(e.footer, FOOTER_LINE);
    assert.equal(FOOTER_LINE, 'Reporters earn points, never cash, and never for what a report says.');
  }
  assert.deepEqual(SLOTS.map((s) => s.id), ['sky', 'courts', 'price', 'town', 'ritual', 'pick', 'shop']);
  assert.throws(() => composeEdition({ date: 'Saturday' }), TypeError);
});

test('composeEdition: zero reports still fills every slot, with fallback where it should', () => {
  const e = composeEdition({ date: SAT, config, sources: { sky: { marine: KLAX, beach: null }, courts: { yesterday: null, lastWeek: null } } });
  const f = Object.fromEntries(e.slots.map((s) => [s.id, s.fallback]));
  assert.deepEqual(f, { sky: false, courts: true, price: true, town: true, ritual: false, pick: true, shop: true },
    'KLAX and the Net are primary sources; the rest ran on their templates');
  assert.equal(byId(e, 'sky').line, 'Under the marine layer at KLAX, 5:53 AM.');
  assert.equal(byId(e, 'sky').source, 'klax-asos');
  assert.equal(byId(e, 'courts').line, 'No reports from the courts yesterday. Next Court Call Fri 7:30 AM on 7.500.');
  assert.equal(byId(e, 'courts').source, 'template');
  assert.match(byId(e, 'shop').line, /No link, no commission\.$/);
  assert.equal(e.provisional, false, 'no reports is not a hole: the store answered');
  assert.deepEqual(e.reporters, []);
  assert.equal(e.more, 0);
  assert.equal(e.reporterLine, '', 'the reporters line hides when nobody reported');
  assert.deepEqual(e.reportIds, []);
  assert.ok(canFreeze(e, cutoffMs(SAT)), 'a quiet day still freezes');
});

test('composeEdition: a single report is labeled "1 reporter"', () => {
  const one = moment({ value: '0', support: 1, bylines: ['Guest 4471'], reportIds: [rid(1)] });
  const e = composeEdition({ date: SAT, config, sources: { sky: { marine: KLAX, beach: null }, courts: { yesterday: one, lastWeek: null } } });
  const courts = byId(e, 'courts');
  assert.equal(courts.line, 'Yesterday 7:41 AM: open · rack empty, walk on, 1 reporter — Guest 4471. Next Court Call Fri 7:30 AM on 7.500.');
  assert.equal(courts.fallback, false);
  assert.deepEqual(courts.reportIds, [rid(1)]);
  assert.deepEqual(courts.bylines, ['Guest 4471']);
  const beach = composeEdition({ date: SAT, config, sources: { sky: { marine: KLAX, beach: { value: 'none', at: SAT_631, support: 1, bylines: ['@jen'], reportIds: [rid(9)] } }, courts: {} } });
  assert.equal(byId(beach, 'sky').line, 'Under the marine layer at KLAX, 5:53 AM. At Grand Ave beach 6:31 AM: can\'t see the pier, 1 reporter — @jen.');
  assert.equal(byId(beach, 'sky').source, 'klax-asos+air');
  assert.equal(beach.reporterLine, 'On the air: @jen', 'a report from this morning is not "yesterday"');
});

test('composeEdition: the full Saturday edition, with bylines and reporters', () => {
  const e = composeEdition({ date: SAT, config, sources: full() });
  assert.equal(e.number, 1);
  assert.equal(e.title, 'Morning Edition No. 1 · Sat 3 Oct 2026');
  assert.equal(e.masthead, 'MORNING EDITION · No. 1 · SAT 3 OCT 2026 · 6:45 AM');
  assert.equal(e.cutoff, '2026-10-03T13:45:00Z');
  assert.equal(e.provisional, false);
  assert.equal(byId(e, 'courts').line,
    'Yesterday 7:41 AM: 1–4 in the rack, 5 agree — @mike, Guest 4471, @sam +2. A week before, Fri 25 Sep 7:38 AM: 5–8 in the rack, 3 agree. Next Court Call Fri 7:30 AM on 7.500.');
  assert.deepEqual(byId(e, 'courts').reportIds, [rid(1), rid(2), rid(3)], 'last week is summarized, not named, so not cited');
  assert.equal(byId(e, 'price').line, 'Gearbox Pressure X shipped Oct 1 at $279.99 MSRP. From the register, no link.');
  assert.equal(byId(e, 'town').line, 'Field Reports: Two stations are on the air.');
  assert.equal(byId(e, 'ritual').line, 'The Nightly Net, 9:00 PM on 7.200: 20 minutes, and net control calls the fox.');
  assert.equal(byId(e, 'pick').line, 'Block 0612: Drum Party.');
  assert.equal(byId(e, 'shop').line, 'Coming in October: RPM Jade, $269.99 MSRP. No link, no commission.');
  assert.deepEqual(e.reporters, ['@jen', '@mike', 'Guest 4471']);
  assert.equal(e.more, 2, '@jen reported at both spots and is counted once');
  assert.equal(e.reporterLine, 'On the air: @jen, @mike, Guest 4471 +2');
  assert.deepEqual(e.reportIds, [rid(9), rid(1), rid(2), rid(3)]);
  assert.equal(reportersLine(['@mike', '@sam', 'Guest 4471', '@a', '@b']), 'On the air yesterday: @mike, @sam, Guest 4471 +2');
  assert.equal(reportersLine([]), '');
  assert.equal(nameList(['@mike', '@sam', 'Guest 4471'], 3, 2), '@mike, @sam, Guest 4471 +2', 'a truncated list keeps its count');
});

test('composeEdition: report numbers fill templates, and free text never becomes the headline', () => {
  const sneaky = composeEdition({
    date: SAT, config, sources: {
      sky: { marine: KLAX, beach: { value: 'OPEN BAR AT THE PIER', at: SAT_631, support: 4, bylines: ['@jen'], reportIds: [rid(9)] } },
      courts: { yesterday: moment({ value: '5-8', label: 'COURTS CLOSED FOREVER', bylines: ['@mike', '<img src=x>', 'Mayor of El Segundo'] }) },
      town: { kind: 'shortwave', text: 'BREAKING: courts closed forever!! see https://spam.example/x now', handle: 'jen', at: '2026-10-03T03:12:00Z' },
      pick: { blockId: '0612', title: 'Drum Party' },
    },
  });
  assert.equal(sneaky.title, 'Morning Edition No. 1 · Sat 3 Oct 2026', 'the title is the date and the number, nothing else');
  assert.equal(sneaky.masthead, 'MORNING EDITION · No. 1 · SAT 3 OCT 2026 · 6:45 AM');
  const sky = byId(sneaky, 'sky');
  assert.ok(!sky.line.includes('OPEN BAR'), 'a bucket the config does not know never prints');
  assert.equal(sky.source, 'klax-asos');
  assert.deepEqual(sky.reportIds, [], 'and cites nobody');
  const courts = byId(sneaky, 'courts');
  assert.match(courts.line, /^Yesterday 7:41 AM: 5–8 in the rack, 5 agree — @mike\. /, 'the config label for the bucket, the count as a number');
  assert.ok(!courts.line.includes('CLOSED') && !courts.line.includes('<img') && !courts.line.includes('Mayor'), 'labels and names that are not bylines are dropped');
  assert.deepEqual(courts.bylines, ['@mike']);
  const town = byId(sneaky, 'town');
  assert.equal(town.line, 'On Shortwave at 8:12 PM: "BREAKING: courts closed forever!! see now" — @jen');
  assert.equal(town.fallback, true);
  assert.deepEqual(town.bylines, [], 'a Shortwave poster is quoted, not a reporter');
  for (const e of [sneaky, composeEdition({ date: SAT, config, sources: full() })]) {
    const [, first] = editionText(e).split('\n')[0].split(': ');
    assert.ok(!/BREAKING|CLOSED|OPEN BAR/.test(e.title + e.masthead + first), 'free text is never the title, masthead or lead');
  }
  // A label is read back only when it is exactly one the config prints.
  const byLabel = composeEdition({ date: SAT, config, sources: { sky: { marine: KLAX }, courts: { yesterday: { at: '07:41', label: '1–4 in the rack', support: 2, bylines: ['@mike', '@sam'], more: 1 } } } });
  assert.equal(byId(byLabel, 'courts').line.split('. ')[0], 'Yesterday 7:41 AM: 1–4 in the rack, 2 agree — @mike, @sam +1', 'the spot page\'s yesterday view works too');
});

test('provisional: a hole in KLAX or the report store is served, never frozen', () => {
  const noKlax = composeEdition({ date: SAT, config, sources: { ...full(), sky: { marine: null, beach: null } } });
  assert.equal(noKlax.provisional, true);
  assert.deepEqual(noKlax.missing, ['klax']);
  assert.equal(byId(noKlax, 'sky').fallback, true);
  assert.equal(byId(noKlax, 'sky').line, 'KLAX has not reported yet; the sky fills in with its next hourly report.');
  const noStore = composeEdition({ date: SAT, config, sources: { ...full(), courts: undefined } });
  assert.equal(noStore.provisional, true);
  assert.deepEqual(noStore.missing, ['reports']);
  assert.equal(byId(noStore, 'courts').fallback, true);
  const stale = composeEdition({ date: SAT, config, sources: { ...full(), sky: { marine: { underTheLayerNow: false, observedAt: '2026-10-02T20:53:00Z' } } } });
  assert.deepEqual(stale.missing, ['klax'], 'a KLAX report from another day is not this edition\'s sky');
  const unknown = composeEdition({ date: SAT, config, sources: { ...full(), sky: { marine: { underTheLayerNow: null, observedAt: null } } } });
  assert.equal(unknown.provisional, true, 'no current report at KLAX is a hole');

  const after = cutoffMs(SAT) + 5 * MIN;
  for (const e of [noKlax, noStore, stale, unknown]) {
    assert.equal(canFreeze(e, after), false);
    assert.equal(freezeEdition(e, after), null);
    assert.equal(canFreeze({ ...e, missing: [] }, after), false, 'the provisional flag alone blocks the freeze');
    const feed = toJsonFeed([{ ...e, frozen: true, frozenAt: after }]);
    assert.equal(feed.items[0]._pointcast.frozen, false, 'a provisional edition is never reported as frozen');
    assert.equal(feed.items[0]._pointcast.provisional, true);
  }

  const good = composeEdition({ date: SAT, config, sources: full() });
  assert.equal(canFreeze(good, cutoffMs(SAT) - 1), false, 'not before its own 6:45');
  assert.equal(canFreeze(good, cutoffMs(SAT)), true);
  const frozen = freezeEdition(good, after);
  assert.equal(frozen.frozen, true);
  assert.equal(frozen.frozenAt, '2026-10-03T13:50:00Z');
  assert.equal(good.frozen, false, 'freezing copies');
  const preview = composeEdition({ date: '2026-10-02', config, sources: full() });
  assert.equal(preview.number, 0);
  assert.equal(preview.preview, true);
  assert.equal(canFreeze(preview, Date.parse('2026-10-02T20:00:00Z')), false, 'a preview never freezes');
  assert.equal(canFreeze({ ...good, slots: good.slots.slice(0, 6) }, after), false, 'six slots is a hole');
  assert.equal(canFreeze({ ...good, slots: good.slots.map((s) => (s.id === 'town' ? { ...s, line: ' ' } : s)) }, after), false, 'an empty line is a hole');
});

test('sky: KLAX is its last report at or before 6:45 AM, the same whenever the edition is first read', () => {
  const MON = '2026-10-05';
  const obs = (minute, ceilingFt) => ({ minute, ceilingFt, underTheLayer: ceilingFt != null && ceilingFt < 3000, localTime: '', raw: null });
  // answerMarine() for Monday as read at 2:10 PM: an 800 ft deck at dawn, open by the afternoon.
  const answer = {
    date: MON,
    verdict: { state: 'watching', final: false },
    now: { observedAt: '2026-10-05T20:53:00Z', underTheLayer: false, ceilingFt: null },
    observations: [obs(4 * 60 + 53, 700), obs(5 * 60 + 53, 800), obs(6 * 60 + 53, 900), obs(11 * 60 + 53, null), obs(13 * 60 + 53, null)],
  };
  const sources = (marine) => ({ ...full(MON), sky: { marine, beach: null } });
  const at1410 = Date.parse('2026-10-05T21:10:00Z');
  const late = composeEdition({ date: MON, config, sources: sources(answer) });
  assert.equal(byId(late, 'sky').line, 'Under the marine layer at KLAX, 5:53 AM (800 ft).', 'the 6:53 and 1:53 PM reports are after the cutoff');
  assert.equal(byId(late, 'sky').fallback, false);
  const frozen = freezeEdition(late, at1410);
  assert.equal(byId(frozen, 'sky').line, 'Under the marine layer at KLAX, 5:53 AM (800 ft).');
  // The same line at 6:46 AM (only the dawn reports in) and on Tuesday (the day's verdict final).
  const early = composeEdition({ date: MON, config, sources: sources({ ...answer, observations: answer.observations.slice(0, 2) }) });
  const nextDay = composeEdition({ date: MON, config, sources: sources({ ...answer, verdict: { state: 'opened', final: true, openedAt: '11:53 am' }, now: null }) });
  assert.equal(byId(early, 'sky').line, byId(late, 'sky').line);
  assert.equal(byId(nextDay, 'sky').line, byId(late, 'sky').line, 'the verdict, decided after 6:45, is never printed');

  // The preview shape: a 1:53 PM "latest" report is not this edition's sky, so nothing freezes on it.
  const preview = composeEdition({ date: MON, config, sources: sources({ underTheLayerNow: false, observedAt: '2026-10-05T20:53:00Z' }) });
  assert.deepEqual(preview.missing, ['klax']);
  assert.equal(freezeEdition(preview, at1410), null);
  assert.doesNotMatch(byId(preview, 'sky').line, /1:53 PM|sky is open/);
  const night = composeEdition({ date: MON, config, sources: sources({ underTheLayerNow: true, observedAt: '2026-10-06T05:53:00Z' }) });
  assert.deepEqual(night.missing, ['klax'], '10:53 PM is not the morning');

  // Nothing at KLAX by 6:45 and the morning not over: provisional, retried.
  const waiting = composeEdition({ date: MON, config, sources: sources({ ...answer, observations: [obs(6 * 60 + 53, 800)] }) });
  assert.deepEqual(waiting.missing, ['klax']);
  assert.equal(freezeEdition(waiting, at1410), null);
});

test('sky: a final KLAX day with no report by 6:45 (no-record) prints a standing line and freezes', () => {
  const MON = '2026-10-05';
  const noRecord = { date: MON, verdict: { state: 'no-record', final: true }, now: null, observations: [] };
  const e = composeEdition({ date: MON, config, sources: { ...full(MON), sky: { marine: noRecord, beach: null } } });
  assert.equal(e.provisional, false);
  assert.deepEqual(e.missing, []);
  assert.equal(byId(e, 'sky').line, 'KLAX filed no report before 6:45 AM.');
  assert.equal(byId(e, 'sky').fallback, true);
  const frozen = freezeEdition(e, Date.parse('2026-10-06T16:00:00Z'));
  assert.equal(frozen.frozen, true, 'no later read could fill it, so it does not wait forever');
  assert.ok(frozen.reportIds.length > 0, 'its courts reporters still get their bylines');
  const other = composeEdition({ date: MON, config, sources: { ...full(MON), sky: { marine: { ...noRecord, date: '2026-10-04' }, beach: null } } });
  assert.deepEqual(other.missing, ['klax'], 'another day\'s record is not this edition\'s');
});

test('sky: the Desk\'s sky fact stands in for a missing KLAX, and a tides fact always adds its own sentence', () => {
  const skyFact = {
    feed: 'sky', agent: 'cc', value: 'hazy', label: 'Hazy', detail: { obsAt: SAT_553, visMi: 3, ceilFt: null, wx: 'HZ' },
    filedAt: SAT_553, observedAt: SAT_553, byline: 'cc read KLAX at 6:02', sourceUrl: 'https://aviationweather.gov/api/data/metar', bars: 3,
  };
  const tidesFact = {
    feed: 'tides', agent: 'sol', value: 'rising', label: 'Rising',
    detail: { next: [{ type: 'H', at: '2026-10-03T14:12:00Z', ft: 5.1 }, { type: 'L', at: '2026-10-03T20:40:00Z', ft: 0.9 }] },
    filedAt: SAT_553, observedAt: SAT_553, byline: 'Sol read NOAA at 6:02', sourceUrl: 'https://api.tidesandcurrents.noaa.gov/', bars: 4,
  };

  // No KLAX at all: the sky fact takes its place, and klax drops out of missing.
  const noKlax = composeEdition({ date: SAT, config, sources: { sky: { marine: null, beach: null, desk: { sky: skyFact, tides: null } }, courts: {} } });
  assert.equal(byId(noKlax, 'sky').line, editionSkyLine(config, skyFact));
  assert.equal(byId(noKlax, 'sky').fallback, false, 'an agent read the field — this is not a template fallback');
  assert.deepEqual(noKlax.missing, [], 'klax is no longer missing');
  assert.equal(byId(noKlax, 'sky').source, 'desk');

  // KLAX answers and a tides fact is filed too: both sentences print, in order.
  const both = composeEdition({ date: SAT, config, sources: { sky: { marine: KLAX, beach: null, desk: { sky: null, tides: tidesFact } }, courts: {} } });
  assert.equal(byId(both, 'sky').line, `Under the marine layer at KLAX, 5:53 AM. ${editionTideLine(config, tidesFact)}`);
  assert.equal(byId(both, 'sky').source, 'klax-asos+desk-tides');

  // Neither KLAX nor a sky fact, and no beach moment: the template line, still missing klax.
  const nothing = composeEdition({ date: SAT, config, sources: { sky: { marine: null, beach: null, desk: {} }, courts: {} } });
  assert.deepEqual(nothing.missing, ['klax']);
  assert.equal(byId(nothing, 'sky').line, 'KLAX has not reported yet; the sky fills in with its next hourly report.');
});

test('toJsonFeed: JSON Feed 1.1 with stable ids, newest first, seven at most', () => {
  const editions = [];
  for (let i = 0; i < 9; i++) {
    const date = addDays(SAT, i);
    const e = composeEdition({ date, config, sources: full(date) });
    editions.push(i === 8 ? e : freezeEdition(e, cutoffMs(date) + MIN));
  }
  assert.ok(editions.every(Boolean), 'each morning with its own KLAX report freezes');
  editions.push(composeEdition({ date: addDays(SAT, 7), config, sources: full(addDays(SAT, 7)) })); // a composed copy of a frozen day
  const feed = toJsonFeed(editions);
  assert.equal(feed.version, 'https://jsonfeed.org/version/1.1');
  assert.equal(feed.title, 'PointCast Morning Edition');
  assert.equal(feed.home_page_url, 'https://pointcast.xyz/morning');
  assert.equal(feed.feed_url, 'https://pointcast.xyz/morning.json');
  assert.ok(Array.isArray(feed.items));
  assert.equal(feed.items.length, 7);
  assert.deepEqual(feed.items.map((it) => it.id), ['2026-10-11', '2026-10-10', '2026-10-09', '2026-10-08', '2026-10-07', '2026-10-06', '2026-10-05'].map((d) => `morning:${d}`));
  assert.equal(new Set(feed.items.map((it) => it.id)).size, feed.items.length, 'ids are unique');
  for (const it of feed.items) {
    assert.equal(typeof it.id, 'string');
    assert.match(it.url, /^https:\/\/pointcast\.xyz\/morning\?d=\d{4}-\d{2}-\d{2}$/);
    assert.ok(typeof it.content_text === 'string' && it.content_text.split('\n').length === 7, 'seven lines');
    assert.match(it.date_published, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    assert.ok(!Number.isNaN(Date.parse(it.date_published)));
    assert.equal(it._pointcast.slots.length, 7);
  }
  assert.equal(feed.items[0]._pointcast.frozen, false, 'the newest is still composing');
  assert.equal(feed.items[1]._pointcast.frozen, true, 'a frozen copy wins over a composed one');
  assert.equal(feed.items[1].date_modified, '2026-10-10T13:46:00Z');
  const first = toJsonFeed([freezeEdition(composeEdition({ date: SAT, config, sources: full() }), cutoffMs(SAT))]).items[0];
  assert.equal(first.id, 'morning:2026-10-03');
  assert.equal(first.url, 'https://pointcast.xyz/morning?d=2026-10-03');
  assert.equal(first.title, 'Morning Edition No. 1 · Sat 3 Oct 2026');
  assert.equal(first.date_published, '2026-10-03T13:45:00Z');
  assert.deepEqual(Object.keys(first._pointcast).filter((k) => ['number', 'frozen', 'provisional', 'reporters', 'more', 'slots'].includes(k)).sort(),
    ['frozen', 'more', 'number', 'provisional', 'reporters', 'slots']);
  assert.equal(first._pointcast.number, 1);
  assert.equal(first._pointcast.footer, FOOTER_LINE);
  assert.equal(toJsonFeed([composeEdition({ date: '2026-11-01', config, sources: full('2026-11-01') })]).items[0].date_published, '2026-11-01T14:45:00Z', 'PST after DST ends');
  const empty = toJsonFeed([]);
  assert.deepEqual(empty.items, []);
  assert.equal(empty.version, 'https://jsonfeed.org/version/1.1');
  const json = JSON.stringify(feed);
  assert.ok(!/pid_hash|ip_hash|dev:/.test(json), 'no phone or network hashes in the feed');
});

test('shop: never a THC item, never a link, always the disclosure', () => {
  assert.equal(SHOP_DISCLOSURE, 'No link, no commission.');
  for (const item of [
    { name: 'Good Feels Pineapple Seltzer', msrp: 5, date: '2026-10-05' },
    { short: 'THC Gummies', msrp: 20, date: '2026-10-05' },
    { brand: 'Acme', model: 'Paddle', msrp: 99, date: '2026-10-05', tags: ['cannabis'] },
    { brand: 'Acme', model: 'Paddle', msrp: 99, date: '2026-10-05', thc: true },
    { brand: 'Acme', model: 'Paddle', msrp: 99, date: '2026-10-05', channel: 'GF' },
    { brand: 'Acme', model: 'Delta-8 Paddle', msrp: 99, date: '2026-10-05' },
  ]) {
    assert.equal(isThcItem(item), true, JSON.stringify(item));
    const e = composeEdition({ date: SAT, config, sources: { shop: item, price: { kind: 'release', ...item } } });
    assert.equal(byId(e, 'shop').source, 'template');
    assert.equal(byId(e, 'shop').fallback, true);
    assert.equal(byId(e, 'price').source, 'template', 'the price slot refuses it too');
    assert.ok(!/good feels|thc|gumm|cannabis|delta/i.test(editionText(e)));
  }
  assert.equal(isThcItem({ brand: 'JOOLA', model: 'POWER FX', short: 'JOOLA POWER FX' }), false);
  for (const p of [...calendar.releases, ...register.backfill]) assert.equal(isThcItem(p), false, `${p.id} is a paddle`);
  const pool = [...calendar.releases, ...register.backfill, { id: 'gf-seltzer', name: 'Good Feels Seltzer', msrp: 5, date: '2026-10-04' }];
  for (let i = 0; i < 60; i++) {
    const date = addDays('2026-09-20', i);
    const shop = pickShop({ paddles: pool, date });
    assert.ok(shop && !isThcItem(shop) && shop.id !== 'gf-seltzer', date);
    const line = byId(composeEdition({ date, config, sources: { shop } }), 'shop').line;
    assert.ok(line.endsWith(' No link, no commission.'), line);
    assert.ok(!/https?:|www\.|\.com\b/.test(line), 'no link in the line');
  }
  assert.equal(pickShop({ paddles: [], date: SAT }), null);
});

test('pickers: price within ±14 days, town news within 7 days, shop turns daily', () => {
  const price = pickPrice({ releases: calendar.releases, changes: register.changes, paddles: register.backfill, date: SAT });
  assert.equal(price.kind, 'release');
  assert.equal(price.id, 'gearbox-pressure-x', 'Oct 1 (day) beats Oct 5 (month) at the same distance');
  assert.equal(price.msrp, 279.99);
  const far = pickPrice({ releases: calendar.releases, changes: register.changes, paddles: register.backfill, date: '2027-06-01' });
  assert.equal(far.kind, 'change', 'no release within two weeks: the newest register change');
  assert.equal(far.date, '2026-09-21');
  assert.ok(far.name);
  const policy = register.changes.filter((c) => c.kind === 'policy');
  assert.ok(policy.length > 0, 'the register carries a policy entry');
  assert.equal(pickPrice({ releases: [], changes: policy, date: '2027-06-01' }), null, 'a policy entry is never price news');
  assert.equal(pickPrice({ releases: [], changes: [], date: SAT }), null);
  const e = composeEdition({ date: '2027-06-01', config, sources: { price: far } });
  assert.match(byId(e, 'price').line, /^From the register, Sep 21: /);
  assert.equal(byId(e, 'price').fallback, true);

  const shop = pickShop({ paddles: [...calendar.releases, ...register.backfill], date: SAT, exclude: [price.id] });
  assert.equal(shop.id, 'rpm-jade', 'the nearest paddle still to come');
  const later = ['2027-01-10', '2027-01-11', '2027-01-12'].map((date) => pickShop({ paddles: [...calendar.releases, ...register.backfill], date }).id);
  assert.equal(new Set(later).size, 3, 'with nothing coming, the shelf turns daily');

  const town = pickTown({ news, date: '2026-09-08' });
  assert.equal(town.kind, 'news');
  assert.equal(town.date, '2026-09-04');
  const posts = [
    { id: 'a', at: '2026-10-03T03:12:00Z', text: 'Lights out on court 4.', via: 'page', attribution: 'card', handle: 'jen' },
    { id: 'b', at: '2026-10-03T04:00:00Z', text: 'owner note', via: 'page', attribution: 'card', handle: 'mike' },
    { id: 'c', at: '2026-10-03T05:00:00Z', text: 'On the air from The courts', via: 'air', attribution: 'station', handle: 'courts' },
    { id: 'd', at: '2026-10-03T06:00:00Z', text: 'unsigned', via: 'bar', attribution: 'self-reported', who: 'Mayor' },
    { id: 'e', at: '2026-10-03T14:00:00Z', text: 'after the cutoff', via: 'page', attribution: 'card', handle: 'sam' },
  ];
  const sw = pickTown({ news: newsBeforeNo1, posts, date: SAT, ownerHandles: ['@mike'] });
  assert.deepEqual(sw, { kind: 'shortwave', text: 'Lights out on court 4.', handle: 'jen', at: '2026-10-03T03:12:00Z' });
  assert.equal(byId(composeEdition({ date: SAT, config, sources: { town: sw } }), 'town').line, 'On Shortwave at 8:12 PM: "Lights out on court 4." — @jen');
  assert.deepEqual(pickTown({ news: newsBeforeNo1, posts: [], almanac: 'Sunrise 6:52 AM.', date: SAT }), { kind: 'almanac', line: 'Sunrise 6:52 AM.' });
  assert.equal(pickTown({ news: newsBeforeNo1, posts: [], date: SAT }), null);
});

test('momentOf: yesterday\'s last reading, its bylines and the reports behind it', () => {
  let n = 0;
  const report = (pid, byline, value, t, over = {}) => ({
    id: rid(++n), spot: 'courts', kind: 'wait', value, observed_at: t, day: '2026-10-02',
    pid_hash: pid.padEnd(16, '0'), ip_hash: `${pid}ff`.padEnd(16, '0'), user_id: null, byline, onsite: 1, status: 'ok', source: 'page', ...over,
  });
  const t0 = Date.parse('2026-10-02T14:36:00Z'); // Fri 7:36 AM
  const a = report('aaaa', '@mike', '1-4', t0);
  const b = report('bbbb', '@sam', '1-4', t0 + 2 * MIN);
  const remote = report('dddd', '@away', '1-4', t0 + 3 * MIN, { onsite: 0 });
  const agent = report('eeee', 'cc', '0', t0 + 4 * MIN, { onsite: 0, source: 'agent:cc' });
  const c = { report_id: a.id, pid_hash: 'cccc'.padEnd(16, '0'), ip_hash: 'ccccff'.padEnd(16, '0'), user_id: null, verdict: 'still', value: '1-4', onsite: 1, at: t0 + 5 * MIN };
  const m = momentOf({ spot: 'courts', cfg: COURTS, rows: [a, b, remote, agent], confirms: [c], day: '2026-10-02' });
  assert.equal(m.value, '1-4');
  assert.equal(m.label, '1–4 in the rack');
  assert.equal(m.support, 3);
  assert.equal(m.at, t0 + 5 * MIN, 'the last on-site moment of the day');
  assert.deepEqual(m.bylines, ['@mike', '@sam', guestByline(c.pid_hash)]);
  assert.match(m.bylines[2], /^Guest \d{4}$/);
  assert.deepEqual(m.reportIds, [a.id, b.id], 'reports only: the confirmer is named, the remote and agent rows are not evidence');
  assert.ok(!/aaaa0|bbbb0|cccc0|ff0/.test(JSON.stringify(m)), 'no phone or network hashes');
  assert.equal(momentOf({ spot: 'courts', cfg: COURTS, rows: [a, b], day: '2026-10-01' }), null);
  assert.equal(momentOf({ spot: 'courts', cfg: COURTS, rows: [remote, agent], day: '2026-10-02' }), null, 'no on-site human evidence, no moment');
  const early = momentOf({ spot: 'courts', cfg: COURTS, rows: [a, b], confirms: [c], day: '2026-10-02', until: t0 + MIN });
  assert.equal(early.support, 1, '`until` cuts the day at the cutoff');
  assert.deepEqual(early.reportIds, [a.id]);
  const e = composeEdition({ date: SAT, config, sources: { sky: { marine: KLAX }, courts: { yesterday: m } } });
  assert.equal(byId(e, 'courts').line, `Yesterday 7:41 AM: 1–4 in the rack, 3 agree — @mike, @sam, ${m.bylines[2]}. Next Court Call Fri 7:30 AM on 7.500.`);
  assert.deepEqual(byId(e, 'courts').reportIds, [a.id, b.id]);
  const fog = momentOf({ spot: 'beach', cfg: BEACH, rows: [report('ffff', '@jen', 'none', SAT_631, { spot: 'beach', kind: 'fog', day: SAT })], day: SAT, until: cutoffMs(SAT) });
  assert.equal(fog.label, "Can't see the pier");
});

test('mirrors: the Nightly Net and Court Call match the dial and the spots file', () => {
  assert.equal(NIGHTLY_NET.startMinute, NET.startMinute);
  assert.equal(NIGHTLY_NET.minutes, NET.minutes);
  assert.equal(NIGHTLY_NET.mhz, formatMhz(NET.step));
  const courts = config.spots.find((s) => s.id === 'courts');
  assert.equal(courts.mhz.toFixed(3), '7.500');
  assert.equal(config.spots.find((s) => s.id === 'beach').mhz.toFixed(3), '6.100');
  const fri = composeEdition({ date: '2026-10-09', config, sources: {} });
  assert.match(byId(fri, 'courts').line, /Court Call today, 7:30 AM on 7\.500\.$/);
  const thu = composeEdition({ date: '2026-10-08', config, sources: {} });
  assert.match(byId(thu, 'courts').line, /Court Call tomorrow, 7:30 AM on 7\.500\.$/);
});
