import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';

test('Classic playback controls have 44px tap targets in the phone layout', () => {
  const css = readFileSync(new URL('../src/styles/loom.css', import.meta.url), 'utf8');
  const document = new JSDOM('<style></style>').window.document;
  document.querySelector('style').textContent = css;
  const rules = Array.from(document.styleSheets[0].cssRules);
  const phone = rules.find(rule => rule.conditionText === '(max-width: 760px)');
  const buttons = Array.from(phone.cssRules).find(rule => rule.selectorText === '.lm-play button');

  assert.equal(buttons?.style.getPropertyValue('min-width'), '44px');
  assert.equal(buttons?.style.getPropertyValue('min-height'), '44px');
});
