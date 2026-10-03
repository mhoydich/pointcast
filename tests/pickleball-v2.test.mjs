import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import {
  appendScorecardEntry, buildPracticePlan, exportScorecard, isValidLocalDate, localDate,
  normalizePracticeOptions, parseScorecard, PRACTICE_OPTIONS, PRACTICE_PRESETS,
  SCORECARD_KEY, SCORECARD_MAX, serializeScorecard, summarizeScorecard, validateScorecardEntry,
} from '../src/lib/pickleball-v2/model.js';
import { mountPickleballV2 } from '../src/lib/pickleball-v2/client.js';

const entry = (overrides = {}) => ({ id: 'entry-test', goal: 'backhand', space: 'compact', partner: 'solo', date: '2026-10-02', attempts: 10, successes: 7, notes: 'A broad target and quiet contact.', ...overrides });
const flush = () => new Promise((resolve) => setImmediate(resolve));
const choices = (items) => items.map((item) => `<option value="${typeof item === 'number' ? item : item.id}">${typeof item === 'number' ? item : item.label}</option>`).join('');
const fixture = () => `<div data-pickleball-v2><div data-v2-enhanced-only hidden><form data-v2-planner><select name="goal">${choices(PRACTICE_OPTIONS.goals)}</select><select name="duration">${choices(PRACTICE_OPTIONS.durations)}</select><select name="space">${choices(PRACTICE_OPTIONS.spaces)}</select><select name="partner">${choices(PRACTICE_OPTIONS.partners)}</select></form><button data-v2-preset="compact-partner">Preset</button></div><div data-v2-plan></div><p data-v2-plan-status></p><form data-v2-scorecard data-v2-enhanced-only hidden><select name="goal">${choices(PRACTICE_OPTIONS.goals)}</select><select name="space">${choices(PRACTICE_OPTIONS.spaces)}</select><select name="partner">${choices(PRACTICE_OPTIONS.partners)}</select><input name="date" type="date"><input name="attempts" type="number"><input name="successes" type="number"><textarea name="notes"></textarea><button type="submit">Save</button></form><div data-v2-scorecard-summary></div><div data-v2-scorecard-history></div><p data-v2-scorecard-status></p><button data-v2-use-plan>Use plan</button><button data-v2-export>Export</button><button data-v2-clear>Clear</button><div data-v2-clear-confirm hidden><button data-v2-clear-yes>Confirm</button><button data-v2-clear-cancel>Cancel</button></div></div>`;
function setup({ storage, raw, url = 'https://pointcast.test/pickleball/home' } = {}) {
  const dom = new JSDOM(fixture(), { url });
  const { document: doc } = dom.window;
  if (storage) Object.defineProperty(dom.window, 'localStorage', { value: storage });
  if (raw !== undefined) dom.window.localStorage.setItem(SCORECARD_KEY, raw);
  const form = doc.querySelector('[data-v2-scorecard]');
  const values = { goal: 'backhand', space: 'compact', partner: 'solo', date: localDate(), attempts: '10', successes: '7', notes: '' };
  const set = (overrides = {}, edited = false) => {
    for (const [name, value] of Object.entries(overrides)) {
      form.elements.namedItem(name).value = value;
      if (edited) form.elements.namedItem(name).dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    }
  };
  set(values);
  const unmount = mountPickleballV2(doc);
  const submit = async () => { form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); await flush(); };
  return { dom, doc, form, set, submit, unmount, status: () => doc.querySelector('[data-v2-scorecard-status]').textContent };
}

test('all 72 planner combinations are deterministic, constrained, and total the selected time', () => {
  const ids = new Set();
  for (const { id: goal } of PRACTICE_OPTIONS.goals) for (const duration of PRACTICE_OPTIONS.durations) for (const { id: space } of PRACTICE_OPTIONS.spaces) for (const { id: partner } of PRACTICE_OPTIONS.partners) {
    const options = { goal, duration, space, partner };
    const plan = buildPracticePlan(options);
    assert.deepEqual(plan, buildPracticePlan(options));
    assert.deepEqual(plan.options, options);
    assert.equal(plan.blocks.reduce((total, block) => total + block.minutes, 0), duration);
    assert.equal(plan.totalMinutes, duration);
    assert.equal(plan.blocks.length, 4);
    assert.ok(plan.blocks.every((block) => block.id && block.instruction && block.qualityCue && block.progression && block.successTarget && block.minutes > 0));
    if (space === 'compact') assert.doesNotMatch(plan.blocks.map((block) => Object.values(block).join(' ')).join(' '), /\b(?:serve|return|baseline|crosscourt|kitchen|transition)\b/i);
    if (partner === 'solo') assert.match(plan.description, /Solo/);
    assert.match(plan.articleUrl, /^\/pickleball\/articles\/(cleaner-backhands|smarter-mixed-doubles)/);
    ids.add(plan.id);
  }
  assert.equal(ids.size, 72);
  assert.deepEqual(PRACTICE_PRESETS.map((preset) => buildPracticePlan(preset.options).totalMinutes), [10, 20, 30]);
});

test('invalid planner/query choices fall back to an explicit compact solo plan', () => {
  assert.deepEqual(normalizePracticeOptions({ goal: 'rating', duration: '1e1', space: '<img>', partner: null }), { goal: 'backhand', duration: 10, space: 'compact', partner: 'solo' });
  assert.equal(buildPracticePlan(null).totalMinutes, 10);
});

test('scorecard validates exact integer bounds, required counts, and plain text', () => {
  assert.equal(validateScorecardEntry(entry({ attempts: 100, successes: 100 }), { today: '2026-10-03' }).ok, true);
  assert.equal(validateScorecardEntry(entry({ attempts: '1', successes: '0' }), { today: '2026-10-03' }).ok, true);
  for (const attempts of [0, 101, 1.5, NaN, Infinity, '', ' ', '1e2', '0x10', true, {}, '2.0']) assert.equal(validateScorecardEntry(entry({ attempts }), { today: '2026-10-03' }).ok, false, String(attempts));
  for (const successes of [-1, 11, '', ' ', NaN, 1.5]) assert.equal(validateScorecardEntry(entry({ successes }), { today: '2026-10-03' }).ok, false);
  assert.equal(validateScorecardEntry(entry({ notes: 'x'.repeat(281) }), { today: '2026-10-03' }).ok, false);
  assert.equal(validateScorecardEntry(entry({ notes: { text: 'cue' } }), { today: '2026-10-03' }).ok, false);
  const literal = validateScorecardEntry(entry({ notes: '<b>quiet contact</b>' }), { today: '2026-10-03' });
  assert.equal(literal.entry.notes, '<b>quiet contact</b>');
});

test('calendar validation rejects rolled-over/future dates and uses the local day', () => {
  assert.equal(isValidLocalDate('2024-02-29'), true);
  assert.equal(isValidLocalDate('2026-02-29'), false);
  assert.equal(isValidLocalDate('2026-02-30'), false);
  assert.equal(isValidLocalDate('1900-02-29'), false);
  assert.equal(isValidLocalDate('2000-02-29'), true);
  assert.equal(validateScorecardEntry(entry({ date: '2026-10-04' }), { today: '2026-10-03' }).ok, false);
  assert.equal(localDate(new Date(2026, 9, 3, 0, 1)), '2026-10-03');
  assert.equal(localDate(new Date(2026, 9, 2, 23, 59)), '2026-10-02');
});

test('schema, cap, IDs, summaries, and export remain honest self-reported counts', () => {
  assert.equal(parseScorecard('{bad').ok, false);
  assert.equal(parseScorecard(JSON.stringify({ schema: 1, entries: [] })).ok, false);
  assert.equal(parseScorecard(serializeScorecard([entry(), entry()])).ok, false);
  assert.equal(parseScorecard(serializeScorecard([entry({ attempts: 0 })])).ok, false);
  assert.deepEqual(parseScorecard(null).entries, []);
  let entries = [];
  for (let index = 0; index < 105; index++) entries = appendScorecardEntry(entries, entry({ id: `entry-${index}` }));
  assert.equal(entries.length, SCORECARD_MAX);
  assert.equal(entries[0].id, 'entry-104');
  assert.equal(entries.at(-1).id, 'entry-5');
  assert.deepEqual(summarizeScorecard([entry(), entry({ id: 'reset', goal: 'reset', successes: 3 })]).map((item) => [item.goal, item.successes, item.attempts]), [['backhand', 7, 10], ['reset', 3, 10], ['doubles', 0, 0]]);
  const exported = JSON.parse(exportScorecard([entry()], new Date('2026-10-03T12:00:00Z')));
  assert.equal(exported.schema, 2); assert.match(exported.description, /not verified skills, ratings/);
  assert.equal('rating' in exported.entries[0], false);
});

test('query prefills only validated planner choices and does not alter a scorecard draft', () => {
  const context = setup({ url: 'https://pointcast.test/pickleball/home?goal=doubles&space=fullcourt&partner=partner&duration=45#pb-v2-planner' });
  const planner = context.doc.querySelector('[data-v2-planner]');
  assert.equal(planner.elements.goal.value, 'doubles'); assert.equal(planner.elements.duration.value, '45');
  assert.equal(context.form.elements.goal.value, 'backhand');
  assert.equal(context.doc.activeElement, planner.elements.goal);
  assert.equal(context.doc.querySelector('[data-v2-enhanced-only]').hidden, false);
  assert.equal(context.doc.querySelector('[data-v2-plan]').hasAttribute('aria-live'), false);
  context.unmount(); context.dom.window.close();
});

test('client planner creates safe structured DOM and the explicit Use plan action preserves counts/notes', () => {
  const context = setup();
  context.set({ attempts: '12', successes: '9', notes: 'keep my cue' });
  context.doc.querySelector('[data-v2-preset]').click();
  assert.match(context.doc.querySelector('[data-v2-plan]').textContent, /20 minutes/);
  assert.equal(context.doc.querySelectorAll('.v2-plan-block').length, 4);
  assert.ok([...context.doc.querySelectorAll('.v2-plan-block')].every((block) => block.querySelector('h5') && block.querySelector('.v2-plan-minutes')));
  context.doc.querySelector('[data-v2-use-plan]').click();
  assert.equal(context.form.elements.goal.value, 'reset');
  assert.equal(context.form.elements.attempts.value, '12'); assert.equal(context.form.elements.notes.value, 'keep my cue');
  context.unmount(); context.dom.window.close();
});

test('unchanged repeated submissions, cached-page events, and remounts do not duplicate an entry', async () => {
  const context = setup();
  context.set({ notes: 'Autofill after mounting, without an input event.' });
  assert.equal(mountPickleballV2(context.doc), context.unmount);
  await context.submit(); await context.submit();
  context.doc.querySelector('[data-v2-use-plan]').click();
  await context.submit();
  context.form.elements.attempts.dispatchEvent(new context.dom.window.Event('change', { bubbles: true }));
  await context.submit();
  context.dom.window.dispatchEvent(new context.dom.window.Event('pageshow'));
  await context.submit();
  assert.equal(parseScorecard(context.dom.window.localStorage.getItem(SCORECARD_KEY)).entries.length, 1);
  context.unmount(); const stop = mountPickleballV2(context.doc); await context.submit();
  assert.equal(parseScorecard(context.dom.window.localStorage.getItem(SCORECARD_KEY)).entries.length, 1);
  context.set({ notes: 'new cue' }, true); await context.submit();
  assert.equal(parseScorecard(context.dom.window.localStorage.getItem(SCORECARD_KEY)).entries.length, 2);
  stop(); context.dom.window.close();
});

test('invalid entries are not saved and notes are rendered literally without user HTML', async () => {
  const context = setup(); context.set({ attempts: '4', successes: '5' }); await context.submit();
  assert.equal(context.dom.window.localStorage.getItem(SCORECARD_KEY), null);
  assert.equal(context.form.elements.successes.getAttribute('aria-invalid'), 'true');
  context.set({ attempts: '10', successes: '7', notes: '<img src=x onerror="alert(1)">' }, true); await context.submit();
  assert.equal(context.doc.querySelector('[data-v2-scorecard-history] img'), null);
  assert.match(context.doc.querySelector('[data-v2-scorecard-history]').textContent, /<img src=x/);
  context.unmount(); context.dom.window.close();
});

test('clear requires inline confirmation, cancel keeps counts, and confirmation removes only the owned key', async () => {
  const context = setup(); context.dom.window.localStorage.setItem('unrelated', 'keep'); await context.submit();
  context.doc.querySelector('[data-v2-clear]').click();
  assert.notEqual(context.dom.window.localStorage.getItem(SCORECARD_KEY), null);
  context.doc.querySelector('[data-v2-clear-cancel]').click();
  assert.notEqual(context.dom.window.localStorage.getItem(SCORECARD_KEY), null);
  assert.equal(context.doc.activeElement, context.doc.querySelector('[data-v2-clear]'));
  context.doc.querySelector('[data-v2-clear]').click(); context.doc.querySelector('[data-v2-clear-yes]').click(); await flush();
  assert.equal(context.dom.window.localStorage.getItem(SCORECARD_KEY), null);
  assert.equal(context.dom.window.localStorage.getItem('unrelated'), 'keep');
  assert.match(context.doc.querySelector('[data-v2-scorecard-history]').textContent, /No practice counts/);
  context.unmount(); context.dom.window.close();
});

test('a stale page re-reads storage before append and cannot resurrect counts cleared elsewhere', async () => {
  const values = new Map([[SCORECARD_KEY, serializeScorecard([entry({ date: localDate() })])]]);
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  const a = setup({ storage }), b = setup({ storage });
  a.doc.querySelector('[data-v2-clear]').click(); a.doc.querySelector('[data-v2-clear-yes]').click(); await flush();
  await b.submit();
  const saved = parseScorecard(values.get(SCORECARD_KEY));
  assert.equal(saved.entries.length, 1); assert.notEqual(saved.entries[0].id, 'entry-test');
  values.delete(SCORECARD_KEY);
  b.dom.window.dispatchEvent(new b.dom.window.StorageEvent('storage', { key: SCORECARD_KEY, newValue: null }));
  assert.match(b.doc.querySelector('[data-v2-scorecard-history]').textContent, /No practice counts/);
  a.unmount(); b.unmount(); a.dom.window.close(); b.dom.window.close();
});

test('blocked reads and corrupt saved data keep a visible, usable memory scorecard', async () => {
  for (const storage of [{ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } }, { getItem: () => '{corrupt', setItem() { throw new Error('must not overwrite corruption'); }, removeItem() {} }]) {
    const context = setup({ storage }); await context.submit();
    assert.match(context.status(), /memory for this visit only/);
    assert.equal(context.doc.querySelectorAll('.v2-score-entry').length, 1);
    context.dom.window.dispatchEvent(new context.dom.window.Event('pageshow'));
    assert.equal(context.doc.querySelectorAll('.v2-score-entry').length, 1);
    context.unmount(); const stop = mountPickleballV2(context.doc);
    assert.equal(context.doc.querySelectorAll('.v2-score-entry').length, 1);
    stop(); context.dom.window.close();
  }
});

test('quota failures preserve the new memory entry across pageshow and blocked removal is honestly reported', async () => {
  const stored = serializeScorecard([entry({ date: localDate() })]);
  const context = setup({ storage: { getItem: () => stored, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('denied'); } } });
  await context.submit(); assert.equal(context.doc.querySelectorAll('.v2-score-entry').length, 2);
  context.dom.window.dispatchEvent(new context.dom.window.Event('pageshow')); assert.equal(context.doc.querySelectorAll('.v2-score-entry').length, 2);
  context.doc.querySelector('[data-v2-clear]').click(); context.doc.querySelector('[data-v2-clear-yes]').click(); await flush();
  assert.match(context.status(), /saved data may remain/);
  assert.equal(context.doc.querySelectorAll('.v2-score-entry').length, 0);
  context.unmount(); context.dom.window.close();
});

test('JSON export uses a Blob URL and revokes every URL during lifecycle cleanup', async () => {
  const context = setup(); await context.submit();
  let blob; const revoked = [];
  context.dom.window.URL.createObjectURL = (value) => { blob = value; return 'blob:scorecard-test'; };
  context.dom.window.URL.revokeObjectURL = (url) => revoked.push(url);
  context.dom.window.HTMLAnchorElement.prototype.click = function () { assert.equal(this.download, `pointcast-pickleball-scorecard-${localDate()}.json`); };
  context.doc.querySelector('[data-v2-export]').click();
  assert.equal(blob.type, 'application/json;charset=utf-8');
  const content = await new Promise((resolve) => { const reader = new context.dom.window.FileReader(); reader.onload = () => resolve(reader.result); reader.readAsText(blob); });
  assert.equal(JSON.parse(content).entries.length, 1);
  context.unmount(); assert.deepEqual(revoked, ['blob:scorecard-test']);
  context.dom.window.close();
});

test('an old delayed lock callback or rejection cannot restore an entry after teardown and clearing', async () => {
  for (const outcome of ['reject', 'callback']) {
    const context = setup();
    let first = true;
    let finish;
    Object.defineProperty(context.dom.window.navigator, 'locks', { value: {
      request(name, callback) {
        assert.equal(name, SCORECARD_KEY);
        if (first) {
          first = false;
          return new Promise((resolve, reject) => {
            finish = () => outcome === 'reject' ? reject(new Error('late lock rejection')) : resolve(callback());
          });
        }
        return Promise.resolve().then(callback);
      },
    } });
    await context.submit();
    context.unmount();
    const stop = mountPickleballV2(context.doc);
    context.doc.querySelector('[data-v2-clear]').click();
    context.doc.querySelector('[data-v2-clear-yes]').click();
    await flush();
    finish(); await flush();
    context.dom.window.dispatchEvent(new context.dom.window.Event('pageshow'));
    assert.equal(context.dom.window.localStorage.getItem(SCORECARD_KEY), null);
    assert.equal(context.doc.querySelectorAll('.v2-score-entry').length, 0);
    stop(); context.dom.window.close();
  }
});

test('initial fragment focus settles after load without overriding an interaction or cached-page restoration', () => {
  for (const scenario of ['idle', 'interaction', 'cached']) {
    const dom = new JSDOM(fixture(), { url: 'https://pointcast.test/pickleball/home?goal=reset#pb-v2-planner' });
    const tasks = new Map(); let taskId = 0;
    dom.window.setTimeout = (callback) => { tasks.set(++taskId, callback); return taskId; };
    dom.window.clearTimeout = (id) => tasks.delete(id);
    const doc = dom.window.document;
    const stop = mountPickleballV2(doc);
    const goal = doc.querySelector('[data-v2-planner] [name="goal"]');
    assert.equal(doc.activeElement, goal);
    doc.body.tabIndex = -1; doc.body.focus();
    dom.window.dispatchEvent(new dom.window.Event('load'));
    if (scenario === 'interaction') {
      const attempts = doc.querySelector('[data-v2-scorecard] [name="attempts"]');
      attempts.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true })); attempts.focus();
    } else if (scenario === 'cached') {
      const event = new dom.window.Event('pageshow'); Object.defineProperty(event, 'persisted', { value: true });
      dom.window.dispatchEvent(event);
    }
    while (tasks.size) { const [id, callback] = tasks.entries().next().value; tasks.delete(id); callback(); }
    assert.equal(doc.activeElement, scenario === 'idle' ? goal : scenario === 'interaction' ? doc.querySelector('[name="attempts"]') : doc.body);
    stop(); assert.equal(tasks.size, 0); dom.window.close();
  }
});

test('a cleared saved record releases only its own duplicate guard even if its storage event was missed', async () => {
  for (const cached of [true, false]) {
    const context = setup();
    await context.submit();
    const original = parseScorecard(context.dom.window.localStorage.getItem(SCORECARD_KEY)).entries[0];
    context.dom.window.localStorage.removeItem(SCORECARD_KEY);
    if (cached) context.dom.window.dispatchEvent(new context.dom.window.Event('pageshow'));
    await context.submit();
    const saved = parseScorecard(context.dom.window.localStorage.getItem(SCORECARD_KEY));
    assert.equal(saved.entries.length, 1);
    assert.notEqual(saved.entries[0].id, original.id);
    await context.submit();
    assert.equal(parseScorecard(context.dom.window.localStorage.getItem(SCORECARD_KEY)).entries.length, 1);
    context.unmount(); context.dom.window.close();
  }
});
