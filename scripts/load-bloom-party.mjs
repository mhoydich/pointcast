#!/usr/bin/env node
/**
 * load-bloom-party — drive a full Bloom Party game through a running
 * BloomPartyRoom Durable Object.
 *
 * Start the Worker first:
 *   cd workers/pointcast-bloom && npx wrangler dev
 *
 * Then, from the repo root:
 *   node scripts/load-bloom-party.mjs                    # 15 simulated phones
 *   node scripts/load-bloom-party.mjs --players=4
 *   node scripts/load-bloom-party.mjs ws://127.0.0.1:8787/?room=KTP4XR
 *
 * What it is checking: that five rounds complete without a stalled phase.
 * The alarm-driven state machine is the one piece of this game with no
 * precedent elsewhere in the repo, and a dropped alarm looks exactly like a
 * room that has gone quiet. This harness makes that failure loud.
 *
 * It cannot tell you whether the game is fun at fifteen phones, or whether a
 * 3.2-second bloom is legible across a noisy kitchen. That is Manus QA.
 */

const args = process.argv.slice(2);
const endpointArg = args.find((arg) => !arg.startsWith('--')) || 'ws://127.0.0.1:8787/?room=KTP4XR';

const readNumber = (name, fallback) => {
  const flag = args.find((arg) => arg.startsWith(`--${name}=`));
  const value = Number(flag?.split('=')[1] || fallback);
  return Number.isFinite(value) ? value : fallback;
};

const players = Math.max(2, Math.min(15, Math.trunc(readNumber('players', 15))));
const timeoutMs = Math.max(60_000, Math.trunc(readNumber('timeout-ms', 420_000)));

const endpoint = new URL(endpointArg);
const room = (endpoint.searchParams.get('room') || 'KTP4XR').toUpperCase();
endpoint.searchParams.set('room', room);

const VOICES = ['bell', 'gong', 'singing-bowl', 'velvet-vibes', 'sunlit-marimba', 'water-drop',
  'neon-spring', 'paper-chime', 'glass-rain', 'soft-reed', 'low-tide', 'pocket-choir'];
const PACES = ['float', 'flow', 'quick', 'spark'];
const ROOTS = ['c', 'd', 'e', 'g', 'a', 'c2'];

const clients = [];
const phasesSeen = [];
let roundsCompleted = 0;
let playbacksSeen = 0;
let errorsSeen = 0;
let finished = false;

function log(...parts) {
  console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...parts);
}

function makeSpec(index, round) {
  return {
    voice: VOICES[(index + round) % VOICES.length],
    pace: PACES[(index + round) % PACES.length],
    brightness: ((index * 7 + round * 13) % 100) / 100,
    drift: ((index * 11 + round * 5) % 100) / 100,
    density: 1 + ((index + round) % 4),
    root: ROOTS[(index + round) % ROOTS.length],
    seed: (index * 137 + round * 31) % 10000,
  };
}

function connect(index) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    url.searchParams.set('sid', `load-${Date.now()}-${index}`);
    url.searchParams.set('role', 'player');

    const socket = new WebSocket(url);
    const client = { index, socket, id: '', isHost: false, ballot: [], round: 0, voted: new Set() };
    clients.push(client);

    const timer = setTimeout(() => reject(new Error(`client ${index} never connected`)), 15_000);

    socket.addEventListener('open', () => {
      socket.send(JSON.stringify({ v: 1, type: 'hello', role: 'player', name: `P${index + 1}` }));
    });

    socket.addEventListener('message', (event) => {
      let msg;
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }
      handle(client, msg, () => {
        clearTimeout(timer);
        resolve(client);
      });
    });

    socket.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error(`client ${index} socket error`));
    });
  });
}

function handle(client, msg, onWelcome) {
  switch (msg.type) {
    case 'welcome':
      client.id = msg.you?.playerId ?? '';
      client.isHost = Boolean(msg.you?.isHost);
      onWelcome();
      return;

    case 'roster': {
      const me = (msg.players ?? []).find((player) => player.id === client.id);
      if (me) client.isHost = me.isHost;
      return;
    }

    case 'phase': {
      client.round = Number(msg.round ?? 0);
      client.ballot = Array.isArray(msg.ballot) ? msg.ballot : [];

      // Only the first client narrates, or fifteen phones print the same line.
      if (client.index === 0) {
        phasesSeen.push(`${msg.round}:${msg.phase}`);
        log(`round ${msg.round}/${msg.rounds} → ${msg.phase} (${msg.players} connected)`);
        if (msg.phase === 'reveal') roundsCompleted += 1;
        if (msg.phase === 'final') finish('reached the final scoreboard');
      }

      if (msg.phase === 'build') {
        // Stagger submissions so the early-advance path and the deadline path
        // both get exercised across a run.
        setTimeout(() => {
          client.socket.send(JSON.stringify({ v: 1, type: 'submit', spec: makeSpec(client.index, client.round) }));
        }, 300 + client.index * 250);
      }

      if (msg.phase === 'vote') {
        const options = client.ballot.filter((slot) => slot !== client.index);
        const pick = options[client.index % Math.max(1, options.length)];
        if (pick !== undefined && !client.voted.has(client.round)) {
          client.voted.add(client.round);
          setTimeout(() => {
            client.socket.send(JSON.stringify({ v: 1, type: 'vote', slot: pick }));
          }, 200 + client.index * 120);
        }
      }
      return;
    }

    case 'playback': {
      if (client.index === 0) {
        playbacksSeen += 1;
        log(`  playback: ${msg.total} blooms at ${msg.durationMs}ms each, ${msg.heats} heats allowed`);
      }
      // Heat a couple of other people's blooms if the room is big enough.
      if (msg.heats > 0) {
        const others = (msg.items ?? []).map((item) => item.slot).filter((slot) => slot !== client.index);
        for (const slot of others.slice(0, msg.heats)) {
          setTimeout(() => {
            client.socket.send(JSON.stringify({ v: 1, type: 'heat', slot }));
          }, 400 + client.index * 60);
        }
      }
      return;
    }

    case 'results':
      if (client.index === 0) {
        const top = (msg.tallies ?? [])[0];
        log(`  results: "${msg.prompt}" — top bloom ${top?.votes ?? 0} votes${msg.unanimous ? ' (unanimous)' : ''}`);
      }
      return;

    case 'scoreboard':
      if (client.index === 0) {
        const leader = (msg.standings ?? [])[0];
        log(`  scoreboard: ${leader?.name ?? '?'} leads with ${leader?.score ?? 0}`);
      }
      // The host drives past reveal/scoreboard rather than waiting them out.
      if (client.isHost && !msg.final) {
        setTimeout(() => client.socket.send(JSON.stringify({ v: 1, type: 'next' })), 500);
      }
      return;

    case 'error':
      // wrong-phase is expected chatter from a staggered client; the rest is not.
      if (msg.code !== 'wrong-phase') {
        errorsSeen += 1;
        log(`  error from client ${client.index}: ${msg.code}`);
      }
      return;

    case 'rate-limit':
    case 'busy':
      errorsSeen += 1;
      log(`  throttled: client ${client.index} got ${msg.type}`);
      return;

    default:
      return;
  }
}

function finish(reason) {
  if (finished) return;
  finished = true;
  log('');
  log(`done — ${reason}`);
  log(`rounds completed: ${roundsCompleted}/5`);
  log(`playback phases:  ${playbacksSeen}`);
  log(`unexpected errors: ${errorsSeen}`);
  log(`phase trail: ${phasesSeen.join(' → ')}`);

  for (const client of clients) {
    try { client.socket.close(); } catch { /* already closed */ }
  }

  const ok = roundsCompleted >= 5 && errorsSeen === 0;
  log(ok ? 'PASS' : 'FAIL — a phase stalled or the room threw');
  process.exit(ok ? 0 : 1);
}

async function main() {
  log(`connecting ${players} simulated phones to room ${room} at ${endpoint.origin}`);
  for (let index = 0; index < players; index++) {
    await connect(index);
  }
  log(`all ${players} connected; host is client ${clients.findIndex((client) => client.isHost)}`);

  const host = clients.find((client) => client.isHost) ?? clients[0];
  host.socket.send(JSON.stringify({ v: 1, type: 'start' }));

  setTimeout(() => finish('timed out'), timeoutMs);
}

main().catch((err) => {
  console.error(err.message);
  console.error('\nIs the Worker running? cd workers/pointcast-bloom && npx wrangler dev');
  process.exit(1);
});
