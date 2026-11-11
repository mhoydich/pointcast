#!/usr/bin/env node
// Local server for House Channel, no Cloudflare needed:
//
//   node scripts/house-dev.mjs [port] [--fixtures]     default 8796
//   TV:     http://127.0.0.1:8796/house/
//   phone:  http://127.0.0.1:8796/house/r/
//
// Serves public/ as static files, mounts the real Pages Function
// functions/api/house.ts with no bindings (pairing lives in memory and the
// pages say "practice mode"), and stands in for the drum-room relay at
// /api/drum/room with the same wire contract as workers/pointcast-drum:
// welcome (features: bc-party for `bc-` rooms), presence, party relay to every
// peer but the sender, hit fan-out, 512-byte frames. Nothing else is mocked:
// /api/weather, /api/tide and /api/light answer 404 here, so the Window view
// shows its simulated sky and the Lights view shows its demo circle.
//
// --fixtures answers /api/weather, /api/tide and /api/light with canned test
// data so the live code paths can be exercised. Test data only; never real.
// Used by scripts/e2e-house-channel.mjs.
import { createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import wsPackage from 'ws';
import * as api from '../functions/api/house.ts';

const root = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
const port = Number(process.argv.find((a) => /^\d+$/.test(a)) || 8796);
const fixtures = process.argv.includes('--fixtures');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

function staticFile(pathname) {
  let file = normalize(join(root, decodeURIComponent(pathname)));
  if (!file.startsWith(root)) return null;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  return existsSync(file) && statSync(file).isFile() ? file : null;
}

const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const pad = (n) => String(n).padStart(2, '0');
function pacificStamp(ms) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${pad(Number(p.hour))}:${p.minute}`;
}
const FIXTURE_CIRCLE = 'f1x7ur3f1x7ur3f1x7ur3f1x7ur3f1x7';
function fixture(request, url) {
  if (url.pathname === '/api/weather') return jsonResponse({ ok: true, fixture: true, name: url.searchParams.get('label') || 'fixture', tempF: 61, condition: 'overcast', sunset: null, updatedAt: new Date().toISOString(), windMph: 9, windDirDeg: 270, cloudCover: 88 });
  if (url.pathname === '/api/tide') {
    const now = Date.now();
    return jsonResponse({ ok: true, fixture: true, source: 'fixture', station: url.searchParams.get('station'), predictions: [
      { time: pacificStamp(now - 3 * 3600000), heightFt: 1.1, kind: 'low' },
      { time: pacificStamp(now + 3 * 3600000), heightFt: 5.2, kind: 'high' },
    ] });
  }
  if (url.pathname === '/api/light') {
    const circle = request.headers.get('x-light-circle') || '';
    if (!circle) return jsonResponse({ ok: true, schema: 'pointcast.light/v0', fixture: true });
    if (circle !== FIXTURE_CIRCLE) return jsonResponse({ ok: false, error: 'No circle at that link.' }, 404);
    const lit = Math.floor(Date.now() / 4000) % 2 === 0;
    return jsonResponse({ ok: true, schema: 'pointcast.light/v0', fixture: true, circle: { members: [
      { id: 'aaaaaaa1', name: 'Fixture A', colour: 'amber', lit: true },
      { id: 'aaaaaaa2', name: 'Fixture B', colour: 'rose', lit },
      { id: 'aaaaaaa3', name: 'Fixture C', colour: 'sky', lit: false },
    ] }, signals: [] });
  }
  return null;
}

async function route(request) {
  const url = new URL(request.url);
  if (url.pathname === '/api/house') {
    const handler = { GET: api.onRequestGet, POST: api.onRequestPost, OPTIONS: api.onRequestOptions }[request.method];
    return handler ? handler({ request, env: {} }) : new Response('method not allowed', { status: 405 });
  }
  if (fixtures) { const hit = fixture(request, url); if (hit) return hit; }
  if (url.pathname.startsWith('/api/')) return jsonResponse({ ok: false, error: 'not-in-dev' }, 404);
  const file = staticFile(url.pathname);
  return file
    ? new Response(Readable.toWeb(createReadStream(file)), { headers: { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' } })
    : new Response('not found', { status: 404 });
}

const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const request = new Request(`http://${req.headers.host}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
    });
    const response = await route(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) Readable.fromWeb(response.body).pipe(res); else res.end();
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(String(error?.stack || error));
  }
});

// ── the relay stand-in ────────────────────────────────────────────────
const rooms = new Map(); // room → Set<socket>
const PADS = new Set(['kick', 'snare', 'hat', 'tom', 'clap', 'bell']);
const WebSocketServer = wsPackage.WebSocketServer || wsPackage.Server;
const wss = new WebSocketServer({ noServer: true });
let nextClient = 1;
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== '/api/drum/room') { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, (ws) => {
    const raw = (url.searchParams.get('room') || 'lobby').trim().toLowerCase();
    const room = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(raw) ? raw : 'lobby';
    const peers = rooms.get(room) || new Set();
    rooms.set(room, peers);
    const clientId = `dev-${nextClient++}`;
    peers.add(ws);
    const send = (to, payload) => { if (to.readyState === 1) to.send(JSON.stringify(payload)); };
    const presence = () => peers.forEach((p) => send(p, { v: 1, type: 'presence', room, connected: peers.size, serverAt: Date.now() }));
    send(ws, { v: 1, type: 'welcome', room, features: room.startsWith('bc-') ? ['bc-party'] : [], you: { clientId, avatar: 1, hue: 30 }, connected: peers.size, recentHits: [], totalHits: 0, serverAt: Date.now() });
    presence();
    ws.on('message', (data, isBinary) => {
      if (isBinary || data.length > 512) return send(ws, { v: 1, type: 'error', code: 'invalid-message' });
      let m; try { m = JSON.parse(String(data)); } catch { return send(ws, { v: 1, type: 'error', code: 'invalid-message' }); }
      if (!m || m.v !== 1) return send(ws, { v: 1, type: 'error', code: 'invalid-message' });
      if (m.type === 'ping') return send(ws, { v: 1, type: 'pong', serverAt: Date.now() });
      if (m.type === 'party' && room.startsWith('bc-') && m.d && typeof m.d === 'object') {
        peers.forEach((p) => { if (p !== ws) send(p, { v: 1, type: 'party', from: clientId, serverAt: Date.now(), d: m.d }); });
        return;
      }
      if (m.type === 'hit' && PADS.has(m.pad)) {
        peers.forEach((p) => send(p, { v: 1, type: 'hit', id: `${clientId}-${m.seq}`, clientId, avatar: 1, hue: 30, pad: m.pad, velocity: Math.max(0.05, Math.min(1, Number(m.velocity) || 0.7)), seq: m.seq, serverAt: Date.now() }));
        return;
      }
      send(ws, { v: 1, type: 'error', code: 'invalid-message' });
    });
    ws.on('close', () => { peers.delete(ws); if (!peers.size) rooms.delete(room); else presence(); });
  });
});

server.listen(port, '127.0.0.1', () => console.log(`House Channel (in-memory${fixtures ? ', fixtures' : ''}) on http://127.0.0.1:${port}/house/ and /house/r/`));
