import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';

const page = new URL('../public/loom/morning/index.html', import.meta.url);

test('first load, failed refresh and successful retry keep the edition and its evidence consistent', async (t) => {
  const dom = new JSDOM(await readFile(page, 'utf8'), { url: 'https://pointcast.xyz/loom/morning/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  t.after(() => {
    dom.window.close();
    delete globalThis.document;
    delete globalThis.window;
  });
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: Date.parse('2026-11-17T18:00:00Z') });
  const get = (id) => document.getElementById(id);
  const board = {
    ok: true, kvBound: true, exists: true, log: { address: '#officenoun-tasks', trimmedBefore: 1 },
    messages: [{ id: 'm_0000000001', seq: 1, at: '2026-11-17T01:00:00Z',
      from: { name: 'Desk', kind: 'agent' }, body: 'PUBLISHED · A new front door' }],
  };
  let status = 503;
  t.mock.method(globalThis, 'fetch', async () => Response.json(board, { status }));
  await import('../public/loom/morning/view.mjs');
  await setImmediate();
  assert.equal(get('sections').hidden, true);
  assert.match(get('status').textContent, /couldn’t load/i);

  status = 200;
  get('refresh').click();
  await setImmediate();
  const receipt = get('shipped').querySelector('a');
  assert.match(receipt.textContent, /A new front door/);
  assert.equal(get('status').textContent, '');

  status = 503;
  t.mock.timers.setTime(Date.parse('2026-11-18T18:00:00Z'));
  get('refresh').click();
  await setImmediate();
  assert.equal(get('sections').hidden, false);
  assert.equal(get('history-note').hidden, false);
  assert.equal(get('edition').dateTime, '2026-11-17T12:00:00.000Z');
  assert.equal(get('shipped').querySelector('a'), receipt);
  assert.match(get('status').textContent, /last card loaded/);

  status = 200;
  get('refresh').click();
  await setImmediate();
  assert.equal(get('edition').dateTime, '2026-11-18T12:00:00.000Z');
  assert.equal(get('shipped-empty').hidden, false);
  assert.equal(get('shipped').querySelector('a'), null);
  assert.equal(get('status').textContent, '');
});
