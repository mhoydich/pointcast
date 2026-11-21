import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { start } from '../public/signature/studio-view.js';
import { layoutTyped } from '../public/signature/studio.js';

const source = await readFile(new URL('../src/pages/signature/index.astro', import.meta.url), 'utf8');
const markup = source.replace(/^---[\s\S]*?---/, '').replace(/<script\b[\s\S]*?<\/script>/g, '')
  .replace(/<select data-font>[\s\S]*?<\/select>/, '<select data-font><option value="pointcast-script">PointCast Script</option><option value="great-vibes">Great Vibes</option></select>');
const fonts = Object.fromEntries(await Promise.all(['pointcast-script', 'great-vibes'].map(async id => [id, JSON.parse(await readFile(new URL(`../public/signature/paths/${id}.json`, import.meta.url), 'utf8'))])));
const tick = () => new Promise(resolve => setImmediate(resolve));
const actionSelector = '[data-png], [data-svg], [data-copy-svg], [data-copy-png], [data-copy-html], [data-copy-inline], [data-hash], [data-sign], [data-prepare]';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function harness({ loads = {}, digest, manualImages = false } = {}) {
  const dom = new JSDOM(markup, { url: 'https://pointcast.xyz/signature/' });
  const previous = Object.fromEntries(['window', 'document', 'DOMParser', 'fetch', 'Image', 'FileReader', 'crypto', 'URL'].map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  for (const k of ['window', 'document', 'DOMParser']) Object.defineProperty(globalThis, k, { configurable: true, writable: true, value: dom.window[k] });
  // No network or signing is performed. Fonts are real fixtures; the optional
  // devnet status read receives a deterministic unavailable response.
  globalThis.fetch = async url => {
    const id = /^\/signature\/paths\/([a-z-]+)\.json$/.exec(String(url))?.[1];
    if (!id) return { ok: false, status: 503, text: async () => 'Offline test fixture' };
    if (loads[id]) return loads[id].promise;
    return { ok: true, json: async () => fonts[id] };
  };
  const images = [], readers = [];
  globalThis.Image = class {
    constructor() { this.naturalWidth = 40; this.naturalHeight = 20; images.push(this); }
    set src(value) { this.source = value; if (!manualImages) queueMicrotask(() => this.onload?.()); }
  };
  globalThis.FileReader = class {
    constructor() { readers.push(this); }
    readAsDataURL(file) { this.file = file; }
  };
  globalThis.URL = class extends URL {
    static createObjectURL() { return 'blob:test-signature'; }
    static revokeObjectURL() {}
  };
  if (digest) Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { subtle: {
    importKey: async () => { throw new Error('No test key'); },
    digest: () => digest.promise,
  } } });
  const context = { setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, drawImage() {} };
  dom.window.HTMLCanvasElement.prototype.toBlob = callback => callback(new Blob(['test PNG bytes'], { type: 'image/png' }));
  dom.window.HTMLCanvasElement.prototype.getContext = () => context;
  const root = dom.window.document.querySelector('[data-signature]');
  const $ = selector => root.querySelector(selector);
  const input = (selector, value) => { $(selector).value = value; $(selector).dispatchEvent(new dom.window.Event('input', { bubbles: true })); };
  const pointer = (type, x, y) => {
    const event = new dom.window.Event(type);
    Object.assign(event, { clientX: x, clientY: y, pointerId: 1, pressure: 0.5 });
    $('[data-pad]').dispatchEvent(event);
  };
  const upload = (type = 'image/png') => {
    const file = $('[data-file]');
    Object.defineProperty(file, 'files', { configurable: true, value: [{ type }] });
    file.dispatchEvent(new dom.window.Event('change'));
  };
  const readUpload = (index, dataUrl = 'data:image/png;base64,AAAA') => { readers[index].result = dataUrl; readers[index].onload(); };
  start(root);
  return { dom, root, $, input, pointer, upload, readUpload, images, readers,
    artifactDisabled(value) { for (const button of root.querySelectorAll(actionSelector)) assert.equal(button.disabled, value, button.outerHTML); },
    close() { dom.window.close(); for (const [k, descriptor] of Object.entries(previous)) { if (descriptor) Object.defineProperty(globalThis, k, descriptor); else delete globalThis[k]; } },
  };
}

function assertEmpty(h) {
  assert.equal(h.$('[data-stage]').children.length, 0);
  h.artifactDisabled(true);
  assert.equal(h.$('[data-send]').disabled, true);
  h.$('[data-svg]').click();
  h.$('[data-png]').click();
  h.$('[data-hash]').click();
  h.$('[data-prepare]').click();
  assert.equal(h.$('[data-hash-out]').textContent, '');
  assert.equal(h.$('[data-body]').textContent, '');
}

test('empty Draw and Upload invalidate the typed mark and disable artifact actions', async () => {
  const h = harness();
  try {
    await tick();
    assert.ok(h.$('[data-stage] svg'));
    h.artifactDisabled(false);
    h.$('[data-mode-set="draw"]').click();
    assertEmpty(h);
    assert.match(h.$('[data-missing]').textContent, /Draw on the pad/);
    h.$('[data-mode-set="type"]').click();
    await tick();
    assert.ok(h.$('[data-stage] svg'));
    h.$('[data-mode-set="upload"]').click();
    assertEmpty(h);
    assert.match(h.$('[data-missing]').textContent, /Choose an image/);
  } finally { h.close(); }
});

test('starting and clearing a drawing discard the previous exportable artifact', async () => {
  const h = harness();
  try {
    await tick();
    h.$('[data-mode-set="draw"]').click();
    h.pointer('pointerdown', 10, 30);
    h.pointer('pointermove', 40, 10);
    h.pointer('pointermove', 80, 45);
    h.pointer('pointerup', 80, 45);
    assert.ok(h.$('[data-stage] svg'));
    h.artifactDisabled(false);
    h.$('[data-clear]').click();
    assertEmpty(h);
    h.$('[data-mode-set="type"]').click();
    await tick();
    h.pointer('pointerdown', 10, 10);
    assertEmpty(h);
  } finally { h.close(); }
});

test('an older font load cannot overwrite a newer selected face', async () => {
  const older = deferred(), newer = deferred();
  const h = harness({ loads: { 'pointcast-script': older, 'great-vibes': newer } });
  try {
    h.input('[data-name]', 'Ada');
    h.input('[data-font]', 'great-vibes');
    newer.resolve({ ok: true, json: async () => fonts['great-vibes'] });
    await tick();
    const chosen = h.$('[data-stage]').innerHTML;
    assert.ok(chosen.includes('Ada'));
    const expected = layoutTyped({ font: fonts['great-vibes'], text: 'Ada', flourish: true });
    assert.equal(h.$('[data-stage] svg').getAttribute('width'), String(expected.width));
    older.resolve({ ok: true, json: async () => fonts['pointcast-script'] });
    await tick();
    assert.equal(h.$('[data-stage]').innerHTML, chosen);
    h.artifactDisabled(false);
  } finally { h.close(); }
});

test('a pending font cannot repopulate the preview after changing to empty Draw', async () => {
  const pending = deferred();
  const h = harness({ loads: { 'pointcast-script': pending } });
  try {
    h.$('[data-mode-set="draw"]').click();
    pending.resolve({ ok: true, json: async () => fonts['pointcast-script'] });
    await tick();
    assertEmpty(h);
    assert.match(h.$('[data-missing]').textContent, /Draw on the pad/);
  } finally { h.close(); }
});

test('an invalid new name cannot leave the previous signature available for export', async () => {
  const h = harness();
  try {
    await tick();
    assert.ok(h.$('[data-stage] svg'));
    h.input('[data-name]', '🛑');
    await tick();
    assertEmpty(h);
    assert.match(h.$('[data-missing]').textContent, /none of those characters/);
  } finally { h.close(); }
});


for (const selector of ['[data-hash]', '[data-prepare]']) {
  test(`${selector} cannot restore a stale hash or post after the mark changes during hashing`, async () => {
    const digest = deferred();
    const h = harness({ digest });
    try {
      await tick();
      h.$(selector).click();
      await tick();
      h.$('[data-mode-set="draw"]').click();
      digest.resolve(new Uint8Array(32).buffer);
      await tick();
      assertEmpty(h);
    } finally { h.close(); }
  });
}

test('a rejected upload or image read failure clears the previous artifact', async () => {
  const h = harness({ manualImages: true });
  try {
    await tick();
    h.$('[data-mode-set="upload"]').click();
    h.upload(); h.readUpload(0); h.images[0].onload();
    assert.ok(h.$('[data-stage] image'));
    h.upload('image/svg+xml');
    assertEmpty(h);
    assert.match(h.$('[data-missing]').textContent, /Upload a PNG/);
    h.upload();
    h.readers[1].onerror();
    assertEmpty(h);
    assert.match(h.$('[data-missing]').textContent, /could not be read/);
    h.upload(); h.readUpload(2); h.images[1].onerror();
    assertEmpty(h);
    assert.match(h.$('[data-missing]').textContent, /could not be read/);
  } finally { h.close(); }
});

test('an older uploaded image cannot replace a later file or a different mode', async () => {
  const h = harness({ manualImages: true });
  try {
    await tick();
    h.$('[data-mode-set="upload"]').click();
    h.upload(); h.readUpload(0, 'data:image/png;base64,AAAA');
    h.upload(); h.readUpload(1, 'data:image/png;base64,BBBB');
    h.images[1].onload();
    assert.equal(h.$('[data-stage] image').getAttribute('href'), 'data:image/png;base64,BBBB');
    h.images[0].onload();
    assert.equal(h.$('[data-stage] image').getAttribute('href'), 'data:image/png;base64,BBBB');
    h.upload(); h.readUpload(2);
    h.$('[data-mode-set="draw"]').click();
    h.images[2].onload();
    assertEmpty(h);
    assert.match(h.$('[data-missing]').textContent, /Draw on the pad/);
  } finally { h.close(); }
});
