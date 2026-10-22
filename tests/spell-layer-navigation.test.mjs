import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const ambientIds = ['rain', 'starfield', 'snow', 'leaves', 'aurora', 'fog'];
const component = readFileSync(new URL('../src/components/SpellLayer.astro', import.meta.url), 'utf8');
const css = [...component.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)]
  .map(([, body]) => body).join('\n');
const bundle = await build({
  entryPoints: [fileURLToPath(new URL('../src/scripts/chrome/spell-layer.ts', import.meta.url))],
  bundle: true,
  write: false,
  format: 'iife',
  globalName: 'spellRuntime',
  platform: 'browser',
});

function fixture(t) {
  const dom = new JSDOM(`<!doctype html><html><head><style>${css}</style></head><body>
    <a href="#destination">A page link</a><div id="destination"></div>
    <div class="spell-layer" aria-hidden="true"></div>
  </body></html>`, {
    url: 'https://pointcast.test/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const { document } = window;
  const layer = document.querySelector('.spell-layer');
  const scopes = [];
  window.matchMedia = () => ({ matches: false });
  t.after(() => {
    for (const mounted of scopes) mounted.abort();
    window.close();
  });
  const runtime = window.eval(bundle.outputFiles[0].text + '\nspellRuntime;');

  function mount() {
    // Model only the ChromeScope lifecycle contract; run the real spell module.
    const controller = new window.AbortController();
    const callbacks = new Set();
    const timers = new Map();
    const scope = {
      on(target, type, listener, options = {}) {
        const normalized = typeof options === 'boolean' ? { capture: options } : options;
        target.addEventListener(type, listener, { ...normalized, signal: controller.signal });
      },
      cleanup(callback) { callbacks.add(callback); },
      abort() {
        if (controller.signal.aborted) return;
        controller.abort();
        for (const [id, cancel] of timers) cancel(id);
        timers.clear();
        for (const callback of callbacks) callback();
        callbacks.clear();
      },
    };
    for (const [schedule, cancel] of [
      ['setTimeout', 'clearTimeout'],
      ['setInterval', 'clearInterval'],
      ['requestAnimationFrame', 'cancelAnimationFrame'],
    ]) {
      scope[schedule] = (...args) => {
        const id = window[schedule](...args);
        timers.set(id, window[cancel].bind(window));
        return id;
      };
      scope[cancel] = (id) => { window[cancel](id); timers.delete(id); };
    }
    scopes.push(scope);
    runtime.mountSpellLayer(layer, scope);
    return scope;
  }

  const scope = mount();
  return {
    window, document, layer, scope, mount,
    cast(id) { window.dispatchEvent(new window.CustomEvent('pc:spell:cast', { detail: { id } })); },
    clear() { window.dispatchEvent(new window.CustomEvent('pc:spell:clear')); },
  };
}

for (const id of ambientIds) {
  test(`${id} stays decorative, single-instance and present until explicitly cleared`, (t) => {
    const app = fixture(t);
    app.cast(id);
    const effect = app.layer.querySelector(`.spell-${id}`);
    assert.ok(effect, `${id} is rendered by the public cast event`);
    app.cast(id);
    assert.equal(app.layer.children.length, 1, 'recasting must not stack full-page overlays');
    assert.equal(app.layer.firstElementChild, effect, 'recasting keeps the existing effect');
    assert.equal(effect.tagName, 'DIV');
    assert.equal(effect.getAttribute('aria-hidden'), 'true');
    assert.notEqual(effect.getAttribute('role'), 'button');
    assert.equal(effect.tabIndex, -1, 'decorative overlay must not enter the tab order');
    assert.equal(effect.querySelector('button, a[href], input, select, textarea, [tabindex], [contenteditable]'), null);

    const link = app.document.querySelector('a');
    link.focus();
    effect.focus();
    assert.equal(app.document.activeElement, link, 'overlay cannot take focus from page navigation');
    // JSDOM can check computed CSS, but does not do layout or pointer hit-testing.
    // Actual click-through to covered page links is a separate browser check.
    assert.equal(app.window.getComputedStyle(effect).pointerEvents, 'none');
    effect.click();
    for (const key of ['Enter', ' ', 'Escape']) {
      effect.dispatchEvent(new app.window.KeyboardEvent('keydown', { key, bubbles: true }));
    }
    assert.equal(effect.parentElement, app.layer, 'page interactions must not dismiss the ambient effect');
    app.clear();
    assert.equal(app.layer.children.length, 0, 'the public clear event still removes the effect');
  });
}

test('clear removes all six ambient effects together and permits fresh casts', (t) => {
  const app = fixture(t);
  ambientIds.forEach(app.cast);
  const originals = [...app.layer.children];
  assert.equal(originals.length, ambientIds.length);
  app.clear();
  app.clear();
  assert.equal(app.layer.children.length, 0, 'repeated clear is harmless');
  assert.ok(originals.every((node) => !node.isConnected));
  for (const id of ambientIds) {
    app.cast(id);
    app.cast(id);
    assert.equal(app.layer.querySelectorAll(`.spell-${id}`).length, 1);
  }
  assert.equal(app.layer.children.length, ambientIds.length);
  assert.ok([...app.layer.children].every((node) => !originals.includes(node)), 'clear resets active effect state');
});

test('scope cleanup removes ambient and burst DOM and stops the old mount responding', (t) => {
  const app = fixture(t);
  ambientIds.forEach(app.cast);
  app.cast('candle');
  app.window.dispatchEvent(new app.window.CustomEvent('pc:burst', { detail: { kind: 'bell' } }));
  assert.equal(app.layer.children.length, 8, 'six ambients, candle and an ephemeral burst are present');
  assert.ok(app.layer.querySelector('.spell-burst-pulse'));
  app.scope.abort();
  assert.equal(app.layer.children.length, 0, 'scope cleanup also removes transient burst DOM');
  ambientIds.forEach(app.cast);
  app.cast('candle');
  app.window.dispatchEvent(new app.window.CustomEvent('pc:burst', { detail: { kind: 'bell' } }));
  assert.equal(app.layer.children.length, 0, 'disposed event handlers cannot repaint the old layer');

  app.mount();
  ambientIds.forEach(app.cast);
  assert.equal(app.layer.children.length, ambientIds.length, 'a fresh page scope can cast every ambient again');
  app.clear();
  assert.equal(app.layer.children.length, 0);
});

test('the compact candle keeps click dismissal and can be cast again', (t) => {
  const app = fixture(t);
  app.cast('candle');
  app.cast('candle');
  const candle = app.layer.querySelector('.spell-candle');
  assert.equal(app.layer.children.length, 1);
  assert.equal(candle.tagName, 'BUTTON');
  assert.equal(candle.type, 'button');
  assert.equal(candle.tabIndex, 0);
  assert.match(candle.getAttribute('aria-label'), /snuff out/i);
  assert.equal(app.window.getComputedStyle(candle).pointerEvents, 'auto');
  candle.click();
  assert.equal(app.layer.children.length, 0, 'compact control still dismisses on click');
  app.cast('candle');
  assert.ok(app.layer.querySelector('.spell-candle'));
  assert.notEqual(app.layer.firstElementChild, candle, 'dismissal resets candle state');
  app.clear();
  assert.equal(app.layer.children.length, 0, 'clear still removes compact effects too');
});
