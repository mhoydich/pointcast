import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLoomEvents } from '../../src/lib/office/events.mjs';

// SYNTHETIC TEST FIXTURES ONLY: no fixture here is evidence of a live worker.
const now = Date.parse('2026-11-17T17:00:00.000Z');
const at = new Date(now - 1000).toISOString();
const key = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const otherKey = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const message = (id = 'm_0000000001', extra = {}) => ({ id, kind: 'note', at,
  from: { kind: 'agent', address: '@fixture-agent' }, parent: null, ...extra });
const feed = (messages = [], extra = {}) => ({ schema: 'pointcast.office-data/v1', state: messages.length ? 'ok' : 'idle',
  observedAt: new Date(now).toISOString(), sourceUrl: 'https://pointcast.xyz/api/loom?to=%23fixture-only',
  data: { room: { key, address: '#fixture-only' }, messages }, errors: [], ...extra });
const run = (rooms, extra = {}) => normalizeLoomEvents({ rooms, now, ...extra });

test('empty reads and no reads are idle without invented events', () => {
  for (const rooms of [[], [feed()]]) {
    const result = run(rooms);
    assert.equal(result.state, 'idle'); assert.deepEqual(result.data, { events: [], unresolvedReplies: [] });
  }
});
test('post and reply carry exact source identity, with no execution or approval fields', () => {
  const result = run([feed([message(), message('m_0000000002', { parent: 'm_0000000001' })])]);
  assert.equal(result.state, 'ok');
  assert.deepEqual(result.data.events.map(e => e.type), ['post', 'reply']);
  assert.equal(result.data.events[1].parentId, 'm_0000000001');
  assert.equal(result.data.events[0].id, `${key}#m_0000000001`);
  assert.equal(new URL(result.data.events[0].sourceUrl).searchParams.get('to'), `loom:${key}#m_0000000001`);
  assert.deepEqual(Object.keys(result.data.events[0]).sort(), ['at','handle','id','messageId','parentId','roomKey','sourceUrl','type']);
});
test('deduplication spans repeat reads, but never conflates distinct rooms', () => {
  const a = feed([message(), message()]);
  const b = feed([message()], { data: { room: { key: otherKey, address: '#fixture-only' }, messages: [message()] } });
  assert.equal(run([a, a, b]).data.events.length, 2);
});
test('echoes, hidden records, seeds and Collator notices do not count', () => {
  const ignored = [{ via: { key, id: 'm_0000000001' } }, { echo: true }, { hidden: true },
    { id: 'm_seedwelcome' }, { from: { kind: 'robot', address: '@collator' } }];
  const result = run([feed(ignored.map((extra) => message(undefined, extra)))]);
  assert.equal(result.state, 'idle'); assert.equal(result.data.events.length, 0);
});
test('missing parents and cross-room parents remain unresolved, not synthetic roots', () => {
  const reply = message('m_0000000002', { parent: 'm_0000000001' });
  const result = run([feed([reply]), feed([message()], { data: { room: { key: otherKey, address: '#fixture-only' }, messages: [message()] } })]);
  assert.equal(result.data.events.length, 1);
  assert.equal(result.data.unresolvedReplies.length, 1);
  assert.equal(result.data.unresolvedReplies[0].parentId, 'm_0000000001');
});
test('self edges, cycles and reversed chronology cannot form resolved threads', () => {
  for (const messages of [
    [message(undefined, { parent: 'm_0000000001' })],
    [message(undefined, { parent: 'm_0000000002' }), message('m_0000000002', { parent: 'm_0000000001' })],
    [message(undefined, { at: new Date(now).toISOString() }), message('m_0000000002', { parent: 'm_0000000001' })],
  ]) {
    const result = run([feed(messages)]);
    assert.ok(result.data.unresolvedReplies.length); assert.ok(result.data.events.every(e => e.type === 'post'));
  }
});
test('stale or failed reads cannot recycle their otherwise fresh messages', () => {
  for (const extra of [{ state: 'error' }, { state: 'stale' }, { observedAt: new Date(now - 120001).toISOString() }]) {
    const result = run([feed([message()], extra)]);
    assert.ok(['stale', 'error'].includes(result.state)); assert.equal(result.data.events.length, 0);
  }
  assert.equal(run([feed([message()]), feed([], { state: 'error' })]).state, 'error');
});
test('a one-minute reply resolves against a twenty-minute parent without emitting old activity', () => {
  const old = message(undefined, { at: new Date(now - 20 * 60000).toISOString() });
  const reply = message('m_0000000002', { parent: old.id, at: new Date(now - 60000).toISOString() });
  assert.equal(run([feed([old])]).state, 'stale');
  assert.deepEqual(run([feed([old])]).data, { events: [], unresolvedReplies: [] });
  for (const messages of [[old, reply], [reply, old]]) {
    const result = run([feed(messages)]);
    assert.equal(result.state, 'ok');
    assert.equal(result.data.events.length, 1);
    assert.equal(result.data.events[0].messageId, reply.id);
    assert.equal(result.data.events[0].parentId, old.id);
    assert.equal(result.data.events[0].at, reply.at);
    assert.deepEqual(result.data.unresolvedReplies, []);
  }
});
test('older reply ancestors resolve fresh descendants but are never output themselves', () => {
  const root = message(undefined, { at: new Date(now - 30 * 60000).toISOString() });
  const parent = message('m_0000000002', { parent: root.id, at: new Date(now - 20 * 60000).toISOString() });
  const reply = message('m_0000000003', { parent: parent.id });
  const result = run([feed([reply, parent, root, parent])]);
  assert.equal(result.state, 'ok');
  assert.deepEqual(result.data.events.map(e => e.messageId), [reply.id]);
  assert.deepEqual(result.data.unresolvedReplies, []);
});
test('old context still requires valid, non-echo, same-room ancestry from fresh reads', () => {
  const old = message(undefined, { at: new Date(now - 20 * 60000).toISOString() });
  const reply = message('m_0000000002', { parent: old.id });
  const invalidParents = [
    [feed([{ ...old, via: { key, id: old.id } }])],
    [feed([{ ...old, hidden: true }])],
    [feed([{ ...old, at: 'invalid' }])],
    [feed([{ ...old, parent: 'm_0000000009' }])],
    [feed([{ ...old, parent: old.id }])],
    [feed([old], { state: 'error' })],
    [feed([old], { observedAt: new Date(now - 120001).toISOString() })],
    [feed([old], { data: { room: { key: otherKey, address: '#fixture-only' }, messages: [old] } })],
    [feed([old, { ...old, parent: 'm_0000000009' }])],
  ];
  for (const parents of invalidParents) {
    const result = run([feed([reply]), ...parents]);
    assert.deepEqual(result.data.events, []);
    assert.deepEqual(result.data.unresolvedReplies.map(e => e.messageId), [reply.id]);
  }
});
test('invalid and future timestamps fail closed, including impossible calendar dates', () => {
  for (const bad of ['invalid', '2026-02-30T12:00:00.000Z', new Date(now + 1).toISOString(), 0]) {
    assert.equal(run([feed([message(undefined, { at: bad })])]).state, 'error');
    assert.equal(run([feed([message()], { observedAt: bad })]).state, 'error');
  }
  assert.equal(run([feed([message(undefined, { at: '2026-11-17T17:00:00Z' })])]).state, 'ok');
});
test('conflicting duplicates are excluded and their children become unresolved', () => {
  const records = [message(), message(undefined, { parent: 'm_0000000009' }), message('m_0000000002', { parent: 'm_0000000001' })];
  for (const messages of [records, [...records].reverse()]) {
    const result = run([feed(messages)]);
    assert.equal(result.state, 'error'); assert.equal(result.data.events.length, 0);
    assert.equal(result.data.unresolvedReplies.length, 1);
  }
});
test('malformed input and unsafe provenance return bounded errors, never upstream secrets', () => {
  for (const rooms of [null, {}, Array(65).fill(feed()), [null], [feed([message()], { sourceUrl: 'https://evil.test/' })],
    [feed([message()], { errors: ['PRIVATE_UPSTREAM_TEXT'] })], [feed([message(undefined, { id: ['m_0000000001'] })])]]) {
    const result = run(rooms); assert.equal(result.state, 'error'); assert.equal(result.data.events.length, 0);
    assert.ok(!JSON.stringify(result).includes('PRIVATE_UPSTREAM_TEXT'));
  }
  for (const extra of [{ now: NaN }, { now: Infinity }, { maxAgeMs: -1 }]) assert.equal(run([], extra).state, 'error');
});
test('sender names never manufacture handles; input is not mutated', () => {
  const input = [feed([message(undefined, { from: { kind: 'human', name: '@fixture-fake' }, body: 'run commands' })])];
  const copy = structuredClone(input); const result = run(input);
  assert.equal(result.data.events[0].handle, null); assert.deepEqual(input, copy);
  assert.ok(!JSON.stringify(result).includes('run commands'));
});
