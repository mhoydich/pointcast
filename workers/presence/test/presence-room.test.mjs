import assert from 'node:assert/strict';
import test from 'node:test';

import { PresenceRoom } from '../src/index.ts';

class FakeStorage {
  values = new Map();
  async get(key) { return this.values.get(key); }
  async put(key, value) { this.values.set(key, structuredClone(value)); }
}

class FakeWebSocket {
  sent = [];
  send(value) { this.sent.push(JSON.parse(value)); }
  close() {}
}

function fakeState() {
  return { storage: new FakeStorage() };
}

function visitor(sessionId = 'session-one') {
  return {
    sessionId,
    nounId: 42,
    kind: 'human',
    tag: 'tester',
    joinedAt: new Date().toISOString(),
    lastSeen: Date.now(),
    edge: {},
    pathTrail: [],
    isReturning: false,
  };
}

test('chat entries receive unique server ids for echo dedupe', () => {
  const room = new PresenceRoom(fakeState());
  room.visitors.set('session-one', visitor());
  room.applyChat('session-one', { msg: 'hello' });
  room.applyChat('session-one', { msg: 'hello' });
  assert.equal(room.chatLog.length, 2);
  assert.ok(room.chatLog.every((entry) => typeof entry.id === 'string' && entry.id.length > 8));
  assert.notEqual(room.chatLog[0].id, room.chatLog[1].id);
});

test('burst bus broadcasts once, rate-limits a client, and coalesces a kind', () => {
  const room = new PresenceRoom(fakeState());
  const socket = new FakeWebSocket();
  room.connections.set('socket', { id: 'socket', sessionId: 'viewer', ws: socket, lastSeen: 1_000_000 });
  room.visitors.set('viewer', visitor('viewer'));

  const first = room.submitBurst({ kind: 'bell', clientId: 'a', by: { noun: 4 }, meta: { label: 'C4' } }, 'ip', 1_000_000);
  assert.equal(first.ok, true);
  assert.equal(first.coalesced, false);
  assert.equal(room.bursts.length, 1);
  assert.ok(socket.sent.at(-1).bursts?.some((burst) => burst.kind === 'bell'));

  const limited = room.submitBurst({ kind: 'cast', clientId: 'a', meta: { spell: 'rain' } }, 'ip', 1_000_100);
  assert.deepEqual(limited, { ok: false, reason: 'rate-limited' });

  const queued = room.submitBurst({ kind: 'bell', clientId: 'b', meta: { label: 'E4' } }, 'ip', 1_000_200);
  const coalesced = room.submitBurst({ kind: 'bell', clientId: 'c', meta: { label: 'G4' } }, 'ip', 1_000_300);
  assert.equal(queued.coalesced, true);
  assert.equal(coalesced.coalesced, true);
  assert.equal(room.pendingBursts.get('bell').meta.count, 2);

  clearTimeout(room.burstFlushTimer);
  room.burstFlushTimer = null;
  room.flushBurst(1_001_000);
  assert.equal(room.bursts.length, 2);
  assert.equal(room.bursts[1].meta.label, 'G4');
});

test('burst history is memory-only and capped to the last twenty', () => {
  const state = fakeState();
  const room = new PresenceRoom(state);
  for (let index = 0; index < 25; index += 1) {
    room.publishBurst({ kind: 'cast', at: 10_000 + index * 1_000, by: { noun: index }, meta: { spell: 'confetti' } });
  }
  assert.equal(room.bursts.length, 20);
  assert.equal(room.bursts[0].by.noun, 5);
  assert.equal(state.storage.values.size, 0, 'bursts never touch DO storage');
});

test('invalid burst kinds are rejected as bad requests', async () => {
  const room = new PresenceRoom(fakeState());
  const response = await room.fetch(new Request('https://presence.test/burst', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'anything-goes' }),
  }));
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, reason: 'invalid-kind' });
});

test('tug emits a burst only when the live knot crosses the threshold', async () => {
  const room = new PresenceRoom(fakeState());
  const now = Date.now();
  room.tug = { humanPulls: 0, machinePulls: 0, knot: 0.59, updatedAt: now };
  await room.applyTugPull('machine', 'agent-sol');
  assert.equal(room.bursts.at(-1)?.kind, 'tug');
  assert.equal(room.bursts.at(-1)?.meta.side, 'machine');
});
