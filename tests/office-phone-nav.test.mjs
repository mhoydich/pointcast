import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhoneNav } from '../public/office/phone-nav.mjs';

// Minimal DOM double tests this module's DOM contract without browser dependencies.
class Element {
  constructor(tagName) { this.tagName = tagName; this.attributes = {}; this.children = []; this.listeners = {}; }
  setAttribute(name, value) { this.attributes[name] = value; }
  append(child) { this.children.push(child); }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  click() { this.listeners.click(); }
}
const document = { createElement: tag => new Element(tag) };

test('native navigation labels and controls identify the three host panels', () => {
  const { element } = createPhoneNav(document);
  assert.equal(element.tagName, 'nav');
  assert.equal(element.attributes['aria-label'], 'Office views');
  assert.deepEqual(element.children.map(b => [b.tagName, b.type, b.textContent, b.attributes['aria-controls']]), [
    ['button', 'button', 'Floor', 'office-floor'],
    ['button', 'button', 'Activity', 'office-activity'],
    ['button', 'button', 'Evidence', 'office-evidence'],
  ]);
  assert.deepEqual(element.children.map(b => b.attributes['aria-pressed']), ['true', 'false', 'false']);
});

test('activation selects before callback; external synchronization does not emit callbacks', () => {
  const calls = [];
  const nav = createPhoneNav(document, { onSelect(view) {
    calls.push(view);
    assert.equal(nav.element.children[2].attributes['aria-pressed'], 'true');
  } });
  nav.element.children[2].click();
  assert.deepEqual(calls, ['evidence']);
  nav.setSelected('activity');
  assert.deepEqual(calls, ['evidence']);
  assert.deepEqual(nav.element.children.map(b => b.attributes['aria-pressed']), ['false', 'true', 'false']);
  assert.throws(() => nav.setSelected('unknown'), RangeError);
  assert.deepEqual(nav.element.children.map(b => b.attributes['aria-pressed']), ['false', 'true', 'false']);
});

test('callbacks are optional and instances do not share state', () => {
  const a = createPhoneNav(document);
  const b = createPhoneNav(document);
  a.element.children[1].click();
  assert.equal(b.element.children[0].attributes['aria-pressed'], 'true');
  assert.throws(() => createPhoneNav(document, { onSelect: true }), TypeError);
});
