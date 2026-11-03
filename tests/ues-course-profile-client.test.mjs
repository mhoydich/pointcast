import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { createCourseProfileClient, mountCourseProfile, mountProfileShelf } from '../src/scripts/ues-course-profile.mjs';
import { createProgress, setWeekComplete } from '../src/lib/ues-progress.mjs';
const tick = () => new Promise(resolve => setImmediate(resolve));
const saved = () => ({ courseCode: 'UES-201', title: 'Example course', path: '/ues/example', progress: setWeekComplete(createProgress('UES-201'), 2, true, '2026-01-01T00:00:00.000Z'), revision: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' });
const account = (courses = []) => ({ ok: true, userId: 'alpha', displayName: 'Alpha member', courses });
const markup = `<section data-ues-profile data-course="UES-201"><p data-ues-profile-status></p><button data-ues-profile-load>Check private profile</button><button data-ues-profile-save hidden>Save</button><button data-ues-profile-restore hidden>Use saved</button><button data-ues-profile-remove hidden>Remove</button><ul data-ues-profile-list></ul></section>`;
function fixture(t, client, shelf = false) {
  const dom = new JSDOM(markup, { url: 'https://pointcast.test/ues/example' });
  const previous = { window: globalThis.window, document: globalThis.document, AbortController: globalThis.AbortController };
  globalThis.window = dom.window; globalThis.document = dom.window.document; globalThis.AbortController = dom.window.AbortController;
  const root = dom.window.document.querySelector('section');
  let local = createProgress('UES-201'); let restores = 0;
  if (shelf) { root.dataset.course = ''; mountProfileShelf(root, client); }
  else mountCourseProfile(root, { getProgress: () => local, replaceProgress: progress => { local = progress; restores++; }, client });
  t.after(() => { dom.window.document.dispatchEvent(new dom.window.Event('astro:before-swap')); dom.window.close(); Object.assign(globalThis, previous); });
  return { dom, root, find: sel => root.querySelector(`[data-ues-profile-${sel}]`), local: () => local, restores: () => restores };
}
test('anonymous page mount and checklist editing cause no profile request; each save is explicit', async t => {
  const calls = [];
  const f = fixture(t, { load: async code => { calls.push(['load', code]); return account(); }, save: async (...args) => { calls.push(['save', ...args]); return { ...account(), course: saved() }; } });
  await tick(); assert.deepEqual(calls, []);
  f.find('load').click(); await tick(); assert.equal(calls.length, 1); assert.equal(f.find('save').hidden, false);
  f.find('save').click(); await tick(); assert.equal(calls.length, 2); assert.equal(calls[1][4], null);
  assert.equal(f.restores(), 0); assert.match(f.find('status').textContent, /Later edits stay local/);
});
test('load reviews a saved copy before explicit restore and never overwrites local data by arrival', async t => {
  const f = fixture(t, { load: async () => account([saved()]) });
  f.find('load').click(); await tick(); assert.equal(f.restores(), 0);
  assert.match(f.find('status').textContent, /1 of 6 modules/);
  f.find('restore').click(); await tick(); assert.equal(f.restores(), 1); assert.deepEqual(f.local().completedWeeks, [2]);
});
test('restore rechecks account and revision, requiring review when either changes', async t => {
  let result = account([saved()]);
  const f = fixture(t, { load: async () => result });
  f.find('load').click(); await tick();
  result = { ...account([saved()]), userId: 'beta', displayName: 'Beta member' };
  f.find('restore').click(); await tick(); assert.equal(f.restores(), 0); assert.match(f.find('status').textContent, /Review it and choose again/);
  result = { ...result, courses: [{ ...saved(), revision: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' }] };
  f.find('restore').click(); await tick(); assert.equal(f.restores(), 0);
});
test('remove targets only the reviewed account copy and leaves local progress unchanged', async t => {
  const calls = [];
  const f = fixture(t, { load: async () => account([saved()]), remove: async (...args) => { calls.push(args); return account(); } });
  f.find('load').click(); await tick(); f.find('remove').click(); await tick();
  assert.equal(calls[0][0].userId, 'alpha'); assert.equal(calls[0][2], saved().revision);
  assert.equal(f.restores(), 0); assert.equal(f.find('restore').hidden, true); assert.match(f.find('status').textContent, /Account copy removed/);
});
test('double clicks are serialized and late private reads cannot reappear after sign-out', async t => {
  let resolve; let calls = 0;
  const pending = new Promise(done => { resolve = done; });
  const f = fixture(t, { load: () => { calls++; return pending; } });
  f.find('load').click(); f.find('load').click(); assert.equal(calls, 1);
  f.dom.window.dispatchEvent(new f.dom.window.Event('pc:auth-change'));
  resolve(account([saved()])); await tick();
  assert.equal(f.find('save').hidden, true); assert.doesNotMatch(f.find('status').textContent, /Alpha member/);
});
test('late mutation responses and navigation do not expose the old account or mutate a new page', async t => {
  let resolve;
  const f = fixture(t, { load: async () => account([saved()]), save: () => new Promise(done => { resolve = done; }) });
  f.find('load').click(); await tick(); f.find('save').click();
  f.dom.window.document.dispatchEvent(new f.dom.window.Event('astro:before-swap'));
  resolve({ ...account(), course: saved() }); await tick(); assert.equal(f.find('save').hidden, true);
});
test('errors clear private UI and preserve anonymous coursework', async t => {
  const f = fixture(t, { load: async () => { throw new Error('Unavailable'); } });
  f.find('load').click(); await tick(); assert.equal(f.restores(), 0); assert.match(f.find('status').textContent, /Unavailable/);
});
test('profile shelf uses text nodes and clears saved course data on account changes', async t => {
  const malicious = { ...saved(), title: '<img src=x onerror=alert(1)>' };
  let deletes = 0;
  const f = fixture(t, { load: async () => account([malicious]), remove: async () => { deletes++; return account(); } }, true);
  await tick(); assert.equal(f.find('list').children.length, 0);
  f.find('load').click(); await tick(); assert.equal(f.find('list').children.length, 1); assert.equal(f.root.querySelector('img'), null);
  f.find('list').querySelector('button').click(); await tick(); assert.equal(deletes, 1); assert.equal(f.find('list').children.length, 0);
  assert.equal(f.dom.window.document.activeElement, f.find('load'));
  f.find('load').click(); await tick(); f.dom.window.dispatchEvent(new f.dom.window.Event('pc:auth-change'));
  assert.equal(f.find('list').children.length, 0);
});
test('real client sends only normalized checklists, explicit consent, and reviewed account/revision', async () => {
  const calls = [];
  const client = createCourseProfileClient(async (url, options) => { calls.push({ url, options }); return Response.json(account()); });
  await client.load('UES-201');
  await client.save(account(), 'UES-201', { ...saved().progress, privateNote: 'Never upload', wallet: 'private' }, null);
  await client.remove(account(), 'UES-201', saved().revision);
  assert.equal(calls[0].url, '/api/me/courses?courseCode=UES-201');
  assert.equal(calls[1].options.headers['X-PointCast-User'], 'alpha');
  const body = JSON.parse(calls[1].options.body); assert.equal(body.consent, true); assert.equal(body.expectedRevision, null);
  assert.doesNotMatch(calls[1].options.body, /privateNote|Never upload|wallet/);
  assert.equal(calls[2].options.method, 'DELETE');
  assert.equal(calls.every(call => call.options.cache === 'no-store' && call.options.credentials === 'same-origin'), true);
});
test('real client describes unavailable, unauthenticated and stale/account errors without claiming a save', async () => {
  for (const reason of ['unauthorized', 'course-profile-unavailable', 'account-changed', 'revision-conflict']) {
    const client = createCourseProfileClient(async () => Response.json({ ok: false, reason }, { status: 409 }));
    await assert.rejects(client.load(), /Sign in|not available|account changed|another tab/);
  }
});
test('course rooms retain local reset/receipts and never enroll UES in generic state sync', () => {
  const room = readFileSync(new URL('../src/pages/ues/[slug].astro', import.meta.url), 'utf8');
  assert.match(room, /window.localStorage.removeItem\(storageKey\)/); assert.match(room, /Download private receipt/);
  assert.match(room, /mountCourseProfile/); assert.doesNotMatch(room, /writeMeState|hydrateMeState/);
});

test('HTML and network failures produce plain recovery copy without exposing raw transport errors', async () => {
  for (const fetcher of [async () => new Response('<!DOCTYPE html><h1>Unavailable</h1>', { status: 503 }), async () => { throw new Error('private transport debug'); }]) {
    const client = createCourseProfileClient(fetcher);
    await assert.rejects(client.load(), error => error.message === 'The profile request failed. Your local work is still here.');
  }
});

test('leaving the tab and restoring a cached page clears account data without uploading or silently reloading it', async t => {
  const f = fixture(t, { load: async () => account([saved()]) }, true);
  f.find('load').click(); await tick(); assert.equal(f.find('list').children.length, 1);
  Object.defineProperty(f.dom.window.document, 'hidden', { configurable: true, value: true });
  f.dom.window.document.dispatchEvent(new f.dom.window.Event('visibilitychange'));
  assert.equal(f.find('list').children.length, 0);
  f.find('load').click(); await tick();
  const event = new f.dom.window.Event('pageshow'); Object.defineProperty(event, 'persisted', { value: true });
  f.dom.window.dispatchEvent(event); assert.equal(f.find('list').children.length, 0);
});

test('the self-gated course shelf remains usable when unrelated Me holdings fail', () => {
  const page = readFileSync(new URL('../src/pages/me.astro', import.meta.url), 'utf8');
  assert.ok(page.indexOf('<UesCourseProfile />') < page.indexOf('<div data-me-private'));
});
