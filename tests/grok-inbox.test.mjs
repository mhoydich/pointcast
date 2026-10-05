import test from 'node:test';
import assert from 'node:assert/strict';
import {
  answerPing,
  listPings,
  matchDevnetReply,
  parseIncoming,
  replyMarker,
  savePing,
  tokensMatch,
} from '../functions/_lib/grok-inbox.mjs';

function memoryKv() {
  const store = new Map();
  const writes = [];
  return {
    store,
    writes,
    async get(key) { return store.has(key) ? store.get(key) : null; },
    async put(key, value) {
      writes.push({ key, value });
      store.set(key, value);
    },
  };
}

test('a ping is cleaned, stored, and listed as open', async () => {
  const kv = memoryKv();
  const parsed = parseIncoming({ text: '  hello   court  ', kind: 'ping', handle: 'Mike', company: '' });
  assert.equal(parsed.ok, true);
  const saved = await savePing(kv, parsed);
  assert.match(saved.id, /^g[a-z0-9]{8}$/);
  assert.equal(saved.status, 'open');
  assert.equal(saved.text, 'hello court');
  const open = await listPings(kv, 'open');
  assert.equal(open.length, 1);
  assert.equal(open[0].id, saved.id);
});

test('honeypot, links, and a sky call without a guess are refused', () => {
  assert.equal(parseIncoming({ text: 'hi', kind: 'ping', company: 'acme' }).honeypot, true);
  assert.equal(parseIncoming({ text: 'see https://example.com', kind: 'question' }).ok, false);
  assert.equal(parseIncoming({ text: 'marine layer?', kind: 'sky' }).ok, false);
  const sky = parseIncoming({ text: 'marine layer tomorrow', kind: 'sky', sky: 'no' });
  assert.equal(sky.ok, true);
  assert.equal(sky.sky, 'no');
});

test('an answer sticks, and a devnet line can name the ping', async () => {
  const kv = memoryKv();
  const saved = await savePing(kv, parseIncoming({ text: 'serve', kind: 'game', handle: 'visitor' }));
  const answered = await answerPing(kv, saved.id, { reply_text: 'game point', devnet_tx: 'abc' });
  assert.equal(answered.ok, true);
  assert.equal(answered.ping.status, 'answered');
  assert.equal((await listPings(kv, 'open')).length, 0);
  const marker = replyMarker(saved.id);
  assert.equal(matchDevnetReply(`Clear.\n${marker}`, saved.id), true);
  assert.equal(matchDevnetReply('re: ping gzzzzzzzz', saved.id), false);
  assert.equal(tokensMatch('secret', 'secret'), true);
  assert.equal(tokensMatch('secret', 'secreT'), false);
  assert.equal(tokensMatch('', 'secret'), false);
});

test('listing a missing record performs no writes and preserves the index and valid records', async () => {
  const kv = memoryKv();
  const open = await savePing(kv, parseIncoming({ text: 'open ping', kind: 'ping' }));
  const answered = await savePing(kv, parseIncoming({ text: 'answered ping', kind: 'question' }));
  await answerPing(kv, answered.id, { reply_text: 'public answer' });
  kv.store.set('grok:inbox:index', JSON.stringify(['gmissing1', open.id, answered.id]));
  const before = new Map(kv.store);
  kv.writes.length = 0;

  const all = await listPings(kv);
  assert.deepEqual(all.map((ping) => ping.id).sort(), [open.id, answered.id].sort());
  assert.deepEqual((await listPings(kv, 'open')).map((ping) => ping.id), [open.id]);
  assert.deepEqual((await listPings(kv, 'answered')).map((ping) => ping.id), [answered.id]);
  assert.deepEqual(kv.writes, []);
  assert.deepEqual(kv.store, before);
});

test('a paused listing cannot prune a concurrently saved ping from the index', { timeout: 5000 }, async () => {
  const kv = memoryKv();
  const existing = await savePing(kv, parseIncoming({ text: 'existing ping', kind: 'ping' }));
  // An expired KV record is absent while its ID remains in the stored index.
  kv.store.set('grok:inbox:index', JSON.stringify(['gexpired1', existing.id]));
  kv.writes.length = 0;
  const get = kv.get.bind(kv);
  let pauseOnce = true;
  let markPaused;
  let resume;
  const paused = new Promise((resolve) => { markPaused = resolve; });
  const resumed = new Promise((resolve) => { resume = resolve; });
  kv.get = async (key) => {
    if (key === 'grok:inbox:gexpired1' && pauseOnce) {
      pauseOnce = false;
      markPaused();
      await resumed;
    }
    return get(key);
  };

  const listing = listPings(kv, 'open');
  await paused;
  let saved;
  let afterSave;
  let saveWrites;
  try {
    assert.deepEqual(kv.writes, []);
    saved = await savePing(kv, parseIncoming({ text: 'concurrent ping', kind: 'ping' }));
    assert.deepEqual(kv.writes.map(({ key }) => key), [`grok:inbox:${saved.id}`, 'grok:inbox:index']);
    assert.deepEqual(JSON.parse(kv.store.get('grok:inbox:index')), [saved.id, 'gexpired1', existing.id]);
    afterSave = new Map(kv.store);
    saveWrites = kv.writes.slice();
  } finally {
    resume();
  }

  assert.deepEqual((await listing).map((ping) => ping.id), [existing.id]);
  assert.deepEqual(kv.store, afterSave);
  assert.deepEqual(kv.writes, saveWrites);
  const current = await listPings(kv, 'open');
  assert.deepEqual(current.map((ping) => ping.id).sort(), [saved.id, existing.id].sort());
  assert.equal(current.find((ping) => ping.id === saved.id).text, 'concurrent ping');
  assert.deepEqual(kv.store, afterSave);
  assert.deepEqual(kv.writes, saveWrites);
});
