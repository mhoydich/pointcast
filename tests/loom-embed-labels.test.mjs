import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';

test('each embed keeps its name and message labels when both fields are filled', async () => {
  const dom = new JSDOM('<pointcast-loom></pointcast-loom><pointcast-loom></pointcast-loom>', {
    runScripts: 'outside-only',
    url: 'https://example.test/',
  });
  try {
    dom.window.fetch = async () => ({ json: async () => ({
      ok: true, log: { label: 'test' }, count: 0, messages: [],
    }) });
    dom.window.eval(readFileSync(new URL('../public/loom/embed.js', import.meta.url), 'utf8'));
    await new Promise(resolve => setImmediate(resolve));
    for (const embed of dom.window.document.querySelectorAll('pointcast-loom')) {
      for (const [selector, caption] of [['input', 'Your name'], ['textarea', 'Message']]) {
        const field = embed.shadowRoot.querySelector(selector);
        field.value = 'A draft';
        assert.equal(field.labels.length, 1);
        const label = field.labels[0];
        assert.equal(label.control, field);
        assert.equal(label.textContent.trim(), caption);
      }
    }
  } finally {
    dom.window.close();
  }
});
