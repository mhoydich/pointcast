import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const component = readFileSync(new URL('../src/components/LoomMargin.astro', import.meta.url), 'utf8');
const markup = component.slice(component.indexOf('<aside'));

test('the Loom margin moves focus inside on open and restores it on either close path', () => {
  const dom = new JSDOM(markup, { url: 'https://pointcast.example/b/0696', runScripts: 'dangerously' });
  try {
    const { document, KeyboardEvent } = dom.window;
    const tab = document.querySelector('[data-loom-tab]');
    const close = document.querySelector('[data-loom-close]');
    const panel = document.querySelector('[data-loom-panel]');
    tab.focus();
    tab.click();
    assert.equal(document.activeElement, close);
    assert.equal(panel.hidden, false);
    assert.equal(tab.getAttribute('aria-expanded'), 'true');
    close.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(document.activeElement, tab);
    assert.equal(panel.hidden, true);
    assert.equal(tab.getAttribute('aria-expanded'), 'false');

    tab.click();
    assert.equal(document.activeElement, close);
    close.click();
    assert.equal(document.activeElement, tab);
    assert.equal(panel.hidden, true);
  } finally {
    dom.window.close();
  }
});
