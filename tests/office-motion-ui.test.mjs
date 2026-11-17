import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createMotionControls } from '../public/office/motion-ui.mjs';

function fixture(matches, legacy = false) {
  const listeners = new Map();
  const element = {
    attrs: {},
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(k, fn) { listeners.set(k, fn); },
    removeEventListener(k, fn) { if (listeners.get(k) === fn) listeners.delete(k); },
    remove() { this.removed = true; },
    click() { listeners.get('click')?.(); },
  };
  let subscription;
  const query = { matches };
  const add = fn => { subscription = fn; };
  const remove = fn => { if (subscription === fn) subscription = undefined; };
  if (legacy) { query.addListener = add; query.removeListener = remove; }
  else {
    query.addEventListener = (_, fn) => add(fn);
    query.removeEventListener = (_, fn) => remove(fn);
  }
  const root = { dataset: {} };
  const document = { createElement: () => element };
  const controls = createMotionControls(document, root, { matchMedia: () => query });
  return { element, root, controls, emit(value) { query.matches = value; subscription?.(); }, subscribed: () => !!subscription };
}

test('OS reduction cannot be overridden; system changes are observed', () => {
  const f = fixture(true);
  assert.equal(f.root.dataset.motion, 'reduced');
  assert.equal(f.element.attrs['aria-pressed'], 'true');
  assert.equal(f.element.disabled, true);
  f.element.click();
  assert.equal(f.root.dataset.motion, 'reduced');
  f.emit(false);
  assert.equal(f.root.dataset.motion, 'full');
  assert.equal(f.element.disabled, false);
  f.element.click();
  assert.equal(f.root.dataset.motion, 'reduced');
  f.emit(true);
  f.emit(false);
  assert.equal(f.root.dataset.motion, 'reduced', 'explicit still choice survives OS changes');
  f.element.click();
  assert.equal(f.root.dataset.motion, 'full');
  assert.equal(f.element.attrs['aria-pressed'], 'false');
});

test('unknown, unavailable, or throwing preference detection stays static', () => {
  for (const matchMedia of [undefined, () => undefined, () => ({}), () => { throw Error('unavailable'); }]) {
    const root = { dataset: {} };
    const el = { setAttribute() {}, addEventListener() {} };
    const { element } = createMotionControls({ createElement: () => el }, root, { matchMedia });
    assert.equal(root.dataset.motion, 'reduced');
    assert.equal(element.disabled, true);
  }
});

test('modern and legacy subscriptions are removed; teardown stays static and is idempotent', () => {
  for (const legacy of [false, true]) {
    const f = fixture(false, legacy);
    assert.equal(f.subscribed(), true);
    f.controls.destroy();
    assert.equal(f.subscribed(), false);
    assert.equal(f.element.removed, true);
    f.element.click();
    f.emit(false);
    f.controls.destroy();
    assert.equal(f.root.dataset.motion, 'reduced');
  }
});

test('browser matchMedia uses its window receiver', () => {
  const root = { dataset: {} };
  const win = { matchMedia(query) { assert.equal(this, win); assert.equal(query, '(prefers-reduced-motion: reduce)'); return { matches: false }; } };
  createMotionControls({ defaultView: win, createElement: () => ({ setAttribute() {}, addEventListener() {} }) }, root);
  assert.equal(root.dataset.motion, 'full');
});

test('CSS suppression covers descendants, pseudo-elements, OS preference, and smooth scrolling', () => {
  const css = readFileSync(new URL('../public/office/motion-ui.css', import.meta.url), 'utf8');
  assert.match(css, /\[data-motion='reduced'\] \*::before/);
  assert.match(css, /\[data-motion='reduced'\] \*::after/);
  assert.match(css, /animation: none !important/);
  assert.match(css, /transition: none !important/);
  assert.match(css, /scroll-behavior: auto !important/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
