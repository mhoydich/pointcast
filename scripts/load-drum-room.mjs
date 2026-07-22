#!/usr/bin/env node

const args = process.argv.slice(2);
const endpointArg = args.find((arg) => !arg.startsWith('--')) || 'ws://127.0.0.1:8787/?room=hundred-live';
const readNumber = (name, fallback) => {
  const flag = args.find((arg) => arg.startsWith(`--${name}=`));
  const value = Number(flag?.split('=')[1] || fallback);
  return Number.isFinite(value) ? value : fallback;
};
const clientsWanted = Math.max(1, Math.min(125, Math.trunc(readNumber('clients', 100))));
const holdMs = Math.max(1_000, Math.trunc(readNumber('hold-ms', 5_000)));
const senderCount = Math.max(1, Math.min(clientsWanted, Math.trunc(readNumber('senders', 8))));
const endpoint = new URL(endpointArg);
const room = endpoint.searchParams.get('room') || 'hundred-live';
endpoint.searchParams.set('room', room);

const sockets = [];
const samples = [];
let opens = 0;
let welcomes = 0;
let peakConnected = 0;
let hitsSeen = 0;

function connect(index) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    url.searchParams.set('sid', `load-${Date.now()}-${index}`);
    const socket = new WebSocket(url);
    sockets.push(socket);
    const timeout = setTimeout(() => reject(new Error(`client ${index} connection timeout`)), 12_000);
    socket.addEventListener('open', () => {
      opens += 1;
      clearTimeout(timeout);
      resolve(socket);
    }, { once: true });
    socket.addEventListener('error', () => {
      clearTimeout(timeout);
      reject(new Error(`client ${index} websocket error`));
    }, { once: true });
    socket.addEventListener('message', (event) => {
      let message;
      try { message = JSON.parse(String(event.data)); } catch { return; }
      if (message.type === 'welcome') welcomes += 1;
      if (message.type === 'presence') peakConnected = Math.max(peakConnected, Number(message.connected) || 0);
      if (message.type === 'hit') {
        hitsSeen += 1;
        if (Number.isFinite(message.clientAt)) samples.push(Math.max(0, Date.now() - message.clientAt));
      }
    });
  });
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

let exitCode = 0;
try {
  await Promise.all(Array.from({ length: clientsWanted }, (_, index) => connect(index)));
  await new Promise((resolve) => setTimeout(resolve, 500));

  for (let index = 0; index < senderCount; index += 1) {
    const socket = sockets[index];
    socket.send(JSON.stringify({
      v: 1,
      type: 'hit',
      pad: ['kick', 'snare', 'hat', 'tom', 'clap', 'bell'][index % 6],
      velocity: 0.55 + (index % 4) * 0.1,
      seq: index,
      clientAt: Date.now(),
    }));
    await new Promise((resolve) => setTimeout(resolve, 80));
  }

  await new Promise((resolve) => setTimeout(resolve, holdMs));
  const statsUrl = new URL(endpoint);
  statsUrl.protocol = statsUrl.protocol === 'wss:' ? 'https:' : 'http:';
  statsUrl.searchParams.set('stats', '1');
  statsUrl.searchParams.delete('sid');
  const statsResponse = await fetch(statsUrl);
  const stats = statsResponse.ok ? await statsResponse.json() : { status: statsResponse.status };
  const report = {
    ok: opens === clientsWanted && peakConnected >= clientsWanted && hitsSeen >= senderCount,
    endpoint: endpoint.origin + endpoint.pathname,
    room,
    clientsWanted,
    opens,
    welcomes,
    peakConnected,
    senders: senderCount,
    hitsSeen,
    latencyMs: { samples: samples.length, p50: percentile(samples, 0.5), p95: percentile(samples, 0.95), max: samples.length ? Math.max(...samples) : null },
    stats,
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error), opens }, null, 2));
  exitCode = 1;
} finally {
  for (const socket of sockets) {
    try { socket.close(1000, 'load-complete'); } catch {}
  }
}

process.exitCode = exitCode;
