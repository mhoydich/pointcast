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
  return {
    async get(key) { return store.has(key) ? store.get(key) : null; },
    async put(key, value) { store.set(key, value); },
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
