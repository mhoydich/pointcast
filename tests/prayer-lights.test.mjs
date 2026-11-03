import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { openLightStore, parseBackup, BACKUP_FORMAT } from '../src/lib/prayer-lights-store.mjs';
import { mountPrayerLights, renderLight } from '../src/lib/prayer-lights-controller.mjs';

const light = (id, extra = {}) => ({ id, color: 'honey', intention: '', createdAt: Date.now(), ...extra });
async function storage(factory = new IDBFactory()) { return openLightStore(factory, IDBKeyRange); }
async function fixture(store) {
  const page = await readFile(new URL('../src/pages/prayer-lights.astro', import.meta.url), 'utf8');
  const markup = page.slice(page.indexOf('<main'), page.indexOf('</main>') + 7)
    .replace(/\{colors\.map\([\s\S]*?\)\}/, '<label><input type="radio" name="color" value="honey" checked /></label><label><input type="radio" name="color" value="rose" /></label>');
  const dom = new JSDOM(markup, { url: 'https://pointcast.xyz/prayer-lights/' });
  const root = dom.window.document.querySelector('main');
  const cleanup = await mountPrayerLights(root, dom.window, store);
  return { root, dom, cleanup, $: (selector) => root.querySelector(selector) };
}
async function settle(check) {
  for (let i = 0; i < 100; i++) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  assert.fail('The UI did not finish its operation.');
}
async function submit(f) {
  f.$('form').dispatchEvent(new f.dom.window.Event('submit', { bubbles: true, cancelable: true }));
  await settle(() => !f.$('[data-light]').disabled);
}

test('lights survive reopening, concurrent connections preserve every add, and pages have no gaps', async () => {
  const factory = new IDBFactory();
  const a = await storage(factory), b = await storage(factory);
  await Promise.all(Array.from({ length: 150 }, (_, i) => (i % 2 ? a : b).add(light(`light-${i}`))));
  assert.equal((await a.stats()).total, 150);
  a.close(); b.close();
  const reopened = await storage(factory);
  const all = [];
  let before;
  while (true) {
    const batch = await reopened.page(before);
    if (!batch.length) break;
    all.push(...batch);
    before = batch.at(-1).seq;
  }
  assert.equal(all.length, 150);
  assert.equal(new Set(all.map((v) => v.id)).size, 150);
  assert.deepEqual(all.map((v) => v.seq), Array.from({ length: 150 }, (_, i) => 150 - i));
  reopened.close();
});

test('daily counts use local calendar boundaries and do not count tomorrow', async () => {
  const store = await storage();
  const now = new Date(2026, 9, 27, 12);
  await store.add(light('yesterday', { createdAt: +new Date(2026, 9, 26, 23, 59) }));
  await store.add(light('today', { createdAt: +new Date(2026, 9, 27) }));
  await store.add(light('tomorrow', { createdAt: +new Date(2026, 9, 28) }));
  assert.deepEqual(await store.stats(now), { total: 3, days: [0, 0, 0, 0, 0, 1, 1] });
  store.close();
});

test('backup merge deduplicates both existing and repeated incoming IDs without replacing originals', async () => {
  const store = await storage();
  await store.add(light('existing', { intention: 'original' }));
  const records = parseBackup(JSON.stringify({ format: BACKUP_FORMAT, lights: [light('existing', { intention: 'changed' }), light('new'), light('new')] }));
  assert.equal(await store.import(records), 1);
  assert.equal(await store.import(records), 0);
  assert.equal((await store.export()).find((v) => v.id === 'existing').intention, 'original');
  assert.equal((await store.stats()).total, 2);
  await assert.rejects(store.import([light('valid'), light('bad', { color: 'javascript' })]));
  assert.equal((await store.stats()).total, 2);
  assert.throws(() => parseBackup('{"format":"another","lights":[]}'));
  assert.throws(() => parseBackup(JSON.stringify({ format: BACKUP_FORMAT, lights: [light('bad', { intention: 'x'.repeat(281) })] })));
  store.close();
});

test('an aborted add leaves the previously saved collection untouched', async () => {
  const store = await storage();
  await store.add(light('same'));
  await assert.rejects(store.add(light('same')));
  assert.equal((await store.stats()).total, 1);
  store.close();
});

test('the real page form updates personal counters, saves hostile text safely, and refresh resets only visit count', async () => {
  const factory = new IDBFactory();
  const store = await storage(factory);
  const f = await fixture(store);
  const hostile = '<img src=x onerror="alert(1)"> & a prayer';
  f.$('[name=intention]').value = hostile;
  f.$('[name=color][value=rose]').checked = true;
  await submit(f);
  assert.equal(f.$('[data-total]').textContent, '1');
  assert.equal(f.$('[data-today]').textContent, '1');
  assert.equal(f.$('[data-session]').textContent, '1');
  assert.equal(f.$('[data-wall]').children.length, 1);
  assert.equal(f.$('[data-wall] img'), null);
  assert.equal(f.$('.pl-light-intention').textContent, hostile);
  assert.equal(f.$('[data-wall]').firstChild.dataset.color, 'rose');
  assert.equal(f.$('[name=intention]').value, '');
  f.cleanup();
  const g = await fixture(await storage(factory));
  assert.equal(g.$('[data-total]').textContent, '1');
  assert.equal(g.$('[data-session]').textContent, '0');
  assert.equal(g.$('.pl-light-intention').textContent, hostile);
  g.cleanup();
});

test('load older extends the page and new lights keep stacking after more than a batch', async () => {
  const store = await storage();
  await store.import(Array.from({ length: 120 }, (_, i) => light(`old-${i}`)));
  const f = await fixture(store);
  assert.equal(f.$('[data-wall]').children.length, 48);
  f.$('[data-older]').click();
  await settle(() => !f.$('[data-older]').disabled);
  assert.equal(f.$('[data-wall]').children.length, 96);
  f.$('[data-older]').click();
  await settle(() => !f.$('[data-older]').disabled);
  assert.equal(f.$('[data-wall]').children.length, 120);
  assert.equal(f.$('[data-older]').hidden, true);
  await submit(f);
  assert.equal(f.$('[data-wall]').children.length, 121);
  assert.equal(f.$('[data-total]').textContent, '121');
  f.cleanup();
});

test('failed storage keeps the draft and counters; failed stats after save correctly reports durable success', async () => {
  const store = await storage();
  const f = await fixture(store);
  f.$('[name=intention]').value = 'Please keep this';
  const original = store.add;
  store.add = async () => { throw new Error('QuotaExceededError'); };
  await submit(f);
  assert.equal(f.$('[name=intention]').value, 'Please keep this');
  assert.equal(f.$('[data-total]').textContent, '0');
  assert.equal(f.$('[data-wall]').children.length, 0);
  assert.match(f.$('[data-status]').textContent, /could not be saved/);
  store.add = original;
  store.stats = async () => { throw new Error('reading failed'); };
  await submit(f);
  assert.match(f.$('[data-status]').textContent, /Your light is saved/);
  assert.equal(f.$('[name=intention]').value, '');
  assert.equal((await store.export()).length, 1);
  f.cleanup();
});

test('focus refresh sees other tabs and keeps older pagination complete', async () => {
  const factory = new IDBFactory();
  const a = await storage(factory), b = await storage(factory);
  await a.import(Array.from({ length: 60 }, (_, i) => light(`old-${i}`)));
  const f = await fixture(a);
  await b.add(light('other-tab'));
  f.dom.window.dispatchEvent(new f.dom.window.Event('focus'));
  await settle(() => f.$('[data-total]').textContent === '61' && !f.$('[data-light]').disabled);
  assert.equal(f.$('[data-wall]').firstChild.querySelector('.pl-light-number').textContent, 'Honey · No. 61');
  f.$('[data-older]').click();
  await settle(() => !f.$('[data-older]').disabled);
  assert.equal(f.$('[data-wall]').children.length, 61);
  assert.equal(f.$('[data-older]').hidden, true);
  b.close(); f.cleanup();
});

test('rendering an intention uses literal text including newlines', () => {
  const dom = new JSDOM();
  const card = renderLight(dom.window.document, { ...light('x', { intention: '<script>throw 1</script>\nPeace' }), seq: 7 });
  assert.equal(card.querySelector('script'), null);
  assert.equal(card.querySelector('.pl-light-intention').textContent, '<script>throw 1</script>\nPeace');
});

test('navigation during initialization closes the late-opened store and does not revive UI', async () => {
  const page = await readFile(new URL('../src/pages/prayer-lights.astro', import.meta.url), 'utf8');
  const dom = new JSDOM(page.slice(page.indexOf('<main'), page.indexOf('</main>') + 7), { url: 'https://pointcast.xyz/prayer-lights/' });
  const root = dom.window.document.querySelector('main');
  let finish, closed = false, read = false;
  const store = { stats: () => new Promise((resolve) => { finish = resolve; }), page: async () => { read = true; return []; }, close: () => { closed = true; } };
  const mounted = mountPrayerLights(root, dom.window, store);
  dom.window.document.dispatchEvent(new dom.window.Event('astro:before-swap'));
  finish({ total: 0, days: [0, 0, 0, 0, 0, 0, 0] });
  await mounted;
  assert.equal(closed, true);
  assert.equal(read, false);
  assert.equal(root.querySelector('[data-light]').disabled, true);
});

test('focus during initialization waits for the initial page and never duplicates the wall', async () => {
  const page = await readFile(new URL('../src/pages/prayer-lights.astro', import.meta.url), 'utf8');
  const dom = new JSDOM(page.slice(page.indexOf('<main'), page.indexOf('</main>') + 7), { url: 'https://pointcast.xyz/prayer-lights/' });
  const root = dom.window.document.querySelector('main');
  let release, requests = 0;
  const one = { ...light('one'), seq: 1 };
  const store = {
    stats: async () => ({ total: 1, days: [0, 0, 0, 0, 0, 0, 1] }),
    page: async () => { requests++; if (requests === 1) await new Promise((resolve) => { release = resolve; }); return [one]; },
    close() {},
  };
  const mounted = mountPrayerLights(root, dom.window, store);
  await settle(() => Boolean(release));
  dom.window.dispatchEvent(new dom.window.Event('focus'));
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(requests, 1, 'focus is queued during initialization');
  release();
  const cleanup = await mounted;
  assert.equal(requests, 2, 'queued refresh runs after the initial page');
  assert.equal(root.querySelector('[data-wall]').children.length, 1);
  assert.equal(root.querySelector('[data-total]').textContent, '1');
  assert.equal(root.querySelector('[data-light]').disabled, false);
  cleanup();
});

test('typing a next intention during a slow save preserves the new draft', async () => {
  const store = await storage();
  const f = await fixture(store);
  const add = store.add;
  let release;
  store.add = async (record) => { await new Promise((resolve) => { release = resolve; }); return add(record); };
  f.$('[name=intention]').value = 'First prayer';
  f.$('form').dispatchEvent(new f.dom.window.Event('submit', { bubbles: true, cancelable: true }));
  f.$('[name=intention]').value = 'Next prayer';
  release();
  await settle(() => !f.$('[data-light]').disabled);
  assert.equal(f.$('[name=intention]').value, 'Next prayer');
  assert.equal(f.$('.pl-light-intention').textContent, 'First prayer');
  f.cleanup();
});
