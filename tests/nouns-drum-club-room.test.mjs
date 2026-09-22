import assert from 'node:assert/strict';
import test from 'node:test';

class SessionStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

class FakeWebSocket extends EventTarget {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances = [];

  constructor(url) {
    super();
    this.url = url;
    this.readyState = FakeWebSocket.CONNECTING;
    this.sent = [];
    FakeWebSocket.instances.push(this);
  }

  open() { this.readyState = FakeWebSocket.OPEN; this.dispatchEvent(new Event('open')); }
  send(data) { if (this.readyState !== FakeWebSocket.OPEN) throw new Error('socket not open'); this.sent.push(data); }
  close() { this.readyState = FakeWebSocket.CLOSED; this.dispatchEvent(new Event('close')); }
  message(data) { this.dispatchEvent(new MessageEvent('message', { data })); }
}

Object.defineProperty(globalThis, 'window', {
  value: { location: new URL('https://pointcast.test/nouns/drum-club/'), sessionStorage: new SessionStorage() },
  configurable: true,
});
Object.defineProperty(globalThis, 'WebSocket', { value: FakeWebSocket, configurable: true });

const { NounsDrumClubRoom, NOUNS_DRUM_CLUB_PADS } = await import('../src/lib/nouns-drum-club-room.ts');

function welcome(clientId = 'client-a') {
  return { v: 1, type: 'welcome', features: ['ndc-36'], you: { clientId }, recentHits: [] };
}

function peerHit(index, clientId = 'client-b') {
  return {
    v: 1, type: 'hit', id: `event-${index}`, clientId, avatar: index % 10_000, hue: index % 360,
    pad: NOUNS_DRUM_CLUB_PADS[index % NOUNS_DRUM_CLUB_PADS.length], velocity: 0.7, seq: index, serverAt: 1_000 + index,
  };
}

function connect(options = {}) {
  const room = new NounsDrumClubRoom({ room: 'sunshine', ...options });
  room.connect();
  const socket = FakeWebSocket.instances.at(-1);
  socket.open();
  socket.message(JSON.stringify(welcome()));
  return { room, socket };
}

test('accepts complete bounded welcome history and 125-person presence frames', () => {
  const hits = [];
  const presences = [];
  const { socket } = connect({ onHit: (hit) => hits.push(hit), onPresence: (presence) => presences.push(presence) });
  const recentHits = Array.from({ length: 24 }, (_, index) => ({ ...peerHit(index), padding: 'x'.repeat(64) }));
  const welcomeFrame = JSON.stringify({ ...welcome(), recentHits });
  assert.ok(welcomeFrame.length > 2_048);
  socket.message(welcomeFrame);
  assert.equal(hits.length, 24);
  assert.ok(hits.every((hit) => hit.origin === 'replay'));

  const people = Array.from({ length: 125 }, (_, index) => ({ id: `person-${index}`, avatar: index, hue: index % 360, joinedAt: 2_000 + index }));
  const presenceFrame = JSON.stringify({ v: 1, type: 'presence', room: 'ndc-sunshine', connected: 125, target: 100, capacity: 125, people, serverAt: 3_000 });
  assert.ok(presenceFrame.length > 2_048);
  socket.message(presenceFrame);
  assert.equal(presences.length, 1);
  assert.equal(presences[0].people.length, 125);
});

test('ignores queued frames from a socket that was disconnected before rejoin', () => {
  const hits = [];
  const { room, socket: first } = connect({ onHit: (hit) => hits.push(hit) });
  room.disconnect();
  room.connect();
  const second = FakeWebSocket.instances.at(-1);
  second.open();
  second.message(JSON.stringify(welcome('client-rejoined')));

  first.message(JSON.stringify(peerHit(1, 'stale-peer')));
  second.message(JSON.stringify(peerHit(2, 'current-peer')));
  assert.deepEqual(hits.map((hit) => hit.clientId), ['current-peer']);
});
