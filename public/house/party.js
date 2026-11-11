// House Channel transport: a small client for the party relay the site
// already runs (workers/pointcast-drum, rooms named `bc-...`). The relay sends
// each frame to every peer but its sender and stores nothing. Same contract
// as makeParty() in /brick-choir/tv, without the presence-room fallback.
//
// Frames are small JSON objects; `o` is the sender's id. Anything over 512
// bytes is dropped by the relay, so it is refused here first.
import { frameFits } from './core.js';

export function makeParty(opts) {
  var room = opts.room, pid = opts.pid, onFrame = opts.onFrame, onStatus = opts.onStatus || function () {};
  var P = { ws: null, status: 'off', tries: 0, closed: false, sent: 0, recv: 0, dropped: 0 };
  var proto = location.protocol === 'https:' ? 'wss' : 'ws';
  var url = proto + '://' + location.host + '/api/drum/room?room=' + encodeURIComponent(room) + '&sid=' + encodeURIComponent('hc-' + pid);
  var timer = null, pingTimer = null;
  function setStatus(s) { if (P.status !== s) { P.status = s; onStatus(s); } }
  function open() {
    if (P.closed) return;
    setStatus(P.tries ? 'reconnecting' : 'connecting');
    var ws, ok = false;
    try { ws = new WebSocket(url); } catch (e) { return retry(); }
    P.ws = ws;
    var guard = setTimeout(function () { if (!ok) { try { ws.close(); } catch (e) {} } }, 8000);
    ws.onmessage = function (e) {
      var m; try { m = JSON.parse(e.data); } catch (err) { return; }
      if (!m || typeof m !== 'object') return;
      if (m.type === 'welcome') {
        clearTimeout(guard);
        if ((m.features || []).indexOf('bc-party') < 0) { P.closed = true; try { ws.close(); } catch (err) {} setStatus('unsupported'); return; }
        ok = true; P.tries = 0; setStatus('on'); return;
      }
      if (m.type === 'party' && m.d && typeof m.d === 'object') { P.recv += 1; onFrame(m.d); }
    };
    ws.onclose = function () { clearTimeout(guard); if (P.ws !== ws) return; P.ws = null; if (!P.closed) retry(); };
    ws.onerror = function () {};
  }
  function retry() {
    clearTimeout(timer);
    setStatus(P.tries > 2 ? 'offline' : 'reconnecting');
    var wait = Math.min(8000, 500 * Math.pow(2, P.tries));
    P.tries += 1;
    timer = setTimeout(open, wait);
  }
  P.send = function (d) {
    var ws = P.ws;
    if (!ws || ws.readyState !== 1 || P.status !== 'on') return false;
    d.o = pid;
    if (!frameFits(d)) { P.dropped += 1; return false; }
    try { ws.send(JSON.stringify({ v: 1, type: 'party', d: d })); } catch (e) { return false; }
    P.sent += 1;
    return true;
  };
  P.kick = function () { if (P.closed) return; if (!P.ws || P.ws.readyState > 1) { clearTimeout(timer); P.tries = 0; open(); } };
  P.close = function () { P.closed = true; clearTimeout(timer); clearInterval(pingTimer); try { if (P.ws) P.ws.close(); } catch (e) {} setStatus('off'); };
  // a ping every 25 s keeps idle sockets from being dropped by anything in between
  pingTimer = setInterval(function () { var ws = P.ws; if (ws && ws.readyState === 1) { try { ws.send('{"v":1,"type":"ping"}'); } catch (e) {} } }, 25000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') P.kick(); });
  addEventListener('online', function () { P.kick(); });
  addEventListener('pageshow', function () { P.kick(); });
  open();
  return P;
}

/**
 * A listener (and optional player) on an ordinary drum room: the same rooms
 * /drum-room-v2 uses. onHit gets { pad, velocity, clientId } for every hit by
 * someone else; hit(pad) sends one.
 */
export function makeDrumRoom(opts) {
  var D = { ws: null, closed: false, people: 0, seq: 0, tries: 0, on: false };
  var proto = location.protocol === 'https:' ? 'wss' : 'ws';
  var url = proto + '://' + location.host + '/api/drum/room?room=' + encodeURIComponent(opts.room) + '&sid=' + encodeURIComponent('hc-' + opts.pid);
  var timer = null;
  function open() {
    if (D.closed) return;
    var ws; try { ws = new WebSocket(url); } catch (e) { return retry(); }
    D.ws = ws;
    ws.onmessage = function (e) {
      var m; try { m = JSON.parse(e.data); } catch (err) { return; }
      if (!m || typeof m !== 'object') return;
      if (m.type === 'welcome') { D.on = true; D.tries = 0; D.me = m.you && m.you.clientId; D.people = m.connected || 1; if (opts.onPeople) opts.onPeople(D.people); return; }
      if (m.type === 'presence') { D.people = m.connected || 0; if (opts.onPeople) opts.onPeople(D.people); return; }
      if (m.type === 'hit' && m.clientId !== D.me && opts.onHit) opts.onHit({ pad: String(m.pad), velocity: Number(m.velocity) || 0.7, clientId: m.clientId, hue: m.hue });
    };
    ws.onclose = function () { D.on = false; if (D.ws !== ws) return; D.ws = null; if (!D.closed) retry(); };
    ws.onerror = function () {};
  }
  function retry() { clearTimeout(timer); var wait = Math.min(8000, 500 * Math.pow(2, D.tries)); D.tries += 1; timer = setTimeout(open, wait); }
  D.hit = function (pad, velocity) {
    var ws = D.ws; if (!ws || ws.readyState !== 1) return false;
    D.seq += 1;
    try { ws.send(JSON.stringify({ v: 1, type: 'hit', pad: pad, velocity: velocity || 0.8, seq: D.seq, clientAt: Date.now() })); } catch (e) { return false; }
    return true;
  };
  D.close = function () { D.closed = true; clearTimeout(timer); try { if (D.ws) D.ws.close(); } catch (e) {} };
  open();
  return D;
}

export function randomId(length) {
  var alpha = 'abcdefghijkmnpqrstuvwxyz23456789', out = '', bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (var i = 0; i < length; i += 1) out += alpha[bytes[i] % alpha.length];
  return out;
}

export function postJson(url, body) {
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' })
    .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'bad-response' }; }).then(function (j) { j.httpStatus = r.status; return j; }); })
    .catch(function () { return { ok: false, error: 'offline', httpStatus: 0 }; });
}
