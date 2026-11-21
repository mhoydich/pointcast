import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { setImmediate } from 'node:timers/promises';
import { JSDOM } from 'jsdom';

const source = readFileSync(new URL('../src/pages/loom/index.astro', import.meta.url), 'utf8');
const [, body, script] = source.match(/<body>([\s\S]*?)<script is:inline>([\s\S]*?)<\/script>/);
const room = '#initial-read';
const log = { address: room, label: room, kind: 'topic', key: 'sample' };

for (const success of [true, false]) {
  test(`both initial reads show loading until the thread ${success ? 'resolves empty' : 'fails'}`, async t => {
    const { window } = new JSDOM(body, {
      url: 'https://pointcast.xyz/loom?to=%23initial-read', runScripts: 'outside-only',
    });
    t.after(() => window.close());
    const directory = Promise.withResolvers();
    const thread = Promise.withResolvers();
    const requestedThread = Promise.withResolvers();
    window.fetch = async path => {
      if (path === '/api/loom') return directory.promise;
      if (path === '/api/loom?to=%23initial-read') {
        requestedThread.resolve();
        return thread.promise;
      }
      return Response.json({ ok: true, messages: [], logs: [] });
    };
    window.HTMLElement.prototype.scrollIntoView = () => {};
    const summary = () => window.document.getElementById('threadSum').textContent;
    window.eval(script);
    assert.equal(summary(), 'Loading…');

    directory.resolve(Response.json({ ok: true, logs: [] }));
    await requestedThread.promise;
    assert.equal(summary(), 'Loading…');

    if (success) thread.resolve(Response.json({ ok: true, log, seq: 0, messages: [] }));
    else thread.reject(new TypeError('Network unavailable'));
    await setImmediate();
    assert.equal(summary(), success ? 'No messages yet' : 'Thread unavailable');
  });
}
