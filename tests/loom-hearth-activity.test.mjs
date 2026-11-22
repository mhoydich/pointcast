import assert from 'node:assert/strict';
import test from 'node:test';
import { readHearth } from '../src/lib/loom/hearth-read.mjs';
import { HEARTH_DAY, hearthActivity } from '../src/lib/loom/hearth-day.mjs';
import { addressKey } from '../src/lib/loom/address.mjs';
import { serveHearthActivity } from '../src/lib/loom/hearth-activity.mjs';

const now = Date.parse('2026-11-21T19:00:00Z');
const iso = time => new Date(time).toISOString();
const post = (seq, kind, time = now - 1000, fields = {}) => ({
  op: 'append', seq, id: 'm_' + seq, at: iso(time), kind: 'note', from: { kind, name: kind }, ...fields,
});
const url = path => new Request(new URL(path, 'https://pointcast.xyz'));
const requestFor = rooms => url('/api/loom-hearth?' + new URLSearchParams(rooms.map(room => ['room', room])));

test('a room fire counts only visible original posts in the trailing day', async () => {
  const log = { ops: [
    post(1, 'human', now - HEARTH_DAY), post(2, 'human'), post(3, 'agent'),
    post(4, 'agent', now, { via: { key: 'elsewhere' } }), post(5, 'robot'), post(6, 'human'),
    { op: 'hide', seq: 7, id: 'm_6', at: iso(now) }, post(8, 'human', now + 1000),
  ] };
  const records = new Map();
  for (const [address, value] of Object.entries({
    '#warm': log, '@pilot': { ops: [post(1, 'agent')] },
    '#embers': { ops: [post(1, 'human', now - HEARTH_DAY)] }, '#trimmed': { ...log, ops: log.ops.slice(1), trimmedBefore: 2 },
  })) records.set('loom:log:' + await addressKey(address), value);
  const kv = { get: async key => records.get(key) };
  const result = await serveHearthActivity(requestFor(['#warm', '@pilot', '#embers', '#trimmed', '#missing']), kv, now);
  const { rooms } = await result.json();
  assert.deepEqual(rooms, [
    { address: '#warm', state: 'active', count: 2, human: true, lastAt: iso(now - 1000), size: 32, lastName: 'agent', lastKind: 'agent', humanName: 'human', lastHumanAt: iso(now - 1000) },
    { address: '@pilot', state: 'active', count: 1, human: false, lastAt: iso(now - 1000), size: 32, lastName: 'agent', lastKind: 'agent', humanName: null, lastHumanAt: null },
    { address: '#embers', state: 'quiet' }, { address: '#trimmed', state: 'unavailable' },
    { address: '#missing', state: 'unavailable' },
  ]);
  assert.equal(result.headers.get('cache-control'), 'no-store');
});

test('invalid or oversized batch reads never touch storage', async () => {
  let reads = 0;
  const kv = { get() { reads++; } };
  for (const rooms of [[], ['pc:/loom'], ['invalid'], Array.from({ length: 9 }, () => '#room')]) {
    assert.equal((await serveHearthActivity(requestFor(rooms), kv, now)).status, 400);
  }
  assert.equal((await serveHearthActivity(requestFor(['#room']), null, now)).status, 503);
  assert.equal(reads, 0);
});

test('directory reads skip old rooms, bound batches, and keep failed reads out of embers', async () => {
  const topics = Array.from({ length: 19 }, (_, i) => ({
    kind: 'topic', address: '#room' + i, updatedAt: iso(now), count: 700,
  }));
  topics.push({ kind: 'topic', address: '#old', updatedAt: iso(now - HEARTH_DAY - 1) });
  const batches = [];
  let pending = 0, peak = 0;
  async function request(path) {
    const query = new URL(path, 'https://pointcast.xyz').searchParams;
    if (query.has('compact')) return Response.json({ ok: true, kvBound: true, logs: topics });
    const rooms = query.getAll('room');
    batches.push(rooms);
    peak = Math.max(peak, ++pending);
    await new Promise(resolve => setTimeout(resolve, 1));
    pending--;
    if (rooms.includes('#room8')) return new Response(null, { status: 503 });
    return Response.json({ ok: true, rooms: rooms.map(address => ({
      address, state: 'active', count: 1, lastAt: iso(now), human: false, size: 32,
    })) });
  }
  const result = await readHearth({ request, now });
  assert.deepEqual(batches.map(batch => batch.length), [8, 8, 3]);
  assert.equal(peak, 2);
  assert.deepEqual(result.embers.map(room => room.address), ['#old']);
  assert.equal(result.unavailable.length, 8);
  assert.equal(result.active.length, 11);
  assert.equal(result.active[0].count, 1);
});

test('an unavailable directory never renders a quiet board', () =>
  assert.rejects(readHearth({ request: async () => Response.json({ ok: true, kvBound: false, logs: [] }) })));

test('the four flame sizes follow post volume and names follow timestamps across threads', () => {
  const posts = Array.from({ length: 12 }, (_, i) => post(i + 1, i === 5 ? 'human' : 'agent', now - i * 1000));
  for (const [n, size] of [[1, 32], [3, 40], [6, 56], [12, 64]]) {
    assert.equal(hearthActivity(posts.slice(0, n), { now }).size, size);
  }
  const room = hearthActivity(posts.reverse(), { now });
  assert.equal(room.lastAt, iso(now));
  assert.equal(room.lastKind, 'agent');
  assert.equal(room.human, true);
  assert.equal(room.lastHumanAt, iso(now - 5000));
});
