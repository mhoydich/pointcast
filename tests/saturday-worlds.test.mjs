import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const { JSDOM } = require('jsdom');
const script = fs.readFileSync(process.env.WORLDS_SCRIPT || new URL('../public/saturday-worlds/saturday-worlds.js', import.meta.url), 'utf8');
const tick = () => new Promise((resolve) => setTimeout(resolve, 40));
const fixtures = Array.from({ length: 360 }, (_, index) => {
  const kind = index < 100 ? 'c' : index < 200 ? 's' : 'a';
  const localIndex = index - (index < 100 ? 0 : index < 200 ? 100 : 200);
  const groupId = `${kind}${String(Math.floor(localIndex / 4) + 1).padStart(2, '0')}`;
  const variant = localIndex % 4 + 1;
  const id = `${groupId}-v${variant}`;
  return {
    id, groupId, variant, title: `${kind === 'a' ? 'Imagined campaign' : 'Coral courtyard'} ${groupId}`,
    category: kind === 'c' ? 'coastal' : kind === 's' ? 'scene' : variant === 1 ? 'ad-selected' : 'ad-alternate',
    selected: kind === 'a' && variant === 1, chapter: 'Afternoon', brand: kind === 'c' ? 'Pacific Common Futures' : 'PointCast',
    headline: kind === 'a' ? '<b>Bring your thought outside.</b>' : '', shortCopy: kind === 'a' ? 'An imagined courtyard.' : '',
    width: 1344, height: 896, thumb: `/images/${id}-thumb.webp`, src: `/images/${id}.webp`,
  };
});

function setup({ hash = '', reduced = false } = {}) {
  const dom = new JSDOM(`<!doctype html><html><body>
    <script type="application/json" id="worlds-data">${JSON.stringify({ images: fixtures })}</script>
    <button data-open-image="c01-v1" id="curated">Open curated</button>
    <input id="worlds-search" aria-label="Search" />
    <select id="worlds-category"><option value="all">All</option><option value="coastal">Coastal</option><option value="scene">Scene</option><option value="ad-selected">Selected</option><option value="ad-alternate">Alternate</option></select>
    <select id="worlds-brand"><option value="all">All</option><option>PointCast</option><option>Pacific Common Futures</option></select>
    <p id="worlds-count" aria-live="polite"></p><div id="worlds-gallery"></div>
    <button id="worlds-more"></button><button id="worlds-reset">Reset</button><button id="worlds-surprise">Surprise</button>
    <dialog id="worlds-dialog"><button id="worlds-close">Close</button><button id="worlds-prev">Previous</button><button id="worlds-next">Next</button>
    <img id="worlds-full-image" /><h2 id="worlds-image-title"></h2><p id="worlds-image-meta" aria-live="polite"></p><div id="worlds-image-copy"></div><div id="worlds-variants"></div><a id="worlds-open-image">Open image</a><input id="modal-input" /></dialog>
    <button id="worlds-motion"></button><progress id="worlds-progress" max="100"></progress><span id="worlds-progress-label"></span>
    <a href="#chapter-one" data-chapter-link="chapter-one">One</a><section id="chapter-one" data-worlds-chapter="The opening"><h2>The opening</h2></section>
    </body></html>`, { url: `https://pointcast.xyz/saturday-worlds/${hash}`, runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  window.matchMedia = () => ({ matches: reduced, addEventListener() {} });
  window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  window.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new window.Event('close')); };
  window.eval(script);
  const get = (id) => window.document.getElementById(id);
  const change = (id, value, type = 'change') => {
    get(id).value = value;
    get(id).dispatchEvent(new window.Event(type, { bubbles: true }));
  };
  return { dom, window, document: window.document, get, change };
}

test('archive pagination exposes all 360 unique images with dimensions and lazy loading', () => {
  const { dom, get } = setup();
  assert.equal(get('worlds-gallery').children.length, 24);
  while (!get('worlds-more').hidden) get('worlds-more').click();
  const buttons = [...get('worlds-gallery').querySelectorAll('[data-open-image]')];
  assert.equal(buttons.length, 360);
  assert.equal(new Set(buttons.map((button) => button.dataset.openImage)).size, 360);
  for (const image of get('worlds-gallery').querySelectorAll('img')) {
    assert.equal(image.loading, 'lazy');
    assert.ok(image.width > 0 && image.height > 0);
  }
  assert.match(get('worlds-count').textContent, /360 of 360/);
  dom.window.close();
});

test('category, brand, search, empty results and reset compose correctly', () => {
  const { dom, get, change } = setup();
  change('worlds-category', 'ad-selected');
  assert.match(get('worlds-count').textContent, /of 40 images/);
  change('worlds-category', 'ad-alternate');
  assert.match(get('worlds-count').textContent, /of 120 images/);
  change('worlds-search', 'a01', 'input');
  assert.equal(get('worlds-gallery').children.length, 3);
  change('worlds-brand', 'Pacific Common Futures');
  assert.match(get('worlds-count').textContent, /0 of 0/);
  assert.match(get('worlds-gallery').textContent, /No worlds found/);
  assert.equal(get('worlds-more').hidden, true);
  get('worlds-reset').click();
  assert.match(get('worlds-count').textContent, /24 of 360/);
  assert.equal(get('worlds-search').value, '');
  dom.window.close();
});

test('modal close, Back, Forward and repeated close preserve the page and originating chapter', async () => {
  const { dom, window, get } = setup({ hash: '#chapter-one' });
  get('curated').focus();
  get('curated').click();
  assert.equal(window.history.length, 2);
  assert.equal(window.location.hash, '#image=c01-v1');
  assert.equal(get('worlds-dialog').open, true);
  get('worlds-next').click();
  get('worlds-next').click();
  assert.equal(window.location.hash, '#image=c01-v3');
  assert.equal(window.history.length, 2);
  get('worlds-close').click();
  get('worlds-close').click();
  await tick();
  assert.equal(get('worlds-dialog').open, false);
  assert.equal(window.location.hash, '#chapter-one');
  assert.equal(window.document.activeElement.id, 'curated');
  window.history.forward();
  await tick();
  assert.equal(get('worlds-dialog').open, true);
  assert.equal(window.location.hash, '#image=c01-v3');
  window.history.back();
  await tick();
  assert.equal(get('worlds-dialog').open, false);
  assert.equal(window.location.hash, '#chapter-one');
  dom.window.close();
});

test('direct deep links dismiss without going back to another page', async () => {
  const { dom, window, get } = setup({ hash: '#image=a01-v2' });
  assert.equal(get('worlds-dialog').open, true);
  assert.equal(window.history.length, 1);
  get('worlds-next').click();
  get('worlds-variants').querySelector('[data-worlds-variant="a01-v4"]').click();
  assert.equal(window.location.hash, '#image=a01-v4');
  get('worlds-close').click();
  await tick();
  assert.equal(get('worlds-dialog').open, false);
  assert.equal(window.location.href, 'https://pointcast.xyz/saturday-worlds/');
  assert.equal(window.history.length, 1);
  dom.window.close();
});

test('chapter navigation after modal close does not restore a stale image opener', async () => {
  const { dom, window, document, get } = setup();
  get('curated').focus();
  get('curated').click();
  get('worlds-close').click();
  await tick();
  assert.equal(document.activeElement.id, 'curated');
  const chapterLink = document.querySelector('[data-chapter-link="chapter-one"]');
  chapterLink.focus();
  chapterLink.click();
  await tick();
  assert.equal(window.location.hash, '#chapter-one');
  assert.equal(get('worlds-dialog').open, false);
  assert.equal(document.activeElement, chapterLink);
  // Repeated notifications from Back/Forward must also leave normal page focus alone.
  get('worlds-search').focus();
  window.dispatchEvent(new window.PopStateEvent('popstate'));
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
  assert.equal(document.activeElement.id, 'worlds-search');
  dom.window.close();
});

test('filtered arrows follow the filtered list; variant buttons expose all four with selected labels', () => {
  const { dom, window, get, change } = setup();
  change('worlds-category', 'ad-selected');
  get('worlds-gallery').querySelector('button').click();
  get('worlds-next').click();
  assert.equal(window.location.hash, '#image=a02-v1');
  assert.equal(get('worlds-variants').children.length, 4);
  assert.match(get('worlds-variants').textContent, /Selected/);
  get('worlds-variants').querySelector('[data-worlds-variant="a02-v3"]').click();
  assert.equal(window.location.hash, '#image=a02-v3');
  assert.match(get('worlds-image-meta').textContent, /Alternate ad variation/);
  assert.equal(window.document.activeElement.dataset.worldsVariant, 'a02-v3');
  get('worlds-next').click();
  assert.equal(window.location.hash, '#image=a02-v4');
  assert.equal(get('worlds-image-copy').querySelector('b'), null);
  assert.match(get('worlds-image-copy').textContent, /<b>Bring your thought outside.<\/b>/);
  dom.window.close();
});

test('keyboard arrows are modal-only, do not hijack typing, and Escape dismissal works', async () => {
  const { dom, window, get } = setup();
  get('worlds-search').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(window.location.hash, '');
  get('curated').click();
  get('worlds-dialog').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(window.location.hash, '#image=c01-v2');
  get('modal-input').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(window.location.hash, '#image=c01-v2');
  const cancel = new window.Event('cancel', { cancelable: true });
  get('worlds-dialog').dispatchEvent(cancel);
  assert.equal(cancel.defaultPrevented, true);
  await tick();
  assert.equal(get('worlds-dialog').open, false);
  assert.equal(window.location.hash, '');
  dom.window.close();
});

test('reduced motion is honored and can be explicitly toggled without storage', () => {
  const { dom, document, get } = setup({ reduced: true });
  assert.equal(document.documentElement.dataset.motion, 'still');
  assert.equal(get('worlds-motion').getAttribute('aria-pressed'), 'true');
  get('worlds-motion').click();
  assert.equal(document.documentElement.dataset.motion, 'gentle');
  assert.equal(get('worlds-motion').getAttribute('aria-pressed'), 'false');
  dom.window.close();
});

test('backdrop dismisses but clicks inside the dialog do not; unknown image hashes are harmless', async () => {
  const { dom, window, get } = setup({ hash: '#image=unknown' });
  assert.equal(get('worlds-dialog').open, false);
  get('curated').click();
  const dialog = get('worlds-dialog');
  dialog.getBoundingClientRect = () => ({ left: 20, right: 300, top: 20, bottom: 500 });
  dialog.dispatchEvent(new window.MouseEvent('click', { clientX: 100, clientY: 100, bubbles: true }));
  assert.equal(dialog.open, true);
  dialog.dispatchEvent(new window.MouseEvent('click', { clientX: 5, clientY: 5, bubbles: true }));
  await tick();
  assert.equal(dialog.open, false);
  dom.window.close();
});

test('surprise and repeated opening do not stack redundant modal history entries', () => {
  const { dom, window, get } = setup();
  get('curated').click();
  get('curated').click();
  assert.equal(window.history.length, 2);
  const first = window.location.hash;
  get('worlds-surprise').click();
  assert.notEqual(window.location.hash, first);
  assert.equal(window.history.length, 2);
  assert.equal(get('worlds-dialog').open, true);
  dom.window.close();
});
