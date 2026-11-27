import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { addressKey, parseAddress } from '../src/lib/loom/address.mjs';
import {
  ALERT_LOG_CAP,
  collectReplyAlerts,
  formatReplyAlertsText,
  readLoomAlerts,
} from '../src/lib/loom/reply-alerts.mjs';
import { onRequest, onRequestGet } from '../functions/api/loom/alerts.ts';

const ROOM = 'ab'.repeat(12);
const INBOX = 'cd'.repeat(12);
const T0 = '2026-11-20T00:00:00.000Z';
const T1 = '2026-11-25T00:00:00.000Z';
const T2 = '2026-11-27T12:00:00.000Z';

const mike = { name: 'Mike', kind: 'human', address: '@mike' };
const ada = { name: 'Ada', kind: 'agent', address: '@ada' };
const bea = { name: 'Bea', kind: 'human' };

function message(fields) {
  return { kind: 'note', body: '', mentions: [], parent: null, seq: 1, ...fields };
}

function thread(address, key, messages, extra = {}) {
  return { address, key, label: extra.label ?? address, messages, ...extra };
}

const libSource = readFileSync(new URL('../src/lib/loom/reply-alerts.mjs', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../functions/api/loom/alerts.ts', import.meta.url), 'utf8');

test('direct replies match the parent author by name or address', () => {
  const byName = thread('#loom-v2', ROOM, [
    message({ id: 'm_parent01', seq: 1, at: T0, from: { name: 'MIKE' }, body: 'the note' }),
    message({ id: 'm_child001', seq: 2, at: T2, from: ada, parent: 'm_parent01', body: 'following up on the note' }),
  ]);
  const byAddress = thread('#workshop', 'ef'.repeat(12), [
    message({ id: 'm_parent02', seq: 1, at: T0, from: { name: 'Not Mike', address: '@Mike' }, body: 'posted as the handle' }),
    message({ id: 'm_child002', seq: 2, at: T1, from: bea, parent: 'm_parent02', body: 'saw it' }),
  ]);
  const result = collectReplyAlerts({ handle: '@MIKE', logs: [byName, byAddress] });
  assert.equal(result.for, '@mike');
  assert.deepEqual(result.alerts.map((alert) => alert.id), ['m_child001', 'm_child002']);
  assert.ok(result.alerts.every((alert) => alert.reason === 'reply'));
  const lead = result.alerts[0];
  assert.equal(lead.permalink, `https://pointcast.xyz/loom?to=${encodeURIComponent('#loom-v2')}#m_child001`);
  assert.equal(lead.replyAddress, `loom:${ROOM}#m_child001`);
  const parsed = parseAddress(lead.replyAddress);
  assert.equal(parsed.kind, 'reply');
  assert.equal(parsed.logKey, ROOM);
  assert.equal(parsed.parent, 'm_child001');
  assert.equal(lead.from.name, 'Ada');
  assert.equal(result.alerts[1].excerpt, 'saw it');
});

test('@mentions come from the mentions list or the body, not from a longer handle', () => {
  const result = collectReplyAlerts({
    handle: 'mike',
    logs: [thread('#loom-v2', ROOM, [
      message({ id: 'm_list0001', seq: 3, at: T2, from: ada, mentions: ['@Mike'], body: 'look at this' }),
      message({ id: 'm_body0001', seq: 2, at: T1, from: bea, body: 'hey @MIKE can you see this' }),
      message({ id: 'm_mikey001', seq: 1, at: T0, from: ada, body: 'ping @mikey and @mike.hoy only' }),
    ])],
  });
  assert.deepEqual(result.alerts.map((alert) => [alert.id, alert.reason]), [
    ['m_list0001', 'mention'],
    ['m_body0001', 'mention'],
  ]);
});

test('open asks and cards in the handle inbox alert, closed and plain notes do not', () => {
  const ask = message({ id: 'm_inboxask', seq: 1, at: T0, from: ada, kind: 'ask', body: 'Which room should the welcome use?' });
  const question = message({ id: 'm_question', seq: 2, at: T1, from: bea, kind: 'question', body: 'Are we shipping the digest?' });
  const card = message({
    id: 'm_card0001', seq: 3, at: T2, from: ada, kind: 'note', body: 'Runner card.',
    card: { id: 'V2-3', scope: 'Look', target: '@mike', done: 'A yes', ceiling: 1000 },
  });
  const needs = message({ id: 'm_needs001', seq: 4, at: '2026-11-27T18:00:00.000Z', from: ada, body: 'NEEDS MIKE · Pick the welcome line.' });
  const closed = message({ id: 'm_closed01', seq: 5, at: T2, from: ada, kind: 'question', body: 'Already settled?' });
  const clear = message({ id: 'm_clear001', seq: 6, at: T2, from: ada, parent: 'm_closed01', body: 'CLEARED · The garden.' });
  const plain = message({ id: 'm_plain001', seq: 7, at: T2, from: bea, body: 'just passing through' });
  const result = collectReplyAlerts({
    handle: 'mike',
    logs: [thread('@mike', INBOX, [ask, question, card, needs, closed, clear, plain])],
  });
  assert.deepEqual(result.alerts.map((alert) => alert.id), ['m_needs001', 'm_card0001', 'm_question', 'm_inboxask']);
  assert.ok(result.alerts.every((alert) => alert.reason === 'inbox'));
  assert.equal(result.alerts.find((alert) => alert.id === 'm_card0001').kind, 'note');
  assert.equal(result.alerts.find((alert) => alert.id === 'm_inboxask').permalink, `https://pointcast.xyz/loom?to=${encodeURIComponent('@mike')}#m_inboxask`);
});

test('a folded ask field and a hidden reply survive the log shape', () => {
  const result = collectReplyAlerts({
    handle: 'mike',
    logs: [{
      address: '@Mike',
      key: INBOX,
      ops: [
        { op: 'append', id: 'm_parent01', seq: 1, at: T0, from: mike, kind: 'note', body: 'start', mentions: [] },
        { op: 'append', id: 'm_hidden01', seq: 2, at: T1, from: ada, kind: 'note', body: '@mike hidden', parent: 'm_parent01', mentions: ['@mike'] },
        { op: 'hide', id: 'm_hidden01', seq: 3, at: T1 },
        { op: 'append', id: 'm_visible1', seq: 4, at: T2, from: bea, kind: 'note', body: 'still open', parent: 'm_parent01', mentions: [] },
        { op: 'append', id: 'm_askfield', seq: 5, at: T2, from: ada, kind: 'note', body: 'custom ask', mentions: [], ask: { prompt: 'yes?' } },
      ],
    }, null, 'bad', { ops: 'corrupt' }],
  });
  assert.deepEqual(result.alerts.map((alert) => [alert.id, alert.reason]).sort(), [
    ['m_askfield', 'inbox'],
    ['m_visible1', 'reply'],
  ]);
});

test('self-replies and self-mentions are dropped', () => {
  const result = collectReplyAlerts({
    handle: 'mike',
    logs: [thread('#loom-v2', ROOM, [
      message({ id: 'm_parent01', seq: 1, at: T0, from: mike, body: 'mine' }),
      message({ id: 'm_selfrepl', seq: 2, at: T1, from: { name: 'Mike' }, parent: 'm_parent01', body: 'adding to myself' }),
      message({ id: 'm_selfment', seq: 3, at: T2, from: { name: 'mike', address: '@mike' }, body: '@mike note to self', mentions: ['@mike'] }),
      message({ id: 'm_other001', seq: 4, at: T2, from: ada, parent: 'm_parent01', body: 'from someone else' }),
    ]), thread('@mike', INBOX, [
      message({ id: 'm_selfask1', seq: 1, at: T2, from: mike, kind: 'ask', body: 'my own open ask' }),
    ])],
  });
  assert.deepEqual(result.alerts.map((alert) => alert.id), ['m_other001']);
  assert.equal(result.alerts[0].reason, 'reply');
});

test('one id alerts once, a reply outranks a mention, and newest is first', () => {
  const mention = thread('#mentions', ROOM, [
    message({ id: 'm_same0001', seq: 1, at: T0, from: ada, body: '@mike in passing', mentions: ['@mike'] }),
  ]);
  const reply = thread('#loom-v2', 'ef'.repeat(12), [
    message({ id: 'm_parent01', seq: 1, at: T0, from: mike, body: 'root' }),
    message({ id: 'm_same0001', seq: 9, at: T2, from: bea, parent: 'm_parent01', body: 'the real reply @mike', mentions: ['@mike'] }),
  ]);
  const echo = thread('@mike', INBOX, [
    message({
      id: 'm_echo0001', seq: 2, at: T1, from: ada, body: 'hey @mike',
      via: { address: '#loom-v2', key: 'ef'.repeat(12), id: 'm_same0001' },
    }),
  ]);
  const result = collectReplyAlerts({ handle: 'mike', logs: [mention, echo, reply] });
  assert.equal(result.total, 1);
  assert.equal(result.alerts.length, 1);
  assert.equal(result.alerts[0].reason, 'reply');
  assert.equal(result.alerts[0].id, 'm_same0001');
  assert.equal(result.alerts[0].address, '#loom-v2');
  assert.equal(result.alerts[0].replyAddress, `loom:${'ef'.repeat(12)}#m_same0001`);
});

test('since drops anything at or before the cursor, and limit defaults to 25 and caps at 100', () => {
  const messages = [];
  for (let i = 0; i < 110; i += 1) {
    messages.push(message({
      id: `m_${String(i).padStart(6, '0')}`,
      seq: i + 1,
      at: new Date(Date.parse(T0) + i * 60_000).toISOString(),
      from: ada,
      body: '@mike update',
      mentions: ['@mike'],
    }));
  }
  const all = collectReplyAlerts({ handle: 'mike', logs: [thread('#loom-v2', ROOM, messages)] });
  assert.equal(all.limit, 25);
  assert.equal(all.count, 25);
  assert.equal(all.total, 110);
  assert.equal(all.alerts[0].id, 'm_000109');
  assert.equal(all.alerts[24].id, 'm_000085');

  const capped = collectReplyAlerts({ handle: 'mike', logs: [thread('#loom-v2', ROOM, messages)], limit: 500 });
  assert.equal(capped.limit, 100);
  assert.equal(capped.count, 100);
  assert.equal(capped.total, 110);

  const cursor = messages[50].at;
  const filtered = collectReplyAlerts({ handle: 'mike', logs: [thread('#loom-v2', ROOM, messages)], since: cursor, limit: 100 });
  assert.equal(filtered.since, new Date(cursor).toISOString());
  assert.ok(filtered.alerts.every((alert) => Date.parse(alert.at) > Date.parse(cursor)));
  assert.equal(filtered.alerts.at(-1).id, 'm_000051');
  assert.equal(filtered.total, 59);
});

test('the text digest is one concise line per alert', () => {
  const result = collectReplyAlerts({
    handle: 'mike',
    logs: [thread('#loom-v2', ROOM, [
      message({ id: 'm_parent01', seq: 1, at: T0, from: mike, body: 'root' }),
      message({ id: 'm_child001', seq: 2, at: T2, from: ada, parent: 'm_parent01', body: 'Line one.\nLine two is long.' }),
      message({ id: 'm_body0001', seq: 3, at: T1, from: bea, body: '@mike look' }),
    ])],
  });
  const text = formatReplyAlertsText(result);
  const lines = text.trim().split('\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[0], 'loom alerts @mike: 2');
  assert.match(lines[1], /^reply Ada #loom-v2 note Line one\. Line two is long\. loom:abababababababababababab#m_child001 https:\/\/pointcast\.xyz\/loom\?to=%23loom-v2#m_child001$/);
  assert.match(lines[2], /^mention Bea #loom-v2 note @mike look /);
  assert.equal(formatReplyAlertsText({ for: '@mike', alerts: [] }), 'loom alerts @mike: 0\n');
});

function memoryKv(records, { throwOn = new Set() } = {}) {
  const store = new Map(Object.entries(records).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]));
  const calls = { get: 0, put: 0 };
  return {
    calls,
    store,
    async get(key) {
      calls.get += 1;
      if (throwOn.has(key)) throw new Error('kv down');
      return store.has(key) ? store.get(key) : null;
    },
    async put() {
      calls.put += 1;
      throw new Error('read-only');
    },
  };
}

function callGet(kv, query = '', headers = {}) {
  return onRequestGet({
    request: new Request(`https://pointcast.xyz/api/loom/alerts${query}`, { headers }),
    env: kv ? { PC_LOOM_KV: kv } : {},
  });
}

test('GET /api/loom/alerts reads inbox and directory logs, sets an ETag, and answers 304', async () => {
  const inboxKey = await addressKey('@mike');
  const roomKey = await addressKey('#loom-v2');
  const kv = memoryKv({
    'loom:index': [{ address: '#loom-v2', key: roomKey, kind: 'topic', updatedAt: T2, count: 2 }],
    'loom:rooms': [],
    [`loom:log:${inboxKey}`]: {
      address: '@mike', key: inboxKey,
      ops: [{ op: 'append', id: 'm_inboxask', seq: 1, at: T1, from: ada, kind: 'ask', body: 'Open the front door?', mentions: [] }],
    },
    [`loom:log:${roomKey}`]: {
      address: '#loom-v2', key: roomKey, label: '#loom-v2',
      ops: [
        { op: 'append', id: 'm_parent01', seq: 1, at: T0, from: { name: 'Mike', kind: 'human', address: '@mike' }, kind: 'note', body: 'start', mentions: [] },
        { op: 'append', id: 'm_child001', seq: 2, at: T2, from: ada, kind: 'note', body: 'replying in the room', parent: 'm_parent01', mentions: [] },
        { op: 'append', id: 'm_oldment1', seq: 3, at: T0, from: bea, kind: 'note', body: '@mike earlier', mentions: ['@mike'] },
      ],
    },
  });
  const res = await callGet(kv, '?for=%40Mike&limit=10');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /^application\/json/);
  const etag = res.headers.get('etag');
  assert.match(etag, /^"[0-9a-f]{64}"$/);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.kvBound, true);
  assert.equal(body.for, '@mike');
  assert.deepEqual(body.alerts.map((alert) => [alert.id, alert.reason]), [
    ['m_child001', 'reply'],
    ['m_inboxask', 'inbox'],
    ['m_oldment1', 'mention'],
  ]);
  assert.equal(kv.calls.put, 0);

  const again = await callGet(kv, '?for=mike&limit=10');
  assert.equal(again.headers.get('etag'), etag);

  const cached = await callGet(kv, '?for=mike&limit=10', { 'If-None-Match': etag });
  assert.equal(cached.status, 304);
  assert.equal(cached.headers.get('etag'), etag);
  assert.equal(await cached.text(), '');

  const weak = await callGet(kv, '?for=mike&limit=10', { 'If-None-Match': `W/${etag}, "other"` });
  assert.equal(weak.status, 304);

  const since = await callGet(kv, `?handle=mike&since=${encodeURIComponent(T1)}`);
  const sinceBody = await since.json();
  assert.deepEqual(sinceBody.alerts.map((alert) => alert.id), ['m_child001']);

  const text = await callGet(kv, '?for=mike&format=text&limit=10');
  assert.equal(text.headers.get('content-type'), 'text/plain; charset=utf-8');
  const digest = await text.text();
  assert.match(digest, /^loom alerts @mike: 3\n/);
  assert.equal(digest.trim().split('\n').length, 4);
  const textEtag = text.headers.get('etag');
  const textCached = await callGet(kv, '?for=mike&format=text&limit=10', { 'If-None-Match': textEtag });
  assert.equal(textCached.status, 304);
  assert.notEqual(textEtag, etag);
});

test('a missing for is 400, and an unbound or corrupt KV still answers 200', async () => {
  const missing = await callGet(memoryKv({}), '');
  assert.equal(missing.status, 400);
  assert.equal((await missing.json()).error, 'for_required');
  const blank = await callGet(memoryKv({}), '?for=');
  assert.equal(blank.status, 400);
  assert.equal((await blank.json()).error, 'for_required');
  const absent = await callGet(memoryKv({}), '?limit=5');
  assert.equal(absent.status, 400);
  const bad = await callGet(memoryKv({}), '?handle=!!!');
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).error, 'for_invalid');
  const posted = await onRequest({
    request: new Request('https://pointcast.xyz/api/loom/alerts?for=mike', { method: 'POST' }),
    env: {},
  });
  assert.equal(posted.status, 405);

  const unbound = await callGet(null, '?for=mike');
  assert.equal(unbound.status, 200);
  assert.match(unbound.headers.get('content-type'), /^application\/json/);
  const empty = await unbound.json();
  assert.equal(empty.kvBound, false);
  assert.deepEqual(empty.alerts, []);
  assert.equal(empty.count, 0);
  const unboundEtag = unbound.headers.get('etag');
  const unboundAgain = await onRequestGet({
    request: new Request('https://pointcast.xyz/api/loom/alerts?for=mike', { headers: { 'If-None-Match': unboundEtag } }),
    env: {},
  });
  assert.equal(unboundAgain.status, 304);

  const inboxKey = await addressKey('@mike');
  const goodKey = await addressKey('#good-room');
  const badKey = await addressKey('#bad-room');
  const kv = memoryKv({
    'loom:index': '{',
    [`loom:log:${inboxKey}`]: {
      address: '@mike', key: inboxKey,
      ops: [{ op: 'append', id: 'm_inboxask', seq: 1, at: T2, from: ada, kind: 'question', body: 'Still open?', mentions: [] }],
    },
    [`loom:log:${badKey}`]: '{oops',
    [`loom:log:${goodKey}`]: {
      address: '#good-room', key: goodKey,
      ops: [{ op: 'append', id: 'm_good0001', seq: 1, at: T2, from: ada, kind: 'note', body: '@mike from the good room', mentions: ['@mike'] }],
    },
  }, { throwOn: new Set(['loom:rooms']) });
  // Index is corrupt, so the directory contributes nothing; the inbox still loads.
  const rescued = await callGet(kv, '?for=mike');
  assert.equal(rescued.status, 200);
  const rescuedBody = await rescued.json();
  assert.equal(rescuedBody.kvBound, true);
  assert.deepEqual(rescuedBody.alerts.map((alert) => alert.id), ['m_inboxask']);
  assert.equal(kv.calls.put, 0);

  const indexed = memoryKv({
    'loom:index': [
      { key: goodKey, address: '#good-room', kind: 'topic', updatedAt: T2 },
      { key: badKey, address: '#bad-room', kind: 'topic', updatedAt: T1 },
      { key: 'not-a-key', address: '#skip', updatedAt: T2 },
    ],
    'loom:rooms': { not: 'a list' },
    [`loom:log:${badKey}`]: '{oops',
    [`loom:log:${goodKey}`]: {
      address: '#good-room', key: goodKey,
      messages: [message({ id: 'm_good0001', at: T2, from: ada, body: '@mike from the good room', mentions: ['@mike'] })],
    },
  });
  const mixed = await readLoomAlerts(indexed, { handle: 'mike' });
  assert.equal(mixed.kvBound, true);
  assert.deepEqual(mixed.alerts.map((alert) => alert.id), ['m_good0001']);
  assert.equal(indexed.calls.put, 0);

  const objects = {
    async get(key) {
      if (key === 'loom:index' || key === 'loom:rooms') return [];
      if (key === `loom:log:${inboxKey}`) {
        return { address: '@mike', key: inboxKey, messages: [message({ id: 'm_objask01', at: T2, from: bea, kind: 'ask', body: 'from an object value' })] };
      }
      return null;
    },
    async put() { throw new Error('read-only'); },
  };
  const fromObject = await readLoomAlerts(objects, { handle: '@mike' });
  assert.equal(fromObject.alerts[0].id, 'm_objask01');
  assert.equal(fromObject.alerts[0].reason, 'inbox');
});

test('directory reads stay inside the log cap and prefer PC_LOOM_KV', async () => {
  const inboxKey = await addressKey('@mike');
  const rooms = [];
  for (let i = 0; i < ALERT_LOG_CAP + 1; i += 1) rooms.push({ key: await addressKey(`#cap-${i}`), address: `#cap-${i}`, i });
  const records = {
    'loom:index': rooms.map((room) => ({
      address: room.address, key: room.key, kind: 'topic',
      updatedAt: new Date(Date.UTC(2026, 0, 1) + room.i * 86_400_000).toISOString(),
    })),
    'loom:rooms': [],
    [`loom:log:${inboxKey}`]: {
      address: '@mike', key: inboxKey,
      ops: [{ op: 'append', id: 'm_capinbox', seq: 1, at: T2, from: bea, kind: 'card', body: 'Open card', card: { id: 'V2-9', scope: 's', target: 't', done: 'd', ceiling: 1000 }, mentions: [] }],
    },
    [`loom:log:${rooms[0].key}`]: {
      address: rooms[0].address, key: rooms[0].key,
      ops: [{ op: 'append', id: 'm_oldcap01', seq: 1, at: T2, from: ada, kind: 'note', body: '@mike from the room that fell off the cap', mentions: ['@mike'] }],
    },
  };
  const kv = memoryKv(records);
  const visits = memoryKv({});
  const res = await onRequestGet({
    request: new Request('https://pointcast.xyz/api/loom/alerts?for=mike'),
    env: { PC_LOOM_KV: kv, VISITS: visits },
  });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.deepEqual(body.alerts.map((alert) => alert.id), ['m_capinbox']);
  assert.equal(body.scanned.directoryCap, ALERT_LOG_CAP);
  assert.equal(body.scanned.directory, ALERT_LOG_CAP);
  assert.equal(kv.calls.get, ALERT_LOG_CAP + 3);
  assert.equal(kv.calls.put, 0);
  assert.equal(visits.calls.get, 0);

  const fallback = await onRequestGet({
    request: new Request('https://pointcast.xyz/api/loom/alerts?for=mike'),
    env: { VISITS: kv },
  });
  assert.equal((await fallback.json()).alerts[0].id, 'm_capinbox');
});

test('the alert reader never writes', () => {
  assert.doesNotMatch(libSource, /\.put\s*\(/);
  assert.doesNotMatch(apiSource, /\.put\s*\(/);
  assert.match(apiSource, /PC_LOOM_KV \?\? env\.VISITS/);
});
