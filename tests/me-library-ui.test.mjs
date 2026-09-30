import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
import * as model from '../src/lib/me-library-model.mjs';
const component = fs.readFileSync(new URL('../src/components/MeLibrary.astro', import.meta.url), 'utf8').replace(/^---[\s\S]*?---/, '').replace(/<script>[\s\S]*?<\/script>/g, '');
const source = fs.readFileSync(new URL('../src/scripts/me-library.ts', import.meta.url), 'utf8').replace(/^import .*\n/gm, '').split('\nlet cleanup:')[0].replace('export function mountMeLibrary', 'function mountMeLibrary');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
const tick = () => new Promise(resolve => setTimeout(resolve, 12));
const keep = { id: 'link:https://example.com/a', kind: 'link', title: 'A discovery', url: 'https://example.com/a', note: 'NEVER PUBLIC SECRET', text: '', site: 'example.com', keptAt: new Date().toISOString(), version: 1 };

function setup({ initial = { mode: 'browser', keeps: [] }, fetchHandler } = {}) {
  const dom = new JSDOM(component, { url: 'https://pointcast.xyz/me', runScripts: 'outside-only' });
  const { window } = dom;
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  let shelf = initial;
  let error = null;
  const calls = [];
  const announce = () => window.dispatchEvent(new window.CustomEvent('pc:keeps:change', { detail: shelf }));
  window.__deps = {
    ...model, POCKET_KEY: 'pointcast:shopping-pocket:v1', SHOPPING_ITEMS: [],
    loadKeeps: async () => shelf,
    browserKeeps: () => [], keepsError: () => error,
    addKeep: async draft => { calls.push({ kind: 'keep', draft }); shelf = { ...shelf, keeps: [{ ...keep, ...draft }] }; announce(); return true; },
    updateKeep: async () => true, removeKeep: async () => true,
    importKeeps: async () => ({ acceptedIds: [], remaining: [], complete: true }), importBrowserKeeps: async () => ({ acceptedIds: [], remaining: [], complete: true }),
  };
  window.fetch = async (url, options) => {
    const body = options?.body ? JSON.parse(options.body) : null; calls.push({ url, body, headers: options?.headers });
    const payload = fetchHandler ? await fetchHandler(url, body) : url.endsWith('profile') ? { ok: true, profile: { name: 'Person', bio: '', noun: 3, links: [], featured: [], version: 1, published: false } } : { ok: true, collections: [] };
    return { ok: true, status: 200, json: async () => payload, blob: async () => new window.Blob([JSON.stringify(payload)], { type: 'application/json' }) };
  };
  window.eval(`const { ${Object.keys(window.__deps).join(',')} } = window.__deps;\n${compiled}\nwindow.__cleanup = mountMeLibrary(document.querySelector('[data-me-library]'));`);
  return { window, calls, setShelf(value, reason) { shelf = value; error = reason; announce(); }, close() { window.__cleanup(); window.close(); } };
}

test('guest can keep a URL with a private note and search it without requesting a preview', async () => {
  const app = setup();
  try {
    await tick(); const form = app.window.document.querySelector('[data-ml-save]');
    form.elements.url.value = 'https://example.com/page?q=one#two'; form.elements.title.value = 'A good page'; form.elements.note.value = 'future project';
    form.dispatchEvent(new app.window.Event('submit', { bubbles: true, cancelable: true })); await tick();
    assert.equal(app.calls.filter(call => call.kind === 'keep').length, 1);
    assert.equal(app.calls.some(call => String(call.url).includes('unfurl')), false);
    assert.match(app.window.document.querySelector('[data-ml-keeps]').textContent, /A good page/);
    const search = app.window.document.querySelector('[data-ml-search]'); search.value = 'future project'; search.dispatchEvent(new app.window.Event('input')); assert.match(app.window.document.querySelector('[data-ml-keeps]').textContent, /A good page/);
    assert.match(app.window.document.querySelector('[data-ml-mode]').textContent, /this browser/);
  } finally { app.close(); }
});

test('unavailable account disables writes and does not label the account as guest storage', async () => {
  const app = setup({ initial: { mode: 'unavailable', keeps: [] } });
  try { await tick(); assert.equal(app.window.document.querySelector('[data-ml-save] button[type=submit]').disabled, true); assert.equal(app.window.document.querySelector('[data-ml-signin]').hidden, true); assert.match(app.window.document.querySelector('[data-ml-keeps]').textContent, /could not reach your account/); }
  finally { app.close(); }
});

test('publication waits for explicit selection and publishes the exact server preview token without private notes', async () => {
  const collection = { id: 'col_1', title: 'My collection', description: '', items: [{ keepId: keep.id, caption: 'A public thought' }], version: 2, published: false };
  const app = setup({ initial: { mode: 'account', keeps: [keep], userId: 'account-A' }, fetchHandler: async (url, body) => {
    if (url.endsWith('profile')) return { ok: true, profile: { name: 'Person', bio: '', noun: 3, links: [], featured: [], version: 1, published: false } };
    if (!body) return { ok: true, collections: [collection] };
    if (body.action === 'preview') return { ok: true, preview: { title: 'Reviewed server title', description: 'Reviewed introduction', items: [{ title: 'Reviewed card title', url: keep.url, caption: 'A public thought' }] }, previewToken: 'exact-reviewed-token' };
    return { ok: true, collection: { ...collection, version: 3, published: true, url: '/collections/col_1' } };
  } });
  try {
    await tick();
    const buttons = () => [...app.window.document.querySelectorAll('button')];
    buttons().find(b => b.textContent === 'Preview').click();
    assert.equal(app.calls.some(call => call.body?.action === 'publish'), false);
    buttons().find(b => b.textContent === 'Preview selected cards →').click(); await tick();
    const dialog = app.window.document.querySelector('[data-ml-dialog]');
    assert.match(dialog.textContent, /Reviewed server title/); assert.match(dialog.textContent, /Reviewed card title/); assert.equal(dialog.textContent.includes('NEVER PUBLIC SECRET'), false);
    buttons().find(b => b.textContent === 'Publish collection').click(); await tick();
    const publish = app.calls.find(call => call.body?.action === 'publish');
    assert.equal(publish.body.previewToken, 'exact-reviewed-token'); assert.deepEqual(publish.body.selectedKeepIds, [keep.id]); assert.equal(publish.headers['X-PointCast-Account'], 'account-A');
    assert.equal(JSON.stringify(publish.body).includes('NEVER PUBLIC'), false);
  } finally { app.close(); }
});

test('changing account closes private dialogs and clears the previous collection editor', async () => {
  const collection = { id: 'col_1', title: 'PRIVATE A COLLECTION', description: '', items: [{ keepId: keep.id, caption: '' }], version: 2, published: false };
  const app = setup({ initial: { mode: 'account', keeps: [keep], userId: 'account-A' }, fetchHandler: async url => url.endsWith('profile') ? { ok: true, profile: { name: 'A', bio: 'Private bio', noun: 0, links: [], featured: [], version: 1, published: false } } : { ok: true, collections: [collection] } });
  try {
    await tick(); [...app.window.document.querySelectorAll('button')].find(b => b.textContent === 'Arrange').click();
    assert.equal(app.window.document.querySelector('[data-ml-collection-editor] input[name=title]').value, 'PRIVATE A COLLECTION');
    app.setShelf({ mode: 'browser', keeps: [] }); await tick();
    assert.equal(app.window.document.querySelector('[data-ml-collection-editor]').hidden, true);
    assert.equal(app.window.document.querySelector('[data-ml-collection-editor] input[name=title]').value, '');
    assert.equal(app.window.document.querySelector('[data-ml-collections]').textContent.includes('PRIVATE A COLLECTION'), false);
    assert.equal(app.window.document.querySelector('[data-ml-keeps]').textContent.includes('NEVER PUBLIC SECRET'), false);
  } finally { app.close(); }
});


test('account export downloads the backend snapshots with the captured account guard', async () => {
  const exported = { schema: 'pointcast-me-export-v1', keeps: [keep], collections: [{ id: 'col_1', publishedSnapshot: { title: 'Published title', items: [] } }], profile: { name: 'Draft name', publishedSnapshot: { name: 'Published name' } } };
  const app = setup({ initial: { mode: 'account', keeps: [keep], userId: 'account-A' }, fetchHandler: async url => {
    if (url.endsWith('/export')) return exported;
    if (url.endsWith('/profile')) return { ok: true, profile: { name: 'Draft name', bio: '', noun: 3, links: [], featured: [], version: 1, published: false } };
    return { ok: true, collections: [] };
  } });
  try {
    await tick();
    let downloadedBlob; let filename;
    app.window.URL.createObjectURL = blob => { downloadedBlob = blob; return 'blob:synthetic-export'; };
    app.window.URL.revokeObjectURL = () => {};
    app.window.HTMLAnchorElement.prototype.click = function () { filename = this.download; };
    app.window.document.querySelector('[data-ml-export]').click(); await tick();
    const request = app.calls.find(call => call.url === '/api/me/export');
    assert.equal(request.headers['X-PointCast-Account'], 'account-A');
    assert.equal(filename, 'pointcast-me.json');
    const text = await new Promise((resolve, reject) => { const reader = new app.window.FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsText(downloadedBlob); });
    assert.deepEqual(JSON.parse(text), exported);
    assert.match(app.window.document.querySelector('[data-ml-notice]').textContent, /published snapshots/);
  } finally { app.close(); }
});


test('a 31-item shelf shows 30 cards, loads the remainder, and resets pagination with filters', async () => {
  const items = Array.from({ length: 31 }, (_, i) => ({ ...keep, id: `link:https://example.com/${i}`, url: `https://example.com/${i}`, title: `Discovery ${i}`, note: '' }));
  const app = setup({ initial: { mode: 'browser', keeps: items } });
  try {
    await tick(); const document = app.window.document; const cards = () => document.querySelectorAll('[data-ml-keeps] article'); const more = document.querySelector('[data-ml-load-more]');
    assert.equal(document.querySelector('[data-ml-count]').textContent, '31');
    assert.equal(cards().length, 30); assert.equal(more.hidden, false); assert.match(document.querySelector('[data-ml-showing]').textContent, /30 of 31/);
    more.click(); assert.equal(cards().length, 31); assert.equal(more.hidden, true); assert.match(document.querySelector('[data-ml-showing]').textContent, /31 of 31/);
    const search = document.querySelector('[data-ml-search]'); search.value = 'Discovery 30'; search.dispatchEvent(new app.window.Event('input')); assert.equal(cards().length, 1); assert.match(cards()[0].textContent, /Discovery 30/);
    search.value = ''; search.dispatchEvent(new app.window.Event('input')); assert.equal(cards().length, 30); assert.equal(more.hidden, false);
    more.click(); const filter = document.querySelector('[data-ml-filter]'); filter.value = 'link'; filter.dispatchEvent(new app.window.Event('change')); assert.equal(cards().length, 30);
  } finally { app.close(); }
});

test('the save form accepts a native PointCast path and saves its canonical URL', async () => {
  const app = setup();
  try {
    await tick(); const form = app.window.document.querySelector('[data-ml-save]');
    assert.equal(form.elements.url.type, 'text'); form.elements.url.value = '/b/0001?view=full#details';
    form.dispatchEvent(new app.window.Event('submit', { bubbles: true, cancelable: true })); await tick();
    assert.equal(app.calls.find(call => call.kind === 'keep').draft.url, 'https://pointcast.xyz/b/0001?view=full#details');
  } finally { app.close(); }
});


test('Shortwave excerpts stay in private collections and cannot enter the publication selection', async () => {
  const post = { ...keep, id: 'post:shortwave-1', kind: 'post', title: '', text: 'A private saved excerpt', url: '', postId: 'shortwave-1' };
  const collection = { id: 'col_mixed', title: 'Mixed discoveries', description: '', items: [{ keepId: keep.id, caption: 'Public link' }, { keepId: post.id, caption: '' }], version: 2, published: false };
  const app = setup({ initial: { mode: 'account', keeps: [keep, post], userId: 'account-A' }, fetchHandler: async (url, body) => {
    if (url.endsWith('profile')) return { ok: true, profile: { name: 'Person', bio: '', noun: 3, links: [], featured: [], version: 1, published: false } };
    if (!body) return { ok: true, collections: [collection] };
    if (body.action === 'preview') return { ok: true, preview: { title: collection.title, description: '', items: [{ title: keep.title, url: keep.url, caption: 'Public link' }] }, previewToken: 'only-links-token' };
    return { ok: true, collection };
  } });
  try {
    await tick(); const document = app.window.document; const buttons = () => [...document.querySelectorAll('button')];
    buttons().find(button => button.textContent === 'Arrange').click();
    assert.match(document.querySelector('[data-ml-members]').textContent, /A private saved excerpt/);
    buttons().find(button => button.textContent === 'Preview').click();
    const label = [...document.querySelectorAll('[data-ml-dialog-content] label')].find(label => label.textContent.includes('Shortwave excerpt'));
    assert.ok(label); assert.equal(label.querySelector('input').disabled, true); assert.equal(label.querySelector('input').checked, false);
    buttons().find(button => button.textContent === 'Preview selected cards →').click(); await tick();
    assert.deepEqual(app.calls.find(call => call.body?.action === 'preview').body.selectedKeepIds, [keep.id]);
    assert.equal(document.querySelector('[data-ml-dialog-content]').textContent.includes(post.text), false);
  } finally { app.close(); }
});
