import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';

test('background refresh speaks changes and recovery while leaving an identical queue quiet', async (t) => {
  const html = await readFile(new URL('../public/loom/call/index.html', import.meta.url), 'utf8');
  const dom = new JSDOM(html, { url: 'https://pointcast.xyz/loom/call/', pretendToBeVisual: true });
  const { document, MutationObserver, Event } = dom.window;
  globalThis.document = document;
  t.after(() => { delete globalThis.document; dom.window.close(); });
  t.mock.timers.enable({ apis: ['setInterval'] });
  const ask = { link: 'loom:' + 'a'.repeat(24) + '#m_parent123', snippet: 'Choose a title' };
  const needsYes = [ask];
  let status = 200;
  t.mock.method(globalThis, 'fetch', async () => Response.json(
    { ok: true, owner: '@mike', piles: { needsYes } }, { status },
  ));
  const live = document.getElementById('queue-status');
  const spoken = [];
  const observer = new MutationObserver(() => spoken.push(live.textContent));
  observer.observe(live, { childList: true });
  t.after(() => observer.disconnect());
  const poll = async () => { t.mock.timers.tick(60_000); await setImmediate(); };

  await import('../public/loom/call/call.mjs');
  await setImmediate();
  assert.deepEqual(spoken.splice(0), ['1 decision ask for Mike.']);
  await poll();
  document.dispatchEvent(new Event('visibilitychange'));
  await setImmediate();
  assert.deepEqual(spoken, []);

  ask.snippet = 'Choose a date';
  await poll();
  assert.match(document.querySelector('.ask-text').textContent, /Choose a date/);
  assert.deepEqual(spoken.splice(0), ['Decision list updated. 1 decision ask for Mike.']);
  await poll();
  assert.deepEqual(spoken, []);

  status = 503;
  await poll();
  assert.match(spoken.pop(), /out of date/);
  await poll();
  assert.deepEqual(spoken, []);
  status = 200;
  await poll();
  assert.deepEqual(spoken.splice(0), ['1 decision ask for Mike.']);

  document.getElementById('refresh').click();
  await setImmediate();
  assert.match(spoken.shift(), /Reading decision asks/);
  assert.deepEqual(spoken.splice(0), ['1 decision ask for Mike.']);
  needsYes.length = 0;
  await poll();
  assert.match(spoken.pop(), /No decision asks for Mike/);
  assert.equal(document.querySelector('#asks li'), null);
});
