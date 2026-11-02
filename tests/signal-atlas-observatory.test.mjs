import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const root = new URL('../public/signal-atlas/observatory/', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const css = readFileSync(new URL('assets/styles.css', root), 'utf8');
const source = readFileSync(new URL('assets/app.js', root), 'utf8');
function setup(t, supports3d = true, { reduced = false, legacy = false } = {}) {
  const dom = new JSDOM(html, { url: 'https://pointcast.xyz/signal-atlas/observatory/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  Object.defineProperty(w, 'CSS', { value: { supports: () => supports3d } });
  const preferenceListeners = new Set();
  const preference = { matches: reduced };
  if (legacy) preference.addListener = listener => preferenceListeners.add(listener);
  else preference.addEventListener = (type, listener) => {
    if (type === 'change') preferenceListeners.add(listener);
  };
  w.matchMedia = () => preference;
  const setReduced = value => {
    preference.matches = value;
    for (const listener of preferenceListeners) listener();
  };
  w.eval(source);
  t.after(() => w.close());
  const $ = id => w.document.getElementById(id);
  const pointer = (type, values = {}) => {
    const event = new w.MouseEvent(type, { bubbles: true, button: 0, buttons: 1, ...values });
    for (const [key, value] of Object.entries({ pointerId: 1, isPrimary: true, pointerType: 'mouse', ...values })) {
      if (['pointerId', 'isPrimary', 'pointerType'].includes(key)) Object.defineProperty(event, key, { value });
    }
    $('viewport').dispatchEvent(event);
  };
  return { w, $, pointer, setReduced, api: w.PointCastObservatory };
}

test('observatory remains local, isolated, truthful and CSP-compatible', () => {
  for (const match of html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)) assert(existsSync(new URL(match[1], root)));
  assert(html.includes('href="../#collection"'));
  assert(html.includes('noindex,nofollow'));
  assert(html.includes('GEOMETRIC FORM STUDY · FICTIONAL'));
  assert(html.includes('No live visitors or scores'));
  // Canonical/share data may name URLs but never fetches or executes them.
  const runtimeHtml = html.replace(/<!-- atlas-release-metadata:start -->[\s\S]*?<!-- atlas-release-metadata:end -->/, '');
  assert(!/(?:https?:\/\/|fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|<audio|<iframe)/.test(runtimeHtml + css + source));
  const doc = new JSDOM(html).window.document;
  for (const element of doc.querySelectorAll('[src],[href]')) {
    if (element.matches('link[rel="canonical"]')) continue;
    assert(!/^https?:/.test(element.getAttribute('src') ?? element.getAttribute('href')));
  }
  assert.equal(doc.querySelectorAll('script:not([src]):not([type="application/ld+json"])').length, 0);
  assert.equal(JSON.parse(doc.querySelector('script[type="application/ld+json"]').textContent)['@type'], 'WebPage');
  assert(!/style=|innerHTML/.test(html + source));
  assert(css.includes('min-height:44px'));
  assert(css.includes('touch-action:pan-y'));
});

test('three fictional geometries start disconnected with motion off', t => {
  const { w, $, api } = setup(t);
  assert.equal(api.getState().connected, false);
  assert.equal(api.getState().fictional, true);
  assert.equal(api.getState().selected, 'tessel');
  assert.equal($('creatures').querySelectorAll('.resident').length, 3);
  assert.equal($('creatures').querySelectorAll('.face').length, 54);
  assert.equal($('motion').checked, false);
  assert.equal(w.document.body.classList.contains('motion-on'), false);
  assert.equal(api.setConnection, undefined);
});

test('card selection preserves focus and emits only fictional selection', t => {
  const { w, $, api } = setup(t);
  const events = [];
  w.addEventListener('pointcast:creature-select', event => events.push(event.detail));
  const card = w.document.querySelector('.card.kiri');
  card.focus(); card.click();
  assert.equal($('detail-name').textContent, 'Kiri');
  assert.equal(w.document.activeElement, card);
  assert.equal(w.document.querySelectorAll('[data-resident][aria-pressed=true]').length, 2);
  assert.equal(events[0].id, 'threader');
  assert.equal(events[0].fictional, true);
  assert.equal(events[0].source, 'observatory-design-study');
  assert(api.selectCreature('tuner'));
  assert.equal(api.getState().selected, 'ollo');
  assert.equal(api.selectCreature('<script>bad</script>'), false);
  assert.equal(api.getState().selected, 'ollo');
});

test('camera keyboard controls and boundaries work', t => {
  const { w, $, api } = setup(t);
  $('viewport').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  assert.equal(api.getState().yaw, -33);
  for (let i = 0; i < 100; i++) $('rotate-right').click();
  assert.equal(api.getState().yaw, 45);
  for (let i = 0; i < 100; i++) $('viewport').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
  assert.equal(api.getState().pitch, 70);
  $('viewport').dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(api.getState().yaw, -25);
  assert.equal(api.getState().pitch, 56);
});

test('pre-capture departure or released mouse never becomes a phantom drag', t => {
  const { pointer, api } = setup(t);
  pointer('pointerdown', { clientX: 0 });
  pointer('pointerleave', { clientX: 2 });
  pointer('pointermove', { clientX: 60, buttons: 0 });
  assert.equal(api.getState().yaw, -25);
  pointer('pointerdown', { clientX: 0 });
  pointer('pointermove', { clientX: 60, buttons: 0 });
  assert.equal(api.getState().yaw, -25);
});

test('secondary pointers cannot steal or cancel the active drag', t => {
  const { pointer, api } = setup(t);
  pointer('pointerdown', { pointerId: 1, clientX: 0 });
  pointer('pointerdown', { pointerId: 2, isPrimary: false, clientX: 100 });
  pointer('pointerup', { pointerId: 2 });
  pointer('pointermove', { pointerId: 1, clientX: 40 });
  assert.equal(api.getState().yaw, -13);
  pointer('pointercancel', { pointerId: 1 });
  pointer('pointermove', { pointerId: 1, clientX: 80 });
  assert.equal(api.getState().yaw, -13);
});

test('drag suppresses incidental click but never keyboard selection', t => {
  const { w, pointer, api } = setup(t);
  pointer('pointerdown', { clientX: 0 });
  pointer('pointermove', { clientX: 40 });
  const kiri = w.document.querySelector('.resident.kiri');
  kiri.dispatchEvent(new w.MouseEvent('click', { bubbles: true, detail: 1 }));
  assert.equal(api.getState().selected, 'tessel');
  kiri.dispatchEvent(new w.MouseEvent('click', { bubbles: true, detail: 0 }));
  assert.equal(api.getState().selected, 'kiri');
});

test('lost pointer capture releases suppression for the next pointer click', async t => {
  const { w, pointer, api } = setup(t);
  pointer('pointerdown', { clientX: 0 });
  pointer('pointermove', { clientX: 40 });
  pointer('lostpointercapture');
  await new Promise(resolve => w.setTimeout(resolve, 5));
  w.document.querySelector('.card.ollo').dispatchEvent(new w.MouseEvent('click', { bubbles: true, detail: 1 }));
  assert.equal(api.getState().selected, 'ollo');
});

test('2D mode is reversible and preserves selection', t => {
  const { w, $, api } = setup(t);
  api.selectCreature('ollo');
  $('motion').checked = true;
  $('motion').dispatchEvent(new w.Event('change'));
  $('view-toggle').click();
  assert.equal(api.getState().view, '2d');
  assert.equal($('viewport').tabIndex, -1);
  assert.equal($('reset').disabled, true);
  assert.equal($('motion').disabled, true);
  assert.equal($('motion').checked, false);
  assert.equal(w.document.body.classList.contains('motion-on'), false);
  assert.match($('motion-note').textContent, /unavailable in 2D/);
  assert.match($('viewport').getAttribute('aria-label'), /^2D observatory/);
  assert.equal(api.getState().selected, 'ollo');
  $('view-toggle').click();
  assert.equal(api.getState().view, '3d');
  assert.equal($('viewport').tabIndex, 0);
  assert.equal($('reset').disabled, false);
  assert.equal($('motion').disabled, false);
  assert.equal($('motion').checked, false);
  assert.equal(w.document.body.classList.contains('motion-on'), false);
  assert.match($('viewport').getAttribute('aria-label'), /^3D observatory/);
});

test('unsupported CSS activates a truthful usable 2D fallback', t => {
  const { w, $, api } = setup(t, false);
  assert.equal(api.getState().view, '2d');
  assert.equal($('view-toggle').disabled, true);
  assert.equal($('reset').disabled, true);
  assert.equal($('viewport').tabIndex, -1);
  assert.equal($('motion').disabled, true);
  assert.match($('viewport').getAttribute('aria-label'), /^2D observatory/);
  assert.match($('scene-help').textContent, /3D is unavailable/);
  w.document.querySelector('.card.kiri').click();
  assert.equal(api.getState().selected, 'kiri');
});

test('motion is selected explicitly, pauses hidden, and respects OS reduction', t => {
  const { w, $ } = setup(t);
  $('motion').checked = true;
  $('motion').dispatchEvent(new w.Event('change'));
  assert(w.document.body.classList.contains('motion-on'));
  Object.defineProperty(w.document, 'hidden', { configurable: true, value: true });
  w.document.dispatchEvent(new w.Event('visibilitychange'));
  assert(w.document.body.classList.contains('motion-paused'));
  assert(css.includes('prefers-reduced-motion:reduce'));
  assert(css.includes('animation:none!important'));
  assert(css.includes('.offscreen .sculpture{animation-play-state:paused}'));
});

test('initial reduced-motion preference disables and labels optional animation', t => {
  const { w, $ } = setup(t, true, { reduced: true });
  assert.equal($('motion').disabled, true);
  assert.equal($('motion').checked, false);
  assert.match($('motion-note').textContent, /system preference/);
  $('motion').checked = true;
  $('motion').dispatchEvent(new w.Event('change'));
  assert.equal($('motion').checked, false);
  assert.equal(w.document.body.classList.contains('motion-on'), false);
});

for (const legacy of [false, true]) {
  test(`system motion changes stop animation without automatically restarting (${legacy ? 'legacy' : 'modern'} listener)`, t => {
    const { w, $, setReduced } = setup(t, true, { legacy });
    $('motion').checked = true;
    $('motion').dispatchEvent(new w.Event('change'));
    assert(w.document.body.classList.contains('motion-on'));
    setReduced(true);
    assert.equal($('motion').disabled, true);
    assert.equal($('motion').checked, false);
    assert.equal(w.document.body.classList.contains('motion-on'), false);
    setReduced(false);
    assert.equal($('motion').disabled, false);
    assert.equal($('motion').checked, false);
    assert.equal(w.document.body.classList.contains('motion-on'), false);
    $('view-toggle').click();
    setReduced(true);
    setReduced(false);
    assert.equal($('motion').disabled, true);
    assert.match($('motion-note').textContent, /unavailable in 2D/);
  });
}
