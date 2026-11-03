import test from 'node:test';
import assert from 'node:assert/strict';
import { remembranceCards, remembranceIntents, buildRemembranceText, wrapRemembranceText, reflowRemembranceForImage } from '../src/lib/remembering.mjs';

test('remembrance sharing includes only the selected card and explicitly entered words', () => {
  const text = buildRemembranceText('prayer', '  Ada  ', '  A kindness I remember.  ');
  assert.equal(text, 'A prayer for comfort\n\nRemembering Ada\n\nMay you find gentleness around you, rest when you need it, and companionship through the days ahead.\n\nA kindness I remember.\n\nMade with care · PointCast\n\nhttps://pointcast.xyz/remembering/');
  assert.equal(remembranceCards.length, 6);
});

test('unknown card and empty optional fields produce a complete readable card', () => {
  const text = buildRemembranceText('missing', ' ', '\n');
  assert.ok(text.startsWith('Thinking of you\n\nHolding you'));
  assert.ok(!text.includes('Remembering '));
  assert.ok(!text.includes('undefined'));
});

test('personal input stays literal plain text and is bounded', () => {
  const text = buildRemembranceText('memory', '<img src=x>', 'A & B\n<script>alert(1)</script>');
  assert.ok(text.includes('Remembering <img src=x>'));
  assert.ok(text.includes('A & B\n<script>alert(1)</script>'));
  const bounded = buildRemembranceText('thinking', 'x'.repeat(100), 'z'.repeat(1400));
  assert.ok(bounded.includes('x'.repeat(80)));
  assert.ok(!bounded.includes('x'.repeat(81)));
  assert.ok(!bounded.includes('z'.repeat(1201)));
});

// Exercise the browser controller with real DOM events, including denied APIs.
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import ts from 'typescript';

function browser() {
  const dom = new JSDOM(`<!doctype html><div data-remembering>
    <input id="rem-name"><textarea id="rem-memory"></textarea><select id="rem-occasion"><option value="loss">A loss</option><option value="birthday">Birthday</option></select><select id="rem-intent"><option value="companionship">Companionship</option><option value="comfort">Comfort</option></select><input type="radio" name="rem-art" value="remembrance" checked data-alt="Candle"><input type="radio" name="rem-art" value="garden" data-alt="Garden"><img id="rem-card-art" src="/images/still-light/remembrance.webp">
    <input type="radio" name="rem-card" value="thinking" checked>
    <input type="radio" name="rem-card" value="prayer">
    <p id="rem-status"></p><button id="rem-share"></button><button id="rem-copy"></button>
    <p id="rem-card-occasion"></p><p id="rem-card-intent"></p><p id="rem-card-title"></p><p id="rem-card-message"></p><p id="rem-dedication"></p>
    <p id="rem-card-memory"></p><pre id="rem-share-text"></pre><textarea id="rem-copy-text"></textarea>
    <button id="rem-preview-link"></button><h2 id="rem-preview-title"></h2>
    <div class="rem-candle-scene"></div><button id="rem-candle"></button><p id="rem-candle-caption"></p>
    <button id="rem-bell"></button><button id="rem-save-image"></button><button id="rem-prepare-image"></button><button id="rem-share-image" disabled></button><div id="rem-manual-copy" hidden></div>
  </div>`, { runScripts: 'outside-only', url: 'https://pointcast.xyz/remembering/' });
  const source = readFileSync(new URL('../src/lib/remembering-client.ts', import.meta.url), 'utf8')
    .replace("import { remembranceCards, remembranceIntents, buildRemembranceText, wrapRemembranceText, reflowRemembranceForImage } from './remembering.mjs';", '');
  dom.window.remembranceCards = remembranceCards;
  dom.window.buildRemembranceText = buildRemembranceText;
  dom.window.remembranceIntents = remembranceIntents;
  dom.window.wrapRemembranceText = wrapRemembranceText;
  dom.window.reflowRemembranceForImage = reflowRemembranceForImage;
  dom.window.document.querySelectorAll('input, select, button:not(#rem-share-image), textarea:not(#rem-copy-text)').forEach((control) => {
    control.disabled = true;
    control.setAttribute('data-rem-enable', '');
  });
  dom.window.document.getElementById('rem-candle').setAttribute('aria-label', 'Remembrance candle');
  dom.window.eval(ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None }));
  return dom;
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test('personal words are only shared or copied on request, and failures preserve them', async () => {
  const dom = browser();
  const { window } = dom;
  const get = (id) => window.document.getElementById(id);
  const shared = [];
  window.navigator.share = async (data) => { shared.push(data); };
  Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: async () => { throw new Error('denied'); } } });
  get('rem-name').value = '<Ada>';
  get('rem-name').dispatchEvent(new window.Event('input'));
  get('rem-memory').value = 'A <script>kind</script> memory';
  get('rem-memory').dispatchEvent(new window.Event('input'));
  assert.equal(shared.length, 0);
  assert.equal(get('rem-card-memory').children.length, 0);
  get('rem-share').click();
  await tick();
  assert.deepEqual(shared[0].text, get('rem-share-text').textContent);
  window.navigator.share = async () => { throw new window.DOMException('cancelled', 'AbortError'); };
  get('rem-share').click();
  await tick();
  assert.match(get('rem-status').textContent, /cancelled/i);
  assert.equal(get('rem-memory').value, 'A <script>kind</script> memory');
  get('rem-copy').click();
  await tick();
  assert.equal(get('rem-manual-copy').hidden, false);
  assert.equal(get('rem-copy-text').value, get('rem-share-text').textContent);
  assert.match(get('rem-status').textContent, /Nothing has been sent/);
  dom.window.close();
});

test('candle toggles and the bell starts only on a tap, including after page restoration', async () => {
  const dom = browser();
  const { window } = dom;
  const get = (id) => window.document.getElementById(id);
  assert.ok([...window.document.querySelectorAll('[data-rem-enable]')].every((control) => !control.disabled));
  const contexts = [];
  class AudioMock {
    constructor() { this.currentTime = 0; this.destination = {}; contexts.push(this); }
    resume() { return Promise.resolve(); }
    suspend() { return Promise.resolve(); }
    close() { this.closed = true; return Promise.resolve(); }
    createGain() { return { gain: { cancelScheduledValues() {}, setTargetAtTime() {}, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect(node) { return node; }, disconnect() {} }; }
    createOscillator() { return { frequency: {}, connect(node) { return node; }, start() {}, stop() {}, disconnect() {} }; }
  }
  window.AudioContext = AudioMock;
  assert.equal(contexts.length, 0);
  get('rem-candle').click();
  assert.equal(get('rem-candle').getAttribute('aria-pressed'), 'true');
  assert.equal(get('rem-candle').getAttribute('aria-label'), 'Remembrance candle');
  assert.equal(window.document.querySelector('.rem-candle-scene').dataset.lit, 'true');
  get('rem-candle').click();
  assert.equal(get('rem-candle').getAttribute('aria-pressed'), 'false');
  assert.equal(get('rem-candle').getAttribute('aria-label'), 'Remembrance candle');
  get('rem-bell').click();
  await tick();
  assert.equal(contexts.length, 1);
  assert.equal(get('rem-bell').getAttribute('aria-pressed'), 'true');
  get('rem-bell').click();
  assert.equal(get('rem-bell').getAttribute('aria-pressed'), 'false');
  assert.match(get('rem-status').textContent, /stopped/);
  get('rem-bell').click();
  await tick();
  window.dispatchEvent(new window.Event('pagehide'));
  assert.equal(contexts[0].closed, true);
  get('rem-bell').click();
  await tick();
  assert.equal(contexts.length, 2);
  dom.window.close();
});

test('interactive controls start disabled in the page markup', () => {
  const page = readFileSync(new URL('../src/pages/remembering.astro', import.meta.url), 'utf8');
  for (const id of ['rem-name', 'rem-memory', 'rem-preview-link', 'rem-candle', 'rem-bell', 'rem-share', 'rem-copy', 'rem-occasion', 'rem-intent', 'rem-save-image', 'rem-prepare-image']) {
    const tag = page.match(new RegExp(`<[^>]+id="${id}"[^>]*>`))?.[0];
    assert.ok(tag, `missing ${id}`);
    assert.match(tag, /\bdisabled\b/);
    assert.match(tag, /\bdata-rem-enable\b/);
  }
  assert.match(page, /type="radio" name="rem-card" disabled data-rem-enable/);
  assert.match(page, /id="rem-candle" aria-label="Remembrance candle" aria-pressed="false"/);
  assert.match(page, /id="rem-share-image"/);
  assert.match(page, /layout reflows line breaks/);
  assert.match(page, /Save card image, Share, or Copy/);
});


test('occasion and intent are explicit in the card and wrapping preserves long messages', () => {
  const text = buildRemembranceText('thinking', 'Ada', 'a'.repeat(1200), 'birthday', 'comfort');
  assert.match(text, /A birthday in remembrance/);
  assert.match(text, /There is no need to reply/);
  const lines = wrapRemembranceText(text, (line) => [...line].length, 40);
  assert.equal(lines.join('\n').replaceAll('\n', ''), text.replaceAll('\n', ''));
  assert.ok(lines.every((line) => [...line].length <= 40));
});

test('image export includes the full selected words and shares only on request', async () => {
  const dom = browser();
  const { window } = dom;
  const get = (id) => window.document.getElementById(id);
  const drawn = [];
  window.Image = class { naturalWidth = 1000; naturalHeight = 1500; decode() { return Promise.resolve(); } };
  window.HTMLCanvasElement.prototype.getContext = () => ({
    measureText: (line) => ({ width: line.length * 20 }),
    fillRect() {}, save() {}, beginPath() {}, rect() {}, clip() {}, drawImage() {}, restore() {},
    fillText: (line) => drawn.push(line),
  });
  window.HTMLCanvasElement.prototype.toBlob = (callback) => callback(new window.Blob(['png'], { type: 'image/png' }));
  const shared = [];
  window.navigator.canShare = () => true;
  window.navigator.share = async (data) => { shared.push(data); };
  get('rem-memory').value = 'An exceptionally long memory '.repeat(40);
  get('rem-memory').dispatchEvent(new window.Event('input'));
  get('rem-intent').value = 'comfort';
  get('rem-intent').dispatchEvent(new window.Event('change'));
  assert.equal(shared.length, 0);
  assert.equal(get('rem-share-image').disabled, true);
  get('rem-prepare-image').click();
  await tick();
  assert.equal(shared.length, 0);
  get('rem-share-image').click();
  assert.equal(shared.length, 1);
  await tick();
  assert.equal(shared[0].files[0].type, 'image/png');
  assert.equal(drawn.join('').replace(/\s/g, ''), get('rem-share-text').textContent.replace(/\s/g, ''));
  assert.match(get('rem-card-intent').textContent, /comfort/);
  get('rem-memory').dispatchEvent(new window.Event('input'));
  assert.equal(get('rem-share-image').disabled, true);
  dom.window.close();
});

test('unsupported image sharing downloads the PNG locally', async () => {
  const dom = browser();
  const { window } = dom;
  window.Image = class { naturalWidth = 1000; naturalHeight = 1500; decode() { return Promise.resolve(); } };
  window.HTMLCanvasElement.prototype.getContext = () => ({
    measureText: (line) => ({ width: line.length * 10 }), fillRect() {}, save() {}, beginPath() {},
    rect() {}, clip() {}, drawImage() {}, restore() {}, fillText() {},
  });
  window.HTMLCanvasElement.prototype.toBlob = (callback) => callback(new window.Blob(['png'], { type: 'image/png' }));
  window.URL.createObjectURL = () => 'blob:local-card';
  window.setTimeout = () => 0;
  let download;
  window.HTMLAnchorElement.prototype.click = function () { download = { href: this.href, name: this.download }; };
  window.document.getElementById('rem-prepare-image').click();
  await tick();
  window.document.getElementById('rem-share-image').click();
  await tick();
  assert.deepEqual(download, { href: 'blob:local-card', name: 'remembering-card.png' });
  assert.match(window.document.getElementById('rem-status').textContent, /downloaded/);
  dom.window.close();
});


test('image layout bounds newline-heavy inputs and preserves non-whitespace characters', async () => {
  const dom = browser();
  const { window } = dom;
  const get = (id) => window.document.getElementById(id);
  const drawn = [];
  let canvas;
  window.Image = class { naturalWidth = 1000; naturalHeight = 1500; decode() { return Promise.resolve(); } };
  window.HTMLCanvasElement.prototype.getContext = function () { canvas = this; return {
    measureText: (line) => ({ width: line.length * 20 }), fillRect() {}, save() {}, beginPath() {},
    rect() {}, clip() {}, drawImage() {}, restore() {}, fillText: (line) => drawn.push(line),
  }; };
  window.HTMLCanvasElement.prototype.toBlob = (callback) => callback(new window.Blob(['png'], { type: 'image/png' }));
  get('rem-memory').value = ('a\n\n').repeat(400);
  get('rem-memory').dispatchEvent(new window.Event('input'));
  get('rem-prepare-image').click();
  await tick();
  assert.ok(canvas.height <= 8192);
  assert.equal(drawn.join('').replace(/\s/g, ''), get('rem-share-text').textContent.replace(/\s/g, ''));
  assert.equal(get('rem-share-image').disabled, false);
  const garden = window.document.querySelector('input[value="garden"]');
  garden.checked = true;
  garden.dispatchEvent(new window.Event('change'));
  assert.equal(get('rem-share-image').disabled, true);
  assert.match(get('rem-card-art').src, /garden\.webp$/);
  dom.window.close();
});
