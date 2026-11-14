import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { handleLoom, MAX_ROOMS } from '../src/lib/loom/service.mjs';
import { readDirectory } from '../src/lib/loom/directory.mjs';

const apiSource = await readFile(new URL('../functions/api/loom.ts', import.meta.url), 'utf8');
function configuredLimit(bucket) {
  const escaped = bucket.replace(/[.*+?^${}()|[]\\]/g, '\\$&');
  const match = apiSource.match(new RegExp(`['"]${escaped}['"]\\s*:\\s*\\{\\s*windowSec:\\s*(\\d+),\\s*maxRequests:\\s*(\\d+)`));
  assert.ok(match, `missing production budget for ${bucket}`);
  return { windowSec: Number(match[1]), maxRequests: Number(match[2]) };
}

class MemoryKV {
  values = new Map();
  async get(key) { return this.values.get(key) ?? null; }
  async put(key, value) { this.values.set(key, String(value)); }
  async list({ prefix = '', limit = 1000, cursor } = {}) {
    const all = [...this.values.keys()].filter(key => key.startsWith(prefix)).sort();
    const start = cursor ? Number(cursor) : 0;
    const keys = all.slice(start, start + limit).map(name => ({ name }));
    const next = start + keys.length;
    return { keys, list_complete: next >= all.length, ...(next < all.length ? { cursor: String(next) } : {}) };
  }
}

function productionBudget(request, counters, nowMs) {
  return async (bucket, clientId) => {
    const { windowSec, maxRequests } = configuredLimit(bucket);
    const fallback = request.headers.get('CF-Connecting-IP') || 'anon';
    const id = clientId || `ip:${fallback}`;
    const window = Math.floor(nowMs / 1000 / windowSec);
    const key = `rl:${bucket}:${id}:${window}`;
    const count = counters.get(key) ?? 0;
    if (count >= maxRequests) return { allowed: false, retryAfter: 1 };
    counters.set(key, count + 1);
    return { allowed: true, retryAfter: 1 };
  };
}

function requestFor({ to, name, ip, address, kind = 'human' }) {
  return new Request('https://pointcast.xyz/api/loom', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'CF-Connecting-IP': ip },
    body: JSON.stringify({ to, from: { name, kind, ...(address ? { address } : {}) }, kind: 'note', body: 'scale check' }),
  });
}

test('public unsigned appends hit 12 per sender per 600 seconds, then 429', async () => {
  assert.deepEqual(configuredLimit('loom:append'), { windowSec: 600, maxRequests: 12 });
  assert.deepEqual(configuredLimit('loom:append:ip'), { windowSec: 600, maxRequests: 24 });
  const kv = new MemoryKV();
  const counters = new Map();
  const now = Date.parse('2026-11-14T04:00:00.000Z');
  const statuses = [];
  let first;
  for (let i = 0; i < 13; i += 1) {
    const request = requestFor({ to: '@guest', name: 'Unsigned guest', ip: '192.0.2.8' });
    const response = await handleLoom(request, { kv, firstHelloEnabled: false, clock: () => new Date(now), limit: productionBudget(request, counters, now) });
    statuses.push(response.status);
    if (i === 0) first = await response.json();
  }
  assert.deepEqual(statuses, [...Array(12).fill(201), 429]);
  assert.equal(first.message.from.verified, false);
});

test('10,000 unsigned participants in 2,000 rooms expose the room and directory scan ceilings', async () => {
  const participants = 10_000;
  const roomCount = 2_000;
  const membersPerRoom = participants / roomCount;
  assert.equal(membersPerRoom, 5);
  const kv = new MemoryKV();
  const counters = new Map();
  let now = Date.parse('2026-11-14T04:00:00.000Z');

  for (let i = 0; i < participants; i += 1) {
    const room = Math.floor(i / membersPerRoom);
    const ip = `10.0.${Math.floor(i / 256)}.${i % 256}`;
    const request = requestFor({ to: `#r5-room-${String(room).padStart(4, '0')}`, name: `Participant ${String(i).padStart(5, '0')}`, ip });
    const response = await handleLoom(request, {
      kv,
      firstHelloEnabled: false,
      clock: () => new Date(now++),
      limit: productionBudget(request, counters, now),
    });
    assert.equal(response.status, 201, `participant ${i} should be able to make one unsigned post`);
    await response.arrayBuffer();
  }

  const roomIndex = JSON.parse(await kv.get('loom:rooms'));
  assert.equal(roomIndex.length, MAX_ROOMS);
  assert.equal(roomIndex.filter(room => room.kind === 'topic').length, 400);

  const listing = await handleLoom(new Request('https://pointcast.xyz/api/loom'), { kv });
  const listed = await listing.json();
  const listedTopics = listed.logs.filter(log => log.kind === 'topic');
  assert.equal(listedTopics.filter(log => log.label.startsWith('#r5-room-')).length, 400);
  assert.equal(listedTopics.length, 401); // 400 indexed topics plus the seeded #loom room

  const directory = await readDirectory(kv);
  assert.equal(directory.scanned, 500);
  assert.equal(directory.incomplete, true);
  assert.equal(directory.people.length, 2_500);
  assert.equal(Object.hasOwn(directory, 'topics'), false);
});