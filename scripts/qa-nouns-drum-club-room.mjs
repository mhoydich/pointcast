#!/usr/bin/env node
/**
 * Two-client network check for the deployed Nouns Drum Club room.
 *
 * Run only against an explicitly supplied post-deploy endpoint:
 *   node scripts/qa-nouns-drum-club-room.mjs https://pointcast.xyz/api/drum/room
 *
 * It uses two unique `ndc-` rooms, sends every one of the 36 allowed pads at
 * 22 hits/second (under the 24/s client cap), and closes all sockets on every
 * exit path. This is a live write check: do not point it at production before
 * the Worker carrying the `ndc-36` capability has been deployed.
 */

const pads = [
  'kick', 'snare', 'clap', 'hat-closed', 'hat-open', 'tom-low', 'tom-high', 'rim', 'shaker', 'tambourine',
  'bass-c', 'bass-d', 'bass-e', 'bass-f', 'bass-g', 'bass-a', 'bass-b', 'bass-c2', 'bass-d2', 'bass-e2',
  'mallet-c', 'mallet-d', 'mallet-e', 'mallet-f', 'mallet-g', 'mallet-a', 'mallet-b', 'mallet-c2', 'mallet-d2',
  'chord-c', 'chord-dm', 'chord-em', 'chord-f', 'chord-g', 'chord-am', 'sparkle',
];

const endpoint = process.argv[2];
if (!endpoint) throw new Error('Pass an explicit deployed /api/drum/room endpoint.');
if (typeof globalThis.WebSocket !== 'function') throw new Error('This check requires Node 22+ global WebSocket support.');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sockets = new Set();
const deadline = (promise, ms, label) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${label}.`)), ms);
  promise.then(resolve, reject).finally(() => clearTimeout(timer));
});

function wsUrl(room, sid) {
  const url = new URL(endpoint);
  if (url.protocol === 'https:') url.protocol = 'wss:';
  if (url.protocol === 'http:') url.protocol = 'ws:';
  if (url.protocol !== 'ws:' && url.protocol !== 'wss:') throw new Error('Endpoint must use http(s) or ws(s).');
  url.searchParams.set('room', room);
  url.searchParams.set('sid', sid);
  return url.toString();
}

class Inbox {
  constructor(socket) {
    this.socket = socket;
    this.messages = [];
    this.waiters = new Set();
    socket.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;
      try {
        const message = JSON.parse(event.data);
        this.messages.push(message);
        for (const check of this.waiters) check();
      } catch { /* Ignore a malformed server frame. */ }
    });
  }

  waitFor(predicate) {
    const existing = this.messages.find(predicate);
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve) => {
      const check = () => {
        const match = this.messages.find(predicate);
        if (!match) return;
        this.waiters.delete(check);
        resolve(match);
      };
      this.waiters.add(check);
    });
  }
}

async function connect(room, label) {
  const socket = new WebSocket(wsUrl(room, `${label}-${crypto.randomUUID()}`));
  sockets.add(socket);
  const inbox = new Inbox(socket);
  await deadline(new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', () => reject(new Error(`${label} WebSocket connection failed.`)), { once: true });
  }), 8_000, `${label} open`);
  const welcome = await deadline(inbox.waitFor((message) => message?.type === 'welcome'), 8_000, `${label} welcome`);
  if (!Array.isArray(welcome.features) || !welcome.features.includes('ndc-36')) {
    throw new Error(`${label} reached a Worker without the ndc-36 capability.`);
  }
  return inbox;
}

function close(inbox) {
  const socket = inbox?.socket;
  if (socket && socket.readyState < WebSocket.CLOSING) socket.close(1000, 'qa-complete');
}

const suffix = crypto.randomUUID().replaceAll('-', '').slice(0, 18);
const room = `ndc-qa-${suffix}`;
const otherRoom = `ndc-qb-${suffix}`;
let a;
let b;
let outsider;

try {
  [a, b, outsider] = await Promise.all([
    connect(room, 'a'),
    connect(room, 'b'),
    connect(otherRoom, 'outsider'),
  ]);

  let sequence = 0;
  for (const pad of pads) {
    a.socket.send(JSON.stringify({ v: 1, type: 'hit', pad, velocity: 0.75, seq: ++sequence, clientAt: Date.now() }));
    await sleep(46);
  }

  await deadline(b.waitFor((message) => message?.type === 'hit' && message?.seq === pads.length), 8_000, 'all peer hits');
  const received = b.messages.filter((message) => message?.type === 'hit').map((message) => message.pad);
  if (JSON.stringify(received) !== JSON.stringify(pads)) throw new Error(`Peer received a different pad set: ${JSON.stringify(received)}`);

  await sleep(350);
  if (outsider.messages.some((message) => message?.type === 'hit')) throw new Error('A hit leaked into a different room.');
  console.log(JSON.stringify({ ok: true, room, received: received.length, isolatedRoom: otherRoom }));
} finally {
  for (const socket of sockets) close({ socket });
}
