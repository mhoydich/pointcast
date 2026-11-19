import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';

const folder = new URL('../public/sketches/shareables/flame-with-a-line/', import.meta.url);
const source = readFileSync(new URL('index.html', folder), 'utf8');
const preview = readFileSync(new URL('preview.png', folder));
const base = 'https://example.org/another-app/light.html';

function openPage(t, url = base, javascript = true) {
  const { window } = new JSDOM(source, { url, runScripts: 'outside-only' });
  t.after(() => window.close());
  if (javascript) window.eval(window.document.querySelector('script').textContent);
  return window.document;
}

test('the default still and social card fit the standalone shareable budget', t => {
  const doc = openPage(t, base, false);
  assert.equal(doc.querySelector('#line').textContent, 'I left a light on for you.');
  assert.equal(doc.querySelector('#art').dataset.fire, 'hearth');
  assert.ok(doc.querySelector('#maker').hidden && doc.querySelector('#make').hidden);
  assert.match(source, /^<!-- SPDX-License-Identifier: MIT-0 -->$/m);
  assert.equal(doc.querySelectorAll('script[src], link[rel="stylesheet"], img[src], audio, video').length, 0);
  assert.equal(preview.subarray(1, 4).toString(), 'PNG');
  assert.deepEqual([preview.readUInt32BE(16), preview.readUInt32BE(20)], [1200, 630]);
  assert.ok(Buffer.byteLength(source) + preview.length < 60_000);
});

test('a sender on another host can copy a portable link and a recipient sees just their card', async t => {
  const doc = openPage(t, base + '?utm_source=private');
  let copied;
  Object.defineProperty(doc.defaultView.navigator, 'clipboard', {value: {writeText: async url => { copied = url; }}});
  const text = 'For Sam & Eli: <flowers> 🌻';
  const words = doc.querySelector('#words');
  words.value = text;
  doc.querySelector('input[value="campfire"]').click();
  doc.querySelector('.copy').click();
  await setImmediate();
  assert.equal(doc.querySelector('#status').textContent, 'Link copied.');
  const url = new URL(copied);
  assert.equal(url.origin + url.pathname, base);
  assert.equal(url.search, '');
  const received = openPage(t, copied);
  assert.equal(received.querySelector('#art').dataset.fire, 'campfire');
  assert.equal(received.querySelector('#line').textContent, text);
  assert.equal(received.querySelector('#line').childElementCount, 0);
  assert.equal(received.querySelector('#maker').hidden, true);
  received.querySelector('#make').click();
  assert.equal(received.querySelector('#maker').hidden, false);
  assert.equal(received.activeElement.id, 'words');
});

test('an unavailable clipboard leaves a selectable link and a blank line cannot be sent', async t => {
  const doc = openPage(t);
  const words = doc.querySelector('#words');
  words.value = '  ';
  doc.querySelector('.copy').click();
  assert.equal(words.checkValidity(), false);
  words.value = 'Love,\n Bea.';
  words.dispatchEvent(new doc.defaultView.Event('input', { bubbles: true }));
  doc.querySelector('.copy').click();
  await setImmediate();
  assert.equal(doc.querySelector('#fallback').hidden, false);
  const field = doc.querySelector('#link');
  assert.equal(doc.activeElement, field);
  assert.equal(new URLSearchParams(new URL(field.value).hash.slice(1)).get('line'), 'Love, Bea.');
});

test('invalid or oversized fragments leave a usable default instead of interpreting them', t => {
  for (const hash of ['#fire=constructor&line=hello', '#fire=candle&line=', '#fire=candle&line=' + 'x'.repeat(141)]) {
    const doc = openPage(t, base + hash);
    assert.equal(doc.querySelector('#maker').hidden, false);
    assert.equal(doc.querySelector('#art').dataset.fire, 'hearth');
  }
});
