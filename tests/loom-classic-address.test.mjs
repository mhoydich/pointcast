import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { parseAddress } from '../src/lib/loom/address.mjs';
import { fold } from '../src/lib/loom/fold.mjs';

const source = readFileSync(new URL('../src/pages/loom/classic.astro', import.meta.url), 'utf8');
const markup = source.match(/<main class="lm" data-loom>[\s\S]*?<\/main>/)[0];
const script = stripTypeScriptTypes(source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^  import .*;$/gm, ''));

test('Classic describes invalid address submissions beside the input and clears the error on edit', () => {
  const { window } = new JSDOM(markup, { url: 'https://pointcast.xyz/loom/classic', runScripts: 'outside-only' });
  try {
    const requests = [];
    Object.assign(window, { parseAddress, fold, fetch: (path) => { requests.push(path); return new Promise(() => {}); } });
    window.eval(script);
    const form = window.document.querySelector('[data-goto]');
    const input = form.querySelector('[data-to-input]');
    const error = form.querySelector('[role="status"]');
    const submit = () => form.dispatchEvent(new window.Event('submit', { cancelable: true }));
    const edit = (value) => { input.value = value; input.dispatchEvent(new window.Event('input')); };

    edit('not a Loom address');
    submit();
    assert.match(error.textContent, /Try a link/);
    assert.equal(input.getAttribute('aria-invalid'), 'true');
    assert.equal(input.getAttribute('aria-describedby'), error.id);
    assert.equal(window.document.activeElement, input);
    assert.equal(window.document.querySelector('[data-status]').textContent, '');
    assert.deepEqual(requests, ['/api/loom?to=%23loom']);

    edit('');
    assert.equal(error.textContent, '');
    assert.equal(input.hasAttribute('aria-invalid'), false);
    assert.equal(input.getAttribute('aria-describedby'), 'lm-to-hint');
    submit();
    assert.equal(error.textContent, 'Enter an address to open.');

    edit('#loom-ux');
    submit();
    assert.equal(error.textContent, '');
    assert.equal(window.location.search, '?to=%23loom-ux');
    assert.deepEqual(requests, ['/api/loom?to=%23loom', '/api/loom?to=%23loom-ux']);
  } finally {
    window.close();
  }
});
