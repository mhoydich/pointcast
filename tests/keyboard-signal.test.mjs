import assert from 'node:assert/strict';
import test from 'node:test';

import { onRequestGet, onRequestPost } from '../functions/api/keyboard/signal.ts';
import { estimateKey, noteName, textToNotes } from '../functions/_lib/keyboard-signal.ts';

function context(request, env) {
  return { request, env, functionPath: '/api/keyboard/signal', params: {}, data: {}, waitUntil() {}, next: async () => new Response('next') };
}

function fakeSignal(reply) {
  const calls = [];
  const env = {
    KEYBOARD_SIGNAL: {
      idFromName(name) { assert.equal(name, 'global'); return name; },
      get() {
        return {
          async fetch(url, init = {}) {
            calls.push({ url, method: init.method, body: init.body ? JSON.parse(init.body) : null });
            return new Response(JSON.stringify(typeof reply === 'function' ? reply(url) : reply));
          },
        };
      },
    },
  };
  return { env, calls };
}

test('textToNotes plays letters on a C pentatonic and rests on everything else', () => {
  assert.deepEqual(textToNotes('ae'), [60, 69]);
  assert.deepEqual(textToNotes('f'), [72]);
  assert.deepEqual(textToNotes('A e!'), [60, 69]);
  assert.deepEqual(textToNotes('0'), [48]);
  assert.equal(textToNotes('x'.repeat(200)).length, 64);
  for (const n of textToNotes('the quick brown fox jumps over the lazy dog 0123456789')) assert.ok(n >= 48 && n <= 81);
});

test('estimateKey hears C major in a C major scale and waits for enough notes', () => {
  const cMajor = [8, 0, 5, 0, 6, 4, 0, 7, 0, 4, 0, 3];
  assert.equal(estimateKey(cMajor).name, 'C major');
  const aMinor = [5, 0, 3, 0, 5, 3, 0, 2, 1, 8, 0, 3];
  assert.equal(estimateKey(aMinor).name, 'A minor');
  assert.equal(estimateKey([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), null);
  assert.equal(estimateKey('nope'), null);
  assert.equal(noteName(60), 'C4');
  assert.equal(noteName(70), 'Bb4');
});

test('POST forwards notes with an inferred pointcast source', async () => {
  const { env, calls } = fakeSignal({ ok: true, globalTotal: 3, notes: 3, keys: 0, id: 1 });
  const res = await onRequestPost(context(new Request('https://pointcast.xyz/api/keyboard/signal', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain', Referer: 'https://pointcast.xyz/keyboard/diary' },
    body: JSON.stringify({ notes: [60, 64, 67] }),
  }), env));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
  assert.deepEqual(calls[0].body.notes, [60, 64, 67]);
  assert.equal(calls[0].body.source.kind, 'pointcast');
  assert.equal(calls[0].body.source.app, '/keyboard/diary');
});

test('POST turns text into notes without forwarding the text', async () => {
  const { env, calls } = fakeSignal({ ok: true });
  await onRequestPost(context(new Request('https://pointcast.xyz/api/keyboard/signal', {
    method: 'POST', body: JSON.stringify({ text: 'hello', app: 'my-script', kind: 'agent' }),
  }), env));
  assert.deepEqual(calls[0].body.notes, textToNotes('hello'));
  assert.ok(!('text' in calls[0].body));
  assert.deepEqual(calls[0].body.source, { kind: 'agent', app: 'my-script', place: null });
});

test('POST rejects empty, malformed and oversized bodies before the counter', async () => {
  const { env, calls } = fakeSignal({ ok: true });
  const post = (body) => onRequestPost(context(new Request('https://pointcast.xyz/api/keyboard/signal', { method: 'POST', body }), env));
  assert.equal((await post('{}')).status, 400);
  assert.equal((await post('not json')).status, 400);
  assert.equal((await post(JSON.stringify({ count: 0 }))).status, 400);
  assert.equal((await post('x'.repeat(9000))).status, 413);
  assert.equal(calls.length, 0);
  assert.equal((await post(JSON.stringify({ count: 5 }))).status, 200);
});

test('a foreign origin cannot claim to be pointcast', async () => {
  const { env, calls } = fakeSignal({ ok: true });
  await onRequestPost(context(new Request('https://pointcast.xyz/api/keyboard/signal', {
    method: 'POST', headers: { Origin: 'https://friend.example' },
    body: JSON.stringify({ count: 2, kind: 'pointcast', app: 'keyboard' }),
  }), env));
  assert.equal(calls[0].body.source.kind, 'embed');
});

test('GET adds today\'s key; since and league pass straight through', async () => {
  const cMajor = [8, 0, 5, 0, 6, 4, 0, 7, 0, 4, 0, 3];
  const { env, calls } = fakeSignal((url) => (url.includes('?') ? { latestId: 9, phrases: [] } : {
    globalTotal: 50, pitchClasses: cMajor, today: { day: '2026-09-26', pitchClasses: cMajor },
  }));
  const summary = await (await onRequestGet(context(new Request('https://pointcast.xyz/api/keyboard/signal'), env))).json();
  assert.equal(summary.key.today.name, 'C major');
  const since = await (await onRequestGet(context(new Request('https://pointcast.xyz/api/keyboard/signal?since=4'), env))).json();
  assert.equal(since.latestId, 9);
  assert.match(calls[1].url, /\?since=4$/);
  await onRequestGet(context(new Request('https://pointcast.xyz/api/keyboard/signal?league=1&week=2026-09-28&junk=1'), env));
  assert.match(calls[2].url, /\?league=1&week=2026-09-28$/);
});

test('without the binding the API says so instead of pretending', async () => {
  const res = await onRequestGet(context(new Request('https://pointcast.xyz/api/keyboard/signal'), {}));
  assert.equal(res.status, 503);
});
