// House Channel, the TV page. This page is the only authority: it holds the
// state, draws it, makes every sound, and tells paired phones what is true.
// Rules live in core.js; the relay client in party.js.
//
// Written for old TV browsers: no optional chaining, no `??`, 2D canvas only.
import {
  MAX_PHONES, PHONE_STALE_MS, applyCommand, circleMembers, cleanCode, clockText, compass, demoCircle, encodeState,
  hearthAt, newState, placeOf, roomIsIdle, shouldDim, skyModel, tick,
} from './core.js';
import { makeDrumRoom, makeParty, postJson } from './party.js';

var $ = function (id) { return document.getElementById(id); };
var canvas = $('stage'), g = canvas.getContext('2d');
var els = { blackNote: $('blackNote'), pair: $('pair'), code: $('pairCode'), note: $('pairNote'), url: $('pairUrl'), chip: $('chip'), toast: $('toast'), tap: $('tap'), dim: $('dim'), black: $('black'), fs: $('fsHint') };
var SAVE_KEY = 'hc.tv.v0';
var MAX_UNPAIRED_RENEWALS = 12; // two hours of codes with no phone, then stop asking
var MAX_FAILURES = 8;           // store errors in a row before the TV stops asking and waits for a press
var PAIR_COOLDOWN_MS = 60000;   // one fresh code a minute from a phone's Pair button
function backoff(n) { return Math.min(600000, 15000 * Math.pow(2, Math.max(0, n - 1))); }

var S = {
  session: null,        // { room, key, drum }
  state: null,
  party: null, drumRoom: null,
  phones: {},           // pid → last heard (ms)
  lastPhoneAt: 0,
  code: '', codeExpiresAt: 0, renewals: 0, store: '',
  ended: false, failures: 0, lastPairAt: 0, starting: false, everPaired: false, opening: false, nextOpenAt: 0, chip: false,
  flare: 0, spark: 0, sparks: [], smoke: 0,
  live: null, liveFor: '', liveTimer: 0,
  lightApi: null, lightsStatus: 'none', members: [], litAt: {}, lightsTimer: 0, lightsFor: '',
  drumHits: [], drumPeople: 0,
  wake: null, sendTimer: 0, lastSent: 0, toastTimer: 0,
};
els.url.textContent = location.host.replace(/^www\./, '') + '/house/r';

// ── sound: all of it is made here, and none of it starts on its own ──────
var A = { ctx: null, master: null, noise: null, beds: {}, needTap: false, crackleAt: 0 };
function audioWanted() { return !!(S.state && S.state.sound.on && !S.ended); }
function audioEnsure() {
  if (A.ctx) return true;
  var Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return false;
  try { A.ctx = new Ctor(); } catch (e) { return false; }
  A.master = A.ctx.createGain(); A.master.gain.value = 0; A.master.connect(A.ctx.destination);
  var len = A.ctx.sampleRate * 2, buf = A.ctx.createBuffer(1, len, A.ctx.sampleRate), d = buf.getChannelData(0), last = 0;
  for (var i = 0; i < len; i += 1) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; } // brown-ish noise
  A.noise = buf;
  return true;
}
function audioBed(name, type, freq, q) {
  if (A.beds[name]) return A.beds[name];
  var src = A.ctx.createBufferSource(); src.buffer = A.noise; src.loop = true;
  var f = A.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  var gain = A.ctx.createGain(); gain.gain.value = 0;
  src.connect(f); f.connect(gain); gain.connect(A.master); src.start();
  A.beds[name] = { gain: gain, filter: f };
  return A.beds[name];
}
function audioSync() {
  var want = audioWanted();
  if (!want) {
    A.needTap = false; els.tap.hidden = true;
    if (A.ctx && A.master) A.master.gain.setTargetAtTime(0, A.ctx.currentTime, 0.2);
    return;
  }
  if (!audioEnsure()) return;
  if (A.ctx.state !== 'running') {
    var p = A.ctx.resume();
    if (p && p.catch) p.catch(function () {});
    // Some browsers only start sound after a press on this page. Say so instead of staying silent.
    setTimeout(function () {
      var blocked = audioWanted() && A.ctx.state !== 'running';
      if (blocked !== A.needTap) { A.needTap = blocked; els.tap.hidden = !blocked; queueSend(); }
    }, 400);
  } else if (A.needTap) { A.needTap = false; els.tap.hidden = true; queueSend(); }
  var s = S.state.sound, v = s.muted ? 0 : Math.pow(s.vol / 100, 2) * 0.9;
  A.master.gain.setTargetAtTime(v, A.ctx.currentTime, 0.15);
}
function audioBeds(now) {
  if (!A.ctx || A.ctx.state !== 'running' || !S.state) return;
  var t = A.ctx.currentTime, view = S.state.view, fire = hearthAt(S.state, now);
  var roar = view === 'hearth' && fire.lit ? 0.12 + 0.3 * Math.min(1, fire.level + S.flare * 0.5) : 0;
  audioBed('roar', 'lowpass', 420, 0.4).gain.gain.setTargetAtTime(roar, t, 0.6);
  var sky = view === 'window' ? skyModel(S.state, now, S.live) : null;
  var wind = sky && sky.windMph != null ? 0.03 + Math.min(0.3, sky.windMph / 90) : 0;
  audioBed('wind', 'bandpass', 520, 0.7).gain.gain.setTargetAtTime(wind, t, 1.2);
  var surf = sky && sky.tide ? 0.1 + 0.1 * Math.sin(now / 3800) : 0;
  audioBed('surf', 'lowpass', 900, 0.3).gain.gain.setTargetAtTime(Math.max(0, surf), t, 0.8);
  if (roar > 0 && now > A.crackleAt) {
    A.crackleAt = now + 120 + Math.random() * (900 - 600 * Math.min(1, fire.level + S.flare));
    blip('crackle');
  }
}
function tone(freq, dur, type, vol, slideTo) {
  var t = A.ctx.currentTime, o = A.ctx.createOscillator(), e = A.ctx.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(vol, t + 0.008); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(e); e.connect(A.master); o.start(t); o.stop(t + dur + 0.05);
}
function burst(dur, type, freq, vol) {
  var t = A.ctx.currentTime, src = A.ctx.createBufferSource(), f = A.ctx.createBiquadFilter(), e = A.ctx.createGain();
  src.buffer = A.noise; f.type = type; f.frequency.value = freq;
  e.gain.setValueAtTime(vol, t); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(e); e.connect(A.master); src.start(t, Math.random() * 1.5, dur + 0.05);
}
function blip(kind, amount) {
  if (!A.ctx || A.ctx.state !== 'running' || !audioWanted()) return;
  var a = amount == null ? 0.7 : amount;
  if (kind === 'crackle') burst(0.03 + Math.random() * 0.05, 'highpass', 1800 + Math.random() * 2500, 0.25 + Math.random() * 0.3);
  else if (kind === 'thunk') { tone(110, 0.16, 'sine', 0.35, 60); burst(0.06, 'lowpass', 600, 0.3); }
  else if (kind === 'whoosh') burst(0.5, 'bandpass', 700, 0.12 + 0.25 * a);
  else if (kind === 'hiss') burst(1.1, 'highpass', 3000, 0.25);
  else if (kind === 'bell') { tone(660, 2.2, 'sine', 0.16); tone(1320, 1.4, 'sine', 0.05); tone(1980, 0.8, 'sine', 0.02); }
  else if (kind === 'kick') tone(150, 0.3, 'sine', 0.8 * a, 45);
  else if (kind === 'snare') { burst(0.16, 'highpass', 1500, 0.5 * a); tone(190, 0.1, 'triangle', 0.3 * a); }
  else if (kind === 'hat') burst(0.05, 'highpass', 7000, 0.35 * a);
  else if (kind === 'tom') tone(210, 0.28, 'sine', 0.6 * a, 110);
  else if (kind === 'clap') { burst(0.02, 'bandpass', 1200, 0.5 * a); setTimeout(function () { burst(0.12, 'bandpass', 1200, 0.5 * a); }, 22); }
}
function localGesture() {
  // any press on this page: unlock sound if it was waiting, otherwise offer full screen
  document.body.className = 'tv pointer';
  if (S.ended) { start(); return; }
  if (A.needTap && A.ctx) { var p = A.ctx.resume(); if (p && p.then) p.then(audioSync, function () {}); return; }
  var el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (req && !(document.fullscreenElement || document.webkitFullscreenElement)) { try { var r = req.call(el); if (r && r.catch) r.catch(function () {}); } catch (e) {} }
}
addEventListener('click', localGesture);
addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'f' || e.keyCode === 13) localGesture(); });
if (!(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) els.fs.textContent = '';

// ── keeping the screen awake while there is something on it ─────────────
function wakeSync() {
  var want = !!S.state && !S.ended && S.state.view !== 'off' && document.visibilityState === 'visible';
  if (want && !S.wake && navigator.wakeLock && navigator.wakeLock.request) {
    S.wake = 'pending';
    navigator.wakeLock.request('screen').then(function (lock) {
      S.wake = lock;
      lock.addEventListener('release', function () { if (S.wake === lock) S.wake = null; });
      wakeSync();
    }, function () { S.wake = null; });
  } else if (!want && S.wake && S.wake !== 'pending') { var l = S.wake; S.wake = null; try { l.release(); } catch (e) {} }
}
document.addEventListener('visibilitychange', wakeSync);

// ── pairing ─────────────────────────────────────────────────────────────
function save() {
  if (!S.session || !S.state) return;
  var copy = JSON.parse(JSON.stringify(S.state));
  copy.lights.circle = ''; // a circle link is someone's key; it is never written down here
  try { sessionStorage.setItem(SAVE_KEY, JSON.stringify({ session: S.session, state: copy, everPaired: S.everPaired })); } catch (e) {}
}
function toast(text) {
  els.toast.textContent = text; els.toast.hidden = false;
  clearTimeout(S.toastTimer); S.toastTimer = setTimeout(function () { els.toast.hidden = true; }, 5000);
}
function phoneCount() { var n = 0; for (var k in S.phones) if (Object.prototype.hasOwnProperty.call(S.phones, k)) n += 1; return n; }
function showPairing() {
  // The big code is for a TV nobody has paired with yet. After that the picture stays up and a
  // code, when there is one, sits in the corner: a phone that locks must not cover a burning fire.
  var paired = S.everPaired;
  els.pair.hidden = paired || S.ended || !S.session;
  els.chip.hidden = !(paired && S.code && S.chip);
  if (S.code) {
    els.code.textContent = S.code;
    els.chip.innerHTML = '';
    els.chip.appendChild(document.createTextNode('another phone: ' + els.url.textContent));
    var b = document.createElement('b'); b.textContent = S.code; els.chip.appendChild(b);
    els.note.textContent = S.store === 'memory' ? 'Practice mode: this code only works on this machine.' : 'Waiting for a phone.';
  } else if (!paired) {
    els.code.textContent = '·····';
  }
}
function openCode() {
  if (!S.session || S.ended || S.opening) return;
  S.opening = true;
  postJson('/api/house', { action: 'open', room: S.session.room, key: S.session.key }).then(function (r) {
    S.opening = false;
    if (S.ended || !S.session) return;
    if (r.ok) { S.failures = 0; S.code = cleanCode(r.code); S.codeExpiresAt = r.expiresAt; S.store = r.store || ''; showPairing(); queueSend(); return; }
    // the room ran out on the server: open a new one but keep the fire, the view and the sound as they are
    if (r.error === 'room-gone' || r.error === 'not-your-room' || r.error === 'bad-room') { var keep = S.state; forget(); start(keep); return; }
    S.code = ''; showPairing();
    S.failures += 1;
    if (S.failures >= MAX_FAILURES) { els.note.textContent = 'The pairing service is not answering. Reload this page for a new code.'; S.nextOpenAt = Infinity; return; }
    els.note.textContent = r.error === 'rate-limited' ? 'Too many codes from here. Trying again in a few minutes.' : 'The pairing service is not answering. Trying again.';
    S.nextOpenAt = Date.now() + (r.error === 'rate-limited' ? Math.max(180000, backoff(S.failures)) : backoff(S.failures));
  });
}
function start(keep) {
  if (S.starting) return;
  S.starting = true; S.ended = false; els.black.hidden = true; if (els.blackNote) els.blackNote.hidden = true;
  S.phones = {}; S.code = ''; S.renewals = 0; S.everPaired = false; S.chip = false; S.opening = false; S.nextOpenAt = 0; S.flare = 0; S.spark = 0; S.live = null; S.liveFor = ''; S.members = []; S.lightsFor = '';
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(SAVE_KEY) || 'null'); } catch (e) {}
  var begin = function (session, state, first) {
    S.starting = false;
    S.session = session; S.state = state; S.lastPhoneAt = Date.now(); S.state.lastInputAt = Date.now();
    if (first) { S.code = cleanCode(first.code); S.codeExpiresAt = first.expiresAt; S.store = first.store || ''; }
    S.party = makeParty({ room: session.room, pid: 'tv', onFrame: onFrame, onStatus: function () { queueSend(); } });
    save(); showPairing(); wakeSync(); viewChanged();
  };
  if (!keep && saved && saved.session && saved.state && saved.state.hearth && saved.state.sky) {
    saved.state.sound.on = false; // a reloaded page starts silent again
    S.everPaired = !!saved.everPaired;
    begin(saved.session, saved.state, null);
    return;
  }
  els.pair.hidden = false; els.note.textContent = 'Getting a code…';
  postJson('/api/house', { action: 'open' }).then(function (r) {
    if (!r.ok) {
      S.starting = false;
      S.failures += 1;
      if (S.failures >= MAX_FAILURES) { els.note.textContent = 'The pairing service is not answering. Reload this page to try again.'; return; }
      els.note.textContent = r.error === 'rate-limited' ? 'Too many codes from here. Trying again in a few minutes.' : 'The pairing service is not answering. Trying again.';
      var wait = r.error === 'rate-limited' ? Math.max(180000, backoff(S.failures)) : backoff(S.failures);
      setTimeout(function () { start(keep); }, wait);
      return;
    }
    S.failures = 0;
    var state = newState(r.drum);
    if (keep && keep.hearth && keep.sky) { keep.drum = state.drum; state = keep; }
    begin({ room: r.room, key: r.key, drum: r.drum }, state, r);
  });
}
function forget() {
  try { sessionStorage.removeItem(SAVE_KEY); } catch (e) {}
  if (S.party) { S.party.close(); S.party = null; }
  if (S.drumRoom) { S.drumRoom.close(); S.drumRoom = null; }
  S.session = null; S.state = null; S.phones = {}; S.code = ''; S.members = []; S.live = null;
  els.chip.hidden = true; els.tap.hidden = true; els.dim.className = 'dim';
}
/** End: tell the phones, delete the pairing, forget everything, go black. */
function endSession(restart, idle) {
  if (!S.session) return;
  var session = S.session;
  if (S.party) S.party.send({ t: 'bye' });
  postJson('/api/house', { action: 'end', room: session.room, key: session.key });
  if (A.ctx && A.master) A.master.gain.setTargetAtTime(0, A.ctx.currentTime, 0.1);
  setTimeout(function () {
    forget();
    if (restart) { start(); return; }
    S.ended = true; els.pair.hidden = true; els.black.hidden = false; wakeSync();
    if (els.blackNote) els.blackNote.hidden = !idle;
  }, 250);
}

// ── phones ──────────────────────────────────────────────────────────────
function extra(now) {
  return { needTap: A.needTap, sky: skyModel(S.state, now, S.live).status, lights: S.lightsStatus, phones: phoneCount(), code: now < S.codeExpiresAt && (S.chip || !S.everPaired) ? S.code : '', dim: shouldDim(S.state, now) };
}
function sendNow() {
  S.sendTimer = 0;
  if (!S.party || !S.state) return;
  S.lastSent = Date.now();
  S.party.send(encodeState(S.state, S.lastSent, extra(S.lastSent)));
}
function queueSend() { if (!S.sendTimer) S.sendTimer = setTimeout(sendNow, 80); }
function onFrame(f) {
  if (!S.state || S.ended || typeof f.o !== 'string' || f.o === 'tv' || f.o.length > 16) return;
  var pid = f.o, now = Date.now(), known = Object.prototype.hasOwnProperty.call(S.phones, pid);
  if (f.t === 'left') { if (known) { delete S.phones[pid]; showPairing(); queueSend(); } return; }
  if (!known) {
    if (f.t !== 'hi' && f.t !== 'hb' && f.t !== 'cmd') return;
    if (phoneCount() >= MAX_PHONES) { S.party.send({ t: 'full', to: pid }); return; }
    // the first pairing takes the big code down; the corner code only shows when someone asks for it
    if (!S.everPaired) S.chip = false;
    S.phones[pid] = now; S.everPaired = true; S.renewals = 0; save();
    toast(phoneCount() === 1 ? 'A phone is paired.' : 'Another phone joined. ' + phoneCount() + ' phones.');
    showPairing();
  }
  S.phones[pid] = now; S.lastPhoneAt = now;
  if (f.t === 'hi') { S.state.lastInputAt = now; queueSend(); return; }
  if (f.t === 'hb') { if (now - S.lastSent > 3000) queueSend(); return; }
  if (f.t !== 'cmd') return;
  var res = applyCommand(S.state, f, now);
  if (!res.ok) { queueSend(); return; }
  for (var i = 0; i < res.events.length; i += 1) onEvent(res.events[i], res);
  if (res.changed) save();
  viewChanged(); audioSync(); wakeSync(); queueSend();
}
function onEvent(ev, res) {
  if (ev === 'spark') S.spark = Math.max(S.spark, res.amount);
  else if (ev === 'breath') { S.flare = Math.min(1, S.flare + 0.25 + 0.4 * res.amount); spawnSparks(4 + Math.round(8 * res.amount)); blip('whoosh', res.amount); }
  else if (ev === 'lit') { S.flare = 0.6; S.spark = 0; spawnSparks(10); blip('whoosh', 0.6); }
  else if (ev === 'snuffed') { S.smoke = 1; S.flare = 0; blip('hiss'); }
  else if (ev === 'stacked') blip('thunk');
  else if (ev === 'pair') { S.chip = true; var t = Date.now(); if (t - S.lastPairAt > PAIR_COOLDOWN_MS || !S.code) { S.lastPairAt = t; S.renewals = 0; openCode(); } else { showPairing(); queueSend(); } }
  else if (ev === 'end') endSession(false);
  else if (ev === 'circle') { S.lightsFor = ''; S.members = []; S.litAt = {}; }
  else if (ev === 'place') { S.liveFor = ''; }
}

// ── data the views read ─────────────────────────────────────────────────
function getJson(url, headers) {
  return fetch(url, { cache: 'no-store', headers: headers || {} }).then(function (r) {
    return r.json().then(function (j) { j.httpStatus = r.status; return j; }, function () { return { ok: false, httpStatus: r.status }; });
  }, function () { return { ok: false, httpStatus: 0 }; });
}
function skyRefresh(now) {
  var st = S.state;
  if (st.view !== 'window' || st.sky.mode !== 'auto') return;
  var key = st.sky.place;
  if (S.liveFor === key && now < S.liveTimer) return;
  S.liveFor = key; S.liveTimer = now + 10 * 60000;
  if (!S.live || S.live.place !== key) S.live = { place: key, tried: false, weather: null, tide: null, readAt: 0 };
  var place = placeOf(key), live = S.live;
  Promise.all([
    getJson('/api/weather?lat=' + place.lat + '&lng=' + place.lng + '&label=' + place.id),
    getJson('/api/tide?station=' + place.tide),
  ]).then(function (r) {
    if (S.live !== live) return;
    live.weather = r[0] && r[0].ok === true && typeof r[0].tempF === 'number' ? r[0] : null;
    live.tide = r[1] && r[1].ok === true && Array.isArray(r[1].predictions) ? r[1] : null;
    live.tried = true; live.readAt = Date.now();
    if (!live.weather && !live.tide) S.liveTimer = Date.now() + 2 * 60000; // look again sooner
    queueSend();
  });
}
function lightsRefresh(now) {
  var st = S.state;
  if (st.view !== 'lights') return;
  if (S.lightApi === null) {
    S.lightApi = 'checking';
    getJson('/api/light').then(function (j) { S.lightApi = j && j.schema === 'pointcast.light/v0'; S.lightsFor = ''; });
    return;
  }
  if (S.lightApi === 'checking') return;
  var setStatus = function (s) { if (S.lightsStatus !== s) { S.lightsStatus = s; queueSend(); } };
  if (!S.lightApi) { setMembers(demoCircle(now), now); setStatus('demo'); return; }
  if (!st.lights.circle) { S.members = []; setStatus('none'); return; }
  if (S.lightsFor === st.lights.circle && now < S.lightsTimer) return;
  S.lightsFor = st.lights.circle; S.lightsTimer = now + 15000; // one read every 15 s keeps a TV inside the site's daily request budget
  var circle = st.lights.circle;
  getJson('/api/light', { 'X-Light-Circle': circle }).then(function (j) {
    if (!S.state || S.state.lights.circle !== circle) return;
    if (j && j.ok === true && j.circle) { setMembers(circleMembers(j), Date.now()); setStatus('live'); }
    else if (j.httpStatus === 404 || j.httpStatus === 400 || j.httpStatus === 410) { S.members = []; setStatus('gone'); }
    else { S.members = []; setStatus('down'); } // never draw dark windows it cannot vouch for
  });
}
function setMembers(list, now) {
  var was = {}, i, queue = 0;
  for (i = 0; i < S.members.length; i += 1) was[S.members[i].id] = S.members[i].lit;
  var first = S.members.length === 0;
  for (i = 0; i < list.length; i += 1) {
    var m = list[i];
    if (m.lit && (first || !was[m.id])) {
      // windows catch in turn, each with a soft bell
      (function (id, delay) { S.litAt[id] = now + delay; setTimeout(function () { if (S.state && S.state.view === 'lights') blip('bell'); }, delay); }(m.id, queue * 900));
      queue += 1;
    } else if (!m.lit) delete S.litAt[m.id];
  }
  S.members = list;
}
function viewChanged() {
  if (!S.state) return;
  var want = S.state.view === 'drum' && S.state.drum;
  if (want && !S.drumRoom) {
    S.drumRoom = makeDrumRoom({ room: S.state.drum, pid: 'tv', onPeople: function (n) { S.drumPeople = n; }, onHit: function (h) { S.drumHits.push({ pad: h.pad, at: Date.now(), v: h.velocity }); if (S.drumHits.length > 40) S.drumHits.shift(); blip(h.pad, h.velocity); } });
  } else if (!want && S.drumRoom) { S.drumRoom.close(); S.drumRoom = null; S.drumPeople = 0; }
  els.black.hidden = !(S.ended || S.state.view === 'off');
}

// ── drawing ─────────────────────────────────────────────────────────────
var W = 0, H = 0, DPR = 1;
function resize() {
  DPR = Math.min(1.5, window.devicePixelRatio || 1);
  W = Math.max(320, window.innerWidth); H = Math.max(180, window.innerHeight);
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
}
addEventListener('resize', resize); resize();
var MONO = '"JetBrains Mono","IBM Plex Mono",Menlo,Consolas,monospace', SANS = '"Inter","Helvetica Neue",Arial,sans-serif';
function lerp(a, b, t) { return a + (b - a) * t; }
function mix(c1, c2, t) { t = Math.max(0, Math.min(1, t)); return 'rgb(' + Math.round(lerp(c1[0], c2[0], t)) + ',' + Math.round(lerp(c1[1], c2[1], t)) + ',' + Math.round(lerp(c1[2], c2[2], t)) + ')'; }
function label(text, x, y, size, color, align, font) {
  g.font = '500 ' + Math.round(size) + 'px ' + (font || MONO); g.fillStyle = color; g.textAlign = align || 'left'; g.textBaseline = 'alphabetic';
  g.fillText(text, x, y);
}
function badge(text, tone) {
  var size = Math.max(11, W * 0.012), pad = size * 0.7;
  g.font = '500 ' + Math.round(size) + 'px ' + MONO;
  var w = g.measureText(text).width + pad * 2, x = W * 0.045, y = H * 0.07;
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(x, y, w, size + pad * 1.4);
  g.strokeStyle = tone === 'live' ? '#8fd09a' : tone === 'sim' ? '#ffb454' : 'rgba(243,234,217,.5)'; g.lineWidth = 1.5; g.strokeRect(x, y, w, size + pad * 1.4);
  g.fillStyle = tone === 'live' ? '#8fd09a' : tone === 'sim' ? '#ffb454' : '#f3ead9'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillText(text, x + pad, y + size + pad * 0.55);
}
function spawnSparks(n) {
  for (var i = 0; i < n && S.sparks.length < 60; i += 1) S.sparks.push({ x: (Math.random() - 0.5) * 0.12, y: 0, vx: (Math.random() - 0.5) * 0.05, vy: -(0.12 + Math.random() * 0.22), life: 1 });
}
function flame(cx, base, w, h, t, seed, colorA, colorB) {
  var sway = Math.sin(t * 1.7 + seed) * w * 0.12 + Math.sin(t * 3.1 + seed * 2) * w * 0.06;
  var tipX = cx + sway, tipY = base - h * (0.9 + 0.1 * Math.sin(t * 5.3 + seed));
  var grad = g.createLinearGradient(0, base, 0, tipY);
  grad.addColorStop(0, colorA); grad.addColorStop(1, colorB);
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(cx - w / 2, base);
  g.bezierCurveTo(cx - w * 0.62, base - h * 0.35, cx - w * 0.2 + sway * 0.4, base - h * 0.6, tipX, tipY);
  g.bezierCurveTo(cx + w * 0.2 + sway * 0.4, base - h * 0.6, cx + w * 0.62, base - h * 0.35, cx + w / 2, base);
  g.closePath(); g.fill();
}
function drawHearth(now, dt) {
  var st = S.state, fire = hearthAt(st, now), t = now / 1000;
  var level = fire.lit ? Math.min(1.25, fire.level + S.flare * 0.4) : 0;
  var cx = W / 2, floor = H * 0.8, u = Math.min(W, H * 1.6) / 100;
  // the room: dark, warmer when the fire is up
  var glow = g.createRadialGradient(cx, floor - u * 6, u * 2, cx, floor - u * 6, u * (30 + 50 * level));
  glow.addColorStop(0, 'rgba(255,150,60,' + (0.08 + 0.42 * level + 0.25 * S.spark) + ')'); glow.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = '#060403'; g.fillRect(0, 0, W, H);
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  // hearth stone
  g.fillStyle = '#1b1511'; g.fillRect(cx - u * 34, floor, u * 68, u * 3.2);
  g.fillStyle = '#0f0b08'; g.fillRect(cx - u * 40, floor + u * 3.2, u * 80, H);
  // logs: two along, then crossed on top
  var logs = fire.phase === 'out' ? 0 : st.hearth.logs;
  var spots = [[-8, -0.6, 21, 0.16], [8, -0.6, 21, -0.16], [0, -5, 20, 0.03], [-5, -9, 17, -0.14], [5, -9.4, 17, 0.15]];
  for (var i = 0; i < logs && i < spots.length; i += 1) {
    var sp = spots[i];
    g.save(); g.translate(cx + sp[0] * u, floor - u * 2.1 + sp[1] * u); g.rotate(sp[3]);
    g.fillStyle = fire.lit ? mix([58, 36, 22], [30, 16, 10], 1 - fire.remainingMs / Math.max(1, st.hearth.minutes * 60000)) : fire.phase === 'snuffed' ? '#2a1c14' : '#4a2f1d';
    g.fillRect(-sp[2] * u / 2, -u * 2, sp[2] * u, u * 4);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-sp[2] * u / 2, u * 0.6, sp[2] * u, u * 1.4);
    g.fillStyle = '#6b4a30'; g.beginPath(); g.arc(sp[2] * u / 2, 0, u * 2, 0, Math.PI * 2); g.fill();
    if (fire.lit || fire.phase === 'snuffed') { g.fillStyle = 'rgba(255,110,40,' + (fire.lit ? 0.25 + 0.2 * Math.sin(t * 2 + i) : 0.06) + ')'; g.fillRect(-sp[2] * u / 2, -u * 2, sp[2] * u, u * 0.9); }
    g.restore();
  }
  if (fire.phase === 'out') { g.fillStyle = '#2b2622'; g.beginPath(); g.ellipse ? g.ellipse(cx, floor - u * 0.6, u * 14, u * 1.6, 0, 0, Math.PI * 2) : g.arc(cx, floor, u * 6, Math.PI, 0); g.fill(); }
  // kindling glow while a phone is holding to light
  if (S.spark > 0.01 && !fire.lit) {
    g.fillStyle = 'rgba(255,170,70,' + (0.25 + 0.6 * S.spark) + ')';
    g.beginPath(); g.arc(cx, floor - u * 3, u * (1 + 3 * S.spark), 0, Math.PI * 2); g.fill();
    flame(cx, floor - u * 2, u * 3 * S.spark, u * 7 * S.spark, t, 1, 'rgba(255,190,90,.9)', 'rgba(255,120,40,0)');
  }
  if (level > 0) {
    var h = u * (10 + 34 * level), w = u * (12 + 14 * level), base = floor - u * 2.5;
    flame(cx, base, w * 1.25, h * 0.92, t * 0.9, 0.3, 'rgba(210,60,20,.85)', 'rgba(150,30,10,0)');
    flame(cx - w * 0.28, base, w * 0.6, h * 0.7, t * 1.2, 2.1, 'rgba(255,120,30,.9)', 'rgba(230,70,20,0)');
    flame(cx + w * 0.3, base, w * 0.55, h * 0.62, t * 1.35, 4.2, 'rgba(255,120,30,.9)', 'rgba(230,70,20,0)');
    flame(cx, base, w * 0.8, h * 0.85, t * 1.1, 5.5, 'rgba(255,170,50,.95)', 'rgba(255,110,30,0)');
    flame(cx + w * 0.04, base, w * 0.42, h * 0.5, t * 1.6, 7.7, 'rgba(255,236,170,.95)', 'rgba(255,190,80,0)');
  }
  // sparks
  for (var k = S.sparks.length - 1; k >= 0; k -= 1) {
    var p = S.sparks[k]; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.03 * dt; p.life -= dt * 0.6;
    if (p.life <= 0) { S.sparks.splice(k, 1); continue; }
    g.fillStyle = 'rgba(255,200,120,' + p.life + ')'; g.fillRect(cx + p.x * W, floor - u * 12 + p.y * H, u * 0.45, u * 0.45);
  }
  if (S.smoke > 0.01) { g.fillStyle = 'rgba(150,150,150,' + 0.25 * S.smoke + ')'; g.beginPath(); g.arc(cx + Math.sin(t) * u * 3, floor - u * (10 + 26 * (1 - S.smoke)), u * (5 + 9 * (1 - S.smoke)), 0, Math.PI * 2); g.fill(); }
  // words, small and low
  var line = fire.lit ? clockText(fire.remainingMs / 1000) + ' left' : fire.phase === 'stacked' ? (st.hearth.logs < 2 ? 'one more log' : 'hold the fire on your phone to light it') : fire.phase === 'out' ? 'burned down' : fire.phase === 'snuffed' ? 'lid on' : 'stack the wood from your phone';
  label(line, cx, H * 0.93, Math.max(12, W * 0.014), 'rgba(243,234,217,' + (fire.lit ? 0.35 : 0.55) + ')', 'center');
}
function drawWindow(now) {
  var st = S.state, sky = skyModel(st, now, S.live), t = now / 1000, el = sky.sunEl;
  var day = Math.max(0, Math.min(1, (el + 6) / 18)), dusk = Math.max(0, 1 - Math.abs(el) / 12);
  var top = mix([6, 9, 26], [70, 130, 200], day), low = mix([18, 22, 50], [170, 205, 235], day);
  var grad = g.createLinearGradient(0, 0, 0, H * 0.78);
  grad.addColorStop(0, top); grad.addColorStop(0.75, low); grad.addColorStop(1, mix([40, 30, 50], [255, 170, 110], dusk * 0.9 + 0.1 * day));
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  // stars at night
  if (day < 0.4) { g.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - day / 0.4)) + ')'; for (var i = 0; i < 70; i += 1) { var sx = (Math.sin(i * 91.7) * 0.5 + 0.5) * W, sy = (Math.sin(i * 47.3 + 1) * 0.5 + 0.5) * H * 0.55; g.fillRect(sx, sy, 1.6, 1.6); } }
  // sun, only when it is above the horizon
  if (el > -2) { var sunY = H * 0.74 - (Math.min(el, 60) / 60) * H * 0.6, sunX = W * 0.7; g.fillStyle = 'rgba(255,236,190,' + (0.35 + 0.6 * day) + ')'; g.beginPath(); g.arc(sunX, sunY, W * 0.022, 0, Math.PI * 2); g.fill(); }
  var horizon = H * 0.74, wind = sky.windMph == null ? 0 : sky.windMph, cloud = sky.cloud == null ? 0 : sky.cloud / 100;
  // the layer: a grey deck that thickens and lowers as cloud cover rises
  if (cloud > 0.02) {
    var depth = H * (0.12 + 0.5 * cloud), cg = g.createLinearGradient(0, 0, 0, depth);
    var cc = mix([40, 44, 58], [205, 210, 216], day);
    cg.addColorStop(0, cc.replace('rgb', 'rgba').replace(')', ',' + (0.35 + 0.6 * cloud) + ')')); cg.addColorStop(1, cc.replace('rgb', 'rgba').replace(')', ',0)'));
    g.fillStyle = cg; g.fillRect(0, 0, W, depth);
    g.fillStyle = cc.replace('rgb', 'rgba').replace(')', ',' + (0.18 + 0.3 * cloud) + ')');
    for (var c = 0; c < 9; c += 1) { var px = (((c * 0.137 + t * (0.002 + wind * 0.0009)) % 1.3) - 0.15) * W, py = depth * (0.25 + 0.5 * (Math.sin(c * 12.9) * 0.5 + 0.5)); g.beginPath(); g.ellipse ? g.ellipse(px, py, W * 0.11, H * 0.03, 0, 0, Math.PI * 2) : g.arc(px, py, W * 0.05, 0, Math.PI * 2); g.fill(); }
  }
  // the sea, and how high the water stands on the shore
  var fill = sky.tide ? sky.tide.fill : 0.5, shore = horizon + H * (0.2 - 0.12 * fill);
  g.fillStyle = mix([10, 20, 40], [40, 90, 130], day); g.fillRect(0, horizon, W, shore - horizon + 2);
  g.strokeStyle = 'rgba(255,255,255,' + (0.1 + 0.2 * day) + ')'; g.lineWidth = 1.5;
  for (var r = 0; r < 5; r += 1) { var wy = horizon + (shore - horizon) * ((r + ((t * (0.02 + wind * 0.004)) % 1)) / 5); g.beginPath(); for (var x = 0; x <= W; x += W / 24) g.lineTo(x, wy + Math.sin(x / W * 14 + t * 0.8 + r) * 2.5); g.stroke(); }
  g.fillStyle = mix([28, 24, 22], [196, 176, 140], day); g.fillRect(0, shore, W, H - shore);
  // wind: thin streaks that move faster with more wind; none when wind is not reported
  if (wind > 0) { g.strokeStyle = 'rgba(255,255,255,' + Math.min(0.3, 0.05 + wind / 120) + ')'; g.lineWidth = 1; for (var s = 0; s < 14; s += 1) { var wx = ((s * 0.19 + t * wind * 0.004) % 1.2 - 0.1) * W, wyy = H * (0.2 + 0.5 * (Math.sin(s * 7.7) * 0.5 + 0.5)); g.beginPath(); g.moveTo(wx, wyy); g.lineTo(wx + W * (0.02 + wind / 900), wyy); g.stroke(); } }
  // the window frame
  g.strokeStyle = '#0b0907'; g.lineWidth = Math.max(10, W * 0.022); g.strokeRect(0, 0, W, H);
  g.lineWidth = Math.max(4, W * 0.006); g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.moveTo(0, H * 0.5); g.lineTo(W, H * 0.5); g.stroke();
  // what is known, and where it came from
  var bits = [];
  if (sky.tempF != null) bits.push(Math.round(sky.tempF) + '°F' + (sky.condition ? ' ' + sky.condition : ''));
  if (sky.status !== 'sim' && sky.status !== 'wait') {
    bits.push(sky.windMph != null ? 'wind ' + Math.round(sky.windMph) + ' mph' + (compass(sky.windDir) ? ' from ' + compass(sky.windDir) : '') : 'wind not reported');
    bits.push(sky.cloud != null ? 'cloud ' + Math.round(sky.cloud) + '%' : 'cloud not reported');
    bits.push(sky.tide && sky.tide.heightFt != null ? 'tide about ' + sky.tide.heightFt.toFixed(1) + ' ft, ' + (sky.tide.rising ? 'rising' : 'falling') : 'tide not available');
  } else if (sky.status === 'sim') bits.push('wind ' + sky.windMph + ' mph', 'cloud ' + sky.cloud + '%', 'made-up values set from the phone');
  if (sky.status === 'live' || sky.status === 'part') bits.push('weather: Open-Meteo' + (sky.tide ? ', tide: NOAA ' + sky.place.tideName : '') + ', sun position computed');
  var size = Math.max(12, W * 0.015);
  g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(W * 0.04, H * 0.86, W * 0.92, size * 3.6);
  label(sky.place.name.toUpperCase(), W * 0.055, H * 0.86 + size * 1.5, size, '#f3ead9');
  label(bits.join('  ·  '), W * 0.055, H * 0.86 + size * 2.9, size * 0.85, 'rgba(243,234,217,.75)', 'left', SANS);
  if (sky.status === 'sim') badge(sky.fallback ? 'SIMULATED SKY · live weather could not be read' : 'SIMULATED SKY · not live', 'sim');
  else if (sky.status === 'wait') badge('READING THE SKY…', '');
  else {
    var at = new Date(sky.readAt), hh = at.getHours(), mm = at.getMinutes();
    badge((sky.status === 'live' ? 'LIVE' : 'LIVE IN PART') + ' · read ' + hh + ':' + (mm < 10 ? '0' : '') + mm, 'live');
  }
}
var COLOURS = { amber: [255, 180, 84], rose: [255, 140, 150], gold: [255, 214, 110], moss: [170, 210, 120], sky: [140, 200, 255], lilac: [200, 170, 255] };
function drawLights(now) {
  var st = S.state, t = now / 1000, i;
  var grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#070a1c'); grad.addColorStop(1, '#161226');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.5)'; for (i = 0; i < 50; i += 1) g.fillRect((Math.sin(i * 77.1) * 0.5 + 0.5) * W, (Math.sin(i * 31.9 + 2) * 0.5 + 0.5) * H * 0.4, 1.5, 1.5);
  // the hill
  g.fillStyle = '#0b0d12'; g.beginPath(); g.moveTo(0, H);
  for (var x = 0; x <= W; x += W / 40) g.lineTo(x, H * (0.62 - 0.26 * Math.sin((x / W) * Math.PI) - 0.03 * Math.sin((x / W) * 9)));
  g.lineTo(W, H); g.closePath(); g.fill();
  var n = S.members.length, u = Math.min(W, H * 1.6) / 100;
  for (i = 0; i < n; i += 1) {
    var m = S.members[i], fx = (i + 0.5) / n, wob = Math.sin(i * 5.3) * 0.5;
    var hx = W * (0.1 + 0.8 * fx), hill = H * (0.62 - 0.26 * Math.sin((0.1 + 0.8 * fx) * Math.PI)), hy = hill + H * (0.06 + 0.09 * (wob * 0.5 + 0.5));
    var col = COLOURS[m.colour] || COLOURS.amber, since = m.lit && S.litAt[m.id] ? now - S.litAt[m.id] : m.lit ? 99999 : -1;
    var on = since < 0 ? 0 : Math.min(1, since / 1800), flick = on * (0.9 + 0.1 * Math.sin(t * 3 + i * 2));
    g.fillStyle = '#12151c'; g.fillRect(hx - u * 3.4, hy - u * 3, u * 6.8, u * 7); // the little house
    g.beginPath(); g.moveTo(hx - u * 4, hy - u * 3); g.lineTo(hx, hy - u * 6.4); g.lineTo(hx + u * 4, hy - u * 3); g.closePath(); g.fill();
    if (on > 0) { var gl = g.createRadialGradient(hx, hy, 0, hx, hy, u * (7 + 6 * flick)); gl.addColorStop(0, 'rgba(' + col.join(',') + ',' + 0.4 * flick + ')'); gl.addColorStop(1, 'rgba(' + col.join(',') + ',0)'); g.fillStyle = gl; g.fillRect(hx - u * 14, hy - u * 14, u * 28, u * 28); }
    g.fillStyle = on > 0 ? 'rgba(' + col.join(',') + ',' + (0.35 + 0.65 * flick) + ')' : '#1c2029';
    g.fillRect(hx - u * 1.5, hy - u * 1.3, u * 3, u * 3.2);
    g.strokeStyle = '#0b0d12'; g.lineWidth = Math.max(1, u * 0.25); g.beginPath(); g.moveTo(hx, hy - u * 1.3); g.lineTo(hx, hy + u * 1.9); g.moveTo(hx - u * 1.5, hy + u * 0.3); g.lineTo(hx + u * 1.5, hy + u * 0.3); g.stroke();
    if ((st.lights.names || S.lightsStatus === 'demo') && m.name) label(m.name, hx, hy + u * 7, Math.max(10, u * 1.5), 'rgba(243,234,217,.6)', 'center', SANS);
  }
  var msg = '';
  if (S.lightsStatus === 'demo') badge('DEMO CIRCLE · not real people', 'sim');
  else if (S.lightsStatus === 'live') badge('LIVE · your circle', 'live');
  else if (S.lightsStatus === 'none') msg = 'Paste a circle link on your phone to see its lights here.';
  else if (S.lightsStatus === 'gone') msg = 'No circle at that link.';
  else if (S.lightsStatus === 'down') msg = 'Cannot see the circle right now. Nothing is shown until it can be read.';
  if (msg) label(msg, W / 2, H * 0.3, Math.max(13, W * 0.018), 'rgba(243,234,217,.7)', 'center', SANS);
  if (S.lightsStatus === 'demo') label('The Light Companion service is not on this site yet, so these windows are a demo.', W / 2, H * 0.9, Math.max(11, W * 0.012), 'rgba(243,234,217,.5)', 'center', SANS);
  if (S.lightsStatus === 'live' || S.lightsStatus === 'demo') label('A dark window only means a light is not lit.', W / 2, H * 0.94, Math.max(11, W * 0.012), 'rgba(243,234,217,.4)', 'center', SANS);
}
var PADS = ['kick', 'snare', 'hat', 'tom', 'clap', 'bell'];
function drawDrum(now) {
  g.fillStyle = '#080a12'; g.fillRect(0, 0, W, H);
  var u = Math.min(W, H * 1.6) / 100, size = u * 13, gap = u * 2.5, total = PADS.length * size + (PADS.length - 1) * gap, x0 = (W - total) / 2, y = H * 0.42;
  for (var i = 0; i < PADS.length; i += 1) {
    var heat = 0;
    for (var k = 0; k < S.drumHits.length; k += 1) if (S.drumHits[k].pad === PADS[i]) heat = Math.max(heat, 1 - (now - S.drumHits[k].at) / 500);
    heat = Math.max(0, heat);
    g.fillStyle = mix([20, 24, 36], [255, 180, 84], heat); g.fillRect(x0 + i * (size + gap) - heat * u, y - heat * u, size + heat * 2 * u, size + heat * 2 * u);
    label(PADS[i].toUpperCase(), x0 + i * (size + gap) + size / 2, y + size + u * 4, Math.max(11, u * 1.6), 'rgba(243,234,217,.6)', 'center');
  }
  label('THE ROOM PLAYS TOGETHER', W / 2, H * 0.2, Math.max(13, W * 0.018), '#ffb454', 'center');
  label('Pads are on each paired phone.  ' + (S.drumRoom && S.drumRoom.on ? Math.max(0, S.drumPeople - 1) + ' playing' : 'connecting to the drum room…'), W / 2, H * 0.27, Math.max(12, W * 0.014), 'rgba(243,234,217,.6)', 'center', SANS);
  label('room ' + S.state.drum, W / 2, H * 0.9, Math.max(10, W * 0.011), 'rgba(243,234,217,.3)', 'center');
}

// ── the clock ───────────────────────────────────────────────────────────
var lastFrame = 0, lastSecond = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  if (ts - lastFrame < 30) return; // about 30 frames a second is plenty for a TV
  var dt = Math.min(0.1, (ts - lastFrame) / 1000); lastFrame = ts;
  var now = Date.now(), t = now / 1000;
  // slow drift so nothing sits on the same pixels for hours
  var dx = Math.sin(t / 97) * W * 0.012, dy = Math.cos(t / 131) * H * 0.012;
  els.pair.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
  S.flare = Math.max(0, S.flare - dt * 0.35); S.spark = Math.max(0, S.spark - dt * 0.7); S.smoke = Math.max(0, S.smoke - dt * 0.25);
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  if (!S.state || S.ended || S.state.view === 'off' || !els.pair.hidden) return; // true black: nothing is drawn
  g.save(); g.translate(dx, dy);
  if (S.state.view === 'hearth') drawHearth(now, dt);
  else if (S.state.view === 'window') drawWindow(now);
  else if (S.state.view === 'lights') drawLights(now);
  else if (S.state.view === 'drum') drawDrum(now);
  g.restore();
}
function second() {
  var now = Date.now();
  if (!S.state || S.ended) return;
  var events = tick(S.state, now);
  if (events.indexOf('burned-out') >= 0) { blip('bell'); S.smoke = 0.6; save(); queueSend(); }
  // phones that went quiet
  var dropped = false;
  for (var pid in S.phones) if (Object.prototype.hasOwnProperty.call(S.phones, pid) && now - S.phones[pid] > PHONE_STALE_MS) { delete S.phones[pid]; dropped = true; }
  if (dropped) { showPairing(); queueSend(); }
  // the code runs out; with no phone, ask for another, for two hours at most
  if (S.code && now >= S.codeExpiresAt) { S.code = ''; showPairing(); queueSend(); }
  // With no phone, keep a code up: at once before the first pairing, and two minutes after the last
  // phone went quiet. Twelve codes (two hours) at most, then stop asking the server.
  if (!S.code && !S.opening && now >= S.nextOpenAt && phoneCount() === 0 && (!S.everPaired || now - S.lastPhoneAt > 120000)) {
    if (S.renewals < MAX_UNPAIRED_RENEWALS) { S.renewals += 1; S.chip = true; openCode(); }
    else if (!S.everPaired) els.note.textContent = 'Reload this page for a new code.';
  }
  els.dim.className = shouldDim(S.state, now) ? 'dim on' : 'dim';
  // an hour with no phone and no fire: go dark and stop asking the server; a press on the TV starts it again
  if (phoneCount() === 0 && roomIsIdle(S.state, S.lastPhoneAt, now)) { endSession(false, true); return; }
  skyRefresh(now); lightsRefresh(now); audioBeds(now); audioSync();
  // keepalive frames only while a phone is listening, so the relay can sleep when nobody is
  if (phoneCount() > 0 && now - S.lastSent > 4000) queueSend();
}
setInterval(second, 1000);
requestAnimationFrame(frame);
addEventListener('pagehide', function () { if (S.party) S.party.send({ t: 'tv-away' }); });

// for the two-screen check in scripts/e2e-house-channel.mjs
window.__house = { S: S, A: A, fire: function () { return S.state ? hearthAt(S.state, Date.now()) : null; } };
start();
