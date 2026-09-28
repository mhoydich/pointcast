import assert from 'node:assert/strict';
import test from 'node:test';

// src/lib/court-format.ts carries no JSON import (unlike courts.ts), so node
// loads it directly: the page, CourtCard and the board client all print
// these words.
import { daysBetween, daysText, hoursLine, monthDay, provenanceText, seasonText, sourcedTag, timeText } from '../src/lib/court-format.ts';

test('daysText: Monday-first, the weekend reads Sat–Sun, every day reads Daily', () => {
  assert.equal(daysText([0, 6]), 'Sat–Sun');
  assert.equal(daysText([1, 2, 3, 4, 5]), 'Mon–Fri');
  assert.equal(daysText([0, 1, 2, 3, 4, 5, 6]), 'Daily');
  assert.equal(daysText([1, 3, 5]), 'Mon, Wed, Fri');
  assert.equal(daysText([2, 4]), 'Tue, Thu');
  assert.equal(daysText([0, 1, 2, 4, 5, 6]), 'Mon, Tue, Thu–Sun', 'pairs list; runs of three collapse');
  assert.equal(daysText([5, 6, 0]), 'Fri–Sun');
});

test('seasonText: month-day, never a raw ISO range that breaks mid-date at 375 px', () => {
  assert.equal(seasonText('2026-09-07', '2026-10-26'), 'Sep 7–Oct 26');
  assert.equal(seasonText(null, '2026-11-30'), 'through Nov 30');
  assert.equal(seasonText('2026-12-01', null), 'from Dec 1');
  assert.equal(seasonText(null, null), '');
  assert.doesNotMatch(seasonText('2026-12-01', '2027-03-31'), /\d{4}/);
});

test('timeText / hoursLine / monthDay', () => {
  assert.equal(timeText('08:00'), '8 AM');
  assert.equal(timeText('17:30'), '5:30 PM');
  assert.equal(timeText('12:00'), '12 PM');
  assert.equal(hoursLine([{ days: [0, 6], open: '08:00', close: 'dusk' }]), 'Sat–Sun 8 AM–dusk');
  assert.equal(monthDay('2026-09-28'), 'Sep 28');
});

test('provenanceText and sourcedTag match build spec §3', () => {
  const sources = { ES1: { label: 'rec.us', url: 'https://www.rec.us/x' }, MIKE: { label: 'Mike said', url: null } };
  assert.equal(provenanceText({ src: 'ES1', checked: '2026-09-28' }, sources), 'from rec.us, checked Sep 28');
  assert.equal(provenanceText({ src: 'MIKE', checked: '2026-09-28' }, sources), 'Mike said, Sep 28');
  assert.equal(provenanceText({ src: 'NOPE', checked: '2026-09-28' }, sources), 'checked Sep 28');
  // the client passes {label, url: boolean}
  assert.equal(provenanceText({ src: 'ES1', checked: '2026-09-28' }, { ES1: { label: 'rec.us', url: true } }), 'from rec.us, checked Sep 28');
  assert.deepEqual(sourcedTag({ confidence: 'unverified', checked: '2026-09-28' }, '2026-09-28'), { show: false, tag: null });
  assert.deepEqual(sourcedTag({ confidence: 'partial', checked: '2026-09-28' }, '2026-09-28'), { show: true, tag: 'unconfirmed' });
  assert.deepEqual(sourcedTag({ confidence: 'verified', checked: '2026-08-15' }, '2026-09-28'), { show: true, tag: null });
  assert.deepEqual(sourcedTag({ confidence: 'verified', checked: '2026-08-14' }, '2026-09-28'), { show: true, tag: 'stale' });
  assert.equal(daysBetween('2026-10-31', '2026-11-02'), 2, 'across the DST change');
});
