import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';

test('the host line action has a 44px minimum height on phones', () => {
  const page = readFileSync(new URL('../src/pages/loom/index.astro', import.meta.url), 'utf8');
  const [, css] = page.match(/<style is:inline>([\s\S]*?)<\/style>/);
  const { document } = new JSDOM('<style></style>').window;
  document.querySelector('style').textContent = css;
  const rules = Array.from(document.styleSheets[0].cssRules);
  const phoneRules = rules.filter(rule => rule.conditionText === '(max-width: 640px)');
  const hostAction = phoneRules.flatMap(rule => Array.from(rule.cssRules))
    .find(rule => rule.selectorText === '.hostline button');

  assert.equal(hostAction?.style.getPropertyValue('min-height'), '44px');
});
